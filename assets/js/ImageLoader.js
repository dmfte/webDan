export class ImageLoader {
    constructor(inputEl) {
        this.inputEl = inputEl;
        this.inputEl.addEventListener('input', async (evt)=> {
            const image_file_and_name = await new Promise ((res, rej) => {
                if (!evt.target.files.length) return res(null);
                const file = evt.target.files[0];
                const name = file.name;
                let image = new Image();
                image.onload = () => {
                    window.URL.revokeObjectURL(url);
                    res({ image: image, name: name });
                }
                image.onerror = () => {
                    window.URL.revokeObjectURL(url);
                    return rej(new Error('No se pudo cargar la imagen.'));
                }
                const url = window.URL.createObjectURL(file);
                image.src = url;
            }).catch((err) => {
                console.log(err);
            });
            //  Will return an object {image, name} to be used in function passed to the ImageLoader instance
            if (this.onLoad) this.onLoad(image_file_and_name);
        });
    }
}
