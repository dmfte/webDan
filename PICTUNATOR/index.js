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
var originalData;  // Image data.

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
var rsGridAmtSqrs = new RangeSlider(contGridAmtSqrs, { label: "Number of squares", min: 2, step: 1, max: 30, def: 5, color1: "#2c5270", color2: "#DDE6ED" });
var rsGridLinew = new RangeSlider(contGridLinew, { label: "Line width", min: 1, step: 1, max: 30, def: 2, color1: "#2c5270", color2: "#DDE6ED" });

rsGridAmtSqrs.onSliding(onGridSlide);
rsGridLinew.onSliding(onGridSlide);

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
    label: "1/x size",
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


//  BLACK & WHITE EFFECT
const rbMonochrome = document.getElementById("rbMonochrome");
rbMonochrome.addEventListener("click", onMonochromeSlide);

const icMonoColor = document.getElementById("icMonoColor");
const lbMonoColor = document.querySelector("[for=icMonoColor]");
icMonoColor.value = "#000000";
lbMonoColor.style.backgroundColor = icMonoColor.value;
var objMonoColorRgb = getObjRgb(icMonoColor.value);
icMonoColor.addEventListener("input", () => {
    lbMonoColor.style.backgroundColor = icMonoColor.value;
    objMonoColorRgb = getObjRgb(icMonoColor.value);
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
var rsMonoSeparation = new RangeSlider(contMonoSeparation, { label: "separation", min: 3, max: 50, step: 1, def: 10, color1: "#2c5270", color2: "#DDE6ED" });
rsMonoSeparation.onSliding(onMonochromeSlide);

const contMonoShades = document.querySelector("#monoShades .wrapper");
var rsMonoShades = new RangeSlider(contMonoShades, { label: "Shades", min: 1, max: 20, step: 1, def: 3, color1: "#2c5270", color2: "#DDE6ED" });
rsMonoShades.onSliding(onMonochromeSlide);

const contMonoSizes = document.querySelector("#monoSize .wrapper");
var rsMonoSize = new RangeSlider(contMonoSizes, { label: "Size", min: 1, max: 10, step: 1, color1: "#2c5270", color2: "#DDE6ED" });
rsMonoSize.onSliding(onMonochromeSlide)

const contMonoSenitivity = document.querySelector("#monoSensitivity .wrapper");
var rsMonoSensitivity = new RangeSlider(contMonoSenitivity, { label: "Sensitivity", min: -250, max: 250, step: 5, def: 0, color1: "#2c5270", color2: "#DDE6ED" });
rsMonoSensitivity.onSliding(onMonochromeSlide);


// Functions
var msa = [], arrMonochromed = [];
var finalData = new Object;
async function onMonochromeSlide() {
    if (imageOriginal !== undefined) {
        let canvFinal = document.createElement("canvas");
        canvFinal.width = canvOriginal.width;
        canvFinal.height = canvOriginal.height;
        cf.fillStyle = icMonoBg.value;
        cf.fillRect(0, 0, canvFinal.width, canvFinal.height);
        finalData = cf.getImageData(0, 0, canvFinal.width, canvFinal.height);
        msa = await getMonoSeparationArray(originalData, rsMonoSeparation.val);
        // let newData = await getMonocrhomedData(originalData, msa, icMonoColor.value, rsMonoShades.val, rsMonoSize.val, rsMonoSensitivity.val);
        // cf.putImageData(newData, 0, 0);
        arrMonochromed = await getMonocrhomedData();
        // let bool = await paintArray();
        // if (bool) cf.putImageData(finalData, 0, 0);
        paintArray();
        cf.putImageData(finalData, 0, 0);

    }
}

async function paintArray() {
    return new Promise((res, rej) => {
        for (let i = 0; i < arrMonochromed.length; i++) {
            const xy = arrMonochromed[i];
            paintXy(xy[0], xy[1], finalData, objMonoColorRgb);
        }
        res(true);
    });
}

async function getMonoSeparationArray() {
    return new Promise((res, rej) => {
        let arr = [];
        for (let x = 0; x < originalData.width; x++) {
            if (x % rsMonoSeparation.val !== 0) continue;
            for (let y = 0; y < originalData.height; y++) {
                if (y % rsMonoSeparation.val !== 0) continue;
                arr.push([x, y]);
            }
        }
        res(arr);
    });
}

// async function getMonocrhomedData(data, separatedArray = [], color = "", shades = 0, size = 0, sensitivity = 0) {
async function getMonocrhomedData() {
    return new Promise(async (res, rej) => {
        let width = originalData.width;
        let height = originalData.height;
        let buckets = await get255Buckets(rsMonoShades.val + 1, rsMonoSensitivity.val);
        let arr = [];
        for (let i = 0; i < msa.length; i++) {
            const x = msa[i][0];
            const y = msa[i][1];
            let idx = getImagedataIndex(x, y, originalData.width);
            let r = originalData.data[idx + 0];
            let g = originalData.data[idx + 1];
            let b = originalData.data[idx + 2];
            let gs = getGrayscale(r, g, b);
            for (let b = 1; b < buckets.length; b++) {
                const buck = buckets[b];
                if (gs >= buck[0] && gs <= buck[1]) {
                    // Paint rhombus.
                    // Paint center pixel.
                    // paintXy(x, y, finalData, color);
                    arr.push([x, y]);
                    // Paint other pixes.
                    for (let m = b * rsMonoSize.val; m > 0; m--) {
                        for (let n = m; n > 0; n--) {
                            let side1x = maxMin(x + m - n, [0, width - 1]);
                            let side1y = maxMin(y - n, [0, height - 1]);
                            // paintXy(side1x, side1y, finalData, color);
                            arr.push([side1x, side1y]);
                            let side2x = maxMin(x + n, [0, width - 1]);
                            let side2y = maxMin(y + m - n, [0, height - 1]);
                            // paintXy(side2x, side2y, finalData, color);
                            arr.push([side2x, side2y]);
                            let side3x = maxMin(x - (m - n), [0, width - 1]);
                            let side3y = maxMin(y + n, [0, height - 1]);
                            // paintXy(side3x, side3y, finalData, color);
                            arr.push([side3x, side3y]);
                            let side4x = maxMin(x - n, [0, width - 1]);
                            let side4y = maxMin(y - (m - n), [0, height - 1]);
                            // paintXy(side4x, side4y, finalData, color);
                            arr.push([side4x, side4y]);
                        }
                    }
                }
            }
        }
        // res(finalData);
        res(arr);
    });
}

function getMonochromImgData(imgdata, sensitivity, color, bg) {
    return new Promise(async (res, rej) => {
        //  Depending on grayscale value of one pixel (of every two pixels), the adjacent pixels in a 2x2 grid
        //  will be all white, 1, 2, 3, or all 4 pixels black (5 buckets).
        let canv0 = document.createElement("canvas");
        canv0.width = Math.floor(imageOriginal.width / 2) * 2;
        canv0.height = Math.floor(imageOriginal.height / 2) * 2;
        let c0 = canv0.getContext("2d", { willReadFrequently: true });
        c0.fillStyle = bg;
        c0.strokeStyle = color;
        let objRgb = getObjRgb(color);
        c0.fillRect(0, 0, canv0.width, canv0.height);
        let newImgData = c0.getImageData(0, 0, canv0.width, canv0.height);
        let buckets = await get255Buckets(5, sensitivity)
        let pixels = [0, 0, (newImgData.width + 1) * 4, 1 * 4, newImgData.width * 4];  //  Analogus array to buckets. First value is 0 because first value of buckets will be ignored.
        for (let i = 0; i < imgdata.data.length; i += 8) {  //  Itterating every two pixels.
            let x = ((i / 4) % imgdata.width);
            if (x == imgdata.width - 1) {
                // If the current pixel is the very last at the right edge, it means the width is not an even number.
                i = i - 4;
                continue;
            };
            let y = Math.floor((i / 4) / imgdata.width);
            if (y % 2 == 1) continue;  //  If it is an odd row, already drawn during the previous (even) row.
            if (y == imgdata.height - 1) break;  // If the current pixel is the very last at the bottom  edge.

            let r = imgdata.data[i + 0];
            let g = imgdata.data[i + 1];
            let b = imgdata.data[i + 2];
            // let a = imgdata.data[i + 3];
            let gs = getGrayscale(r, g, b);
            for (let j = 1; j < buckets.length; j++) {
                const b = buckets[j];
                if (gs >= b[0] && gs <= b[1]) {
                    for (let k = 1; k <= j; k++) {
                        const px = pixels[k];
                        newImgData.data[i + px + 0] = objRgb.r;
                        newImgData.data[i + px + 1] = objRgb.g;
                        newImgData.data[i + px + 2] = objRgb.b;
                        // newImgData.data[i + px + 3] = 0;
                    }
                    break;
                }
            }
        }
        res(newImgData);
    });
}


function getObjRgb(color) {
    // return new Promise((res, rej) => {
        let element = document.createElement("div");
        element.style.backgroundColor = color;
        element.style.display = "none";
        document.body.appendChild(element);
        let rgbStr = window.getComputedStyle(element).backgroundColor;
        // rgb(255, 255, 255)
        document.body.removeChild(element);
        rgb = rgbStr.split(",");
        if (rgb.length > 3) {
            // ['rgba(255', ' 255', ' 255', ' 255)']
            rgb.splice(3, rgb.length);
            // ['rgba(255', ' 255', ' 255']
        }
        let parenthesis = rgb[0].match(/\(/).index;
        // 'rgba(255' index of '('.
        rgb[0] = rgb[0].split("");
        rgb[0].splice(0, parenthesis + 1);
        rgb[0] = parseInt(rgb[0].join(""));
        // ' 255'

        rgb[1] = parseInt(rgb[1]);   // '  255'
        rgb[2] = parseInt(rgb[2]);   // '  255)'
        // res({
        //     r: rgb[0],
        //     g: rgb[1],
        //     b: rgb[2]
        // });
    // });
    return {
            r: rgb[0],
            g: rgb[1],
            b: rgb[2]
        }
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

var rsGrayscalingLevels = new RangeSlider(contGrayscalingLevels, { label: "Levels of gray", min: 2, max: 20, step: 1, def: 3, color1: "#2c5270", color2: "#DDE6ED" });
//  More than 20 grayscale tones are barely distinguishable.
var rsGrayScalingSensitivity = new RangeSlider(contGrayscalingSensitivity, { label: "Sensitivity", min: -254, step: 1, max: 254, def: 0, color1: "#2c5270", color2: "#DDE6ED" });
rsGrayscalingLevels.onSliding(onGrayscalingSlide);
rsGrayScalingSensitivity.onSliding(onGrayscalingSlide);

async function onGrayscalingSlide() {
    if (imageOriginal !== undefined) {
        let newImgData = await getGrayscalledImgData(rsGrayscalingLevels.val, rsGrayScalingSensitivity.val, cbGrayscalingBnw.checked);
        cf.putImageData(newImgData, 0, 0);
    }
}

function getGrayscalledImgData(howmany, sensitivity, boolBnw) {
    return new Promise(async (res, rej) => {
        let arrBucket = await get255Buckets(howmany, sensitivity);
        let arrValues = new Array(howmany);
        let bucket = (boolBnw) ? 255 / (howmany - 1) : 255 / (howmany + 1);
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
// var atsh, atdh;

const rbHatching = document.getElementById("rbHatching");
rbHatching.addEventListener("click", onHatchSlide);

// var paramsHatch = { atdh: undefined, color: "#000000", bg: "#FFFFFF", dir: "DLUR", separation: 5, linew: 3, howmany: 3 };

const icHatchColor = document.getElementById("icHatchColor");
icHatchColor.value = "#000000";
const lbHatchColor = document.querySelector("[for=icHatchColor]");
lbHatchColor.style.backgroundColor = "#000000";
icHatchColor.addEventListener("input", () => {
    lbHatchColor.style.backgroundColor = icHatchColor.value;
    onHatchSlide();
});

const icHatchBg = document.getElementById("icHatchBg");
icHatchBg.value = "#FFFFFF"
const lbHatchBg = document.querySelector("[for=icHatchBg]");
lbHatchBg.style.backgroundColor = "#FFFFFF"
icHatchBg.addEventListener("input", () => {
    lbHatchBg.style.backgroundColor = icHatchBg.value;
    onHatchSlide();
});

const contHatchHowmanyw = document.querySelector("#hatchHowmanyw .wrapper");
var rsHatchHowmanyw = new RangeSlider(contHatchHowmanyw, { label: "Lines", min: 3, max: 10, def: 3, step: 1, color1: "#2c5270", color2: "#DDE6ED" });
rsHatchHowmanyw.onSliding(onHatchSlide);

const contHatchSeparation = document.querySelector("#hatchSeparation .wrapper");
var paramsHatchSeparation = { label: "Separation", min: 2, max: 3, step: 1, def: 3, color1: "#2c5270", color2: "#DDE6ED" };
var rsHatchSeparation = new RangeSlider(contHatchSeparation, paramsHatchSeparation);  //  Will be reinitialized when image is loaded.
rsHatchSeparation.onSliding(onHatchSlide);

const contHatchLinewidth = document.querySelector("#hatchLinewidth .wrapper");
var rsHatchLinewidth = new RangeSlider(contHatchLinewidth, { label: "Width", min: 1, max: 20, def: 2, step: 1, color1: "#2c5270", color2: "#DDE6ED" });
rsHatchLinewidth.onSliding(onHatchSlide);

const contHatchSensitivity = document.querySelector("#hatchSensitivity .wrapper");
var rsHatchSensitivity = new RangeSlider(contHatchSensitivity, { label: "Sensitivity", min: -250, max: 250, step: 5, def: 0, color1: "#2c5270", color2: "#DDE6ED" });
rsHatchSensitivity.onSliding(onHatchSlide);

var strHatchDirection = "DLUR";
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
        strHatchDirection = bthd.value;
        onHatchSlide();
    });
});


svgCurrDir.setAttribute("viewBox", "0 0 10 10");



async function onHatchSlide() {
    if (imageOriginal !== undefined) {
        let otsh = await getObjectToStartHatching(strHatchDirection, imageOriginal.width, imageOriginal.height, rsHatchSeparation.val);
        let newData = await getHatchedData(otsh, originalData, rsHatchHowmanyw.val, rsHatchSensitivity.val);
        // getArrayToDrawHatch(otsh, originalData, rsHatchHowmanyw.val, rsHatchSensitivity.val);
        // paramsHatch.linew = rsHatchLinewidth.val;
        // justDrawHatch(paramsHatch);
        canvFinal.imageSmoothingEnabled = false;
        canvFinal.width = canvOriginal.width;
        canvFinal.height = canvOriginal.height;
        cf.putImageData(newData, 0, 0);
    }
}

function justDrawHatch(params) {
    canvFinal.imageSmoothingEnabled = false;
    canvFinal.width = canvOriginal.width;
    canvFinal.height = canvOriginal.height;
    cf.fillStyle = params.bg;
    cf.strokeStyle = params.color;
    cf.fillRect(0, 0, canvFinal.width, canvFinal.height);
    params.atdh.forEach(arrTdh => {
        arrTdh.forEach(tdh => {
            cf.save();
            cf.lineWidth = tdh.width * params.linew;
            cf.translate(tdh.x, tdh.y);
            cf.beginPath();
            cf.moveTo(0, 0);
            cf.lineTo(tdh.lx, tdh.ly);
            cf.stroke();
            cf.restore();
        });
    });
}
async function getHatchedData(otdh, data, how_many_buckets, sensitivity) {
    return new Promise(async (res, rej) => {
        let canv0 = document.createElement("canvas");
        canv0.width = imageOriginal.width;
        canv0.height = imageOriginal.height;
        let c0 = canv0.getContext("2d", { willReadFrequently: true });
        c0.fillStyle = icHatchBg.value;
        c0.fillRect(0, 0, canv0.width, canv0.height);
        // c0.strokeStyle = paramsHatch.color;
        let data0 = c0.getImageData(0, 0, canv0.width, canv0.height);
        let buckets = await get255Buckets(how_many_buckets + 1, sensitivity);
        // let arr = [];
        let objRgb = getObjRgb(icHatchColor.value);
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
                                data0.data[idx2 + 0] = objRgb.r;
                                data0.data[idx2 + 1] = objRgb.g;
                                data0.data[idx2 + 2] = objRgb.b;
                            }
                        }
                        break;

                        // This generates an array with each x,y coord, its length and width.
                        //     if (j !== width) {
                        //         arr[last].push({
                        //             x: x,
                        //             y: y,
                        //             lx: otdh.dirx,
                        //             ly: otdh.diry,
                        //             width: j
                        //         });
                        //         width = j;
                        //     } else {
                        //         arr[last][arr[last].length - 1].lx += otdh.dirx;
                        //         arr[last][arr[last].length - 1].ly += otdh.diry;
                        //     }
                        //     break;
                        // }
                        // width = 0;


                    }
                }
            }
            // let cleanArr = arr.filter(ar => {
            //     return ar.length > 0;
            // });
            // res(cleanArr);
        }
        res(data0);
    });
}

function paintXy(x, y, data, colorObj) {
    let idx = getImagedataIndex(x, y, data.width);
    // let rgb = getObjRgb(color);
    data.data[idx + 0] = colorObj.r;
    data.data[idx + 1] = colorObj.g;
    data.data[idx + 2] = colorObj.b;
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

async function getObjectToStartHatching(dir = "", width = 0, height = 0, separation = 0) {
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


// ---------
//  DOWNLOAD BAR
const btnDownImg = document.getElementById("btnDownImg");
btnDownImg.addEventListener("click", () => {
    let link = document.createElement("a");
    let now = new Date();
    let date = `${now.getFullYear()}-${now.getMonth()}-${(now.getDate() < 10) ? "0" + now.getDate() : now.getDate()}`;
    let time = `${now.getHours()}.${now.getMinutes()}.${(now.getMilliseconds()).toFixed(2)}`;
    link.download = `Pictunator ${date} ${time}.png`;
    link.href = canvFinal.toDataURL();
    link.click();
});


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

    // Grid settings.
    if (rbGrid.checked) onGridSlide();

    // Pixelate settings.
    paramsPixelate.max = smallestDim / 10;
    paramsPixelate.def = paramsPixelate.max / 4;
    rsPixelate = new RangeSlider(contPixelateSlider, paramsPixelate);
    rsPixelate.onSliding(onPixelateSlide);
    if (rbPixelate.checked) onGridSlide();

    // Black & White settings.
    rsMonoSensitivity.onSliding(onMonochromeSlide);
    if (rbMonochrome.checked) onMonochromeSlide();

    // Gray-scaling settings.
    if (rbGrayscaling.checked) onGrayscalingSlide();

    //  Hatching settings.
    paramsHatchSeparation.max = parseInt(smallestDim / 10);
    paramsHatchSeparation.def = parseInt(paramsHatchSeparation.max / 3);
    rsHatchSeparation = new RangeSlider(contHatchSeparation, paramsHatchSeparation);
    rsHatchSeparation.onSliding(onHatchSlide);
    rsHatchSeparation.onSliding(onHatchSlide);
    if (rbHatching.checked) onHatchSlide();
});

function getGrayscale(r, g, b) {
    return parseInt(r * 0.2426 + g * 0.7152 + b * 0.0822);
}