// HTML ➔ Add a DIALOG element with  the following structure:
// <dialog>
//      <div class="body">
//          Lorem ipsum dolor.
//      </div>
// </dialog>
// A wrapper will be creted with margin=0. Padding of Dialog will be set to 0. The following children will be created inside .wrapper:
// <div class="container-title">
//      <span class="title"></span>
//      <span class="x-it"></span>
//  </div >
//  <div class="body"></div>
//  <div class="footer">
//      <button>OK</button>
//      <button>Cancel</button>
//  </div >

// JS ➔ Use this parameters when creating a new instance of the AutoDialog class.
// params = {
//     dialog: dialogModal01,
//     title: "The title of the modal",
//     trigger: btnToShowModal,
//     ok: false, //  Button OK will be disabled. true by defaul.
//     cancel: false, //  Button cancel  will be disabled. true by defaul.
//     glyph: stringName, //  Name of the glyph to be used as the upper right close button. 'times' (the multiplication symbol ×) by default.
// }

// Color given to .body via CSS will be used to create the rest of the styles. If color is not specified (or equal to 'rgba(0, 0, 0, 0)'), no style will be applied.

var fxOk, fxCancel, fxClose;
var dialog, wrapper, divTitle, divBody, divFooter;
var spanTitle, spanX, glyph;
var boolOk, btnOk, boolCancel, btnCancel;
var color, colorDarker, colorDarkest, colorLigher, rgba, r, g, b;
var btnTrigger;

// params: dialog, title, ok, cancel 
class AutoDialog {
    constructor(params) {
        btnTrigger = params.trigger;

        params.dialog.style.position = "absolute";
        params.dialog.style.padding = "0";
        params.dialog.style.margin = "0";
        params.dialog.style.borderRadius = "0.5rem";
        params.dialog.style.overflow = "hidden";
        params.dialog.style.top = "50vh";
        params.dialog.style.left = "50vw";
        params.dialog.style.transform = "translate(-50%, -50%)";

        divBody = params.dialog.querySelector(".body");

        wrapper = document.createElement("div");
        wrapper.classList.add("wrapper");
        wrapper.style.margin = "0";
        wrapper.style.position = "relative";
        wrapper.appendChild(divBody);

        boolOk = (typeof params.ok == "boolean") ? params.ok : true;
        boolCancel = (typeof params.cancel == "boolean") ? params.cancel : true;

        if (params.title !== undefined) {
            glyph = (params.glyph !== undefined) ? params.glyph : "times";
            divTitle = document.createElement("div");
            divTitle.classList.add("container-title");
            divTitle.style.width = "100%";
            divTitle.style.display = "flex";
            divTitle.style.justifyContent = "flex-start";
            divTitle.style.alignItems = "stretch";

            spanTitle = document.createElement("span");
            spanTitle.classList.add("title");
            spanTitle.style.paddingTop = "0.3rem";
            spanTitle.style.paddingBottom = "0.3rem";
            spanTitle.style.display = "flex";
            spanTitle.style.justifyContent = "center";
            spanTitle.style.alignItems = "center";
            spanTitle.style.flex = "1";
            spanTitle.innerText = params.title;

            spanX = document.createElement("span");
            spanX.classList.add("x-it");
            spanX.style.paddingTop = "0.3rem";
            spanX.style.paddingBottom = "0.3rem";
            spanX.style.paddingRight = "0.5rem";
            spanX.style.paddingLeft = "0.5rem";
            spanX.style.marginLeft = "auto";
            spanX.style.display = "flex";
            spanX.style.justifyContent = "center";
            spanX.style.alignItems = "center";
            spanX.innerHTML = `&${glyph};`;
            spanX.style.cursor = "pointer";
            spanX.addEventListener("click", () => {
                params.dialog.close();
            });

            divTitle.appendChild(spanTitle);
            divTitle.appendChild(spanX);

            // wrapper.innerHTML = "";
            // if (divTitle !== undefined) wrapper.appendChild(divTitle);
            // if (divBody !== undefined) wrapper.appendChild(divBody);
            wrapper.appendChild(divTitle);
        }

        wrapper.appendChild(divBody);
        
        if (boolCancel || boolOk) {
            divFooter = document.createElement("div");
            divFooter.classList.add("footer");
            divFooter.style.width = "100%";
            divFooter.style.display = "flex";
            divFooter.style.alignItems = "stretch";

            if (boolCancel) {
                btnCancel = document.createElement("button");
                btnCancel.innerText = "Cancel";
                btnCancel.style.flex = "1";
                btnCancel.style.cursor = "pointer";
                btnCancel.style.paddingTop = "0.5rem";
                btnCancel.style.paddingBottom = "0.5rem";
                btnCancel.addEventListener("click", () => {
                    params.dialog.close();
                });

                divFooter.appendChild(btnCancel);
            }
            if (boolOk) {
                btnOk = document.createElement("button");
                btnOk.innerText = "OK";
                btnOk.style.flex = "1";
                btnOk.style.cursor = "pointer";
                btnOk.style.paddingTop = "0.5rem";
                btnOk.style.paddingBottom = "0.5rem";
                btnOk.addEventListener("click", () => {
                    params.dialog.close();
                });

                divFooter.appendChild(btnOk);
            }
            wrapper.appendChild(divFooter);
            // wrapper.innerHTML = "";
            // if (divTitle !== undefined) wrapper.appendChild(divTitle);
            // if (divBody !== undefined) wrapper.appendChild(divBody);
            // if (divFooter !== undefined) wrapper.appendChild(divFooter);
            // wrapper.appendChild(divTitle);
            // wrapper.appendChild(divBody);
        }
        wrapper.style.display = "flex";
        wrapper.style.flexDirection = "column";
        wrapper.style.justifyContent = "stretch";
        wrapper.style.alignItems = "flex-start";

        params.dialog.innerHTML = "";
        params.dialog.appendChild(wrapper);

        if (btnTrigger !== null) btnTrigger.addEventListener("click", () => {
            params.dialog.showModal();
            let toCloseDialog = (evt) => {
                if (evt.target.tagName == "DIALOG") {  //  This is so if the click is in the backdrop, the tagName will be 'DIALOG', otherwise, it will be 'div'.
                    params.dialog.close();
                    document.removeEventListener("click", toCloseDialog, { once: true });
                }
            }
            document.addEventListener("click", toCloseDialog);
        });

        // COLOR
        color = window.getComputedStyle(divBody).backgroundColor;  //  Color in RGBA format.
        if (color !== "rgba(0, 0, 0, 0)") {  //  The default color if no style is set.
            r = parseInt(color.split(",")[0].split("(")[1]);
            g = parseInt(color.split(",")[1]);
            b = parseInt(color.split(",")[2]);
            colorDarker = `rgb(${Math.max(r - 40, 0)}, ${Math.max(g - 40, 0)}, ${Math.max(b - 40, 0)})`;
            colorDarkest = `rgb(${Math.max(r - 80, 0)}, ${Math.max(g - 80, 0)}, ${Math.max(b - 80, 0)})`;
            colorLigher = `rgb(${Math.min(r + 50, 255)}, ${Math.min(g + 50, 255)}, ${Math.min(b + 50, 255)})`;
            params.dialog.style.borderColor = colorDarkest;
            params.dialog.style.outline = "none";
            divTitle.style.backgroundColor = colorLigher;
            if (boolOk || boolCancel) {
                divTitle.style.borderBottom = `2px solid ${colorDarkest}`;
                divFooter.style.backgroundColor = colorDarker;
                divFooter.style.borderTop = `2px solid ${colorDarkest}`;
            }
            if (boolCancel) {
                btnCancel.style.border = "none";
                btnCancel.style.backgroundColor = "transparent";
                btnCancel.style.outline = "none";
                if (boolOk) btnCancel.style.borderRight = `1px solid ${colorDarkest}`;
                btnCancel.addEventListener("pointermove", onHover);
                btnCancel.addEventListener("pointerdown", onActive);
            }
            if (boolOk) {
                btnOk.style.border = "none";
                btnOk.style.backgroundColor = "transparent";
                btnOk.style.outline = "none";
                if (boolCancel) btnOk.style.borderLeft = `1px solid ${colorDarkest}`;
                btnOk.addEventListener("pointermove", onHover);
                btnOk.addEventListener("pointerdown", onActive);
            }
            // The following 2 lines are commented due to other CSS styling.
            // spanX.addEventListener("pointermove", onHover);
            // spanX.addEventListener("pointerdown", onActive);
            // ---------

            // Personalized style done via JS. Add this to CSS if the following 2 lines are removed.
            // dialog {
            //     border-width: 3px;
            //     max-width: 40vw;
            
            //     @media(max-width: 600px) {
            //         border-width: 2px;
            //         max-width: 80vw;
            //     }
            
            //     @media(max-width: 250px) {
            //         border-width: 1px;
            //         min-width: calc(100vw - 3px);
            //         max-width: calc(100vw - 3px);
            //     }
            // }            
            // params.dialog.style.maxWidth = "50vw";
            // params.dialog.style.borderWidth = "3px";
            // ---------
        }

        this.title = spanTitle;
        this.xit = spanX;
        this.btnOk = btnOk;
        this.btnCancel = btnCancel;
    }
    onOk(fx) {
        if (fx !== undefined && btnOk !== undefined) btnOk.addEventListener("click", fx);
    }
    onCancel(fx) {
        if (fx !== undefined && btnCancel !== undefined) btnCancel.addEventListener("click", fx);
    }
    onClose(fx) {
        if (fx !== undefined) fxClose = fx;
    }
}


function onHover(evt) {
    evt.currentTarget.style.backgroundColor = color;
    evt.currentTarget.addEventListener("pointerleave", (leaveEvt) => {
        // console.log(leaveEvt.currentTarget);
        leaveEvt.currentTarget.style.backgroundColor = "transparent";
        // leaveEvt.currentTarget.removeEventListener(onHover, { once: true });
    });
}
function onActive(evt) {
    evt.currentTarget.style.backgroundColor = colorLigher;
    evt.currentTarget.addEventListener("pointerleave", (leaveEvt) => {
        // console.log(leaveEvt.currentTarget);
        leaveEvt.currentTarget.style.backgroundColor = "transparent";
        // leaveEvt.currentTarget.removeEventListener(onHover, { once: true });
    });
}
