// CANVAS BACKGROUND
const canvBg = document.getElementById("canvBg");
const cbg = canvBg.getContext("2d");

canvBg.setAttribute("width", window.innerWidth);
canvBg.setAttribute("height", window.innerHeight);
cleanCanvBg();
window.addEventListener("resize", () => {
    canvBg.setAttribute("width", window.innerWidth);
    canvBg.setAttribute("height", window.innerHeight);
    cleanCanvBg();
    for (let i = 0; i < arrForce.length; i++) {
        const Force = arrForce[i];
        Force.bounce(cbg);
    }
});


class Vector {
    constructor(x, y, r, velx, vely) {
        this.x = x;
        this.y = y;
        this.r = r;
        this.velx = velx;
        this.vely = vely;
    }
    draw(ctx) {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.r, 0, 2 * Math.PI, false);
        ctx.fill();
    }
}

class Force {
    constructor(context) {
        this.ctx = context;
        // console.log(this.ctx.canvas);
        this.w = context.canvas.width;
        this.h = context.canvas.height;
    }
    bounce(vector) {
        vector.x += vector.velx;
        if (vector.x < 0) {
            vector.x = 0;
            vector.velx *= -1;
        }
        if (vector.x > this.w) {
            vector.x = this.w;
            vector.velx *= -1;
        }
        vector.y += vector.vely;
        if (vector.y < 0) {
            vector.y = 0;
            vector.vely *= -1;
        }
        if (vector.y > this.h) {
            vector.y = this.h;
            vector.vely *= -1;
        }
    }

    scrolldown(vector) {
        vector.y += Math.abs((vector.vely) * 10);
        if (vector.y >= this.h) vector.y = 0;
    }
    
    scrollup(vector) {
        vector.y -= Math.abs((vector.vely) * 10);
        if (vector.y <= 0) vector.y = this.h;
    }
}



var countVectors = 50;
var arrVectors = [];
var arrForce = [];

for (let i = 0; i < countVectors; i++) {
    let v = new Vector(
        randBetweenInt(0, canvBg.clientWidth),
        randBetweenInt(0, canvBg.height),
        randBetweenInt(2, 6),
        randBetweenInt(-3, 3, 0),
        randBetweenInt(-3, 3, 0)
    );
    // arrForce.push(new Force(v));
    arrVectors.push(v);
}

let go = true;
for (let i = 0; i < arrVectors.length; i++) {
    const v = arrVectors[i];
    v.draw(cbg);
}

window.onload = startthis;

var pointerX = 0;
var pointerY = 0;


function startthis() {
    cleanCanvBg();
    let f = new Force(cbg)
    if (go) {
        arrVectors.forEach(v => {
            f.bounce(v);
            v.draw(cbg);
        });
        window.requestAnimationFrame(startthis);
    }
}


function randBetweenInt(n1, n2, n0) {
    let n = parseInt((n2 - n1) * Math.random() + n1);
    if (n0 !== undefined) {
        while (n == n0) {
            n = parseInt((n2 - n1) * Math.random() + n1);
        }
    }
    return n;
}

function cleanCanvBg() {
    cbg.fillStyle = "#000000";
    cbg.fillRect(0, 0, canvBg.clientWidth, canvBg.height);
    cbg.fillStyle = "#FFFFFF";
}

// ---------

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

function throttle(fx, time) {
    let shouldwait = false;
    let tempArgs;
    const timedoutFx = () => {
        if (tempArgs == null) {
            shouldwait = false;
        } else {
            fx(...tempArgs);
            tempArgs = null;
            window.setTimeout(timedoutFx, time);
        }
    };
    return ((...args) => {
        if (shouldwait) {
            tempArgs = args;
            return;
        }
        fx(...args);
        shouldwait = true;
        window.setTimeout(timedoutFx, time);
    });
}

const throttledScrollPerct = throttle(() => {
    cleanCanvBg();

}, 1000);


var sp = 0;

document.addEventListener("scroll", () => {
    // throttledScrollPerct();
    cleanCanvBg();
    let down = scrolledDown();
    let f = new Force(cbg);

    for (let i = 0; i < arrVectors.length; i++) {
        const v = arrVectors[i];
        if (down) f.scrolldown(v);
        if (!down) f.scrollup(v);
        v.draw(cbg);
    }
    onScrolling();
});
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
                flap.style.boxShadow = "none";
            }

            // Setting the current flap on top of the others.
            let wrapFlap = arrWrapsFlap[j]
            wrapFlap.style.zIndex = arrWrapsFlap.length;
            // wrapFlap.style.transformOrigin = "center";
            wrapFlap.style.transform = `translate(-50%, 0) scale(1)`;

            let flap = wrapFlap.querySelector(".flap");
            flap.style.transform = `rotateX(0deg)`;
            flap.style.boxShadow = `inset 0 20px 50px -15px #FFFFFF, inset 0 -25px 30px 0px #000000`;

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
                let opacity = 1 - (zIndex / 4 - 0.2);
                flap.querySelector(".overlay").style.opacity = opacity;

                // Rotating flaps.
                let perct = rangeMatch(buck[1] - sp, 0, 0.25, 0.01, 0.99, 2);
                // 3 is an arbitrary fator.
                let angle = Math.min(parseInt((1 - sp) * 10 * (k + perct) * 3), 95);
                flap.style.transform = `rotateX(${angle}deg)`;
                flap.style.boxShadow = "none";
            }


            break;
        }
    }
}

var viewableHeight = document.documentElement.clientHeight || document.body.clientHeight;
var scrollHeight = document.documentElement.scrollHeight || document.body.scrollHeight;
var scrolledBody = scrollHeight - viewableHeight;

var currentScrollPerct = 0;

function scrolledDown() {
    let newPerct = getScrollPerct();
    let down = true;
    if (currentScrollPerct - newPerct < 0) {
        down = true;
    } else {
        down = false;
    }
    currentScrollPerct = newPerct;
    return down;
}

function getScrollPerct() {
    let scrollTop = document.documentElement.scrollTop || document.body.scrollTop;
    // let scrolledBody = (document.documentElement.scrollHeight || document.body.scrollHeight) - (document.documentElement.clientHeight || document.body.clientHeight);
    let perct = scrollTop / scrolledBody;
    return perct;
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