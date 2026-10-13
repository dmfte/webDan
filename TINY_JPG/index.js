import { RangeSlider } from '../assets/js/RangeSlider.js';
import { createZipBlob } from './zip.js';

const MAX_CONCURRENT = 3;
// Every accepted input type is also a type the canvas encoder can write, so
// "keep the original format" is always possible.
const FORMATS = {
  'image/jpeg': { label: 'JPG', ext: 'jpg' },
  'image/png': { label: 'PNG', ext: 'png' },
  'image/webp': { label: 'WebP', ext: 'webp' }
};
// Typical phone/DSLR photos stay well under this even at high resolution;
// past it (big panoramas, scans, upscaled exports) the repeated encode
// passes in worker.js's quality search take noticeably longer.
const LARGE_FILE_THRESHOLD = 20 * 1024 * 1024;
const ACTIVE_STATUSES = ['queued', 'preparing', 'compressing'];

const fileAnnouncer = document.getElementById('fileAnnouncer');
const dropZone = document.getElementById('dropZone');
const fileInput = document.getElementById('fileInput');
const folderInput = document.getElementById('folderInput');
const lastFolderHint = document.getElementById('lastFolderHint');
const LAST_FOLDER_KEY = 'tinyjpg-last-folder';
const convertToggle = document.getElementById('convertToggle');
const formatPicker = document.getElementById('formatPicker');
const convertHint = document.getElementById('convertHint');
const resizeToggle = document.getElementById('resizeToggle');
const resizeSliderMount = document.getElementById('resizeSlider');
const largeFileBanner = document.getElementById('largeFileBanner');
const resultsEl = document.getElementById('results');
const batchCounts = document.getElementById('batchCounts');
const batchProgressFill = document.getElementById('batchProgressFill');
const fileList = document.getElementById('fileList');
const savingsSummary = document.getElementById('savingsSummary');
const cancelAllBtn = document.getElementById('cancelAll');
const downloadAllBtn = document.getElementById('downloadAll');
const fileRowTemplate = document.getElementById('fileRowTemplate');

const entries = new Map();
const queue = [];
let activeCount = 0;
let idCounter = 0;

let convertEnabled = false;
let convertFormat = 'image/webp';
let resizeEnabled = false;
let resizePercent = 80;
let resizeSliderInstance = null;
let announceTimer = null;

function announce(message) {
  fileAnnouncer.textContent = '';
  clearTimeout(announceTimer);
  announceTimer = setTimeout(() => {
    fileAnnouncer.textContent = message;
  }, 50);
}

// === Settings ===

// Safari's canvas can decode WebP but not encode it — asking for it quietly
// yields a PNG instead, so the option is withdrawn rather than left to fail.
const canEncodeWebp = document.createElement('canvas').toDataURL('image/webp').startsWith('data:image/webp');
if (!canEncodeWebp) {
  formatPicker.querySelector('input[value="image/webp"]').disabled = true;
  formatPicker.querySelector('input[value="image/jpeg"]').checked = true;
  convertFormat = 'image/jpeg';
}

function renderConvertHint() {
  if (!convertEnabled) {
    convertHint.textContent = 'Sin convertir, cada imagen se comprime y conserva su formato.';
  } else if (convertFormat === 'image/jpeg') {
    convertHint.textContent = 'Todas las imágenes se comprimen y se entregan en JPG, con sus metadatos EXIF.';
  } else {
    convertHint.textContent =
      `Todas las imágenes se comprimen y se entregan en ${FORMATS[convertFormat].label}. Los metadatos EXIF solo se conservan en JPG.`;
  }
  if (!canEncodeWebp) convertHint.textContent += ' Este navegador no puede generar WebP.';
}

convertToggle.addEventListener('change', () => {
  convertEnabled = convertToggle.checked;
  formatPicker.disabled = !convertEnabled;
  renderConvertHint();
  refreshQueuedPreviews();
});

formatPicker.addEventListener('change', (e) => {
  convertFormat = e.target.value;
  renderConvertHint();
  refreshQueuedPreviews();
});

resizeToggle.addEventListener('change', () => {
  resizeEnabled = resizeToggle.checked;
  resizeSliderMount.hidden = !resizeEnabled;

  if (resizeEnabled && !resizeSliderInstance) {
    resizeSliderInstance = new RangeSlider(resizeSliderMount, {
      min: 1,
      max: 99,
      step: 1,
      def: 80,
      title: '%',
      ariaLabel: 'Porcentaje de redimensionado',
      minusLabel: 'Disminuir',
      plusLabel: 'Aumentar',
      color: '#6ecedb'
    });
    resizePercent = resizeSliderInstance.val;
    resizeSliderInstance.onValueChange((val) => {
      resizePercent = val;
      refreshQueuedPreviews();
    });
  }

  refreshQueuedPreviews();
});

renderConvertHint();

// === File intake ===

fileInput.addEventListener('change', () => {
  handleFiles(fileInput.files);
  fileInput.value = '';
});

folderInput.addEventListener('change', () => {
  const [firstFile] = folderInput.files;
  if (firstFile && firstFile.webkitRelativePath) {
    localStorage.setItem(LAST_FOLDER_KEY, firstFile.webkitRelativePath.split('/')[0]);
    renderLastFolderHint();
  }
  handleFiles(folderInput.files);
  folderInput.value = '';
});

function renderLastFolderHint() {
  const name = localStorage.getItem(LAST_FOLDER_KEY);
  lastFolderHint.hidden = !name;
  lastFolderHint.textContent = name ? `Última carpeta: ${name}` : '';
}
renderLastFolderHint();

// Drops are accepted anywhere on the page, not just on the drop zone — a
// near miss would otherwise make the browser navigate away to the image.
['dragenter', 'dragover'].forEach((evtName) => {
  window.addEventListener(evtName, (e) => {
    e.preventDefault();
    dropZone.classList.add('drag-over');
  });
});

['dragleave', 'drop'].forEach((evtName) => {
  window.addEventListener(evtName, (e) => {
    e.preventDefault();
    dropZone.classList.remove('drag-over');
  });
});

window.addEventListener('drop', (e) => {
  if (e.dataTransfer && e.dataTransfer.files) handleFiles(e.dataTransfer.files);
});

function handleFiles(fileListArg) {
  let skipped = 0;
  for (const file of fileListArg) {
    if (!FORMATS[file.type]) {
      console.warn(`Formato no soportado, se omite: ${file.name}`);
      skipped++;
      continue;
    }
    addFile(file);
  }
  if (skipped) {
    announce(skipped === 1
      ? 'Se omitió 1 archivo con formato no soportado.'
      : `Se omitieron ${skipped} archivos con formato no soportado.`);
  }
}

function addFile(file) {
  const id = `f${++idCounter}`;
  const row = fileRowTemplate.content.firstElementChild.cloneNode(true);
  row.dataset.id = id;

  const els = {
    name: row.querySelector('.file-name'),
    format: row.querySelector('.file-format'),
    dims: row.querySelector('.file-dims'),
    error: row.querySelector('.file-error'),
    sizeOriginal: row.querySelector('.file-size-original'),
    statusLabel: row.querySelector('.status-label'),
    sizeResult: row.querySelector('.file-size-result'),
    saving: row.querySelector('.file-saving'),
    actionBtn: row.querySelector('.button-action')
  };

  els.name.textContent = file.webkitRelativePath || file.name;
  els.sizeOriginal.textContent = formatBytes(file.size);
  els.dims.textContent = 'Leyendo dimensiones…';

  els.actionBtn.addEventListener('click', () => handleActionClick(id));

  fileList.appendChild(row);

  const entry = {
    id,
    file,
    isLarge: file.size > LARGE_FILE_THRESHOLD,
    status: 'queued',
    worker: null,
    width: null,
    height: null,
    // Fixed when processing starts; until then the row previews whatever the
    // settings currently say.
    outputType: null,
    outputBlob: null,
    outputUrl: null,
    row,
    els
  };
  entries.set(id, entry);

  setStatus(entry, 'queued');
  updateFormatLabel(entry);

  readImageDims(file).then(({ width, height }) => {
    // The worker can finish before this decode does; its numbers win.
    if (entry.status === 'done') return;
    entry.width = width;
    entry.height = height;
    updateDimsPreview(entry);
  }).catch(() => {
    if (entry.status !== 'done') els.dims.textContent = '';
  });

  queue.push(id);
  processQueue();
}

function readImageDims(file) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve({ width: img.naturalWidth, height: img.naturalHeight });
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('No se pudo leer la imagen.'));
    };
    img.src = url;
  });
}

function targetType(file) {
  return convertEnabled ? convertFormat : file.type;
}

function updateFormatLabel(entry) {
  const from = FORMATS[entry.file.type].label;
  const to = FORMATS[entry.outputType || targetType(entry.file)].label;
  entry.els.format.textContent = from === to ? from : `${from} → ${to}`;
}

function updateDimsPreview(entry) {
  if (!entry.width) return;
  let text = `${entry.width}×${entry.height}`;
  if (resizeEnabled && entry.status === 'queued') {
    const newW = Math.max(1, Math.round(entry.width * resizePercent / 100));
    const newH = Math.max(1, Math.round(entry.height * resizePercent / 100));
    text += ` → ${newW}×${newH}`;
  }
  entry.els.dims.textContent = text;
}

function refreshQueuedPreviews() {
  for (const entry of entries.values()) {
    if (entry.status !== 'queued') continue;
    updateFormatLabel(entry);
    updateDimsPreview(entry);
  }
}

// === Processing queue ===

function processQueue() {
  while (activeCount < MAX_CONCURRENT && queue.length > 0) {
    const id = queue.shift();
    const entry = entries.get(id);
    if (!entry || entry.status === 'cancelled') continue;
    startEntry(entry);
  }
}

function startEntry(entry) {
  activeCount++;
  entry.outputType = targetType(entry.file);
  updateFormatLabel(entry);
  setStatus(entry, 'preparing');

  const worker = new Worker('worker.js', { type: 'module' });
  entry.worker = worker;

  worker.onmessage = (e) => {
    const data = e.data;
    if (data.type === 'status') {
      setStatus(entry, data.status);
    } else if (data.type === 'done') {
      finishEntry(entry, data.blob, data.width, data.height);
    } else if (data.type === 'error') {
      failEntry(entry, data.message);
    }
  };

  worker.onerror = () => {
    failEntry(entry, 'Error al procesar la imagen.');
  };

  worker.postMessage({
    file: entry.file,
    resizePercent: resizeEnabled ? resizePercent : null,
    outputType: entry.outputType
  });
}

function finishEntry(entry, blob, width, height) {
  entry.worker.terminate();
  entry.worker = null;
  entry.outputBlob = blob;
  entry.outputUrl = URL.createObjectURL(blob);
  entry.width = width;
  entry.height = height;

  entry.els.sizeResult.textContent = formatBytes(blob.size);
  entry.els.saving.textContent = formatChange(entry.file.size, blob.size);
  entry.els.saving.classList.toggle('is-larger', blob.size > entry.file.size);
  entry.els.dims.textContent = `${width}×${height}`;

  setStatus(entry, 'done');
  // The worker hands the source file straight back when it can't beat it.
  if (blob === entry.file || blob.size === entry.file.size) {
    entry.els.statusLabel.textContent = 'Ya optimizada';
  }
  activeCount--;
  processQueue();
}

function failEntry(entry, message) {
  if (entry.worker) {
    entry.worker.terminate();
    entry.worker = null;
  }
  entry.els.error.hidden = false;
  entry.els.error.textContent = message;
  setStatus(entry, 'error');
  activeCount--;
  processQueue();
  announce(`${entry.els.name.textContent}: ${message}`);
}

function cancelEntry(id) {
  const entry = entries.get(id);
  if (!entry) return;
  if (!ACTIVE_STATUSES.includes(entry.status)) return;

  const wasActive = Boolean(entry.worker);
  if (entry.worker) {
    entry.worker.terminate();
    entry.worker = null;
  } else {
    const qIdx = queue.indexOf(id);
    if (qIdx !== -1) queue.splice(qIdx, 1);
  }

  setStatus(entry, 'cancelled');

  if (wasActive) {
    activeCount--;
    processQueue();
  }
}

cancelAllBtn.addEventListener('click', () => {
  for (const id of entries.keys()) cancelEntry(id);
});

function restartEntry(id) {
  const entry = entries.get(id);
  if (!entry) return;
  if (!['cancelled', 'error'].includes(entry.status)) return;

  if (entry.outputUrl) URL.revokeObjectURL(entry.outputUrl);
  entry.outputBlob = null;
  entry.outputUrl = null;
  entry.outputType = null;
  entry.els.error.hidden = true;
  entry.els.error.textContent = '';

  setStatus(entry, 'queued');
  updateFormatLabel(entry);
  updateDimsPreview(entry);
  queue.push(id);
  processQueue();
}

// Same path and basename as the source; only the extension follows the
// output format, and only when the format actually changed.
function outputName(entry) {
  const original = entry.file.webkitRelativePath || entry.file.name;
  if (entry.outputType === entry.file.type) return original;
  return `${original.replace(/\.[^./]+$/, '')}.${FORMATS[entry.outputType].ext}`;
}

function downloadEntry(entry) {
  if (!entry.outputUrl) return;
  const a = document.createElement('a');
  a.href = entry.outputUrl;
  a.download = outputName(entry);
  a.click();
}

function handleActionClick(id) {
  const entry = entries.get(id);
  if (!entry) return;
  if (ACTIVE_STATUSES.includes(entry.status)) {
    cancelEntry(id);
  } else if (entry.status === 'done') {
    downloadEntry(entry);
  } else if (['cancelled', 'error'].includes(entry.status)) {
    restartEntry(id);
  }
}

downloadAllBtn.addEventListener('click', async () => {
  const doneEntries = [...entries.values()].filter((e) => e.status === 'done');
  if (!doneEntries.length) return;

  // Converting can make two siblings land on the same name (foto.png and
  // foto.jpg → foto.webp). The basename stays untouched; the later one goes
  // into a subfolder named after the format it came from.
  const usedNames = new Set();
  const zipEntries = doneEntries.map((e) => {
    let name = outputName(e);
    if (usedNames.has(name)) {
      const slash = name.lastIndexOf('/') + 1;
      name = `${name.slice(0, slash)}desde-${FORMATS[e.file.type].ext}/${name.slice(slash)}`;
    }
    usedNames.add(name);
    return { name, blob: e.outputBlob };
  });

  const originalLabel = downloadAllBtn.textContent;
  downloadAllBtn.disabled = true;
  downloadAllBtn.textContent = 'Generando ZIP…';
  try {
    const zipBlob = await createZipBlob(zipEntries);
    const a = document.createElement('a');
    a.href = URL.createObjectURL(zipBlob);
    a.download = 'tiny-jpg-fotos.zip';
    a.click();
  } finally {
    downloadAllBtn.textContent = originalLabel;
    updateBatchSummary();
  }
});

// === Status / UI helpers ===

const STATUS_LABELS = {
  queued: 'En cola',
  preparing: 'Preparando…',
  compressing: 'Comprimiendo…',
  done: 'Lista',
  error: 'Error',
  cancelled: 'Cancelada'
};

const ACTION_LABELS = {
  queued: 'Cancelar',
  preparing: 'Cancelar',
  compressing: 'Cancelar',
  done: 'Descargar',
  error: 'Reintentar',
  cancelled: 'Reintentar'
};

function setStatus(entry, status) {
  entry.status = status;
  entry.row.dataset.status = status;
  entry.els.statusLabel.textContent = STATUS_LABELS[status] || status;
  if (status !== 'done') {
    entry.els.sizeResult.textContent = '';
    entry.els.saving.textContent = '';
  }
  updateActionButton(entry);
  updateBatchSummary();
}

function updateActionButton(entry) {
  const btn = entry.els.actionBtn;
  btn.textContent = ACTION_LABELS[entry.status] || entry.status;
  const isPrimary = entry.status === 'done';
  btn.classList.toggle('button-primary', isPrimary);
  btn.classList.toggle('button-secondary', !isPrimary);
}

function updateBatchSummary() {
  const all = [...entries.values()];
  const total = all.length;

  largeFileBanner.hidden = !all.some((e) => e.isLarge && ACTIVE_STATUSES.includes(e.status));
  resultsEl.hidden = total === 0;
  cancelAllBtn.disabled = !all.some((e) => ACTIVE_STATUSES.includes(e.status));

  if (total === 0) {
    downloadAllBtn.disabled = true;
    return;
  }

  let done = 0, error = 0, cancelled = 0, bytesIn = 0, bytesOut = 0;
  for (const entry of all) {
    if (entry.status === 'done') {
      done++;
      bytesIn += entry.file.size;
      bytesOut += entry.outputBlob.size;
    } else if (entry.status === 'error') error++;
    else if (entry.status === 'cancelled') cancelled++;
  }
  const pending = total - done - error - cancelled;

  downloadAllBtn.disabled = pending > 0 || done === 0;

  batchCounts.innerHTML =
    `<strong>${done} / ${total}</strong> listas` +
    (error ? ` · ${error} con error` : '') +
    (cancelled ? ` · ${cancelled} canceladas` : '') +
    (pending ? ` · ${pending} pendientes` : '');

  const finished = done + error + cancelled;
  batchProgressFill.style.width = `${(finished / total) * 100}%`;

  if (!done) {
    savingsSummary.textContent = '';
  } else if (bytesOut <= bytesIn) {
    const pct = Math.round((1 - bytesOut / bytesIn) * 100);
    savingsSummary.innerHTML =
      `Ahorraste <strong>${pct}%</strong> (${formatBytes(bytesIn - bytesOut)} en total)`;
  } else {
    // Only reachable by converting to a heavier format (e.g. JPG → PNG).
    savingsSummary.textContent =
      `El formato elegido pesa ${formatBytes(bytesOut - bytesIn)} más que los originales.`;
  }
}

// === Formatting ===

function formatChange(sizeIn, sizeOut) {
  const pct = Math.round((1 - sizeOut / sizeIn) * 100);
  return pct >= 0 ? `−${pct}%` : `+${-pct}%`;
}

function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  const units = ['KB', 'MB', 'GB'];
  let val = bytes / 1024;
  let i = 0;
  while (val >= 1024 && i < units.length - 1) {
    val /= 1024;
    i++;
  }
  return `${val.toFixed(val < 10 ? 2 : 1)} ${units[i]}`;
}
