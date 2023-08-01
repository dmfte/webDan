var arrWrapsFlap = document.querySelectorAll(".wrap-flap");
var bucket = 1 / arrWrapsFlap.length;
var arrBucks = [];

for (let i = 0; i < arrWrapsFlap.length; i++) {
    arrBucks.push([i * bucket, ((i + 1) * bucket) - 0.01]);
}

arrBucks[arrBucks.length - 1][1] = 1;

// This was when sliders were added to test dimensions
// const contPadding = document.getElementById("padding");
// const contHeight = document.getElementById("height");
// const contAngle = document.getElementById("angle");

// var rsPadding = new RangeSlider(contPadding, { label: "padding", min: 0, max: 300, step: 1, def: 60 });
// var rsHeight = new RangeSlider(contHeight, { label: "height", min: 5, max: 800, step: 1, def: 400 });
// var rsAngle = new RangeSlider(contAngle, { label: "angle", min: 1, max: 10, step: 0.5, def: 3 });

// rsPadding.onSliding(updateDim);
// rsHeight.onSliding(updateDim);
// rsAngle.onSliding(onScrolling);

// function updateDim() {
//     let flappableArea = window.innerHeight - (rsPadding.val * 2);
//     let leftover = flappableArea - rsHeight.val;
//     let overflap = leftover / (arrWrapsFlap.length - 1);
//     for (let i = 0; i < arrWrapsFlap.length; i++) {
//         const wrap = arrWrapsFlap[i];
//         wrap.style.top = `${rsPadding.val + (overflap * i)}px`;
//         wrap.style.height = `${rsHeight.val}px`;
//     }
// }

// updateDim();

var sp = 0;

document.addEventListener("scroll", onScrolling);
onScrolling();

function onScrolling() {

    sp = getScrollPerct() || 0;
    for (let j = 0; j < arrBucks.length; j++) {
        const buck = arrBucks[j];
        if (sp >= buck[0] && sp <= buck[1]) {
            for (let k = 1; k <= j; k++) {
                let index = j - k;
                let wrapFlap = arrWrapsFlap[index];
                let flap = wrapFlap.querySelector(".flap");
                flap.style.transformOrigin = "top";

                // Setting the previous flaps behind each other.
                let zIndex = arrWrapsFlap.length - k;
                wrapFlap.style.zIndex = zIndex;

                // Changing scale.
                let scale = 1 - ((k + 1) / 10);
                wrapFlap.style.transformOrigin = "top";
                wrapFlap.style.transform = `translate(-50%, -${zIndex * 5}%) scale(${scale})`;

                // Changing opacity on overlay.
                let opacity = 1 - (zIndex / 4 - 0.2);
                flap.querySelector(".overlay").style.opacity = opacity;

                // Rotating flaps.
                let perct = rangeMatch(sp - buck[0], 0, 0.25, 0.01, 0.99, 2);
                // 3 is an arbitrary fator.
                let angle = Math.min(parseInt(sp * 10 * (k + perct) * 3), 70);
                flap.style.transform = `rotateX(-${angle}deg)`;
            }

            // Setting the current flap on top of the others.
            let wrapFlap = arrWrapsFlap[j]
            wrapFlap.style.zIndex = arrWrapsFlap.length;
            // wrapFlap.style.transformOrigin = "center";
            wrapFlap.style.transform = `translate(-50%, 0) scale(1)`;

            let flap = wrapFlap.querySelector(".flap");
            flap.style.transform = `rotateX(0deg)`;

            flap.querySelector(".overlay").style.opacity = 0;

            for (let k = 1; k <= arrWrapsFlap.length - 1 - j; k++) {
                let index = j + k;
                let wrapFlap = arrWrapsFlap[index];
                let flap = wrapFlap.querySelector(".flap");
                flap.style.transformOrigin = "bottom";

                // Setting the next flaps behind the previous ones.
                let zIndex = arrWrapsFlap.length - k
                wrapFlap.style.zIndex = zIndex;

                // Changing scale.
                let scale = 1 - ((k + 1) / 10);
                wrapFlap.style.transformOrigin = "bottom";
                wrapFlap.style.transform = `translate(-50%, ${zIndex * 5}%) scale(${scale})`;

                // Changing opacity on overlay.
                let opacity = 1- (zIndex / 4 - 0.2);
                flap.querySelector(".overlay").style.opacity = opacity;

                // Rotating flaps.
                let perct = rangeMatch(buck[1] - sp, 0, 0.25, 0.01, 0.99, 2);
                // 3 is an arbitrary fator.
                let angle = Math.min(parseInt((1 - sp) * 10 * (k + perct) * 3), 95);
                flap.style.transform = `rotateX(${angle}deg)`;
            }


            break;
        }
    }
}

var viewableHeight = document.documentElement.clientHeight || document.body.clientHeight;
var scrollHeight = document.documentElement.scrollHeight || document.body.scrollHeight;
var scrolledBody = scrollHeight - viewableHeight;
function getScrollPerct() {
    let scrollTop = document.documentElement.scrollTop || document.body.scrollTop;
    // let scrolledBody = (document.documentElement.scrollHeight || document.body.scrollHeight) - (document.documentElement.clientHeight || document.body.clientHeight);
    return (scrollTop / scrolledBody);
}

function rangeMatch(value, valueMin, valueMax, closeToMin, closeToMax, dec) {
    //  Returns a number betwen closetoMin and closeToMax (both included), 
    //  depending on how close is value to valueMin or valueMax(both included), 
    //  with dec being the  amount of decimals (presition).
    if (value < valueMin || value > valueMax) {
        console.log("Value outside of the min-max range.");
        return value;
    }
    if (valueMin == valueMax) {
        console.log("Min and Max values must be a range.");
        return value;
    }
    if (closeToMin == closeToMax) {
        return closeToMin;
    }
    let str = "0.";
    for (let i = 0; i < dec - 1; i++) {
        str += "0";
    }
    str += "1";
    let lowest = parseFloat(str).toFixed(dec);
    let vmi = valueMin - lowest;
    let vma = valueMax - lowest;
    let cmi = closeToMin - lowest;
    let cma = closeToMax - lowest;

    let min = (vmi < vma ? vmi : vma);
    let max = vmi > vma ? vmi : vma;
    let d = ((cmi - min) * (cma - cmi)) / (cma - cmi - max + min);
    return Number((cmi + (d * value) / (d - (cmi - min))).toFixed(dec));
}