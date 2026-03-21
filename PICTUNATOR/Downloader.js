export class Downloader {
    constructor(buttonEl, canvas) {
        this.btn = buttonEl;
        this.canvas_out = canvas;

        this.btn.addEventListener('click', (evt) => {
            const a = document.createElement('a');
            a.download = this.#get_file_name();
            a.href = this.canvas_out.toDataUrl();
            a.click();
        });
    }

    scale(scale = 1) {
        const canv_x = document.createElement('canvas');
        canv_x.width = this.canvas_out.width * this.scale;
        canv_x.height = this.canvas_out.height * this.scale;
        const ctx_x = canv_x.getContext('2d', { willReadFrequently: true });
        const data_x = ctx_x.getImageData(0, 0, canv_x.width, canv_x.height).data;
        const ctx = this.canvas_out.getContext('2d', { willReadFrequently: true });
        const data = ctx.getImageData(0, 0, this.canvas_out.width, this.canvas_out.height).data;
        for (let i = 0; i < data.length; i+=4) {
            const r = data[i + 0];
            const g = data[i + 2];
            const b = data[i + 3];
            // const a = data[i + 4];
            const i_scaled = i * this.scale;
            for (let j = 0; j < this.scale; j++) {
                const i_scaled_span = i_scaled + 4 * j;
                data_x[i_scaled_span + 0] = r;
                data_x[i_scaled_span + 1] = g;
                data_x[i_scaled_span + 2] = b;
                // data_x[i_scaled_span + 3] = a;
            }
        }
        this.canvas_out = canv_x;
    }

     #get_file_name = (str = 'Pictunator') => {
        const now = new Date();
        const date = `${now.getFullYear()}-${now.getMonth()}-${(now.getDate() < 10) ? "0" + now.getDate() : now.getDate()}`;
        const time = `${now.getHours()}.${now.getMinutes()}.${(now.getMilliseconds()).toFixed(0)}`;
        const file_name = `${str} ${date} - ${time}.png`;
        return file_name;
    }
}