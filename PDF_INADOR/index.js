// Selecting HTML elements
const loadImgsInput = document.getElementById('loadImgs');
const downloadPDFBtn = document.getElementById('downloadPDF');
const radioGroup = document.querySelectorAll('input[name="rbgFuncs"]');
const pageSizeCheckbox = document.getElementById('imgPdf_cbPageSize');
const previewCanvas = document.getElementById('preview1stPage');

// Array to store uploaded images
let uploadedImages = [];

// Event listener to handle image file input
loadImgsInput.addEventListener('change', (event) => {
    const files = Array.from(event.target.files);
    files.forEach(file => {
        const reader = new FileReader();
        reader.onload = (e) => {
            uploadedImages.push(e.target.result);

            // Enable the download button if at least one image is loaded
            if (uploadedImages.length > 0) {
                const lbDownloadPDFBtn = document.querySelector("[for=downloadPDF]");
                lbDownloadPDFBtn.classList.remove('disabled');
            }

            // Generate a preview of the first page
            generatePreview();
        };
        reader.readAsDataURL(file);
    });
});

// Function to generate preview
function generatePreview() {
    if (uploadedImages.length === 0) return;

    if (pageSizeCheckbox.checked) {
        const canvas = previewCanvas;
        const ctx = canvas.getContext('2d');
        const margin = 2.5 * 28.35; // 2.5 cm in points
        const pageWidth = 612 * 0.25; // Scaled down to 25%
        const pageHeight = 792 * 0.25; // Scaled down to 25%
        const image = new Image();
        image.onload = () => {
            const maxWidth = pageWidth - (2 * margin * 0.25);
            const maxHeight = pageHeight - (2 * margin * 0.25);

            let displayWidth = maxWidth;
            let displayHeight = maxWidth * (image.height / image.width);

            if (displayHeight > maxHeight) {
                displayHeight = maxHeight;
                displayWidth = maxHeight * (image.width / image.height);
            }

            ctx.clearRect(0, 0, canvas.width, canvas.height);
            canvas.width = pageWidth;
            canvas.height = pageHeight;
            ctx.fillStyle = "#ffffff"; // Fill background
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.drawImage(image, margin * 0.25, margin * 0.25, displayWidth, displayHeight);
        };
        image.src = uploadedImages[0];
    } else {
        const canvas = previewCanvas;
        const ctx = canvas.getContext('2d');
        const image = new Image();
        image.onload = () => {
            const maxWidth = canvas.width;
            const maxHeight = canvas.height;

            let displayWidth = maxWidth;
            let displayHeight = maxWidth * (image.height / image.width);

            if (displayHeight > maxHeight) {
                displayHeight = maxHeight;
                displayWidth = maxHeight * (image.width / image.height);
            }

            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.drawImage(image, (maxWidth - displayWidth) / 2, (maxHeight - displayHeight) / 2, displayWidth, displayHeight);
        };
        image.src = uploadedImages[0];
    }
}

// Event listener for download button
downloadPDFBtn.addEventListener('click', async () => {
    const selectedRadio = Array.from(radioGroup).find(radio => radio.checked);
    switch (selectedRadio.id) {
        case 'rbImagesToPDF':
            if (uploadedImages.length > 0) {
                try {
                    const pdfDoc = await PDFLib.PDFDocument.create();

                    for (const image of uploadedImages) {
                        const imgBytes = atob(image.split(',')[1]);
                        const imgBuffer = new Uint8Array(imgBytes.length);

                        for (let i = 0; i < imgBytes.length; i++) {
                            imgBuffer[i] = imgBytes.charCodeAt(i);
                        }

                        let pdfImage;
                        if (image.startsWith('data:image/jpeg')) {
                            pdfImage = await pdfDoc.embedJpg(imgBuffer);
                        } else if (image.startsWith('data:image/png')) {
                            pdfImage = await pdfDoc.embedPng(imgBuffer);
                        } else {
                            alert('Unsupported image format.');
                            return;
                        }

                        if (!pageSizeCheckbox.checked) {
                            const page = pdfDoc.addPage([pdfImage.width, pdfImage.height]);
                            page.drawImage(pdfImage, {
                                x: 0,
                                y: 0,
                                width: pdfImage.width,
                                height: pdfImage.height,
                            });
                        } else {
                            const margin = 2.5 * 28.35; // 2.5 cm to points (1 cm = 28.35 points)
                            const pageWidth = 612; // Letter width in points
                            const pageHeight = 792; // Letter height in points
                            const page = pdfDoc.addPage([pageWidth, pageHeight]);
                            const imageAspectRatio = pdfImage.width / pdfImage.height;
                            const maxWidth = pageWidth - 2 * margin;
                            const maxHeight = pageHeight - 2 * margin;
                            let displayWidth = maxWidth;
                            let displayHeight = maxWidth / imageAspectRatio;

                            if (displayHeight > maxHeight) {
                                displayHeight = maxHeight;
                                displayWidth = maxHeight * imageAspectRatio;
                            }

                            page.drawImage(pdfImage, {
                                x: margin,
                                y: pageHeight - margin - displayHeight,
                                width: displayWidth,
                                height: displayHeight,
                            });
                        }
                    }

                    const pdfBytes = await pdfDoc.save();
                    const blob = new Blob([pdfBytes], { type: 'application/pdf' });
                    const link = document.createElement('a');
                    const inputFilename = document.getElementById("inputName");
                    const filename = (inputFilename.value == "") ? "pedeefe" : inputFilename.value;
                    link.href = URL.createObjectURL(blob);
                    link.download = `${filename}.pdf`;
                    link.click();
                    URL.revokeObjectURL(link.href); // Revoke the object URL after the download

                } catch (error) {
                    console.error('Error creating PDF:', error);
                    alert('An error occurred while creating the PDF.');
                }
            } else {
                alert('No images loaded to generate a PDF.');
            }
            break;

        // Add cases for other radio button IDs here

        default:
            alert('Functionality for the selected option is not implemented yet.');
    }
});

// Event listener for the two-options switch
const twoOptionsSwitch = document.querySelector(".two-options-switch");
const tosLeft = twoOptionsSwitch.querySelector(".cb-left");
const tosRight = twoOptionsSwitch.querySelector(".cb-right");

tosLeft.addEventListener("click", () => {
    pageSizeCheckbox.checked = false;
    generatePreview();
});
tosRight.addEventListener("click", () => {
    pageSizeCheckbox.checked = true;
    generatePreview();
});
