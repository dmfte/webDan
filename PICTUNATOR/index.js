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
var paramsMonochrom = {
    color: "#000000",
    bg: "#FFFFFF",
    sensitivity: 0
}
// var paramsmonoSensitivity = {label: "Sensitivity", min: -254, max: 254, step: 1, def: 0, color1: "#2c5270", color2: "#DDE6ED"}
const contMonoSenitivity = document.querySelector("#effectMonochrom .cont.slider#monoSensitivity .wrapper");
const rbMonochrom = document.getElementById("rbMonochrom");
var rsMonoSensitivity = new RangeSlider(contMonoSenitivity, { label: "Sensitivity", min: -254, max: 254, step: 1, def: paramsMonochrom.sensitivity, color1: "#2c5270", color2: "#DDE6ED" });


rbMonochrom.addEventListener("click", () => {
    if (imageOriginal !== undefined) onMonochromSlide();
});

// Functions
async function onMonochromSlide() {
    let newImgData = await getMonochromImgData(originalData, rsMonoSensitivity.val, paramsMonochrom.color, paramsMonochrom.bg);
    cf.putImageData(newImgData, 0, 0);
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
        let objRgb = await getObjRgb(color);
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
            let gs = parseInt(r * 0.2426 + g * 0.7152 + b * 0.0822);
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
    return new Promise((res, rej) => {
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
        res({
            r: rgb[0],
            g: rgb[1],
            b: rgb[2]
        });
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

var rsGrayscalingLevels = new RangeSlider(contGrayscalingLevels, { label: "Levels of gray", min: 2, max: 20, step: 1, def: 3 });
//  More than 20 grayscale tones are barely distinguishable.
var rsGrayScalingSensitivity = new RangeSlider(contGrayscalingSensitivity, { label: "Sensitivity", min: -254, step: 1, max: 254, def: 0 });
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

function getAllowedRange(num, min, max) {
    if (num < min) return min;
    if (num > max) return max;
    return num;
}
// ---------

// HATCHING
var paramsHatch = { gahl: undefined, color: "#000000", bg: "#FFFFFF", linew: 3 }
var paramsHatchSeparation = { label: "Separation", min: 2, step: 1, max: 4, def: 2 }
//  Max will be changed to a fifth of the smallest image dimension when image is loaded.
// Default value will be changed to a quarter of max.

const contHatchHowmanyw = document.querySelector("#effectHatching .cont.slider#hatchHowmanyw .wrapper");
const contHatchSeparation = document.querySelector("#effectHatching .cont.slider#hatchSeparation .wrapper");
const contHatchLinewidth = document.querySelector("#effectHatching .cont.slider#hatchLinewidth .wrapper");
const contHatchSensitivity = document.querySelector("#effectHatching .cont.slider#hatchSensitivity .wrapper");
const icHatchColor = document.querySelector("#effectHatching .cont.other .btn.color #icHatchColor");
const lbHatchColor = document.querySelector("#effectHatching .cont.other .btn.color #icHatchColor~label");
icHatchColor.value = paramsHatch.color;
lbHatchColor.style.backgroundColor = icHatchColor.value;
icHatchColor.addEventListener("input", () => {
    lbHatchColor.style.backgroundColor = icHatchColor.value;
    paramsHatch.color = icHatchColor.value;
    onHatchingSlide();
});
const icHatchBgColor = document.querySelector("#effectHatching .cont.other .btn.color #icHatchBgColor");
const lbHatchBgColor = document.querySelector("#effectHatching .cont.other .btn.color #icHatchBgColor~label");
icHatchBgColor.value = paramsHatch.bg;
lbHatchBgColor.style.backgroundColor = icHatchBgColor.value;
icHatchBgColor.addEventListener("input", () => {
    lbHatchBgColor.style.backgroundColor = icHatchBgColor.value;
    paramsHatch.bg = icHatchBgColor.value;
    onHatchingSlide();
});

var rsHatchHowmanyw = new RangeSlider(contHatchHowmanyw, { label: "Different lines", min: 1, max: 10, step: 1, def: 3 });
var rsHatchSeparation = new RangeSlider(contHatchSeparation, paramsHatchSeparation);
var rsHatchLinewidth = new RangeSlider(contHatchLinewidth, { label: "Line width", min: 1, max: 10, step: 1, def: paramsHatch.linew });
var rsHatchSensitivity = new RangeSlider(contHatchSensitivity, { label: "Sensitivity", min: -250, max: 250, step: 5, def: 0 });

rbHatching.addEventListener("click", () => {
    if (imageOriginal !== undefined) {
        onHatchingSlide();
    }
});

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
        if (imageOriginal !== undefined) paramsHatch.gahl = await getArrayHatchedLines(strHatchDirection, rsHatchSeparation.val, rsHatchHowmanyw.val, rsHatchSensitivity.val);
        onHatchingSlide();
    });
});


svgCurrDir.setAttribute("viewBox", "0 0 10 10");
// ------
async function onHatchingSlide() {
    if (paramsHatch.gahl !== undefined && imageOriginal !== undefined) {
        cf.fillStyle = paramsHatch.bg;
        cf.fillRect(0, 0, canvFinal.width, canvFinal.height);
        cf.strokeStyle = paramsHatch.color;
        paramsHatch.gahl.forEach(ahl => {
            ahl.forEach(hl => {
                cf.save();
                cf.lineWidth = hl.width * paramsHatch.linew;
                cf.translate(hl.movetoX * 3, hl.movetoY * 3);
                cf.beginPath();
                cf.moveTo(0, 0);
                cf.lineTo(hl.directionX * 3, hl.directionY * 3);
                cf.stroke();
                cf.restore();
            });
        });
    }
}

function getArrayHatchedLines(direction, separation, howmany, sensitivity) {
    return new Promise(async (res, rej) => {
        let canv0 = document.createElement("canvas");
        //  Original image's sizes  are divided by 3 so the hatching can be drawn at least in a 3x3px grid. 
        canv0.width = Math.floor(imageOriginal.width / 3);
        canv0.height = Math.floor(imageOriginal.height / 3);
        let c0 = canv0.getContext("2d", { willReadFrequently: true });
        c0.imageSmoothingEnabled = true;
        c0.drawImage(imageOriginal, 0, 0, canv0.width, canv0.height);
        //  Final Canvas has to be resized. Otherwise there will be leftover blank pixesl at the right and bottom edges.
        canvFinal.width = canv0.width * 3;
        canvFinal.height = canv0.height * 3;
        cf.imageSmoothingEnabled = true;
        let otsh = await getObjToStartHatching(canv0, direction, separation);
        let arrLimits = await get255Buckets(howmany + 1, sensitivity); //  1 added to the amount of widths so there's an extra bucket that will be white.
        let arr = [];
        let imgdat0 = c0.getImageData(0, 0, canv0.width, canv0.height);

        for (let i = 0; i < otsh.arr.length; i++) {
            const subObj = otsh.arr[i];
            let subX = subObj.x - otsh.dx;
            let subY = subObj.y - otsh.dy;
            arr.push([]);
            let bucket, prevBucket;
            for (let j = 0; j < subObj.subLen; j++) {
                subX = subX + otsh.dx;
                subY = subY + otsh.dy;
                let indx = ((subY * canv0.width) + subX) * 4;
                let r = imgdat0.data[indx + 0];
                let g = imgdat0.data[indx + 1];
                let b = imgdat0.data[indx + 2];
                // let a = imgdat.data[indx + 3];
                let gs = parseInt(r * 0.2126 + g * 0.7152 + b * 0.0722);
                bucket = getBucketIndex(gs, arrLimits);
                if (bucket == 0) {
                    prevBucket = bucket;
                    continue;
                }
                if (arr[arr.length - 1].length <= 0) {  //  It means it is the first pixel of the line to be marked.
                    arr[arr.length - 1].push({
                        width: bucket,
                        movetoX: subX,
                        movetoY: subY,
                        directionX: otsh.dx,
                        directionY: otsh.dy
                    });
                    prevBucket = bucket;
                    continue;
                }
                if (bucket == prevBucket) {  //  The current pixel is within the same range as the previous one.
                    arr[arr.length - 1][arr[arr.length - 1].length - 1].directionX += otsh.dx;
                    arr[arr.length - 1][arr[arr.length - 1].length - 1].directionY += otsh.dy;
                    continue;
                }  //  Otherwise, it means it is a different line width.
                arr[arr.length - 1].push({
                    width: bucket,
                    movetoX: subX,
                    movetoY: subY,
                    directionX: otsh.dx,
                    directionY: otsh.dy
                });
                prevBucket = bucket;
                continue;
            }
        }
        let newArr = arr.filter(ar => {
            return ar.length > 0;
        });
        res(newArr);
    });
}

function getBucketIndex(num, arrBuckets) {
    let indx;
    arrBuckets.forEach((buck, i) => {
        if (num >= buck[0] && num <= buck[1]) indx = i;
    });
    return indx;
}

function get255Buckets(how_many_buckets, sensitivity) {
    return new Promise((res, rej) => {
        let arr = new Array(how_many_buckets);
        let bucket = parseInt(255 / how_many_buckets);
        for (let i = how_many_buckets - 1; i >= 0; i--) {
            let lowerLim = getMinMaxLimit(i * bucket + sensitivity, 0, 255);
            let upperLim = getMinMaxLimit((i + 1) * bucket - 1 + sensitivity, 1, 255);
            arr[arr.length - 1 - i] = [lowerLim, upperLim];
        }
        arr[0][1] = 255;
        arr[arr.length - 1][0] = 0;
        res(arr);
    });
}

function getMinMaxLimit(numValue, numMin, numMax) {
    return Math.max(Math.min(numValue, numMax), numMin);
}

function getObjToStartHatching(canvasSource, strdirection, separation) {
    return new Promise((res, rej) => {
        let w = canvasSource.width;
        let h = canvasSource.height;
        let obj;
        switch (strdirection) {
            case "DLUR":
                obj = {
                    dx: -1,
                    dy: 1,
                    arr: []
                };
                //  x coord needs to move 2 spaces to the right to draw the diagonal line from top-right to bottom-left in a 3x3px grid
                for (let i = 0; i < w; i++) {
                    if (i % separation !== 0) continue;
                    obj.arr.push({
                        // x: i + 2,
                        x: i,
                        y: 0,
                        subLen: Math.min(i, h)
                    });
                }
                let leftover = w % separation;
                for (let i = 0; i < h; i++) {
                    if ((i + leftover) % separation !== 0) continue;
                    obj.arr.push({
                        x: w,
                        y: i,
                        subLen: Math.min((h - i), w)
                    });
                }
                break;
            case "LR":
                obj = {
                    dx: 1,
                    dy: 0,
                    arr: []
                }
                for (let i = 0; i < h; i++) {
                    if (i % separation !== 0) continue;
                    obj.arr.push({
                        x: 0,
                        y: i,
                        subLen: w
                    });
                }
                break;
            case "ULDR":
                obj = {
                    dx: 1,
                    dy: 1,
                    arr: []
                }
                for (let i = 0; i < w; i++) {
                    if (i % separation !== 0) continue;
                    obj.arr.push({
                        x: i,
                        y: 0,
                        subLen: Math.min(h, w - i)
                    });
                }
                for (let i = 1; i < h; i++) {
                    if (i % separation !== 0) continue;
                    obj.arr.push({
                        x: 0,
                        y: i,
                        subLen: Math.min(w, h - i)
                    });
                }
                break;
            case "UD":
                obj = {
                    dx: 0,
                    dy: 1,
                    arr: []
                }
                for (let i = 0; i < w; i++) {
                    if (i % separation !== 0) continue;
                    obj.arr.push({
                        // x: i + 1,
                        x: i,
                        y: 0,
                        subLen: h
                    });
                }
                break;
            default:
                break;
        }
        res(obj);
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
    rsMonoSensitivity.onSliding(onMonochromSlide);
    if (rbMonochrom.checked) onMonochromSlide();

    // Gray-scaling settings.
    if (rbGrayscaling.checked) onGrayscalingSlide();

    //  Hatching settings.
    paramsHatchSeparation.max = parseInt(smallestDim / 20);
    paramsHatchSeparation.def = Math.max(parseInt(paramsHatchSeparation.max / 10), 0);
    rsHatchSeparation = new RangeSlider(contHatchSeparation, paramsHatchSeparation);
    rsHatchSeparation.onSliding(async () => {
        paramsHatch.gahl = await getArrayHatchedLines(strHatchDirection, rsHatchSeparation.val, rsHatchHowmanyw.val, rsHatchSensitivity.val);
        onHatchingSlide();
    });
    rsHatchLinewidth.onSliding(() => {
        paramsHatch.linew = rsHatchLinewidth.val;
        onHatchingSlide();
    });
    rsHatchHowmanyw.onSliding(async () => {
        paramsHatch.gahl = await getArrayHatchedLines(strHatchDirection, rsHatchSeparation.val, rsHatchHowmanyw.val, rsHatchSensitivity.val);
        onHatchingSlide();
    });
    rsHatchSensitivity.onSliding(async () => {
        paramsHatch.gahl = await getArrayHatchedLines(strHatchDirection, rsHatchSeparation.val, rsHatchHowmanyw.val, rsHatchSensitivity.val);
        onHatchingSlide();
    });
    paramsHatch.gahl = await getArrayHatchedLines(strHatchDirection, rsHatchSeparation.val, rsHatchHowmanyw.val, rsHatchSensitivity.val);
    if (rbHatching.checked) onHatchingSlide();
});
