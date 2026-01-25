// ============================================
// CONSTANTS
// ============================================
const CM_TO_PT = 28.346; // 1 cm = 28.346 points
const MIN_SCALE = 5; // Minimum scale percentage
const MAX_SCALE = 50; // Maximum scale percentage (since one signature = 2 pages side by side)

const PAGE_SIZES = {
    carta: { width: 8.5 * 72, height: 11 * 72 }, // Letter: 8.5" x 11"
    oficio: { width: 8.5 * 72, height: 13 * 72 }  // Legal variant: 8.5" x 13"
};

// ============================================
// STATE
// ============================================
let pdfDoc = null;
let pdfPages = [];
let generatedPdfBytes = null;
let currentRenderTask = null;

// ============================================
// DOM ELEMENTS
// ============================================
const elements = {
    // File inputs
    pdfInput: document.getElementById('pdfInput'),
    pdfInputDesktop: document.getElementById('pdfInputDesktop'),

    // Download buttons
    downloadBtn: document.getElementById('downloadBtn'),
    downloadBtnDesktop: document.getElementById('downloadBtnDesktop'),

    // Generate button
    generateBtn: document.getElementById('generateBtn'),

    // Controls
    pageSize: document.getElementById('pageSize'),
    signaturesPerBooklet: document.getElementById('signaturesPerBooklet'),
    gutterSpace: document.getElementById('gutterSpace'),
    marginH: document.getElementById('marginH'),
    marginV: document.getElementById('marginV'),
    scale: document.getElementById('scale'),
    scissorLines: document.getElementById('scissorLines'),

    // UI elements
    hamburgerBtn: document.getElementById('hamburgerBtn'),
    controlPanel: document.getElementById('controlPanel'),
    controlPanelOverlay: document.getElementById('controlPanelOverlay'),
    bookletCounter: document.getElementById('bookletCounter'),
    previewCanvas: document.getElementById('previewCanvas'),
    previewPlaceholder: document.getElementById('previewPlaceholder')
};

// ============================================
// INITIALIZATION
// ============================================
function init() {
    // File input handlers
    elements.pdfInput.addEventListener('change', handleFileSelect);
    elements.pdfInputDesktop.addEventListener('change', handleFileSelect);

    // Download button handlers
    elements.downloadBtn.addEventListener('click', downloadPDF);
    elements.downloadBtnDesktop.addEventListener('click', downloadPDF);

    // Generate button handler
    elements.generateBtn.addEventListener('click', generateAndPreview);

    // Hamburger menu
    elements.hamburgerBtn.addEventListener('click', toggleMobileMenu);

    // Drawer overlay
    elements.controlPanelOverlay.addEventListener('click', toggleMobileMenu);

    // Update booklet counter when configuration changes
    [elements.signaturesPerBooklet]
        .forEach(el => el.addEventListener('input', updateBookletCounter));

    // Ensure number inputs display with correct decimal separator
    // Force re-assignment to normalize display regardless of locale
    elements.gutterSpace.value = elements.gutterSpace.value;
    elements.marginH.value = elements.marginH.value;
    elements.marginV.value = elements.marginV.value;
    elements.scale.value = elements.scale.value;
}

// ============================================
// UI HANDLERS
// ============================================
function toggleMobileMenu() {
    elements.controlPanel.classList.toggle('open');
}

async function handleFileSelect(event) {
    const file = event.target.files[0];
    if (!file) return;

    try {
        const arrayBuffer = await file.arrayBuffer();
        pdfDoc = await PDFLib.PDFDocument.load(arrayBuffer);
        pdfPages = pdfDoc.getPages();

        console.log(`PDF loaded: ${pdfPages.length} pages in sequential order`);

        // Update counter and clear any previous generated PDF
        updateBookletCounter();
        generatedPdfBytes = null;

        // Clear preview
        elements.previewCanvas.classList.remove('visible');
        elements.previewPlaceholder.classList.remove('hidden');
        elements.previewPlaceholder.textContent = 'PDF cargado. Haga clic en "Generar Cuadernillo" para procesar.';
    } catch (error) {
        console.error('Error loading PDF:', error);
        alert('Error al cargar el PDF. Por favor, intente con otro archivo.');
    }
}

async function generateAndPreview() {
    if (!pdfDoc || !pdfPages.length) {
        alert('Por favor, cargue un PDF primero.');
        return;
    }

    // Show loading state
    elements.previewPlaceholder.textContent = 'Generando cuadernillo...';
    elements.previewPlaceholder.classList.remove('hidden');
    elements.previewCanvas.classList.remove('visible');
    elements.controlPanel.classList.remove('open');

    try {
        const result = await generatePDF();
        if (!result || result.length === 0) {
            throw new Error('PDF generation returned empty result');
        }
        await renderPreview();
    } catch (error) {
        console.error('Error generating booklet:', error);
        alert('Error al generar el cuadernillo: ' + error.message);
        elements.previewPlaceholder.textContent = 'Error al generar. Intente de nuevo.';
    }
}

function updateBookletCounter() {
    if (!pdfDoc || !pdfPages.length) {
        elements.bookletCounter.textContent = '0';
        return;
    }

    const totalPages = pdfPages.length;
    const signaturesPerBookletCount = parseInt(elements.signaturesPerBooklet.value) || 1;
    const pagesPerBooklet = calculatePagesPerBooklet(signaturesPerBookletCount);
    const effectivePagesPerBooklet = Math.min(pagesPerBooklet, totalPages);
    const numBooklets = Math.ceil(totalPages / effectivePagesPerBooklet);

    elements.bookletCounter.textContent = numBooklets;
}

// ============================================
// SIGNATURE CALCULATION
// ============================================
function calculateSignatureLayout() {
    const pageSize = PAGE_SIZES[elements.pageSize.value];
    const scale = parseFloat(elements.scale.value) / 100;
    const gutterCm = parseFloat(elements.gutterSpace.value) || 0;
    const marginHCm = parseFloat(elements.marginH.value) || 0;
    const marginVCm = parseFloat(elements.marginV.value) || 0;

    const gutterPt = gutterCm * CM_TO_PT;
    const marginHPt = marginHCm * CM_TO_PT;
    const marginVPt = marginVCm * CM_TO_PT;

    // Get original page dimensions (assume first page)
    const originalPage = pdfPages[0];
    const originalWidth = originalPage.getWidth();
    const originalHeight = originalPage.getHeight();

    // Calculate scaled page dimensions
    const scaledPageWidth = originalWidth * scale;
    const scaledPageHeight = originalHeight * scale;

    // One signature = 2 pages side by side + gutter between them
    const signatureWidth = scaledPageWidth * 2 + gutterPt;
    const signatureHeight = scaledPageHeight;

    // Available space on output page
    const availableWidth = pageSize.width - (2 * marginHPt);
    const availableHeight = pageSize.height - (2 * marginVPt);

    // Calculate how many signatures fit per page
    const signaturesPerRow = Math.floor(availableWidth / signatureWidth) || 1;
    const signaturesPerColumn = Math.floor(availableHeight / signatureHeight) || 1;
    const signaturesPerOutputPage = signaturesPerRow * signaturesPerColumn;

    // Calculate spacing between signatures (for cut guides)
    const totalSignatureWidth = signatureWidth * signaturesPerRow;
    const remainingWidth = availableWidth - totalSignatureWidth;
    const spacingX = signaturesPerRow > 1 ? remainingWidth / (signaturesPerRow - 1) : 0;

    const totalSignatureHeight = signatureHeight * signaturesPerColumn;
    const remainingHeight = availableHeight - totalSignatureHeight;
    const spacingY = signaturesPerColumn > 1 ? remainingHeight / (signaturesPerColumn - 1) : 0;

    return {
        pageSize,
        scale,
        gutterPt,
        marginHPt,
        marginVPt,
        scaledPageWidth,
        scaledPageHeight,
        signatureWidth,
        signatureHeight,
        signaturesPerRow,
        signaturesPerColumn,
        signaturesPerOutputPage,
        spacingX,
        spacingY
    };
}

// ============================================
// BOOKLET IMPOSITION
// ============================================

/**
 * Step 1: Compute pages_per_booklet
 * pages_per_booklet = signaturesPerBooklet × 4
 */
function calculatePagesPerBooklet(signaturesPerBooklet) {
    return signaturesPerBooklet * 4;
}

/**
 * Step 2: Create total_booklets array
 * Groups consecutive page numbers by pages_per_booklet
 */
function createTotalBooklets(totalPages, pagesPerBooklet) {
    const booklets = [];
    let currentPage = 0;

    while (currentPage < totalPages) {
        const bookletPages = [];
        const endPage = Math.min(currentPage + pagesPerBooklet, totalPages);

        for (let i = currentPage; i < endPage; i++) {
            bookletPages.push(i); // 0-indexed page numbers
        }

        booklets.push(bookletPages);
        currentPage = endPage;
    }

    return booklets;
}

/**
 * Step 3: Create paired_pages structure
 * Groups pages into pairs within each booklet using the pairing logic
 *
 * Pairing logic (b = booklet size):
 * Pair index alternates:
 * - Even pair index (0, 2, 4, ...): [b - 1 - pairIdx, pairIdx]
 * - Odd pair index (1, 3, 5, ...): [pairIdx, b - 1 - pairIdx]
 */
function createPairedPages(totalBooklets) {
    const pairedBooklets = [];

    for (const booklet of totalBooklets) {
        const b = booklet.length;
        const pairs = [];

        // If booklet has odd size, append the next page number to complete the pair
        let bookletSize = b;
        if (b % 2 === 1) {
            bookletSize = b + 1;
        }

        // Calculate number of pairs
        const numPairs = bookletSize / 2;

        // Pairing logic
        for (let pairIdx = 0; pairIdx < numPairs; pairIdx++) {
            let pair;

            if (pairIdx % 2 === 0) {
                // Even pair index: [b - 1 - pairIdx, pairIdx]
                const left = bookletSize - 1 - pairIdx;
                const right = pairIdx;
                pair = [
                    left < b ? booklet[left] : bookletSize - 1,
                    right < b ? booklet[right] : bookletSize - 1
                ];
            } else {
                // Odd pair index: [pairIdx, b - 1 - pairIdx]
                const left = pairIdx;
                const right = bookletSize - 1 - pairIdx;
                pair = [
                    left < b ? booklet[left] : bookletSize - 1,
                    right < b ? booklet[right] : bookletSize - 1
                ];
            }
            pairs.push(pair);
        }

        pairedBooklets.push(pairs);
    }

    return pairedBooklets;
}

/**
 * Step 4: Create signatures_per_booklet structure
 * Groups every two pairs into one signature
 */
function createSignaturesPerBooklet(pairedPages) {
    const signaturesBooklets = [];

    for (const pairs of pairedPages) {
        const signatures = [];

        for (let i = 0; i < pairs.length; i += 2) {
            const signature = [];
            signature.push(pairs[i]);
            if (i + 1 < pairs.length) {
                signature.push(pairs[i + 1]);
            }
            signatures.push(signature);
        }

        signaturesBooklets.push(signatures);
    }

    return signaturesBooklets;
}

/**
 * Step 5: Create signatures_per_booklet_front_and_back structure
 * Each signature stores: first pair → page_front, second pair → page_back
 */
function createSignaturesFrontAndBack(signaturesPerBooklet) {
    const result = [];

    for (let bookletIdx = 0; bookletIdx < signaturesPerBooklet.length; bookletIdx++) {
        const signatures = signaturesPerBooklet[bookletIdx];
        const bookletObj = {};
        const bookletName = `booklet${bookletIdx + 1}`;
        const signaturesArray = [];

        for (let sigIdx = 0; sigIdx < signatures.length; sigIdx++) {
            const signature = signatures[sigIdx];
            const signatureName = `signature${sigIdx + 1}`;
            const signatureObj = {};

            // First pair → page_front
            if (signature[0]) {
                signatureObj.page_front = signature[0];
            }

            // Second pair → page_back
            if (signature[1]) {
                signatureObj.page_back = signature[1];
            }

            signaturesArray.push({ [signatureName]: signatureObj });
        }

        bookletObj[bookletName] = signaturesArray;
        result.push(bookletObj);
    }

    return result;
}

/**
 * Main function to get page order with new structure
 *
 * This function implements the complete booklet imposition algorithm:
 * 1. Computes pages_per_booklet based on signatures per booklet
 * 2. Splits the PDF into booklets
 * 3. Creates page pairs with the correct ordering for printing
 * 4. Groups pairs into signatures
 * 5. Separates signatures into front and back pages
 *
 * @param {number} totalPages - Total number of pages in the original PDF
 * @param {number} signaturesPerBookletCount - Number of signatures per booklet (from UI)
 * @returns {Object} Object containing all intermediate structures and final front/back layout
 */
function getPageOrder(totalPages, signaturesPerBookletCount) {
    // Step 1: Compute pages_per_booklet
    const pagesPerBooklet = calculatePagesPerBooklet(signaturesPerBookletCount);

    // Ensure pages_per_booklet doesn't exceed total page count
    const effectivePagesPerBooklet = Math.min(pagesPerBooklet, totalPages);

    // Step 2: Create total_booklets
    const totalBooklets = createTotalBooklets(totalPages, effectivePagesPerBooklet);

    // Step 3: Create paired_pages
    const pairedPages = createPairedPages(totalBooklets);

    // Step 4: Create signatures_per_booklet
    const signaturesPerBooklet = createSignaturesPerBooklet(pairedPages);

    // Step 5: Create signatures_per_booklet_front_and_back
    const signaturesFrontAndBack = createSignaturesFrontAndBack(signaturesPerBooklet);
    
    return {
        pagesPerBooklet: effectivePagesPerBooklet,
        totalBooklets,
        pairedPages,
        signaturesPerBooklet,
        signaturesFrontAndBack
    };
}

// ============================================
// PDF GENERATION
// ============================================
async function generatePDF() {
    if (!pdfDoc || !pdfPages.length) return null;

    const layout = calculateSignatureLayout();
    const totalPages = pdfPages.length;
    const signaturesPerBookletCount = parseInt(elements.signaturesPerBooklet.value) || 1;

    const pageOrderResult = getPageOrder(totalPages, signaturesPerBookletCount);
    const { signaturesFrontAndBack } = pageOrderResult;

    // Create new PDF document
    const outputPdf = await PDFLib.PDFDocument.create();

    // Flatten all signatures from all booklets
    const allSignatures = [];
    for (const bookletObj of signaturesFrontAndBack) {
        const bookletName = Object.keys(bookletObj)[0];
        const signaturesArray = bookletObj[bookletName];

        for (const signatureObj of signaturesArray) {
            const signatureName = Object.keys(signatureObj)[0];
            const signatureData = signatureObj[signatureName];
            allSignatures.push(signatureData);
        }
    }

    // Calculate how many signatures fit per output page
    const signaturesPerOutputPage = layout.signaturesPerOutputPage;
    const totalSignatures = allSignatures.length;
    const totalOutputPages = Math.ceil(totalSignatures / signaturesPerOutputPage);

    // Process each output page
    for (let outputPageIdx = 0; outputPageIdx < totalOutputPages; outputPageIdx++) {
        // Create front page
        const frontPage = outputPdf.addPage([layout.pageSize.width, layout.pageSize.height]);

        // Create back page
        const backPage = outputPdf.addPage([layout.pageSize.width, layout.pageSize.height]);

        // Determine which signatures go on this output page
        const startSigIdx = outputPageIdx * signaturesPerOutputPage;
        const endSigIdx = Math.min(startSigIdx + signaturesPerOutputPage, totalSignatures);

        // Place signatures on this output page
        for (let sigIdx = startSigIdx; sigIdx < endSigIdx; sigIdx++) {
            const signature = allSignatures[sigIdx];
            const localSigIdx = sigIdx - startSigIdx;

            const row = Math.floor(localSigIdx / layout.signaturesPerRow);
            const col = localSigIdx % layout.signaturesPerRow;

            // Calculate position for this signature on the front page
            const x = layout.marginHPt + col * (layout.signatureWidth + layout.spacingX);
            const y = layout.pageSize.height - layout.marginVPt - (row + 1) * layout.signatureHeight - row * layout.spacingY;

            // Draw front pages (page_front)
            if (signature.page_front) {
                await drawPagePair(outputPdf, frontPage, signature.page_front, x, y, layout);
            }

            // Draw back pages (page_back) - mirrored horizontally for duplex printing
            if (signature.page_back) {
                // Calculate mirrored X position for duplex printing
                // When paper is flipped, left becomes right
                const backX = layout.pageSize.width - x - layout.signatureWidth;
                await drawPagePair(outputPdf, backPage, signature.page_back, backX, y, layout);
            }
        }

        // Draw scissor lines if enabled
        if (elements.scissorLines.checked) {
            drawScissorLines(frontPage, layout, endSigIdx - startSigIdx, false);
            drawScissorLines(backPage, layout, endSigIdx - startSigIdx, true);
        }
    }

    generatedPdfBytes = await outputPdf.save();
    return generatedPdfBytes;
}

/**
 * Draws a pair of pages (one signature side) on the output page
 *
 * @param {Object} outputPdf - The output PDF document
 * @param {Object} page - The target page (front or back)
 * @param {Array} pageNumbers - [leftPageIdx, rightPageIdx] (0-indexed)
 * @param {number} x - X position for the signature
 * @param {number} y - Y position for the signature
 * @param {Object} layout - Layout configuration
 */
async function drawPagePair(outputPdf, page, pageNumbers, x, y, layout) {
    const [leftPageIdx, rightPageIdx] = pageNumbers;

    // Draw left page
    if (leftPageIdx < pdfPages.length) {
        await embedAndDrawPage(outputPdf, page, leftPageIdx, x, y, layout);
    }

    // Draw right page (offset by one page width + gutter)
    const rightX = x + layout.scaledPageWidth + layout.gutterPt;
    if (rightPageIdx < pdfPages.length) {
        await embedAndDrawPage(outputPdf, page, rightPageIdx, rightX, y, layout);
    }
}

/**
 * Embeds a page from the source PDF and draws it on the target page
 *
 * @param {Object} outputPdf - The output PDF document
 * @param {Object} targetPage - The target page to draw on
 * @param {number} sourcePageIdx - Index of the source page (0-indexed, based on actual position in PDF)
 * @param {number} x - X position
 * @param {number} y - Y position
 * @param {Object} layout - Layout configuration with scaled dimensions
 */
async function embedAndDrawPage(outputPdf, targetPage, sourcePageIdx, x, y, layout) {
    // Validate the page index
    if (sourcePageIdx >= pdfPages.length) {
        console.warn(`Page index ${sourcePageIdx} is out of bounds (total pages: ${pdfPages.length})`);
        return;
    }

    // Use copyPages to ensure we copy pages by their actual index position in the array
    // This guarantees we use the sequential page order, not embedded page numbers
    const [copiedPage] = await outputPdf.copyPages(pdfDoc, [sourcePageIdx]);
    const embeddedPage = await outputPdf.embedPage(copiedPage);

    targetPage.drawPage(embeddedPage, {
        x: x,
        y: y,
        width: layout.scaledPageWidth,
        height: layout.scaledPageHeight
    });
}

function drawScissorLines(page, layout, numSignatures, mirrorHorizontal = false) {
    // Draw a border around each signature on this page
    for (let localSigIdx = 0; localSigIdx < numSignatures; localSigIdx++) {
        const row = Math.floor(localSigIdx / layout.signaturesPerRow);
        const col = localSigIdx % layout.signaturesPerRow;

        // Calculate position for this signature
        let x = layout.marginHPt + col * (layout.signatureWidth + layout.spacingX);
        const y = layout.pageSize.height - layout.marginVPt - (row + 1) * layout.signatureHeight - row * layout.spacingY;

        // Mirror X position for back pages (duplex printing)
        if (mirrorHorizontal) {
            x = layout.pageSize.width - x - layout.signatureWidth;
        }

        // Draw rectangle border around the signature
        page.drawRectangle({
            x: x,
            y: y,
            width: layout.signatureWidth,
            height: layout.signatureHeight,
            borderColor: PDFLib.rgb(0.3, 0.3, 0.3),
            borderWidth: 1,
            borderDashArray: [4, 2]
        });
    }
}

// ============================================
// PREVIEW RENDERING
// ============================================
async function renderPreview() {
    if (!generatedPdfBytes) return;

    // Cancel any ongoing render task
    if (currentRenderTask) {
        currentRenderTask.cancel();
        currentRenderTask = null;
    }

    try {
        // Configure PDF.js worker
        if (typeof pdfjsLib !== 'undefined') {
            pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
        }

        // Load the generated PDF with PDF.js
        // IMPORTANT: Pass a COPY so PDF.js doesn't consume our original data
        const loadingTask = pdfjsLib.getDocument({ data: generatedPdfBytes.slice() });
        const pdf = await loadingTask.promise;

        // Get first page
        const page = await pdf.getPage(1);
        const viewport = page.getViewport({ scale: 1.0 });

        // Prepare canvas
        const canvas = elements.previewCanvas;
        const context = canvas.getContext('2d');

        // Calculate scale to fit preview area
        const previewContainer = elements.previewCanvas.parentElement;
        const maxWidth = previewContainer.clientWidth * 0.9;
        const maxHeight = previewContainer.clientHeight * 0.9;
        const scale = Math.min(maxWidth / viewport.width, maxHeight / viewport.height, 1);

        const scaledViewport = page.getViewport({ scale });

        // Set canvas dimensions
        canvas.width = scaledViewport.width;
        canvas.height = scaledViewport.height;

        // Render PDF page to canvas
        const renderContext = {
            canvasContext: context,
            viewport: scaledViewport
        };

        currentRenderTask = page.render(renderContext);
        await currentRenderTask.promise;
        currentRenderTask = null;

        // Show canvas, hide placeholder
        elements.previewCanvas.classList.add('visible');
        elements.previewPlaceholder.classList.add('hidden');

    } catch (error) {
        // Check if error is due to cancellation
        if (error.name === 'RenderingCancelledException') {
            return; // Silently ignore cancellation errors
        }

        console.error('Error rendering preview:', error);
        // Fallback to simple preview
        renderSimplePreview();
    }
}

function renderSimplePreview() {
    const canvas = elements.previewCanvas;
    const ctx = canvas.getContext('2d');

    canvas.width = 400;
    canvas.height = 300;

    // Draw white background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw text
    ctx.fillStyle = '#000000';
    ctx.font = '16px Courier New';
    ctx.textAlign = 'center';
    ctx.fillText('Vista previa generada', canvas.width / 2, canvas.height / 2);
    ctx.font = '12px Courier New';
    ctx.fillText('Descargue el PDF para verlo', canvas.width / 2, canvas.height / 2 + 20);

    // Show canvas, hide placeholder
    elements.previewCanvas.classList.add('visible');
    elements.previewPlaceholder.classList.add('hidden');
}

// ============================================
// DOWNLOAD
// ============================================
function downloadPDF() {
    if (!generatedPdfBytes || generatedPdfBytes.length === 0) {
        alert('Por favor, genere el cuadernillo primero haciendo clic en "Generar Cuadernillo".');
        return;
    }

    const blob = new Blob([generatedPdfBytes], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'cuadernillos.pdf';
    a.click();
    URL.revokeObjectURL(url);
}

// ============================================
// START
// ============================================
init();
