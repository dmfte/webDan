
var arrWrapsFlap = document.querySelectorAll(".wrap-flap");
var bucket = 1 / arrWrapsFlap.length;
var arrBucks = [];
for (let i = 0; i < arrWrapsFlap.length; i++) {
    arrBucks.push([i * bucket, (i + 1) * bucket]);
}

document.addEventListener("scroll", () => {
    sp = getScrollPerct();
    for (let j = 0; j < arrBucks.length; j++) {
        const buck = arrBucks[j];
        if (sp >= buck[0] && sp < buck[1]) {
            for (let k = 1; k <= j; k++) {
                let index = j - k;
                let wrapFlap = arrWrapsFlap[index];
                let flap = wrapFlap.querySelector(".flap");
                flap.style.transformOrigin = "top";

                // Changing scale.
                let scale = 1 - ((k+1) / 10);
                wrapFlap.style.transformOrigin = "top";
                wrapFlap.style.transform = `translate(-50%, 0) scale(${scale})`;

                // Setting the previous flaps behind each other.
                let zIndex = arrWrapsFlap.length - k;
                wrapFlap.style.zIndex = zIndex;

                // Rotating flaps.
                let perct = rangeMatch(sp - buck[0], 0, 0.25, 0.01, 0.99, 2);
                let angle = Math.min(parseInt((sp * 25 * (k + perct)) * 1.5), 95);
                flap.style.transform = `rotateX(-${angle}deg)`;
            }

            // Setting the current flap on top of the others.
            let wrapFlap = arrWrapsFlap[j]
            wrapFlap.style.zIndex = arrWrapsFlap.length;
            // wrapFlap.style.transformOrigin = "center";
            wrapFlap.style.transform = `translate(-50%, 0) scale(1)`;

            let flap = wrapFlap.querySelector(".flap");
            flap.style.transform = `rotateX(0deg)`;

            for (let k = 1; k <= arrWrapsFlap.length - 1 - j; k++) {
                let index = j + k;
                let wrapFlap = arrWrapsFlap[index];
                let flap = wrapFlap.querySelector(".flap");
                flap.style.transformOrigin = "bottom";

                // Changing scale.
                let scale = 1 - ((k+1) / 10);
                wrapFlap.style.transformOrigin = "bottom";
                wrapFlap.style.transform = `translate(-50%, 0) scale(${scale})`;

                // Setting the next flaps behind the previous ones.
                let zIndex = arrWrapsFlap.length - k
                wrapFlap.style.zIndex = zIndex;

                // Rotating flaps.
                let perct = rangeMatch(buck[1] - sp, 0, 0.25, 0.01, 0.99, 2);
                let angle = Math.min(parseInt(((1 - sp) * 25 * (k + perct)) * 1.5), 95);
                flap.style.transform = `rotateX(${angle}deg)`;
            }


            break;
        }
    }

});

var viewableHeight = document.documentElement.clientHeight || document.body.clientHeight;
var scrollHeight = document.documentElement.scrollHeight || document.body.scrollHeight;
var scrolledBody = scrollHeight - viewableHeight;
function getScrollPerct() {
    let scrollTop = document.documentElement.scrollTop || document.body.scrollTop;
    // let scrolledBody = (document.documentElement.scrollHeight || document.body.scrollHeight) - (document.documentElement.clientHeight || document.body.clientHeight);
    return (scrollTop / scrolledBody);
}

// const contFlaps = document.querySelector(".cont.flaps");
// const contflapsStyle = window.getComputedStyle(contFlaps);
// var overflapArea = viewableHeight - parseInt(contflapsStyle.paddingTop) - parseInt(contflapsStyle.paddingBottom);
// var eachFlapArea = overflapArea / (arrWrapsFlap.length * 2);
// for (let i = 0; i < arrWrapsFlap.length; i++) {
//     const wrapper = arrWrapsFlap[i];
//     wrapper.style.top = `${parseInt(contflapsStyle.paddingTop) + eachFlapArea * i}px`;
//     console.log(viewableHeight, overflapArea, eachFlapArea);
// }

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