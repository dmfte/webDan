class RangeSlider {
    constructor(container, paramsOjb) {
        this.f;
        this.label = paramsOjb.label;
        this.min = Number(paramsOjb.min);
        this.max = Number(paramsOjb.max);
        this.step = Number(paramsOjb.step);
        this.max1 = this.max + this.step;
        this.def = Number(paramsOjb.def);
        this.prevVal = Number(paramsOjb.def);
        this.val;
        this.color1 = paramsOjb.color1 !== undefined ? paramsOjb.color1 : "rgb(45, 110, 115)";
        this.color2 = paramsOjb.color2 !== undefined ? paramsOjb.color2 : "rgb(120, 185, 200)";
        let colorBg = getAddedRGB(this.color1, -100);
        let colorFontLabel = getAddedRGB(this.color2, 0);
        let colorFontBtns = getAddedRGB(this.color1, -150);
        let colorBtns = getAddedRGB(this.color1, 30);
        let colorBtnsHover = getAddedRGB(this.color1, 50);

        this.el = {
            container: container,
            slider: document.createElement("div"),
            label: document.createElement("div"),
            minContainer: document.createElement("div"),
            min: document.createElement("div"),
            maxContainer: document.createElement("div"),
            max: document.createElement("div"),
            trackContainer: document.createElement("div"),
            track: document.createElement("div"),
            tooltip: document.createElement("div")
        };
        // ELEMENT'S CLASSES
        this.el.slider.classList.add("slider");
        this.el.label.classList.add("label");
        this.el.minContainer.classList.add("min-container");
        this.el.maxContainer.classList.add("max-container");
        this.el.trackContainer.classList.add("track-container");
        this.el.min.classList.add("min");
        this.el.max.classList.add("max");
        this.el.track.classList.add("track");
        this.el.tooltip.classList.add("tooltip");

        // ELEMENT'S TEXT
        this.el.label.innerText = `${this.label}:`;
        this.el.min.innerText = this.min.toFixed(getDecimalOrder(this.step));
        this.el.max.innerText = this.max.toFixed(getDecimalOrder(this.step));
        this.el.tooltip.innerText = this.max.toFixed(getDecimalOrder(this.step));

        // ELEMENT'S COLOR
        this.el.slider.style.backgroundColor = colorBg;
        this.el.label.style.color = colorFontLabel;
        this.el.min.style.backgroundColor = colorBtns;
        this.el.min.style.color = colorFontBtns;
        this.el.min.style.fontWeight = "bold";
        this.el.max.style.backgroundColor = colorBtns;
        this.el.max.style.color = colorFontBtns;
        this.el.max.style.fontWeight = "bold";

        // ELEENT'S OTHER STYLES

        // ELEMEN'S STRUCTURE
        this.el.track.appendChild(this.el.tooltip);
        this.el.trackContainer.appendChild(this.el.track);
        this.el.minContainer.appendChild(this.el.min);
        this.el.maxContainer.appendChild(this.el.max);
        this.el.slider.appendChild(this.el.label);
        this.el.slider.appendChild(this.el.minContainer);
        this.el.slider.appendChild(this.el.maxContainer);
        this.el.slider.appendChild(this.el.trackContainer);
        this.el.container.innerHTML = "";
        this.el.container.appendChild(this.el.slider);

        // OTHER STYLES
        // transition: 300ms ease-in-out;
        // this.el.container.style.transition = "300ms ease-in-out";

        // let majrW = this.el.min.scrollWidth > this.el.max.scrollWidth ? this.el.min.scrollWidth : this.el.max.scrollWidth;


        // let majrW = Math.max(this.el.min.scrollWidth, this.el.max.scrollWidth);
        // let sidesW = majrW * 1.6;
        // this.el.min.style.width = `${sidesW}px`;
        // this.el.max.style.width = `${sidesW}px`;
        // this.el.min.style.padding = "0 0.3rem";
        // this.el.max.style.padding = "0 0.3rem";

        // this.el.slider.style.gridTemplateColumns = `${sidesW}px auto ${sidesW}px`;

        // this.el.tooltip.style.width = `${this.el.tooltip.scrollWidth}px`;
        // this.el.tooltip.style.height = `${this.el.tooltip.scrollHeight * 0.8}px`;

        // APPLY DEFAULT VALUE IF ANY.
        // console.log(`max:${this.max}, min:${this.min}, def:${this.def}`);
        if (this.def <= this.max && this.def >= this.min) {
            let perct = (this.def - this.min) / (this.max1 - this.min);
            // this.val = getStepValueFromPerct(perct, this);
            this.val = this.def;
            setValuesInTrack(this.val, this);
            this.prevVal = this.val;
        } else {
            this.val = this.min;
            setValuesInTrack(this.val, this);
            this.prevVal = this.min;
        };
        // LISTENERS
        let thisOnClicking = onClicking.bind(this);
        this.el.track.addEventListener("pointerdown", thisOnClicking);

        let thisOnMoving = onMoving.bind(this);
        this.el.track.addEventListener("pointermove", thisOnMoving);

        this.el.track.addEventListener("pointerenter", () => {
            this.el.tooltip.style.display = "flex";
            this.el.tooltip.style.opacity = 1;
        });
        this.el.track.addEventListener("pointerleave", () => {
            this.el.tooltip.style.display = "none";
        });
        // Min and Max buttons
        let thisStepDown = this.stepDown.bind(this);
        this.el.min.addEventListener("pointerdown", thisStepDown);
        this.el.min.addEventListener("pointerdown", () => {
            this.el.min.style.scale = 0.9;
        });
        this.el.min.addEventListener("pointerup", () => {
            this.el.min.style.scale = 1;
        });
        this.el.min.addEventListener("pointerenter", () => {
            this.el.min.style.backgroundColor = colorBtnsHover;
        });
        this.el.min.addEventListener("pointerleave", () => {
            this.el.min.style.backgroundColor = colorBtns;
        });

        let thisStepUp = this.stepUp.bind(this);
        this.el.max.addEventListener("pointerdown", thisStepUp);
        this.el.max.addEventListener("pointerdown", () => {
            this.el.max.style.scale = 0.9;
        });
        this.el.max.addEventListener("pointerup", () => {
            this.el.max.style.scale = 1;
        });
        this.el.max.addEventListener("pointerenter", () => {
            this.el.max.style.backgroundColor = colorBtnsHover;
        });
        this.el.max.addEventListener("pointerleave", () => {
            this.el.max.style.backgroundColor = colorBtns;
        });
    }
    onSliding(f) { //  Function to run as the slider changes.
        this.f = f;
    }
    stepDown() {
        if (this.val > this.min) {
            this.val -= this.step;
            setValuesInTrack(this.val, this);
            if (this.f !== undefined) this.f();
            this.prevVal = this.val;
        }
    }
    stepUp() {
        if (this.val < this.max) {
            this.val += this.step;
            setValuesInTrack(this.val, this);
            if (this.f !== undefined) this.f();
            this.prevVal = this.val;
        }
    }
}

function onClicking(evt) {
    let perct = getTrackPositionPerct(evt);
    if (perct <= 1 && perct >= 0) {
        this.el.track.setPointerCapture(evt.pointerId);
        this.val = getStepValueFromPerct(perct, this);
        if (this.val !== this.prevVal) {
            setValuesInTrack(this.val, this);
            if (this.f !== undefined) this.f();
            this.prevVal = this.val;
        };

        let thisOnDragging = onDragging.bind(this); //  Otherwise, the "this" on OnMove() would be the event's this instead of the class' this.
        this.el.track.addEventListener("pointermove", thisOnDragging);
        this.el.track.addEventListener("pointerup", () => {
            this.el.track.removeEventListener("pointermove", thisOnDragging);
            this.el.track.releasePointerCapture(evt.pointerId);
        }, {
            once: true
        });
    }
}

function setValuesInTrack(num, that) {
    if (num <= that.max && num >= that.min) {
        let displayNum = num.toFixed(getDecimalOrder(that.step));
        let eachPerct = parseInt(that.step * 100 / (that.max1 - that.min));
        let perct = (num - that.min) / (that.max1 - that.min);
        let perct100 = parseInt(perct * 100);
        that.el.track.style.background = `linear-gradient(90deg, ${that.color1} ${perct100 + eachPerct}%, ${that.color2} ${perct100 + eachPerct + 2}%)`;
        that.el.tooltip.style.left = `${perct100}%`;
        that.el.tooltip.innerText = displayNum;
        that.el.label.innerText = `${that.label}: ${displayNum}`;
    }
}

function onMoving(evt) { //  To be used when pointer is hovering the track.
    let perct = getTrackPositionPerct(evt);
    if (perct <= 1 && perct >= 0) {
        let val = getStepValueFromPerct(perct, this);
        this.el.tooltip.style.left = `${perct * 100}%`;
        this.el.tooltip.innerText = (val).toFixed(getDecimalOrder(this.step));
    }
}

function onDragging(evt) { //  To be used when pointer is being clicked and moved.
    let perct = getTrackPositionPerct(evt);
    if (perct <= 1 && perct >= 0) {
        this.val = getStepValueFromPerct(perct, this);
        if (this.val !== this.prevVal) {
            setValuesInTrack(this.val, this);
            if (this.f !== undefined) this.f();
            this.prevVal = this.val;
        }
    }
}


function getTrackPositionPerct(evt) {
    let track = evt.target.closest(".slider").querySelector(".track");
    let trackW = parseInt(window.getComputedStyle(track).width);
    let rectL = track.getBoundingClientRect().left;
    let clientX = evt.clientX;
    let relPosX = clientX - rectL;
    let perct = relPosX / trackW;
    return Number(perct.toFixed(2));
}

function getStepValueFromPerct(perct, that) {
    // if (perct <= 0) return that.min;
    // if (perct >= 1) return that.max;
    let range = that.max1 - that.min;
    // let netRangeVal = perct * range + that.min;

    let newVal = perct * range + that.min;
    let newStepValue = getSteppedValue(newVal, that.step);
    // let newStepValue = getSteppedValue(netRangeVal, that.step);
    if (newStepValue > that.max) return newStepValue - that.step;
    if (newStepValue < that.min) return newStepValue + that.step;
    return newStepValue;
}

function getSteppedValue(num, step) {
    let steps = Math.floor(num / step);
    stepNetVal = steps * step;
    let gdo = getDecimalOrder(step);
    return forceDecimals(stepNetVal, gdo);
}

function forceDecimals(num, decimalOrder) {
    let hundrFactor = 1;
    for (let i = 0; i < decimalOrder; i++) {
        hundrFactor = hundrFactor * 10;
    }
    return parseInt(num * hundrFactor) / hundrFactor;
}

function getDecimalOrder(num) { //  Given a number, how many decimals it has.
    let arr = (num).toString().split(".");
    return (arr.length <= 1) ? 0 : (num).toString().split(".")[1].length;
}

function getRGBcolorObj(txt) {
    let element = document.createElement("div");
    element.style.backgroundColor = txt;
    element.style.display = "none";
    document.body.appendChild(element);
    let rgbStr = window.getComputedStyle(element).backgroundColor;
    // rgba(255, 255, 255, 0.7)
    document.body.removeChild(element);
    rgb = rgbStr.split(",");
    if (rgb.length > 3) {
        rgb.splice(3, rgb.length);
        // ['rgba(255', ' 255', ' 255']
    };
    // ['rgb(255', ' 255', ' 255)']

    let regexParenthI = /\)/;
    let parenthI = rgb[0].match(regexParenthI).index;
    // 'rgba(255'
    rgb[0] = rgb[0].split("");
    rgb[0].splice(0, parenthI + 1);
    rgb[0] = parseInt(rgb[0].join(""));

    // ' 255'
    rgb[1] = parseInt(rgb[1]);

    let regexParenthF = /\)/;
    if (rgb[2].match(regexParenthF) !== null) {
        // '  255)'
        let parenthF = rgb[2].match(regexParenthF).index;
        rgb[2] = rgb[2].split("");
        rgb[2].splice(parenthF, rgb[2].length);
        rgb[2] = parseInt(rgb[2].join(""));
    } else {
        // ' 255'
        rgb[2] = parseInt(rgb[2]);
    }
    return {
        r: rgb[0],
        g: rgb[1],
        b: rgb[2]
    };
}


function getAddedRGB(colorStr, int) {
    let obj = getRGBcolorObj(colorStr);
    obj.r = add255Range(obj.r, int);
    obj.g = add255Range(obj.g, int);
    obj.b = add255Range(obj.b, int);
    return `rgb(${obj.r}, ${obj.g}, ${obj.b})`;
}

function add255Range(num, addend) {
    if (num + addend >= 0) {
        if (num + addend <= 255) {
            return num + addend;
        } else {
            return 255;
        }
    } else {
        return 0;
    }
}