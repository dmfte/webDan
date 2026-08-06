// Context menu when selecting text.
const elementModAddPopup = document.getElementById("modAddPopup");
const cmSelection = document.querySelector(".context-menu.selection");
const btnAddModal = cmSelection.querySelector("#btnAddModal");
var modAddPopup = new AutoDialog({ dialog: elementModAddPopup, title: "Agregar ventana emergente", trigger: btnAddModal, onopen: passSelectedText, backdropclose: false });
// These variables above were declared here so the background color of the dialog can be updated with an input color button below.

// CONTROLS BAR
// Download button.
const btnDownload = document.getElementById("btnDownload");
const itTitle = document.getElementById("itTitle");

btnDownload.addEventListener("click", () => {
    let allAccr = accordions.querySelectorAll(".cont-accr");
    let div0 = document.createElement("div");
    div0.style.display = "none";
    allAccr.forEach(accr => {
        if (accr.classList.contains("active")) accr.classList.remove("active");
        let accr0 = accr.cloneNode(true);
        div0.appendChild(accr0);
    });
    document.body.appendChild(div0);

    // Rebuild each accordion into the model's plain markup shape, dropping popups
    // (the export has no dialog engine) while keeping highlight spans, which are
    // just inline-styled <span>s and need no extra CSS/JS to render statically.
    let accordionsHTML = Array.from(div0.querySelectorAll(".cont-accr")).map(accr => {
        accr.querySelectorAll(".show-popup").forEach(span => {
            span.replaceWith(document.createTextNode(span.textContent));
        });
        let titleHTML = accr.querySelector(".accr-title").innerHTML;
        let rootList = accr.querySelector(".accr-body > ul, .accr-body > ol");
        let listHTML = rootList ? rootList.outerHTML : "";
        return '<div class="accordion-container">\n'
            + '    <div class="accordion-title">\n'
            + '        <div class="accordion-trigger" tabindex="0"><h3>' + titleHTML + '</h3></div>\n'
            + '    </div>\n'
            + '    <div class="accordion-collapsible">\n'
            + '        <div class="collapsible-content">' + listHTML + '</div>\n'
            + '    </div>\n'
            + '</div>';
    }).join("\n");
    document.body.removeChild(div0);

    let title = itTitle.value || "Bosquejo";

    // Derive the exported page's palette from the accent color picked above,
    // keeping the same offset technique as the live preview (getAddedRGB).
    // The expanded content panel stays a fixed light surface for readability,
    // matching the model's "page" look, regardless of the accent chosen.
    let pageBg = getAddedRGB(accr_bg, true, -55);
    let topBar = getAddedRGB(accr_bg, true, -35);
    let topBarRunning = getAddedRGB(accr_bg, true, -15);
    let accrSurface = getAddedRGB(accr_bg, true, -20);
    let control = getAddedRGB(accr_bg, true, 40);
    let borderSubtle = getAddedRGB(accr_bg, true, 70);
    let borderDefault = getAddedRGB(accr_bg, true, 100);
    let borderStrong = getAddedRGB(accr_bg, true, 190);
    let borderContent = getAddedRGB(accr_bg, true, -60);

    let css = '<style>'
        + ':root {'
        + '--color-text-primary: #000;'
        + '--color-text-secondary: #fff;'
        + '--color-surface-page: ' + pageBg + ';'
        + '--color-surface-top-bar: ' + topBar + ';'
        + '--color-surface-top-bar-running: ' + topBarRunning + ';'
        + '--color-surface-accordion: ' + accrSurface + ';'
        + '--color-surface-control: ' + control + ';'
        + '--color-surface-content: #fbfaf6;'
        + '--color-surface-trigger-open: #f6f2ea;'
        + '--color-border-subtle: ' + borderSubtle + ';'
        + '--color-border-default: ' + borderDefault + ';'
        + '--color-border-strong: ' + borderStrong + ';'
        + '--color-border-content: ' + borderContent + ';'
        + '--top-bar-height: 60px;'
        + '}'
        + '* { box-sizing: border-box; }'
        + 'html { font-size: 20px; }'
        + 'body { margin: 0; min-height: 100vh; display: grid; gap: 0.9rem; align-content: start; padding: clamp(0.9rem, 2.6vw, 2rem); padding-top: calc(var(--top-bar-height) + 0.9rem); background: var(--color-surface-page); color: var(--color-text-primary); font-family: Iowan Old Style, Palatino Linotype, Book Antiqua, Georgia, serif; line-height: 1.55; }'
        + '.top-bar { position: fixed; top: 0; left: 0; right: 0; height: var(--top-bar-height); display: flex; align-items: stretch; background: var(--color-surface-top-bar); border-bottom: 1.5px solid var(--color-border-default); z-index: 100; -webkit-user-select: none; user-select: none; -webkit-touch-callout: none; -webkit-tap-highlight-color: transparent; }'
        + '.top-bar.is-running { background: var(--color-surface-top-bar-running); }'
        + '.font-controls { height: 100%; padding: 0 0.4rem; display: flex; align-items: center; }'
        + '.font-btn { height: 80%; width: calc(var(--top-bar-height) * 2); margin-right: 10px; border-radius: 0.55rem; border: none; background: var(--color-border-subtle); color: var(--color-text-secondary); font-family: inherit; font-size: 1.2rem; font-weight: 600; line-height: 1; padding: 0; cursor: pointer; -webkit-tap-highlight-color: transparent; }'
        + '.stopwatch-display { font-size: 32px; font-weight: 600; color: var(--color-text-secondary); flex: 1; text-align: center; cursor: pointer; }'
        + '.accordion-container { width: 100%; margin: 0 auto; padding: 0.34rem; border: 1.5px solid var(--color-border-default); border-radius: 1.2rem; background: var(--color-surface-accordion); transition: border-color 220ms ease, background 220ms ease; }'
        + '.accordion-title { display: flex; }'
        + '.accordion-trigger { width: 100%; display: flex; align-items: center; justify-content: space-between; gap: 1rem; cursor: pointer; padding: 0.95rem 1.15rem; border: 1px solid var(--color-border-subtle); border-radius: 0.95rem; background: var(--color-surface-control); color: var(--color-text-secondary); transition: border-color 220ms ease, background 220ms ease, color 220ms ease; }'
        + '.accordion-trigger:focus-visible { outline: 2px solid var(--color-border-strong); outline-offset: 0.15rem; }'
        + '.accordion-trigger::after { content: "+"; flex: none; width: 1.8rem; height: 1.8rem; display: inline-grid; place-items: center; border: 1px solid currentColor; border-radius: 999px; font-size: 1.1rem; line-height: 1; }'
        + '.accordion-title h3 { margin: 0; font-size: 1.2rem; font-weight: 600; letter-spacing: 0.01em; width: 100%; text-align: center; }'
        + '.accordion-collapsible { display: none; }'
        + '.collapsible-content { margin-top: 0; padding: 0 1rem; border: 1px solid transparent; border-radius: 0.95rem; background: transparent; }'
        + '.accordion-container.is-open { border-color: var(--color-border-strong); background: var(--color-surface-top-bar); }'
        + '.accordion-container.is-open .accordion-trigger { border-color: var(--color-border-strong); background: var(--color-surface-trigger-open); color: var(--color-text-primary); }'
        + '.accordion-container.is-open .accordion-trigger::after { content: "−"; }'
        + '.accordion-container.is-open .accordion-collapsible { display: block; }'
        + '.accordion-container.is-open .collapsible-content { margin-top: 0.45rem; padding: 1rem 1.1rem 1.15rem; border-color: var(--color-border-content); background: var(--color-surface-content); }'
        + '.collapsible-content > :first-child { margin-top: 0; }'
        + '.collapsible-content > :last-child { margin-bottom: 0; }'
        + 'ul, ol { margin: 0.15rem 0 0; padding-left: 1.25rem; }'
        + 'li + li { margin-top: 0.5rem; }'
        + 'p { margin: 0.3rem 0 0; }'
        + '.highlight { border-radius: 0.15em; padding: 0 0.1em; }'
        + '@media (max-width: 540px) {'
        + 'body { gap: 0.7rem; padding: 0.7rem; }'
        + '.accordion-trigger { padding: 0.85rem 0.95rem; }'
        + '.accordion-container.is-open .collapsible-content { padding: 0.9rem 0.95rem 1rem; }'
        + '}'
        + '</style>';

    let js = '<script>'
        + '(function () {'
        + 'var html = document.documentElement;'
        + 'var minus = document.getElementById("font-minus");'
        + 'var plus = document.getElementById("font-plus");'
        + 'var STEP = 2; var MIN = 12; var MAX = 36;'
        + 'var STORAGE_KEY = "outlinerFontSize";'
        + 'function getSize() {'
        + 'var current = parseInt(html.style.fontSize, 10);'
        + 'if (isNaN(current)) {'
        + 'var computed = window.getComputedStyle ? window.getComputedStyle(html).fontSize : html.currentStyle.fontSize;'
        + 'current = parseInt(computed, 10) || 20;'
        + '}'
        + 'return current;'
        + '}'
        + 'function setSize(px) {'
        + 'if (px < MIN) px = MIN;'
        + 'if (px > MAX) px = MAX;'
        + 'html.style.fontSize = px + "px";'
        + 'try { localStorage.setItem(STORAGE_KEY, "" + px); } catch (err) { }'
        + '}'
        + 'function stop(e) { if (e && e.stopPropagation) e.stopPropagation(); }'
        + 'function bump(delta) { return function (e) { stop(e); setSize(getSize() + delta); }; }'
        + 'try {'
        + 'var saved = parseInt(localStorage.getItem(STORAGE_KEY), 10);'
        + 'if (!isNaN(saved) && saved >= MIN && saved <= MAX) html.style.fontSize = saved + "px";'
        + '} catch (err) { }'
        + 'var stopEvents = ["touchstart", "touchend", "touchmove", "touchcancel", "mousedown", "mouseup", "mouseleave", "click"];'
        + 'for (var i = 0; i < stopEvents.length; i++) { minus.addEventListener(stopEvents[i], stop); plus.addEventListener(stopEvents[i], stop); }'
        + 'minus.addEventListener("click", bump(-STEP));'
        + 'plus.addEventListener("click", bump(+STEP));'
        + '})();'
        + '(function () {'
        + 'var topBar = document.getElementById("sw-bar");'
        + 'var display = document.getElementById("sw-display");'
        + 'var elapsed = 0; var startedAt = 0; var timer = null; var pressTimer = null; var longPressed = false; var lastTouch = 0;'
        + 'var LONG_PRESS_MS = 700;'
        + 'function pad(n) { return n < 10 ? "0" + n : "" + n; }'
        + 'function format(ms) {'
        + 'var s = Math.floor(ms / 1000);'
        + 'var h = Math.floor(s / 3600);'
        + 'var m = Math.floor((s % 3600) / 60);'
        + 'var sec = s % 60;'
        + 'if (h > 0) return pad(h) + ":" + pad(m) + ":" + pad(sec);'
        + 'return pad(m) + ":" + pad(sec);'
        + '}'
        + 'function render() {'
        + 'var current = elapsed;'
        + 'if (timer !== null) current += (+new Date()) - startedAt;'
        + 'var next = format(current);'
        + 'if (display.innerHTML !== next) display.innerHTML = next;'
        + '}'
        + 'function toggle() {'
        + 'if (timer !== null) {'
        + 'elapsed += (+new Date()) - startedAt;'
        + 'clearInterval(timer);'
        + 'timer = null;'
        + 'topBar.className = topBar.className.replace(/\\s*is-running/, "");'
        + '} else {'
        + 'startedAt = +new Date();'
        + 'timer = setInterval(render, 1000);'
        + 'topBar.className += " is-running";'
        + '}'
        + 'render();'
        + '}'
        + 'function reset() {'
        + 'if (timer !== null) {'
        + 'clearInterval(timer);'
        + 'timer = null;'
        + 'topBar.className = topBar.className.replace(/\\s*is-running/, "");'
        + '}'
        + 'elapsed = 0;'
        + 'startedAt = 0;'
        + 'render();'
        + '}'
        + 'function startPress() {'
        + 'longPressed = false;'
        + 'if (pressTimer !== null) clearTimeout(pressTimer);'
        + 'pressTimer = setTimeout(function () {'
        + 'longPressed = true;'
        + 'pressTimer = null;'
        + 'reset();'
        + '}, LONG_PRESS_MS);'
        + '}'
        + 'function endPress() {'
        + 'if (pressTimer !== null) {'
        + 'clearTimeout(pressTimer);'
        + 'pressTimer = null;'
        + '}'
        + 'if (longPressed) {'
        + 'longPressed = false;'
        + 'return;'
        + '}'
        + 'toggle();'
        + '}'
        + 'function cancelPress() {'
        + 'if (pressTimer !== null) {'
        + 'clearTimeout(pressTimer);'
        + 'pressTimer = null;'
        + '}'
        + 'longPressed = false;'
        + '}'
        + 'function fromTouch() { return (+new Date()) - lastTouch < 600; }'
        + 'display.addEventListener("touchstart", function () { lastTouch = +new Date(); startPress(); });'
        + 'display.addEventListener("touchend", function (e) { lastTouch = +new Date(); if (longPressed && e.preventDefault) e.preventDefault(); endPress(); });'
        + 'display.addEventListener("touchmove", cancelPress);'
        + 'display.addEventListener("touchcancel", cancelPress);'
        + 'display.addEventListener("mousedown", function () { if (fromTouch()) return; startPress(); });'
        + 'display.addEventListener("mouseup", function () { if (fromTouch()) return; endPress(); });'
        + 'display.addEventListener("mouseleave", function () { if (fromTouch()) return; cancelPress(); });'
        + 'render();'
        + '})();'
        + '(function () {'
        + 'var triggers = document.getElementsByClassName("accordion-trigger");'
        + 'for (var i = 0; i < triggers.length; i++) {'
        + 'triggers[i].addEventListener("click", function () {'
        + 'var target = this.parentNode;'
        + 'while (target && (!target.className || target.className.indexOf("accordion-container") === -1)) {'
        + 'target = target.parentNode;'
        + '}'
        + 'if (!target) return;'
        + 'var wasOpen = target.className.indexOf("is-open") !== -1;'
        + 'var containers = document.getElementsByClassName("accordion-container");'
        + 'for (var j = 0; j < containers.length; j++) {'
        + 'containers[j].className = containers[j].className.replace(/\\s*is-open/, "");'
        + '}'
        + 'if (!wasOpen) {'
        + 'target.className += " is-open";'
        + '}'
        + '});'
        + '}'
        + '})();'
        + '</script>';

    let html = '<!DOCTYPE html>'
        + '<html lang="en">'
        + '<head>'
        + '<meta charset="UTF-8">'
        + '<meta name="viewport" content="width=device-width, initial-scale=1.0">'
        + '<title>' + title + '</title>'
        + css
        + '</head>'
        + '<body>'
        + '<div class="top-bar" id="sw-bar">'
        + '<div class="font-controls">'
        + '<button type="button" class="font-btn" id="font-minus">A−</button>'
        + '<button type="button" class="font-btn" id="font-plus">A+</button>'
        + '</div>'
        + '<div class="stopwatch-display" id="sw-display">00:00</div>'
        + '</div>'
        + accordionsHTML
        + js
        + '</body>'
        + '</html>';

    let blob = new Blob([html], { type: "text/html" });
    let a = document.createElement("a");
    a.style.display = "none";
    a.href = URL.createObjectURL(blob);
    a.download = `${title}.html`;
    document.body.appendChild(a);
    a.click();
    URL.revokeObjectURL(a.href);
    document.body.removeChild(a);
});

// Input file load an existing outliner.
const ifLoad = document.getElementById("ifLoad");
ifLoad.addEventListener("input", (evt) => {
    let file = evt.currentTarget.files[0];
    let nameRegex = /^(.+)\.html$/;
    let title = file.name.match(nameRegex)[1];
    let reader = new FileReader();
    reader.onload = (evt) => {
        let laodedHTML = evt.currentTarget.result;
        let parser = new DOMParser();
        let doc = parser.parseFromString(laodedHTML, "text/html");
        // Accept both the editor's own format (.cont-accr) and files already
        // exported in the model's simple shape (.accordion-container), so a
        // downloaded outline can still be reloaded here for further editing.
        let accrs = doc.querySelectorAll(".cont-accr, .accordion-container");
        let overlay = accordions.querySelector(".overlay");
        accordions.innerHTML = "";
        accordions.appendChild(overlay);
        accrs.forEach(async accr => {
            let isExported = accr.classList.contains("accordion-container");
            let headHTML = isExported
                ? accr.querySelector(".accordion-trigger h3").innerHTML
                : accr.querySelector("h3").innerHTML;
            let rootList = isExported
                ? accr.querySelector(".collapsible-content > ul, .collapsible-content > ol")
                : accr.querySelector(".accr-body > ul, .accr-body > ol");
            let body = serializeList(rootList, 0);
            let newAccr = await createAccordion(headHTML, body);
            if (newAccr.querySelectorAll("strong").length) newAccr.querySelectorAll("strong").forEach(strong => strong.addEventListener("click", listenerToRemoveTag));
            if (newAccr.querySelectorAll("em").length) newAccr.querySelectorAll("em").forEach(em => em.addEventListener("click", listenerToRemoveTag));
            if (newAccr.querySelectorAll("u").length) newAccr.querySelectorAll("u").forEach(u => u.addEventListener("click", listenerToRemoveTag));
            if (newAccr.querySelectorAll(".highlight").length) newAccr.querySelectorAll(".highlight").forEach(highlight => highlight.addEventListener("click", listenerToRemoveTag));
            if (newAccr.querySelectorAll(".show-popup").length) newAccr.querySelectorAll(".show-popup").forEach(showpopup => showpopup.addEventListener("click", listenerToShowPopup));
            accordions.appendChild(newAccr);
            ifLoad.value = "";
            itTitle.value = title || "";
        });
    }
    reader.readAsText(file);
});

// Input color button.
const icGeneralColor = document.getElementById("icGeneralColor");
const lbGeneralColor = document.querySelector("label[for=icGeneralColor]");
var accr_bg = "#2f4c57";  // General color
icGeneralColor.value = accr_bg;
lbGeneralColor.style.backgroundColor = icGeneralColor.value;

var accr_preview_bg, accr_border, accr_border_lit, accr_body_color, accr_head_color, accr_head_lit_color, dialog_body, dialog_color;
updateColorsVarsAfterGeneralColor();
setOutlineColors();

icGeneralColor.addEventListener("input", () => {
    lbGeneralColor.style.backgroundColor = icGeneralColor.value;
    let obj = getObjRgb(icGeneralColor.value)
    let generalColor = `rgb(${obj.r}, ${obj.g}, ${obj.b})`;
    accr_bg = generalColor;
    updateColorsVarsAfterGeneralColor();
    setOutlineColors();
});

function updateColorsVarsAfterGeneralColor() {
    accr_preview_bg = getAddedRGB(accr_bg, true, -100);
    accr_border = getAddedRGB(accr_bg, true, 100);
    accr_border_lit = getAddedRGB(accr_bg, true, 150);
    accr_body_color = getAddedRGB(accr_border_lit, false, -130);
    accr_head_color = accr_border;
    accr_head_lit_color = accr_border_lit;
    dialog_body = accr_border_lit;
    dialog_color = accr_body_color;
    // modAddPopup created again so the colors of the header and buttons can be updated too.
    elementModAddPopup.querySelector(".body").style.backgroundColor = accr_border_lit;
    elementModAddPopup.querySelector(".body").style.color = accr_body_color;
    modAddPopup = new AutoDialog({ dialog: elementModAddPopup, title: "Agregar ventana emergente", trigger: btnAddModal, onopen: passSelectedText, backdropclose: false });
}
function setOutlineColors() {
    let rootVars = document.body || document.documentElement;
    rootVars.style.setProperty("--accr-preview-bg", accr_preview_bg);
    rootVars.style.setProperty("--accr-bg", accr_bg);
    rootVars.style.setProperty("--accr-border", accr_border);
    rootVars.style.setProperty("--accr-border-lit", accr_border_lit);
    rootVars.style.setProperty("--accr-body-color", accr_body_color);
    rootVars.style.setProperty("--accr-head-color", accr_head_color);
    rootVars.style.setProperty("--accr-head-lit-color", accr_head_lit_color);
    rootVars.style.setProperty("--dialog-body", dialog_body);
    rootVars.style.setProperty("--dialog-color", dialog_color);
}
// ---------

const editBody = document.querySelector(".cont.edit .collapsible #taCollapsible");
const accordions = document.querySelector(".accordions");
const btnPass = document.querySelector(".cont.edit .buttons .pass");
const btnEdit = document.querySelector(".cont.edit .buttons .edit");

var rangeEditor;

// Dashes ("- ", "-- ", ...) are the outline syntax's nesting marker, typed
// directly -- that's what works on mobile, which has no Tab key. On a
// physical keyboard, Tab is kept as a shortcut that inserts "- " at the
// cursor instead of moving focus out of the textarea; Shift+Tab removes one
// leading "-" from the current line.
editBody.addEventListener("keydown", (evt) => {
    if (evt.key !== "Tab") return;
    evt.preventDefault();
    let start = editBody.selectionStart;
    let end = editBody.selectionEnd;
    let value = editBody.value;
    let lineStart = value.lastIndexOf("\n", start - 1) + 1;
    if (evt.shiftKey) {
        let lineEnd = value.indexOf("\n", lineStart);
        if (lineEnd === -1) lineEnd = value.length;
        let m = value.slice(lineStart, lineEnd).match(/^-\s?/);
        if (m) {
            editBody.value = value.slice(0, lineStart) + value.slice(lineStart + m[0].length);
            editBody.selectionStart = editBody.selectionEnd = Math.max(start - m[0].length, lineStart);
        }
    } else {
        editBody.value = value.slice(0, start) + "- " + value.slice(end);
        editBody.selectionStart = editBody.selectionEnd = start + 2;
    }
});

btnPass.addEventListener("click", async () => {
    if (editBody.value == "") return;
    let txt1 = editBody.value;
    let txt2 = txt1.split("\n");
    let title = txt2.splice(0, 1);
    let newAccordion = await createAccordion(title, txt2);

    if (accordions.classList.contains("edit")) {
        let accrActive = accordions.querySelector(".cont-accr.active");
        accrActive.querySelector(".accr-title").innerText = newAccordion.querySelector(".accr-title").innerText;
        accrActive.querySelector(".accr-body").innerHTML = newAccordion.querySelector(".accr-body").innerHTML;
        accordions.classList.remove("edit");
    } else {
        accordions.appendChild(newAccordion);
    }

    editBody.value = "";
    editBody.focus();
});

function onKeyDuringEdit(keydown) {
    if (keydown.key == "Escape") {
        accordions.classList.remove("edit");
        editBody.value = "";
        editBody.focus();
        editBody.removeEventListener("keydown", onKeyDuringEdit);
    }
}
function onClickDuringEdit() {
    accordions.classList.remove("edit");
    editBody.value = "";
    editBody.focus();
    accordions.querySelector(".overlay").removeEventListener("click", onClickDuringEdit);
}
btnEdit.addEventListener("click", () => {
    let accrActive = accordions.querySelector(".cont-accr.active");
    if (accrActive == null) return;
    accordions.classList.add("edit");
    document.body.addEventListener("keydown", onKeyDuringEdit);
    accordions.querySelector(".overlay").addEventListener("click", onClickDuringEdit);
    let rootList = accrActive.querySelector(".accr-body > ul, .accr-body > ol");
    let lines = serializeList(rootList, 0);
    let str = accrActive.querySelector(".accr-title").innerHTML + "\n" + lines.join("\n");
    editBody.value = str;
});

// SELECTED TEXT CONTEXT MENU BUTTONs

// Declared at the begining.
// For all buttons: if there's no selected text, the context menu should hide.
const arrContextMenuBtns = cmSelection.querySelectorAll(".btn");
arrContextMenuBtns.forEach(btn => {
    btn.addEventListener("click", () => {
        if (rangeEditor == null) {
            cmSelection.classList.remove("active");
            return;
        }
    });
});

// This is for buttons on context menu that add N, I, U style to the selected text.
const arrSelectionStyleBtns = cmSelection.querySelectorAll(".btn.style");
arrSelectionStyleBtns.forEach(btn => {
    btn.addEventListener("pointerup", async () => {
        // Listener from accordios has already made sure theres a selection within the same line.
        let tag = document.createElement(btn.dataset.tag);
        tag.addEventListener("click", listenerToRemoveTag);
        rangeEditor.surroundContents(tag);
        rangeEditor = null;
        window.getSelection().removeAllRanges();
    });
});

// Highlight selected text with color.
const btnHighlightBg = document.getElementById("btnHighlightBg");
const icHighlightBg = document.getElementById("highlight-bg");
icHighlightBg.value = "#ff0000";

btnHighlightBg.addEventListener("click", () => {
    if (rangeEditor == null) return;
    let inputSpanColor = () => { span.style.backgroundColor = icHighlightBg.value };
    let changeSpanColor = () => {
        cmSelection.classList.remove("active");
        icHighlightBg.removeEventListener("input", inputSpanColor);
        icHighlightBg.removeEventListener("change", changeSpanColor)
    };
    let span = document.createElement("span");
    span.classList.add("highlight");
    inputSpanColor();
    span.addEventListener("click", listenerToRemoveTag);
    //  Range selection has already been made.
    rangeEditor.surroundContents(span);
    rangeEditor = null;
    window.getSelection().removeAllRanges();
    icHighlightBg.addEventListener("input", inputSpanColor);
    icHighlightBg.addEventListener("change", changeSpanColor);
});

//  Adding a popup to the selected text.
// const elementModAddPopup = document.getElementById("modAddPopup");
// const btnAddModal = cmSelection.querySelector("#btnAddModal");
// var modAddPopup = new AutoDialog({ dialog: elementModAddPopup, title: "Agregar ventana emergente", trigger: btnAddModal, onopen: passSelectedText, backdropclose: false });  Listed at the top.
const emapSubtitle = elementModAddPopup.querySelector("#itSubtitle");
const emapBody = elementModAddPopup.querySelector("textarea");
const modPopup = document.getElementById("modPopup");

function passSelectedText() {
    // This should only happen when a text is selected. Trigger butotn will only show if theres a range selected.
    modAddPopup.dialog.querySelector("#itSubtitle").value = rangeEditor.toString();
    modAddPopup.dialog.querySelector("textarea").focus();
}

modAddPopup.onOk(async () => {
    cmSelection.classList.remove("active");
    if (rangeEditor == null) return;
    // Listener from accordios has already made sure theres a selection within the same line.
    let span = document.createElement("span");
    span.classList.add("show-popup");
    span.dataset.title = emapSubtitle.value;
    span.dataset.body = emapBody.value;
    span.addEventListener("click", listenerToShowPopup);
    rangeEditor.surroundContents(span);
    rangeEditor = null;
    window.getSelection().removeAllRanges();
    emapSubtitle.value = "";
    emapBody.value = "";
});
// ---------

function listenerToShowPopup(evt) {
    let popup = new AutoDialog({ dialog: modPopup, title: evt.currentTarget.dataset.title, cancel: false, backdropclose: false });
    popup.dialog.querySelector(".footer").style.height = "3em";
    popup.dialog.querySelector(".modFootBtn").style.fontSize = "1.7em";
    popup.body.innerText = evt.currentTarget.dataset.body;
    console.log(evt.currentTarget);
    popup.show();
}


function listenerToRemoveTag(evt) {
    let element = evt.currentTarget;
    let txt = element.innerText;
    let txtNode = document.createTextNode(txt);
    let li = element.closest("li") || element.closest("h3");
    li.insertBefore(txtNode, element);
    let liNodes = li.childNodes;
    for (let i = 0; i < liNodes.length; i++) {
        const node = liNodes[i];
        if (node == element) {
            li.removeChild(element);
            mergeTextNodes(li);
            break;
        }
    }
}



accordions.addEventListener("pointerup", (evt) => {
    let sel = window.getSelection();
    if (sel.anchorNode == null) return;
    let range = sel.getRangeAt(0);
    let start = range.startContainer;
    let end = range.endContainer;
    if (start == end && range.startOffset !== range.endOffset) {
        rangeEditor = range;
        let btnWdith = parseInt((window.getComputedStyle(document.body) || window.getComputedStyle(document.documentElement)).getPropertyValue("--contextmenu-btn-dim"));
        let cmSelectionWidth = btnWdith * (cmSelection.querySelectorAll(".btn").length + 1);
        // console.log(window.innerWidth , evt.clientX, cmSelectionWidth);
        if (window.innerWidth - evt.clientX < cmSelectionWidth) {
            cmSelection.style.left = `${evt.clientX - cmSelectionWidth}px`;
        } else {
            cmSelection.style.left = `${evt.clientX}px`;
        }
        cmSelection.style.top = `${evt.clientY - 40}px`;
        cmSelection.classList.add("active");

        document.body.addEventListener("pointerdown", (evt) => {
            let e = evt.target;
            let parent = e.closest(".context-menu.selection");
            if (parent !== cmSelection) {
                cmSelection.classList.remove("active");
            }
        }, { once: true });
    } else {
        rangeEditor = null;
        cmSelection.classList.remove("active");
    }
});


// function createTagToSurround(strTag) {
//     let tag = document.createElement(strTag);
//     return tag;
// }

function mergeTextNodes(element) {
    let arrNodes = element.childNodes;
    for (let i = 1; i < arrNodes.length; i++) {
        const node = arrNodes[i];
        if (node.nodeType === arrNodes[i - 1].nodeType) {
            arrNodes[i - 1].nodeValue += node.nodeValue;
            element.removeChild(node);
            // Get array of nodes again since one node has been removed.
            arrNodes = element.childNodes;
            // Reducing i so itteraction does not skip one due to the removed node.
            i--;
        }
    }
}

// Outline text syntax: N leading dashes + a space set nesting depth ("- " for
// depth 1, "-- " for depth 2, ...) -- typable on any keyboard, unlike tabs,
// which have no key on mobile on-screen keyboards. Right after the depth
// marker, "#" flags that item's whole sibling group as an <ol> (the browser
// draws the actual numbers; "#" is only a structural flag), and "+" appends
// another <p> paragraph to the previous sibling instead of starting a new
// <li>. A group is ordered if ANY of its items carries "#", not just the
// first, so reordering or deleting lines can't silently drop the numbering.
function splitLinePrefix(line) {
    let m = line.match(/^(-+)\s+/);
    if (!m) return { depth: 0, rest: line };
    return { depth: m[1].length, rest: line.slice(m[0].length) };
}

function buildListFromLines(lines) {
    let idx = 0;
    function parseLevel(depth) {
        let items = [];
        while (idx < lines.length) {
            let raw = lines[idx];
            if (raw.trim() === "") { idx++; continue; }
            let split = splitLinePrefix(raw);
            if (split.depth !== depth) break;
            let rest = split.rest;
            if (rest.charAt(0) === "+" && items.length) {
                let last = items[items.length - 1];
                if (!last.paragraphs) last.paragraphs = [last.html];
                last.paragraphs.push(rest.slice(1).replace(/^\s*/, ""));
                idx++;
                continue;
            }
            let ordered = rest.charAt(0) === "#";
            if (ordered) rest = rest.slice(1).replace(/^\s*/, "");
            let item = { html: rest, ordered: ordered, children: null, paragraphs: null };
            items.push(item);
            idx++;
            if (idx < lines.length && lines[idx].trim() !== "" && splitLinePrefix(lines[idx]).depth > depth) {
                item.children = parseLevel(depth + 1);
                while (idx < lines.length && lines[idx].trim() !== "") {
                    let next = splitLinePrefix(lines[idx]);
                    if (next.depth !== depth || next.rest.charAt(0) !== "+") break;
                    if (!item.paragraphs) item.paragraphs = [item.html];
                    item.paragraphs.push(next.rest.slice(1).replace(/^\s*/, ""));
                    idx++;
                }
            }
        }
        return items;
    }
    function itemsToHTML(items) {
        if (!items.length) return "";
        let isOrdered = items.some(item => item.ordered);
        let tag = isOrdered ? "ol" : "ul";
        let lisHTML = items.map(item => {
            let inner = item.paragraphs
                ? item.paragraphs.map(p => `<p>${p}</p>`).join("")
                : item.html;
            if (item.children && item.children.length) inner += itemsToHTML(item.children);
            return `<li>${inner}</li>`;
        }).join("");
        return `<${tag}>${lisHTML}</${tag}>`;
    }
    return itemsToHTML(parseLevel(0));
}

// Reverse of buildListFromLines: walks a <ul>/<ol> DOM tree back into the
// dash/"#"/"+" text syntax, so editing or reloading an accordion round-trips
// nested lists, ordered lists and multi-paragraph items without flattening them.
function serializeList(listEl, depth) {
    if (!listEl) return [];
    let isOrdered = listEl.tagName === "OL";
    let lines = [];
    let liEls = Array.prototype.slice.call(listEl.children).filter(el => el.tagName === "LI");
    let prefix = depth > 0 ? new Array(depth + 1).join("-") + " " : "";
    liEls.forEach(li => {
        let marker = isOrdered ? "# " : "";
        let nestedList = li.querySelector(":scope > ul, :scope > ol");
        let paragraphs = Array.prototype.slice.call(li.querySelectorAll(":scope > p"));
        if (paragraphs.length) {
            paragraphs.forEach((p, pi) => {
                lines.push(prefix + (pi === 0 ? marker : "+") + p.innerHTML);
            });
        } else {
            let clone = li.cloneNode(true);
            let clonedNested = clone.querySelector(":scope > ul, :scope > ol");
            if (clonedNested) clone.removeChild(clonedNested);
            lines.push(prefix + marker + clone.innerHTML.trim());
        }
        if (nestedList) lines = lines.concat(serializeList(nestedList, depth + 1));
    });
    return lines;
}

function createAccordion(head = "", body = []) {
    // Returns a container with the title and the collapsible content.
    return new Promise((res, rej) => {
        let contAccr = document.createElement("div");
        contAccr.classList.add("cont-accr")

        // Create accordion title.
        let accrHead = document.createElement("div");
        accrHead.classList.add("accr-head");
        let svgTrash = document.createElementNS("http://www.w3.org/2000/svg", "svg");
        svgTrash.classList.add("trash");
        svgTrash.setAttribute("viewBox", "0 0 10 10");
        let useTrash = document.createElementNS("http://www.w3.org/2000/svg", "use");
        useTrash.setAttributeNS("http://www.w3.org/1999/xlink", "xlink:href", "#trashcan");
        useTrash.style.pointerEvents = "none";
        svgTrash.appendChild(useTrash);
        svgTrash.addEventListener("click", () => {
            let contAccr = svgTrash.closest(".cont-accr");
            let parent = contAccr.parentElement;
            parent.removeChild(contAccr);
        }, { once: true });
        let h3Title = document.createElement("h3");
        h3Title.classList.add("accr-title");
        // h3Title.innerText = head;
        h3Title.innerHTML = head;

        let spanArrow = document.createElement("span");
        spanArrow.classList.add("accr-arrow");
        let svgArrowDown = document.createElementNS("http://www.w3.org/2000/svg", "svg");
        svgArrowDown.setAttribute("viewBox", "0 0 10 10");
        let useArrowDown = document.createElementNS("http://www.w3.org/2000/svg", "use");
        useArrowDown.setAttributeNS('http://www.w3.org/1999/xlink', 'xlink:href', '#chevDown');
        svgArrowDown.appendChild(useArrowDown);
        spanArrow.appendChild(svgArrowDown);
        accrHead.appendChild(svgTrash);
        accrHead.appendChild(h3Title);
        accrHead.appendChild(spanArrow);
        contAccr.appendChild(accrHead);

        // Create accordion body.
        let accrWrapperBody = document.createElement("div");
        accrWrapperBody.classList.add("accr-wrapper-body");
        let accrBody = document.createElement("div");
        accrBody.classList.add("accr-body");
        accrBody.innerHTML = buildListFromLines(body);
        accrWrapperBody.appendChild(accrBody);
        contAccr.appendChild(accrWrapperBody);

        accrHead.addEventListener("click", (evt) => {
            if (evt.target.classList.contains("trash")) return;
            let accordions = accrHead.closest(".accordions");
            let arrAccr = accordions.querySelectorAll(".cont-accr");
            for (let i = 0; i < arrAccr.length; i++) {
                const accr = arrAccr[i];
                accr.classList.remove("active");
            }
            accrHead.closest(".cont-accr").classList.add("active");
        });
        res(contAccr);
    });
}

// FUNCTIONS
function getAddedRGB(colorStr, bool255cap, ...args) {
    let addR, addG, addB;
    switch (args.length) {
        case 1:
            addR = addG = addB = args[0];
            break;
        case 2:
            console.log("Either 1 argument to add to all, or 3 arguments to add individually are required.");
            return;
        case 3:
            addR = args[0];
            addG = args[1];
            addB = args[2];
            break;
        default:
            break;
    }

    let obj = getObjRgb(colorStr);
    obj.r = zeroTo255Loop(obj.r, addR, bool255cap);
    obj.g = zeroTo255Loop(obj.g, addG, bool255cap);
    obj.b = zeroTo255Loop(obj.b, addB, bool255cap);
    return `rgb(${obj.r}, ${obj.g}, ${obj.b})`;
}

function getObjRgb(color) {
    let element = document.createElement("div");
    element.style.backgroundColor = color;
    element.style.display = "none";
    document.body.appendChild(element);
    let rgbStr = window.getComputedStyle(element).backgroundColor;
    // rgb(255, 255, 255)
    document.body.removeChild(element);
    let rgbRegex = /rgb\(\s*(\d+),\s*(\d+),\s*(\d+)\)/;
    let match = rgbStr.match(rgbRegex);
    if (!match) throw new Error('Invalid RGB color code');
    return {
        r: parseInt(match[1]),
        g: parseInt(match[2]),
        b: parseInt(match[3])
    };
}

function zeroTo255Loop(value, addend, bool255cap) {
    if (addend > 255) addend = addend % 255;
    let n = value + addend;
    if (bool255cap) {
        if (n < 0) return 0;
        if (n > 255) return 255
    }
    if (n < 0) return 255 + n;
    if (n > 255) return n - 255
    return n;
}

// DIALOGS


const bodyDiagInfo = document.getElementById("diagInfo");
const topbarBtnInfo = document.getElementById("topbarBtnInfo");

const diagInfo = new AutoDialog({
    dialog: bodyDiagInfo,
    title: "Info",
    trigger: topbarBtnInfo,
    ok: false,
    cancel: false
})

const bodyDiagContactme = document.getElementById("diagContactme");
const topbarBtnContactme = document.getElementById("topbarBtnContactme");
const diagContactme = new AutoDialog({
    dialog: bodyDiagContactme,
    title: "Contactarme",
    trigger: topbarBtnContactme,
    ok: false,
    cancel: false
})
topbarBtnContactme.addEventListener("click", () => {
    let body = bodyDiagContactme.querySelector(".body");
    let sel = window.getSelection();
    let range = new Range();
    range.selectNodeContents(body);
    sel.removeAllRanges();
    sel.addRange(range);
})
