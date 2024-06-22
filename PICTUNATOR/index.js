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
    marginedLeft = getMinMax(pureLeft, [0, parseInt(getComputedStyle(parent).width) - parseInt(getComputedStyle(displayImgIn).width)]);
    marginedTop = getMinMax(pureTop, [0, parseInt(getComputedStyle(parent).height) - parseInt(getComputedStyle(displayImgIn).height)]);
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
// var ctxIn = canvIn.getContext("2d", {willReadFrequently: true});
var canvOut = document.getElementById("canvOut");
var ctxOut = canvOut.getContext("2d", { willReadFrequently: true });
var imageIn;

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
lbIcGridColor.style.backgroundColor = paramsGrid.color;
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
const containerGridSquares = document.getElementById("containerGridSquares");
const labelForContainerGridSquares = document.querySelector("[label-for=containerGridSquares]");
var rsGridSquares = new RangeSlider(containerGridSquares, { title: "Grid", min: 2, max: 20, def: paramsGrid.amnt, step: 1, color1: "#576b9e", color2: "rgb(142, 167, 231)" });
labelForContainerGridSquares.innerText = rsGridSquares.val;
rsGridSquares.onslide = async function () {
    labelForContainerGridSquares.innerText = rsGridSquares.val;
    if (imageIn == undefined) return;
    paramsGrid.amnt = rsGridSquares.val;
    paramsGrid.atdg = await getArrayToDrawGrid(imageInData, paramsGrid);
    drawGrid(canvOut, paramsGrid);
};

//-- Slider for the width of the grid line.
const containerGridLinew = document.getElementById("containerGridLinew");
const labelForContainerGridLinew = document.querySelector("[label-for=containerGridLinew]");
var rsGridLinew = new RangeSlider(containerGridLinew, { title: "Line Width", min: 1, step: 1, max: 30, def: paramsGrid.linew, color1: "#576b9e", color2: "rgb(142, 167, 231)" });
labelForContainerGridLinew.innerText = rsGridLinew.val;
rsGridLinew.onslide = function () {
    labelForContainerGridLinew.innerText = rsGridLinew.val;
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
    color1: "#576b9e",
    color2: "rgb(142, 167, 231)"
};

const containerPxLevel = document.getElementById("containerPxLevel");
const labelForContainerPxLevel = document.querySelector("[label-for=containerPxLevel]");
var rsPxLevel = new RangeSlider(containerPxLevel, paramsPxLevel);
// paramsPxLevel will change according to image dimensions once image is loaded. Function onslide will be passed on image loading.
rsPxLevel.onslide = function () {
    // Since slider is re-created, onslide function has to be added, again.
    labelForContainerPxLevel.innerText = rsPxLevel.val;
    paramsPx.level = rsPxLevel.val;
    canv0 = getPixelatedCanvas(paramsPx);
    applyPixelation(canvOut, canv0, paramsPx);
}
labelForContainerPxLevel.innerText = rsPxLevel.val;

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
const labelForContainerGraysLevels = document.querySelector("[label-for=containerGraysLevels]");
const rsGraysLevels = new RangeSlider(containerGraysLevels, { title: "Levels of gray", min: 2, max: 20, step: 1, def: paramsGrays.levels, color1: "#576b9e", color2: "rgb(142, 167, 231)" });
//  More than 20 grayscale tones are barely distinguishable.
labelForContainerGraysLevels.innerText = rsGraysLevels.val;
rsGraysLevels.onslide = function () {
    labelForContainerGraysLevels.innerText = rsGraysLevels.val;
    paramsGrays.levels = rsGraysLevels.val;
    applyGrayscaling(paramsGrays);
}

//-- Slider for gray sensitivity.
const containerGraysSensitivity = document.getElementById("containerGraysSensitivity");
const labelForContainerGraysSensitivity = document.querySelector("[label-for=containerGraysSensitivity]");
const rsGraysSensitivity = new RangeSlider(containerGraysSensitivity, { title: "Sensitivity", min: -254, step: 1, max: 254, def: paramsGrays.levels, color1: "#576b9e", color2: "rgb(142, 167, 231)" });
labelForContainerGraysSensitivity.innerText = rsGraysSensitivity.val;
rsGraysSensitivity.onslide = function () {
    labelForContainerGraysSensitivity.innerText = rsGraysSensitivity.val;
    paramsGrays.sens = rsGraysSensitivity.val;
    applyGrayscaling(paramsGrays);
}


function getGrayscaledImgData(imagedata, levels = 2, sens = 2, black = true) {
    return new Promise(async (res, rej) => {
        let arrBuckets = await get255Buckets(levels, sens);
        let arrValues = new Array(levels);
        let bucketSize = (black) ? 255 / (levels - 1) : 255 / (levels + 1);
        for (let i = 0; i < arrValues.length; i++) {
            let factor = (black) ? i : i + 1;
            arrValues[i] = parseInt(getMinMax(factor * bucketSize, [0, 255]));
        }
        let newImgdata = structuredClone(imagedata);
        for (let i = 0; i < newImgdata.data.length; i += 4) {
            let r = newImgdata.data[i + 0];
            let g = newImgdata.data[i + 1];
            let b = newImgdata.data[i + 2];
            // let a = newImgdata.data[i + 3];
            let grayScale = getGrayscale(r, g, b);
            let buck = getBucketPosition(grayScale, arrBuckets);
            let newGs = arrValues[buck];
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
    let newData = await getGrayscaledImgData(imageInData, params.levels, params.sens, params.black);
    ctx.putImageData(newData, 0, 0);
}
// ------------


//  HATCHING
var paramsHatch = {
    bg: "#FFFFFF",
    color: "#000000",
    linew: 2,
    buckets: [[0, 85], [86, 170]],  //  This is what get255Buckets will return with default how_many lines value of 3 minus the last (brightest) bucket.
    direction: "DLUR",
    separation: 3,
    sensitivity: 0,
    atdh: undefined
}
// Radio button from the Effects group.
const rgEffHatching = document.getElementById("rgEffHatching");
rgEffHatching.addEventListener("input", async () => {
    if (imageIn == undefined) return;
    labelForContainerHatchSeparation.innerText = rsHatchSeparation.val;
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
lbIcHatchBg.style.backgroundColor = paramsHatch.bg;
icHatchBg.addEventListener("input", async () => {
    paramsHatch.bg = icHatchBg.value;
    lbIcHatchBg.style.backgroundColor = paramsHatch.bg;
    if (imageIn == undefined) return;
    applyHatching(paramsHatch);
});

const icHatchColor = document.getElementById("icHatchColor");
const lbIcHatchColor = document.querySelector("[for=icHatchColor]");
lbIcHatchColor.style.backgroundColor = paramsHatch.color
icHatchColor.addEventListener("input", async () => {
    paramsHatch.color = icHatchColor.value;
    lbIcHatchColor.style.backgroundColor = paramsHatch.color;
    if (imageIn == undefined) return;
    applyHatching(paramsHatch);
});

// Slider for how many different widths being hatched
const containerHatchHowmany = document.querySelector("#containerHatchHowmany");
const labelForContainerHatchHowmany = document.querySelector("[label-for=containerHatchHowmany]");
var rsHatchHowmanyw = new RangeSlider(containerHatchHowmany, { title: "Lines", min: 1, max: 10, def: paramsHatch.buckets.length, step: 1, color1: "#576b9e", color2: "rgb(142, 167, 231)" });
labelForContainerHatchHowmany.innerText = rsHatchHowmanyw.val;
rsHatchHowmanyw.onslide = async function () {
    labelForContainerHatchHowmany.innerText = rsHatchHowmanyw.val;
    if (imageIn == undefined) return;
    paramsHatch.buckets = await get255Buckets(rsHatchHowmanyw.val + 1, paramsHatch.sensitivity);
    paramsHatch.buckets.pop();  //  One more bucket is added for absolute white values, but then removed so it is not hatched.
    paramsHatch.atdh = await getArrToDrawHatch(paramsHatch);
    applyHatching(paramsHatch);
};

// Hatch separation slider.
const containerHatchSeparation = document.getElementById("containerHatchSeparation");
const labelForContainerHatchSeparation = document.querySelector("[label-for=containerHatchSeparation]");
var rsHatchSeparation = new RangeSlider(containerHatchSeparation, { title: "Separation", min: 2, max: 3, step: 1, def: paramsHatch.separation, color1: "#576b9e", color2: "rgb(142, 167, 231)" });  //  Will be reinitialized when image is loaded.
labelForContainerHatchSeparation.innerText = rsHatchSeparation.val;
rsHatchSeparation.onslide = async function () {
    labelForContainerHatchSeparation.innerText = rsHatchSeparation.val;
    if (imageIn == undefined) return;
    paramsHatch.separation = rsHatchSeparation.val;
    paramsHatch.atdh = await getArrToDrawHatch(paramsHatch);
    applyHatching(paramsHatch);
};

// Width factor slider.
const containerHatchLinew = document.getElementById("containerHatchLinew");
const labelForContainerHatchLinew = document.querySelector("[label-for=containerHatchLinew]");
var rsHatchLinewidth = new RangeSlider(containerHatchLinew, { title: "Width", min: 1, max: 15, def: paramsHatch.linew, step: 1, color1: "#576b9e", color2: "rgb(142, 167, 231)" });
labelForContainerHatchLinew.innerText = rsHatchLinewidth.val;
rsHatchLinewidth.onslide = function () {
    labelForContainerHatchLinew.innerText = rsHatchLinewidth.val;
    paramsHatch.linew = rsHatchLinewidth.val;
    applyHatching(paramsHatch);
};

// Sensitivity slider.
const containerHatchSensitivity = document.getElementById("containerHatchSensitivity");
const labelForContainerHatchSensitivity = document.querySelector("[label-for=containerHatchSensitivity]");
var rsHatchSensitivity = new RangeSlider(containerHatchSensitivity, { title: "Sensitivity", min: -250, max: 250, step: 1, def: paramsHatch.sensitivity, color1: "#576b9e", color2: "rgb(142, 167, 231)" });
labelForContainerHatchSensitivity.innerText = rsHatchSensitivity.val;
rsHatchSensitivity.onslide = async function () {
    labelForContainerHatchSensitivity.innerText = rsHatchSensitivity.val;
    if (imageIn == undefined) return;
    paramsHatch.sensitivity = rsHatchSensitivity.val;
    // let howmany = paramsHatch.buckets.length;
    paramsHatch.buckets = await get255Buckets(paramsHatch.buckets.length + 1, paramsHatch.sensitivity);
    paramsHatch.buckets.pop();  //  One more bucket is added for absolute white values but then removed so it is not hatched.
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

    drawAtdh(params.atdh, params.linew);
}

function drawAtdh(atdh, linew) {
    for (let i = 0; i < atdh.length; i++) {
        const arr = atdh[i];
        for (let j = 0; j < arr.length; j++) {
            const obj = arr[j];
            ctxOut.save();
            ctxOut.lineWidth = obj.linew * linew;
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
            let previousbucket = -1;
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
                const buck = getBucketPosition(gs, params.buckets);
                if (buck == -1) {  //  It means it didn't found a bucket, which means a line should not be hatched (brightest value).
                    previousbucket = -1;
                    continue;
                }
                if (buck == previousbucket) {  //  If the current value is the same as the previous one, it means the same line (hatch) continues.
                    arr[last][arr[last].length - 1].lx += otsh.dirx;
                    arr[last][arr[last].length - 1].ly += otsh.diry;
                    // objForSvg[params.direction][objForSvg[params.direction].length - 1].lx += otsh.dirx;
                    // objForSvg[params.direction][objForSvg[params.direction].length - 1].ly += otsh.diry;
                    continue;
                }
                // If code runs at this point, it means the width of the line (hatch) changes.
                arr[last].push({
                    x: x,
                    y: y,
                    lx: x,
                    ly: y,
                    linew: params.buckets.length - buck  //  Buckets are arranged from 0 to 255 (decreasing light value).
                });
                previousbucket = buck;
                // objForSvg[params.direction].push({ x: x, y: y, lx: x, ly: y, linew: j });
                continue;



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

// CROSS HATCHING

var paramsCrossh = {
    bg: "#FFFFFF",
    color: "#000000",
    linew: 2,
    arr_direction: ["DLUR", "LR", "ULDR", "UD"],
    buckets: [[0, 51], [52, 102], [103, 153], [154, 204], [205, 255]],
    separation: 3,
    sensitivity: 0,
    atch: undefined
}


const rgEffCrossh = document.getElementById("rgEffCrossh");
rgEffCrossh.addEventListener("input", async () => {
    if (imageIn == undefined) return;
    paramsCrossh.atch = await getArrToCrossh(paramsCrossh);
    applyCrossh(paramsCrossh);
});

const cbgCrosshatchDir = document.querySelectorAll("[name=cbgCrosshatchDir]");
cbgCrosshatchDir.forEach(cb => {
    cb.addEventListener("input", async () => {
        if (cb.checked && !paramsCrossh.arr_direction.includes(cb.value)) {
            paramsCrossh.arr_direction.push(cb.value);
        } else {
            let idx = paramsCrossh.arr_direction.indexOf(cb.value);
            if (idx !== -1) paramsCrossh.arr_direction.splice(idx, 1);
        }
        if (imageIn == undefined) return;
        paramsCrossh.atch = await getArrToCrossh(paramsCrossh);
        applyCrossh(paramsCrossh);
    });
});

const icCrosshBg = document.getElementById("icCrosshBg");
const lbIcCrosshBg = document.querySelector("[for=icCrosshBg]");
lbIcCrosshBg.style.backgroundColor = paramsCrossh.bg;
icCrosshBg.addEventListener("input", () => {
    paramsCrossh.bg = icCrosshBg.value;
    lbIcCrosshBg.style.backgroundColor = paramsCrossh.bg;
    applyCrossh(paramsCrossh);
});

const icCrosshColor = document.getElementById("icCrosshColor");
const lbIcCrosshColor = document.querySelector("[for=icCrosshColor]");
lbIcCrosshColor.style.backgroundColor = paramsCrossh.color;
icCrosshColor.addEventListener("input", () => {
    paramsCrossh.color = icCrosshColor.value;
    lbIcCrosshColor.style.backgroundColor = paramsCrossh.color;
    applyCrossh(paramsCrossh)
});

const containerCrosshSeparation = document.getElementById("containerCrosshSeparation");
const labelForContainerCrosshSeparation = document.querySelector("[label-for=containerCrosshSeparation]");
var rsCrosshSeparation = new RangeSlider(containerCrosshSeparation, { title: "Separation", min: 3, max: 4, def: 3, step: 1, color1: "#576b9e", color2: "rgb(142, 167, 231)" });
labelForContainerCrosshSeparation.innerText = rsCrosshSeparation.val;
rsCrosshSeparation.onslide = async function () {
    labelForContainerCrosshSeparation.innerText = rsCrosshSeparation.val;
    paramsCrossh.separation = rsCrosshSeparation.val;
    applyCrossh(paramsCrossh);
}

const containerCrosshWidth = document.getElementById("containerCrosshWidth");
const labelForContainerCrosshWidth = document.querySelector("[label-for=containerCrosshWidth]");
var rsCrosshWidth = new RangeSlider(containerCrosshWidth, { title: "Width", min: 1, max: 10, def: 2, step: 1, color1: "#576b9e", color2: "rgb(142, 167, 231)" });
labelForContainerCrosshWidth.innerText = rsCrosshWidth.val;
rsCrosshWidth.onslide = function () {
    labelForContainerCrosshWidth.innerText = rsCrosshWidth.val;
    paramsCrossh.linew = rsCrosshWidth.val;
    applyCrossh(paramsCrossh);
}

const containerCrosshSensitivity = document.getElementById("containerCrosshSensitivity");
const labelForContainerCrosshSensitivity = document.querySelector("[label-for=containerCrosshSensitivity]");
var rsCrosshSensitivity = new RangeSlider(containerCrosshSensitivity, { title: "Sensitivity", min: -254, max: 254, def: 0, step: 1, color1: "#576b9e", color2: "rgb(142, 167, 231)" });
labelForContainerCrosshSensitivity.innerText = rsCrosshSensitivity.val;
rsCrosshSensitivity.onslide = async function () {
    labelForContainerCrosshSensitivity.innerText = rsCrosshSensitivity.val;
    if (imageIn == undefined) return;
    paramsCrossh.sensitivity = rsCrosshSensitivity.val;
    paramsCrossh.buckets = await get255Buckets(5, paramsCrossh.sensitivity);
    paramsCrossh.atch = await getArrToCrossh(paramsCrossh);
    applyCrossh(paramsCrossh);
}

function getArrToCrossh(params) {
    return new Promise(async (res, rej) => {
        let arr = new Array(params.arr_direction.length);
        for (let i = 0; i < arr.length; i++) {
            let hatch_bucket = params.buckets[4 - i];
            let bucket = [0, hatch_bucket[0]];
            let buckets = [bucket];
            const direction = params.arr_direction[i];
            const separation = params.separation;
            const sensitivity = params.sensitivity;
            var atdh = await getArrToDrawHatch({ direction, separation, buckets, sensitivity });
            arr[i] = (atdh);
        }
        res(arr);
    });
}

function getCrosshBuckets(arrBuckets) {
    let arr = arrBuckets.map((buck) => {
        let x = getMinMax(buck[1], [0, 255]);
        let darkest = [0, x];
        let brightest = [x + 1, 255];
        return [darkest, brightest];
    });
    return arr;
}
async function applyCrossh(params) {
    if (imageIn == undefined || params.atch == undefined) return;
    canvOut.imageSmoothingEnabled = false;
    canvOut.width = imageIn.width;
    canvOut.height = imageIn.height;
    ctxOut.fillStyle = params.bg;
    ctxOut.fillRect(0, 0, canvOut.width, canvOut.height);
    ctxOut.strokeStyle = params.color;
    ctxOut.lineCap = "square";
    for (let i = 0; i < params.atch.length; i++) {
        const atdh = params.atch[i];
        drawAtdh(atdh, params.linew);
    }
}
//  ---------

// GLYPHATE
var paramsGlyph = {
    bg: "#ffffff",
    color: "#000000",
    text: "dmfte",
    rand: false,
    detail: 12,
    fontsize: 3.0
}

const icGlyphBg = document.getElementById("icGlyphBg");
const lbIcGlyphBg = document.querySelector("[for=icGlyphBg]");
lbIcGlyphBg.style.backgroundColor = paramsGlyph.bg;
icGlyphBg.addEventListener("input", () => {
    lbIcGlyphBg.style.backgroundColor = paramsGlyph.bg;
    paramsGlyph.bg = icGlyphBg.value;
    applyGlyph(paramsGlyph);
});

const icGlyphColor = document.getElementById("icGlyphColor");
const lbIcGlyphColor = document.querySelector("[for=icGlyphColor]");
lbIcGlyphColor.style.backgroundColor = paramsGlyph.color;
icGlyphColor.addEventListener("input", () => {
    lbIcGlyphColor.style.backgroundColor = paramsGlyph.color;
    paramsGlyph.color == icGlyphColor.value;
    applyGlyph(paramsGlyph);
});

const containerGlyphDetail = document.getElementById("containerGlyphDetail");
const labelForContainerGlyphDetail = document.querySelector("[label-for=containerGlyphDetail]");
var rsGlyphDetail = new RangeSlider(containerGlyphDetail, { title: "Detail", min: 8, max: 20, step: 1, def: paramsGlyph.detail, color1: "#576b9e", color2: "rgb(142, 167, 231)" });
labelForContainerGlyphDetail.innerText = rsGlyphDetail.val;

const containerGlyphFontsize = document.getElementById("containerGlyphFontsize");
const labelForContainerGlyphFontsize = document.querySelector("[label-for=containerGlyphFontsize]");
var rsGlyphFontsize = new RangeSlider(containerGlyphFontsize, { title: "Font Size", min: 1.0, max: 20.0, ste: 0.1, def: paramsGlyph.fontsize, color1: "#576b9e", color2: "rgb(142, 167, 231)" });
labelForContainerGlyphFontsize.innerText = rsGlyphFontsize.val;

async function applyGlyph(params) {
    if (imageIn == undefined) return;
    let canv0 = document.createElement("canvas");
    let c0 = canv0.getContext("2d", { willReadFrequently: true });
    canv0.width = parseInt(imageIn.width / params.detail);
    canv0.height = parseInt(imageIn.height / params.detail);
    c0.drawImage(imageIn, 0, 0, canv0.width, canv0.height);
    let canv0Data = c0.getImageData(0, 0, canv0.width, canv0.height);
    let atg = await getArrayToGlyph(canv0Data, params.detail);

    canvOut.width = canv0.width * params.detail;
    canvOut.height = canv0.height * params.detail;
    c0.fillStyle = params.bg;
    canvOut.fillRect(0, 0, canvOut.width, canvOut.height);
}

function getArrayToGlyph(imagedata, factor) {
    return new Promise((res, rej) => {
        let w = imagedata.width;
        let levels = factor - 4;
        const data = getGrayscaledImgData(imagedata);
        let arr = [];
        for (let i = 0; i < data.length; i += 4) {

        }
    });
}

//  ---------
// FUNCTIONS
function getImagedataIndex(x, y, width) {
    return (y * width + x) * 4;
}
function getGrayscale(r, g, b) {
    // return parseInt(r * 0.2426 + g * 0.7152 + b * 0.0822);
    return parseInt(0.299 * r + 0.587 * g + 0.114 * b);
}

function getBucketPosition(val, arrBuckets) {
    // return new Promise((res, rej)=>{
    let buckIndex = -1;
    for (let i = 0; i < arrBuckets.length; i++) {
        const bucket = arrBuckets[i];
        if (bucket[0] == bucket[1]) continue;
        if (val >= bucket[0] && val <= bucket[1]) {
            buckIndex = i;
            break;
        }
    }
    // res(buckIndex);
    return buckIndex;
    // });
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
    labelForContainerPxLevel.innerText = rsPxLevel.val;
    rsPxLevel.onslide = function () {
        // Since slider is re-created, onslide function has to be added, again.
        labelForContainerPxLevel.innerText = rsPxLevel.val;
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

    // For Hatching and Cross-hatching
    let newMax = parseInt(smallestDim / 10);
    let newDef = parseInt(newMax / 4);

    //  Hatching Effect.
    rsHatchSeparation = new RangeSlider(containerHatchSeparation, { title: "Separation", min: 2, max: newMax, step: 1, def: newDef, color1: "#576b9e", color2: "rgb(142, 167, 231)" });
    paramsHatch.separation = rsHatchSeparation.val;
    labelForContainerHatchSeparation.innerText = rsHatchSeparation.val;
    rsHatchSeparation.onslide = async function () {
        labelForContainerHatchSeparation.innerText = rsHatchSeparation.val;
        paramsHatch.separation = rsHatchSeparation.val;
        paramsHatch.atdh = await getArrToDrawHatch(paramsHatch);
        applyHatching(paramsHatch);
    };
    if (rgEffHatching.checked) {
        paramsHatch.atdh = await getArrToDrawHatch(paramsHatch);
        applyHatching(paramsHatch);
    }

    //  Cross-hatching Effect.
    rsCrosshSeparation = new RangeSlider(containerCrosshSeparation, { title: "Separation", min: 3, max: newMax, step: 1, def: newDef, color1: "#576b9e", color2: "rgb(142, 167, 231)" });
    labelForContainerCrosshSeparation.innerText = rsCrosshSeparation.val;
    rsCrosshSeparation.onslide = async function () {
        labelForContainerCrosshSeparation.innerText = rsCrosshSeparation.val;
        paramsCrossh.separation = rsCrosshSeparation.val;
        paramsCrossh.atch = await getArrToCrossh(paramsCrossh);
        applyCrossh(paramsCrossh);
    }
    paramsCrossh.separation = rsCrosshSeparation.val;
    if (rgEffCrossh.checked) {
        paramsCrossh.atch = await getArrToCrossh(paramsCrossh);
        applyCrossh(paramsCrossh);
    }
}

//  DOWNLOAD BUTTON
const dlDownload = document.getElementById("dlDownload");
dlDownload.addEventListener("click", () => {
    let link = document.createElement("a");
    link.download = getName("png");
    link.href = canvOut.toDataURL();
    link.click();
});


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


// Returns an array of buckets given how many buckets are needed from the 0 - 255 range; it also adds/substract sensitivity.
function get255Buckets(how_many_buckets = 0, sensitivity = 0) {
    return new Promise((res, rej) => {
        let arr = new Array(how_many_buckets);
        let bucketSize = parseInt(255 / arr.length);
        // for (let i = arr.length - 1; i >= 0; i--) {
        //     let lowerLim = getMinMax(i * bucket + sensitivity, [0, 255]);
        //     let upperLim = getMinMax((i + 1) * bucket - 1 + sensitivity, [0, 255]);
        //     arr[arr.length - 1 - i] = [lowerLim, upperLim];
        // }
        for (let i = 0; i < how_many_buckets; i++) {
            const factor = i * bucketSize;
            const lowerLim = (i == 0) ? 0 : getMinMax(factor + 1 + sensitivity, [0, 255]);
            const higherLim = (i == how_many_buckets - 1) ? 255 : getMinMax(factor + bucketSize + sensitivity, [0, 255]);
            arr[i] = [lowerLim, higherLim];
        }
        // for (let i = arr.length - 1; i >= 0; i--) {
        //     let lowerLim = getMinMax(i * bucket + sensitivity, [0, 255]);
        //     let upperLim = getMinMax((i + 1) * bucket - 1 + sensitivity, [0, 255]);
        //     arr[arr.length - 1 - i] = [lowerLim, upperLim];
        // }
        // arr[0][0] = 0;
        // arr[arr.length - 1][1] = 255;
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

function getName(strExt) {
    let now = new Date();
    let date = `${now.getFullYear()}-${now.getMonth()}-${(now.getDate() < 10) ? "0" + now.getDate() : now.getDate()}`;
    let time = `${now.getHours()}.${now.getMinutes()}.${(now.getMilliseconds()).toFixed(0)}`;
    return `Pictunator ${date} ${time}.${strExt}`;
}