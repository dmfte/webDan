//  It takes a container element object and a parameter object and returns an instance.
//  Slider will take up 100% of width and height of container element.
// parameters {
// title: String text with the title.
// min: Number minimum.
// max: Number maximum.
// step: Number increment.
// def: Number default value. If outside the min-max range, it will take the minimum.
// color1: String color of the filled bar in slider, any format.
// color2: String color of the empty bar in slider, any format.
// vert: Boolean. True for a vertical slider. False by default.
// }
//  Use 'instance.onslide =' to define the function to run everytime the value changes. No parameters are passed.
//  Use 'instance.el.<element> to select an element, say, to assign styles: title, min, track, max, tolltip, tooltipspan (tooltip text).
//  To change font, change it to the container element. If font size is assigned via JS, do it before instanciating.


class RangeSlider {
    constructor(container, { title = "", min = new Number(), max = new Number(), step = new Number(), def = new Number, color1 = "rgb(116,116,231)", color2 = "rgba(90, 179, 211)", vert = false }) {
        this.onslide;
        this.parent = container;
        this.title = title;
        this.min = min;
        this.max = max;
        this.step = step;
        // this.def = (def == undefined) ? this.min : def;
        this.def = (def > this.max) ? this.max : (def < this.min) ? this.min : def;
        this.val = this.def;
        // this.color1 = (params.color1 == undefined) ? "rgb(116,116,231)" : params.color1;
        this.color1 = color1;
        this.color1Dark = addToRgb(this.color1, -60);  //  Track start.
        this.color1Darkest = addToRgb(this.color1, -100);  // Background
        this.color1Light = addToRgb(this.color1, 100);
        this.color2 = color2;
        this.color2Dark = addToRgb(this.color2, -60);  //  Track end.
        this.color2Darkest = addToRgb(this.color2, -110);  // Min, Max font. 
        this.color2Light = addToRgb(this.color2, 100);  //  Min, Max bg.
        this.color2Lightest = addToRgb(this.color2, 135);  //  Title, tooltip. Min, Max :active.
        this.vert = vert;
        this.setBackgroundWithPerct = this.setBackgroundWithPerct.bind(this);
        this.on_pointerdrag = this.on_pointerdrag.bind(this);
        this.getValueFromPerct = this.getValueFromPerct.bind(this);
        this.positionTooltip = this.positionTooltip.bind(this);
        this.getPerctFromValue = this.getPerctFromValue.bind(this);

        // Elements creation:
        this.el = {
            container: document.createElement("div"),
            title: document.createElement("div"),
            min: document.createElement("div"),
            max: document.createElement("div"),
            containerTrack: document.createElement("div"),
            track: document.createElement("div"),
            tooltip: document.createElement("div"),
            tooltipspan: document.createElement("span")
        }

        // Elements structure
        this.el.tooltip.appendChild(this.el.tooltipspan);
        this.el.track.appendChild(this.el.tooltip);
        this.el.containerTrack.appendChild(this.el.track);
        this.el.container.appendChild(this.el.title);
        this.el.container.appendChild(this.el.min);
        this.el.container.appendChild(this.el.max);
        this.el.container.appendChild(this.el.containerTrack);

        this.parent.innerHTML = "";
        this.parent.appendChild(this.el.container);

        // Elements styles and defaults:
        this.el.container.style.position = "relative";
        this.el.container.style.backgroundColor = this.color1Darkest;
        this.el.container.style.width = "100%";
        this.el.container.style.height = "100%";
        this.el.container.style.display = "grid";
        this.el.container.style.padding = "0.5em 0.3em 0.2em";
        this.el.container.style.gridTemplateColumns = (this.vert) ? "2fr 5fr" : "1fr 9fr 1fr";
        this.el.container.style.gridTemplateRows = (this.vert) ? "1fr 12fr 1fr" : "2fr 3fr";
        this.el.container.style.gridTemplateAreas = (this.vert) ? "'title max' 'title track' 'title min'" : "'title title title' 'min track max'";

        this.el.title.classList.add("rs-title");
        // this.el.title.style.fontSize = "0.9em";
        this.el.title.innerText = `${this.title}: ${this.def}`;
        this.el.title.style.writingMode = (this.vert) ? "vertical-lr" : "inherit";
        this.el.title.style.transformOrigin = "center center";
        this.el.title.style.rotate = (this.vert) ? "180deg" : "0";
        this.el.title.style.color = this.color2Lightest;
        this.el.title.style.gridArea = "title";
        this.el.title.style.display = "flex";
        this.el.title.style.justifyContent = "center";
        this.el.title.style.alignItems = "center";
        this.el.title.style.userSelect = "none";

        this.el.containerTrack.style.position = "relative";
        this.el.containerTrack.style.gridArea = "track";
        this.el.containerTrack.style.display = "flex";
        this.el.containerTrack.style.alignItems = "center";
        this.el.containerTrack.style.justifyContent = "center";
        // this.el.containerTrack.style.padding = (this.vert) ? "0 0.2em" : "0.2em 0";

        this.el.track.classList.add("rs-track");
        this.el.track.style.position = "relative";
        this.el.track.style.width = "100%";
        this.el.track.style.height = "100%";
        this.el.track.style.borderWidth = "0";
        this.el.track.style.overflow = "visible";
        this.el.track.style.userSelect = "none";
        this.el.track.style.touchAction ="none"

        let pfv = this.getPerctFromValue(this.def);
        this.setBackgroundWithPerct(pfv);

        this.el.tooltip.style.position = "absolute";
        this.el.tooltip.style.top = (this.vert) ? "unset" : "-40%";
        this.el.tooltip.style.left = (this.vert) ? "-80%" : "unset";
        this.el.tooltip.style.backgroundColor = this.color2Lightest;
        this.el.tooltip.style.width = "2em";
        this.el.tooltip.style.height = "2em";
        this.el.tooltip.style.padding = "0.3em";
        this.el.tooltip.style.display = "flex";
        this.el.tooltip.style.justifyContent = "center";
        this.el.tooltip.style.alignItems = "center";
        this.el.tooltip.style.userSelect = "none";
        this.el.tooltip.style.borderRadius = (this.vert) ? "50% 0 50% 50%" : "50% 50% 0 50%";
        this.el.tooltip.style.rotate = "45deg";
        this.el.tooltip.style.visibility = "hidden";

        this.el.tooltipspan.style.display = "inline-block";
        this.el.tooltipspan.style.rotate = "-45deg";
        this.el.tooltipspan.innerText = this.def;
        let tooltipW = parseFloat(window.getComputedStyle(this.el.tooltip).width);
        let tooltipH = parseFloat(window.getComputedStyle(this.el.tooltip).height);
        this.tooltipDiagonal = parseInt(Math.sqrt(tooltipW ** 2 + tooltipH ** 2)) - 12;  //  Will be used in positionTooltip().
        let mfs = parseFloat(getMaxFontsize(this.tooltipDiagonal, this.el.tooltipspan.innerText));
        let tooltipFontsize = minMax(mfs, 0.4, 1);
        this.el.tooltipspan.style.fontSize = `${tooltipFontsize}em`;

        this.el.max.classList.add("rs-max");
        this.el.max.innerText = this.max;
        this.el.max.style.writingMode = (this.vert) ? "vertical-lr" : "inherit";
        this.el.max.style.transformOrigin = "center center";
        this.el.max.style.rotate = (this.vert) ? "180deg" : "0";
        // let elementMaxW = parseFloat(window.getComputedStyle(this.el.max).width);
        // let maxFontS = getMaxFontsize(elementMaxW * 0.8, this.max);
        // this.el.max.style.fontSize = maxFontS;
        this.el.max.style.overflow = "hidden";
        this.el.max.style.width = (this.vert) ? "unset" : "100%";
        this.el.max.style.height = (this.vert) ? "100%" : "unset";
        this.el.max.style.gridArea = "max";
        this.el.max.style.backgroundColor = this.color2Light;
        this.el.max.style.color = this.color1Dark;
        this.el.max.style.border = "none";
        this.el.max.style.borderRadius = (this.vert) ? "0 0 50% 50%" : "0 50% 50% 0";
        this.el.max.style.margin = (this.vert) ? "0.1em 0.2em 0.1em" : "0 0 0 0.1em";
        this.el.max.style.padding = (this.vert) ? "0.1em 0.2em 0.4em 0.2em" : "0.2em 0 0.2em 0.2em";
        this.el.max.style.display = "flex";
        this.el.max.style.justifyContent = "flex-start";
        this.el.max.style.alignItems = "center";
        this.el.max.style.cursor = "pointer";
        this.el.max.style.userSelect = "none";

        this.el.max.addEventListener("pointerdown", () => {
            this.el.max.style.scale = "0.9";
            this.el.max.style.backgroundColor = this.color2Lightest;
            this.el.max.addEventListener("pointerup", () => {
                this.el.max.style.scale = "1";
                this.el.max.style.backgroundColor = this.color2Light;
            });
        });

        this.el.min.innerText = this.min;

        this.el.min.classList.add("rs-min");
        this.el.min.style.gridArea = "min";
        this.el.min.style.writingMode = (this.vert) ? "vertical-lr" : "inherit";
        this.el.min.style.transformOrigin = "center center";
        this.el.min.style.rotate = (this.vert) ? "180deg" : "0";
        // let elementMinW = parseFloat(window.getComputedStyle(this.el.min).width);
        // let minFontS = getMaxFontsize(elementMinW * 0.8, this.min);
        // this.el.min.style.fontSize = minFontS;
        this.el.min.style.overflow = "hidden";
        // this.el.min.style.width = (this.vert) ? "unset" : "100%";
        this.el.min.style.height = (this.vert) ? "100%" : "unset";
        this.el.min.style.backgroundColor = this.color2Light;
        this.el.max.style.color = this.color2Darkest;
        this.el.min.style.borderRadius = (this.vert) ? "50% 50% 0 0" : "50% 0 0 50%";
        this.el.min.style.flex = "1";
        this.el.min.style.margin = (this.vert) ? "0.1em 0.2em 0.1em" : "0 0.1em 0 0";
        // this.el.min.style.marginRight = "5px";
        this.el.min.style.padding = (this.vert) ? "0.4em 0.2em 0.1em 0.2em" : "0.2em 0.2em 0.2em 0";
        this.el.min.style.display = "flex";
        this.el.min.style.justifyContent = "flex-end";
        this.el.min.style.alignItems = "center";
        this.el.min.style.cursor = "pointer";
        this.el.min.style.userSelect = "none";

        this.el.min.addEventListener("pointerdown", () => {
            this.el.min.style.scale = "0.9";
            this.el.min.style.backgroundColor = this.color2Lightest;
            this.el.min.addEventListener("pointerup", () => {
                this.el.min.style.scale = "1";
                this.el.min.style.backgroundColor = this.color2Light;
            });
        });

        //  Listeners.

        this.el.track.addEventListener("pointerdown", (evtDown) => {
            this.on_pointerdrag(evtDown);
            this.el.track.addEventListener("pointermove", this.on_pointerdrag);
            this.el.track.addEventListener("pointerup", (evtUp) => {
                this.el.track.removeEventListener("pointermove", this.on_pointerdrag);
                this.el.track.releasePointerCapture(evtUp.id)
            }, { once: true });
        });

        this.el.track.addEventListener("pointermove", (evtMove) => {
            this.el.tooltip.style.visibility = "visible";
            this.positionTooltip(evtMove);
            this.el.track.addEventListener("pointerleave", () => {
                this.el.tooltip.style.visibility = "hidden";
            });
        });

        this.el.min.addEventListener("click", () => {
            let oldval = this.val;
            this.val = Math.max(this.min, this.val - this.step);
            let pfv = this.getPerctFromValue(this.val);
            this.setBackgroundWithPerct(pfv);
            this.el.title.innerText = `${this.title}: ${this.val}`;
            if (this.val != oldval) {
                if (this.onslide !== undefined) this.onslide();
            }
        });

        this.el.max.addEventListener("click", () => {
            let oldval = this.val;
            this.val = Math.min(this.max, this.val + this.step);
            let pfv = this.getPerctFromValue(this.val);
            this.setBackgroundWithPerct(pfv);
            this.el.title.innerText = `${this.title}: ${this.val}`;
            if (this.val != oldval) {
                if (this.onslide !== undefined) this.onslide();
            }
        });
    }

    setBackgroundWithPerct(pfexy) {
        let deg = this.vert ? '0' : '90';
        let perct = this.vert ? pfexy.perctV : pfexy.perctH;
        this.el.track.style.background = `linear-gradient(${deg}deg, ${this.color1Dark} 0%, ${this.color1} ${perct}%, ${this.color2} ${perct + 2}%, ${this.color2Dark} 100%)`;
    }

    getPerctFromXyObj(evt, elem) {
        let elementBCR = elem.getBoundingClientRect();
        // Horizontal percent clicked.
        let perctFloatH = 100 * (evt.x - elementBCR.left) / elementBCR.width;
        let trimH = Number(perctFloatH.toFixed(2));
        let perctH = minMax(trimH, 0, 100);
        // Vertical percent cilcked.
        let perctFloatV = 100 * (elementBCR.bottom - evt.y) / elementBCR.height;
        let trimV = Number(perctFloatV.toFixed(2));
        let perctV = minMax(trimV, 0, 100);
        return { perctH, perctV };
    }

    getValueFromPerct(perct) {
        //  Given that the percent is already limited to 0 and 100.
        let range = this.max - this.min + this.step;
        let valueFloat = this.min + (range * perct / 100);
        let valueStepped = Math.floor(valueFloat / this.step) * this.step;
        let valueRanged = minMax(valueStepped, this.min, this.max);
        return valueRanged;
    }

    getPerctFromValue(val) {
        let range = this.max - this.min;
        let interval = this.val - this.min;
        let defaultPerct = 100 * (interval / range);
        return { perctH: defaultPerct, perctV: defaultPerct };  //  Percent from x and y.
    }

    on_pointerdrag(evtMove) {  //  Also on click.
        let oldval = this.val;
        this.el.track.setPointerCapture(evtMove.id);  //  Will be removed when used in the pointermove listener.
        // Set background gradient.
        let pfexy = this.getPerctFromXyObj(evtMove, this.el.track);
        this.setBackgroundWithPerct(pfexy);
        // Set value to the title.
        this.val = (this.vert) ? this.getValueFromPerct(pfexy.perctV) : this.getValueFromPerct(pfexy.perctH);
        this.el.title.innerText = `${this.title}: ${this.val}`;
        // Run function.
        if (this.val != oldval) {
            if (this.onslide !== undefined) this.onslide();
        }
    }

    positionTooltip(xyObj) {
        let trackBCR = this.el.track.getBoundingClientRect();
        let hoveredValue = 0;
        if (this.vert) {
            let bottom = parseInt(trackBCR.bottom - xyObj.y);
            this.el.tooltip.style.bottom = `${bottom - this.tooltipDiagonal / 2}px`;
            let perctObj = this.getPerctFromXyObj(xyObj, this.el.track);
            hoveredValue = this.getValueFromPerct(perctObj.perctV);
        } else {
            let left = parseInt(xyObj.x - trackBCR.left);
            this.el.tooltip.style.left = `${left - this.tooltipDiagonal / 2}px`;
            let perctObj = this.getPerctFromXyObj(xyObj, this.el.track);
            hoveredValue = this.getValueFromPerct(perctObj.perctH);
        }
        let tooltipFontsize = getMaxFontsize(this.tooltipDiagonal, hoveredValue);
        this.el.tooltipspan.style.fontSize = `${tooltipFontsize}px`;
        this.el.tooltipspan.innerText = hoveredValue;
    }

}

function addToRgb(color = "", int = 0) {
    let obj = getRGBcolorObj(color);
    obj.r = minMax(obj.r + int, 0, 255);
    obj.g = minMax(obj.g + int, 0, 255);
    obj.b = minMax(obj.b + int, 0, 255);
    return `rgb(${obj.r}, ${obj.g}, ${obj.b})`;
}

function getRGBcolorObj(color = "") {
    let element = document.createElement("div");
    element.style.backgroundColor = color;
    element.style.display = "none";
    document.body.appendChild(element);
    let rgbStr = window.getComputedStyle(element).backgroundColor;
    // rgba(255, 255, 255, 0.7)
    document.body.removeChild(element);
    let match = rgbStr.match(/rgb\((\d+),\s*(\d+),\s*(\d+),*\d*\)/);
    if (match.length == 4) {
        return {
            r: Number(match[1]),
            g: Number(match[2]),
            b: Number(match[3])
        };
    } else {
        console.log("Color is not in RGB format.");
        return null;
    }
}

function getMinWidth(arrTexts = []) {
    //  Receives an array of texts and return what is the minimum width in px so all texts fit, assuming text comes in 16px font-size.
    let arrWidths = arrTexts.map((txt) => {
        let div = document.createElement("div");
        div.style.visibility = "hidden";
        div.style.position = "absolute";
        document.body.appendChild(div);
        div.innerText = txt;
        let w = div.offsetWidth;
        document.body.removeChild(div);
        return w;
    });
    arrWidths.sort((a, b) => a - b);
    return arrWidths[arrWidths.length - 1];
}

function getMaxFontsize(width = 0, text="") {
    //  Calculate the maximum font size in 'em' so the text fits the width.
    let div = document.createElement("div");
    div.style.visibility = "hidden";
    div.style.position = "absolute";
    document.body.appendChild(div);
    if (text.toString().length <= 2) text = "00";  //  To keep the font size at a minimum necesarry for two characters.
    div.innerText = text;
    let textw = div.offsetWidth;
    document.body.removeChild(div);
    let ratio = width / textw;
    return `${ratio}em`;
}

function minMax(num, min, max) {
    return Math.max(Math.min(num, max), min);
}
