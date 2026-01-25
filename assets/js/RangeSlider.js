/**
 * RangeSlider custom element.
 *
 * Usage example:
 * ```js
 * import RangeSlider from './RangeSlider.js';
 *
 * const slider = new RangeSlider(parentElement, {
 *   min: 0,
 *   max: 100,
 *   step: 5,
 *   def: 50,
 *   title: 'Speed',
 *   color: '#3d98c2', // optional custom accent color,
*    progressColorBlend: true  // soft transition of colors in the track bar
 * });
 *
 * slider.onValueChange(newValue => {
 *   console.log('Current value:', newValue);
 * });
 * ```
 *
 * The constructor appends a `<range-slider>` element into `parentElement`, injects the
 * component styles once, and wires up pointer plus/minus controls for interactive updates.
 */
// 1) Define the <range-slider> element once
if (!customElements.get('range-slider')) {
    customElements.define('range-slider', class extends HTMLElement {});
}

class RangeSlider {
    // Private static flag for injecting CSS only once
    static #stylesInjected = false;
    // Private instance fields
    #params;
    #container;
    #labels;
    #track;
    #pixelBeginning;
    #pixelEnd;
    #trackContainer;
    #thumb;
    #minusButton;
    #plusButton;
    #minLabel;
    #valueLabel;
    #maxLabel;
    #colorContainer;
    #colorFilledBeginning;
    #colorFilledEnd;
    #colorEmptyBeginning;
    #colorEmptyEnd;
    #secondPercent;
    #currentValue;
    #currentPercent;
    #lastHoverValue = null;
    #isDragging;
    #changeCallback = null;
    #changeCallbackArgs = [];
    #mqlRotate;

    constructor(parent, params) {
        if (!RangeSlider.#stylesInjected) {
            const style = document.createElement('style');
            style.textContent = '@import url(https://fonts.googleapis.com/css2?family=Quicksand:wght@300..700&display=swap);range-slider,range-slider *{box-sizing:border-box;user-select:none;touch-action:none;font-family:Quicksand,sans-serif}range-slider{display:grid;grid-template-rows:1fr 1fr;width:100%;height:100%;position:relative;border-radius:1rem}range-slider .rs-labels{display:flex;justify-content:space-between;align-items:center;padding:0 .5em}range-slider .rs-track-container{display:flex;position:relative; padding: 1px; cursor: pointer;}range-slider .rs-track{position:relative;width:100%;background:linear-gradient(to right,#3d98c2 49%,#6fcaff 50%,#abe0ff 50%)}range-slider .rs-track .rs-pixel{position:absolute;top:50%;width:1px;height:1px;opacity:0}range-slider .rs-track .rs-pixel.beginning{left:0}range-slider .rs-track .rs-pixel.end{right:0}range-slider .rs-track .floating-thumb{position:absolute;bottom:50%;display:none;justify-content:center;align-items:center;background-color:#fff;border-radius:10px;padding:.3em;min-width:2em;height:1.5em;width:fit-content;box-shadow:0 0 5px rgba(0,0,0,.5)}range-slider .rs-track .floating-thumb::after{content:"";position:absolute;top:100%;left:50%;transform:translateX(-50%);border:5px solid transparent;border-top-color:#fff}range-slider .rs-track-container>span{position:absolute;bottom:0;aspect-ratio:1;display:flex;justify-content:center;align-items:center;font-weight:bolder;cursor:pointer;height:100%}range-slider .rs-track-container>span:hover{box-shadow:0 0 5px rgba(0,0,0,.5)}range-slider .rs-track-container>span.minus{left:0;border-radius:50% 0 0 50%}range-slider .rs-track-container>span.plus{right:0;border-radius:0 50% 50% 0}'
            document.head.appendChild(style);
            RangeSlider.#stylesInjected = true;
        }

        this.#params = params;

        this.#buildDOM(parent);
        this.#initializeColors();
        this.#applyInitialStyles();

        // Initialize currentValue to the stepped default
        this.#currentValue = Math.round(params.def / params.step) * params.step;
        this.#currentPercent =
            (this.#currentValue - params.min) / (params.max - params.min) * 100;
        this.#isDragging = false;

        // Render initial state
        this.#updateUI();
        this.#attachEventListeners();
    }

    /** Public getter for the current value of the slider */
    get val() {
        return this.#currentValue;
    }

    onValueChange(callback, ...args) {
        this.#changeCallback = callback;
        this.#changeCallbackArgs = args;
    }

    // === PRIVATE METHODS ===

    #buildDOM(parent) {
        this.#container = document.createElement('range-slider');
        this.#labels = document.createElement('div');
        this.#labels.className = 'rs-labels';

        this.#minLabel = document.createElement('div');
        this.#minLabel.className = 'rs-mm min';
        this.#minLabel.textContent = this.#params.min;

        this.#valueLabel = document.createElement('div');
        this.#valueLabel.className = 'rs-units';


        this.#maxLabel = document.createElement('div');
        this.#maxLabel.className = 'rs-mm max';
        this.#maxLabel.textContent = this.#params.max;

        this.#labels.append(this.#minLabel, this.#valueLabel, this.#maxLabel);
        this.#container.appendChild(this.#labels);

        this.#trackContainer = document.createElement('div');
        this.#trackContainer.className = 'rs-track-container';

        this.#track = document.createElement('div');
        this.#track.className = 'rs-track';

        // Create a track beginning and end element to help with calculations
        // This element is not visible but helps to calculate the starting point of the track
        this.#pixelBeginning = document.createElement('div');
        this.#pixelBeginning.className = 'rs-pixel beginning';
        this.#track.appendChild(this.#pixelBeginning);
        this.#pixelEnd = document.createElement('div');
        this.#pixelEnd.className = 'rs-pixel end'
        this.#track.appendChild(this.#pixelEnd);

        this.#thumb = document.createElement('div');
        this.#thumb.className = 'floating-thumb';
        this.#track.appendChild(this.#thumb);
        this.#trackContainer.appendChild(this.#track);

        this.#minusButton = document.createElement('span');
        this.#minusButton.className = 'minus';
        this.#minusButton.textContent = '-';
        this.#trackContainer.appendChild(this.#minusButton);

        this.#plusButton = document.createElement('span');
        this.#plusButton.className = 'plus';
        this.#plusButton.textContent = '+';
        this.#trackContainer.appendChild(this.#plusButton);

        this.#container.appendChild(this.#trackContainer);
        parent.appendChild(this.#container);
    }

    #initializeColors() {
        const div = document.createElement('div');
        div.style.backgroundColor = this.#params.color || "#3d98c2";
        div.style.display = 'none';
        document.body.appendChild(div);
        const rgb = window.getComputedStyle(div).backgroundColor;
        document.body.removeChild(div);

        this.#colorContainer = this.#addValueToColor(rgb, +150);

        if (this.#params.color2) {
            // When color2 is provided, use color for filled and color2 for empty (no gradients)
            const div2 = document.createElement('div');
            div2.style.backgroundColor = this.#params.color2;
            div2.style.display = 'none';
            document.body.appendChild(div2);
            const rgb2 = window.getComputedStyle(div2).backgroundColor;
            document.body.removeChild(div2);

            this.#colorFilledBeginning = rgb;
            this.#colorFilledEnd = rgb;
            this.#colorEmptyBeginning = rgb2;
            this.#colorEmptyEnd = rgb2;
            this.#secondPercent = 0; // Force progressColorBlend to false
        } else {
            // Original behavior when no color2 is provided
            this.#colorFilledBeginning = this.#addValueToColor(rgb, -50);
            this.#colorFilledEnd = rgb;
            this.#colorEmptyBeginning = this.#addValueToColor(rgb, +70);
            this.#colorEmptyEnd = this.#addValueToColor(rgb, +100);
            this.#secondPercent = this.#params.progressColorBlend == true ? 1 : 0;
        }
    }

    #applyInitialStyles() {
        this.#container.style.border = `1px solid ${this.#colorFilledBeginning}`;
        this.#minusButton.style.color = this.#colorEmptyBeginning;
        this.#plusButton.style.color = this.#colorFilledBeginning;
        this.#container.style.backgroundColor = this.#colorContainer;
        this.#track.style.border = `1px solid ${this.#colorFilledBeginning}`;
        this.#minLabel.style.color = this.#colorFilledBeginning;
        this.#maxLabel.style.color = this.#colorFilledBeginning;
        this.#valueLabel.style.color = this.#colorFilledBeginning;
        this.#thumb.style.color = this.#colorFilledBeginning;
        this.#thumb.style.borderColor = this.#colorFilledBeginning;

        const isFlexColumn = getComputedStyle(this.#labels).flexDirection === 'column';
        const size = isFlexColumn ? this.#container.offsetWidth : this.#container.offsetHeight;
        this.#track.style.borderRadius = `${size/2}px`;
        this.#container.style.borderRadius = `${size/4}px`;
    }

    #attachEventListeners() {
        const dragBound = this.#onPointerDrag.bind(this);
        const hoverBound = this.#onPointerHover.bind(this);

        this.#track.addEventListener('pointermove', hoverBound);
        this.#track.addEventListener('pointerdown', e => {
            this.#isDragging = true;
            this.#track.setPointerCapture(e.pointerId);
            this.#onPointerDrag(e);
            this.#track.addEventListener('pointermove', dragBound);
            this.#track.addEventListener('pointerup', ev => {
                this.#isDragging = false;
                this.#track.removeEventListener('pointermove', dragBound);
                this.#track.releasePointerCapture(ev.pointerId);
            }, {
                once: true
            });
        });

        this.#track.addEventListener('pointerleave', () => {
            this.#thumb.style.display = 'none';
            this.#track.removeEventListener('pointermove', dragBound);
            this.#isDragging = false;
        });

        this.#minusButton.addEventListener('click', () => {
            const cand = this.#currentValue - this.#params.step;
            if (cand < this.#params.min) return;
            this.#currentValue = this.#getSameDecimalsAsStep(cand, this.#params.step);
            this.#updateUI();
        });
        this.#plusButton.addEventListener('click', () => {
            const cand = this.#currentValue + this.#params.step;
            if (cand > this.#params.max) return;
            this.#currentValue = this.#getSameDecimalsAsStep(cand, this.#params.step);
            this.#updateUI();
        });
    }

    #onPointerDrag(ev) {
        this.#thumb.style.display = 'none';

        const percent = this.#getPercentFromEvent(ev);
        const newValue = this.#getValueFromPercent(percent);
        if (newValue === this.#currentValue) return;
        this.#currentPercent = percent;
        this.#currentValue = newValue;
        this.#updateUI();
    }

    #onPointerHover(ev) {
        if (this.#isDragging) return this.#thumb.style.display = 'none';
        const hoverPerct = this.#getPercentFromEvent(ev);
        this.#thumb.style.left = `calc(${hoverPerct}% - (${this.#thumb.offsetWidth}px/2))`;
        const hoverValue = this.#getValueFromPercent(hoverPerct);
        if (this.#lastHoverValue === hoverValue) return;
        this.#lastHoverValue = hoverValue;

        this.#thumb.textContent = hoverValue;
        this.#thumb.style.display = 'flex';
    }

    #getPercentFromEvent(ev) {
        const pixelBeginningRect = this.#pixelBeginning.getBoundingClientRect();
        const pixelEndRect = this.#pixelEnd.getBoundingClientRect();
        const rectX = pixelEndRect.left - pixelBeginningRect.left;
        const rectY = pixelEndRect.top - pixelBeginningRect.top;
        const line1 = Math.hypot(rectY, rectX);
        const evX = ev.clientX - pixelBeginningRect.left;
        const evY = ev.clientY - pixelBeginningRect.top;
        const line2 = Math.hypot(evY, evX);
        const angle = this.#angleBetweenPointAndCursor({
            x1: rectX,
            y1: rectY,
            x2: evX,
            y2: evY
        });
        const line2X = line2 * Math.cos(angle);
        const percent = (line2X / line1) * 100;
        return Math.max(0, Math.min(100, percent));
    }

    #angleBetweenPointAndCursor({ x1, y1, x2, y2 }) {
        // Returns the signed angle between two vectors (x1,y1) → origin and (x2,y2) → origin.
        // The magnitude is in [0, π]. Positive means v2 is clockwise from v1, negative means v2 is counter-clockwise.

        // dot = |v1||v2| cosθ
        const dot = x1 * x2 + y1 * y2;
        // det = x1*y2 - y1*x2 = |v1||v2| sinθ
        const det = x1 * y2 - y1 * x2;

        return -Math.atan2(det, dot);
    }

    #getValueFromPercent(percent) {
        const raw = (percent / 100) * (this.#params.max - this.#params.min) + this.#params.min;
        const stepv = Math.round(raw / this.#params.step) * this.#params.step;
        const clamped = Math.max(this.#params.min, Math.min(this.#params.max, stepv));
        const formated = this.#getSameDecimalsAsStep(clamped, this.#params.step);
        return formated;
    }

    #updateUI() {
        // this.#currentPercent = ((this.#currentValue - this.#params.min)/(this.#params.max - this.#params.min))*100;
        this.#valueLabel.textContent = `${this.#params.title}: ${this.#currentValue}`;
        const perct = (this.#currentValue - this.#params.min) / (this.#params.max - this.#params.min) * 100;
        this.#track.style.background = `linear-gradient(to right, ${this.#colorFilledBeginning} 0%, ${this.#colorFilledEnd} ${perct}%, ${this.#colorEmptyBeginning} ${perct + this.#secondPercent}%, ${this.#colorEmptyEnd} 100%)`;

        if (this.#changeCallback) this.#changeCallback(this.#currentValue, ...this.#changeCallbackArgs);
    }

    #addValueToColor(rgb, value) {
        const parts = rgb.match(/\d+/g).map(Number);
        return `rgb(${parts.map(v=>Math.min(255,Math.max(0,v+value))).join(', ')})`;
    }

    #getSameDecimalsAsStep(val, step) {
        const dec = step.toString().split('.')[1]?.length || 0;
        return Number(val.toFixed(dec));
    }
}

export default RangeSlider;
