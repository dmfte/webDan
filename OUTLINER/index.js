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
    let wrapper = document.createElement("div");
    wrapper.classList.add("accr-wrapper");
    let accrBody = document.createElement("div");
    accrBody.classList.add("accr-body");
    let lis = body.map(line => {
        return `<li>${line}</li>`;
    });
    let innerUl = lis.reduce((str, li) => {
        return `${str}${li}`;
    });
    let ul = document.createElement("ul");
    ul.innerHTML = innerUl;
    accrBody.appendChild(ul);
    wrapper.appendChild(accrBody);
    contAccr.appendChild(wrapper);

    return contAccr;
}

function getCursorSelection() {
    let sel = window.getSelection();
    let range = sel.getRangeAt(0);
    let startLi = range.startContainer.parentElement;
    let startPos = range.startOffset;
    let endLi = range.endContainer.parentElement;
    let endPos = range.endOffset;
    return ({ startLi, startPos, endLi, endPos });
}

function setCursorPosition(editableDiv, line, pos) {
    let sel = window.getSelection();

    let range = sel.getRangeAt(0);
    let childNodes = editableDiv.childNodes;
    let textNodes = [];
    for (let i = 0; i < childNodes.length; i++) {
        const node = childNodes[i];
        if (node.nodeType == 3) textNodes.push(node);
    }
    console.log(textNodes[line]);
    range.setStart(textNodes[line], 0);
    range.setEnd(textNodes[line], pos);
    window.getSelection().removeAllRanges();
    window.getSelection().addRange(range);
}