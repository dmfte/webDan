// GLOBAL ACTION BAR.

// Checkbox to display images side to side or one on top of the other.
const pathHorzvertLeftsquare = document.getElementById("pathHorzvertLeftSquare");
const pathHorzvertRighttsquare = document.getElementById("pathHorzvertRightSquare");

const mpHLS = new MorphPath({
    path: pathHorzvertLeftsquare,
    arrayd: [
        "M 2 4 C 2 3 3 2 4 2 L 8 2 C 8 2 8 2 8 2 L 8 16 L 4 16 C 3 16 2 15 2 14 Z",
        "M 2 4 C 2 3 3 2 4 2 L 8 2 C 8 2 8 2 8 2 L 8 16 L 4 16 C 3 16 2 15 2 14 Z",
        "M 2 4 C 2 3 3 2 4 2 L 14 2 C 15 2 16 3 16 4 L 16 8 L 2 8 C 2 8 2 8 2 8 Z",
        "M 2 4 C 2 3 3 2 4 2 L 14 2 C 15 2 16 3 16 4 L 16 8 L 2 8 C 2 8 2 8 2 8 Z",
        "M 2 4 C 2 3 3 2 4 2 L 8 2 C 8 2 8 2 8 2 L 8 16 L 4 16 C 3 16 2 15 2 14 Z"],
    dur: 1000,
    keytimes: [0, 0.2, 0.5, 0.8, 1]
});
const mpHRS = new MorphPath({
    path: pathHorzvertRighttsquare,
    arrayd: [
        "M 10 2 L 14 2 C 15 2 16 3 16 4 L 16 14 C 16 15 15 16 14 16 L 10 16 C 10 16 10 16 10 16 Z",
        "M 10 2 L 14 2 C 15 2 16 3 16 4 L 16 14 C 16 15 15 16 14 16 L 10 16 C 10 16 10 16 10 16 Z",
        "M 2 10 L 16 10 C 16 10 16 10 16 10 L 16 14 C 16 15 15 16 14 16 L 4 16 C 3 16 2 15 2 14 Z",
        "M 2 10 L 16 10 C 16 10 16 10 16 10 L 16 14 C 16 15 15 16 14 16 L 4 16 C 3 16 2 15 2 14 Z",
        "M 10 2 L 14 2 C 15 2 16 3 16 4 L 16 14 C 16 15 15 16 14 16 L 10 16 C 10 16 10 16 10 16 Z"],
    dur: 1000,
    keytimes: [0, 0.2, 0.5, 0.8, 1]
});

const cbHorzVert = document.getElementById("cbHorzVert");
const lbHorzVert = document.querySelector("[for=cbHorzVert]");
lbHorzVert.addEventListener("pointerenter", () => {
    startPaths([mpHLS, mpHRS]);
});
lbHorzVert.addEventListener("pointerleave", () => {
    stopPaths([mpHLS, mpHRS]);
    if (cbHorzVert.checked) {
        // Horizontal.
        pathHorzvertLeftsquare.setAttribute("d", "M 2 4 C 2 3 3 2 4 2 L 14 2 C 15 2 16 3 16 4 L 16 8 L 2 8 C 2 8 2 8 2 8 Z");
        pathHorzvertRighttsquare.setAttribute("d", "M 2 10 L 16 10 C 16 10 16 10 16 10 L 16 14 C 16 15 15 16 14 16 L 4 16 C 3 16 2 15 2 14 Z");
    } else {
        // Vertical.
        pathHorzvertLeftsquare.setAttribute("d", "M 2 4 C 2 3 3 2 4 2 L 8 2 C 8 2 8 2 8 2 L 8 16 L 4 16 C 3 16 2 15 2 14 Z");
        pathHorzvertRighttsquare.setAttribute("d", "M 10 2 L 14 2 C 15 2 16 3 16 4 L 16 14 C 16 15 15 16 14 16 L 10 16 C 10 16 10 16 10 16 Z");
    }
});

// Checkbox to show the original image as floating or embeded.
const pathFloatoriginalLeftSquare = document.getElementById("pathFloatoriginalLeftSquare");
const pathFloatoriginalRightSquare = document.getElementById("pathFloatoriginalRightSquare");

const mpFLS = new MorphPath({
    path: pathFloatoriginalLeftSquare,
    arrayd: [
        "M 2 2 C 2 2 2 2 2 2 L 7 2 C 7 2 7 2 7 2 L 7 7 L 2 7 C 2 7 2 7 2 7 Z",
        "M 2 2 C 2 2 2 2 2 2 L 7 2 C 7 2 7 2 7 2 L 7 7 L 2 7 C 2 7 2 7 2 7 Z",
        "M 2 4 C 2 3 3 2 4 2 L 8 2 C 8 2 8 2 8 2 L 8 16 L 4 16 C 3 16 2 15 2 14 Z",
        "M 2 4 C 2 3 3 2 4 2 L 8 2 C 8 2 8 2 8 2 L 8 16 L 4 16 C 3 16 2 15 2 14 Z",
        "M 2 2 C 2 2 2 2 2 2 L 7 2 C 7 2 7 2 7 2 L 7 7 L 2 7 C 2 7 2 7 2 7 Z"],
    dur: 1000,
    keytimes: [0, 0.2, 0.5, 0.8, 1],
});
const mpFRR = new MorphPath({
    path: pathFloatoriginalRightSquare,
    arrayd: [
        "M 9 4 L 16 4 C 16 4 16 4 16 4 L 16 16 C 16 16 16 16 16 16 L 4 16 L 4 9 L 9 9 Z",
        "M 9 4 L 16 4 C 16 4 16 4 16 4 L 16 16 C 16 16 16 16 16 16 L 4 16 L 4 9 L 9 9 Z",
        "M 10 2 L 14 2 C 15 2 16 3 16 4 L 16 14 C 16 15 15 16 14 16 L 10 16 L 10 14 L 10 11 Z",
        "M 10 2 L 14 2 C 15 2 16 3 16 4 L 16 14 C 16 15 15 16 14 16 L 10 16 L 10 14 L 10 11 Z",
        "M 9 4 L 16 4 C 16 4 16 4 16 4 L 16 16 C 16 16 16 16 16 16 L 4 16 L 4 9 L 9 9 Z"],
    dur: 1000,
    keytimes: [0, 0.2, 0.5, 0.8, 1],
});

const displayImgIn = document.querySelector(".display.img-in");
const cbFloatOriginal = document.getElementById("cbFloatOriginal");
const lbFloatOriginal = document.querySelector("[for=cbFloatOriginal]");
lbFloatOriginal.addEventListener("pointerenter", () => {
    startPaths([mpFLS, mpFRR]);
});

lbFloatOriginal.addEventListener("pointerleave", () => {
    stopPaths([mpFLS, mpFRR]);
    if (cbFloatOriginal.checked) {
        // Floating.
        pathFloatoriginalLeftSquare.setAttribute("d", "M 2 2 C 2 2 2 2 2 2 L 7 2 C 7 2 7 2 7 2 L 7 7 L 2 7 C 2 7 2 7 2 7 Z");
        pathFloatoriginalRightSquare.setAttribute("d", "M 9 4 L 16 4 C 16 4 16 4 16 4 L 16 16 C 16 16 16 16 16 16 L 4 16 L 4 9 L 9 9 Z");

    } else {
        // Side to side.
        pathFloatoriginalLeftSquare.setAttribute("d", "M 2 4 C 2 3 3 2 4 2 L 8 2 C 8 2 8 2 8 2 L 8 16 L 4 16 C 3 16 2 15 2 14 Z");
        pathFloatoriginalRightSquare.setAttribute("d", "M 10 2 L 14 2 C 15 2 16 3 16 4 L 16 14 C 16 15 15 16 14 16 L 10 16 L 10 14 L 10 11 Z");

    }
});

var displayImgInOffsetLeft, displayImgInOffsetTop;
var marginedLeft = 15, marginedTop = 15;

cbFloatOriginal.addEventListener("input", () => {
    if (cbFloatOriginal.checked) {
        // Floating
        displayImgIn.style.transition = "500ms ease-in-out";
        displayImgIn.style.left = `${marginedLeft}px`;
        displayImgIn.style.top = `${marginedTop}px`;
    } else {
        // Side to side
        displayImgIn.style.transition = "500ms ease-in-out";
        displayImgIn.style.top = "0";
        displayImgIn.style.left = "0";
    }
});

displayImgIn.addEventListener("pointerdown", (downEvt) => {
    if (cbFloatOriginal.checked) {
        let bcr = displayImgIn.getBoundingClientRect();
        displayImgInOffsetLeft = downEvt.x - bcr.x;
        displayImgInOffsetTop = downEvt.y - bcr.y;
        displayImgIn.addEventListener("pointerup", () => {
            displayImgIn.removeEventListener("pointermove", onMovedisplayImgIn);
        });
        displayImgIn.addEventListener("pointermove", onMovedisplayImgIn);
    }
});

function onMovedisplayImgIn(moveEvt) {
    displayImgIn.style.transition = "none";
    let parent = displayImgIn.parentElement;
    let parentBcr = parent.getBoundingClientRect();
    let pureLeft = moveEvt.x - parentBcr.x - displayImgInOffsetLeft;
    let pureTop = moveEvt.y - parentBcr.y - displayImgInOffsetTop;
    marginedLeft = getMinMax(pureLeft, 0, [parseInt(getComputedStyle(parent).width) - parseInt(getComputedStyle(displayImgIn).width)]);
    marginedTop = getMinMax(pureTop, 0, [parseInt(getComputedStyle(parent).height) - parseInt(getComputedStyle(displayImgIn).height)]);
    displayImgIn.style.left = `${marginedLeft}px`;
    displayImgIn.style.top = `${marginedTop}px`;
}
// Checkbox: image to process lowered to 500px or use original size.
const pathOriginaldimensionsNob = document.getElementById("pathOriginaldimensionsNobLeft");

const mpONL = new MorphPath({
    path: pathOriginaldimensionsNobLeft,
    arrayd: [
        "M 17 17 A 1 1 -65 0 0 19 11 L 7 9 Z",
        "M 15 14 A 1 1 0 0 0 21 14 L 18 2 Z",
        "M 17 11 A 1 1 65 0 0 19 17 L 29 9 Z"],
    dur: 300,
    keytimes: [0, 0.5, 1],
    repeatcount: 1
});
const mpONR = new MorphPath({
    path: pathOriginaldimensionsNobLeft,
    arrayd: [
        "M 17 11 A 1 1 65 0 0 19 17 L 29 9 Z",
        "M 15 14 A 1 1 0 0 0 21 14 L 18 2 Z",
        "M 17 17 A 1 1 -65 0 0 19 11 L 7 9 Z"],
    dur: 300,
    keytimes: [0, 0.5, 1],
    repeatcount: 1
});
const cbOriginalDimensions = document.getElementById("cbOriginalDimensions");
const lbOriginalDimensions = document.querySelector("[for=cbOriginalDimensions]");

cbOriginalDimensions.addEventListener("change", () => {
    if (cbOriginalDimensions.checked) {
        mpONL.start();
    } else {
        mpONR.start();
    }
});
// ------------
// VARIABLES
var canvIn = document.getElementById("canvIn");
var ctxIn;
var canvOut = document.getElementById("canvOut");
var ctxOut;
var imageIn, imageOut;

// ---------

// GRID EFFECT
var paramsGrid = {
    amnt: 3,
    color: "#ff0000",
    linew: 5,
    atdg: undefined,
    vert: true
}

//-- Radio Button from the Effects group.
const rgEffGrid = document.getElementById("rgEffGrid");
rgEffGrid.addEventListener("input", async () => {
    if (imageIn == undefined) return;
    paramsGrid.atdg = await getArrayToDrawGrid(imageIn, paramsGrid);
    drawGrid(canvOut, paramsGrid);
});

//-- Color picker behavior.
const icGridColor = document.getElementById("icGridColor");
const lbIcGridColor = document.querySelector("[for=icGridColor]");

icGridColor.addEventListener("input", () => {
    lbIcGridColor.style.backgroundColor = icGridColor.value;
    paramsGrid.color = icGridColor.value;
    drawGrid(canvOut, paramsGrid);
});

//-- Button to draw exact amount of squares along width or height.
const cbGridHorzvert = document.getElementById("cbGridHorzvert");
const lbGridlbHorzVert = document.querySelector("[for=cbGridHorzvert]");
const pathGridHorzvert = document.getElementById("pathGridHorzvert");
//-- -- SVG animation
var mpGHh = new MorphPath({
    path: pathGridHorzvert,
    arrayd: [
        "M 2 3 H 14 V 13 H 2 Z M 8 3 V 13 M 14 3 V 13 M 2 9 H 14 M 2 13 H 14",
        "M 2 3 H 14 V 13 H 2 Z M 7 3 V 13 M 12 3 V 13 M 2 8 H 14 M 2 13 H 14"],
    dur: 300,
    keytimes: [0, 1],
    repeatcount: 1
});

var mpGHv = new MorphPath({
    path: pathGridHorzvert,
    arrayd: [
        "M 2 3 H 14 V 13 H 2 Z M 7 3 V 13 M 12 3 V 13 M 2 8 H 14 M 2 13 H 14",
        "M 2 3 H 14 V 13 H 2 Z M 8 3 V 13 M 14 3 V 13 M 2 9 H 14 M 2 13 H 14"],
    dur: 300,
    keytimes: [0, 1],
    repeatcount: 1
});
cbGridHorzvert.addEventListener("input", async () => {
    if (cbGridHorzvert.checked) {
        //  Horizontal squares distribution
        mpGHh.start();
    } else {
        //  Vertical squares distribution.
        mpGHv.start();
    }
    if (imageIn == undefined) return;
    paramsGrid.vert = cbGridHorzvert.checked;
    paramsGrid.atdg = await getArrayToDrawGrid(imageInData, paramsGrid);
    drawGrid(canvOut, paramsGrid);
});


//-- Slider for amoaunt of squares.
const containerRsGridSquares = document.getElementById("containerRsGridSquares");
var rsGridSquares = new RangeSlider(containerRsGridSquares, { title: "Grid", min: 2, max: 20, def: paramsGrid.amnt, step: 1, color1: "#576b9e", color2: "rgb(142, 167, 231)" });
rsGridSquares.onslide = async function () {
    if (imageIn == undefined) return;
    paramsGrid.amnt = rsGridSquares.val;
    paramsGrid.atdg = await getArrayToDrawGrid(imageInData, paramsGrid);
    drawGrid(canvOut, paramsGrid);
};

//-- Slider for the width of the grid line.
const containerRsGridLinew = document.getElementById("containerRsGridLinew");
var rsGridLinew = new RangeSlider(containerRsGridLinew, { title: "Line Width", min: 1, step: 1, max: 30, def: paramsGrid.linew, color1: "#576b9e", color2: "rgb(142, 167, 231)" });
rsGridLinew.onslide = function () {
    paramsGrid.linew = rsGridLinew.val;
    drawGrid(canvOut, paramsGrid);
}

//-- Functions
function getArrayToDrawGrid(data, params) {
    return new Promise((res, rej) => {
        let w = data.width;
        let h = data.height;
        let arr = [];
        let square = 0;
        let forX = 0;
        let forY = 0;
        if (params.vert) {
            square = h / params.amnt;
            forX = Math.ceil(w / square);
            forY = params.amnt;
        } else {
            square = w / params.amnt;
            forX = params.amnt;
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

function drawGrid(canvas, params) {
    if (imageIn == undefined) return;
    if (canvas.width !== imageIn.width || canvas.height !== imageIn.height) {
        canvas.width = imageIn.width;
        canvas.height = imageIn.height;
    }
    ctx = canvas.getContext("2d", { willReadFrequently: true });
    ctx.drawImage(imageIn, 0, 0);
    ctx.strokeStyle = params.color;
    ctx.lineWidth = params.linew;
    params.atdg.forEach(obj => {
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
var paramsPx = {
    smooth: false,
    level: 10
}
var canv0;

//-- Radio Button from the Effects group.
const rgEffPixelate = document.getElementById("rgEffPixelate");
rgEffPixelate.addEventListener("input", () => {
    canv0 = getPixelatedCanvas(paramsPx);
    applyPixelation(canvOut, canv0, paramsPx);
});

//-- Blur/Sharp checkbox
const cbPxSmooth = document.getElementById("cbPxSmooth");
cbPxSmooth.addEventListener("input", () => {
    if (cbPxSmooth.checked) {
        document.querySelector("[for=cbPxSmooth] svg g").setAttribute("filter", "url(#svgFilterBlur)");
    } else {
        document.querySelector("[for=cbPxSmooth] svg g").setAttribute("filter", "none");
    }
    paramsPx.smooth = cbPxSmooth.checked;
    applyPixelation(canvOut, canv0, paramsPx);
});

//-- Range slider controlling level of pixelation
var paramsPxLevel = {
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

const containerPxLevel = document.getElementById("containerPxLevel");
var rsPxLevel = new RangeSlider(containerPxLevel, paramsPxLevel);
// paramsPxLevel will change according to image dimensions once image is loaded. Function onslide will be passed on image loading.

function getPixelatedCanvas(params) {
    if (imageIn == undefined) return undefined;
    let canv0 = document.createElement("canvas");
    canv0.width = Math.floor(imageIn.width / params.level);
    canv0.height = Math.floor(imageIn.height / params.level);
    let c0 = canv0.getContext("2d", { willReadFrequently: true });
    c0.imageSmoothingEnabled = params.smooth;
    c0.drawImage(imageIn, 0, 0, canv0.width, canv0.height);
    return canv0;
}

function applyPixelation(canvasTarget, canvasPixelated, params) {
    if (imageIn == undefined) return;
    canvasTarget.width = canvasPixelated.width * params.level;
    canvasTarget.height = canvasPixelated.height * params.level;
    let ctx = canvasTarget.getContext("2d", { willReadFrequently: true });
    ctx.imageSmoothingEnabled = params.smooth;
    ctx.drawImage(canvasPixelated, 0, 0, canvOut.width, canvOut.height);
}

//  GRAYSCALE
var paramsGrays = {
    black: true,
    levels: 4,
    sens: 0
}
//-- Radio Button from the Effects group.
const rgEffGrays = document.getElementById("rgEffGrays");
rgEffGrays.addEventListener("input", () => {
    applyGrayscaling(paramsGrays);
});

//-- Checkbox to ex/include black, or just gray tones.
const cbGraysBlack = document.getElementById("cbGraysBlack");
cbGraysBlack.addEventListener("input", async () => {
    paramsGrays.black = cbGraysBlack.checked;
    applyGrayscaling(paramsGrays);
});


//-- Slider for gray levels.
const containerGraysLevels = document.getElementById("containerGraysLevels");
const rsGraysLevels = new RangeSlider(containerGraysLevels, { title: "Levels of gray", min: 2, max: 20, step: 1, def: paramsGrays.levels, color1: "#2c5270", color2: "#DDE6ED" });
//  More than 20 grayscale tones are barely distinguishable.
rsGraysLevels.onslide = function () {
    paramsGrays.levels = rsGraysLevels.val;
    applyGrayscaling(paramsGrays);
}

//-- Slider for gray sensitivity.
const containerGraysSensitivity = document.getElementById("containerGraysSensitivity");
const rsGraysSensitivity = new RangeSlider(containerGraysSensitivity, { title: "Sensitivity", min: -254, step: 1, max: 254, def: paramsGrays.levels, color1: "#2c5270", color2: "#DDE6ED" });
rsGraysSensitivity.onslide = function () {
    paramsGrays.sens = rsGraysSensitivity.val;
    applyGrayscaling(paramsGrays);
}


function getGrayscalledImgData(params) {
    return new Promise(async (res, rej) => {
        let arrBucket = await get255Buckets(params.levels, params.sens);
        let arrValues = new Array(params.levels);
        let bucket = (params.black) ? 255 / (params.levels - 1) : 255 / (params.levels + 1);
        if (params.black) {
            for (let i = 0; i < arrValues.length; i++) {
                // arrValues[arrValues.length - 1 - i] = parseInt(Math.max(Math.min(i * bucket, 255), 0));
                arrValues[arrValues.length - 1 - i] = parseInt(getMinMax(i * bucket, [0, 255]));
            }
        } else {
            for (let i = 1; i <= arrValues.length; i++) {
                // arrValues[arrValues.length - i] = parseInt(Math.max(Math.min(i * bucket, 255), 0));
                arrValues[arrValues.length - i] = parseInt(getMinMax(i * bucket, [0, 255]));
            }
        }
        let newImgdata = structuredClone(imageInData);
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

async function applyGrayscaling(params) {
    if (imageIn == undefined) return;
    if (canvOut.width !== imageIn.width || canvOut.height !== imageIn.height) {
        canvOut.width = imageIn.width;
        canvOut.height = imageIn.height;
    }
    ctx = canvOut.getContext("2d", { willReadFrequently: true });
    ctx.imageSmoothingEnabled = false;
    let newData = await getGrayscalledImgData(params);
    ctx.putImageData(newData, 0, 0);
}
// ------------


//  HATCHING
var paramsHatch = {
    bg: "#FFFFFF",
    color: "#000000",
    linew: 2,
    buckets: [[192, 255], [128, 191], [64, 127], [0, 63]],  //  This is what get255Buckets will return with default how_many lines value of 3 + 1.
    direction: "DLUR",
    separation: 3,
    sensitivity: 0,
    atdh: undefined
}
// Radio button from the Effects group.
const rgEffHatching = document.getElementById("rgEffHatching");
rgEffHatching.addEventListener("input", async () => {
    if (imageIn == undefined) return;
    paramsHatch.separation = rsHatchSeparation.val;
    paramsHatch.atdh = await getArrToDrawHatch(paramsHatch);
    applyHatching(paramsHatch);
});

const hatchRbgDirections = document.querySelectorAll("[name=rgHatchDir]");
hatchRbgDirections.forEach(rb => {
    rb.addEventListener("input", async () => {
        paramsHatch.direction = rb.value;
        if (imageIn == undefined) return;
        paramsHatch.atdh = await getArrToDrawHatch(paramsHatch);
        applyHatching(paramsHatch);
    });
});

const icHatchBg = document.getElementById("icHatchBg");
const lbIcHatchBg = document.querySelector("[for=icHatchBg]");
lbIcHatchBg.style.backgroundColor = icHatchBg.value;
icHatchBg.addEventListener("input", async ()=>{
    paramsHatch.bg = icHatchBg.value;
    lbIcHatchBg.style.backgroundColor = paramsHatch.bg;
    if (imageIn == undefined) return;
    applyHatching(paramsHatch);
});

const icHatchColor = document.getElementById("icHatchColor");
const lbIcHatchColor = document.querySelector("[for=icHatchColor]");
lbIcHatchColor.style.backgroundColor = icHatchColor.value;
icHatchColor.addEventListener("input", async ()=>{
    paramsHatch.color = icHatchColor.value;
    lbIcHatchColor.style.backgroundColor = paramsHatch.color;
    if (imageIn == undefined) return;
    applyHatching(paramsHatch);
});

// Slider for how many different widths being hatched
const containerHatchHowmany = document.querySelector("#containerHatchHowmany");
var rsHatchHowmanyw = new RangeSlider(containerHatchHowmany, { title: "Lines", min: 1, max: 10, def: paramsHatch.buckets.length - 1, step: 1, color1: "#2c5270", color2: "#DDE6ED" });
rsHatchHowmanyw.onslide = async function () {
    if (imageIn == undefined) return;
    paramsHatch.buckets = await get255Buckets(rsHatchHowmanyw.val + 1, paramsHatch.sensitivity);
    paramsHatch.atdh = await getArrToDrawHatch(paramsHatch);
    applyHatching(paramsHatch);
};

// Hatch separation slider.
const containerHatchSeparation = document.querySelector("#containerHatchSeparation");
var rsHatchSeparation = new RangeSlider(containerHatchSeparation, { title: "Separation", min: 2, max: 3, step: 1, def: paramsHatch.separation, color1: "#2c5270", color2: "#DDE6ED" });  //  Will be reinitialized when image is loaded.
rsHatchSeparation.onslide = async function () {
    if (imageIn == undefined) return;
    paramsHatch.separation = rsHatchSeparation.val;
    paramsHatch.atdh = await getArrToDrawHatch(paramsHatch);
    applyHatching(paramsHatch);
};

// Width factor slider.
const containerHatchLinew = document.querySelector("#containerHatchLinew");
var rsHatchLinewidth = new RangeSlider(containerHatchLinew, { title: "Width", min: 1, max: 15, def: paramsHatch.linew, step: 1, color1: "#2c5270", color2: "#DDE6ED" });
rsHatchLinewidth.onslide = function () {
    paramsHatch.linew = rsHatchLinewidth.val;
    applyHatching(paramsHatch);
};

// Sensitivity slider.
const containerHatchSensitivity = document.querySelector("#containerHatchSensitivity");
var rsHatchSensitivity = new RangeSlider(containerHatchSensitivity, { title: "Sensitivity", min: -250, max: 250, step: 5, def: paramsHatch.sensitivity, color1: "#2c5270", color2: "#DDE6ED" });
rsHatchSensitivity.onslide = async function () {
    if (imageIn == undefined) return;
    paramsHatch.sensitivity = rsHatchSensitivity.val;
    let howmany = paramsHatch.buckets.length;
    paramsHatch.buckets = await get255Buckets(howmany, paramsHatch.sensitivity);
    paramsHatch.atdh = await getArrToDrawHatch(paramsHatch);
    applyHatching(paramsHatch);
};


async function applyHatching(params) {
    if (imageIn == undefined || paramsHatch.atdh == undefined) return;
    canvOut.imageSmoothingEnabled = false;
    canvOut.width = imageIn.width;
    canvOut.height = imageIn.height;
    ctxOut = canvOut.getContext("2d", { willReadFrequently: true });
    ctxOut.fillStyle = params.bg;
    ctxOut.fillRect(0, 0, canvOut.width, canvOut.height);
    ctxOut.strokeStyle = paramsHatch.color;
    ctxOut.lineCap = "square";

    for (let i = 0; i < params.atdh.length; i++) {
        const arr = params.atdh[i];
        for (let j = 0; j < arr.length; j++) {
            const obj = arr[j];
            ctxOut.save();
            ctxOut.lineWidth = obj.linew * params.linew;
            ctxOut.beginPath();
            ctxOut.moveTo(obj.x, obj.y);
            ctxOut.lineTo(obj.lx, obj.ly);
            ctxOut.stroke();
            ctxOut.restore();
        }
    }
}

async function getObjToStartHatching(dir = "", separation = 0) {
    return new Promise((res, rej) => {
        let obj = {
            arrXyLim: [],
            dirx: 0,
            diry: 0
        }
        let width = imageInData.width;
        let height = imageInData.height;
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

async function getArrToDrawHatch(params) {
    return new Promise(async (res, rej) => {
        let width = imageInData.width;
        let data = imageInData.data;
        let otsh = await getObjToStartHatching(params.direction, params.separation);
        let arr = [];
        // if (!objForSvg[params.direction]) objForSvg[params.direction] = [];
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
                for (let j = 0; j < params.buckets.length; j++) {
                    const buck = params.buckets[j];
                    if (gs >= buck[0] && gs <= buck[1]) {
                        if (j == 0) {  //  It means it found the brightest pixel so it won't hatch it.
                            linewidth = 0;
                            break;
                        }
                        // This generates an array with each x, y coord, its length and width.
                        if (j !== linewidth) {  //  The j counter for params.buckets[] is equal to the linewidth, that's why it it skips it if it is zero.
                            arr[last].push({
                                x: x,
                                y: y,
                                lx: x,
                                ly: y,
                                linew: j
                            });
                            linewidth = j;
                            // objForSvg[params.direction].push({ x: x, y: y, lx: x, ly: y, linew: j });
                        } else {  //  It means j == the previous linewidth.
                            arr[last][arr[last].length - 1].lx += otsh.dirx;
                            arr[last][arr[last].length - 1].ly += otsh.diry;
                            // objForSvg[params.direction][objForSvg[params.direction].length - 1].lx += otsh.dirx;
                            // objForSvg[params.direction][objForSvg[params.direction].length - 1].ly += otsh.diry;
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

function returnsDrawnImagedataWithATDH(ctx, params) {
    return new Promise((res, rej) => {
        let arrRGB = getarrRGB(params.color);
        for (let i = 0; i < params.atdh.length; i++) {
            const subArr = params.atdh[i];
            for (let j = 0; j < subArr.length; j++) {
                const obj = subArr[j];
                let linew = obj.linew * params.linew;
                getPurePxDrawnData(obj.x, obj.y, obj.lx, obj.ly, imagedatafinal, linew, arrRGB);
            }
        }
        res(imagedatafinal);
    });
}

function getImagedataIndex(x, y, width) {
    return (y * width + x) * 4;
}
function getGrayscale(r, g, b) {
    // return parseInt(r * 0.2426 + g * 0.7152 + b * 0.0822);
    return parseInt(0.299 * r + 0.587 * g + 0.114 * b);
}

// ------------
// Input File.
const spanFileName = document.getElementById("spanFileName");
const ifLoadImg = document.getElementById("ifLoadImg");
ifLoadImg.addEventListener("input", onceImageLoads);

var imageInData, smallestDim;

async function onceImageLoads(inputFileEvent) {
    imageIn = await getLoadedImage(inputFileEvent);
    smallestDim = Math.min(imageIn.width, imageIn.height);
    // if (cbOriginalDimensions.checked) {
    //     canvIn.width = imageIn.width;
    //     canvIn.height = imageIn.height;
    // }
    // if (!cbOriginalDimensions.checked) {
    //     let ratio = imageIn.height / imageIn.width;
    //     if (imageIn.width >= imageIn.height) {
    //         canvIn.width = 500;
    //         canvIn.height = 500 * ratio;
    //     } else {
    //         canvIn.height = 500;
    //         canvIn.width = 500 / ratio;
    //     }
    // }
    canvIn.width = imageIn.width;
    canvIn.height = imageIn.height;
    ctxIn = canvIn.getContext("2d", { willReadFrequently: true });
    ctxIn.drawImage(imageIn, 0, 0, canvIn.width, canvIn.height);
    imageInData = ctxIn.getImageData(0, 0, canvIn.width, canvIn.height);
    spanFileName.innerText = inputFileEvent.target.files[0].name;

    // Grid Effect
    if (rgEffGrid.checked) {
        // canvOut.width = imageIn.width;
        // canvOut.height = imageIn.height;
        // ctxOut = canvOut.getContext("2d", { willReadFrequently: true });
        paramsGrid.atdg = await getArrayToDrawGrid(imageInData, paramsGrid);
        drawGrid(canvOut, paramsGrid);
    }

    // Pixelate Effect
    //-- Re-create slider according to image dimensions.
    paramsPxLevel.max = Math.floor(smallestDim / 10);
    paramsPxLevel.def = Math.floor(paramsPxLevel.max / 4);
    rsPxLevel = new RangeSlider(containerPxLevel, paramsPxLevel);
    rsPxLevel.onslide = function () {
        // Since slider is re-created, onslide function has to be added, again.
        paramsPx.level = rsPxLevel.val;
        canv0 = getPixelatedCanvas(paramsPx);
        applyPixelation(canvOut, canv0, paramsPx);
    }
    if (rgEffPixelate.checked) {
        rsPxLevel.onslide();
    }

    // Grayscaling Effect
    if (rgEffGrays.checked) {
        applyGrayscaling(paramsGrays);
    }

    //  Hatching Effect.
    let newMax = parseInt(smallestDim / 10);
    let newDef = parseInt(newMax / 3);
    rsHatchSeparation = new RangeSlider(containerHatchSeparation, { title: "Separation", min: 2, max: newMax, step: 1, def: newDef, color1: "#2c5270", color2: "#DDE6ED" });
    paramsHatch.separation = rsHatchSeparation.val;
    rsHatchSeparation.onslide = async function () {
        paramsHatch.separation = rsHatchSeparation.val;
        paramsHatch.atdh = await getArrToDrawHatch(paramsHatch);
        applyHatching(paramsHatch);
    };
    if (rgEffHatching.checked) {
        paramsHatch.atdh = await getArrToDrawHatch(paramsHatch);
        applyHatching(paramsHatch);
    }
}

// FUNCTIONS

// For SVG animation inside Global Actions Bar buttons.
function startPaths(morphPaths = []) {
    morphPaths.forEach(mp => {
        mp.start();
    });
}
function stopPaths(morphPaths = []) {
    morphPaths.forEach(mp => {
        mp.stop();
    });
}

// For the input file control
function getLoadedImage(evt) {
    return new Promise((res, rej) => {
        let img = new Image();
        img.onload = () => res(img);
        let URL = window.URL.createObjectURL(evt.target.files[0]);
        img.src = URL;
    });
}

//  Returns the passed value, but if it is lower than the minimum, returns the minimum; if it is higher than the maximum, returns the maximum.
function getMinMax(val = 0, [min = 0, max = 0]) {
    return Math.min(max, Math.max(min, val));
}


// Returns an array of buckets given how many buckets are needed from the 0 - 255 range; it also adds/substract senstivity.
function get255Buckets(how_many_buckets = 0, sensitivity = 0) {
    return new Promise((res, rej) => {
        let arr = new Array(how_many_buckets);
        let bucket = Math.ceil(255 / arr.length);
        for (let i = arr.length - 1; i >= 0; i--) {
            let lowerLim = getMinMax(i * bucket + sensitivity, [0, 255]);
            let upperLim = getMinMax((i + 1) * bucket - 1 + sensitivity, [0, 255]);
            arr[arr.length - 1 - i] = [lowerLim, upperLim];
        }
        arr[0][1] = 255;
        arr[arr.length - 1][0] = 0;
        res(arr);
    });
}

function getarrRGB(color) {
    let element = document.createElement("div");
    element.style.backgroundColor = color;
    element.style.display = "none";
    document.body.appendChild(element);
    let rgbStr = window.getComputedStyle(element).backgroundColor;
    // rgb(255, 255, 255)
    document.body.removeChild(element);
    let regexp = /rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*[\d.]+)?\)/;
    let rgb = rgbStr.match(regexp);
    return rgb.slice(1);
}