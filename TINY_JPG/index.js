import { RangeSlider } from '../assets/js/RangeSlider.js';
import { createZipBlob } from './zip.js';

const MAX_CONCURRENT = 3;
const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
// Typical phone/DSLR photos stay well under this even at high resolution;
// past it (big panoramas, scans, upscaled exports) the repeated encode
// passes in worker.js's quality search take noticeably longer.
const LARGE_FILE_THRESHOLD = 20 * 1024 * 1024;

const appShell = document.querySelector('.app-shell');
const topbarEl = document.querySelector('.topbar');
const workspaceEl = document.querySelector('.workspace');
const controlsPanel = document.getElementById('controlsPanel');
const panelOpenBtn = document.getElementById('panelOpenBtn');
const panelCloseBtn = document.getElementById('panelCloseBtn');
const fileAnnouncer = document.getElementById('fileAnnouncer');
const dropZone = document.getElementById('dropZone');
const fileInput = document.getElementById('fileInput');
const folderInput = document.getElementById('folderInput');
const lastFolderHint = document.getElementById('lastFolderHint');
const LAST_FOLDER_KEY = 'tinyjpg-last-folder';
const resizeToggle = document.getElementById('resizeToggle');
const resizeSliderMount = document.getElementById('resizeSlider');
const resizePreviewEl = document.getElementById('resizePreview');
const largeFileBanner = document.getElementById('largeFileBanner');
const batchSummary = document.getElementById('batchSummary');
const batchCounts = document.getElementById('batchCounts');
const batchProgressFill = document.getElementById('batchProgressFill');
const fileList = document.getElementById('fileList');
const emptyHint = document.getElementById('emptyHint');
const cancelAllBtn = document.getElementById('cancelAll');
const downloadAllBtn = document.getElementById('downloadAll');
const fileRowTemplate = document.getElementById('fileRowTemplate');

const entries = new Map();
const queue = [];
let activeCount = 0;
let idCounter = 0;

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

resizeToggle.addEventListener('change', () => {
  resizeEnabled = resizeToggle.checked;
  resizeSliderMount.hidden = !resizeEnabled;
  resizePreviewEl.hidden = !resizeEnabled;

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
      refreshResizePreviews();
    });
  }

  refreshResizePreviews();
});

const mobileQuery = window.matchMedia('(max-width: 900px)');
let panelOpen = false;

function getFocusableChildren(container) {
  return Array.from(
    container.querySelectorAll(
      'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
    )
  ).filter((el) => el.offsetParent !== null);
}

function trapFocus(e) {
  const focusable = getFocusableChildren(controlsPanel);
  if (!focusable.length) return;
  const first = focusable[0];
  const last = focusable[focusable.length - 1];
  if (e.shiftKey && document.activeElement === first) {
    e.preventDefault();
    last.focus();
  } else if (!e.shiftKey && document.activeElement === last) {
    e.preventDefault();
    first.focus();
  }
}

function onPanelKeydown(e) {
  if (e.key === 'Escape') {
    e.preventDefault();
    closePanel();
  } else if (e.key === 'Tab') {
    trapFocus(e);
  }
}

function openPanel() {
  if (!mobileQuery.matches || panelOpen) return;
  panelOpen = true;
  appShell.classList.add('is-panel-open');
  panelOpenBtn.setAttribute('aria-expanded', 'true');
  controlsPanel.setAttribute('role', 'dialog');
  controlsPanel.setAttribute('aria-modal', 'true');
  topbarEl.inert = true;
  workspaceEl.inert = true;
  document.addEventListener('keydown', onPanelKeydown);
  const firstFocusable = getFocusableChildren(controlsPanel)[0];
  (firstFocusable || controlsPanel).focus();
}

function closePanel({ returnFocus = true } = {}) {
  if (!panelOpen) return;
  panelOpen = false;
  appShell.classList.remove('is-panel-open');
  panelOpenBtn.setAttribute('aria-expanded', 'false');
  controlsPanel.removeAttribute('role');
  controlsPanel.removeAttribute('aria-modal');
  topbarEl.inert = false;
  workspaceEl.inert = false;
  document.removeEventListener('keydown', onPanelKeydown);
  if (returnFocus) panelOpenBtn.focus();
}

panelOpenBtn.addEventListener('click', openPanel);
panelCloseBtn.addEventListener('click', () => closePanel());

document.addEventListener('click', (e) => {
  if (!panelOpen) return;
  if (controlsPanel.contains(e.target) || e.target.closest('.panel-open')) return;
  closePanel({ returnFocus: false });
});

mobileQuery.addEventListener('change', (e) => {
  if (!e.matches) closePanel({ returnFocus: false });
});

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

['dragenter', 'dragover'].forEach((evtName) => {
  dropZone.addEventListener(evtName, (e) => {
    e.preventDefault();
    dropZone.classList.add('drag-over');
  });
});

['dragleave', 'drop'].forEach((evtName) => {
  dropZone.addEventListener(evtName, (e) => {
    e.preventDefault();
    dropZone.classList.remove('drag-over');
  });
});

dropZone.addEventListener('drop', (e) => {
  if (e.dataTransfer && e.dataTransfer.files) handleFiles(e.dataTransfer.files);
});

function handleFiles(fileListArg) {
  for (const file of fileListArg) {
    if (!ACCEPTED_TYPES.includes(file.type)) {
      console.warn(`Formato no soportado, se omite: ${file.name}`);
      continue;
    }
    addFile(file);
  }
}

function addFile(file) {
  const id = `f${++idCounter}`;
  const row = fileRowTemplate.content.firstElementChild.cloneNode(true);
  row.dataset.id = id;

  const els = {
    name: row.querySelector('.file-name'),
    sizeOriginal: row.querySelector('.file-size-original'),
    dims: row.querySelector('.file-dims'),
    chip: row.querySelector('.status-chip'),
    result: row.querySelector('.file-result'),
    actionBtn: row.querySelector('.button-action')
  };

  els.name.textContent = file.webkitRelativePath || file.name;
  els.sizeOriginal.textContent = formatBytes(file.size);
  els.dims.textContent = 'Leyendo dimensiones…';

  els.actionBtn.addEventListener('click', () => handleActionClick(id));

  fileList.appendChild(row);
  emptyHint.hidden = true;

  const entry = {
    id,
    file,
    isLarge: file.size > LARGE_FILE_THRESHOLD,
    status: 'queued',
    worker: null,
    width: null,
    height: null,
    outputBlob: null,
    outputUrl: null,
    row,
    els
  };
  entries.set(id, entry);

  setStatus(entry, 'queued');
  updateBatchSummary();

  readImageDims(file).then(({ width, height }) => {
    entry.width = width;
    entry.height = height;
    updateDimsPreview(entry);
  }).catch(() => {
    els.dims.textContent = '';
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

function refreshResizePreviews() {
  for (const entry of entries.values()) {
    if (entry.status === 'queued') updateDimsPreview(entry);
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
  setStatus(entry, 'resizing');

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
    resizePercent: resizeEnabled ? resizePercent : null
  });
}

function finishEntry(entry, blob, width, height) {
  entry.worker.terminate();
  entry.worker = null;
  entry.outputBlob = blob;
  entry.outputUrl = URL.createObjectURL(blob);
  entry.width = width;
  entry.height = height;

  const savedPct = Math.max(0, Math.round((1 - blob.size / entry.file.size) * 100));

  entry.els.result.hidden = false;
  entry.els.result.textContent = `${formatBytes(blob.size)} · ${savedPct}% menos`;
  entry.els.dims.textContent = `${width}×${height}`;

  setStatus(entry, 'done');
  activeCount--;
  processQueue();
  updateBatchSummary();
}

function failEntry(entry, message) {
  if (entry.worker) {
    entry.worker.terminate();
    entry.worker = null;
  }
  entry.els.result.hidden = false;
  entry.els.result.textContent = message;
  setStatus(entry, 'error');
  activeCount--;
  processQueue();
  updateBatchSummary();
  announce(`${entry.els.name.textContent}: ${message}`);
}

function cancelEntry(id) {
  const entry = entries.get(id);
  if (!entry) return;
  if (['done', 'error', 'cancelled'].includes(entry.status)) return;

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
  updateBatchSummary();
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
  entry.els.result.hidden = true;
  entry.els.result.textContent = '';

  setStatus(entry, 'queued');
  queue.push(id);
  processQueue();
}

function downloadEntry(entry) {
  if (!entry.outputUrl) return;
  const a = document.createElement('a');
  a.href = entry.outputUrl;
  a.download = outputFileName(entry.file.webkitRelativePath || entry.file.name);
  a.click();
}

function handleActionClick(id) {
  const entry = entries.get(id);
  if (!entry) return;
  if (['queued', 'resizing', 'compressing'].includes(entry.status)) {
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

  const originalLabel = downloadAllBtn.textContent;
  downloadAllBtn.disabled = true;
  downloadAllBtn.textContent = 'Generando ZIP…';
  try {
    const zipBlob = await createZipBlob(
      doneEntries.map((e) => ({ name: zipEntryFileName(e.file.webkitRelativePath || e.file.name), blob: e.outputBlob }))
    );
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
  resizing: 'Redimensionando',
  compressing: 'Comprimiendo',
  done: 'Lista',
  error: 'Error',
  cancelled: 'Cancelada'
};

const ACTION_LABELS = {
  queued: 'Cancelar',
  resizing: 'Cancelar',
  compressing: 'Cancelar',
  done: 'Descargar',
  error: 'Optimizar',
  cancelled: 'Optimizar'
};

function setStatus(entry, status) {
  entry.status = status;
  entry.row.dataset.status = status;
  entry.els.chip.textContent = STATUS_LABELS[status] || status;
  updateActionButton(entry);
  updateBatchSummary();
}

function updateActionButton(entry) {
  const btn = entry.els.actionBtn;
  btn.textContent = ACTION_LABELS[entry.status] || entry.status;
  const isPrimary = entry.status === 'done' || entry.status === 'cancelled' || entry.status === 'error';
  btn.classList.toggle('button-primary', isPrimary);
  btn.classList.toggle('button-secondary', !isPrimary);
}

function updateBatchSummary() {
  largeFileBanner.hidden = ![...entries.values()].some(
    (e) => e.isLarge && ['queued', 'resizing', 'compressing'].includes(e.status)
  );

  const total = entries.size;
  batchSummary.hidden = total === 0;
  cancelAllBtn.disabled = ![...entries.values()].some(
    (e) => !['done', 'error', 'cancelled'].includes(e.status)
  );

  if (total === 0) {
    downloadAllBtn.disabled = true;
    return;
  }

  let done = 0, error = 0, cancelled = 0;
  for (const entry of entries.values()) {
    if (entry.status === 'done') done++;
    else if (entry.status === 'error') error++;
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
}

// === Formatting ===

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

function outputFileName(originalName) {
  const base = originalName.replace(/\.[^./\\]+$/, '');
  return `${base}-comprimido.jpg`;
}

// The zip itself already signals "these are the compressed outputs" (its
// own filename), so entries inside keep their original name — just with
// the extension corrected to .jpg, since output is always JPG regardless
// of input format.
function zipEntryFileName(originalName) {
  const base = originalName.replace(/\.[^./\\]+$/, '');
  return `${base}.jpg`;
}
