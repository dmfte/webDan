//  SECTIONS
const secToolbar = document.getElementById("secToolbar");
const secDisplay = document.getElementById("secDisplay");

//  CONTAINERS


//  GLOBAL VARIABLES
var imageOriginal;  //  Image to be loaded to the browser.
var canvOriginal = document.getElementById("canvOriginal");
var co = canvOriginal.getContext("2d", { willReadFrequently: true });
var canvFinal = document.getElementById("canvFinal");
var cf = canvFinal.getContext("2d", { willReadFrequently: true });
var originalData, finalData, dataI, dataF;  // Image data.

//   NAVBAR
const navBtnInfo = document.querySelector(".nav-i#gaBtnInfo");
const diagInfo = document.getElementById("diagInfo");
const paramsDiagInfo = { trigger: navBtnInfo, title: "Information", dialog: diagInfo, glyph: "hercon", ok: false, cancel: false }
const adInfo = new AutoDialog(paramsDiagInfo);

// Mailto
const navBtnContactme = document.getElementById("navBtnContactme");
navBtnContactme.addEventListener("click", () => {
    let ta = document.createElement("textarea");
    ta.style.position = "absolute";
    ta.style.transform = "scale(0)";
    ta.innerText = "dmfte.dev@gmail.com";
    document.body.appendChild(ta);
    ta.focus();
    ta.select();
    document.execCommand("copy");
    showTooltip(navBtnContactme, 2000);
    document.body.removeChild(ta);
});

function showTooltip(elem, timeMs) {
    // Will add the .active class to the already styled tooltip and remvoe it after the provided time in milisecons.
    let tooltip = elem.querySelector(".tooltip");
    tooltip.classList.add("active");
    window.setTimeout(() => {
        tooltip.classList.remove("active");
    }, timeMs)
}
// ---------

//  GLOBAL ACTIONS
function smallestDimension(img) {
    return (img.width < img.height) ? img.width : img.height;
}
function getLoadedImage(evt) {
    return new Promise((res, rej) => {
        let img = new Image();
        img.onload = () => res(img);
        let URL = window.URL.createObjectURL(evt.target.files[0]);
        img.src = URL;
    });
}

// To display canvases aligned horizontally or vertically.
const cbGaHorzVert = document.getElementById("cbGaHorzVert");
cbGaHorzVert.addEventListener("click", () => {
    if (cbGaHorzVert.checked) {
        secDisplay.classList.add("horizontal");
        secDisplay.classList.remove("vertical");
    } else {
        secDisplay.classList.remove("horizontal");
        secDisplay.classList.add("vertical");
    }
});
const svgHorzVert = document.getElementById("svgHorzVert");
svgHorzVert.addEventListener("pointerenter", svgAnimateStart);
svgHorzVert.addEventListener("pointerleave", svgAnimateStop);

// To make the original image float.
const svgFloatSquare = document.getElementById("svgFloatSquare");
svgFloatSquare.addEventListener("pointerenter", svgAnimateStart);
svgFloatSquare.addEventListener("pointerleave", svgAnimateStop);
//  --  to make left display draggable.
var gaFloatDispLeft = 5;
var gaFloatDispTop = 5;
const displayLeft = document.querySelector(".disp.left");
const cbGaSmallFloat = document.getElementById("cbGaSmallFloat");
cbGaSmallFloat.addEventListener("click", () => {
    if (cbGaSmallFloat.checked) {
        secDisplay.classList.add("float");
        displayLeft.style.left = `${gaFloatDispLeft}px`;
        displayLeft.style.top = `${gaFloatDispTop}px`;
    } else {
        secDisplay.classList.remove("float");
        if (secDisplay.classList.contains("vertical")) {
            displayLeft.style.right = "0";
            displayLeft.style.top = "0";
            displayLeft.style.left = "0";
        }
        if (secDisplay.classList.contains("horizontal")) {
            displayLeft.style.left = "0";
            displayLeft.style.top = "0";
            displayLeft.style.bottom = "0";
        }
    }
});

displayLeft.addEventListener("pointerdown", (downEvt) => {
    if (secDisplay.classList.contains("float")) {
        // #secDisplay .disp { transition-duration: 300ms }
        displayLeft.style.transitionDuration = "0ms";
        let limitBox = secDisplay.getBoundingClientRect();
        let limitDisplay = secDisplay.querySelector(".disp.left").getBoundingClientRect();
        let styleDisplay = window.getComputedStyle(displayLeft);

        let offsXleft = downEvt.clientX - limitBox.left - displayLeft.offsetLeft;
        let offsXright = parseInt(styleDisplay.width) + parseInt(styleDisplay.borderWidth) - offsXleft;
        let offsYtop = downEvt.clientY - limitDisplay.top;
        let offsYbottom = parseInt(styleDisplay.height) + parseInt(styleDisplay.borderWidth) - offsYtop;

        displayLeft.addEventListener("pointermove", moveStart);
        displayLeft.addEventListener("pointerup", moveEnd, { once: true });
        function moveStart(moveEvt) {
            displayLeft.setPointerCapture(moveEvt.pointerId);
            if (moveEvt.clientX - offsXleft >= limitBox.left + 5 &&
                moveEvt.clientX + offsXright < limitBox.right - 5) {
                gaFloatDispLeft = moveEvt.clientX - limitBox.left - offsXleft
                displayLeft.style.left = `${gaFloatDispLeft}px`;
            }
            if (moveEvt.clientY - offsYtop >= limitBox.top + 5 &&
                moveEvt.clientY + offsYbottom < limitBox.bottom - 5) {
                gaFloatDispTop = moveEvt.clientY - limitBox.top - offsYtop;
                displayLeft.style.top = `${gaFloatDispTop}px`;
            }
        }
        function moveEnd(upEvt) {
            displayLeft.removeEventListener("pointermove", moveStart);
            // #secDisplay .disp { transition-duration: 300ms }
            displayLeft.style.transitionDuration = "300ms";
        }
    }
});

function svgAnimateStart(evt) {
    let svg = evt.currentTarget;
    let animate = svg.querySelectorAll("animate");
    animate.forEach(anim => {
        let dur = anim.dataset.dur;
        anim.setAttribute("dur", dur);
        let path = anim.closest("path");
        path.innerHTML = "";
        path.appendChild(anim);
    });
}
function svgAnimateStop(evt) {
    let svg = evt.currentTarget;
    let animate = svg.querySelectorAll("animate");
    animate.forEach(anim => {
        anim.setAttribute("dur", 0);
        let path = anim.closest("path");
        path.innerHTML = "";
        path.appendChild(anim);
    });
}
// ---------
//  TOOLBAR RADIO BUTTONS
const arrRbEffect = document.querySelectorAll(".effect input[name=rgEffects]");

const arrEffects = document.querySelectorAll(".effect");

// Styling for when in desktop setting.
arrRbEffect.forEach(rb => {
    rb.addEventListener("click", () => {
        if (rb.checked) {
            arrEffects.forEach(eff => {
                eff.classList.remove("active");
            });
            let effect = rb.closest(".effect");
            effect.classList.add("active");
            if (effect.dataset.btnDown !== undefined) {
                btnDownImg.setAttribute("class", "");
                btnDownImg.classList.add("effect");
                btnDownImg.classList.add(effect.dataset.btnDown);
            } else {
                btnDownImg.setAttribute("class", "");
                btnDownImg.classList.add("effect");
            }
        }
        if (secToolbar.classList.contains("expanded")) {
            secToolbar.classList.remove("expanded");
        } else {
            secToolbar.classList.add("expanded");
        }
    });
});
// ---------

//  GRID EFFECT
var paramsGrid = {
    color: "#ff0000",
    linew: 5,
    side: "height"
}
var atsg;  //  Array To Start Grid.
const contGridAmtSqrs = document.querySelector("#effectGrid .cont.slider#gridAmtSqrs .wrapper");
const contGridLinew = document.querySelector("#effectGrid .cont.slider#gridLinew .wrapper");
const cbGridWOrH = document.getElementById("cbGridWOrH");
const icGridColor = document.getElementById("icGridColor");
const lbGridColor = document.querySelector("label[for=icGridColor]");
const rbGrid = document.getElementById("rbGrid");
var rsGridAmtSqrs = new RangeSlider(contGridAmtSqrs, { title: "Number of squares", min: 2, step: 1, max: 30, def: 5, color1: "#2c5270", color2: "#DDE6ED" });
var rsGridLinew = new RangeSlider(contGridLinew, { title: "Line width", min: 1, step: 1, max: 30, def: 2, color1: "#2c5270", color2: "#DDE6ED" });

rsGridAmtSqrs.onslide(onGridSlide);
rsGridLinew.onslide(onGridSlide);

cbGridWOrH.addEventListener("input", () => {
    onGridSlide();
});
icGridColor.value = paramsGrid.color;
lbGridColor.style.backgroundColor = icGridColor.value;
icGridColor.addEventListener("input", () => {
    paramsGrid.color = icGridColor.value;
    lbGridColor.style.backgroundColor = icGridColor.value;
    if (atsg !== undefined) drawATSG(atsg, cf, paramsGrid);
});
rbGrid.addEventListener("click", (evt) => {
    if (imageOriginal !== undefined) onGridSlide();
});

// Functions
async function onGridSlide() {
    if (imageOriginal !== undefined) {
        atsg = await getArrayToStartGrid(imageOriginal.width, imageOriginal.height, rsGridAmtSqrs.val);
        paramsGrid.linew = rsGridLinew.val;
        cf.drawImage(imageOriginal, 0, 0, canvFinal.width, canvFinal.height);
        drawATSG(atsg, cf, paramsGrid);
    }
}

function getArrayToStartGrid(w, h, amnt) {
    return new Promise((res, rej) => {
        let arr = [];
        let square = 0;
        let forX = 0;
        let forY = 0;
        // if (strSide == "height") {
        if (cbGridWOrH.checked) {
            square = h / amnt;
            forX = Math.ceil(w / square);
            forY = amnt;
        } else {
            // if (strSide == "width") {
            square = w / amnt;
            forX = amnt;
            forY = Math.ceil(h / square);
        }
        for (let i = 0; i <= forY; i++) {
            arr.push({
                movetoX: 0,
                movetoY: i * square,
                directionX: w,
                directionY: 0
            });
        }
        for (let i = 0; i <= forX; i++) {
            arr.push({
                movetoX: i * square,
                movetoY: 0,
                directionX: 0,
                directionY: h
            });
        }
        res(arr);
    });
}

function drawATSG(atsg, ctx, params) {
    ctx.strokeStyle = params.color;
    ctx.lineWidth = params.linew;
    atsg.forEach(obj => {
        ctx.save();
        ctx.translate(obj.movetoX, obj.movetoY);
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(obj.directionX, obj.directionY);
        ctx.stroke();
        ctx.restore();
    });
}

//  PIXELATE EFFECT
var paramsPixelate = {
    title: "1/x size",
    min: 2,
    step: 1,
    // Max will be re-set as a tenth  of the img smallest dimention.
    max: 4,
    // Default value will be modified as a fourth of max.
    def: 3,
    color1: "#2c5270",
    color2: "#DDE6ED"
};
const contPixelateSlider = document.querySelector("#effectPixelate .cont.slider .wrapper");
const rbPixelate = document.getElementById("rbPixelate");
var rsPixelate = new RangeSlider(contPixelateSlider, paramsPixelate);

rbPixelate.addEventListener("click", () => {
    if (imageOriginal !== undefined) onPixelateSlide();
});

// Functions
async function onPixelateSlide() {
    let canv0 = document.createElement("canvas");
    canv0.width = Math.floor(imageOriginal.width / rsPixelate.val);
    canv0.height = Math.floor(imageOriginal.height / rsPixelate.val);
    let c0 = canv0.getContext("2d", {
        willReadFrequentdirectionY: true
    });
    c0.imageSmoothingEnabled = false;
    c0.drawImage(imageOriginal, 0, 0, canv0.width, canv0.height);
    cf.imageSmoothingEnabled = false;
    cf.drawImage(canv0, 0, 0, canvFinal.width, canvFinal.height);
}


//  MONOCHROME EFFECT
const rbMonochrome = document.getElementById("rbMonochrome");
rbMonochrome.addEventListener("click", onMonochromeSlide);

const icMonoColor = document.getElementById("icMonoColor");
const lbMonoColor = document.querySelector("[for=icMonoColor]");
icMonoColor.value = "#000000";
lbMonoColor.style.backgroundColor = icMonoColor.value;
var arrMonoColorRgb = getarrRGB(icMonoColor.value);
icMonoColor.addEventListener("input", () => {
    lbMonoColor.style.backgroundColor = icMonoColor.value;
    arrMonoColorRgb = getarrRGB(icMonoColor.value);
    onMonochromeSlide();
});

const icMonoBg = document.getElementById("icMonoBg");
const lbMonoBg = document.querySelector("[for=icMonoBg]");
icMonoBg.value = "#FFFFFF";
lbMonoBg.style.backgroundColor = icMonoBg.value;
icMonoBg.addEventListener("input", () => {
    lbMonoBg.style.backgroundColor = icMonoBg.value;
    onMonochromeSlide();
});

const contMonoSeparation = document.querySelector("#monoSeparation .wrapper");
var rsMonoSeparation = new RangeSlider(contMonoSeparation, { title: "separation", min: 3, max: 50, step: 1, def: 10, color1: "#2c5270", color2: "#DDE6ED" });
rsMonoSeparation.onslide(onMonochromeSlide);

const contMonoShades = document.querySelector("#monoShades .wrapper");
var rsMonoShades = new RangeSlider(contMonoShades, { title: "Shades", min: 1, max: 20, step: 1, def: 3, color1: "#2c5270", color2: "#DDE6ED" });
rsMonoShades.onslide(onMonochromeSlide);

const contMonoSenitivity = document.querySelector("#monoSensitivity .wrapper");
var rsMonoSensitivity = new RangeSlider(contMonoSenitivity, { title: "Sensitivity", min: -250, max: 250, step: 5, def: 0, color1: "#2c5270", color2: "#DDE6ED" });
rsMonoSensitivity.onslide(onMonochromeSlide);

async function onMonochromeSlide() {
    if (imageOriginal !== undefined) {
        let canvFinal = document.createElement("canvas");
        canvFinal.width = canvOriginal.width;
        canvFinal.height = canvOriginal.height;
        cf.fillStyle = icMonoBg.value;
        cf.fillRect(0, 0, canvFinal.width, canvFinal.height);
        let finalData = cf.getImageData(0, 0, canvFinal.width, canvFinal.height);
        let atm = await getArrayToMonochrome(originalData, rsMonoSeparation.val);
        let monoData = await getMonocrhomedData(atm, finalData, rsMonoShades.val, rsMonoSensitivity.val, arrMonoColorRgb);  //  Shape.
        cf.putImageData(monoData, 0, 0);
    }
}

async function getArrayToMonochrome(data = new Object, separation = 0) {
    return new Promise((res, rej) => {
        let arr = [];
        for (let x = 0; x < data.width; x++) {
            if (x % separation !== 0) continue;
            for (let y = 0; y < data.height; y++) {
                if (y % separation !== 0) continue;
                let idx = getImagedataIndex(x, y, data.width);
                let r = data.data[idx + 0];
                let g = data.data[idx + 1];
                let b = data.data[idx + 2];
                let gs = getGrayscale(r, g, b);
                arr.push([x, y, gs]);
            }
        }
        res(arr);
    });
}

function getMonocrhomedData(atm = [], data = new Object, shades = 0, sensitivity = 0, colorArr = new Object) {
    return new Promise(async (res, rej) => {
        let buckets = await get255Buckets(shades + 1, sensitivity);
        // let arr = [];
        for (let i = 0; i < atm.length; i++) {
            const x = atm[i][0];
            const y = atm[i][1];
            const gs = atm[i][2];
            for (let b = 1; b < buckets.length; b++) {
                const buck = buckets[b];
                if (gs >= buck[0] && gs <= buck[1]) {
                    // Rhombus
                    for (let m = 0; m <= b; m++) {
                        let x1 = x - m;
                        let x2 = x + m;
                        let y1 = y - (b - m);
                        let y2 = y - (b - m);
                        getPurePxDrawnData(x1, y1, x2, y2, data, imageOriginal.width, colorArr);
                        let y3 = y + (b - m);
                        let y4 = y + (b - m);
                        getPurePxDrawnData(x1, y3, x2, y4, data, imageOriginal.width, colorArr);
                    }

                    // Circle
                    // for (let m = 0; m <=b; m++) {

                    // }
                }
            }
        }
        res(data);
    });
}

//   GRAYSCALING
const rbGrayscaling = document.getElementById("rbGrayscaling");
const cbGrayscalingBnw = document.getElementById("cbGrayscalingBnw");
const contGrayscalingLevels = document.querySelector("#effectGrayscaling .cont.slider#gsLevels .wrapper");
const contGrayscalingSensitivity = document.querySelector("#effectGrayscaling .cont.slider#gsSensitivity .wrapper");

rbGrayscaling.addEventListener("click", () => {
    if (imageOriginal !== undefined) onGrayscalingSlide();
});

cbGrayscalingBnw.addEventListener("input", onGrayscalingSlide);

var rsGrayscalingLevels = new RangeSlider(contGrayscalingLevels, { title: "Levels of gray", min: 2, max: 20, step: 1, def: 3, color1: "#2c5270", color2: "#DDE6ED" });
//  More than 20 grayscale tones are barely distinguishable.
var rsGrayScalingSensitivity = new RangeSlider(contGrayscalingSensitivity, { title: "Sensitivity", min: -254, step: 1, max: 254, def: 0, color1: "#2c5270", color2: "#DDE6ED" });
rsGrayscalingLevels.onslide(onGrayscalingSlide);
rsGrayScalingSensitivity.onslide(onGrayscalingSlide);

async function onGrayscalingSlide() {
    if (imageOriginal !== undefined) {
        let newImgData = await getGrayscalledImgData(rsGrayscalingLevels.val, rsGrayScalingSensitivity.val, cbGrayscalingBnw.checked);
        cf.putImageData(newImgData, 0, 0);
    }
}

function getGrayscalledImgData(how_many, sensitivity, boolBnw) {
    return new Promise(async (res, rej) => {
        let arrBucket = await get255Buckets(how_many, sensitivity);
        let arrValues = new Array(how_many);
        let bucket = (boolBnw) ? 255 / (how_many - 1) : 255 / (how_many + 1);
        if (boolBnw) {
            for (let i = 0; i < arrValues.length; i++) {
                arrValues[arrValues.length - 1 - i] = parseInt(Math.max(Math.min(i * bucket, 255), 0));
            }
        } else {
            for (let i = 1; i <= arrValues.length; i++) {
                arrValues[arrValues.length - i] = parseInt(Math.max(Math.min(i * bucket, 255), 0));
            }
        }

        let newImgdata = structuredClone(originalData);
        for (let i = 0; i < newImgdata.data.length; i += 4) {
            let r = newImgdata.data[i + 0];
            let g = newImgdata.data[i + 1];
            let b = newImgdata.data[i + 2];
            // let a = newImgdata.data[i + 3];
            let grayScale = parseInt(r * 0.299 + g * 0.587 + b * 0.114);
            let newGs = 0;
            for (let j = 0; j < arrValues.length; j++) {
                const val = arrValues[j];
                if (grayScale >= arrBucket[j][0] && grayScale <= arrBucket[j][1]) {
                    newGs = val;
                    break;
                }
            }
            newImgdata.data[i + 0] = newGs;
            newImgdata.data[i + 1] = newGs;
            newImgdata.data[i + 2] = newGs;
        }
        res(newImgdata);
    });
}

// ---------

// HATCHING
var paramsHatch = {
    bg: "#FFFFFF",
    color: "#000000",
    linew: 2,
    buckets: [[192, 255], [128, 191], [64, 127], [0, 63]],  //  This is what get255Buckets will return with default how_many lines value of 3 + 1.
    atdh: undefined
}

const rbHatching = document.getElementById("rbHatching");
rbHatching.addEventListener("click", async () => {
    if (imageOriginal == undefined) return;
    paramsHatch.atdh = await getArrToDrawHatch(strHatchDir, rsHatchSeparation.val, paramsHatch.buckets);
    onHatchSlide(paramsHatch);
});

// var paramsHatch = { atdh: undefined, color: "#000000", bg: "#FFFFFF", dir: "DLUR", separation: 5, linew: 3, how_many: 3 };

const icHatchColor = document.getElementById("icHatchColor");
icHatchColor.value = paramsHatch.color;
const lbHatchColor = document.querySelector("[for=icHatchColor]");
lbHatchColor.style.backgroundColor = paramsHatch.color;
icHatchColor.addEventListener("input", () => {
    lbHatchColor.style.backgroundColor = icHatchColor.value;
    paramsHatch.color = icHatchColor.value;
    onHatchSlide(paramsHatch);
});

const icHatchBg = document.getElementById("icHatchBg");
icHatchBg.value = paramsHatch.bg;
const lbHatchBg = document.querySelector("[for=icHatchBg]");
lbHatchBg.style.backgroundColor = paramsHatch.bg;
icHatchBg.addEventListener("input", () => {
    lbHatchBg.style.backgroundColor = icHatchBg.value;
    paramsHatch.bg = icHatchBg.value;
    onHatchSlide(paramsHatch);
});

const contHatchHowmanyw = document.querySelector("#hatchHowmanyw .wrapper");
var rsHatchHowmanyw = new RangeSlider(contHatchHowmanyw, { title: "Lines", min: 1, max: 10, def: 3, step: 1, color1: "#2c5270", color2: "#DDE6ED" });
rsHatchHowmanyw.onslide(async () => {
    paramsHatch.buckets = await get255Buckets(rsHatchHowmanyw.val + 1, rsHatchSensitivity.val);
    paramsHatch.atdh = await getArrToDrawHatch(strHatchDir, rsHatchSeparation.val, paramsHatch.buckets);
    onHatchSlide(paramsHatch);
});
const contHatchSensitivity = document.querySelector("#hatchSensitivity .wrapper");
var rsHatchSensitivity = new RangeSlider(contHatchSensitivity, { title: "Sensitivity", min: -250, max: 250, step: 5, def: 0, color1: "#2c5270", color2: "#DDE6ED" });
rsHatchSensitivity.onslide(async () => {
    paramsHatch.buckets = await get255Buckets(rsHatchHowmanyw.val + 1, rsHatchSensitivity.val);
    paramsHatch.atdh = await getArrToDrawHatch(strHatchDir, rsHatchSeparation.val, paramsHatch.buckets);
    onHatchSlide(paramsHatch);
});

const contHatchSeparation = document.querySelector("#hatchSeparation .wrapper");
var rsHatchSeparation = new RangeSlider(contHatchSeparation, { title: "Separation", min: 2, max: 3, step: 1, def: 3, color1: "#2c5270", color2: "#DDE6ED" });  //  Will be reinitialized when image is loaded.
rsHatchSeparation.onslide(async () => {
    paramsHatch.atdh = await getArrToDrawHatch(strHatchDir, rsHatchSeparation.val, paramsHatch.buckets);
    onHatchSlide(paramsHatch);
});

const contHatchLinewidth = document.querySelector("#hatchLinewidth .wrapper");
var rsHatchLinewidth = new RangeSlider(contHatchLinewidth, { title: "Width", min: 1, max: 15, def: paramsHatch.linew, step: 1, color1: "#2c5270", color2: "#DDE6ED" });
rsHatchLinewidth.onslide(() => {
    paramsHatch.linew = rsHatchLinewidth.val;
    onHatchSlide(paramsHatch);
});


var strHatchDir = "DLUR";
const currentdirection = document.getElementById("currentdirection");
const svgCurrDir = currentdirection.querySelector("svg");
const rbtnsHatchDirections = currentdirection.closest(".cont.other .btn.with-submenu").querySelectorAll("input[type=radio]");

//  Click and animation for the hatch-direction button.
rbtnsHatchDirections.forEach(bthd => {
    bthd.addEventListener("click", async () => {
        let diff = parseInt(bthd.dataset.vb) - parseInt(currentdirection.dataset.vb);
        let diff10 = diff / 10;
        let interval = null;
        let count = 1;
        let fx = () => {
            if (count >= 10) window.clearInterval(interval);
            currentdirection.dataset.vb = parseInt(currentdirection.dataset.vb) + diff10;
            svgCurrDir.setAttribute("viewBox", `${currentdirection.dataset.vb} 0 10 10`);
            count++;
        }
        interval = window.setInterval(fx, 50);
        strHatchDir = bthd.value;
        paramsHatch.atdh = await getArrToDrawHatch(strHatchDir, rsHatchSeparation.val, paramsHatch.buckets);
        onHatchSlide(paramsHatch);
    });
});

svgCurrDir.setAttribute("viewBox", "0 0 10 10");

async function onHatchSlide(params) {
    if (imageOriginal == undefined || paramsHatch.atdh == undefined) return;
    if (imageOriginal !== undefined) {
        canvFinal.imageSmoothingEnabled = false;
        canvFinal.width = canvOriginal.width;
        canvFinal.height = canvOriginal.height;
        cf = canvFinal.getContext("2d", { willReadFrequently: true });
        cf.fillStyle = params.bg;
        cf.fillRect(0, 0, canvFinal.width, canvFinal.height);
        // cf.strokeStyle = paramsHatch.color;

        let blankImagedata = cf.getImageData(0, 0, canvFinal.width, canvFinal.height);
        let diwATDH = await returnsDrawnImagedataWithATDH(blankImagedata, params);
        cf.putImageData(diwATDH, 0, 0);
    }
}

function returnsDrawnImagedataWithATDH(imagedatafinal, params) {
    return new Promise((res, rej) => {
        let arrRGB = getarrRGB(params.color);
        for (let i = 0; i < params.atdh.length; i++) {
            const subArr = params.atdh[i];
            for (let j = 0; j < subArr.length; j++) {
                const obj = subArr[j];
                let linew = obj.linew * params.linew;

                // let bool = await getPurePxDrawnData(obj.x, obj.y, obj.lx, obj.ly, imagedatafinal, linew, arrRGB);
                getPurePxDrawnData(obj.x, obj.y, obj.lx, obj.ly, imagedatafinal, linew, arrRGB);
            }
        }
        res(imagedatafinal);
    });
}
async function getHatchedData(otdh, data, buckets) {
    return new Promise(async (res, rej) => {
        let canv0 = document.createElement("canvas");
        canv0.width = imageOriginal.width;
        canv0.height = imageOriginal.height;
        let c0 = canv0.getContext("2d", { willReadFrequently: true });
        c0.fillStyle = icHatchBg.value;
        c0.fillRect(0, 0, canv0.width, canv0.height);
        // c0.strokeStyle = paramsHatch.color;
        let data0 = c0.getImageData(0, 0, canv0.width, canv0.height);

        // let arr = [];
        let arrRGB = getarrRGB(icHatchColor.value);
        for (let h = 0; h < otdh.arrXyLim.length; h++) {
            const obj = otdh.arrXyLim[h];
            // arr.push([]);
            // let width = 0;
            for (let i = 0; i < obj.lim; i++) {
                let x = obj.x + i * otdh.dirx;
                let y = obj.y + i * otdh.diry;
                let idx = getImagedataIndex(x, y, data.width);
                let r = data.data[idx + 0];
                let g = data.data[idx + 1];
                let b = data.data[idx + 2];
                // let a = data.data[idx + 3];
                let gs = getGrayscale(r, g, b);
                // const last = arr.length - 1;
                for (let j = 1; j < buckets.length; j++) {
                    const buck = buckets[j];
                    if (gs >= buck[0] && gs <= buck[1]) {
                        // This is to hatch without the degradated pixels next to the line.
                        let offset = Math.floor((j * rsHatchLinewidth.val) / 2);
                        let start = 0;
                        if ((j * rsHatchLinewidth.val) % 2 == 0) {
                            start = -(offset - 1);
                        } else {
                            start = -offset;
                        }
                        for (let m = start; m <= offset; m++) {
                            if (x + m < 0 || x + m >= data0.width) continue;
                            for (let n = start; n <= offset; n++) {
                                if (y + n < 0 || y + n >= data0.height) continue;
                                let idx2 = getImagedataIndex(x + m, y + n, data.width);
                                data0.data[idx2 + 0] = arrRGB[0];
                                data0.data[idx2 + 1] = arrRGB[1];
                                data0.data[idx2 + 2] = arrRGB[2];
                            }
                        }
                        break;
                    }
                }
            }
        }
        res(data0);
    });
}

function get255Buckets(how_many_buckets = 0, sensitivity = 0) {
    return new Promise((res, rej) => {
        let arr = new Array(how_many_buckets);
        let bucket = Math.ceil(255 / arr.length);
        for (let i = arr.length - 1; i >= 0; i--) {
            let lowerLim = maxMin(i * bucket + sensitivity, [0, 255]);
            let upperLim = maxMin((i + 1) * bucket - 1 + sensitivity, [0, 255]);
            arr[arr.length - 1 - i] = [lowerLim, upperLim];
        }
        arr[0][1] = 255;
        arr[arr.length - 1][0] = 0;
        res(arr);
    });
}

function maxMin(value = 0, range = []) {
    return Math.min(range[1], Math.max(range[0], value));
}

function getImagedataIndex(x, y, width) {
    return (y * width + x) * 4;
}

async function getObjectToStartHatching(dir = "", separation = 0) {
    return new Promise((res, rej) => {
        // Returns:
        // obj = {
        //     arrXyLim: [{
        //         x: X coord to start evaluating pixel.
        //         y: Y coord to start evaluating pixel.
        //         lim: limit to the pixel-by=pixel evaluation.
        //     }],
        //     dirx: direction in X where the next pixel to evaluate is.
        //     diry: direction in Y where the next pixel to evaluate is.
        // }
        let obj = {
            arrXyLim: [],
            dirx: 0,
            diry: 0
        }
        let width = originalData.width;
        let height = originalData.height;
        let leftover;
        switch (dir) {
            case "DLUR":
                obj.dirx = -1;
                obj.diry = 1;
                leftover = (width - 1) % separation;
                for (let x = separation; x < width; x += separation) {
                    obj.arrXyLim.push({
                        x: x,
                        y: 0,
                        lim: Math.min(x, height)
                    });
                }
                for (let y = (separation - leftover); y < height - separation; y += separation) {
                    obj.arrXyLim.push({
                        x: width - 1,
                        y: y,
                        lim: Math.min(width - 1, height - 1 - y)
                    });
                }
                break;
            case "LR":
                obj.dirx = 1;
                obj.diry = 0;
                for (let y = 0; y < height; y += separation) {
                    obj.arrXyLim.push({
                        x: 0,
                        y: y,
                        lim: width
                    });
                }
                break;
            case "ULDR":
                obj.dirx = 1;
                obj.diry = 1;
                leftover = (height - 1) % separation;
                for (let y = height - 1 - separation; y >= 0; y -= separation) {
                    obj.arrXyLim.push({
                        x: 0,
                        y: y,
                        lim: Math.min(height - 1 - y, width)
                    });
                }
                for (let x = (separation - leftover); x < width - separation; x += separation) {
                    obj.arrXyLim.push({
                        x: x,
                        y: 0,
                        lim: Math.min(width - 1 - x, height)
                    });
                }
                break;
            case "UD":
                obj.dirx = 0;
                obj.diry = 1;
                for (let x = 0; x < width; x += separation) {
                    obj.arrXyLim.push({
                        x: x,
                        y: 0,
                        lim: height
                    });
                }
                break;
            default:
                break;
        }
        res(obj)
    });
}

//  CROSSHATCHING
var paramsCrossh = {
    linew: 2,
    bg: "white",
    color: "#000000",
    atdh: undefined
}

var paramsCrossh = { bg: "#FFFFFF", color: "#000000", linew: 2, atdh: undefined }  //  Buckets will be defined on onCrosshSlide depending on amount of directions.
var strCrosshDirections = ["ULDR", "LR", "DLUR", "UD"];

// const bucketCrossh = [[0, 255], [0, 204], [0, 153], [0, 102], [0, 51]];

const crosshSubmenuer = document.querySelector("#effectCrossh .submenuer");
const crosshDirectionsSubmenuee = document.querySelector("#crosshDirections .submenuee");
const cbgrpCrosshDirection = crosshDirectionsSubmenuee.querySelectorAll("[name=cbgrpCrosshDirection]");
cbgrpCrosshDirection.forEach(cb => {
    cb.addEventListener("change", function (evt) {
        let label = document.querySelector(`[for=${cb.id}]`);
        let use = crosshSubmenuer.querySelector(`#usefor${cb.dataset.dir}`);
        if (cb.checked) {
            strCrosshDirections.push(cb.dataset.dir);
            label.classList.add("checked");
            use.style.display = "inline";
        } else {
            idx = strCrosshDirections.indexOf(cb.dataset.dir);
            strCrosshDirections.splice(idx, 1);
            label.classList.remove("checked");
            use.style.display = "none";
        }
        onCrosshSlide();
    });
});

const rbCrosshatch = document.getElementById("rbCrosshatch");
rbCrosshatch.addEventListener("input", () => {
    if (rbCrosshatch.checked) onCrosshSlide();
});

const icCrosshColor = document.getElementById("icCrosshColor");
icCrosshColor.value = paramsCrossh.color;
const lbCrosshColor = document.querySelector("[for=icCrosshColor");
lbCrosshColor.style.backgroundColor = paramsCrossh.color;
icCrosshColor.addEventListener("input", () => {
    lbCrosshColor.style.backgroundColor = icCrosshColor.value;
    paramsCrossh.color = icCrosshColor.value;
    onCrosshSlide(paramsCrossh);
});

const icCrosshBg = document.getElementById("icCrosshBg");
icCrosshBg.value = paramsCrossh.bg;
const lbCrosshBg = document.querySelector("[for=icCrosshBg]");
lbCrosshBg.style.backgroundColor = paramsCrossh.bg;
icCrosshBg.addEventListener("input", () => {
    lbCrosshBg.style.backgroundColor = icCrosshBg.value;
    paramsCrossh.bg = icCrosshBg.value;
    onCrosshSlide(paramsCrossh);
});

const contCroshSeparation = document.querySelector("#crosshSeparation .wrapper");
var rsCrosshSeparation = new RangeSlider(contCroshSeparation, { title: "Separation", min: 3, max: 4, step: 1, color1: "#2c5270", color2: "#DDE6ED" });
rsCrosshSeparation.onslide(onCrosshSlide);

const contCrosshLinew = document.querySelector("#crosshLinew .wrapper");
const rsCrosshLinew = new RangeSlider(contCrosshLinew, { title: "Width", min: 1, max: 10, def: 2, step: 1, color1: "#2c5270", color2: "#DDE6ED" });
rsCrosshLinew.onslide(() => {
    paramsCrossh.linew = rsCrosshLinew.val;
    onCrosshSlide();
});
const contCrosshSensitivity = document.querySelector("#crosshSensitivity .wrapper");
const rsCrosshSensitivity = new RangeSlider(contCrosshSensitivity, { title: "Sensitivity", min: -250, max: 250, def: 0, step: 5, color1: "#2c5270", color2: "#DDE6ED" });
rsCrosshSensitivity.onslide(onCrosshSlide);

var objForSvg = {};
var downloadSvg = true;

async function onCrosshSlide() {
    if (imageOriginal == undefined) return;
    canvFinal.imageSmoothingEnabled = true;
    canvFinal.width = canvOriginal.width;
    canvFinal.height = canvOriginal.height;
    cf = canvFinal.getContext("2d", { willReadFrequently: true });
    cf.fillStyle = paramsCrossh.bg;
    cf.fillRect(0, 0, canvFinal.width, canvFinal.height);
    cf.strokeStyle = paramsCrossh.color;
    cf.lineWidth = rsCrosshLinew.val;

    // let blankImagedata = cf.getImageData(0, 0, canvFinal.width, canvFinal.height);
    objForSvg = {};
    for (let i = 0; i < strCrosshDirections.length; i++) {
        const dir = strCrosshDirections[i];
        const blankLimit = maxMin((255 - (i + 1) * 51) + 1 + rsCrosshSensitivity.val, [0, 255]);
        const buck = [[blankLimit, 255], [0, Math.max(blankLimit - 1, 0)]];
        paramsCrossh.atdh = await getArrToDrawHatch(dir, rsCrosshSeparation.val, buck);
        paramsCrossh.atdh.forEach(tdh => {
            tdh.forEach(dh => {
                cf.save();
                cf.beginPath();
                cf.moveTo(dh.x, dh.y);
                cf.lineTo(dh.lx, dh.ly);
                cf.stroke();
                cf.restore();
            });
        });
        // let diwATDH = await returnsDrawnImagedataWithATDH(blankImagedata, paramsCrossh);
        // cf.putImageData(diwATDH, 0, 0);
    }
    //  20, 5, -20
}

function getSerializedSvg(objforsvg) {
    return new Promise((res) => {
        let svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
        svg.setAttribute("viewBox", `0 0 ${canvFinal.width} ${canvFinal.height}`);
        for (const direction in objforsvg) {
            let path = document.createElementNS("http://www.w3.org/2000/svg", "path");
            path.setAttribute("fill", "none");
            path.setAttribute("stroke", "black");
            path.setAttribute("stroke-width", rsCrosshLinew.val);
            path.classList.add(direction);
            let d = "";
            if (Object.hasOwnProperty.call(objforsvg, direction)) {
                const dir = objforsvg[direction];
                for (let i = 0; i < dir.length; i++) {
                    const obj = dir[i];
                    d += `M ${obj.x} ${obj.y} L ${obj.lx} ${obj.ly} `;
                }
            }
            path.setAttribute("d", d);
            svg.appendChild(path);
        }
        res(svg);
    });
}

// function getArrToDrawCrossh(directions, separation) {
//     return new Promise(async (res, rej) => {
//         let arr = [];
//         for (let i = 0; i < directions.length; i++) {
//             const dir = directions[i];
//             let otsh = await getObjectToStartHatching(dir, separation);
//             arr.push(otsh);
//         }
//         res(arr);
//     });
// }
// async function onCrosshatching() {
//     if (imageOriginal == undefined) return;
//     let aotdch = await getArrObjToDrawCrossh()
//     //  TEST getArrToDrawHatch ON Hatching, with purePixel().
// }

// function getArrObjToDrawCrossh(arrDirections, separation, how_many, sensitivity) {
//     return new Promise(async (res, rej) => {
//         let arr = [];
//         for (let i = 0; i < arrDirections.length; i++) {
//             const dir = arrDirections[i];
//             let otdch = await getArrToDrawHatch(dir, separation, how_many, sensitivity);
//             arr.push(otdch);
//         }
//         res(arr);
//     });
// }

// function getArrbucketsToCrosshatch(how_many, sensitivity) {
//     return new Promise(async (res, rej) => {
//         let arr = [];
//         let every = parseInt(255 / (how_many + 1)); //  +1 because the first bucket will not be hatched, as it is the brightest area. 
//         for (let i = 1; i < how_many + 1; i++) {
//             let lim = maxMin((255 - (every * i) + sensitivity), [0, 255]);
//             let unhatched = [lim + 1, 255];
//             let hatched = [0, lim];
//             arr.push([unhatched, hatched]);
//         }
//         res(arr);
//     });
// }

// function getArrToDrawHatch(otsh, imagedata, buckets) {
async function getArrToDrawHatch(direction, separation, buckets) {
    return new Promise(async (res, rej) => {
        let width = originalData.width;
        let data = originalData.data;
        let otsh = await getObjectToStartHatching(direction, separation);
        let arr = [];
        if (!objForSvg[direction]) objForSvg[direction] = [];
        for (let h = 0; h < otsh.arrXyLim.length; h++) {
            const obj = otsh.arrXyLim[h];
            arr.push([]);
            let linewidth = 0;
            for (let i = 0; i < obj.lim; i++) {
                let x = obj.x + i * otsh.dirx;
                let y = obj.y + i * otsh.diry;
                let idx = getImagedataIndex(x, y, width);
                let r = data[idx + 0];
                let g = data[idx + 1];
                let b = data[idx + 2];
                // let a = data.data[idx + 3];
                let gs = getGrayscale(r, g, b);
                const last = arr.length - 1;
                for (let j = 0; j < buckets.length; j++) {
                    const buck = buckets[j];
                    if (gs >= buck[0] && gs <= buck[1]) {
                        if (j == 0) {  //  It means it found the brightest pixel so it won't hatch it.
                            linewidth = 0;
                            break;
                        }
                        // This generates an array with each x, y coord, its length and width.
                        if (j !== linewidth) {  //  The j counter for buckets[] is equal to the linewidth, that's why it it skips it if it is zero.
                            arr[last].push({
                                x: x,
                                y: y,
                                lx: x,
                                ly: y,
                                linew: j
                            });
                            linewidth = j;
                            objForSvg[direction].push({ x: x, y: y, lx: x, ly: y, linew: j });
                        } else {  //  It means j == the previous linewidth.
                            arr[last][arr[last].length - 1].lx += otsh.dirx;
                            arr[last][arr[last].length - 1].ly += otsh.diry;
                            objForSvg[direction][objForSvg[direction].length - 1].lx += otsh.dirx;
                            objForSvg[direction][objForSvg[direction].length - 1].ly += otsh.diry;
                        }
                        break;
                    }
                }

            }
        }
        let cleanArr = arr.filter(ar => {  //  Remove lines in which there was no hatching at all.
            return ar.length > 0;
        });
        res(cleanArr);
    });
}
// ---------

//  DECOLORATE

const contDecolorTolerance = document.querySelector("#decolorHowmany .wrapper");
const rsDecolorTolerance = new RangeSlider(contDecolorTolerance, { title: "Tolerancy", min: 5, max: 100, def: 30, step: 5 });
rsDecolorTolerance.onslide(onDecolorate);

const rbDecolor = document.getElementById("rbDecolorate");
rbDecolor.addEventListener("click", () => {
    if (rbDecolor.checked) onDecolorate();
});

var temp = 30;

async function onDecolorate() {
    let aworc = await getArrWithObjRgbCount(dataI);
    let ae = await getArryEntries(aworc);
    let aed = await getArrayEntriesDescendent(ae);
    let b255 = await getBucketed255(aed, 10);

    return;
    for (let i = 0; i < dataI.length; i += 4) {
        const pxR = dataI[i];
        const pxG = dataI[i + 1];
        const pxB = dataI[i + 2];
        let rx = parseInt(most10[0].split(",")[0]);
        let gx = parseInt(most10[0].split(",")[1]);
        let bx = parseInt(most10[0].split(",")[2]);
        let distMin = Math.sqrt((pxR - rx) ** 2 + (pxG - gx) ** 2 + (pxB - bx) ** 2);
        let closestColor = {};
        for (let j = 1; j < most10.length; j++) {
            const rx = parseInt(most10[j].split(",")[0]);
            const gx = parseInt(most10[j].split(",")[1]);
            const bx = parseInt(most10[j].split(",")[2]);
            const dist = Math.sqrt((pxR - rx) ** 2 + (pxG - gx) ** 2 + (pxB - bx) ** 2);
            if (dist < distMin) {
                distMin = dist;
                closestColor = { rx, gx, bx };
            }
        }
        dataF[i] = closestColor.rx;
        dataF[i + 1] = closestColor.gx;
        dataF[i + 2] = closestColor.bx;
    }
    cf.putImageData(finalData, 0, 0);
}

function getArryEntries(aworc) {
    return new Promise((res, rej) => {
        let arr = [];
        aworc.forEach(orc => {
            arr.push([orc.color, orc.count]);
        });
        res(arr);
    });
}

function getArrayEntriesDescendent(ae) {
    return new Promise((res, rej) => {
        ae.sort((a, b) => {
            return b[1] - a[1];
        });
        res(ae);
    });
}
function getBucketed255(aed, n) {
    return new Promise((res, rej) => {
        let bucket = parseInt(255 / n);
        let buckArr = [];
        let gotit = [];
        for (let i = 0; i < aed.length; i++) {
            const entry = aed[i];
            if (gotit.includes(i)) continue;
            gotit.push(i);
            buckArr.push([entry]);
            let ri = parseInt(entry[0].split(",")[0]);
            let gi = parseInt(entry[0].split(",")[1]);
            let bi = parseInt(entry[0].split(",")[2]);
            for (let j = i + 1; j < aed.length; j++) {
                const subEntry = aed[j];
                let rj = parseInt(subEntry[0].split(",")[0]);
                let gj = parseInt(subEntry[0].split(",")[1]);
                let bj = parseInt(subEntry[0].split(",")[2]);

                let dist = Math.sqrt((ri - rj) ** 2 + (gi - gj) ** 2 + (bi - bj) ** 2);

                if (dist <= bucket) {
                    gotit.push(j);
                    buckArr[buckArr.length - 1].push(subEntry);
                }
            }
        }
        res(buckArr);
    });
}

function getaeddescending(aed) {
    return new Promise((res, rej) => {
        aed.sort((a, b) => {
            return b[1] - a[1];
        });
        res(aed);
    });
}
function getArrWithObjRgbCount(data) {
    return new Promise((res, rej) => {
        let rgbColors = {};
        for (let i = 0; i < data.length; i += 4) {
            const pxR = data[i + 0];
            const pxG = data[i + 1];
            const pxB = data[i + 2];
            let rgbString = `${pxR}, ${pxG}, ${pxB}`;
            if (rgbColors[rgbString]) {
                rgbColors[rgbString]++;
            } else {
                rgbColors[rgbString] = 1;
            }
        }
        let arrEntries = [];
        for (let rgb in rgbColors) {
            arrEntries.push({ color: rgb, count: rgbColors[rgb] });
        }
        res(arrEntries);
    });
}

// ---------
// ---------
//  DOWNLOAD BAR
const lbDownImgSvg = document.querySelector("[for=cbDownImgSvg]");
const pathLbDownImgSvg = lbDownImgSvg.querySelector("path");
const m_pathLbDownImgSvg = new MorphPath({
    path: path1,
    arrayd: ["M 2 11 L 5 11 L 5 8 L 8 8 L 8 5 L 11 5 L 11 2 C 12 2 13 2 14 2 L 14 5 L 11 5 L 11 8 L 8 8 L 8 11 L 5 11 L 5 14 L 5 14 L 2 14 C 2 13 2 12 2 11",
        "M 2 11 L 5 11 L 5 8 L 8 8 L 8 5 L 11 5 L 11 2 C 12 2 13 2 14 2 L 14 5 L 11 5 L 11 8 L 8 8 L 8 11 L 5 11 L 5 14 L 5 14 L 2 14 C 2 13 2 12 2 11",
        "M 2 11 L 4 9 L 5 8 L 7 6 L 8 5 L 10 3 L 11 2 C 13 0 16 3 14 5 L 14 5 L 13 6 L 11 8 L 10 9 L 8 11 L 7 12 L 5 14 L 5 14 L 5 14 C 3 16 0 13 2 11",
        "M 2 11 L 4 9 L 5 8 L 7 6 L 8 5 L 10 3 L 11 2 C 13 0 16 3 14 5 L 14 5 L 13 6 L 11 8 L 10 9 L 8 11 L 7 12 L 5 14 L 5 14 L 5 14 C 3 16 0 13 2 11",
        "M 2 11 L 5 11 L 5 8 L 8 8 L 8 5 L 11 5 L 11 2 C 12 2 13 2 14 2 L 14 5 L 11 5 L 11 8 L 8 8 L 8 11 L 5 11 L 5 14 L 5 14 L 2 14 C 2 13 2 12 2 11"
    ],
    dur: 900,
    keytimes: [0, 0.2, 0.5, 0.7, 1],
    repeatcount: Infinity
})
lbDownImgSvg.addEventListener("pointerenter", () => {
    m_pathLbDownImgSvg.start();
    lbDownImgSvg.addEventListener("pointerleave", () => {
        let step = (downloadSvg) ? 2 : 0;
        m_pathLbDownImgSvg.stop(step);
    });
});

const cbDownImgSvg = document.getElementById("cbDownImgSvg");
cbDownImgSvg.addEventListener("click", () => {
    if (cbDownImgSvg.checked) {
        downloadSvg = true;
        // pathLbDownImgSvg.setAttribute("d", "M 2 11 L 4 9 L 5 8 L 7 6 L 8 5 L 10 3 L 11 2 C 13 0 16 3 14 5 L 14 5 L 13 6 L 11 8 L 10 9 L 8 11 L 7 12 L 5 14 L 5 14 L 5 14 C 3 16 0 13 2 11");
    } else {
        downloadSvg = false;
        // pathLbDownImgSvg.setAttribute("d", "M 2 11 L 5 11 L 5 8 L 8 8 L 8 5 L 11 5 L 11 2 C 12 2 13 2 14 2 L 14 5 L 11 5 L 11 8 L 8 8 L 8 11 L 5 11 L 5 14 L 5 14 L 2 14 C 2 13 2 12 2 11");
    }
});


const btnDownImg = document.getElementById("btnDownImg");
btnDownImg.addEventListener("click", async () => {
    if (cbDownImgSvg.checked) {
        let svg = await getSerializedSvg(objForSvg);
        let serializer = new XMLSerializer();
        let str = serializer.serializeToString(svg);
        let dataUri = `data:image/svg+xml;base64,${btoa(str)}`;
        let a = document.createElement("a");
        a.style.display = "none";
        a.href = dataUri;
        a.download = getName("svg");
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    } else {
        let link = document.createElement("a");
        link.download = getName("png");
        link.href = canvFinal.toDataURL();
        link.click();
    }
});

function getName(strExt) {
    let now = new Date();
    let date = `${now.getFullYear()}-${now.getMonth()}-${(now.getDate() < 10) ? "0" + now.getDate() : now.getDate()}`;
    let time = `${now.getHours()}.${now.getMinutes()}.${(now.getMilliseconds()).toFixed(2)}`;
    return `Pictunator ${date} ${time}.${strExt}`;
}

// ---------
// LOADING IMAGE
// To load image into the browser.
const ifGaImage = document.getElementById("ifGaImage");
const ifGaImageName = document.getElementById("ifGaImageName");
var smallestDim;

ifGaImage.addEventListener("input", async (evt) => {
    imageOriginal = await getLoadedImage(evt);
    smallestDim = smallestDimension(imageOriginal);
    ifGaImageName.innerText = evt.target.files[0].name;
    canvOriginal.width = imageOriginal.width;
    canvOriginal.height = imageOriginal.height;
    canvFinal.width = imageOriginal.width;
    canvFinal.height = imageOriginal.height;
    co.drawImage(imageOriginal, 0, 0, canvOriginal.width, canvOriginal.height);
    originalData = co.getImageData(0, 0, canvOriginal.width, canvOriginal.height);
    dataI = originalData.data;

    // cf.drawImage(imageOriginal, 0, 0, canvOriginal.width, canvOriginal.height);
    finalData = cf.getImageData(0, 0, canvOriginal.width, canvOriginal.height);
    dataF = finalData.data;

    // Grid settings.
    if (rbGrid.checked) onGridSlide();

    // Pixelate settings.
    paramsPixelate.max = smallestDim / 10;
    paramsPixelate.def = paramsPixelate.max / 4;
    rsPixelate = new RangeSlider(contPixelateSlider, paramsPixelate);
    rsPixelate.onslide(onPixelateSlide);
    if (rbPixelate.checked) onGridSlide();

    // Black & White settings.
    rsMonoSensitivity.onslide(onMonochromeSlide);
    if (rbMonochrome.checked) onMonochromeSlide();

    // Gray-scaling settings.
    if (rbGrayscaling.checked) onGrayscalingSlide();

    //  Hatching settings.
    let newMax = parseInt(smallestDim / 10);
    let newDef = parseInt(newMax / 3);
    rsHatchSeparation = new RangeSlider(contHatchSeparation, { title: "Separation", min: 2, max: newMax, step: 1, def: newDef, color1: "#2c5270", color2: "#DDE6ED" });
    rsHatchSeparation.onslide(async () => {
        paramsHatch.atdh = await getArrToDrawHatch(strHatchDir, rsHatchSeparation.val, paramsHatch.buckets);
        onHatchSlide(paramsHatch);
    });

    if (rbHatching.checked) {
        paramsHatch.atdh = await getArrToDrawHatch(strHatchDir, rsHatchSeparation.val, paramsHatch.buckets);
        onHatchSlide(paramsHatch);
    }

    //  Crosshatching settings.
    let crosshSepMax = parseInt(smallestDim / (10));
    let crosshSepDef = parseInt(crosshSepMax / 10 * 4);
    rsCrosshSeparation = new RangeSlider(contCroshSeparation, { title: "Separation", min: 3, max: crosshSepMax, step: 1, def: crosshSepDef, color1: "#2c5270", color2: "#DDE6ED" });
    rsCrosshSeparation.onslide(() => {
        onCrosshSlide(paramsCrossh);
    });
    if (rbCrosshatch.checked) onCrosshSlide(paramsCrossh);

    //  Decolorate settings.
    if (rbDecolor.checked) onDecolorate();
});

// GENERAL FUNCTIONS

function getGrayscale(r, g, b) {
    // return parseInt(r * 0.2426 + g * 0.7152 + b * 0.0822);
    return parseInt(0.299 * r + 0.587 * g + 0.114 * b);
}

function getarrRGB(color) {
    let element = document.createElement("div");
    element.style.backgroundColor = color;
    element.style.display = "none";
    document.body.appendChild(element);
    let rgbStr = window.getComputedStyle(element).backgroundColor;
    // rgb(255, 255, 255)
    document.body.removeChild(element);
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
    rgb[0] = parseInt(arr0.join(""));
    // ' 255'

    rgb[1] = parseInt(rgb[1]);   // '  255'
    rgb[2] = parseInt(rgb[2]);   // '  255)'
    return rgb;
}

function getPurePxDrawnData(x1, y1, x2, y2, imagedata, linew, arrRGB) {
    const width = imagedata.width;
    const dx = x2 - x1;
    const dy = y2 - y1;
    const m = dy / dx || Infinity;
    const b = y1 - m * x1;
    const offset = linew - 1;
    // return new Promise((res, rej) => {
    for (let i = 0; i < Math.abs(dx) + 1; i++) {
        let x = x1 + i * Math.sign(dx);
        let prevX = x - Math.sign(dx);
        let startY = parseInt(prevX * m + b) + Math.sign(dy);
        let endY = parseInt(x * m + b);
        if (m == Infinity) {
            startY = y1;
            endY = y2;
        }
        for (let y = startY; y <= endY; y++) {
            for (let m = -offset; m <= offset; m++) {
                // let idx = (y * width + (x + m)) * 4;
                // data[idx + 0] = arrRGB[0];
                // data[idx + 1] = arrRGB[1];
                // data[idx + 2] = arrRGB[2];
                for (let n = 0; n <= offset; n++) {
                    let subIdx1 = ((y + n) * width + (x + m)) * 4;
                    imagedata.data[subIdx1 + 0] = arrRGB[0];
                    imagedata.data[subIdx1 + 1] = arrRGB[1];
                    imagedata.data[subIdx1 + 2] = arrRGB[2];
                    let subIdx2 = ((y - n) * width + (x + m)) * 4;
                    imagedata.data[subIdx2 + 0] = arrRGB[0];
                    imagedata.data[subIdx2 + 1] = arrRGB[1];
                    imagedata.data[subIdx2 + 2] = arrRGB[2];
                }
            }

            // data[idx + 0] = arrRGB[0];
            // data[idx + 1] = arrRGB[1];
            // data[idx + 2] = arrRGB[2];
        }
    }
    //     res(true);
    // });
}
