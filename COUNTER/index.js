var body = document.querySelector("body");
var chckIncrementar = document.querySelector("[type='checkbox']");
var btnPlus = document.getElementById("btnPlus");
var btnMinus = document.getElementById("btnMinus");
var btnReset = document.getElementById("btnReset");
var btnClicker = document.getElementById("btnClicker");
var btnNumpad = document.getElementById("btnNumpad");
var overlay = document.getElementById("overlay");
var containerNumpad = document.getElementById("containerNumpad");
var arrBtns = [btnReset, btnClicker, btnPlus, btnMinus];
var arrOpKeys = ["ArrowUp", "ArrowDown", "+", "-"];

body.addEventListener("keyup", function (k) {
    // console.log(k.key);
    switch (k.key) {
        case "Escape":
            if (!overlay.classList.contains("invisible")) {
                showNumpad();
            }
            break;
        case "ArrowUp":
            btnClicker.classList.remove("active");
            btnPlus.click();
            break;
        case "ArrowDown":
            btnClicker.classList.remove("active");
            btnMinus.click();
            break;
        case "+":
            btnClicker.classList.remove("active");
            btnPlus.click();
            break;
        case "-":
            btnClicker.classList.remove("active");
            btnMinus.click();
            break;
        default:
            break;
    }
});
body.addEventListener("keydown", function (k) {
    switch (k.key) {
        case "ArrowUp":
            btnClicker.classList.add("active");
            break;
        case "ArrowDown":
            btnClicker.classList.add("active");
            break;
        case "+":
            btnClicker.classList.add("active");
            break;
        case "-":
            btnClicker.classList.add("active");
            break;
        default:
            break;
    }
});

overlay.addEventListener("click", showNumpad);

ifCheckPlusOrMinus;

chckIncrementar.addEventListener("click", ifCheckPlusOrMinus);



arrBtns.forEach(btn => {
    btn.addEventListener("mousedown", function () {
        btnClicker.classList.add("active");
    });
    btn.addEventListener("mouseup", function () {
        btnClicker.classList.remove("active");
    });
    btn.addEventListener("touchstart", function () {
        btnClicker.classList.add("active");
    });
    btn.addEventListener("touchend", function () {
        btnClicker.classList.remove("active");
    });
});

arrBtns.forEach(btn => {
    btn.addEventListener("click", function (event) {
        switch (event.target.id) {
            case "btnReset":
                btnClicker.innerHTML = "0";
                break;
            case "btnClicker":
                var clicker = parseInt(btnClicker.innerHTML);
                if (chckIncrementar.checked) {
                    if (clicker > 0) {
                        clicker--;
                    }
                } else {
                    clicker++;
                }
                btnClicker.innerHTML = clicker;
                break;
            case "btnPlus":
                btnClicker.innerHTML = parseInt(btnClicker.innerHTML) + 1;
                break;
            case "btnMinus":
                if (parseInt(btnClicker.innerHTML) > 0) {
                    btnClicker.innerHTML = parseInt(btnClicker.innerHTML) - 1;
                }
                break;
            default:
                break;
        }
    });
});

btnNumpad.addEventListener("click", showNumpad);


// NUMPAD CODE

var displayedNumber = document.getElementById("displayedNumber");
var arrNumpadButtons = document.querySelectorAll("#containerNumpad .btnDigit");
var btnNumBaskpace = document.getElementById("numBackspace");
var btnNumdOK = document.getElementById("numOk");

arrNumpadButtons.forEach(btn => {
    btn.addEventListener("click", function () {

        if (displayedNumber.innerText === "0") {
            displayedNumber.innerText = ""
        }
        displayedNumber.innerText = displayedNumber.innerText + btn.innerText;
    });
});

btnNumBaskpace.addEventListener("click", function () {
    let arrAllChar = displayedNumber.innerText.split("");
    if (arrAllChar.length === 1) {
        displayedNumber.innerText = "0";
    } else {
        arrAllChar.pop();
        displayedNumber.innerText = arrAllChar.join("");
    }
});

btnNumdOK.addEventListener("click", function () {
    btnClicker.innerText = displayedNumber.innerText;
    showNumpad();
});
// FUNCTIONS

function ifCheckPlusOrMinus() { //Uses document.querySelector("[type='checkbox']")
    if (chckIncrementar.checked) {
        chckIncrementar.labels[0].innerHTML = "Decrementar";
    } else {
        chckIncrementar.labels[0].innerHTML = "Incrementar";
    }
}

function showNumpad() { // Uses document.getElementById("containerNumpad")

    displayedNumber.innerText = 0;
    if (containerNumpad.classList.contains("invisible")) {
        containerNumpad.classList.remove("invisible");
        overlay.classList.remove("invisible");
    } else {
        containerNumpad.classList.add("invisible");
        overlay.classList.add("invisible");
    }
}