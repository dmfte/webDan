const editBody = document.querySelector(".cont.edit .collapsible #taCollapsible");
const accordions = document.querySelector(".accordions");
const btnPass = document.querySelector(".cont.edit .buttons .pass");
const cmSelection = document.querySelector(".context-menu.selection");

const arrContextMenuBtns = cmSelection.querySelectorAll(".btn");
const arrSelectionStyleBtns = cmSelection.querySelectorAll(".btn.style");
const elementModAddPopup = document.getElementById("modAddPopup");
const btnAddModal = cmSelection.querySelector("#btnAddModal");

const modAddPopup = new AutoDialog({ dialog: elementModAddPopup, title: "Add a popup", trigger: btnAddModal, backdropclose: false});

const edapSubtitle = elementModAddPopup.querySelector("#itSubtitle");
const edapBody = elementModAddPopup.querySelector("textarea");
const modPopup = document.getElementById("modPopup");

const btnDownload = document.getElementById("btnDownload");
btnDownload.addEventListener("click", () => {
    let wrapper = accordions.closest(".wrapper");
    let html = '';
    let css = '';
    let js = '';
});
arrContextMenuBtns.forEach(btn => {
    btn.addEventListener("click", () => {
        cmSelection.classList.remove("active");
        cursorCont = rangeEditor.endContainer;
        cursorPos = rangeEditor.endOffset;
        window.getSelection().removeAllRanges();
    });
});

modAddPopup.onOk(async () => {
    if (rangeEditor == null) return;
    // Listener from accordios has already made sure there's a selection within the same line.
    let span = createTagToSurround("span");
    span.classList.add("show-popup");
    span.dataset.title = edapSubtitle.value;
    span.dataset.body = edapBody.value;
    span.addEventListener("click", () => {
        let popup = new AutoDialog({ dialog: modPopup, title: span.dataset.title, ok: false, cancel: false});
        popup.body.innerText = span.dataset.body;
        popup.show();
    });
    rangeEditor.surroundContents(span);
    edapSubtitle.value = "";
    edapBody.value = "";
});

arrSelectionStyleBtns.forEach(btn => {
    // This is for buttons on context menu that add N, I, U style to the highlighted text.
    btn.addEventListener("pointerup", async () => {
        if (rangeEditor == null) return;
        // Listener from accordios has already made sure there's a selection within the same line.
        let tag = createTagToSurround(btn.dataset.tag);

        tag.addEventListener("click", () => {
            let txt = tag.innerText;
            let txtNode = document.createTextNode(txt);
            let li = tag.closest("li");
            li.insertBefore(txtNode, tag);
            let liNodes = li.childNodes;
            for (let i = 0; i < liNodes.length; i++) {
                const node = liNodes[i];
                if (node == tag) {
                    li.removeChild(tag);
                    mergeTextNodes(li);
                    break;
                }
            }
        });


        rangeEditor.surroundContents(tag);
    });
});



var rangeEditor;
btnPass.addEventListener("click", async () => {
    let txt1 = editBody.value;
    let txt2 = txt1.split("\n");
    let title = txt2.splice(0, 1);

    let newAccordion = await createAccordion(title, txt2);
    accordions.appendChild(newAccordion);
});

accordions.addEventListener("pointerup", (evt) => {
    let sel = window.getSelection();
    if (sel.anchorNode == null) return;
    let range = sel.getRangeAt(0);
    let start = range.startContainer;
    let end = range.endContainer;
    if (start == end && range.startOffset !== range.endOffset) {
        rangeEditor = range;
        cmSelection.style.left = `${evt.clientX}px`;
        cmSelection.style.top = `${evt.clientY - 32}px`;
        cmSelection.classList.add("active");

        document.body.addEventListener("pointerdown", (evt) => {
            let e = evt.target;
            let parent = e.closest(".context-menu.selection");
            if (parent !== cmSelection) {
                cmSelection.classList.remove("active");
                // rangeEditor = null;
            }
        }, { once: true });
    } else {
        rangeEditor = null;
        cmSelection.classList.remove("active");
    }
});


function createTagToSurround(strTag) {
    let tag = document.createElement(strTag);
    tag.style.cursor = "pointer";
    return tag;
}

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
        let spanTitle = document.createElement("span");
        spanTitle.classList.add("accr-title");
        spanTitle.innerText = head;

        let spanArrow = document.createElement("span");
        spanArrow.classList.add("accr-arrow");
        let svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
        svg.setAttribute("viewBox", "0 0 10 10");
        let use = document.createElementNS("http://www.w3.org/2000/svg", "use");
        use.setAttributeNS('http://www.w3.org/1999/xlink', 'xlink:href', '#chevDown');
        svg.appendChild(use);
        spanArrow.appendChild(svg);
        accrHead.appendChild(spanTitle);
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

        accrHead.addEventListener("pointerup", async () => {
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
function getAddedRGB(colorStr, int) {
    let obj = getRGBcolorObj(colorStr);
    obj.r = add255Range(obj.r, int);
    obj.g = add255Range(obj.g, int);
    obj.b = add255Range(obj.b, int);
    return `rgb(${obj.r}, ${obj.g}, ${obj.b})`;
}

function getArrRgb(color) {
    let element = document.createElement("div");
    element.style.backgroundColor = color;
    element.style.display = "none";
    document.body.appendChild(element);
    let rgbStr = window.getComputedStyle(element).backgroundColor;
    // rgb(255, 255, 255)
    document.body.removeChild(element);
    let r, g, b;
    let rgb = rgbStr.split(",");
    if (rgb.length > 3) {
        // ['rgba(255', ' 255', ' 255', ' 255)']
        rgb.splice(3, rgb.length);
        // ['rgba(255', ' 255', ' 255']
    }
    let parenthesis = rgb[0].match(/\(/).index;
    // 'rgba(255' index of '('.
    let arr0 = rgb[0].split("");
    arr0.splice(0, parenthesis + 1);
    r = parseInt(arr0.join(""));
    // ' 255'

    g = parseInt(rgb[1]);   // '  255'
    b = parseInt(rgb[2]);   // '  255)'
    return { r, g, b };
}
