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
//     dialog: dialogModal01,  //  Dialog element.
//     title: "The title of the modal",
//     trigger: btnToShowModal,
//     ok: false, //  Button OK will be disabled. true by defaul.
//     cancel: false, //  Button cancel  will be disabled. true by defaul.
//     glyph: stringName, //  Name of the glyph to be used as the upper right close button. 'times' (the multiplication symbol ×) by default.
//     backropclose: true  //  Sets whether a click on the backdrop will close the modal or not.
// }

// Color given to .body via CSS will be used to create the rest of the styles. If color is not specified (or equal to 'rgba(0, 0, 0, 0)'), no style will be applied.

// Add this to CSS and modify as needed.
// ---------
/* Styles for the dynamically added dialog with AutoDialog.js */
// dialog {
//     border-width: 3px;
//     max-width: 60vw;

//     @media (max-width: 600px) {
//         border-width: 2px;
//         max-width: 80vw;
//     }

//     @media (max-width: 250px) {
//         border-width: 1px;
//         min-width: calc(100vw - 3px);
//         max-width: calc(100vw - 3px);
//     }

//     & .body {
//         background-color: var(--dialog-body);
//         padding: 0.5rem 1rem;

//     }
// }
// ---------



// params: dialog, title, ok, cancel 
class AutoDialog {
    constructor(params) {
        this.dialog = params.dialog;
        this.backdropclose = (params.backdropclose == undefined) ? true : params.backdropclose;

        let wrapper, divTitle, divBody, divFooter;
        let spanTitle, spanX, glyph;
        let boolOk, btnOk, boolCancel, btnCancel;
        let color, colorDarker, colorDarkest, colorLigher, r, g, b;
        let btnTrigger;
        btnTrigger = params.trigger;

        this.dialog.style.position = "absolute";
        this.dialog.style.padding = "0";
        this.dialog.style.margin = "0";
        this.dialog.style.borderRadius = "0.5rem";
        this.dialog.style.overflow = "hidden";
        this.dialog.style.top = "50vh";
        this.dialog.style.left = "50vw";
        this.dialog.style.transform = "translate(-50%, -50%)";

        divBody = this.dialog.querySelector(".body");

        wrapper = document.createElement("div");
        wrapper.classList.add("wrapper");
        wrapper.style.margin = "0";
        wrapper.style.position = "relative";
        wrapper.style.display = "flex";
        wrapper.style.flexDirection = "column";
        wrapper.style.justifyContent = "stretch";
        wrapper.appendChild(divBody);

        boolOk = (typeof params.ok == "boolean") ? params.ok : true;
        boolCancel = (typeof params.cancel == "boolean") ? params.cancel : true;

        let onHover = (evt) => {
            if (evt.currentTarget.classList.contains("modFootBtn")) {
                evt.currentTarget.style.backgroundColor = color;
                evt.currentTarget.addEventListener("pointerleave", (leaveEvt) => {
                    leaveEvt.currentTarget.style.backgroundColor = "transparent";
                }, { once: true });
                return;
            }
            if (evt.currentTarget.classList.contains("x-it")) {
                evt.currentTarget.style.scale = "1.5";
                evt.currentTarget.style.rotate = "360deg";
                evt.currentTarget.style.fontWeight = "bold";
                evt.currentTarget.addEventListener("pointerleave", (leaveEvt) => {
                    leaveEvt.currentTarget.style.scale = "1";
                    leaveEvt.currentTarget.style.rotate = "0deg";
                    leaveEvt.currentTarget.style.fontWeight = "regular";
                }, { once: true });
                return;
            }

        }
        let onActive = (evt) => {
            if (evt.currentTarget.classList.contains("modFootBtn")) {
                evt.currentTarget.style.backgroundColor = colorLigher;
                evt.currentTarget.addEventListener("pointerup", (leaveEvt) => {
                    leaveEvt.currentTarget.style.backgroundColor = "transparent";
                    // leaveEvt.currentTarget.removeEventListener(onHover, { once: true });
                }, { once: true });
                return;
            }
            if (evt.currentTarget.classList.contains("x-it")) {
                evt.currentTarget.style.fontWeight = "bolder";
                evt.currentTarget.addEventListener("pointerup", (leaveEvt) => {
                    leaveEvt.currentTarget.style.fontWeight = "normal";
                }, { once: true });
                return;
            }

        }

        if (params.title !== undefined) {
            glyph = (params.glyph !== undefined) ? params.glyph : "times";
            divTitle = document.createElement("div");
            divTitle.classList.add("container-title");
            // divTitle.style.width = "100%";
            divTitle.style.display = "flex";
            divTitle.style.flex = "1";
            divTitle.style.justifyContent = "flex-start";
            divTitle.style.alignItems = "stretch";
            divTitle.style.overflow = "hidden";  //  So span does not exit the title when rotates.

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
            spanX.style.marginLeft = "auto";
            spanX.style.width = "2rem";
            spanX.style.display = "flex";
            spanX.style.justifyContent = "center";
            spanX.style.alignItems = "center";
            spanX.style.fontFamily = "'Times New Roman', Times, serif";  //  For the 'times' character to rotate exactly by the center.
            spanX.style.transition = "rotate 800ms ease-in-out";

            spanX.innerHTML = `    &${glyph};`;
            spanX.style.cursor = "pointer";
            spanX.addEventListener("click", () => {
                this.dialog.close();
            });
            spanX.addEventListener("pointermove", onHover);
            spanX.addEventListener("pointerdown", onActive);

            divTitle.appendChild(spanTitle);
            divTitle.appendChild(spanX);

            wrapper.appendChild(divTitle);
        }

        wrapper.appendChild(divBody);

        if (boolCancel || boolOk) {
            divFooter = document.createElement("div");
            divFooter.classList.add("footer");
            // divFooter.style.width = "100%";
            divFooter.style.display = "flex";
            divFooter.style.flex = "1";
            divFooter.style.alignItems = "stretch";

            if (boolCancel) {
                btnCancel = document.createElement("button");
                btnCancel.classList.add("modFootBtn");
                btnCancel.innerText = "Cancel";
                btnCancel.style.flex = "1";
                btnCancel.style.cursor = "pointer";
                btnCancel.style.paddingTop = "0.5rem";
                btnCancel.style.paddingBottom = "0.5rem";
                btnCancel.addEventListener("click", () => {
                    this.dialog.close();
                });

                divFooter.appendChild(btnCancel);
            }
            if (boolOk) {
                btnOk = document.createElement("button");
                btnOk.classList.add("modFootBtn");
                btnOk.innerText = "OK";
                btnOk.style.flex = "1";
                btnOk.style.cursor = "pointer";
                btnOk.style.paddingTop = "0.5rem";
                btnOk.style.paddingBottom = "0.5rem";
                btnOk.addEventListener("click", () => {
                    this.dialog.close();
                });

                divFooter.appendChild(btnOk);
            }
            wrapper.appendChild(divFooter);
        }
        // wrapper.style.display = "flex";
        // wrapper.style.flexDirection = "column";
        // wrapper.style.justifyContent = "stretch";
        // wrapper.style.alignItems = "flex-start";

        this.dialog.innerHTML = "";
        this.dialog.appendChild(wrapper);

        if (btnTrigger !== undefined) btnTrigger.addEventListener("pointerup", () => {
            this.show();
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
            this.dialog.style.borderColor = colorDarkest;
            this.dialog.style.outline = "none";
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
        }
        this.body = divBody;
        // this.title = spanTitle;
        // this.xit = spanX;
        this.btnOk = btnOk;
        this.btnCancel = btnCancel;
    }
    show() {
        this.dialog.showModal();
        if (this.backdropclose) {
            let toCloseDialog = (evt) => {
                if (evt.target.tagName == "DIALOG") {  //  This is so if the click is in the backdrop, the tagName will be 'DIALOG', otherwise, it will be 'div'.
                    this.dialog.close();
                    document.body.removeEventListener("click", toCloseDialog);
                }
            }
            document.body.addEventListener("pointerdown", toCloseDialog.bind(this));
        }
    }
    close() {
        this.dialog.close();
    }
    onOk(fx) {
        if (fx !== undefined && this.btnOk !== undefined) this.btnOk.addEventListener("click", fx);
    }
    onCancel(fx) {
        if (fx !== undefined && this.btnCancel !== undefined) this.btnCancel.addEventListener("click", fx);
    }
    onClose(fx) {
        if (fx !== undefined) fxClose = fx;
    }


}



