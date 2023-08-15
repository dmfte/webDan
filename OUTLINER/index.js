const editBody = document.querySelector(".cont.edit .write textarea");
const accordions = document.querySelector(".accordions");
const btnPass = document.querySelector(".cont.edit .buttons .pass");

btnPass.addEventListener("click", () => {
    let txt1 = editBody.value;
    let txt2 = txt1.split("\n");
    let title = txt2.splice(0, 1);

    let newAccordion = createAccordion(title, txt2);
    accordions.appendChild(newAccordion);
});

accordions.addEventListener("pointerup", () => {
    let sel = window.getSelection();
    let range = sel.getRangeAt(0);
    let startLi = range.startContainer.parentElement;
    let endLi = range.endContainer.parentElement;
    console.log(startLi);
    console.log(endLi);
    if (startLi === endLi && range.startOffset !== range.endOffset) {
        range.surroundContents(document.createElement("strong"));

    }
});

function createAccordion(head = "", body = []) {
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
    return contAccr;
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
