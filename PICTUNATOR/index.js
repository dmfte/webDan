const canvas_in = document.getElementById('canvas_in');
const canvas_out = document.getElementById('canvas_out');

let image_in;

const span_file_name = document.getElementById('span_file_name');
const btn_download = document.getElementById('btn_download');

const effects_bar = document.getElementById('effects_bar');
const overlay_effects_no_image = document.getElementById('overlay_effects_no_image');

const btn_effects_label_mobile = document.getElementById('btn_effects_label_mobile');
btn_effects_label_mobile.addEventListener('click', ()=>{
    effects_bar.classList.toggle('toggled');
});

const arr_effects = document.querySelectorAll('.effect');
arr_effects.forEach(effect_container => {
    const effect_label = effect_container.querySelector('.effect-title');
    effect_label.addEventListener('click', ()=>{
        effects_bar.classList.toggle('toggled');
        btn_effects_label_mobile.textContent = effect_label.textContent;
    });
});

const overlay_effects_menu_mobile = document.getElementById('overlay_effects_menu_mobile');
overlay_effects_menu_mobile.addEventListener('click', ()=>{
    effects_bar.classList.remove('toggled');
});

document.body.addEventListener('keydown', (k)=>{
    if (k.key == 'Escape') {
        effects_bar.classList.remove('toggled');
    }
});

const if_load_image = document.getElementById('if_load_image');
if_load_image.addEventListener('input', async (imageInputEvent)=>{
    image_in = await getInputImage(imageInputEvent);
    span_file_name.textContent = imageInputEvent.target.files[0].name;
    changeState('has_image');
    
});


function changeState(state='') {
    switch (state) {
        case 'has_image':
            effects_bar.style.pointerEvents = 'all';
            effects_bar.style.opacity = '1';
            btn_download.removeAttribute('disabled');
            setImageToCanvas(image_in, canvas_in);
            setImageToCanvas(image_in, canvas_out);
            overlay_effects_no_image.style.display = 'none';
            break;
    
        default:
            break;
    }
}

function getInputImage(evt) {
    return new Promise((res, rej) => {
        if (evt.target.files.length == 0) return;
        let img = new Image();
        img.onload = () => res(img);
        let URL = window.URL.createObjectURL(evt.target.files[0]);
        img.src = URL;
    });
}

function setImageToCanvas(image, canvas) {
    canvas.width = image.width;
    canvas.height = image.height;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
}