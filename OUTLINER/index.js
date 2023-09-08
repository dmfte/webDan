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

    let title = itTitle.value;
    let html1 = '<!DOCTYPE html> <html lang="en"> <head> <meta charset="UTF-8"> <meta name="viewport" content="width=device-width, initial-scale=1.0"> <title>' + title + '</title> </head> <body> <div class="container"> <div class="bar"> <div class="btn fontsize" tabindex="0"> A<span style="font-size:0.7em;">A</span> <div class="cont rs" id="contRsFontsize"> <div class="wrapper"></div> </div> </div> <div class="outline-title">';
    let html2 = '</div> <div class="stopwatch"> <svg viewBox="0 0 32 16" xmlns="http://www.w3.org/1999/xhtml" xmlns:svg="http://www.w3.org/2000/svg"> <filter id="blur"> <feGaussianBlur in="SourceGraphic" stdDeviation="0.5" /> </filter> <g id="minsd" class="d8"> <path id="m1" d="M 2 3 V 7 "></path> <path id="m2" d="M 2 9 V 13"></path> <path id="m3" d="M 3 14 H 6"></path> <path id="m4" d="M 7 13 V 9"></path> <path id="m5" d="M 7 7 V 3"></path> <path id="m6" d="M 3 2 H 6"></path> <path id="m7" d="M 3 8 H 6"></path> </g> <g id="minsu" class="d8"> <path id="m1" d="M 9 3 V 7"></path> <path id="m2" d="M 9 9 V 13"></path> <path id="m3" d="M 10 14 H 13"></path> <path id="m4" d="M 14 13 V 9"></path> <path id="m5" d="M 14 7 V 3"></path> <path id="m6" d="M 10 2 H 13"></path> <path id="m7" d="M 10 8 H 13"></path> </g> <g id="colon"> <path d="M 16 7 V 5 M 16 9 V 11"></path> </g> <g id="secsd" class="d8"> <path id="m1" d="M 18 3 V 7"></path> <path id="m2" d="M 18 9 V 13"></path> <path id="m3" d="M 19 14 H 22"></path> <path id="m4" d="M 23 13 V 9"></path> <path id="m5" d="M 23 7 V 3"></path> <path id="m6" d="M 19 2 H 22"></path> <path id="m7" d="M 19 8 H 22"></path> </g> <g id="secsu" class="d8"> <path id="m1" d="M 25 3 V 7"></path> <path id="m2" d="M 25 9 V 13"></path> <path id="m3" d="M 26 14 H 29"></path> <path id="m4" d="M 30 13 V 9"></path> <path id="m5" d="M 30 7 V 3"></path> <path id="m6" d="M 26 2 H 29"></path> <path id="m7" d="M 26 8 H 29"></path> </g> </svg> </div> </div> <div class="accordions" tabindex="0">';
    let accordionsHTML = div0.innerHTML;
    document.body.removeChild(div0);
    let html3 = '</div> </div> <svg class="svg-symbols"> <defs> <g class="ico"> <symbol id="chevDown" viewBox="0 0 10 10"> <path class="stay" fill="none" d="M 1 2 L 5 5 L 9 2" /> <path class="gone" fill="none" d="M 1 6 L 5 9 L 9 6" /> </symbol> <symbol id="chevUp" viewBox="0 0 10 10"> <path class="stay" fill="none" d="M 1 5 L 5 2 L 9 5" /> <path class="gone" fill="none" d="M 1 9 L 5 6 L 9 9" /> </symbol> </g> <g class="stopw"> <symbol id="matrix" viewBox="1 1 8 16" class="d0"> <path id="m1" d="M 2 3 V 7 "></path> <path id="m2" d="M 2 9 V 13"></path> <path id="m3" d="M 3 14 H 6"></path> <path id="m4" d="M 7 13 V 9"></path> <path id="m5" d="M 7 7 V 3"></path> <path id="m6" d="M 3 2 H 6"></path> <path id="m7" d="M 3 8 H 6"></path> </symbol> </g> </defs> </svg> <dialog id="modPopup"> <div class="body"> <div class="body-cont content"></div> </div> </dialog>';
    let css = '<style> * { margin: 0; padding: 0; box-sizing: border-box; user-select: none; } :root { --dialog-body: ' +
        dialog_body + '; --dialog-color: ' +
        dialog_color + '; --controls-bg: rgb(97, 103, 122); --controls-color: rgb(216, 217, 218);' +
        ' --accr-bg: ' + accr_bg +
        '; --accr-border: ' + accr_border +
        '; --accr-border-lit: ' + accr_border_lit +
        '; --accr-head-color: ' + accr_head_color +
        '; --accr-body-color: ' + accr_body_color +
        '; --accr-container-bg: ' + accr_preview_bg +
        '; --fontsize-bg: rgb(188, 181, 112); --fontsize-color: rgb(67, 74, 143); --accr-padding: 5px; --bar-height: 50px; } body, html { width: 100%; height: 100%; overscroll-behavior: none; } svg { max-width: 100%; max-height: 100%; } .svg-symbols { display: none; } g.ico symbol { stroke: currentColor; stroke-width: 1.5; stroke-linejoin: miter; stroke-linecap: round; } @media (max-width: 600px) { g.ico symbol .gone { display: none; } } .stopwatch svg g { fill: none; stroke-linecap: round; stroke-width: 1.2; } .stopwatch svg g#colon { stroke: currentColor; } .stopwatch g.d0 #m1, .stopwatch g.d0 #m2, .stopwatch g.d0 #m3, .stopwatch g.d0 #m4, .stopwatch g.d0 #m5, .stopwatch g.d0 #m6 { stroke: currentColor; } .stopwatch g.d1 #m4, .stopwatch g.d1 #m5 { stroke: currentColor; } .stopwatch g.d2 #m6, .stopwatch g.d2 #m5, .stopwatch g.d2 #m7, .stopwatch g.d2 #m2, .stopwatch g.d2 #m3 { stroke: currentColor; } .stopwatch g.d3 #m6, .stopwatch g.d3 #m5, .stopwatch g.d3 #m7, .stopwatch g.d3 #m4, .stopwatch g.d3 #m3 { stroke: currentColor; } .stopwatch g.d4 #m1, .stopwatch g.d4 #m7, .stopwatch g.d4 #m5, .stopwatch g.d4 #m4 { stroke: currentColor; } .stopwatch g.d5 #m6, .stopwatch g.d5 #m1, .stopwatch g.d5 #m7, .stopwatch g.d5 #m4, .stopwatch g.d5 #m3 { stroke: currentColor; } .stopwatch g.d6 #m6, .stopwatch g.d6 #m1, .stopwatch g.d6 #m2, .stopwatch g.d6 #m3, .stopwatch g.d6 #m4, .stopwatch g.d6 #m7 { stroke: currentColor; } .stopwatch g.d7 #m6, .stopwatch g.d7 #m5, .stopwatch g.d7 #m4 { stroke: currentColor; } .stopwatch g.d8 { stroke: currentColor; } .stopwatch g.d9 #m7, .stopwatch g.d9 #m1, .stopwatch g.d9 #m6, .stopwatch g.d9 #m5, .stopwatch g.d9 #m4, .stopwatch g.d9 #m3 { stroke: currentColor; } dialog { border-width: 3px; box-shadow: 0 0 15px 2px var(--dialog-body); .wrapper { & .body { background-color: var(--dialog-body); padding: 0.5em; overflow-y: auto; } } } dialog::backdrop { pointer-events: none; background-color: rgb(0, 0, 0); opacity: 0.5; } .container { position: relative; background-color: var(--accr-container-bg); padding: 0; display: flex; flex-direction: column; height: 100%; overflow-y: hidden; & .bar { width: 100%; height: var(--bar-height); display: flex; align-items: stretch; background-color: var(--controls-bg); z-index: 2; & .btn.fontsize { font-weight: bold; } & .btn { position: relative; background-color: var(--fontsize-bg); color: var(--fontsize-color); border-radius: 0.5rem; width: 40px; height: 40px; display: flex; justify-content: center; align-items: center; align-self: center; margin-left: 0.5rem; overflow: hidden; cursor: pointer; & .cont.rs { background-color: slateblue; position: absolute; top: 100%; left: 0; display: flex; align-items: stretch; width: 0; height: 50px; transition: width 300ms ease-in-out; } } & .btn:focus-within { outline: 1px solid black; overflow: visible; & .cont.rs { width: 250px; cursor: default; & .wrapper { flex: 1; } } } & .outline-title { display: flex; flex: 1; height: 100%; color: var(--controls-color); padding: 0.3rem 1rem; font-size: 1rem; overflow-y: auto; } & .stopwatch { background-color: rgb(26, 8, 8); color: rgb(85, 27, 27); width: 150px; height: 100%; text-align: center; display: flex; justify-content: center; align-items: stretch; cursor: pointer; & svg { pointer-events: none; } } & .stopwatch.active { color: rgb(183, 1, 1); } & .stopwatch.paused { color: rgb(183, 1, 1); } } & .accordions { outline: none; display: flex; flex-direction: column; top: calc(var(--bar-height) + 0.5rem); margin: 0 1rem; flex: 1; overflow-y: auto; & .cont-accr::before { pointer-events: none; content: ""; position: absolute; border-width: 3px; border-style: solid; border-color: var(--accr-border); border-radius: 1rem; top: var(--accr-padding); right: var(--accr-padding); bottom: var(--accr-padding); left: var(--accr-padding); } & .cont-accr.active::before { border-color: var(--accr-border-lit); transition: border-color 500ms ease-in-out; } & .cont-accr.active { z-index: 1; & .accr-wrapper-body { max-height: 50vh; overflow-y: auto; transition: max-height 500ms ease-in-out; border-radius: 0 0 13px 13px; & .accr-head { color: var(--accr-head-lit-color); } & .accr-body { background-color: var(--accr-border-lit); transition: background-color 500ms ease-in-out; } } } & .cont-accr { position: relative; background-color: var(--accr-bg); border-radius: 1rem; padding: var(--accr-padding); margin-bottom: 2px; & .accr-head { position: relative; display: flex; align-items: stretch; padding: 0.5em; font-size: 1em; color: var(--accr-head-color); cursor: pointer; & svg.trash { display: none; } & .accr-title { text-align: center; flex: 1; } & .accr-arrow { display: flex; width: 0.7em; padding: 0.2em; } } & .accr-wrapper-body { margin: 0; padding: 0; overflow: hidden; max-height: 0; & .accr-body { padding: 0.7em 2rem; border-radius: 0 0 1.1rem 1.1rem; color: var(--accr-body-color); background-color: var(--accr-border); & li { list-style: circle outside; margin-left: 0.8em; & span.show-popup { text-decoration: underline; color: rgb(0, 0, 255); cursor: pointer; } } } } } } } </style> <!-- Styles for RangeSlider. --> <style> * { margin: 0; padding: 0; box-sizing: border-box; } .slider { display: grid; grid-template-areas: "name name name" "min track max"; grid-template-columns: 1fr 7fr 1fr; grid-template-rows: auto auto; border-radius: 0.5rem; width: 100%; height: 100%; padding: 0.2rem; } .label { grid-area: name; display: flex; justify-content: flex-start; align-items: center; padding-left: 1rem; } .min-container { grid-area: min; display: flex; justify-content: flex-end; align-items: center; } .min-container .min { border-radius: 50% 0 0 50%; height: 75%; display: flex; justify-content: center; align-items: center; flex: 1; font-size: 0.9em; user-select: none; cursor: pointer; } .min-container .min:active { transform: scale(0.8); } .max-container { grid-area: max; display: flex; justify-content: flex-start; align-items: center; } .max-container .max { background-color: var(--color1-variation); border-radius: 0 50% 50% 0; height: 75%; display: flex; justify-content: center; align-items: center; flex: 1; font-size: 0.9em; user-select: none; cursor: pointer; } .max-container .max:active { transform: scale(0.8); } .track-container { margin: 0 0.3rem; grid-area: track; display: flex; align-items: center; } .track-container .track { position: relative; width: 100%; height: 75%; user-select: none; cursor: pointer; touch-action: none; } .track-container .track .tooltip { display: none; position: absolute; border: none; border-radius: 30% 30% 0 0; padding: 0.2rem 0.4rem; min-width: 2.5rem; height: 1.5rem; background-color: lightyellow; transform: translate(-50%, -120%); display: flex; opacity: 0; justify-content: center; align-items: center; z-index: 99; } .track-container .track .tooltip::before { content: ""; position: absolute; width: 0; height: 0; border-width: 10px; border-style: solid; border-color: lightyellow transparent transparent transparent; top: 95%; } </style>';
    let jsScript1 = '<script>';
    let jsClass1 = 'class AutoDialog { constructor(params) { this.dialog = params.dialog; this.backdropclose = (params.backdropclose == undefined) ? true : params.backdropclose; this.fx = params.fx; let wrapper, divTitle, divBody, divFooter; let h2Title, spanX, glyph; let boolOk, btnOk, boolCancel, btnCancel; let color, colorDarker, colorDarkest, colorLigher, r, g, b; let btnTrigger; btnTrigger = params.trigger; this.dialog.style.position = "absolute"; this.dialog.style.top = "50vh"; this.dialog.style.left = "50vw"; this.dialog.style.transform = "translate(-50%, -50%)"; this.dialog.style.padding = "0"; this.dialog.style.borderRadius = "0.5rem"; this.dialog.style.overflow = "hidden"; divBody = this.dialog.querySelector(".body"); divBody.style.display = "flex"; divBody.style.flex = "1"; wrapper = document.createElement("div"); wrapper.classList.add("wrapper"); wrapper.style.position = "relative"; wrapper.style.minWidth = "30vw"; wrapper.style.minHeight = "30vh"; wrapper.style.maxWidth = "80vw"; wrapper.style.maxHeight = "70vh"; wrapper.style.margin = "0"; wrapper.style.display = "flex"; wrapper.style.flexDirection = "column"; boolOk = (typeof params.ok == "boolean") ? params.ok : true; boolCancel = (typeof params.cancel == "boolean") ? params.cancel : true; let onHover = (evt) => { if (evt.currentTarget.classList.contains("modFootBtn")) { evt.currentTarget.style.backgroundColor = color; evt.currentTarget.addEventListener("pointerleave", (leaveEvt) => { leaveEvt.currentTarget.style.backgroundColor = "transparent"; }, { once: true }); return; }; if (evt.currentTarget.classList.contains("x-it")) { evt.currentTarget.style.scale = "1.5"; evt.currentTarget.style.rotate = "360deg"; evt.currentTarget.style.fontWeight = "bold"; evt.currentTarget.addEventListener("pointerleave", (leaveEvt) => { leaveEvt.currentTarget.style.scale = "1"; leaveEvt.currentTarget.style.rotate = "0deg"; leaveEvt.currentTarget.style.fontWeight = "regular"; }, { once: true }); return; } }; let onActive = (evt) => { if (evt.currentTarget.classList.contains("modFootBtn")) { evt.currentTarget.style.backgroundColor = colorLigher; evt.currentTarget.addEventListener("pointerup", (leaveEvt) => { leaveEvt.currentTarget.style.backgroundColor = "transparent"; }, { once: true }); return; }; if (evt.currentTarget.classList.contains("x-it")) { evt.currentTarget.style.fontWeight = "bolder"; evt.currentTarget.addEventListener("pointerup", (leaveEvt) => { leaveEvt.currentTarget.style.fontWeight = "normal"; }, { once: true }); return; } }; if (params.title !== undefined) { glyph = (params.glyph !== undefined) ? params.glyph : "times"; divTitle = document.createElement("div"); divTitle.classList.add("container-title"); divTitle.style.display = "flex"; divTitle.style.justifyContent = "flex-start"; divTitle.style.alignItems = "stretch"; divTitle.style.overflow = "hidden"; h2Title = document.createElement("h2"); h2Title.classList.add("title"); h2Title.style.paddingTop = "0.3rem"; h2Title.style.paddingBottom = "0.3rem"; h2Title.style.display = "flex"; h2Title.style.justifyContent = "center"; h2Title.style.alignItems = "center"; h2Title.style.flex = "1"; h2Title.style.fontSize = "1em"; h2Title.innerText = params.title; spanX = document.createElement("span"); spanX.classList.add("x-it"); spanX.style.marginLeft = "auto"; spanX.style.width = "2rem"; spanX.style.display = "flex"; spanX.style.justifyContent = "center"; spanX.style.alignItems = "center"; spanX.style.transition = "rotate 800ms ease-in-out"; spanX.innerHTML = ` &${glyph};`; spanX.style.cursor = "pointer"; spanX.addEventListener("click", () => { this.dialog.close(); }); spanX.addEventListener("pointermove", onHover); spanX.addEventListener("pointerdown", onActive); divTitle.appendChild(h2Title); divTitle.appendChild(spanX); wrapper.appendChild(divTitle); }; wrapper.appendChild(divBody); if (boolCancel || boolOk) { divFooter = document.createElement("div"); divFooter.classList.add("footer"); divFooter.style.display = "flex"; divFooter.style.alignItems = "stretch"; divFooter.style.height = "1.5rem"; if (boolCancel) { btnCancel = document.createElement("button"); btnCancel.classList.add("modFootBtn"); btnCancel.innerText = "Cancel"; btnCancel.style.flex = "1"; btnCancel.style.cursor = "pointer"; btnCancel.style.paddingTop = "0.5rem"; btnCancel.style.paddingBottom = "0.5rem"; btnCancel.style.fontSize = "1em"; btnCancel.addEventListener("click", () => { this.dialog.close(); }); divFooter.appendChild(btnCancel); }; if (boolOk) { btnOk = document.createElement("button"); btnOk.classList.add("modFootBtn"); btnOk.innerText = "OK"; btnOk.style.fontSize = "1em"; btnOk.style.flex = "1"; btnOk.style.cursor = "pointer"; btnOk.style.paddingTop = "0.5rem"; btnOk.style.paddingBottom = "0.5rem"; btnOk.addEventListener("click", () => { this.dialog.close(); }); divFooter.appendChild(btnOk); }; wrapper.appendChild(divFooter); }; this.dialog.innerHTML = ""; this.dialog.appendChild(wrapper); if (btnTrigger !== undefined) btnTrigger.addEventListener("pointerup", () => { this.show(); }); color = window.getComputedStyle(divBody).backgroundColor; if (color !== "rgba(0, 0, 0, 0)") { r = parseInt(color.split(",")[0].split("(")[1]); g = parseInt(color.split(",")[1]); b = parseInt(color.split(",")[2]); colorDarker = `rgb(${Math.max(r - 40, 0)}, ${Math.max(g - 40, 0)}, ${Math.max(b - 40, 0)})`; colorDarkest = `rgb(${Math.max(r - 80, 0)}, ${Math.max(g - 80, 0)}, ${Math.max(b - 80, 0)})`; colorLigher = `rgb(${Math.min(r + 50, 255)}, ${Math.min(g + 50, 255)}, ${Math.min(b + 50, 255)})`; this.dialog.style.borderColor = colorDarkest; this.dialog.style.outline = "none"; divTitle.style.backgroundColor = colorLigher; if (boolOk || boolCancel) { divTitle.style.borderBottom = `2px solid ${colorDarkest}`; divFooter.style.backgroundColor = colorDarker; divFooter.style.borderTop = `2px solid ${colorDarkest}`; }; if (boolCancel) { btnCancel.style.border = "none"; btnCancel.style.backgroundColor = "transparent"; btnCancel.style.outline = "none"; if (boolOk) btnCancel.style.borderRight = `1px solid ${colorDarkest}`; btnCancel.addEventListener("pointermove", onHover); btnCancel.addEventListener("pointerdown", onActive); }; if (boolOk) { btnOk.style.border = "none"; btnOk.style.backgroundColor = "transparent"; btnOk.style.outline = "none"; if (boolCancel) btnOk.style.borderLeft = `1px solid ${colorDarkest}`; btnOk.addEventListener("pointermove", onHover); btnOk.addEventListener("pointerdown", onActive); } }; this.body = divBody; this.btnOk = btnOk; this.btnCancel = btnCancel; } show() { if (this.fx !== undefined) this.fx(); this.dialog.showModal(); if (this.backdropclose) { let toCloseDialog = (evt) => { if (evt.target.tagName == "DIALOG") { this.dialog.close(); document.body.removeEventListener("click", toCloseDialog); } }; document.body.addEventListener("pointerdown", toCloseDialog.bind(this)); } } close() { this.dialog.close(); } onOk(fx) { if (fx !== undefined && this.btnOk !== undefined) this.btnOk.addEventListener("click", fx); } onCancel(fx) { if (fx !== undefined && this.btnCancel !== undefined) this.btnCancel.addEventListener("click", fx); } onClose(fx) { if (fx !== undefined) fxClose = fx; } }';
    let jsClass2 = 'class RangeSlider { constructor(container, paramsOjb) { this.f; this.label = paramsOjb.label; this.min = Number(paramsOjb.min); this.max = Number(paramsOjb.max); this.step = Number(paramsOjb.step); this.max1 = this.max + this.step; this.def = Number(paramsOjb.def); this.prevVal = Number(paramsOjb.def); this.val; this.color1 = paramsOjb.color1 !== undefined ? paramsOjb.color1 : "rgb(45, 110, 115)"; this.color2 = paramsOjb.color2 !== undefined ? paramsOjb.color2 : "rgb(120, 185, 200)"; let colorBg = getAddedRGB(this.color1, -100); let colorFontLabel = getAddedRGB(this.color2, 0); let colorFontBtns = getAddedRGB(this.color1, -150); let colorBtns = getAddedRGB(this.color1, 30); let colorBtnsHover = getAddedRGB(this.color1, 50); this.el = { container: container, slider: document.createElement("div"), label: document.createElement("div"), minContainer: document.createElement("div"), min: document.createElement("div"), maxContainer: document.createElement("div"), max: document.createElement("div"), trackContainer: document.createElement("div"), track: document.createElement("div"), tooltip: document.createElement("div") }; this.el.slider.classList.add("slider"); this.el.label.classList.add("label"); this.el.minContainer.classList.add("min-container"); this.el.maxContainer.classList.add("max-container"); this.el.trackContainer.classList.add("track-container"); this.el.min.classList.add("min"); this.el.max.classList.add("max"); this.el.track.classList.add("track"); this.el.tooltip.classList.add("tooltip"); this.el.label.innerText = `${this.label}:`; this.el.min.innerText = this.min.toFixed(getDecimalOrder(this.step)); this.el.max.innerText = this.max.toFixed(getDecimalOrder(this.step)); this.el.tooltip.innerText = this.max.toFixed(getDecimalOrder(this.step)); this.el.slider.style.backgroundColor = colorBg; this.el.label.style.color = colorFontLabel; this.el.min.style.backgroundColor = colorBtns; this.el.min.style.color = colorFontBtns; this.el.min.style.fontWeight = "bold"; this.el.max.style.backgroundColor = colorBtns; this.el.max.style.color = colorFontBtns; this.el.max.style.fontWeight = "bold"; this.el.track.appendChild(this.el.tooltip); this.el.trackContainer.appendChild(this.el.track); this.el.minContainer.appendChild(this.el.min); this.el.maxContainer.appendChild(this.el.max); this.el.slider.appendChild(this.el.label); this.el.slider.appendChild(this.el.minContainer); this.el.slider.appendChild(this.el.maxContainer); this.el.slider.appendChild(this.el.trackContainer); this.el.container.innerHTML = ""; this.el.container.appendChild(this.el.slider); if (this.def <= this.max && this.def >= this.min) { let perct = (this.def - this.min) / (this.max1 - this.min); this.val = this.def; setValuesInTrack(this.val, this); this.prevVal = this.val; } else { this.val = this.min; setValuesInTrack(this.val, this); this.prevVal = this.min; }; let thisOnClicking = onClicking.bind(this); this.el.track.addEventListener("pointerdown", thisOnClicking); let thisOnMoving = onMoving.bind(this); this.el.track.addEventListener("pointermove", thisOnMoving); this.el.track.addEventListener("pointerenter", () => { this.el.tooltip.style.display = "flex"; this.el.tooltip.style.opacity = 1; }); this.el.track.addEventListener("pointerleave", () => { this.el.tooltip.style.display = "none"; }); let thisStepDown = this.stepDown.bind(this); this.el.min.addEventListener("pointerdown", thisStepDown); this.el.min.addEventListener("pointerdown", () => { this.el.min.style.scale = 0.9; }); this.el.min.addEventListener("pointerup", () => { this.el.min.style.scale = 1; }); this.el.min.addEventListener("pointerenter", () => { this.el.min.style.backgroundColor = colorBtnsHover; }); this.el.min.addEventListener("pointerleave", () => { this.el.min.style.backgroundColor = colorBtns; }); let thisStepUp = this.stepUp.bind(this); this.el.max.addEventListener("pointerdown", thisStepUp); this.el.max.addEventListener("pointerdown", () => { this.el.max.style.scale = 0.9; }); this.el.max.addEventListener("pointerup", () => { this.el.max.style.scale = 1; }); this.el.max.addEventListener("pointerenter", () => { this.el.max.style.backgroundColor = colorBtnsHover; }); this.el.max.addEventListener("pointerleave", () => { this.el.max.style.backgroundColor = colorBtns; }); } onSliding(f) { this.f = f; } stepDown() { if (this.val > this.min) { this.val -= this.step; setValuesInTrack(this.val, this); if (this.f !== undefined) this.f(); this.prevVal = this.val; } } stepUp() { if (this.val < this.max) { this.val += this.step; setValuesInTrack(this.val, this); if (this.f !== undefined) this.f(); this.prevVal = this.val; } } } function onClicking(evt) { let perct = getTrackPositionPerct(evt); if (perct <= 1 && perct >= 0) { this.el.track.setPointerCapture(evt.pointerId); this.val = getStepValueFromPerct(perct, this); if (this.val !== this.prevVal) { setValuesInTrack(this.val, this); if (this.f !== undefined) this.f(); this.prevVal = this.val; }; let thisOnDragging = onDragging.bind(this); this.el.track.addEventListener("pointermove", thisOnDragging); this.el.track.addEventListener("pointerup", () => { this.el.track.removeEventListener("pointermove", thisOnDragging); this.el.track.releasePointerCapture(evt.pointerId); }, { once: true }); } } function setValuesInTrack(num, that) { if (num <= that.max && num >= that.min) { let displayNum = num.toFixed(getDecimalOrder(that.step)); let eachPerct = parseInt(that.step * 100 / (that.max1 - that.min)); let perct = (num - that.min) / (that.max1 - that.min); let perct100 = parseInt(perct * 100); that.el.track.style.background = `linear-gradient(90deg, ${that.color1} ${perct100 + eachPerct}%, ${that.color2} ${perct100 + eachPerct + 2}%)`; that.el.tooltip.style.left = `${perct100}%`; that.el.tooltip.innerText = displayNum; that.el.label.innerText = `${that.label}: ${displayNum}`; } } function onMoving(evt) { let perct = getTrackPositionPerct(evt); if (perct <= 1 && perct >= 0) { let val = getStepValueFromPerct(perct, this); this.el.tooltip.style.left = `${perct * 100}%`; this.el.tooltip.innerText = (val).toFixed(getDecimalOrder(this.step)); } } function onDragging(evt) { let perct = getTrackPositionPerct(evt); if (perct <= 1 && perct >= 0) { this.val = getStepValueFromPerct(perct, this); if (this.val !== this.prevVal) { setValuesInTrack(this.val, this); if (this.f !== undefined) this.f(); this.prevVal = this.val; } } } function getTrackPositionPerct(evt) { let track = evt.target.closest(".slider").querySelector(".track"); let trackW = parseInt(window.getComputedStyle(track).width); let rectL = track.getBoundingClientRect().left; let clientX = evt.clientX; let relPosX = clientX - rectL; let perct = relPosX / trackW; return Number(perct.toFixed(2)); } function getStepValueFromPerct(perct, that) { let range = that.max1 - that.min; let newVal = perct * range + that.min; let newStepValue = getSteppedValue(newVal, that.step); if (newStepValue > that.max) return newStepValue - that.step; if (newStepValue < that.min) return newStepValue + that.step; return newStepValue; } function getSteppedValue(num, step) { let steps = Math.floor(num / step); stepNetVal = steps * step; let gdo = getDecimalOrder(step); return forceDecimals(stepNetVal, gdo); } function forceDecimals(num, decimalOrder) { let hundrFactor = 1; for (let i = 0; i < decimalOrder; i++) { hundrFactor = hundrFactor * 10; } return parseInt(num * hundrFactor) / hundrFactor; } function getDecimalOrder(num) { let arr = (num).toString().split("."); return (arr.length <= 1) ? 0 : (num).toString().split(".")[1].length; } function getRGBcolorObj(txt) { let element = document.createElement("div"); element.style.backgroundColor = txt; element.style.display = "none"; document.body.appendChild(element); let rgbStr = window.getComputedStyle(element).backgroundColor; document.body.removeChild(element); rgb = rgbStr.split(","); if (rgb.length > 3) { rgb.splice(3, rgb.length); }; let regexParenthI = /\\(/; let parenthI = rgb[0].match(regexParenthI).index; rgb[0] = rgb[0].split(""); rgb[0].splice(0, parenthI + 1); rgb[0] = parseInt(rgb[0].join("")); rgb[1] = parseInt(rgb[1]); let regexParenthF = /\\)/; if (rgb[2].match(regexParenthF) !== null) { let parenthF = rgb[2].match(regexParenthF).index; rgb[2] = rgb[2].split(""); rgb[2].splice(parenthF, rgb[2].length); rgb[2] = parseInt(rgb[2].join("")); } else { rgb[2] = parseInt(rgb[2]); } return { r: rgb[0], g: rgb[1], b: rgb[2] }; } function getAddedRGB(colorStr, int) { let obj = getRGBcolorObj(colorStr); obj.r = add255Range(obj.r, int); obj.g = add255Range(obj.g, int); obj.b = add255Range(obj.b, int); return `rgb(${obj.r}, ${obj.g}, ${obj.b})`; } function add255Range(num, addend) { if (num + addend >= 0) { if (num + addend <= 255) { return num + addend; } else { return 255; } } else { return 0; } }';
    let js = 'const accordions = document.querySelectorAll(".cont-accr"); var fontS = window.localStorage.getItem("outlinerFontSize") || 16; setFontSize(fontS); accordions.forEach(header => { let accrHead = header.querySelector(".accr-head"); accrHead.addEventListener("pointerup", async () => { let accordions = accrHead.closest(".accordions"); let arrAccr = accordions.querySelectorAll(".cont-accr"); for (let i = 0; i < arrAccr.length; i++) { const accr = arrAccr[i]; accr.classList.remove("active"); } accrHead.closest(".cont-accr").classList.add("active"); }); }); const popupLinks = document.querySelectorAll("span.show-popup"); const diag = document.getElementById("modPopup"); popupLinks.forEach(link => { link.addEventListener("click", () => { let popup = new AutoDialog({ dialog: diag, title: link.dataset.title, trigger: link, cancel: false, backdropclose: false }); popup.dialog.querySelector(".footer").style.height = "3em"; popup.dialog.querySelector(".modFootBtn").style.fontSize = "1.7em"; popup.dialog.querySelector(".body").innerText = link.dataset.body; popup.show(); }); }); const contRsFontsize = document.querySelector("#contRsFontsize .wrapper"); let docCS = window.getComputedStyle(document.body) || window.getComputedStyle(document.documentElement); var rsFontsize = new RangeSlider(contRsFontsize, { label: "Tamaño", min: 4, max: 40, def: fontS, step: 1, color2: docCS.getPropertyValue("--fontsize-bg"), color1: docCS.getPropertyValue("--fontsize-color") }); rsFontsize.onSliding(() => { fontS = rsFontsize.val; window.localStorage.setItem("outlinerFontSize", fontS); setFontSize(fontS); }); function setFontSize(numSize) { document.querySelector(".accordions").style.fontSize = `${fontS}px`; document.querySelector("dialog").style.fontSize = `${fontS}px`; }; const stopwatch = document.querySelector(".stopwatch"); const svgMinsD = stopwatch.querySelector("#minsd"); const svgMinsU = stopwatch.querySelector("#minsu"); const svgSecsD = stopwatch.querySelector("#secsd"); const svgSecsU = stopwatch.querySelector("#secsu"); var startDate = 0, pauseDate = 0, offset = 0; var startStopwatch; stopwatch.addEventListener("pointerdown", () => { let startHold = Date.now(); let holdDuration = 0; if (!stopwatch.classList.contains("active")) { stopwatch.classList.remove("paused"); stopwatch.classList.add("active"); if (startDate == 0) startDate = Date.now(); if (pauseDate !== 0) offset = Date.now() - pauseDate; startStopwatch = window.setInterval(() => { let mins = (parseInt((Date.now() - startDate - offset) / (1000 * 60)) % 99).toString().padStart(2, "0"); let minsd = mins.split("")[0]; let minsu = mins.split("")[1]; let secs = (parseInt((Date.now() - startDate - offset) / 1000) % 60).toString().padStart(2, "0"); let secsd = secs.split("")[0]; let secsu = secs.split("")[1]; svgMinsD.setAttribute("class", ""); svgMinsD.classList.add(`d${minsd}`); svgMinsU.setAttribute("class", ""); svgMinsU.classList.add(`d${minsu}`); svgSecsD.setAttribute("class", ""); svgSecsD.classList.add(`d${secsd}`); svgSecsU.setAttribute("class", ""); svgSecsU.classList.add(`d${secsu}`); }, 1000); } else { pauseDate = Date.now(); window.clearInterval(startStopwatch); stopwatch.classList.replace("active", "paused"); }; let heldInterval = window.setInterval(() => { holdDuration = Date.now() - startHold; if (holdDuration > 1300) { window.clearInterval(startStopwatch); window.clearInterval(heldInterval); pauseDate = 0; startDate = 0; offset = 0; stopwatch.classList.remove("active", "paused"); stopwatch.querySelectorAll("g").forEach(g => { g.setAttribute("class", "d8"); }); } }, 100); stopwatch.addEventListener("pointerup", () => { window.clearInterval(heldInterval); holdDuration = 0; startHold = 0; }); stopwatch.addEventListener("pointerleave", () => { window.clearInterval(heldInterval); holdDuration = 0; startHold = 0; }); });</script>';
    let jsScript2 = '</script>';
    let html4 = '</body>';

    let fullCode = html1 + title + html2 + accordionsHTML + html3 + css + jsScript1 + jsClass1 + jsClass2 + js + jsScript2 + html4;

    let blob = new Blob([fullCode], { type: "text/html" });
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
        let accrs = doc.querySelectorAll(".cont-accr");
        let overlay = accordions.querySelector(".overlay");
        accordions.innerHTML = "";
        accordions.appendChild(overlay);
        accrs.forEach(async accr => {
            let lis = accr.querySelectorAll(".accr-body li");
            let body = Array.from(lis).map(li => {
                return li.innerHTML;
            });
            let newAccr = await createAccordion(accr.querySelector("h3").innerHTML, body);
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
var accr_bg = "#3a4c7c";  // General color
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
    let strBody = "";
    accrActive.querySelectorAll(".accr-body li").forEach(li => {
        strBody += "\n" + li.innerText;
    });
    let str = accrActive.querySelector(".accr-title").innerText + strBody;
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
        h3Title.innerText = head;

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
        let lis = body.map(line => {
            return `<li>${line}</li>`;
        });
        let innerUl = lis.join("");
        let ul = document.createElement("ul");
        ul.innerHTML = innerUl;
        accrBody.appendChild(ul);
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
