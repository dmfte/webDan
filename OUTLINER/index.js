const editHeader = document.querySelector("input[type=text]");
const editBody = document.querySelector("div[contenteditable=true]");
const accordions = document.querySelector(".accordions");

var cs = {}  //  { startLine, startPos, endLine, endPos }

editBody.addEventListener("keyup", (evt) => {
    cs = getCursorSelection(editBody);
});

editBody.addEventListener("pointerup", () => {
    cs = getCursorSelection(editBody);
});

editBody.addEventListener("paste", (evt) => {
    evt.preventDefault();
    let pasted = (evt.clipboardData || window.clipboardData).getData("text");
    let pastedN = pasted.split('\n');
    if (pastedN.length > 1) {
        for (let i = 1; i < pastedN.length - 1; i++) {
            const p = pastedN[i];
            pastedN[i] = `<li>${p}</li>`;
        }
    }
    
    let pastedI = pastedN.splice(0, 1);
    let pastedF = pastedN.splice(pastedN.length - 1, 1);

    let preArr = getLiArr(editBody);

    cs = getCursorSelection();
    let startI = preArr.indexOf(cs.startLi);
    for (let i = 0; i < preArr.length; i++) {
        const li = preArr[i];
        let count = 0;
        if (li == cs.startLi) {
            if (cs.startLi !== cs.endLi) {
                let newLiI = li.innerText.substring(0, cs.startPos) + pastedI;
                preArr[i] = newLiI;
                for (let j = i; j < preArr.length; j++) {
                    const toDel = preArr[j];
                    if (toDel == cs.endLi) {
                        if (cs.startLi == cs.endLi) {
                            
                         }
                        let newLiF = pastedF + toDel.innerText.substring(cs.endPos, toDel.innerText.length);
                        preArr[i] = newLiF;
                        break;
                    }
                    count++;
                }
                preArr.splice(startI + 1, pastedN);
                break;
            }

        }
    }
    
    if (pastedN.length == 0) {
        preArr.splice(startI + 1);
    } else {
        
    }

}

    let txt1 = lcs.startLi.innerText.substring(0, lcs.startPos);
let txt2 = lcs.endLi.innerText.substring(lcs.endPos, lcs.endLi.innerText.length);


let newTextNode = document.createTextNode(p2);
range.insertNode(newTextNode);

let newTxt = editBody.innerText;
console.log(p2);
console.log(newTextNode);
console.log(newTxt);

});

function getLiArr(div) {
    let txt1 = div.innerText;
    let txt2 = txt1.split('\n');
    let arr = [];
    for (let i = 0; i < txt2.length; i++) {
        const txt = txt2[i];
        let li = document.createElement("li");
        li.innerText = txt;
        arr.push(li);
    }
    return arr;
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