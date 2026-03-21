/************************************************************
 * PICTUNATOR lets you load an image in the browser and apply visual effects.
 *
 * The image is placed on a canvas ("in") and the applied effect is shown
 * on a different canvas ("out"), which you can download as an image file.
 * 
 * The buttons in #common_controls are used throughout the app: to change the canvases' 
 * layout, select the download size, and download the image.
 *
 * #effects_bar contains the different visual effects and their respective, grouped
 * controls, which appear only after an effect is selected.
 * Effects are available once an image has been uploaded.
 * On mobile, the effects bar moves to the left and changes its interface using JS.
 * 
 ************************************************************/

import { RangeSlider } from "../assets/js/RangeSlider.js"
import { ImageLoader } from "./ImageLoader.js";
import { Downloader } from "./Downloader.js";

const input_file_image = document.getElementById('if_load_image');
const loader = new ImageLoader(input_file_image);
loader.onLoad = (obj) => {
    const { image, name } = obj;
    document.getElementById('span_file_name').textContent = name;
    document.getElementById('overlay_effects_no_image').style.display = 'none';
    setImageToCanvas(image, document.getElementById('canvas_in'));
    document.getElementById('btn_download').disabled = false;
}


function setImageToCanvas(image, canvas) {
    if (!image) {
        canvas.width = 1;
        canvas.height = 1;
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, 1, 1);
        return;
    }
    canvas.width = image.width;
    canvas.height = image.height;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
}

/* --------------------
COMMON CONTROLS
* Sets:
* - Button to switch horizontal/vertical canvas works with CSS only
* - Button to swith floating/fixed input canvas works with CSS only
* - Download button
-------------------- */

const btn_download = document.getElementById('btn_download');
const downloader = new Downloader(btn_download, canvas_out);
downloader.scale(1);

// Missing implementation of scale-button to select the size of the image to download



/* --------------------
EFFECTS BAR
* Sets:
* - Radio button group containing the name of each effect
* - Buttons corresponding to each effect
* - Range Sliders corresponding to each effect
* - Small JS to manage bar's behavior on mobile:
* - - Includes a mobile-only button to select an effect
* - - Effects will now display in a floating, toggled menu
* - - Only one effect and its controls will be visible at a time.
-------------------- */

const effects_bar = document.getElementById('effects_bar');
const arr_effects = effects_bar.querySelectorAll('.effect');
const btn_effects_label_mobile = document.getElementById('btn_effects_label_mobile');
const overlay_effects_menu_mobile = document.getElementById('overlay_effects_menu_mobile');

// .toggled class, in mobile, affects both the effects menu, and the darkened overlay

btn_effects_label_mobile.addEventListener('click', ()=>{
    effects_bar.classList.toggle('toggled');
});

arr_effects.forEach(effect_container => {
    // Since the effects menu is a floating menu in mobile, it should dissapear
    // when one is selected. This also updates the name of the currently selected effect.
    const effect_label = effect_container.querySelector('.effect-title');
    effect_label.addEventListener('click', ()=>{
        btn_effects_label_mobile.textContent = effect_label.textContent;
        effects_bar.classList.remove('toggled');
    });
});

overlay_effects_menu_mobile.addEventListener('click', ()=>{
    // Hiding the mobile-only, floating effects menu when the darkened overlay is clicked
    effects_bar.classList.remove('toggled');
});

document.body.addEventListener('keydown', (k)=>{
    // Pressing Escape also hides the mobile-only, floating effects menu
    if (k.key == 'Escape') {
        effects_bar.classList.remove('toggled');
    }
});

// Effects will be enabled once an image is loaded, so, at this point,
// image_in_obj is not null anymore

/* --------------------
PIXELATE
-------------------- */

let params_px = {
    grid: true,
    grid_color: '#000000',
    is_num_pxls_by_height: true,
    blur: false,
    num_pxls: 32
}

const rg_eff_pixelate = document.getElementById('rg_eff_pixelate');
rg_eff_pixelate.addEventListener('change', ()=> {
    if (!rg_eff_pixelate.checked) return;
    effectPixelate();
});

const ic_px_grid_color = document.getElementById('ic_px_grid_color');
const span_for_grid_color = document.querySelector('[for="ic_px_grid_color"] span');
span_for_grid_color.style.backgroundColor = `${params_px.grid_color}`;

ic_px_grid_color.addEventListener('input', () => {
    params_px.grid_color = ic_px_grid_color.value;
    span_for_grid_color.style.backgroundColor = `${params_px.grid_color}`;
    effectPixelate();
});

const cb_px_grid = document.getElementById('cb_px_grid');
cb_px_grid.addEventListener('input', () => {
    params_px.grid = cb_px_grid.checked;
    effectPixelate();
});

const cb_px_is_num_pxls_by_height = document.getElementById('cb_px_is_num_pxls_by_height');
cb_px_is_num_pxls_by_height.addEventListener('input', () => {
    params_px.is_num_pxls_by_height = cb_px_is_num_pxls_by_height.checked;
    effectPixelate();
});

const cb_px_blur = document.getElementById('cb_px_blur');
cb_px_blur.addEventListener('input', () => {
    params_px.blur = cb_px_blur.checked;
    effectPixelate();
});

const container_rs_px__num_pxls = document.getElementById('container_rs_px__num_pxls');
let params_px_num_pxls = {
    min: 8,
    max: 128,
    step: 8,
    title: 'Number of pixels',
    def: params_px.num_pxls,
    color: '#524c45'
}
const rs_px_num_pxls = new RangeSlider(container_rs_px__num_pxls, params_px_num_pxls);
rs_px_num_pxls.onValueChange(val => {
    params_px.num_pxls = val;
    effectPixelate();
});

function effectPixelate() {
    pixelate(params_px, image_in_obj, canvas_out);
    if (!params_px.grid) return;
    const { cols, rows } = get_cols_rows(params_px.is_num_pxls_by_height, params_px.num_pxls, canvas_out);
    draw_grid(cols, rows, params_px.grid_color, canvas_out);
}

const pixelate = (params, image_obj, canvas) => {
    // Three settins are involed in pixelating: 
    // - How many pixels to simulate?
    // - Does that number apply to the width or the height?
    // - Should the pixelation be blurred, or sharp?
  
    const { num_pxls, is_num_pxls_by_height, blur } = params;
    canvas.imageSmoothingEnabled = blur;
  
    // Set canvas to a max of 500px on its largest dimension to make process faster.
    setCanvasToMaxDim(500, image_obj.image, canvas);
    
    const { cols, rows, cell_dim } = get_cols_rows(is_num_pxls_by_height, num_pxls, canvas);
    
    // Re-set canvas dimensions so width and height are a factor of cell_dim
    canvas.width = cols * cell_dim;
    canvas.height= rows * cell_dim;
    
    // Creating a new canvas with the image to resize it and get pixels information
    const canvas_0 = document.createElement('canvas');
    canvas_0.width = cols;
    canvas_0.height = rows;
    const ctx_0 = canvas_0.getContext('2d', {willReadFrequently: true});
    ctx_0.imageSmoothingEnabled = blur;
    ctx_0.drawImage(image_obj.image, 0, 0, canvas_0.width, canvas_0.height);
    const data = ctx_0.getImageData(0, 0, canvas_0.width, canvas_0.height).data;

    const ctx = canvas.getContext('2d', {willReadFrequently: true});
    ctx.imageSmoothingEnabled = blur;
    
    let x = 0;
    let y = 0;
    let pixels = data.length / 4;
    for (let i = 0; i < pixels; i++) {
        x = i % canvas_0.width;
        y = Math.floor(i / canvas_0.width);
        const r = data[i * 4 + 0];
        const g = data[i * 4 + 1];
        const b = data[i * 4 + 2];
        // const a = data[i * 4 + 3];
        const x0 = cell_dim * x;
        const y0 = cell_dim * y;
        ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;
        ctx.fillRect(x0, y0, cell_dim, cell_dim);
    }
}

function setCanvasToMaxDim(max_px_dim = 0, image, canvas = null) {
    if (!canvas) return;
    if (image.height > image.width) {
        canvas.height = max_px_dim;
        const proportionate_width = (image.width * max_px_dim) / image.height;
        canvas.width = proportionate_width;
    } else {
        canvas.width = max_px_dim;
        const proportionate_height = (image.height * max_px_dim) / image.width;
        canvas.height = proportionate_height;
    }
}


const get_cols_rows = (is_num_pxls_by_height = true, num_pxls = 0, canvas = null) => {
    if (!canvas) return;
    let cell_dim = (is_num_pxls_by_height) ? 
        parseInt(canvas.height / num_pxls) :
        parseInt(canvas.width / num_pxls);
    let cols = parseInt(canvas.width / cell_dim);
    let rows = parseInt(canvas.height / cell_dim);

    return { cols, rows, cell_dim };
}

const draw_grid = (cols = 0, rows = 0, grid_color = '#000000', canvas) => {
    const cell_w = canvas.width / cols;
    const cell_h = canvas.height / rows;
    const ctx = canvas.getContext('2d', {willReadFrequently: true});
    ctx.lineWidth = '1';
    ctx.strokeStyle = `${grid_color}`;
    for (let i = 1; i < cols; i++) {
        ctx.beginPath();
        ctx.moveTo(i * cell_w, 0);
        ctx.lineTo(i * cell_w, canvas.height);
        ctx.stroke();
    }
    for (let i = 1; i < rows; i++) {
        ctx.beginPath();
        ctx.moveTo(0, i * cell_h);
        ctx.lineTo(canvas.width, i * cell_h);
        ctx.stroke();
    }
}

/* --------------------
GRAYSCALE
-------------------- */

let params_grays = {
    only_gray: false,
    num_light_values: 4,
    sensitivity: 0
}

const rg_eff_grayscale = document.getElementById('rg_eff_grayscale');
rg_eff_grayscale.addEventListener('input', () => {
    if (!rg_eff_grayscale.checked) return;
    grayscale(params_grays, image_in_obj.image, canvas_out);
});

const container_rs_grayscale__num_light_values = document.getElementById('container_rs_grayscale__num_light_values');
let params_grays_num_light_values = {
    title: 'Number of light values',
    min: 2,
    max: 20,
    step: 1,
    def: params_grays.num_light_values,
    color: '#524c45'
}
const rs_grays_num_light_values = new RangeSlider(container_rs_grayscale__num_light_values, params_grays_num_light_values);
rs_grays_num_light_values.onValueChange( val => {
    params_grays.num_light_values = val;
    grayscale(params_grays, image_in_obj.image, canvas_out);
});

const container_rs_grayscale__sensitivity = document.getElementById('container_rs_grayscale__sensitivity');
let params_grays_sensitivity = {
    min: -254,
    max: 254,
    def: params_grays.sensitivity,
    step: 1,
    color: '#524c45'
}
const rs_grays_sensitivity = new RangeSlider(container_rs_grayscale__sensitivity, params_grays_sensitivity);
rs_grays_sensitivity.onValueChange(val => {
    params_grays.sensitivity = val;
    grayscale(params_grays, image_in_obj.image, canvas_out);
});

const grayscale = (params, image, canvas) => {
    setCanvasToMaxDim(500, image, canvas);
    const ctx = canvas.getContext('2d', {willReadFrequently: true});
    const canvas_0 = document.createElement('canvas');
    canvas_0.width = canvas.width;
    canvas_0.height = canvas.height;
    const ctx_0 = canvas_0.getContext('2d', {willReadFrequently: true});
    ctx_0.imageSmoothingEnabled = false;
    ctx_0.drawImage(image, 0, 0, canvas_0.width, canvas_0.height);
    const gray_image_data = getGraysImagedata(canvas_0);
    ctx_0.putImageData(gray_image_data, 0, 0);

    const buckets = new Buckets(0, 255, params.num_light_values);
    const representative_values = buckets.get_representative_values_arr();
    const data = gray_image_data.data;
    for (let i = 0; i < data.length; i+= 4) {
        const px_gs = data[i];
        const gs_with_sensitivity = minMax(px_gs + params.sensitivity, 0, 255);
        const bucket_i = buckets.which_bucket(gs_with_sensitivity);
        data[i + 0] = representative_values[bucket_i];
        data[i + 1] = representative_values[bucket_i];
        data[i + 2] = representative_values[bucket_i];
        data[i + 3] = 255;
    }
    ctx.putImageData(gray_image_data, 0, 0);
}

function getGraysImagedata(canvas, gray_weights = [0.299, 0.587, 0.114]) {
    const ctx = canvas.getContext('2d', {willReadFrequently: true});
    let image_data = ctx.getImageData(0, 0, canvas.width, canvas.height);
    let data = image_data.data;

    for (let i = 0; i < data.length; i += 4) {
        const r = data[i + 0];
        const g = data[i + 1];
        const b = data[i + 2];
        // const a = data[i * 4 + 3];
        const grays = parseInt(gray_weights[0] * r + gray_weights[1] * g + gray_weights[2] * b);
        data[i + 0] = grays;
        data[i + 1] = grays;
        data[i + 2] = grays;
        data[i + 3] = 255;
    }
    return image_data;
}

function minMax(val, min, max) {
    return Math.min(max, Math.max(min, val));
}

class Buckets {
    #max;
    #min;
    #num_buckets;
    #buckets;
    constructor(min = 0, max = 0, num_buckets = 1) {
        this.#min = min;
        this.#max = max;
        this.#num_buckets = num_buckets;
        this.#buckets = this.get_buckets(num_buckets);
    }

    get_buckets(num_buckets = null) {
        if (this.#min >= this.#max) return;
        num_buckets = num_buckets || this.#num_buckets;
        const step = (this.#max - this.#min) / num_buckets;
        let buckets = [];
        let last_end = this.#min;
        for (let i = 0; i < num_buckets; i++) {
            let start = last_end;
            let end = (i === num_buckets - 1) ? this.#max : Math.round(this.#min + (i + 1) * step);
            if (end < start) end = start;
            buckets.push([start, end]);
            last_end = end + 1;
        }
        return buckets;
    }

    which_bucket(val = 0, arr = null) {
        arr = arr || this.#buckets;
        for (let i = 0; i < arr.length; i++) {
            if (val >= arr[i][0] && val <= arr[i][1]) return i;
        }
        return -1;
    }

    get_representative_values_arr(arr = null) {
        arr = arr || this.#buckets;
        let values = [];
        try {
            for (let i = 0; i < arr.length; i++) {
                const interval = arr[i];
                if (i == 0) {
                    values[0] = interval[0];
                    continue;
                }
                values[i] = arr[i][1];
            }
        } catch (error) {
            console.log('Array is in the incorrect format. Should be [[interval_start, interval_end], [interval_start, interval_end] ...]');
            console.log(error);
        }
        return values;
    }
}