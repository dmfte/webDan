// ============================================================
// PPP — Fotos por Página
// ============================================================

// Page sizes in PDF points (1 pt = 1/72 inch)
const PAGE_SIZES = {
    letter:  { w: 612,  h: 792  },
    a4:      { w: 595,  h: 842  },
    legal:   { w: 612,  h: 1008 },
    a3:      { w: 842,  h: 1190 },
    tabloid: { w: 792,  h: 1224 }
};
const MM_TO_PT = 2.8346;
const CANVAS_BASE_W = 800; // internal canvas resolution (px)

// ============================================================
// STATE
// ============================================================
let fileIdCounter = 0;

const state = {
    files: [],      // { id, file, image, aspectRatio, pngBlob, pngUrl }
    params: {
        pageSize:     'letter',
        orientation:  'portrait',  // 'portrait' | 'landscape'
        picsPerPage:  6,
        allowRotation: true,
        gapMm:        5,
        marginMm:     5
    },
    layout:      null,  // { pages: [{ pictures: [{id,x,y,width,height,rotated}] }] }
    currentPage: 0,
    status:      'idle' // 'idle' | 'loading' | 'ready' | 'error'
};

// ============================================================
// DOM REFS
// ============================================================
const dropZone          = document.getElementById('dropZone');
const fileInput         = document.getElementById('fileInput');
const thumbGrid         = document.getElementById('thumbGrid');
const previewCanvas     = document.getElementById('previewCanvas');
const previewPlaceholder= document.getElementById('previewPlaceholder');
const previewLoading    = document.getElementById('previewLoading');
const previewError      = document.getElementById('previewError');
const errorText         = document.getElementById('errorText');
const pageNav           = document.getElementById('pageNav');
const prevPageBtn       = document.getElementById('prevPageBtn');
const nextPageBtn       = document.getElementById('nextPageBtn');
const pageIndicator     = document.getElementById('pageIndicator');
const downloadBtn       = document.getElementById('downloadBtn');
const generateBtn       = document.getElementById('generateBtn');
const retryBtn          = document.getElementById('retryBtn');
const pageSizeSelect    = document.getElementById('pageSizeSelect');
const picsPerPageInput  = document.getElementById('picsPerPageInput');
const gapInput          = document.getElementById('gapInput');
const marginInput       = document.getElementById('marginInput');
const allowRotationCb   = document.getElementById('allowRotationCb');
const btnPortrait       = document.getElementById('btnPortrait');
const btnLandscape      = document.getElementById('btnLandscape');
const hamburgerBtn      = document.getElementById('hamburgerBtn');
const zoneParams        = document.getElementById('zoneParams');
const panelOverlay      = document.getElementById('panelOverlay');

// ============================================================
// IMAGE LOADING
// ============================================================
function loadImageFromFile(file) {
    return new Promise((resolve, reject) => {
        const originalUrl = URL.createObjectURL(file);
        const img = new Image();

        img.onload = () => {
            const maxDim = 3000;
            const srcW = img.naturalWidth, srcH = img.naturalHeight;
            const scale = Math.min(1, maxDim / Math.max(srcW, srcH));
            const cw = Math.round(srcW * scale);
            const ch = Math.round(srcH * scale);

            const canvas = document.createElement('canvas');
            canvas.width = cw;
            canvas.height = ch;
            canvas.getContext('2d').drawImage(img, 0, 0, cw, ch);

            canvas.toBlob(blob => {
                URL.revokeObjectURL(originalUrl);
                if (!blob) {
                    reject(new Error('No se pudo normalizar: ' + file.name));
                    return;
                }

                const pngUrl = URL.createObjectURL(blob);
                const normalizedImg = new Image();
                normalizedImg.onload = () => {
                    resolve({
                        id:          'img_' + (++fileIdCounter),
                        file,
                        image:       normalizedImg, // src = pngUrl (valid)
                        aspectRatio: srcW / srcH,   // from original dimensions
                        pngBlob:     blob,
                        pngUrl               // used for thumbnail + canvas drawing
                    });
                };
                normalizedImg.onerror = () => reject(new Error('Error interno: ' + file.name));
                normalizedImg.src = pngUrl;
            }, 'image/png');
        };

        img.onerror = () => {
            URL.revokeObjectURL(originalUrl);
            reject(new Error('No se pudo cargar: ' + file.name));
        };
        img.src = originalUrl;
    });
}

async function handleFiles(fileList) {
    const images = Array.from(fileList).filter(f => f.type.startsWith('image/'));
    if (!images.length) return;

    for (const file of images) {
        try {
            const entry = await loadImageFromFile(file);
            state.files.push(entry);
            renderThumbnails();         // show each thumbnail as it arrives
        } catch (e) {
            console.warn(e.message);
        }
    }

    generateBtn.disabled = state.files.length === 0;
    invalidateLayout();
}

// ============================================================
// THUMBNAILS
// ============================================================
function renderThumbnails() {
    thumbGrid.innerHTML = '';
    state.files.forEach(entry => {
        const item = document.createElement('div');
        item.className = 'thumb-item';

        const wrap = document.createElement('div');
        wrap.className = 'thumb-img-wrap';

        const img = document.createElement('img');
        img.src = entry.pngUrl;
        img.alt = entry.file.name;

        const btn = document.createElement('button');
        btn.className = 'thumb-remove';
        btn.textContent = '×';
        btn.setAttribute('aria-label', 'Eliminar ' + entry.file.name);
        btn.addEventListener('click', () => removeFile(entry.id));

        wrap.appendChild(img);
        wrap.appendChild(btn);

        const name = document.createElement('p');
        name.className = 'thumb-name';
        name.textContent = entry.file.name;
        name.title = entry.file.name;

        item.appendChild(wrap);
        item.appendChild(name);
        thumbGrid.appendChild(item);
    });
}

function removeFile(id) {
    const entry = state.files.find(f => f.id === id);
    if (entry) URL.revokeObjectURL(entry.pngUrl);
    state.files = state.files.filter(f => f.id !== id);
    renderThumbnails();
    generateBtn.disabled = state.files.length === 0;
    invalidateLayout();
}

// ============================================================
// DRAG AND DROP
// ============================================================
dropZone.addEventListener('dragover', e => {
    e.preventDefault();
    dropZone.classList.add('dragging');
});
dropZone.addEventListener('dragleave', e => {
    if (!dropZone.contains(e.relatedTarget)) {
        dropZone.classList.remove('dragging');
    }
});
dropZone.addEventListener('drop', e => {
    e.preventDefault();
    dropZone.classList.remove('dragging');
    if (e.dataTransfer.files.length) handleFiles(e.dataTransfer.files);
});
fileInput.addEventListener('change', e => {
    handleFiles(e.target.files);
    fileInput.value = ''; // allow re-selecting same files
});

// ============================================================
// PARAMETERS
// ============================================================
pageSizeSelect.addEventListener('change', e => {
    state.params.pageSize = e.target.value;
    invalidateLayout();
});

picsPerPageInput.addEventListener('change', e => {
    state.params.picsPerPage = Math.max(1, Math.min(12, parseInt(e.target.value) || 1));
    picsPerPageInput.value = state.params.picsPerPage;
    invalidateLayout();
});

gapInput.addEventListener('change', e => {
    state.params.gapMm = Math.max(0, parseFloat(e.target.value) || 0);
    gapInput.value = state.params.gapMm;
    invalidateLayout();
});

marginInput.addEventListener('change', e => {
    state.params.marginMm = Math.max(0, parseFloat(e.target.value) || 0);
    marginInput.value = state.params.marginMm;
    invalidateLayout();
});

allowRotationCb.addEventListener('change', e => {
    state.params.allowRotation = e.target.checked;
    invalidateLayout();
});

[btnPortrait, btnLandscape].forEach(btn => {
    btn.addEventListener('click', () => {
        state.params.orientation = btn.dataset.orient;
        btnPortrait.classList.toggle('active', state.params.orientation === 'portrait');
        btnLandscape.classList.toggle('active', state.params.orientation === 'landscape');
        invalidateLayout();
    });
});

function invalidateLayout() {
    if (state.layout || state.status === 'error') {
        state.layout = null;
        state.status = 'idle';
        renderStatus();
    }
}

// ============================================================
// PAGE DIMENSIONS
// ============================================================
function getPageDimsPt() {
    const base = PAGE_SIZES[state.params.pageSize];
    if (state.params.orientation === 'landscape') {
        return { w: Math.max(base.w, base.h), h: Math.min(base.w, base.h) };
    }
    return { w: Math.min(base.w, base.h), h: Math.max(base.w, base.h) };
}

// ============================================================
// GENERATE — placeholder (not yet implemented)
// ============================================================
generateBtn.addEventListener('click', () => {});
retryBtn.addEventListener('click', () => {});

// ============================================================
// CANVAS PREVIEW
// ============================================================
function renderPreview() {
    if (state.status !== 'ready' || !state.layout) return;

    const dims = getPageDimsPt();
    const scale = CANVAS_BASE_W / dims.w;
    const canvasH = Math.round(dims.h * scale);

    previewCanvas.width  = CANVAS_BASE_W;
    previewCanvas.height = canvasH;

    const ctx = previewCanvas.getContext('2d');
    ctx.fillStyle = '#fff';
    ctx.fillRect(0, 0, CANVAS_BASE_W, canvasH);

    const page = state.layout.pages[state.currentPage];
    if (!page) return;

    page.pictures.forEach(pic => {
        const entry = state.files.find(f => f.id === pic.id);
        if (!entry) return;

        const x = pic.x     * scale;
        const y = pic.y     * scale;
        const w = pic.width * scale;
        const h = pic.height * scale;

        if (pic.rotated) {
            // Rotate 90° clockwise: translate to top-right of the slot, rotate, draw
            ctx.save();
            ctx.translate(x + w, y);
            ctx.rotate(Math.PI / 2);
            ctx.drawImage(entry.image, 0, 0, h, w);
            ctx.restore();
        } else {
            ctx.drawImage(entry.image, x, y, w, h);
        }

        // Subtle slot border
        ctx.strokeStyle = 'rgba(0,0,0,0.12)';
        ctx.lineWidth = 1;
        ctx.strokeRect(x, y, w, h);
    });

    // Update page navigation
    const total = state.layout.pages.length;
    pageIndicator.textContent = `Página ${state.currentPage + 1} / ${total}`;
    prevPageBtn.disabled = state.currentPage === 0;
    nextPageBtn.disabled = state.currentPage === total - 1;
}

prevPageBtn.addEventListener('click', () => {
    if (state.currentPage > 0) { state.currentPage--; renderPreview(); }
});
nextPageBtn.addEventListener('click', () => {
    if (state.layout && state.currentPage < state.layout.pages.length - 1) {
        state.currentPage++;
        renderPreview();
    }
});

// ============================================================
// STATUS RENDER
// ============================================================
function renderStatus() {
    const isIdle    = state.status === 'idle';
    const isLoading = state.status === 'loading';
    const isReady   = state.status === 'ready';
    const isError   = state.status === 'error';

    previewCanvas.classList.toggle('visible', isReady);
    previewPlaceholder.classList.toggle('hidden', !isIdle);
    previewLoading.classList.toggle('visible', isLoading);
    previewError.classList.toggle('visible', isError);
    pageNav.classList.toggle('visible', isReady);

    downloadBtn.disabled = !isReady;
    generateBtn.disabled = state.files.length === 0 || isLoading;
}

// ============================================================
// PDF DOWNLOAD
// ============================================================
async function downloadPDF() {
    if (!state.layout) return;

    downloadBtn.disabled = true;
    downloadBtn.textContent = 'Generando...';

    try {
        const { PDFDocument, degrees } = PDFLib;
        const pdfDoc = await PDFDocument.create();
        const dims = getPageDimsPt();

        for (const page of state.layout.pages) {
            const pdfPage = pdfDoc.addPage([dims.w, dims.h]);

            for (const pic of page.pictures) {
                const entry = state.files.find(f => f.id === pic.id);
                if (!entry) continue;

                const imgBytes = await entry.pngBlob.arrayBuffer();
                const embedded = await pdfDoc.embedPng(imgBytes);

                // Convert from top-left origin (worker) to bottom-left origin (pdf-lib)
                const pdfY = dims.h - pic.y - pic.height;

                if (pic.rotated) {
                    // 90° CCW rotation in pdf-lib around (x + slotWidth, pdfY)
                    // draws the image filling the slot (slotWidth × slotHeight)
                    pdfPage.drawImage(embedded, {
                        x:      pic.x + pic.width,
                        y:      pdfY,
                        width:  pic.height,
                        height: pic.width,
                        rotate: degrees(90)
                    });
                } else {
                    pdfPage.drawImage(embedded, {
                        x:      pic.x,
                        y:      pdfY,
                        width:  pic.width,
                        height: pic.height
                    });
                }
            }
        }

        const bytes = await pdfDoc.save();
        const blob  = new Blob([bytes], { type: 'application/pdf' });
        const url   = URL.createObjectURL(blob);
        const a     = document.createElement('a');
        a.href     = url;
        a.download = 'PPP_fotos.pdf';
        a.click();
        URL.revokeObjectURL(url);
    } catch (e) {
        alert('Error al generar el PDF: ' + e.message);
    } finally {
        downloadBtn.disabled = false;
        downloadBtn.textContent = 'Descargar PDF';
    }
}

downloadBtn.addEventListener('click', downloadPDF);

// ============================================================
// MOBILE — hamburger / panel toggle
// ============================================================
hamburgerBtn.addEventListener('click', () => {
    zoneParams.classList.add('open');
    panelOverlay.classList.add('visible');
});
panelOverlay.addEventListener('click', () => {
    zoneParams.classList.remove('open');
    panelOverlay.classList.remove('visible');
});

// ============================================================
// INIT — sync DOM to state.params so changing state is enough
// ============================================================
function initUI() {
    pageSizeSelect.value      = state.params.pageSize;
    picsPerPageInput.value    = state.params.picsPerPage;
    gapInput.value            = state.params.gapMm;
    marginInput.value         = state.params.marginMm;
    allowRotationCb.checked   = state.params.allowRotation;
    btnPortrait.classList.toggle('active',   state.params.orientation === 'portrait');
    btnLandscape.classList.toggle('active',  state.params.orientation === 'landscape');
}

initUI();
renderStatus();
