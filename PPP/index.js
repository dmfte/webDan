(() => {
    "use strict";

    // ------------------------------------------------------------------
    // Constantes
    // ------------------------------------------------------------------
    const PT = 72; // puntos PDF por pulgada
    const PAGE_SIZES = {
        letter: { w: 8.5 * PT, h: 11 * PT },
        officio: { w: 8.5 * PT, h: 13 * PT }
    };
    const THUMB_MAX = 384;      // lado mayor de las miniaturas, en px
    const SCALE_MIN = 0.25;
    const SCALE_MAX = 1;
    const SCALE_STEP = 0.05;
    // Tamaño en pantalla del botón de giro (px CSS), igual en escritorio y móvil.
    // Variables separadas para calibrarlo a mano fácilmente.
    const ROTATE_BTN_WIDTH = 50;
    const ROTATE_BTN_HEIGHT = 50;
    const SVG_NS = "http://www.w3.org/2000/svg";

    // ------------------------------------------------------------------
    // Estado
    // ------------------------------------------------------------------
    const state = {
        files: [],              // { id, file, name, width, height, exifRotation, thumbUrl }
        overrides: new Map(),   // id -> { rotation: 0|90|180|270, scale: 0.25..1 }
        settings: {
            pageSize: "letter",
            margins: { top: 0.2, right: 0.2, bottom: 0.2, left: 0.2 },
            photosPerPage: 4,
            gap: 0.15,
            pagesPerScroll: 2
        },
        selectedId: null,
        viewStart: 0,           // índice de la primera página del grupo visible
        placements: new Map()   // id -> { cell, entry } (reconstruido en cada render)
    };

    // ------------------------------------------------------------------
    // Referencias DOM
    // ------------------------------------------------------------------
    const $ = (sel) => document.querySelector(sel);
    const el = {
        settingsToggle: $("#settingsToggle"),
        fileInput: $("#photoFiles"),
        dropZone: $(".drop-zone"),
        tray: $(".photo-tray"),
        pageSize: $("#pageSize"),
        marginAll: $("#marginAll"),
        marginTop: $("#marginTop"),
        marginRight: $("#marginRight"),
        marginBottom: $("#marginBottom"),
        marginLeft: $("#marginLeft"),
        photosPerPage: $("#photosPerPage"),
        photoGap: $("#photoGap"),
        previewPagesPerScroll: $("#previewPagesPerScroll"),
        prevPages: $("#prevPages"),
        nextPages: $("#nextPages"),
        pageStrip: $(".page-strip"),
        exportPdf: $("#exportPdf"),
        toolbar: $("#photoToolbar"),
        scaleDown: $("#scaleDown"),
        scaleUp: $("#scaleUp"),
        scaleLabel: $("#scaleLabel"),
        resetPhoto: $("#resetPhoto"),
        deselectPhoto: $("#deselectPhoto"),
        rotateAllHorizontal: $("#rotateAllHorizontal"),
        rotateAllVertical: $("#rotateAllVertical"),
        rotateAllReset: $("#rotateAllReset")
    };

    // ------------------------------------------------------------------
    // Ingesta de archivos y miniaturas
    // ------------------------------------------------------------------
    let idCounter = 0;

    async function addFiles(fileList) {
        const images = Array.from(fileList).filter((f) => f.type.startsWith("image/"));
        if (!images.length) return;
        el.dropZone.classList.add("is-loading");
        for (const file of images) {
            try {
                const entry = await createEntry(file);
                state.files.push(entry);
                renderTray();
                renderPages();
            } catch (err) {
                console.warn("No se pudo cargar la imagen:", file.name, err);
            }
        }
        el.dropZone.classList.remove("is-loading");
    }

    async function createEntry(file) {
        const exifRotation = file.type === "image/jpeg" ? await readExifRotation(file) : 0;
        let bmp;
        try {
            bmp = await createImageBitmap(file, { imageOrientation: "from-image" });
        } catch {
            bmp = await createImageBitmap(file);
        }
        const width = bmp.width;
        const height = bmp.height;
        const scale = Math.min(1, THUMB_MAX / Math.max(width, height));
        const canvas = document.createElement("canvas");
        canvas.width = Math.max(1, Math.round(width * scale));
        canvas.height = Math.max(1, Math.round(height * scale));
        canvas.getContext("2d").drawImage(bmp, 0, 0, canvas.width, canvas.height);
        bmp.close();
        const blob = await new Promise((resolve, reject) => {
            canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("toBlob"))), "image/jpeg", 0.82);
        });
        idCounter += 1;
        return {
            id: `photo-${Date.now().toString(36)}-${idCounter}`,
            file,
            name: file.name,
            width,
            height,
            exifRotation,
            thumbUrl: URL.createObjectURL(blob)
        };
    }

    // Lee la etiqueta de orientación EXIF de un JPEG (solo la parte de rotación;
    // los valores con espejo 2/4/5/7 se aproximan con su rotación equivalente).
    async function readExifRotation(file) {
        try {
            const buf = await file.slice(0, 128 * 1024).arrayBuffer();
            const view = new DataView(buf);
            if (view.byteLength < 4 || view.getUint16(0) !== 0xffd8) return 0;
            let offset = 2;
            while (offset + 4 <= view.byteLength) {
                const marker = view.getUint16(offset);
                if ((marker & 0xff00) !== 0xff00) break;
                const size = view.getUint16(offset + 2);
                if (marker === 0xffe1 && offset + 10 <= view.byteLength &&
                    view.getUint32(offset + 4) === 0x45786966) { // "Exif"
                    const tiff = offset + 10;
                    const little = view.getUint16(tiff) === 0x4949;
                    const ifd = tiff + view.getUint32(tiff + 4, little);
                    const count = view.getUint16(ifd, little);
                    for (let i = 0; i < count; i++) {
                        const entry = ifd + 2 + i * 12;
                        if (entry + 12 > view.byteLength) break;
                        if (view.getUint16(entry, little) === 0x0112) {
                            const o = view.getUint16(entry + 8, little);
                            return { 3: 180, 6: 90, 8: 270, 4: 180, 5: 90, 7: 270 }[o] || 0;
                        }
                    }
                    return 0;
                }
                offset += 2 + size;
            }
        } catch { /* sin EXIF legible */ }
        return 0;
    }

    function removeFile(id) {
        const index = state.files.findIndex((f) => f.id === id);
        if (index === -1) return;
        URL.revokeObjectURL(state.files[index].thumbUrl);
        state.files.splice(index, 1);
        state.overrides.delete(id);
        if (state.selectedId === id) deselect();
        renderTray();
        renderPages();
    }

    // ------------------------------------------------------------------
    // Bandeja de fotos seleccionadas
    // ------------------------------------------------------------------
    function renderTray() {
        el.tray.innerHTML = "";
        if (!state.files.length) {
            const p = document.createElement("p");
            p.textContent = "Aún no has seleccionado fotos.";
            el.tray.appendChild(p);
            updateExportState();
            return;
        }
        const count = document.createElement("p");
        count.className = "tray-count";
        count.textContent = state.files.length === 1
            ? "1 foto seleccionada"
            : `${state.files.length} fotos seleccionadas`;
        el.tray.appendChild(count);

        const grid = document.createElement("div");
        grid.className = "tray-grid";
        for (const entry of state.files) {
            const item = document.createElement("div");
            item.className = "tray-item";
            item.draggable = true;
            item.dataset.photoId = entry.id;
            item.title = entry.name;

            const img = document.createElement("img");
            img.src = entry.thumbUrl;
            img.alt = entry.name;
            img.draggable = false;

            const remove = document.createElement("button");
            remove.type = "button";
            remove.className = "tray-remove";
            remove.setAttribute("aria-label", `Quitar ${entry.name}`);
            remove.textContent = "×";
            remove.addEventListener("click", (e) => {
                e.stopPropagation();
                removeFile(entry.id);
            });

            item.appendChild(img);
            item.appendChild(remove);
            grid.appendChild(item);
        }
        el.tray.appendChild(grid);
        updateExportState();
    }

    // Reordenar arrastrando dentro de la bandeja
    let dragId = null;

    el.tray.addEventListener("dragstart", (e) => {
        const item = e.target.closest(".tray-item");
        if (!item) return;
        dragId = item.dataset.photoId;
        item.classList.add("is-dragging");
        e.dataTransfer.effectAllowed = "move";
        e.dataTransfer.setData("text/plain", dragId);
    });

    el.tray.addEventListener("dragend", (e) => {
        const item = e.target.closest(".tray-item");
        if (item) item.classList.remove("is-dragging");
        dragId = null;
    });

    el.tray.addEventListener("dragover", (e) => {
        if (!dragId) return;
        const target = e.target.closest(".tray-item");
        if (!target || target.dataset.photoId === dragId) return;
        e.preventDefault();
        e.dataTransfer.dropEffect = "move";
        target.classList.add("is-drop-target");
    });

    el.tray.addEventListener("dragleave", (e) => {
        const target = e.target.closest(".tray-item");
        if (target) target.classList.remove("is-drop-target");
    });

    el.tray.addEventListener("drop", (e) => {
        if (!dragId) return;
        const target = e.target.closest(".tray-item");
        if (!target || target.dataset.photoId === dragId) return;
        e.preventDefault();
        const from = state.files.findIndex((f) => f.id === dragId);
        const to = state.files.findIndex((f) => f.id === target.dataset.photoId);
        if (from === -1 || to === -1) return;
        const [moved] = state.files.splice(from, 1);
        state.files.splice(to, 0, moved);
        renderTray();
        renderPages();
    });

    // ------------------------------------------------------------------
    // Geometría (todo en puntos PDF, origen arriba-izquierda, y hacia abajo)
    // ------------------------------------------------------------------
    function getMetrics() {
        const s = state.settings;
        const page = PAGE_SIZES[s.pageSize];
        const m = {
            top: s.margins.top * PT,
            right: s.margins.right * PT,
            bottom: s.margins.bottom * PT,
            left: s.margins.left * PT
        };
        const usableW = page.w - m.left - m.right;
        const usableH = page.h - m.top - m.bottom;
        const gap = s.gap * PT;
        const n = s.photosPerPage;

        let grid = null;
        if (usableW > 0 && usableH > 0) {
            for (let cols = 1; cols <= n; cols++) {
                const rows = Math.ceil(n / cols);
                const cw = (usableW - (cols - 1) * gap) / cols;
                const ch = (usableH - (rows - 1) * gap) / rows;
                if (cw <= 0 || ch <= 0) continue;
                const score = Math.abs(Math.log(cw / ch));
                if (!grid || score < grid.score) grid = { cols, rows, cw, ch, score };
            }
        }
        return { page, m, usableW, usableH, gap, n, grid };
    }

    function computeCells(metrics) {
        const { m, gap, n, grid } = metrics;
        const cells = [];
        for (let i = 0; i < n; i++) {
            const col = i % grid.cols;
            const row = Math.floor(i / grid.cols);
            cells.push({
                x: m.left + col * (grid.cw + gap),
                y: m.top + row * (grid.ch + gap),
                w: grid.cw,
                h: grid.ch
            });
        }
        return cells;
    }

    // LA única función de encaje: ajuste "contain" dentro de la celda con
    // rotación (intercambia el aspecto en 90/270) y escala, siempre centrada.
    function placePhoto(cell, imgW, imgH, ov = {}) {
        const rot = ov.rotation ?? 0;
        const scale = ov.scale ?? 1;
        const odd = rot % 180 !== 0;
        const s = Math.min(
            cell.w / (odd ? imgH : imgW),
            cell.h / (odd ? imgW : imgH)
        ) * scale;
        return {
            w: imgW * s,
            h: imgH * s,
            cx: cell.x + cell.w / 2,
            cy: cell.y + cell.h / 2,
            rot
        };
    }

    function chunkPages() {
        const n = state.settings.photosPerPage;
        const pages = [];
        for (let i = 0; i < state.files.length; i += n) {
            pages.push(state.files.slice(i, i + n));
        }
        return pages;
    }

    // ------------------------------------------------------------------
    // Vista previa (SVG por página, viewBox en puntos PDF)
    // ------------------------------------------------------------------
    function renderPages() {
        state.placements.clear();
        el.pageStrip.innerHTML = "";

        if (!state.files.length) {
            const empty = document.createElement("div");
            empty.className = "strip-empty";
            empty.innerHTML = "<strong>Sin páginas todavía</strong><span>Agrega fotos para ver la vista previa de tus páginas.</span>";
            el.pageStrip.appendChild(empty);
            deselect();
            updateView();
            return;
        }

        const metrics = getMetrics();
        if (!metrics.grid) {
            const bad = document.createElement("div");
            bad.className = "strip-empty";
            bad.innerHTML = "<strong>No hay espacio para las fotos</strong><span>Los márgenes o la separación no dejan área imprimible. Reduce sus valores.</span>";
            el.pageStrip.appendChild(bad);
            deselect();
            updateView();
            return;
        }

        const cells = computeCells(metrics);
        const pages = chunkPages();
        const { page, m } = metrics;

        pages.forEach((photos, pageIndex) => {
            const sheet = document.createElement("article");
            sheet.className = "paper-sheet";
            sheet.style.aspectRatio = `${page.w} / ${page.h}`;
            sheet.setAttribute("aria-label", `Vista previa de página ${pageIndex + 1}`);

            const label = document.createElement("div");
            label.className = "page-label";
            label.textContent = `Página ${pageIndex + 1}`;
            sheet.appendChild(label);

            const svg = document.createElementNS(SVG_NS, "svg");
            svg.setAttribute("viewBox", `0 0 ${page.w} ${page.h}`);
            svg.setAttribute("preserveAspectRatio", "xMidYMid meet");

            const printable = document.createElementNS(SVG_NS, "rect");
            printable.setAttribute("class", "printable-rect");
            printable.setAttribute("x", m.left);
            printable.setAttribute("y", m.top);
            printable.setAttribute("width", Math.max(0, metrics.usableW));
            printable.setAttribute("height", Math.max(0, metrics.usableH));
            svg.appendChild(printable);

            photos.forEach((entry, slot) => {
                const cell = cells[slot];
                state.placements.set(entry.id, { cell, entry });
                const image = document.createElementNS(SVG_NS, "image");
                image.setAttribute("href", entry.thumbUrl);
                image.setAttribute("preserveAspectRatio", "none");
                image.setAttribute("data-photo-id", entry.id);
                image.setAttribute("class", "page-photo");
                applyPlacement(image, cell, entry);
                image.addEventListener("click", (e) => {
                    e.stopPropagation();
                    select(entry.id);
                });
                svg.appendChild(image);
            });

            sheet.appendChild(svg);
            el.pageStrip.appendChild(sheet);
        });

        // Restaurar la selección si la foto sigue en pantalla
        if (state.selectedId) {
            if (state.placements.has(state.selectedId)) {
                select(state.selectedId);
            } else {
                deselect();
            }
        }
        updateView();
    }

    function applyPlacement(image, cell, entry) {
        const ov = state.overrides.get(entry.id);
        const p = placePhoto(cell, entry.width, entry.height, ov);
        image.setAttribute("x", p.cx - p.w / 2);
        image.setAttribute("y", p.cy - p.h / 2);
        image.setAttribute("width", p.w);
        image.setAttribute("height", p.h);
        if (p.rot) {
            image.setAttribute("transform", `rotate(${p.rot} ${p.cx} ${p.cy})`);
        } else {
            image.removeAttribute("transform");
        }
    }

    function updatePhotoEl(id) {
        const placement = state.placements.get(id);
        const image = el.pageStrip.querySelector(`[data-photo-id="${id}"]`);
        if (!placement || !image) return;
        applyPlacement(image, placement.cell, placement.entry);
    }

    // ------------------------------------------------------------------
    // Selección y barra de edición por foto
    // ------------------------------------------------------------------
    function select(id) {
        state.selectedId = id;
        clearSelectionRect();
        const placement = state.placements.get(id);
        if (!placement) { deselect(); return; }
        const image = el.pageStrip.querySelector(`[data-photo-id="${id}"]`);
        if (!image) { deselect(); return; }
        const { cell } = placement;
        const rect = document.createElementNS(SVG_NS, "rect");
        rect.setAttribute("class", "selection-rect");
        rect.setAttribute("x", cell.x);
        rect.setAttribute("y", cell.y);
        rect.setAttribute("width", cell.w);
        rect.setAttribute("height", cell.h);
        rect.setAttribute("pointer-events", "none");
        image.ownerSVGElement.appendChild(rect);
        image.ownerSVGElement.appendChild(buildRotateOverlay(cell, image.ownerSVGElement));
        el.toolbar.hidden = false;
        updateToolbar();
    }

    // Botón único de giro horario, centrado sobre la foto seleccionada.
    // Mide ROTATE_BTN_WIDTH × ROTATE_BTN_HEIGHT px en pantalla: se convierte
    // de px CSS a unidades del viewBox según el tamaño renderizado del SVG.
    function buildRotateOverlay(cell, svg) {
        const cx = cell.x + cell.w / 2;
        const cy = cell.y + cell.h / 2;
        const rendered = svg.getBoundingClientRect();
        const unitsPerPx = rendered.width > 0
            ? svg.viewBox.baseVal.width / rendered.width
            : 1;
        const rx = (ROTATE_BTN_WIDTH / 2) * unitsPerPx;
        const ry = (ROTATE_BTN_HEIGHT / 2) * unitsPerPx;
        const g = document.createElementNS(SVG_NS, "g");
        g.setAttribute("class", "rotate-overlay");
        g.setAttribute("role", "button");
        g.setAttribute("aria-label", "Girar a la derecha");

        const ellipse = document.createElementNS(SVG_NS, "ellipse");
        ellipse.setAttribute("cx", cx);
        ellipse.setAttribute("cy", cy);
        ellipse.setAttribute("rx", rx);
        ellipse.setAttribute("ry", ry);

        const glyph = document.createElementNS(SVG_NS, "text");
        glyph.setAttribute("x", cx);
        glyph.setAttribute("y", cy);
        glyph.setAttribute("text-anchor", "middle");
        glyph.setAttribute("dominant-baseline", "central");
        glyph.setAttribute("font-size", Math.min(rx, ry) * 1.2);
        glyph.textContent = "⟳";

        g.appendChild(ellipse);
        g.appendChild(glyph);
        g.addEventListener("click", (e) => {
            e.stopPropagation();
            rotateSelected();
        });
        return g;
    }

    function rotateSelected() {
        if (!state.selectedId) return;
        const ov = getOverride(state.selectedId);
        setOverride(state.selectedId, { ...ov, rotation: (ov.rotation + 90) % 360 });
    }

    // entry.width/height ya vienen orientadas correctamente (el bitmap se
    // crea con imageOrientation "from-image"), así que comparar ambos lados
    // basta para saber si la foto es apaisada o vertical antes de aplicar
    // el override de rotación del usuario.
    function orientationRotation(entry, mode) {
        if (mode === "reset") return 0;
        const isLandscape = entry.width >= entry.height;
        if (mode === "horizontal") return isLandscape ? 0 : 90;
        return isLandscape ? 90 : 0;
    }

    // Rota todas las fotos a la misma orientación (o las devuelve a su
    // posición original) conservando la escala que cada una ya tenía.
    function rotateAll(mode) {
        if (!state.files.length) return;
        for (const entry of state.files) {
            const ov = getOverride(entry.id);
            setOverride(entry.id, { ...ov, rotation: orientationRotation(entry, mode) });
        }
    }

    el.rotateAllHorizontal.addEventListener("click", () => rotateAll("horizontal"));
    el.rotateAllVertical.addEventListener("click", () => rotateAll("vertical"));
    el.rotateAllReset.addEventListener("click", () => rotateAll("reset"));

    function deselect() {
        state.selectedId = null;
        clearSelectionRect();
        el.toolbar.hidden = true;
    }

    function clearSelectionRect() {
        el.pageStrip.querySelectorAll(".selection-rect, .rotate-overlay").forEach((r) => r.remove());
    }

    function getOverride(id) {
        return state.overrides.get(id) ?? { rotation: 0, scale: 1 };
    }

    function setOverride(id, ov) {
        // Sin desviación de los valores por defecto → entrada innecesaria
        if ((ov.rotation ?? 0) === 0 && Math.abs((ov.scale ?? 1) - 1) < 0.001) {
            state.overrides.delete(id);
        } else {
            state.overrides.set(id, ov);
        }
        updatePhotoEl(id);
        updateToolbar();
    }

    function updateToolbar() {
        if (!state.selectedId) return;
        const ov = getOverride(state.selectedId);
        el.scaleLabel.textContent = `${Math.round(ov.scale * 100)}%`;
        el.scaleUp.disabled = ov.scale >= SCALE_MAX - 0.001;
        el.scaleDown.disabled = ov.scale <= SCALE_MIN + 0.001;
    }

    el.scaleDown.addEventListener("click", () => {
        if (!state.selectedId) return;
        const ov = getOverride(state.selectedId);
        const scale = Math.max(SCALE_MIN, Math.round((ov.scale - SCALE_STEP) * 100) / 100);
        setOverride(state.selectedId, { ...ov, scale });
    });

    el.scaleUp.addEventListener("click", () => {
        if (!state.selectedId) return;
        const ov = getOverride(state.selectedId);
        const scale = Math.min(SCALE_MAX, Math.round((ov.scale + SCALE_STEP) * 100) / 100);
        setOverride(state.selectedId, { ...ov, scale });
    });

    el.resetPhoto.addEventListener("click", () => {
        if (!state.selectedId) return;
        setOverride(state.selectedId, { rotation: 0, scale: 1 });
    });

    el.deselectPhoto.addEventListener("click", deselect);

    el.pageStrip.addEventListener("click", (e) => {
        if (!e.target.closest("image")) deselect();
    });

    document.addEventListener("keydown", (e) => {
        if (e.key !== "Escape") return;
        if (el.settingsToggle.checked) {
            el.settingsToggle.checked = false;
            return;
        }
        deselect();
    });

    // Cierra el panel de configuración (móvil) al hacer clic fuera de él.
    // El panel sigue siendo CSS-only; aquí solo se desmarca el checkbox.
    document.addEventListener("click", (e) => {
        if (!el.settingsToggle.checked) return;
        if (e.target.closest(".controls-panel") ||
            e.target.closest(".panel-open") ||
            e.target === el.settingsToggle) return;
        el.settingsToggle.checked = false;
    });

    // ------------------------------------------------------------------
    // Navegación de la vista previa
    // ------------------------------------------------------------------
    function setPagesPerScroll(value) {
        const k = Math.min(4, Math.max(1, parseInt(value, 10) || 2));
        state.settings.pagesPerScroll = k;
        el.previewPagesPerScroll.value = String(k);
        updateView();
    }

    // Muestra solo el grupo de páginas actual y dimensiona cada hoja para
    // que el grupo completo quepa en el área visible, sin desplazamiento.
    function updateView() {
        const sheets = el.pageStrip.querySelectorAll(".paper-sheet");
        const total = sheets.length;
        const k = state.settings.pagesPerScroll;
        state.viewStart = Math.max(0, Math.min(state.viewStart, total - k));

        if (total) {
            // En móvil, los grupos de 3 y 4 páginas se acomodan en una
            // cuadrícula de 2 x 2 en lugar de una sola fila.
            const isMobile = window.matchMedia("(max-width: 820px)").matches;
            const cols = isMobile && k >= 3 ? 2 : k;
            const rows = Math.ceil(k / cols);

            const styles = getComputedStyle(el.pageStrip);
            const gap = parseFloat(styles.columnGap) || 0;
            const padX = parseFloat(styles.paddingLeft) + parseFloat(styles.paddingRight);
            const padY = parseFloat(styles.paddingTop) + parseFloat(styles.paddingBottom);
            const availW = (el.pageStrip.clientWidth - padX - (cols - 1) * gap) / cols;
            // 18px extra por fila para la etiqueta "Página N" que sobresale
            const availH = (el.pageStrip.clientHeight - padY - (rows - 1) * gap - rows * 18) / rows;
            const page = PAGE_SIZES[state.settings.pageSize];
            const width = Math.max(100, Math.floor(Math.min(availW, availH * (page.w / page.h))));

            sheets.forEach((sheet, i) => {
                const visible = i >= state.viewStart && i < state.viewStart + k;
                sheet.classList.toggle("is-offscreen", !visible);
                sheet.style.width = `${width}px`;
            });
        }
        updateNavButtons(total);
        // Reconstruir el resaltado y el botón de giro con el nuevo tamaño
        // renderizado, para que el botón conserve su tamaño fijo en px.
        if (state.selectedId) select(state.selectedId);
    }

    function updateNavButtons(total) {
        el.prevPages.disabled = state.viewStart <= 0;
        el.nextPages.disabled = state.viewStart + state.settings.pagesPerScroll >= total;
    }

    el.prevPages.addEventListener("click", () => {
        state.viewStart -= state.settings.pagesPerScroll;
        updateView();
    });
    el.nextPages.addEventListener("click", () => {
        state.viewStart += state.settings.pagesPerScroll;
        updateView();
    });
    window.addEventListener("resize", updateView);

    el.previewPagesPerScroll.addEventListener("change", () => setPagesPerScroll(el.previewPagesPerScroll.value));

    // ------------------------------------------------------------------
    // Ajustes de página
    // ------------------------------------------------------------------
    function readNumber(input, { min = 0, integer = false, fallback }) {
        let value = integer ? parseInt(input.value, 10) : parseFloat(input.value);
        if (!Number.isFinite(value) || value < min) value = fallback;
        if (integer) value = Math.round(value);
        input.value = String(value);
        return value;
    }

    // Lectura tolerante para vista previa en vivo (evento "input"): nunca
    // reescribe el campo que el usuario está escribiendo, para no pisar
    // un "0." a medio teclear. Si el valor aún no es válido, conserva el
    // último margen válido hasta que el campo pierda el foco ("change").
    function readNumberLive(input, fallback) {
        const value = parseFloat(input.value);
        return Number.isFinite(value) && value >= 0 ? value : fallback;
    }

    // Reconstruir todas las páginas en cada pulsación de tecla es barato
    // con pocas fotos, pero con lotes grandes (cientos de fotos → muchas
    // páginas) puede notarse. Este debounce corto (imperceptible al ojo)
    // agrupa ráfagas de teclas o clics mantenidos en las flechas del campo
    // numérico en un solo renderizado.
    function debounce(fn, delay) {
        let handle = null;
        return (...args) => {
            clearTimeout(handle);
            handle = setTimeout(() => fn(...args), delay);
        };
    }
    const renderPagesLive = debounce(renderPages, 60);

    function onSettingsChange() {
        const s = state.settings;
        s.pageSize = PAGE_SIZES[el.pageSize.value] ? el.pageSize.value : "letter";
        s.margins.top = readNumber(el.marginTop, { fallback: s.margins.top });
        s.margins.right = readNumber(el.marginRight, { fallback: s.margins.right });
        s.margins.bottom = readNumber(el.marginBottom, { fallback: s.margins.bottom });
        s.margins.left = readNumber(el.marginLeft, { fallback: s.margins.left });
        s.photosPerPage = readNumber(el.photosPerPage, { min: 1, integer: true, fallback: s.photosPerPage });
        s.gap = readNumber(el.photoGap, { fallback: s.gap });
        syncMarginAllInput();
        renderPages();
    }

    // El campo "los 4 lados" es solo un atajo: no se guarda en el estado,
    // sino que escribe el mismo valor en los cuatro campos individuales
    // (única fuente de verdad) y deja que onSettingsChange los relea.
    function syncMarginAllInput() {
        const { top, right, bottom, left } = state.settings.margins;
        if (top === right && right === bottom && bottom === left) {
            el.marginAll.value = String(top);
        } else {
            el.marginAll.value = "";
        }
    }

    el.marginAll.addEventListener("change", () => {
        const value = readNumber(el.marginAll, { fallback: state.settings.margins.top });
        el.marginTop.value = String(value);
        el.marginRight.value = String(value);
        el.marginBottom.value = String(value);
        el.marginLeft.value = String(value);
        onSettingsChange();
    });

    // Vista previa en vivo: igual que el listener "change" de arriba, pero
    // sin tocar el valor de marginAll (el usuario sigue escribiendo ahí).
    el.marginAll.addEventListener("input", () => {
        const value = readNumberLive(el.marginAll, state.settings.margins.top);
        el.marginTop.value = String(value);
        el.marginRight.value = String(value);
        el.marginBottom.value = String(value);
        el.marginLeft.value = String(value);
        state.settings.margins = { top: value, right: value, bottom: value, left: value };
        renderPagesLive();
    });

    [["top", el.marginTop], ["right", el.marginRight], ["bottom", el.marginBottom], ["left", el.marginLeft]]
        .forEach(([side, input]) => {
            input.addEventListener("input", () => {
                state.settings.margins[side] = readNumberLive(input, state.settings.margins[side]);
                syncMarginAllInput();
                renderPagesLive();
            });
        });

    [el.pageSize, el.marginTop, el.marginRight, el.marginBottom, el.marginLeft,
     el.photosPerPage, el.photoGap].forEach((input) => {
        input.addEventListener("change", onSettingsChange);
    });

    // ------------------------------------------------------------------
    // Entrada de archivos (input + arrastrar y soltar)
    // ------------------------------------------------------------------
    el.fileInput.addEventListener("change", () => {
        addFiles(el.fileInput.files);
        el.fileInput.value = "";
    });

    ["dragenter", "dragover"].forEach((type) => {
        el.dropZone.addEventListener(type, (e) => {
            e.preventDefault();
            el.dropZone.classList.add("is-dragover");
        });
    });

    ["dragleave", "drop"].forEach((type) => {
        el.dropZone.addEventListener(type, (e) => {
            e.preventDefault();
            el.dropZone.classList.remove("is-dragover");
        });
    });

    el.dropZone.addEventListener("drop", (e) => {
        if (e.dataTransfer?.files?.length) addFiles(e.dataTransfer.files);
    });

    // ------------------------------------------------------------------
    // Exportar PDF (misma geometría, imágenes a resolución completa)
    // ------------------------------------------------------------------
    function updateExportState() {
        el.exportPdf.disabled = !state.files.length;
        el.exportPdf.title = state.files.length ? "" : "Agrega fotos para exportar";
        const noPhotos = !state.files.length;
        el.rotateAllHorizontal.disabled = noPhotos;
        el.rotateAllVertical.disabled = noPhotos;
        el.rotateAllReset.disabled = noPhotos;
    }

    async function embedEntry(pdfDoc, entry, cache) {
        if (cache.has(entry.id)) return cache.get(entry.id);
        let embedded;
        let orientationBaked = false;
        if (entry.file.type === "image/jpeg") {
            embedded = await pdfDoc.embedJpg(await entry.file.arrayBuffer());
        } else if (entry.file.type === "image/png") {
            embedded = await pdfDoc.embedPng(await entry.file.arrayBuffer());
        } else {
            // Formato no soportado por pdf-lib (WebP, AVIF…): transcodificar a JPEG.
            // La orientación queda horneada en el lienzo.
            let bmp;
            try {
                bmp = await createImageBitmap(entry.file, { imageOrientation: "from-image" });
            } catch {
                bmp = await createImageBitmap(entry.file);
            }
            const canvas = document.createElement("canvas");
            canvas.width = bmp.width;
            canvas.height = bmp.height;
            canvas.getContext("2d").drawImage(bmp, 0, 0);
            bmp.close();
            const blob = await new Promise((resolve, reject) => {
                canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("toBlob"))), "image/jpeg", 0.92);
            });
            embedded = await pdfDoc.embedJpg(await blob.arrayBuffer());
            orientationBaked = true;
        }
        const result = { embedded, orientationBaked };
        cache.set(entry.id, result);
        return result;
    }

    function drawPhoto(page, embedded, orientationBaked, metrics, cell, entry) {
        const ov = state.overrides.get(entry.id);
        const p = placePhoto(cell, entry.width, entry.height, ov);

        // pdf-lib ignora la orientación EXIF de los JPEG, así que la rotación
        // EXIF se suma aquí. Los tamaños calculados (p.w × p.h) corresponden a
        // la imagen ya orientada; si EXIF gira 90/270, la caja "cruda" que se
        // dibuja lleva los lados intercambiados.
        const exif = orientationBaked ? 0 : entry.exifRotation;
        const totalRot = (p.rot + exif) % 360;
        const w = exif % 180 !== 0 ? p.h : p.w;
        const h = exif % 180 !== 0 ? p.w : p.h;

        // Cambio de sistema: y de PDF crece hacia arriba; la rotación visual
        // horaria se vuelve ángulo negativo. pdf-lib rota alrededor de la
        // esquina inferior izquierda, así que se resuelve la (x, y) que deja
        // el centro de la imagen en el centro de la celda.
        const cx = p.cx;
        const cy = metrics.page.h - p.cy;
        const theta = (-totalRot * Math.PI) / 180;
        const x = cx - (w / 2) * Math.cos(theta) + (h / 2) * Math.sin(theta);
        const y = cy - (w / 2) * Math.sin(theta) - (h / 2) * Math.cos(theta);

        page.drawImage(embedded, {
            x, y,
            width: w,
            height: h,
            rotate: PDFLib.degrees(-totalRot)
        });
    }

    async function exportPdf() {
        if (!state.files.length) return;
        const metrics = getMetrics();
        if (!metrics.grid) {
            flashExportButton("Revisa los márgenes");
            return;
        }
        const originalText = el.exportPdf.textContent;
        el.exportPdf.disabled = true;
        el.exportPdf.textContent = "Exportando…";
        try {
            const pdfDoc = await PDFLib.PDFDocument.create();
            const cells = computeCells(metrics);
            const cache = new Map();
            for (const photos of chunkPages()) {
                const page = pdfDoc.addPage([metrics.page.w, metrics.page.h]);
                for (let slot = 0; slot < photos.length; slot++) {
                    const entry = photos[slot];
                    const { embedded, orientationBaked } = await embedEntry(pdfDoc, entry, cache);
                    drawPhoto(page, embedded, orientationBaked, metrics, cells[slot], entry);
                }
            }
            const bytes = await pdfDoc.save();
            const url = URL.createObjectURL(new Blob([bytes], { type: "application/pdf" }));
            const a = document.createElement("a");
            a.href = url;
            a.download = "photos-per-page.pdf";
            a.click();
            setTimeout(() => URL.revokeObjectURL(url), 10000);
            el.exportPdf.textContent = originalText;
        } catch (err) {
            console.error("Error al exportar el PDF:", err);
            flashExportButton("Error al exportar");
        } finally {
            el.exportPdf.disabled = !state.files.length;
            if (el.exportPdf.textContent === "Exportando…") {
                el.exportPdf.textContent = originalText;
            }
        }
    }

    function flashExportButton(message) {
        const originalText = "Exportar PDF";
        el.exportPdf.textContent = message;
        setTimeout(() => {
            el.exportPdf.textContent = originalText;
            updateExportState();
        }, 2200);
    }

    el.exportPdf.addEventListener("click", exportPdf);

    // ------------------------------------------------------------------
    // Arranque
    // ------------------------------------------------------------------
    // Los valores por defecto viven solo en state.settings; el marcado
    // no define value/selected y aquí se vuelca el estado a los controles.
    function applySettingsToInputs() {
        const s = state.settings;
        el.pageSize.value = s.pageSize;
        el.marginTop.value = String(s.margins.top);
        el.marginRight.value = String(s.margins.right);
        el.marginBottom.value = String(s.margins.bottom);
        el.marginLeft.value = String(s.margins.left);
        el.photosPerPage.value = String(s.photosPerPage);
        el.photoGap.value = String(s.gap);
        syncMarginAllInput();
    }

    applySettingsToInputs();
    setPagesPerScroll(state.settings.pagesPerScroll);
    renderTray();
    renderPages();
})();
