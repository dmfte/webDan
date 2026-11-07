import { RangeSlider } from "../assets/js/RangeSlider.js";

// VARIABLES
var canvIn = document.getElementById("canvIn");
// var ctxIn = canvIn.getContext("2d", {willReadFrequently: true});
var canvOut = document.getElementById("canvOut");
var ctxOut = canvOut.getContext("2d", {
    willReadFrequently: true
});
var imageIn;

var SMALLEST_DIM, RATIO;
// ---------

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
        "M 2 4 C 2 3 3 2 4 2 L 8 2 C 8 2 8 2 8 2 L 8 16 L 4 16 C 3 16 2 15 2 14 Z"
    ],
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
        "M 10 2 L 14 2 C 15 2 16 3 16 4 L 16 14 C 16 15 15 16 14 16 L 10 16 C 10 16 10 16 10 16 Z"
    ],
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
        "M 2 2 C 2 2 2 2 2 2 L 7 2 C 7 2 7 2 7 2 L 7 7 L 2 7 C 2 7 2 7 2 7 Z"
    ],
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
        "M 9 4 L 16 4 C 16 4 16 4 16 4 L 16 16 C 16 16 16 16 16 16 L 4 16 L 4 9 L 9 9 Z"
    ],
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

// Checkbox to erase in original image.
var pointerEraser = false;

const cbEraser = document.getElementById("cbEraser");
cbEraser.addEventListener("input", () => {
    if (imageIn == undefined) return;
    if (cbEraser.checked) {
        pointerEraser = true;
    } else {
        pointerEraser = false;
    }
});

canvIn.addEventListener("click", (evt) => {
    if (!pointerEraser) return;

});


// ------------
var displayImgInOffsetLeft, displayImgInOffsetTop;
var marginedLeft = 15,
    marginedTop = 15;

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
        "M 17 11 A 1 1 65 0 0 19 17 L 29 9 Z"
    ],
    dur: 300,
    keytimes: [0, 0.5, 1],
    repeatcount: 1
});
const mpONR = new MorphPath({
    path: pathOriginaldimensionsNobLeft,
    arrayd: [
        "M 17 11 A 1 1 65 0 0 19 17 L 29 9 Z",
        "M 15 14 A 1 1 0 0 0 21 14 L 18 2 Z",
        "M 17 17 A 1 1 -65 0 0 19 11 L 7 9 Z"
    ],
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
        "M 2 3 H 14 V 13 H 2 Z M 7 3 V 13 M 12 3 V 13 M 2 8 H 14 M 2 13 H 14"
    ],
    dur: 300,
    keytimes: [0, 1],
    repeatcount: 1
});

var mpGHv = new MorphPath({
    path: pathGridHorzvert,
    arrayd: [
        "M 2 3 H 14 V 13 H 2 Z M 7 3 V 13 M 12 3 V 13 M 2 8 H 14 M 2 13 H 14",
        "M 2 3 H 14 V 13 H 2 Z M 8 3 V 13 M 14 3 V 13 M 2 9 H 14 M 2 13 H 14"
    ],
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
var rsGridSquares = new RangeSlider(containerGridSquares, {
    title: "Grid",
    min: 2,
    max: 20,
    def: paramsGrid.amnt,
    step: 1,
    color: "#576b9e",
    color2: "rgb(142, 167, 231)"
});
labelForContainerGridSquares.innerText = rsGridSquares.val;
rsGridSquares.onValueChange(async function () {
    labelForContainerGridSquares.innerText = rsGridSquares.val;
    if (imageIn == undefined) return;
    paramsGrid.amnt = rsGridSquares.val;
    paramsGrid.atdg = await getArrayToDrawGrid(imageInData, paramsGrid);
    drawGrid(canvOut, paramsGrid);
});

//-- Slider for the width of the grid line.
const containerGridLinew = document.getElementById("containerGridLinew");
const labelForContainerGridLinew = document.querySelector("[label-for=containerGridLinew]");
var rsGridLinew = new RangeSlider(containerGridLinew, {
    title: "Line Width",
    min: 1,
    step: 1,
    max: 30,
    def: paramsGrid.linew,
    color: "#576b9e",
    color2: "rgb(142, 167, 231)"
});
labelForContainerGridLinew.innerText = rsGridLinew.val;
rsGridLinew.onValueChange(function () {
    labelForContainerGridLinew.innerText = rsGridLinew.val;
    paramsGrid.linew = rsGridLinew.val;
    drawGrid(canvOut, paramsGrid);
});

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
    let ctx = canvas.getContext("2d", {
        willReadFrequently: true
    });
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
    dimension: 64,
    horizontal: false,
    grid: true,
    trueColors: false,
    numColors: 16, //  Which fixed palette to use (a key of PX_PALETTES).
    selContiguous: true, //  Canvas clicks select only the connected region (off: every match in the image).
    selTolerance: 0 //  How far (weightedDistance() units, ~0-255) a color may be from the clicked one.
}
//  Sizes the Maximum palette slider steps through (the slider moves over the index).
const PX_PALETTE_SIZES = [8, 12, 16, 24, 32, 48, 64, 96, 128, 192, 256, 384, 512, 1440, 4096, 11520, 32768];
var canv0 = document.createElement("canvas");
var c0 = canv0.getContext("2d", { willReadFrequently: true });

const PX_DIM_MAX = 256; //  Top of the Dimension slider.
const PX_MAX_DIM = PX_DIM_MAX * 2; //  Safety cap for the largest dimension of the working canvas.
const PX_GRID_MIN_BLOCK = 3; //  Below this the grid lines would cover the cells they outline.

//-- Floating panel listing every distinct color actually present in the pixelated output.
const paletteContainerPx = document.getElementById("paletteContainerPx");
const paletteResolutionPx = document.getElementById("paletteResolutionPx");
const paletteColorListPx = document.getElementById("paletteColorListPx");
const paletteTogglePx = document.getElementById("paletteTogglePx");
const paletteCountPx = document.getElementById("paletteCountPx");

//-- Collapsing the panel leaves only the color count, so it stops covering the picture.
//   The choice is remembered per browser (storage can be blocked, hence the try/catch).
function setPxPaletteCollapsed(collapsed) {
    paletteContainerPx.classList.toggle("collapsed", collapsed);
    paletteTogglePx.setAttribute("aria-expanded", String(!collapsed));
    try { localStorage.setItem("pictunator.paletteCollapsed", collapsed ? "1" : "0"); } catch (e) { }
}
try { setPxPaletteCollapsed(localStorage.getItem("pictunator.paletteCollapsed") === "1"); } catch (e) { }
paletteTogglePx.addEventListener("click", () => {
    setPxPaletteCollapsed(!paletteContainerPx.classList.contains("collapsed"));
});

const debouncedPxRender = debounceFn(() => {
    canv0 = getPixelatedCanvas(paramsPx);
    applyPixelation(canvOut, canv0, paramsPx);
    renderPxPalette();
}, 80);

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

const cbPxHorizontal = document.getElementById("cbPxHorizontal");
cbPxHorizontal.addEventListener("click", () => {
    paramsPx.horizontal = cbPxHorizontal.checked;

    canv0 = getPixelatedCanvas(paramsPx);
    applyPixelation(canvOut, canv0, paramsPx);
    renderPxPalette();
});

const cbPxGrid = document.getElementById("cbPxGrid");
cbPxGrid.addEventListener("click", () => {
    paramsPx.grid = cbPxGrid.checked;
    canv0 = getPixelatedCanvas(paramsPx);
    applyPixelation(canvOut, canv0, paramsPx);
});

//-- True colors: skips palette quantization entirely and shows the plain downscaled image.
//   Off (default) maps every pixel to the fixed palette picked by the Maximum palette slider.
const cbPxTrueColors = document.getElementById("cbPxTrueColors");
const wrapperPxPalette = document.getElementById("wrapperPxPalette");
const wrapperPxSelTolerance = document.getElementById("wrapperPxSelTolerance");

//-- True colors uses no palette at all, so the palette slider is hidden while it is on. Selecting
//   and filling needs the colors panel (hidden in True colors too), so its Tolerance goes as well.
function updatePxSliderVisibility() {
    wrapperPxPalette.style.display = paramsPx.trueColors ? "none" : "";
    wrapperPxSelTolerance.style.display = paramsPx.trueColors ? "none" : "";
}

cbPxTrueColors.addEventListener("input", () => {
    paramsPx.trueColors = cbPxTrueColors.checked;
    updatePxSliderVisibility();
    if (paramsPx.trueColors) clearPxSelection();
    if (imageIn == undefined) return;
    canv0 = getPixelatedCanvas(paramsPx);
    applyPixelation(canvOut, canv0, paramsPx);
    renderPxPalette();
});

//-- Slider: which fixed palette to use (see PX_PALETTES).
const containerPxPalette = document.getElementById("containerPxPalette");
const labelForContainerPxPalette = document.querySelector("[label-for=containerPxPalette]");
var rsPxPalette = new RangeSlider(containerPxPalette, {
    title: "Maximum palette",
    min: 0,
    max: PX_PALETTE_SIZES.length - 1,
    step: 1,
    def: PX_PALETTE_SIZES.indexOf(paramsPx.numColors),
    format: i => PX_PALETTE_SIZES[i],
    color: "#576b9e",
    color2: "rgb(142, 167, 231)"
});
//  The side label (mobile) is narrow, so large sizes are shortened: 4096 -> "4K", 32768 -> "32K".
const compactPaletteSize = n => n >= 1024 && n % 1024 === 0 ? `${n / 1024}K` : String(n);
labelForContainerPxPalette.innerText = compactPaletteSize(paramsPx.numColors);
rsPxPalette.onValueChange(function () {
    paramsPx.numColors = PX_PALETTE_SIZES[rsPxPalette.val];
    labelForContainerPxPalette.innerText = compactPaletteSize(paramsPx.numColors);
    if (imageIn == undefined || paramsPx.trueColors) return;
    debouncedPxRender();
});
updatePxSliderVisibility();

//-- Weighted Euclidean color distance: fixed arbitrary per-channel weights (tune to taste).
//   No sqrt needed since only relative ordering matters for nearest-match comparisons.
const PX_WEIGHT_R = 0.30;
const PX_WEIGHT_G = 0.59;
const PX_WEIGHT_B = 0.11;
function weightedDistance(r1, g1, b1, r2, g2, b2) {
    const dr = r1 - r2;
    const dg = g1 - g2;
    const db = b1 - b2;
    return PX_WEIGHT_R * dr * dr + PX_WEIGHT_G * dg * dg + PX_WEIGHT_B * db * db;
}

//-- Palettes: one fixed palette per Maximum palette size, independent of the image.
//   Grids split each channel into evenly spaced levels (0 and 255 included) and take every
//   combination, so a pixel's color is found by snapping each channel on its own. Lists are
//   conventional hand-picked palettes, matched by nearest weighted distance and cached per color.
const hexToRgb = hex => [parseInt(hex.slice(0, 2), 16), parseInt(hex.slice(2, 4), 16), parseInt(hex.slice(4, 6), 16)];

//  VGA / HTML 4 standard 16 colors.
const PX_VGA16 = [
    "000000", "800000", "008000", "808000", "000080", "800080", "008080", "c0c0c0",
    "808080", "ff0000", "00ff00", "ffff00", "0000ff", "ff00ff", "00ffff", "ffffff"
].map(hexToRgb);

//  xterm 256: the 16 system colors, a 6x6x6 cube on xterm's levels, and a 24-step gray ramp.
function buildXterm256() {
    const levels = [0, 95, 135, 175, 215, 255];
    const colors = PX_VGA16.slice();
    for (const r of levels) for (const g of levels) for (const b of levels) colors.push([r, g, b]);
    for (let i = 0; i < 24; i++) {
        const v = 8 + i * 10;
        colors.push([v, v, v]);
    }
    return colors;
}

const PX_PALETTES = {
    //  In-between sizes (12, 24, 48...) are the midpoints of their neighbours, built as grids that
    //  spend the extra levels on green first and blue last (the eye's sensitivity order).
    8: { grid: [2, 2, 2] }, //  3-bit RGB: the cube's corners.
    12: { grid: [2, 3, 2] },
    16: { list: PX_VGA16, cache: new Map() },
    24: { grid: [3, 4, 2] },
    32: { grid: [4, 4, 2] },
    48: { grid: [4, 4, 3] },
    64: { grid: [4, 4, 4] }, //  EGA's 64-color master palette.
    96: { grid: [4, 6, 4] },
    128: { grid: [4, 8, 4] },
    192: { grid: [6, 8, 4] },
    256: { list: buildXterm256(), cache: new Map() },
    384: { grid: [8, 8, 6] },
    512: { grid: [8, 8, 8] }, //  9-bit RGB (Sega Genesis, Atari ST).
    1440: { grid: [12, 12, 10] }, //  Big gaps (x8) use the geometric middle so the steps feel even.
    4096: { grid: [16, 16, 16] }, //  12-bit RGB (Amiga OCS).
    11520: { grid: [24, 24, 20] },
    32768: { grid: [32, 32, 32] } //  15-bit "high color" (SNES, GBA).
};

//-- Nearest color of a fixed list palette. The cache is kept for the whole session: the palette
//   never changes, so a color matched once stays matched.
function getClosestListColor(r, g, b, palette) {
    const packed = (r << 16) | (g << 8) | b;
    let match = palette.cache.get(packed);
    if (match !== undefined) return match;
    let bestDist = Infinity;
    for (const c of palette.list) {
        const dist = weightedDistance(r, g, b, c[0], c[1], c[2]);
        if (dist < bestDist) {
            bestDist = dist;
            match = c;
        }
    }
    palette.cache.set(packed, match);
    return match;
}

//-- Nearest of n evenly spaced levels (0..255) for one channel. The weighted distance is a sum of
//   independent per-channel terms and the palette is a full grid, so snapping each channel on its
//   own gives exactly the nearest palette color, with no search over the palette.
function snapToLevel(v, n) {
    if (n === 1) return 128;
    const step = 255 / (n - 1);
    return Math.round(Math.round(v / step) * step);
}

//-- Substitutes every pixel of canv0 with its color from the active palette.
function applyPaletteToCanv0(params) {
    const imagedata = c0.getImageData(0, 0, canv0.width, canv0.height);
    const data = imagedata.data;
    const palette = PX_PALETTES[params.numColors];
    for (let i = 0; i < data.length; i += 4) {
        if (palette.grid) {
            const [nR, nG, nB] = palette.grid;
            data[i + 0] = snapToLevel(data[i + 0], nR);
            data[i + 1] = snapToLevel(data[i + 1], nG);
            data[i + 2] = snapToLevel(data[i + 2], nB);
        } else {
            const match = getClosestListColor(data[i], data[i + 1], data[i + 2], palette);
            data[i + 0] = match[0];
            data[i + 1] = match[1];
            data[i + 2] = match[2];
        }
    }
    c0.putImageData(imagedata, 0, 0);
}

//-- Range slider controlling level of pixelation
var paramsPxLevel = {
    title: "Dimension",
    min: 8,
    step: 1,
    max: PX_DIM_MAX,
    def: paramsPx.dimension,
    color: "#576b9e",
    color2: "rgb(142, 167, 231)"
};

const containerPxLevel = document.getElementById("containerPxLevel");
const labelForContainerPxLevel = document.querySelector("[label-for=containerPxLevel]");
var rsPxLevel = new RangeSlider(containerPxLevel, paramsPxLevel);
function onPxLevelChange() {
    labelForContainerPxLevel.innerText = rsPxLevel.val;
    paramsPx.dimension = rsPxLevel.val;
    debouncedPxRender();
}
rsPxLevel.onValueChange(onPxLevelChange);
labelForContainerPxLevel.innerText = rsPxLevel.val;

function getPixelatedCanvas(params) {
    //  Callers assign the result back to canv0, so hand back the (empty) canvas instead of undefined:
    //  picking Pixelate before loading an image used to leave canv0 undefined and crash the next render.
    if (imageIn == undefined) return canv0;

    let w = (params.horizontal) ? params.dimension : parseInt(params.dimension / RATIO);
    let h = (params.horizontal) ? parseInt(params.dimension * RATIO) : params.dimension;
    w = Math.max(1, w);
    h = Math.max(1, h);
    //  Extreme aspect ratios could blow up the free dimension; cap it to keep calculations cheap.
    const largest = Math.max(w, h);
    if (largest > PX_MAX_DIM) {
        const factor = PX_MAX_DIM / largest;
        w = Math.max(1, Math.round(w * factor));
        h = Math.max(1, Math.round(h * factor));
    }
    canv0.width = w;
    canv0.height = h;
    c0 = canv0.getContext("2d", {
        willReadFrequently: true
    });
    c0.imageSmoothingEnabled = params.smooth;
    c0.drawImage(imageIn, 0, 0, canv0.width, canv0.height);
    if (!params.trueColors) applyPaletteToCanv0(params);
    syncPxEditGeometry(w, h);
    applyPxEditsToCanv0();
    return canv0;
}

function applyPixelation(canvasTarget, canvasPixelated, params) {
    if (imageIn == undefined) return;
    //  Measured against the working canvas (not params.dimension) so it stays right when PX_MAX_DIM
    //  shrank it; never below 1, or an image smaller than the chosen dimension yields a 0x0 output.
    let block = (params.horizontal) ? parseInt(imageIn.width / canvasPixelated.width) : parseInt(imageIn.height / canvasPixelated.height);
    block = Math.max(1, block);
    let pw = canvasPixelated.width * block;
    let ph = canvasPixelated.height * block;
    canvasTarget.width = pw;
    canvasTarget.height = ph;

    let ctx = canvasTarget.getContext("2d", {
        willReadFrequently: true
    });
    if (params.smooth) {
        ctx.imageSmoothingEnabled = true;
        ctx.drawImage(canvasPixelated, 0, 0, canvOut.width, canvOut.height);
    } else {
        //  drawImage's magnification can still blend in stray colors at block edges even with
        //  smoothing disabled; replicate each source pixel by hand for a genuinely crisp result.
        ctx.imageSmoothingEnabled = false;
        drawNearestNeighborUpscale(ctx, canvasPixelated, block);
    }

    if (params.grid && block >= PX_GRID_MIN_BLOCK) {
        for (let i = 1; i < canvasPixelated.height; i++) {
            let x = 0;
            let y = i * block
            ctx.beginPath();
            ctx.moveTo(x, y);
            ctx.lineTo(canvOut.width, y);
            ctx.stroke();
        }
        for (let i = 1; i < canvasPixelated.width; i++) {
            let x = i * block;
            let y = 0;
            ctx.beginPath();
            ctx.moveTo(x, y);
            ctx.lineTo(x, canvOut.height);
            ctx.stroke();
        }
    }
}

//-- Rebuilds the floating swatch table from every distinct color present in canv0 (the
//   pixelated result before it gets upscaled/gridded onto canvOut), similar colors side by side
//   (see sortPxColorsBySimilarity).
//   Hides itself whenever there's no image, Pixelate isn't the active effect, or True
//   Colors is on (that mode skips quantization, so the color count can run into the
//   thousands and isn't a meaningful "palette" to list).
const PX_PALETTE_LIST_MAX = 512;
function renderPxPalette() {
    if (imageIn == undefined || !rgEffPixelate.checked || paramsPx.trueColors) {
        paletteContainerPx.style.display = "none";
        updatePxSelUi();
        drawPxSelection(); //  Hides the selection outline too.
        return;
    }
    const imagedata = c0.getImageData(0, 0, canv0.width, canv0.height);
    const data = imagedata.data;
    const counts = new Map(); //  packed rgb -> occurrence count.
    for (let i = 0; i < data.length; i += 4) {
        const packed = (data[i] << 16) | (data[i + 1] << 8) | data[i + 2];
        counts.set(packed, (counts.get(packed) || 0) + 1);
    }
    const sorted = [...counts.keys()].sort((a, b) => counts.get(b) - counts.get(a));

    //  Number and word apart: the narrow mobile bar only has room for the number.
    const countWord = document.createElement("span");
    countWord.className = "word";
    countWord.innerText = sorted.length === 1 ? " color" : " colores";
    paletteCountPx.replaceChildren(String(sorted.length), countWord);
    paletteResolutionPx.innerText = `${canv0.width}px x ${canv0.height}px`;
    paletteColorListPx.innerHTML = "";
    //  Large palettes can leave thousands of colors; listing only the most used keeps the
    //  DOM light (the header still shows the full count).
    //  Popularity only decides which colors make the list; they are shown grouped by similarity.
    sortPxColorsBySimilarity(sorted.slice(0, PX_PALETTE_LIST_MAX)).forEach(packed => {
        const hex = "#" + packed.toString(16).padStart(6, "0");
        const row = document.createElement("div");
        row.className = "color";
        row.dataset.packed = packed; //  Read by the click handler (see onPxPaletteListClick).
        const swatch = document.createElement("span");
        swatch.className = "swatch";
        swatch.style.backgroundColor = hex;
        const hexLabel = document.createElement("span");
        hexLabel.className = "hex";
        hexLabel.innerText = hex;
        row.append(swatch, hexLabel);
        paletteColorListPx.appendChild(row);
    });
    if (sorted.length > PX_PALETTE_LIST_MAX) {
        const more = document.createElement("div");
        more.className = "color more";
        more.innerText = `+${sorted.length - PX_PALETTE_LIST_MAX} más`;
        paletteColorListPx.appendChild(more);
    }
    paletteContainerPx.style.display = "flex";
    updatePxSelUi();
    drawPxSelection();
}

//-- Orders packed colors so similar ones sit together: grays first (dark -> light), then the
//   chromatic ones by hue in PX_HUE_BAND-degree bands starting at red, each band by lightness.
//   Bands alternate direction (dark -> light, then light -> dark) so every band starts near
//   where the previous one ended instead of jumping from white back to black.
//   Grayness uses chroma (max - min channel) rather than HSL saturation, which shoots up for
//   near-black and near-white colors that look gray anyway.
const PX_GRAY_CHROMA = 24; //  Below this chroma (0-255) a color is listed with the grays.
const PX_HUE_BAND = 15; //  Degrees of hue per band.
function sortPxColorsBySimilarity(packedColors) {
    const keyed = packedColors.map(packed => {
        const r = (packed >> 16) & 0xff, g = (packed >> 8) & 0xff, b = packed & 0xff;
        const max = Math.max(r, g, b), min = Math.min(r, g, b);
        const chroma = max - min;
        const light = 0.30 * r + 0.59 * g + 0.11 * b; //  Same weights as weightedDistance().
        let hue = 0;
        if (chroma > 0) {
            if (max === r) hue = ((g - b) / chroma + 6) % 6;
            else if (max === g) hue = (b - r) / chroma + 2;
            else hue = (r - g) / chroma + 4;
            hue *= 60;
        }
        //  Band -1 holds the grays so they come first.
        const band = chroma < PX_GRAY_CHROMA ? -1 : Math.floor(hue / PX_HUE_BAND);
        return { packed, band, light, hue };
    });
    keyed.sort((a, b) => {
        if (a.band !== b.band) return a.band - b.band;
        //  Grays and even bands run dark -> light; odd bands light -> dark.
        const dir = a.band >= 0 && a.band % 2 === 1 ? -1 : 1;
        const d = (a.light - b.light) * dir;
        return d !== 0 ? d : a.hue - b.hue;
    });
    return keyed.map(k => k.packed);
}

//-- Any effect switch can hide (or reveal) the palette panel, not just Pixelate's own controls.
document.querySelectorAll("[name=rbgEffects]").forEach(rb => {
    rb.addEventListener("input", renderPxPalette);
});

//  PIXELATE: SELECT & FILL
//-- Clicking a cell of the output (or a color in the panel) selects cells of that color; picking
//   a color in the panel then paints them. Everything works on canv0 (at most PX_MAX_DIM per side),
//   never on the upscaled canvOut, so a selection or fill touches a few thousand cells at most.
//   Fills are kept as per-cell overrides re-applied after every palette pass, so they survive
//   palette/True colors/smooth/grid changes; a different grid size (Dimension, orientation, new
//   image) makes the cell indices meaningless, so it drops them (see syncPxEditGeometry).
var pxEdits = new Map(); //  cell index (y * w + x) -> packed rgb painted over it.
var pxEditGeometry = ""; //  "WxH" of the grid pxEdits was painted on.
var pxUndoStack = []; //  { idx: Int32Array, prev: Int32Array, seeds } per fill; prev -1 = no override.
const PX_UNDO_MAX = 50;
var pxSelSeeds = []; //  { cell: index } from canvas clicks, or { packed } from panel clicks.
var pxSelMask = null; //  Uint8Array(w * h), 1 = selected; null = nothing selected.
var pxSelCount = 0;

const displayImgOut = document.querySelector(".display.img-out");
const canvSelPx = document.getElementById("canvSelPx");
const ctxSelPx = canvSelPx.getContext("2d");
const selInfoPx = document.getElementById("selInfoPx");
const selClearPx = document.getElementById("selClearPx");
const editUndoPx = document.getElementById("editUndoPx");
const cbPxContiguous = document.getElementById("cbPxContiguous");

function resetPxEdits() {
    pxEdits.clear();
    pxUndoStack = [];
    pxEditGeometry = "";
    pxSelSeeds = [];
    pxSelMask = null;
    pxSelCount = 0;
}

function syncPxEditGeometry(w, h) {
    const key = `${w}x${h}`;
    if (key === pxEditGeometry) return;
    resetPxEdits();
    pxEditGeometry = key;
}

function applyPxEditsToCanv0() {
    if (pxEdits.size === 0) return;
    const imagedata = c0.getImageData(0, 0, canv0.width, canv0.height);
    const data = imagedata.data;
    for (const [cell, packed] of pxEdits) {
        const i = cell * 4;
        data[i + 0] = (packed >> 16) & 0xff;
        data[i + 1] = (packed >> 8) & 0xff;
        data[i + 2] = packed & 0xff;
        data[i + 3] = 255;
    }
    c0.putImageData(imagedata, 0, 0);
}

//-- Rebuilds pxSelMask from the seeds against canv0's current colors. A cell matches when its
//   weighted distance to the seed's color is within Tolerance (0 = exact color only). Contiguous
//   canvas seeds flood-fill through 4-connected neighbours, always comparing against the seed's own
//   color (not the neighbour's) so the region can't drift into unrelated colors step by step.
//   Panel seeds have no position, so they always select every matching cell.
function computePxSelection() {
    pxSelMask = null;
    pxSelCount = 0;
    if (pxSelSeeds.length === 0 || imageIn == undefined) return;
    const w = canv0.width, h = canv0.height, n = w * h;
    const data = c0.getImageData(0, 0, w, h).data;
    const mask = new Uint8Array(n);
    const tol = paramsPx.selTolerance;
    const maxDist = tol * tol; //  weightedDistance() is squared.
    const matches = (cell, r, g, b) => {
        const i = cell * 4;
        if (tol === 0) return data[i] === r && data[i + 1] === g && data[i + 2] === b;
        return weightedDistance(data[i], data[i + 1], data[i + 2], r, g, b) <= maxDist;
    };
    let visited = null;
    let stack = null;
    for (const seed of pxSelSeeds) {
        let r, g, b;
        if (seed.cell !== undefined) {
            if (seed.cell >= n) continue;
            r = data[seed.cell * 4]; g = data[seed.cell * 4 + 1]; b = data[seed.cell * 4 + 2];
        } else {
            r = (seed.packed >> 16) & 0xff; g = (seed.packed >> 8) & 0xff; b = seed.packed & 0xff;
        }
        if (seed.cell !== undefined && paramsPx.selContiguous) {
            //  Own visited array per seed: stopping at cells another seed already selected could
            //  cut this region short where it passes through them.
            if (visited === null) { visited = new Uint8Array(n); stack = new Int32Array(n); }
            else visited.fill(0);
            let top = 0;
            stack[top++] = seed.cell;
            visited[seed.cell] = 1;
            while (top > 0) {
                const cell = stack[--top];
                mask[cell] = 1;
                const x = cell % w;
                const neighbours = [
                    x > 0 ? cell - 1 : -1,
                    x < w - 1 ? cell + 1 : -1,
                    cell >= w ? cell - w : -1,
                    cell < n - w ? cell + w : -1
                ];
                for (const nb of neighbours) {
                    if (nb < 0 || visited[nb]) continue;
                    visited[nb] = 1;
                    if (matches(nb, r, g, b)) stack[top++] = nb;
                }
            }
        } else {
            for (let cell = 0; cell < n; cell++) {
                if (!mask[cell] && matches(cell, r, g, b)) mask[cell] = 1;
            }
        }
    }
    for (let cell = 0; cell < n; cell++) pxSelCount += mask[cell];
    if (pxSelCount > 0) pxSelMask = mask;
}

function setPxSelection(seeds) {
    pxSelSeeds = seeds;
    computePxSelection();
    if (pxSelCount > 0) setPxPaletteCollapsed(false); //  Filling needs the swatches in view.
    updatePxSelUi();
    drawPxSelection();
}

function clearPxSelection() {
    if (pxSelSeeds.length === 0 && pxSelMask === null) return;
    setPxSelection([]);
}

//-- Paints every selected cell with `packed`, then lets the selection follow the merge: it is
//   recomputed with color seeds switched to the fill color (canvas seeds re-read their cells, which
//   now hold it too). So after merging A into B the selection is all of B, and the next color
//   recolors the whole merged group instead of only the cells that used to be A.
function fillPxSelection(packed) {
    if (pxSelMask === null) return;
    const idx = new Int32Array(pxSelCount);
    const prev = new Int32Array(pxSelCount);
    let k = 0;
    for (let cell = 0; cell < pxSelMask.length; cell++) {
        if (!pxSelMask[cell]) continue;
        idx[k] = cell;
        prev[k] = pxEdits.has(cell) ? pxEdits.get(cell) : -1;
        pxEdits.set(cell, packed);
        k++;
    }
    pxUndoStack.push({ idx, prev, seeds: pxSelSeeds });
    if (pxUndoStack.length > PX_UNDO_MAX) pxUndoStack.shift();
    const cellSeeds = pxSelSeeds.filter(seed => seed.cell !== undefined);
    const hadColorSeed = cellSeeds.length < pxSelSeeds.length;
    rerenderPxEdits();
    setPxSelection(hadColorSeed ? [...cellSeeds, { packed }] : cellSeeds);
}

function undoPxFill() {
    const step = pxUndoStack.pop();
    if (step === undefined) return;
    for (let k = 0; k < step.idx.length; k++) {
        if (step.prev[k] === -1) pxEdits.delete(step.idx[k]);
        else pxEdits.set(step.idx[k], step.prev[k]);
    }
    rerenderPxEdits();
    setPxSelection(step.seeds); //  Back to the selection that fill started from.
}

function rerenderPxEdits() {
    if (imageIn == undefined) return;
    canv0 = getPixelatedCanvas(paramsPx);
    applyPixelation(canvOut, canv0, paramsPx);
    renderPxPalette(); //  Also refreshes the selection bar and outline.
}

function updatePxSelUi() {
    const hasSel = pxSelCount > 0;
    //  Kept short: the panel sits over the picture and grows with this text.
    selInfoPx.innerText = hasSel ? `${pxSelCount} px · elige color` : "Clic: seleccionar";
    selInfoPx.title = hasSel
        ? "Clic en un color de la lista, u Option/Alt+clic, clic derecho o pulsación larga en la imagen, para rellenar la selección (Shift: añadir a la selección)"
        : "Clic en la imagen o en un color de la lista para seleccionar (Shift: añadir)";
    selClearPx.hidden = !hasSel;
    //  Tolerance only re-selects from existing clicks, so it means nothing without a selection.
    //  (Checked for existence: the first UI refresh can run before the slider is built.)
    if (typeof rsPxSelTolerance !== "undefined") {
        rsPxSelTolerance.disabled = !hasSel;
        wrapperPxSelTolerance.classList.toggle("is-disabled", !hasSel);
    }
    editUndoPx.hidden = pxUndoStack.length === 0;
    paletteColorListPx.classList.toggle("filling", hasSel);
    highlightPxSelectedColors();
    canvOut.classList.toggle("pickable", imageIn != undefined && rgEffPixelate.checked && !paramsPx.trueColors);
}

//-- Marks in the panel every color found among the selected cells (with Tolerance or several clicks
//   that can be more than one; after a fill it is the fill color). Read from canv0, so it is always
//   what the selection holds right now.
function highlightPxSelectedColors() {
    const rows = paletteColorListPx.querySelectorAll(".color[data-packed]");
    const selected = new Set();
    if (pxSelMask !== null && pxSelMask.length === canv0.width * canv0.height) {
        const data = c0.getImageData(0, 0, canv0.width, canv0.height).data;
        for (let cell = 0; cell < pxSelMask.length; cell++) {
            if (!pxSelMask[cell]) continue;
            const i = cell * 4;
            selected.add((data[i] << 16) | (data[i + 1] << 8) | data[i + 2]);
        }
    }
    rows.forEach(row => row.classList.toggle("selected", selected.has(Number(row.dataset.packed))));
}

//-- Cell of canv0 under a pointer position, or -1 when picking isn't possible right now. canvOut is
//   displayed without object-fit, so its box is exactly the image and a proportional mapping is enough.
function pxCellAt(clientX, clientY) {
    if (imageIn == undefined || !rgEffPixelate.checked || paramsPx.trueColors) return -1;
    const rect = canvOut.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return -1;
    const x = Math.min(canv0.width - 1, Math.max(0, Math.floor((clientX - rect.left) / rect.width * canv0.width)));
    const y = Math.min(canv0.height - 1, Math.max(0, Math.floor((clientY - rect.top) / rect.height * canv0.height)));
    return y * canv0.width + x;
}

//-- Eyedropper fill: paints the selection with the color of the cell under the pointer (same as
//   picking that color in the panel). Returns false, doing nothing, when there's no selection.
function pxEyedropperFillAt(clientX, clientY) {
    if (pxSelCount === 0) return false;
    const cell = pxCellAt(clientX, clientY);
    if (cell < 0) return false;
    const d = c0.getImageData(cell % canv0.width, Math.floor(cell / canv0.width), 1, 1).data;
    fillPxSelection((d[0] << 16) | (d[1] << 8) | d[2]);
    return true;
}

//-- Canvas click selects the cell's color region; Shift/Ctrl/Cmd adds to the selection.
//   Eyedropper fill (selection active) has three triggers: Option/Alt+click, right-click, and a
//   long-press on touch screens; without a selection they fall back to their normal behaviour.
var pxSuppressNextClick = false; //  A long-press already acted; the click that follows must not.
canvOut.addEventListener("click", (evt) => {
    if (pxSuppressNextClick) {
        pxSuppressNextClick = false;
        return;
    }
    if (evt.altKey && pxEyedropperFillAt(evt.clientX, evt.clientY)) return;
    const cell = pxCellAt(evt.clientX, evt.clientY);
    if (cell < 0) return;
    const seed = { cell };
    const add = evt.shiftKey || evt.ctrlKey || evt.metaKey;
    setPxSelection(add ? [...pxSelSeeds, seed] : [seed]);
});

//-- Right-click: eyedropper fill instead of the browser menu, but only with a selection, so the
//   native menu ("Save image as...") still works otherwise. Touch long-presses also raise
//   contextmenu on some browsers (Android); the long-press timer handles those, so just swallow it.
var pxTouchActive = false;
canvOut.addEventListener("contextmenu", (evt) => {
    if (pxTouchActive || pxSuppressNextClick) {
        if (pxSelCount > 0) evt.preventDefault();
        return;
    }
    if (pxEyedropperFillAt(evt.clientX, evt.clientY)) evt.preventDefault();
});

//-- Long-press (touch/pen): holding still for PX_LONG_PRESS_MS fills from the cell under the finger.
//   Moving more than PX_LONG_PRESS_SLOP px cancels it, so scrolling/panning stays untouched.
const PX_LONG_PRESS_MS = 500;
const PX_LONG_PRESS_SLOP = 10;
var pxLongPress = null; //  { id, x, y, timer } of the pending press.
function cancelPxLongPress() {
    if (pxLongPress !== null) clearTimeout(pxLongPress.timer);
    pxLongPress = null;
}
canvOut.addEventListener("pointerdown", (evt) => {
    if (evt.pointerType === "mouse") return;
    pxTouchActive = true;
    cancelPxLongPress();
    if (pxSelCount === 0) return; //  Nothing to fill; a long-press then just ends in a normal tap.
    const press = { id: evt.pointerId, x: evt.clientX, y: evt.clientY };
    press.timer = setTimeout(() => {
        pxLongPress = null;
        if (pxEyedropperFillAt(press.x, press.y)) {
            pxSuppressNextClick = true;
            if (navigator.vibrate) navigator.vibrate(15); //  Haptic tick where supported (Android).
        }
    }, PX_LONG_PRESS_MS);
    pxLongPress = press;
});
canvOut.addEventListener("pointermove", (evt) => {
    if (pxLongPress === null || evt.pointerId !== pxLongPress.id) return;
    if (Math.hypot(evt.clientX - pxLongPress.x, evt.clientY - pxLongPress.y) > PX_LONG_PRESS_SLOP) cancelPxLongPress();
});
["pointerup", "pointercancel", "pointerleave"].forEach(type => {
    canvOut.addEventListener(type, (evt) => {
        if (evt.pointerType === "mouse") return;
        cancelPxLongPress();
        //  The click (if any) fires right after pointerup; drop the flags once it has had its turn.
        setTimeout(() => {
            pxTouchActive = false;
            pxSuppressNextClick = false;
        }, 400);
    });
});

//-- Clicking the dark area around the picture drops the selection (not when it ends a pan).
displayImgOut.addEventListener("click", (evt) => {
    if (pxSuppressNextClick) return;
    if (evt.target === displayImgOut) clearPxSelection();
});

//-- Panel click: with a selection it fills it with that color (Shift/Ctrl/Cmd adds that color to the
//   selection instead); without one, it selects every cell of that color.
paletteColorListPx.addEventListener("click", (evt) => {
    const row = evt.target.closest(".color[data-packed]");
    if (row === null) return;
    const packed = Number(row.dataset.packed);
    const add = evt.shiftKey || evt.ctrlKey || evt.metaKey;
    if (pxSelCount > 0 && !add) fillPxSelection(packed);
    else setPxSelection(add ? [...pxSelSeeds, { packed }] : [{ packed }]);
});

selClearPx.addEventListener("click", clearPxSelection);
editUndoPx.addEventListener("click", undoPxFill);

document.addEventListener("keydown", (evt) => {
    if (!rgEffPixelate.checked || imageIn == undefined) return;
    const tag = evt.target.tagName;
    if (tag === "INPUT" && evt.target.type !== "checkbox" && evt.target.type !== "radio" || tag === "TEXTAREA") return;
    if (evt.key === "Escape") {
        clearPxSelection();
    } else if ((evt.ctrlKey || evt.metaKey) && !evt.shiftKey && evt.key.toLowerCase() === "z") {
        if (pxUndoStack.length === 0) return;
        evt.preventDefault();
        undoPxFill();
    }
});

cbPxContiguous.addEventListener("input", () => {
    paramsPx.selContiguous = cbPxContiguous.checked;
    if (pxSelSeeds.length > 0) setPxSelection(pxSelSeeds);
});

//-- Slider: Tolerance for the selection; re-selects live from the same clicks.
const containerPxSelTolerance = document.getElementById("containerPxSelTolerance");
const labelForContainerPxSelTolerance = document.querySelector("[label-for=containerPxSelTolerance]");
var rsPxSelTolerance = new RangeSlider(containerPxSelTolerance, {
    title: "Tolerance",
    min: 0,
    max: 100,
    step: 1,
    def: paramsPx.selTolerance,
    color: "#576b9e",
    color2: "rgb(142, 167, 231)"
});
labelForContainerPxSelTolerance.innerText = rsPxSelTolerance.val;
const debouncedPxReselect = debounceFn(() => {
    if (pxSelSeeds.length > 0) setPxSelection(pxSelSeeds);
}, 40);
rsPxSelTolerance.onValueChange(function () {
    paramsPx.selTolerance = rsPxSelTolerance.val;
    labelForContainerPxSelTolerance.innerText = paramsPx.selTolerance;
    debouncedPxReselect();
});
updatePxSliderVisibility(); //  The Tolerance wrapper exists now too.

//-- Selection outline: "marching ants" on a separate canvas laid exactly over canvOut. Only the
//   region borders are drawn (runs of cell edges where selected meets unselected, merged into long
//   segments so the dashes flow), built once into a Path2D and just re-stroked to animate.
var pxSelPath = null;
var pxAntsFrame = 0;
var pxAntsLast = 0;
var pxAntsOffset = 0;
const pxReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

function drawPxSelection() {
    const visible = imageIn != undefined && rgEffPixelate.checked && !paramsPx.trueColors && pxSelMask !== null
        && pxSelMask.length === canv0.width * canv0.height;
    if (!visible) {
        canvSelPx.style.display = "none";
        pxSelPath = null;
        cancelAnimationFrame(pxAntsFrame);
        pxAntsFrame = 0;
        return;
    }
    //  The overlay covers the whole output display (not just the picture) so it stays the size of the
    //  viewport however far the output is zoomed (see OUTPUT ZOOM): lines stay crisp and the canvas
    //  never grows past browser limits. Cells are placed where canvOut currently is on screen.
    const r = canvOut.getBoundingClientRect(); //  Includes the zoom transform.
    const p = displayImgOut.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    canvSelPx.style.display = "block";
    canvSelPx.style.left = "0px";
    canvSelPx.style.top = "0px";
    canvSelPx.style.width = `${displayImgOut.clientWidth}px`;
    canvSelPx.style.height = `${displayImgOut.clientHeight}px`;
    canvSelPx.width = Math.max(1, Math.round(displayImgOut.clientWidth * dpr));
    canvSelPx.height = Math.max(1, Math.round(displayImgOut.clientHeight * dpr));

    const w = canv0.width, h = canv0.height, mask = pxSelMask;
    const ox = (r.left - p.left - displayImgOut.clientLeft) * dpr;
    const oy = (r.top - p.top - displayImgOut.clientTop) * dpr;
    const iw = r.width * dpr, ih = r.height * dpr;
    const sx = iw / w, sy = ih / h;
    const inset = Math.max(1, dpr); //  Keeps lines on the picture's outer border fully visible.
    const px = x => Math.min(ox + iw - inset, Math.max(ox + inset, ox + x * sx));
    const py = y => Math.min(oy + ih - inset, Math.max(oy + inset, oy + y * sy));
    const path = new Path2D();
    for (let y = 0; y <= h; y++) { //  Horizontal edges: between row y-1 and row y.
        let start = -1;
        for (let x = 0; x <= w; x++) {
            const edge = x < w && (y > 0 ? mask[(y - 1) * w + x] : 0) !== (y < h ? mask[y * w + x] : 0);
            if (edge && start < 0) start = x;
            if (!edge && start >= 0) { path.moveTo(px(start), py(y)); path.lineTo(px(x), py(y)); start = -1; }
        }
    }
    for (let x = 0; x <= w; x++) { //  Vertical edges: between column x-1 and column x.
        let start = -1;
        for (let y = 0; y <= h; y++) {
            const edge = y < h && (x > 0 ? mask[y * w + x - 1] : 0) !== (x < w ? mask[y * w + x] : 0);
            if (edge && start < 0) start = y;
            if (!edge && start >= 0) { path.moveTo(px(x), py(start)); path.lineTo(px(x), py(y)); start = -1; }
        }
    }
    pxSelPath = path;
    strokePxAnts();
    if (pxAntsFrame === 0 && !pxReducedMotion.matches) pxAntsFrame = requestAnimationFrame(animatePxAnts);
}

function strokePxAnts() {
    if (pxSelPath === null) return;
    const dpr = window.devicePixelRatio || 1;
    ctxSelPx.clearRect(0, 0, canvSelPx.width, canvSelPx.height);
    ctxSelPx.lineWidth = 1.5 * dpr;
    ctxSelPx.setLineDash([]);
    ctxSelPx.strokeStyle = "#000";
    ctxSelPx.stroke(pxSelPath);
    ctxSelPx.setLineDash([4 * dpr, 4 * dpr]);
    ctxSelPx.lineDashOffset = -pxAntsOffset * dpr;
    ctxSelPx.strokeStyle = "#fff";
    ctxSelPx.stroke(pxSelPath);
}

//-- ~12 fps is plenty for the ants and keeps big selections cheap to re-stroke.
function animatePxAnts(time) {
    if (pxSelPath === null) { pxAntsFrame = 0; return; }
    if (time - pxAntsLast > 80) {
        pxAntsLast = time;
        pxAntsOffset = (pxAntsOffset + 1) % 8;
        strokePxAnts();
    }
    pxAntsFrame = requestAnimationFrame(animatePxAnts);
}

//-- canvOut resizes with every render and with the layout toggles; re-clamp the zoom (which also
//   redraws the selection overlay) so both stay glued to it.
const pxSelResizeObserver = new ResizeObserver(() => applyOutZoom());
pxSelResizeObserver.observe(canvOut);
pxSelResizeObserver.observe(displayImgOut);
updatePxSelUi();

//  OUTPUT ZOOM (every effect)
//-- Zooms and pans the output display only (the input image is a separate element, docked or
//   floating, and is never touched). It's a CSS transform on canvOut, so nothing is re-rendered and
//   downloads are unaffected; pxCellAt() and the selection overlay read the transformed box, so
//   picking and the marching ants follow the zoom.
//   Zoom: wheel / trackpad pinch, two-finger pinch, + and - keys. Pan: drag once zoomed (mouse or one
//   finger), or middle-button drag. Reset: double-click, 0 key, or the % badge. A drag only starts
//   past OUT_DRAG_SLOP px, so clicks, taps and long-presses keep selecting and filling.
const OUT_ZOOM_MAX = 32;
const OUT_DRAG_SLOP = 4;
var outZoom = { s: 1, tx: 0, ty: 0 }; //  Scale, then translation in CSS px (transform-origin 0 0).
const outZoomBadge = document.getElementById("outZoomBadge");

//-- canvOut's untransformed box in client coordinates (offset* ignore transforms).
function outBaseBox() {
    const p = displayImgOut.getBoundingClientRect();
    return {
        left: p.left + displayImgOut.clientLeft + canvOut.offsetLeft,
        top: p.top + displayImgOut.clientTop + canvOut.offsetTop,
        w: canvOut.offsetWidth,
        h: canvOut.offsetHeight
    };
}

//-- Clamps one axis of the pan: a picture bigger than the viewport must keep covering it (no empty
//   strip past its edges); a smaller one must stay fully inside it.
function clampOutAxis(t, base, size, viewStart, viewSize) {
    const minStart = size > viewSize ? viewStart + viewSize - size : viewStart;
    const maxStart = size > viewSize ? viewStart : viewStart + viewSize - size;
    return Math.min(maxStart, Math.max(minStart, base + t)) - base;
}

//-- Clamps and applies outZoom (viewport = the output display's inner box).
var outOverlayFrame = 0;
function applyOutZoom() {
    const b = outBaseBox();
    const z = outZoom;
    z.s = Math.min(OUT_ZOOM_MAX, Math.max(1, z.s));
    if (z.s === 1) {
        z.tx = 0;
        z.ty = 0;
    } else {
        const p = displayImgOut.getBoundingClientRect();
        const vx = p.left + displayImgOut.clientLeft, vy = p.top + displayImgOut.clientTop;
        z.tx = clampOutAxis(z.tx, b.left, b.w * z.s, vx, displayImgOut.clientWidth);
        z.ty = clampOutAxis(z.ty, b.top, b.h * z.s, vy, displayImgOut.clientHeight);
    }
    canvOut.style.transform = z.s === 1 ? "" : `translate(${z.tx}px, ${z.ty}px) scale(${z.s})`;
    //  Past 1:1 the browser would blur the upscaled canvas; keep its pixels square instead.
    canvOut.classList.toggle("magnified", canvOut.width > 0 && b.w * z.s / canvOut.width > 1);
    outZoomBadge.hidden = z.s === 1;
    outZoomBadge.textContent = `${Math.round(z.s * 100)}% ⟲`;
    if (outOverlayFrame === 0) {
        outOverlayFrame = requestAnimationFrame(() => {
            outOverlayFrame = 0;
            if (pxSelMask !== null) drawPxSelection();
        });
    }
}

//-- Multiplies the zoom by `factor`, keeping the picture point under (clientX, clientY) in place.
function zoomOutAt(clientX, clientY, factor) {
    if (imageIn == undefined) return;
    const b = outBaseBox();
    const z = outZoom;
    const lx = (clientX - b.left - z.tx) / z.s;
    const ly = (clientY - b.top - z.ty) / z.s;
    const s2 = Math.min(OUT_ZOOM_MAX, Math.max(1, z.s * factor));
    z.tx = clientX - b.left - s2 * lx;
    z.ty = clientY - b.top - s2 * ly;
    z.s = s2;
    applyOutZoom();
}

function resetOutZoom() {
    outZoom = { s: 1, tx: 0, ty: 0 };
    applyOutZoom();
}

function zoomOutAtCenter(factor) {
    const p = displayImgOut.getBoundingClientRect();
    zoomOutAt(p.left + p.width / 2, p.top + p.height / 2, factor);
}

//-- Wheel: pinch on a trackpad arrives as ctrl+wheel with small deltas, a mouse wheel as plain wheel.
displayImgOut.addEventListener("wheel", (evt) => {
    if (imageIn == undefined) return;
    evt.preventDefault();
    const dy = evt.deltaY * (evt.deltaMode === 1 ? 16 : evt.deltaMode === 2 ? 400 : 1);
    zoomOutAt(evt.clientX, evt.clientY, Math.exp(-dy * (evt.ctrlKey ? 0.01 : 0.0015)));
}, { passive: false });

displayImgOut.addEventListener("dblclick", (evt) => {
    if (evt.target === outZoomBadge) return;
    resetOutZoom();
});
outZoomBadge.addEventListener("click", resetOutZoom);

//-- Drag-to-pan and two-finger pinch.
const outPointers = new Map(); //  pointerId -> { x, y }
var outGesture = null; //  { kind: "pending" | "pan", id, x0, y0, lastX, lastY, middle } or { kind: "pinch", ... }
var outGestureUsed = false; //  A pan/pinch happened: the click that ends it must not select.

function outPinchStart() {
    const [a, b] = [...outPointers.values()];
    outGesture = {
        kind: "pinch",
        dist0: Math.max(1, Math.hypot(b.x - a.x, b.y - a.y)),
        midX0: (a.x + b.x) / 2,
        midY0: (a.y + b.y) / 2,
        s0: outZoom.s,
        tx0: outZoom.tx,
        ty0: outZoom.ty
    };
}

displayImgOut.addEventListener("pointerdown", (evt) => {
    if (imageIn == undefined) return;
    if (evt.pointerType === "mouse" && evt.button !== 0 && evt.button !== 1) return;
    outPointers.set(evt.pointerId, { x: evt.clientX, y: evt.clientY });
    if (outPointers.size === 2) {
        cancelPxLongPress();
        outGestureUsed = true;
        outPinchStart();
    } else if (outPointers.size === 1) {
        if (evt.button === 1) evt.preventDefault(); //  No middle-click autoscroll.
        outGesture = {
            kind: "pending", id: evt.pointerId, x0: evt.clientX, y0: evt.clientY,
            lastX: evt.clientX, lastY: evt.clientY, middle: evt.button === 1
        };
    }
});

displayImgOut.addEventListener("pointermove", (evt) => {
    if (!outPointers.has(evt.pointerId) || outGesture === null) return;
    outPointers.set(evt.pointerId, { x: evt.clientX, y: evt.clientY });
    const g = outGesture;
    if (g.kind === "pinch") {
        if (outPointers.size < 2) return;
        const [a, b] = [...outPointers.values()];
        const dist = Math.max(1, Math.hypot(b.x - a.x, b.y - a.y));
        const midX = (a.x + b.x) / 2, midY = (a.y + b.y) / 2;
        const base = outBaseBox();
        //  Picture point that was under the starting midpoint follows the current midpoint.
        const lx = (g.midX0 - base.left - g.tx0) / g.s0;
        const ly = (g.midY0 - base.top - g.ty0) / g.s0;
        const s2 = Math.min(OUT_ZOOM_MAX, Math.max(1, g.s0 * dist / g.dist0));
        outZoom = { s: s2, tx: midX - base.left - s2 * lx, ty: midY - base.top - s2 * ly };
        applyOutZoom();
        return;
    }
    if (evt.pointerId !== g.id) return;
    if (g.kind === "pending") {
        const far = Math.hypot(evt.clientX - g.x0, evt.clientY - g.y0) > OUT_DRAG_SLOP;
        if (!far || (outZoom.s === 1 && !g.middle)) return;
        g.kind = "pan";
        outGestureUsed = true;
        cancelPxLongPress();
        displayImgOut.setPointerCapture(evt.pointerId); //  Keep panning when the pointer leaves the display.
        displayImgOut.classList.add("panning");
    }
    outZoom.tx += evt.clientX - g.lastX;
    outZoom.ty += evt.clientY - g.lastY;
    g.lastX = evt.clientX;
    g.lastY = evt.clientY;
    applyOutZoom();
});

function onOutPointerEnd(evt) {
    if (!outPointers.has(evt.pointerId)) return;
    outPointers.delete(evt.pointerId);
    if (outGesture !== null && outGesture.kind === "pinch" && outPointers.size === 1) {
        outGesture = null; //  The finger left on screen doesn't start a pan (it would jump).
    } else if (outPointers.size === 0) {
        outGesture = null;
        displayImgOut.classList.remove("panning");
        if (outGestureUsed) {
            outGestureUsed = false;
            //  The click (if any) is dispatched right after this; let it see the flag, then drop it.
            pxSuppressNextClick = true;
            setTimeout(() => { pxSuppressNextClick = false; }, evt.pointerType === "mouse" ? 0 : 400);
        }
    }
}
displayImgOut.addEventListener("pointerup", onOutPointerEnd);
displayImgOut.addEventListener("pointercancel", onOutPointerEnd);

//-- Keys (any effect, not while typing; Ctrl/Cmd combos stay the browser's own zoom).
document.addEventListener("keydown", (evt) => {
    if (imageIn == undefined || evt.ctrlKey || evt.metaKey || evt.altKey) return;
    const tag = evt.target.tagName;
    if (tag === "INPUT" && evt.target.type !== "checkbox" && evt.target.type !== "radio" || tag === "TEXTAREA") return;
    if (evt.key === "0") resetOutZoom();
    else if (evt.key === "+" || evt.key === "=") zoomOutAtCenter(1.25);
    else if (evt.key === "-") zoomOutAtCenter(1 / 1.25);
});

//-- Replicates every pixel of `source` into a `block`x`block` square on `ctx`, bypassing
//   drawImage's built-in scaling so the result is exactly nearest-neighbor with no blending.
function drawNearestNeighborUpscale(ctx, source, block) {
    const sctx = source.getContext("2d", { willReadFrequently: true });
    const srcData = sctx.getImageData(0, 0, source.width, source.height).data;
    const dw = source.width * block;
    const dh = source.height * block;
    const out = ctx.createImageData(dw, dh);
    const outData = out.data;
    for (let sy = 0; sy < source.height; sy++) {
        for (let sx = 0; sx < source.width; sx++) {
            const si = (sy * source.width + sx) * 4;
            const r = srcData[si], g = srcData[si + 1], b = srcData[si + 2], a = srcData[si + 3];
            for (let by = 0; by < block; by++) {
                let di = ((sy * block + by) * dw + sx * block) * 4;
                for (let bx = 0; bx < block; bx++) {
                    outData[di] = r;
                    outData[di + 1] = g;
                    outData[di + 2] = b;
                    outData[di + 3] = a;
                    di += 4;
                }
            }
        }
    }
    ctx.putImageData(out, 0, 0);
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
const rsGraysLevels = new RangeSlider(containerGraysLevels, {
    title: "Levels of gray",
    min: 2,
    max: 20,
    step: 1,
    def: paramsGrays.levels,
    color: "#576b9e",
    color2: "rgb(142, 167, 231)"
});
//  More than 20 grayscale tones are barely distinguishable.
labelForContainerGraysLevels.innerText = rsGraysLevels.val;
rsGraysLevels.onValueChange(function () {
    labelForContainerGraysLevels.innerText = rsGraysLevels.val;
    paramsGrays.levels = rsGraysLevels.val;
    applyGrayscaling(paramsGrays);
});

//-- Slider for gray sensitivity.
const containerGraysSensitivity = document.getElementById("containerGraysSensitivity");
const labelForContainerGraysSensitivity = document.querySelector("[label-for=containerGraysSensitivity]");
const rsGraysSensitivity = new RangeSlider(containerGraysSensitivity, {
    title: "Sensitivity",
    min: -254,
    step: 1,
    max: 254,
    def: paramsGrays.sens,
    color: "#576b9e",
    color2: "rgb(142, 167, 231)"
});
labelForContainerGraysSensitivity.innerText = rsGraysSensitivity.val;
rsGraysSensitivity.onValueChange(function () {
    labelForContainerGraysSensitivity.innerText = rsGraysSensitivity.val;
    paramsGrays.sens = rsGraysSensitivity.val;
    applyGrayscaling(paramsGrays);
});


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
    let ctx = canvOut.getContext("2d", {
        willReadFrequently: true
    });
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
    buckets: [
        [0, 85],
        [86, 170]
    ], //  This is what get255Buckets will return with default how_many lines value of 3 minus the last (brightest) bucket.
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
var rsHatchHowmanyw = new RangeSlider(containerHatchHowmany, {
    title: "Lines",
    min: 1,
    max: 10,
    def: paramsHatch.buckets.length,
    step: 1,
    color: "#576b9e",
    color2: "rgb(142, 167, 231)"
});
labelForContainerHatchHowmany.innerText = rsHatchHowmanyw.val;
rsHatchHowmanyw.onValueChange(async function () {
    labelForContainerHatchHowmany.innerText = rsHatchHowmanyw.val;
    if (imageIn == undefined) return;
    paramsHatch.buckets = await get255Buckets(rsHatchHowmanyw.val + 1, paramsHatch.sensitivity);
    paramsHatch.buckets.pop(); //  One more bucket is added for absolute white values, but then removed so it is not hatched.
    paramsHatch.atdh = await getArrToDrawHatch(paramsHatch);
    applyHatching(paramsHatch);
});

// Hatch separation slider.
const containerHatchSeparation = document.getElementById("containerHatchSeparation");
const labelForContainerHatchSeparation = document.querySelector("[label-for=containerHatchSeparation]");
var rsHatchSeparation = new RangeSlider(containerHatchSeparation, {
    title: "Separation",
    min: 2,
    max: 3,
    step: 1,
    def: paramsHatch.separation,
    color: "#576b9e",
    color2: "rgb(142, 167, 231)"
}); //  Will be reinitialized when image is loaded.
labelForContainerHatchSeparation.innerText = rsHatchSeparation.val;
rsHatchSeparation.onValueChange(async function () {
    labelForContainerHatchSeparation.innerText = rsHatchSeparation.val;
    if (imageIn == undefined) return;
    paramsHatch.separation = rsHatchSeparation.val;
    paramsHatch.atdh = await getArrToDrawHatch(paramsHatch);
    applyHatching(paramsHatch);
});

// Width factor slider.
const containerHatchLinew = document.getElementById("containerHatchLinew");
const labelForContainerHatchLinew = document.querySelector("[label-for=containerHatchLinew]");
var rsHatchLinewidth = new RangeSlider(containerHatchLinew, {
    title: "Width",
    min: 1,
    max: 15,
    def: paramsHatch.linew,
    step: 1,
    color: "#576b9e",
    color2: "rgb(142, 167, 231)"
});
labelForContainerHatchLinew.innerText = rsHatchLinewidth.val;
rsHatchLinewidth.onValueChange(function () {
    labelForContainerHatchLinew.innerText = rsHatchLinewidth.val;
    paramsHatch.linew = rsHatchLinewidth.val;
    applyHatching(paramsHatch);
});

// Sensitivity slider.
const containerHatchSensitivity = document.getElementById("containerHatchSensitivity");
const labelForContainerHatchSensitivity = document.querySelector("[label-for=containerHatchSensitivity]");
var rsHatchSensitivity = new RangeSlider(containerHatchSensitivity, {
    title: "Sensitivity",
    min: -250,
    max: 250,
    step: 1,
    def: paramsHatch.sensitivity,
    color: "#576b9e",
    color2: "rgb(142, 167, 231)"
});
labelForContainerHatchSensitivity.innerText = rsHatchSensitivity.val;
rsHatchSensitivity.onValueChange(async function () {
    labelForContainerHatchSensitivity.innerText = rsHatchSensitivity.val;
    if (imageIn == undefined) return;
    paramsHatch.sensitivity = rsHatchSensitivity.val;
    // let howmany = paramsHatch.buckets.length;
    paramsHatch.buckets = await get255Buckets(paramsHatch.buckets.length + 1, paramsHatch.sensitivity);
    paramsHatch.buckets.pop(); //  One more bucket is added for absolute white values but then removed so it is not hatched.
    paramsHatch.atdh = await getArrToDrawHatch(paramsHatch);
    applyHatching(paramsHatch);
});


async function applyHatching(params) {
    if (imageIn == undefined || paramsHatch.atdh == undefined) return;
    canvOut.imageSmoothingEnabled = false;
    canvOut.width = imageIn.width;
    canvOut.height = imageIn.height;
    ctxOut = canvOut.getContext("2d", {
        willReadFrequently: true
    });
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
                if (buck == -1) { //  It means it didn't found a bucket, which means a line should not be hatched (brightest value).
                    previousbucket = -1;
                    continue;
                }
                if (buck == previousbucket) { //  If the current value is the same as the previous one, it means the same line (hatch) continues.
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
                    linew: params.buckets.length - buck //  Buckets are arranged from 0 to 255 (decreasing light value).
                });
                previousbucket = buck;
                // objForSvg[params.direction].push({ x: x, y: y, lx: x, ly: y, linew: j });
                continue;



            }
        }
        let cleanArr = arr.filter(ar => { //  Remove lines in which there was no hatching at all.
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
    buckets: [
        [0, 51],
        [52, 102],
        [103, 153],
        [154, 204],
        [205, 255]
    ],
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
var rsCrosshSeparation = new RangeSlider(containerCrosshSeparation, {
    title: "Separation",
    min: 3,
    max: 4,
    def: paramsCrossh.separation,
    step: 1,
    color: "#576b9e",
    color2: "rgb(142, 167, 231)"
});
labelForContainerCrosshSeparation.innerText = rsCrosshSeparation.val;
rsCrosshSeparation.onValueChange(async function () {
    labelForContainerCrosshSeparation.innerText = rsCrosshSeparation.val;
    paramsCrossh.separation = rsCrosshSeparation.val;
    applyCrossh(paramsCrossh);
});

const containerCrosshWidth = document.getElementById("containerCrosshWidth");
const labelForContainerCrosshWidth = document.querySelector("[label-for=containerCrosshWidth]");
var rsCrosshWidth = new RangeSlider(containerCrosshWidth, {
    title: "Width",
    min: 1,
    max: 10,
    def: paramsCrossh.linew,
    step: 1,
    color: "#576b9e",
    color2: "rgb(142, 167, 231)"
});
labelForContainerCrosshWidth.innerText = rsCrosshWidth.val;
rsCrosshWidth.onValueChange(function () {
    labelForContainerCrosshWidth.innerText = rsCrosshWidth.val;
    paramsCrossh.linew = rsCrosshWidth.val;
    applyCrossh(paramsCrossh);
});

const containerCrosshSensitivity = document.getElementById("containerCrosshSensitivity");
const labelForContainerCrosshSensitivity = document.querySelector("[label-for=containerCrosshSensitivity]");
var rsCrosshSensitivity = new RangeSlider(containerCrosshSensitivity, {
    title: "Sensitivity",
    min: -254,
    max: 254,
    def: paramsCrossh.sensitivity,
    step: 1,
    color: "#576b9e",
    color2: "rgb(142, 167, 231)"
});
labelForContainerCrosshSensitivity.innerText = rsCrosshSensitivity.val;
rsCrosshSensitivity.onValueChange(async function () {
    labelForContainerCrosshSensitivity.innerText = rsCrosshSensitivity.val;
    if (imageIn == undefined) return;
    paramsCrossh.sensitivity = rsCrosshSensitivity.val;
    paramsCrossh.buckets = await get255Buckets(5, paramsCrossh.sensitivity);
    paramsCrossh.atch = await getArrToCrossh(paramsCrossh);
    applyCrossh(paramsCrossh);
});

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
            var atdh = await getArrToDrawHatch({
                direction,
                separation,
                buckets,
                sensitivity
            });
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
var rsGlyphDetail = new RangeSlider(containerGlyphDetail, {
    title: "Detail",
    min: 8,
    max: 20,
    step: 1,
    def: paramsGlyph.detail,
    color: "#576b9e",
    color2: "rgb(142, 167, 231)"
});
labelForContainerGlyphDetail.innerText = rsGlyphDetail.val;

const containerGlyphFontsize = document.getElementById("containerGlyphFontsize");
const labelForContainerGlyphFontsize = document.querySelector("[label-for=containerGlyphFontsize]");
var rsGlyphFontsize = new RangeSlider(containerGlyphFontsize, {
    title: "Font Size",
    min: 1.0,
    max: 20.0,
    step: 0.1,
    def: paramsGlyph.fontsize,
    color: "#576b9e",
    color2: "rgb(142, 167, 231)"
});
labelForContainerGlyphFontsize.innerText = rsGlyphFontsize.val;

async function applyGlyph(params) {
    if (imageIn == undefined) return;
    let canv0 = document.createElement("canvas");
    let c0 = canv0.getContext("2d", {
        willReadFrequently: true
    });
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

var imageInData;

async function onceImageLoads(inputFileEvent) {
    imageIn = await getLoadedImage(inputFileEvent);
    resetPxEdits(); //  Fills belong to the previous picture, even if the new one yields the same grid.
    resetOutZoom();
    SMALLEST_DIM = Math.min(imageIn.width, imageIn.height);
    RATIO = imageIn.height / imageIn.width;
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
    let ctxIn = canvIn.getContext("2d", {
        willReadFrequently: true
    });
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
    // paramsPxLevel.max = Math.floor(SMALLEST_DIM / 10);
    // paramsPxLevel.def = Math.floor(paramsPxLevel.max / 4);
    // rsPxLevel = new RangeSlider(containerPxLevel, paramsPxLevel);
    // labelForContainerPxLevel.innerText = rsPxLevel.val;
    // rsPxLevel.onslide = function () {
    //     // Since slider is re-created, onslide function has to be added, again.
    //     labelForContainerPxLevel.innerText = rsPxLevel.val;
    //     paramsPx.dimension = rsPxLevel.val;
    //     canv0 = getPixelatedCanvas(paramsPx);
    //     applyPixelation(canvOut, canv0, paramsPx);
    // }
    if (rgEffPixelate.checked) {
        onPxLevelChange();
    }

    // Grayscaling Effect
    if (rgEffGrays.checked) {
        applyGrayscaling(paramsGrays);
    }

    // For Hatching and Cross-hatching
    let newMax = parseInt(SMALLEST_DIM / 10);
    let newDef = parseInt(newMax / 4);

    //  Hatching Effect.
    containerHatchSeparation.innerHTML = ""; //  Avoid stacking another slider on top of the previous one.
    rsHatchSeparation = new RangeSlider(containerHatchSeparation, {
        title: "Separation",
        min: 2,
        max: newMax,
        step: 1,
        def: newDef,
        color: "#576b9e",
        color2: "rgb(142, 167, 231)"
    });
    paramsHatch.separation = rsHatchSeparation.val;
    labelForContainerHatchSeparation.innerText = rsHatchSeparation.val;
    rsHatchSeparation.onValueChange(async function () {
        labelForContainerHatchSeparation.innerText = rsHatchSeparation.val;
        paramsHatch.separation = rsHatchSeparation.val;
        paramsHatch.atdh = await getArrToDrawHatch(paramsHatch);
        applyHatching(paramsHatch);
    });
    if (rgEffHatching.checked) {
        paramsHatch.atdh = await getArrToDrawHatch(paramsHatch);
        applyHatching(paramsHatch);
    }

    //  Cross-hatching Effect.
    containerCrosshSeparation.innerHTML = ""; //  Avoid stacking another slider on top of the previous one.
    rsCrosshSeparation = new RangeSlider(containerCrosshSeparation, {
        title: "Separation",
        min: 3,
        max: newMax,
        step: 1,
        def: newDef,
        color: "#576b9e",
        color2: "rgb(142, 167, 231)"
    });
    labelForContainerCrosshSeparation.innerText = rsCrosshSeparation.val;
    rsCrosshSeparation.onValueChange(async function () {
        labelForContainerCrosshSeparation.innerText = rsCrosshSeparation.val;
        paramsCrossh.separation = rsCrosshSeparation.val;
        paramsCrossh.atch = await getArrToCrossh(paramsCrossh);
        applyCrossh(paramsCrossh);
    });
    paramsCrossh.separation = rsCrosshSeparation.val;
    if (rgEffCrossh.checked) {
        paramsCrossh.atch = await getArrToCrossh(paramsCrossh);
        applyCrossh(paramsCrossh);
    }
}

//  DOWNLOAD BUTTON
function downloadCanvas(canvas) {
    let link = document.createElement("a");
    link.download = getName("png");
    link.href = canvas.toDataURL();
    link.click();
}

//-- When Pixelate is active, canvOut is canv0 upscaled (plus an optional grid overlay) to
//   roughly match the original image's size; canv0 itself is the literal, un-upscaled result.
//   Ask which one the user actually wants instead of silently picking the upscaled one.
const bodyDiagDownloadSize = document.getElementById("diagDownloadSize");
const diagDownloadSize = new AutoDialog({
    dialog: bodyDiagDownloadSize,
    title: "Descargar imagen",
    ok: true,
    cancel: true
});
diagDownloadSize.onOk(() => downloadCanvas(canv0));
diagDownloadSize.onCancel(() => downloadCanvas(canvOut));

const dlDownload = document.getElementById("dlDownload");
dlDownload.addEventListener("click", () => {
    const canPickPixelatedSize = rgEffPixelate.checked && imageIn != undefined && canv0 != undefined && canv0.width > 0 && canv0.height > 0;
    if (canPickPixelatedSize) {
        diagDownloadSize.btnOk.innerText = `Tamaño literal (${canv0.width}×${canv0.height}px)`;
        diagDownloadSize.btnCancel.innerText = `Tamaño original (≈${canvOut.width}×${canvOut.height}px)`;
        diagDownloadSize.show();
        return;
    }
    downloadCanvas(canvOut);
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

//  Returns a debounced version of fn: it only runs after ms without new calls (keeps sliders responsive).
function debounceFn(fn, ms) {
    let timeout;
    return function (...args) {
        clearTimeout(timeout);
        timeout = setTimeout(() => fn(...args), ms);
    };
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

// DIALOGS


const bodyDiagInfo = document.getElementById("diagInfo");
const topbarBtnInfo = document.getElementById("topbarBtnInfo");
const diagInfo = new AutoDialog({
    dialog: bodyDiagInfo,
    title: "Info",
    trigger: topbarBtnInfo,
    ok: false,
    cancel: false
});

const bodyDiagContactme = document.getElementById("diagContactme");
const topbarBtnContactme = document.getElementById("topbarBtnContactme");
const diagContactme = new AutoDialog({
    dialog: bodyDiagContactme,
    title: "Contactarme",
    trigger: topbarBtnContactme,
    ok: false,
    cancel: false
});
topbarBtnContactme.addEventListener("click", () => {
    let body = bodyDiagContactme.querySelector(".body");
    let sel = window.getSelection();
    let range = new Range();
    range.selectNodeContents(body);
    sel.removeAllRanges();
    sel.addRange(range);
});