// NAVIGATION BAR
const navTop = document.getElementById("navTop");
const containerAll = document.getElementById("containerAll");
const submenuCopy = document.getElementById("submenuCopy");
const tooltipCenter = document.getElementById("tooltipCenter");

submenuCopy.addEventListener("click", function(){

  let divInvisible = document.createElement("div");
  divInvisible.style.transform = "scale(0)";
  divInvisible.innerText = parseInt(btnCounter.innerText);
  document.body.appendChild(divInvisible);
  let range = document.createRange();
  range.selectNode(divInvisible);
  window.getSelection().removeAllRanges();
  window.getSelection().addRange(range);
  document.execCommand("copy");
  showTooltip(tooltipCenter, "Number copied");
  document.body.removeChild(divInvisible);
});


function showTooltip(tooltipDiv, txt){
  tooltipDiv.innerText = txt;
  tooltipDiv.classList.add("active");
  window.setTimeout(function(){
    tooltipDiv.classList.remove("active");
  }, 1500);
}

// MAIN SCREEN

const btnCounter = document.getElementById("btnCounter");
const cbDecrease = document.getElementById("cbDecrease");
const btnReset = document.getElementById("btnReset");
const btnIncrease = document.getElementById("btnIncrease");
const btnDecrease = document.getElementById("btnDecrease");
const labDecrease = document.getElementById("labDecrease");

resizeFont(btnCounter);
resizeFont(labDecrease);

const sizeObserver = new ResizeObserver(function(entries) {
  entries.forEach((entry, i) => {
    resizeFont(entry.target);
  });
});

sizeObserver.observe(btnCounter);
sizeObserver.observe(labDecrease);

btnCounter.addEventListener("click", function() {
  if (cbDecrease.checked) {
    decreaseNum();
  } else {
    increaseNum();
  }
  resizeFont(btnCounter);
});

btnReset.addEventListener("click", function() {
  btnCounter.innerText = "0";
  navigator.vibrate([100, 15, 100]);
  resizeFont(btnCounter);
});

btnDecrease.addEventListener("click", decreaseNum);
btnIncrease.addEventListener("click", increaseNum);

function decreaseNum() {
  let num = parseInt(btnCounter.innerText);
  if (num > 0) {
    num--;
    btnCounter.innerText = num;
    navigator.vibrate(50);
  } else {
    navigator.vibrate([50, 15, 50]);
  }
  resizeFont(btnCounter);
}

function increaseNum() {
  let num = parseInt(btnCounter.innerText);
  num++;
  btnCounter.innerText = num;
  resizeFont(btnCounter);
  navigator.vibrate(50);
}

function resizeFont(element) { //  Calculates the best font size, first based on height, then based on width, to a minimum of 0.4em.
  let dividendW = 0;
  let dividendH = 0;

  //  20 and 11 are calculated based on prooftest for different element sizes. Increasing each number will make the font size smaller.
  switch (element.id) {
    case "btnCounter":
      dividendH = 20;
      dividendW = 11;
      break;
    case "labDecrease":
      dividendH = 16;
      dividendW = 9;
      break;
    default:
  }

  let txt = element.innerText;
  let w = parseFloat(window.getComputedStyle(element).width);
  let h = parseFloat(window.getComputedStyle(element).height);

  let heightBasedFS = Math.round((h / dividendH) * 100) / 100;
  if (heightBasedFS < 0.4) heightBasedFS = 0.4;

  let widthBasedFS = Math.round(((w / dividendW) / txt.length) * 100) / 100;
  if (widthBasedFS < 0.4) widthBasedFS = 0.4;

  let heightSmaller = heightBasedFS < widthBasedFS
  element.style.fontSize = (heightSmaller ? heightBasedFS : widthBasedFS) + "em";
}

// MODAL

const btnsNumpad = document.querySelectorAll(".modal-body .btn");
const numpadInput = document.querySelector(".modal-header .modal-title")
const modalBootsNumpad = new bootstrap.Modal(document.getElementById("modNumpad"));
const modalNumpad = document.getElementById("modNumpad");
const btnModNumpadOk = document.getElementById("btnModNumpadOk");

btnsNumpad.forEach(btn => {
  btn.addEventListener("click", function() {
    if (numpadInput.innerText == "0") {
      numpadInput.innerText = btn.innerText;
    } else {
      numpadInput.innerText += btn.innerText;
    }
    if (btn.value == "Backspace") {
      onBackspace(numpadInput);
    }
  });
});

btnModNumpadOk.addEventListener("click", function() {
  modalBootsNumpad.hide();
  btnCounter.innerText = numpadInput.innerText;
  numpadInput.innerText = "0";
  resizeFont(btnCounter);
});

modalNumpad.addEventListener("shown.bs.modal", function() {
  document.addEventListener("keydown", onNumpadKeyPress);
});

modalNumpad.addEventListener("hidden.bs.modal", function() {
  document.removeEventListener("keydown", onNumpadKeyPress);
});

function onNumpadKeyPress(keydownEvent) {
  if (/\d/.test(keydownEvent.key)) {
    modalNumpad.querySelector("[value='" + keydownEvent.key + "']").click();
  }
  switch (keydownEvent.key) {
    case "Enter":
      btnModNumpadOk.click();
      break;
    case "Backspace":
      onBackspace(numpadInput);
      break;
    default:
  }
}

function onBackspace(element) {
  if (element.innerText.length <= 1) {
    element.innerText = "0";
  } else {
    let arrNumpadInput = element.innerText.split("");
    arrNumpadInput.pop();
    element.innerText = arrNumpadInput.join("");
  }
}
