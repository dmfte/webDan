// ============================================
// CONSTANTS
// ============================================
const CM_TO_PT = 28.346; // 1 cm = 28.346 points
const MIN_SCALE = 5; // Minimum scale percentage
const MAX_SCALE = 50; // Maximum scale percentage (since one leaf = 2 pages side by side)

const PAGE_SIZES = {
    carta: { width: 8.5 * 72, height: 11 * 72 }, // Letter: 8.5" x 11"
    oficio: { width: 8.5 * 72, height: 13 * 72 }  // Legal variant: 8.5" x 13"
};

const LABEL_FONT_SIZE = 6;
const LABEL_INSET = 3; // pt, horizontal offset from the leaf's left edge
const LABEL_GAP = 3; // pt, vertical gap between the leaf's top edge and the label baseline
const LABEL_STRIP_HEIGHT = 12; // pt, reserved above each leaf (outside its trim area) for the label
const LABEL_COLOR_RGB = [0.55, 0.55, 0.55];
const CUT_LINE_COLOR_RGB = [0.3, 0.3, 0.3];

// ============================================
// STATE
// ============================================
let pdfDoc = null;
let pdfPages = [];
let generatedPdfBytes = null;
let currentRenderTask = null;
let isGenerating = false;
let needsGeneration = true; // true whenever current inputs haven't been generated yet

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
    previewPlaceholder: document.getElementById('previewPlaceholder'),
    generatingOverlay: document.getElementById('generatingOverlay')
};

// ============================================
// INITIALIZATION
// ============================================
function init() {
    elements.pdfInput.addEventListener('change', handleFileSelect);
    elements.pdfInputDesktop.addEventListener('change', handleFileSelect);

    elements.downloadBtn.addEventListener('click', downloadPDF);
    elements.downloadBtnDesktop.addEventListener('click', downloadPDF);

    elements.generateBtn.addEventListener('click', generateAndPreview);

    elements.hamburgerBtn.addEventListener('click', toggleMobileMenu);
    elements.controlPanelOverlay.addEventListener('click', toggleMobileMenu);

    elements.signaturesPerBooklet.addEventListener('input', updateBookletCounter);

    [
        elements.pageSize, elements.signaturesPerBooklet, elements.gutterSpace,
        elements.marginH, elements.marginV, elements.scale, elements.scissorLines
    ].forEach(el => {
        el.addEventListener('input', markDirty);
        el.addEventListener('change', markDirty);
    });

    updateButtonStates();
}

// ============================================
// GENERATE/DOWNLOAD BUTTON STATE
// ============================================
function markDirty() {
    if (!needsGeneration) {
        needsGeneration = true;
        updateButtonStates();
    }
}

function updateButtonStates() {
    const hasPdf = !!pdfDoc && pdfPages.length > 0;
    elements.generateBtn.disabled = isGenerating || !hasPdf || !needsGeneration;
    const downloadDisabled = isGenerating || needsGeneration;
    elements.downloadBtn.disabled = downloadDisabled;
    elements.downloadBtnDesktop.disabled = downloadDisabled;
}

function showPlaceholderMessage(text, isError = false) {
    elements.previewCanvas.classList.remove('visible');
    elements.previewPlaceholder.textContent = text;
    elements.previewPlaceholder.classList.remove('hidden');
    elements.previewPlaceholder.classList.toggle('error', isError);
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

        updateBookletCounter();
        generatedPdfBytes = null;
        needsGeneration = true;
        updateButtonStates();

        showPlaceholderMessage('PDF cargado. Haga clic en "Generar Cuadernillo" para procesar.');
    } catch (error) {
        console.error('Error loading PDF:', error);
        showPlaceholderMessage('Error al cargar el PDF. Por favor, intente con otro archivo.', true);
    }
}

async function generateAndPreview() {
    isGenerating = true;
    updateButtonStates();
    elements.generatingOverlay.classList.add('visible');
    elements.controlPanel.classList.remove('open');

    // Yield to the browser so it actually paints the overlay before the
    // (synchronous-under-the-hood) PDF generation loop blocks the main thread.
    await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));

    try {
        const result = await generatePDF();
        if (!result || result.length === 0) {
            throw new Error('PDF generation returned empty result');
        }
        await renderPreview();
        needsGeneration = false;
    } catch (error) {
        console.error('Error generating booklet:', error);
        showPlaceholderMessage('Error al generar el cuadernillo: ' + error.message, true);
    } finally {
        isGenerating = false;
        elements.generatingOverlay.classList.remove('visible');
        updateButtonStates();
    }
}

function updateBookletCounter() {
    if (!pdfDoc || !pdfPages.length) {
        elements.bookletCounter.textContent = '0';
        return;
    }

    const leavesPerQuire = getLeavesPerQuire();
    const pagesPerQuire = leavesPerQuire * 4;
    const numQuires = Math.ceil(pdfPages.length / pagesPerQuire);

    elements.bookletCounter.textContent = numQuires;
}

function getLeavesPerQuire() {
    return Math.max(1, parseInt(elements.signaturesPerBooklet.value) || 1);
}

// ============================================
// LAYOUT CALCULATION
// A "leaf" is one physical sheet: two source pages side by side (with a
// gutter between them), printed recto on one side and verso on the other.
// Several leaves are packed onto one output sheet to save paper.
// ============================================
function calculateLayout() {
    const pageSize = PAGE_SIZES[elements.pageSize.value];
    const scale = parseFloat(elements.scale.value) / 100;
    const gutterPt = (parseFloat(elements.gutterSpace.value) || 0) * CM_TO_PT;
    const marginHPt = (parseFloat(elements.marginH.value) || 0) * CM_TO_PT;
    const marginVPt = (parseFloat(elements.marginV.value) || 0) * CM_TO_PT;

    const sourcePage = pdfPages[0];
    const leafPageWidth = sourcePage.getWidth() * scale;
    const leafPageHeight = sourcePage.getHeight() * scale;

    // One leaf = 2 source pages side by side + the gutter between them
    const leafWidth = leafPageWidth * 2 + gutterPt;
    const leafHeight = leafPageHeight;

    const availableWidth = pageSize.width - 2 * marginHPt;
    const availableHeight = pageSize.height - 2 * marginVPt;

    // Each row reserves LABEL_STRIP_HEIGHT above the leaf's trim area for its label,
    // so the label never lands inside the cut lines even when leaves are packed tight.
    const cellHeight = leafHeight + LABEL_STRIP_HEIGHT;

    const cols = Math.max(1, Math.floor(availableWidth / leafWidth));
    const rows = Math.max(1, Math.floor(availableHeight / cellHeight));
    const leavesPerSheet = cols * rows;

    // Spread any leftover space evenly between leaves (for cut/visual clarity)
    const gapX = cols > 1 ? (availableWidth - leafWidth * cols) / (cols - 1) : 0;
    const gapY = rows > 1 ? (availableHeight - cellHeight * rows) / (rows - 1) : 0;

    return {
        pageSize, scale, gutterPt, marginHPt, marginVPt,
        leafPageWidth, leafPageHeight, leafWidth, leafHeight,
        cols, rows, leavesPerSheet, gapX, gapY
    };
}

// ============================================
// IMPOSITION (quires and leaves)
// ============================================

/**
 * Splits the source page indices into quires (signatures) of
 * `leavesPerQuire * 4` pages each. The final quire is padded with `null`
 * (blank) slots up to the next multiple of 4 if the source doesn't divide
 * evenly - blanks land on the innermost leaf(s) once imposed, never on a
 * cover.
 */
function buildQuires(totalPages, leavesPerQuire) {
    const pagesPerQuire = leavesPerQuire * 4;
    const quires = [];

    for (let start = 0; start < totalPages; start += pagesPerQuire) {
        const end = Math.min(start + pagesPerQuire, totalPages);
        const actualCount = end - start;
        const paddedCount = Math.ceil(actualCount / 4) * 4;

        const localPages = [];
        for (let i = 0; i < paddedCount; i++) {
            localPages.push(i < actualCount ? start + i : null);
        }
        quires.push(localPages);
    }

    return quires;
}

/**
 * Standard saddle-stitch imposition for a quire of N pages (N a multiple of
 * 4), 0-indexed. For leaf i (0 = outermost, counting inward):
 *   recto (front) = [N - 2i - 1, 2i]       (left, right)
 *   verso (back)  = [2i + 1, N - 2i - 2]   (left, right)
 * Folding the whole stack in half and reading front-to-back yields pages
 * 0, 1, 2, ... N-1 in order.
 */
function buildLeaves(quires) {
    const leaves = [];

    quires.forEach((localPages, quireIdx) => {
        const N = localPages.length;
        const leafCount = N / 4;

        for (let i = 0; i < leafCount; i++) {
            leaves.push({
                quireNumber: quireIdx + 1,
                leafNumber: i + 1,
                leavesInQuire: leafCount,
                recto: [localPages[N - 2 * i - 1], localPages[2 * i]],
                verso: [localPages[2 * i + 1], localPages[N - 2 * i - 2]]
            });
        }
    });

    return leaves;
}

// ============================================
// PDF GENERATION
// ============================================
async function generatePDF() {
    if (!pdfDoc || !pdfPages.length) return null;

    const layout = calculateLayout();
    const leavesPerQuire = getLeavesPerQuire();
    const quires = buildQuires(pdfPages.length, leavesPerQuire);
    const leaves = buildLeaves(quires);
    const showCutLines = elements.scissorLines.checked;

    const outputPdf = await PDFLib.PDFDocument.create();
    const labelFont = await outputPdf.embedFont(PDFLib.StandardFonts.Helvetica);

    const embedCache = new Map();
    async function getEmbeddedPage(sourceIdx) {
        if (sourceIdx === null) return null;
        if (!embedCache.has(sourceIdx)) {
            const [copiedPage] = await outputPdf.copyPages(pdfDoc, [sourceIdx]);
            embedCache.set(sourceIdx, await outputPdf.embedPage(copiedPage));
        }
        return embedCache.get(sourceIdx);
    }

    const leavesPerSheet = layout.leavesPerSheet;
    const totalSheets = Math.ceil(leaves.length / leavesPerSheet);

    for (let sheetIdx = 0; sheetIdx < totalSheets; sheetIdx++) {
        const frontPage = outputPdf.addPage([layout.pageSize.width, layout.pageSize.height]);
        const backPage = outputPdf.addPage([layout.pageSize.width, layout.pageSize.height]);

        const startIdx = sheetIdx * leavesPerSheet;
        const endIdx = Math.min(startIdx + leavesPerSheet, leaves.length);

        for (let li = startIdx; li < endIdx; li++) {
            const leaf = leaves[li];
            const localIdx = li - startIdx;
            const row = Math.floor(localIdx / layout.cols);
            const col = localIdx % layout.cols;

            const x = layout.marginHPt + col * (layout.leafWidth + layout.gapX);
            const rowCellHeight = layout.leafHeight + LABEL_STRIP_HEIGHT;
            const y = layout.pageSize.height - layout.marginVPt - (row + 1) * rowCellHeight - row * layout.gapY;

            // Back side is mirrored horizontally: duplex, flip on long edge
            const backX = layout.pageSize.width - x - layout.leafWidth;

            await drawLeafSide(frontPage, leaf.recto, x, y, layout, getEmbeddedPage);
            await drawLeafSide(backPage, leaf.verso, backX, y, layout, getEmbeddedPage);

            const label = `Q${leaf.quireNumber}·${leaf.leafNumber}/${leaf.leavesInQuire}`;
            drawLeafLabel(frontPage, label, x, y, layout, labelFont);
            drawLeafLabel(backPage, label, backX, y, layout, labelFont);

            if (showCutLines) {
                drawCutBorder(frontPage, x, y, layout);
                drawCutBorder(backPage, backX, y, layout);
            }
        }
    }

    generatedPdfBytes = await outputPdf.save();
    return generatedPdfBytes;
}

/**
 * Draws one side (recto or verso) of a leaf: two source pages side by side.
 * `pagePair` entries are absolute source page indices, or null for a blank.
 */
async function drawLeafSide(page, pagePair, x, y, layout, getEmbeddedPage) {
    const [leftIdx, rightIdx] = pagePair;

    const leftEmbed = await getEmbeddedPage(leftIdx);
    if (leftEmbed) {
        page.drawPage(leftEmbed, { x, y, width: layout.leafPageWidth, height: layout.leafPageHeight });
    }

    const rightEmbed = await getEmbeddedPage(rightIdx);
    if (rightEmbed) {
        const rightX = x + layout.leafPageWidth + layout.gutterPt;
        page.drawPage(rightEmbed, { x: rightX, y, width: layout.leafPageWidth, height: layout.leafPageHeight });
    }
}

function drawLeafLabel(page, text, x, y, layout, font) {
    // Sits in the reserved strip above the leaf's top edge, outside its trim area.
    page.drawText(text, {
        x: x + LABEL_INSET,
        y: y + layout.leafHeight + LABEL_GAP,
        size: LABEL_FONT_SIZE,
        font,
        color: PDFLib.rgb(...LABEL_COLOR_RGB)
    });
}

function drawCutBorder(page, x, y, layout) {
    page.drawRectangle({
        x, y,
        width: layout.leafWidth,
        height: layout.leafHeight,
        borderColor: PDFLib.rgb(...CUT_LINE_COLOR_RGB),
        borderWidth: 1,
        borderDashArray: [4, 2]
    });
}

// ============================================
// PREVIEW RENDERING
// ============================================
async function renderPreview() {
    if (!generatedPdfBytes) return;

    if (currentRenderTask) {
        currentRenderTask.cancel();
        currentRenderTask = null;
    }

    try {
        if (typeof pdfjsLib !== 'undefined') {
            pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
        }

        // Pass a COPY so PDF.js doesn't consume our original data
        const loadingTask = pdfjsLib.getDocument({ data: generatedPdfBytes.slice() });
        const pdf = await loadingTask.promise;

        const page = await pdf.getPage(1);
        const viewport = page.getViewport({ scale: 1.0 });

        const canvas = elements.previewCanvas;
        const context = canvas.getContext('2d');

        const previewContainer = elements.previewCanvas.parentElement;
        const maxWidth = previewContainer.clientWidth * 0.9;
        const maxHeight = previewContainer.clientHeight * 0.9;
        const scale = Math.min(maxWidth / viewport.width, maxHeight / viewport.height, 1);

        const scaledViewport = page.getViewport({ scale });

        canvas.width = scaledViewport.width;
        canvas.height = scaledViewport.height;

        currentRenderTask = page.render({ canvasContext: context, viewport: scaledViewport });
        await currentRenderTask.promise;
        currentRenderTask = null;

        elements.previewCanvas.classList.add('visible');
        elements.previewPlaceholder.classList.add('hidden');

    } catch (error) {
        if (error.name === 'RenderingCancelledException') {
            return;
        }

        console.error('Error rendering preview:', error);
        renderSimplePreview();
    }
}

function renderSimplePreview() {
    const canvas = elements.previewCanvas;
    const ctx = canvas.getContext('2d');

    canvas.width = 400;
    canvas.height = 300;

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = '#000000';
    ctx.font = '16px Courier New';
    ctx.textAlign = 'center';
    ctx.fillText('Vista previa generada', canvas.width / 2, canvas.height / 2);
    ctx.font = '12px Courier New';
    ctx.fillText('Descargue el PDF para verlo', canvas.width / 2, canvas.height / 2 + 20);

    elements.previewCanvas.classList.add('visible');
    elements.previewPlaceholder.classList.add('hidden');
}

// ============================================
// DOWNLOAD
// ============================================
function downloadPDF() {
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
