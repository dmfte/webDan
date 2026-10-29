import { RangeSlider } from '../assets/js/RangeSlider.js';
import { createZipBlob } from './zip.js';
import { formatBytes, formatChange, isVideoFile, videoContainerOf } from './utils.js';
import { Input, ALL_FORMATS, BlobSource, getEncodableVideoCodecs } from './mediabunny.min.mjs';

// The device's hardware encoder is one shared resource, so unlike the image
// tab, running videos side by side only makes each of them slower.
const MAX_CONCURRENT = 1;
// Output is held in memory until downloaded; past this, long encodes and
// memory pressure become realistic.
const LARGE_FILE_THRESHOLD = 500 * 1024 * 1024;
const ACTIVE_STATUSES = ['queued', 'preparing', 'compressing'];

const CONTAINERS = {
  mp4: { label: 'MP4', ext: 'mp4', audioCodec: 'aac', audioLabel: 'AAC', codecs: ['avc', 'hevc', 'av1', 'vp9'] },
  mov: { label: 'MOV', ext: 'mov', audioCodec: 'aac', audioLabel: 'AAC', codecs: ['avc', 'hevc'] },
  webm: { label: 'WebM', ext: 'webm', audioCodec: 'opus', audioLabel: 'Opus', codecs: ['vp9', 'av1', 'vp8'] },
  mkv: { label: 'MKV', ext: 'mkv', audioCodec: 'opus', audioLabel: 'Opus', codecs: ['avc', 'hevc', 'vp9', 'av1', 'vp8'] }
};

const CODEC_LABELS = { avc: 'H.264', hevc: 'H.265', vp9: 'VP9', av1: 'AV1', vp8: 'VP8', prores: 'ProRes' };

// Bitrate = pixels per second × bits per pixel. These are tuned for H.264
// (720×1280 at 30 fps lands at ~1.8 Mbps on Media, vs. the ~8 Mbps a phone
// records at); the newer codecs reach the same look with less.
const QUALITY_BPP = { alta: 0.1, media: 0.065, baja: 0.04 };
const CODEC_EFFICIENCY = { avc: 1, hevc: 0.65, vp9: 0.7, av1: 0.6, vp8: 1.1 };
const QUALITY_ORDER = ['alta', 'media', 'baja'];
const QUALITY_LABELS = { alta: 'Alta', media: 'Media', baja: 'Baja', custom: 'Personalizada' };
const QUALITY_HINTS = {
  alta: 'Casi idéntico al original; la reducción es menor.',
  media: 'El equilibrio: diferencias difíciles de notar y archivos varias veces más ligeros.',
  baja: 'Lo más ligero posible; puede notarse en escenas con mucho movimiento o detalle.'
};
const FORMAT_HINTS = {
  'mp4-avc': 'H.264 se reproduce en cualquier navegador, teléfono o televisor.',
  'mp4-hevc': 'H.265 pesa ~35% menos que H.264, pero Firefox y equipos antiguos pueden no reproducirlo.',
  'mp4-av1': 'AV1 es el más eficiente; necesita navegadores y dispositivos recientes.',
  'webm-vp9': 'VP9 en WebM: libre de patentes e ideal para la web; el audio pasa a Opus.'
};

const vTab = document.getElementById('tabMp4');
const fileAnnouncer = document.getElementById('vFileAnnouncer');
const unsupportedBanner = document.getElementById('vUnsupportedBanner');
const dropZone = document.getElementById('vDropZone');
const fileInput = document.getElementById('vFileInput');
const folderInput = document.getElementById('vFolderInput');
const lastFolderHint = document.getElementById('vLastFolderHint');
const LAST_FOLDER_KEY = 'tinymp4-last-folder';
const convertToggle = document.getElementById('vConvertToggle');
const formatPicker = document.getElementById('vFormatPicker');
const convertHint = document.getElementById('vConvertHint');
const qualityPicker = document.getElementById('vQualityPicker');
const bitrateSliderMount = document.getElementById('vBitrateSlider');
const qualityHint = document.getElementById('vQualityHint');
const resizeToggle = document.getElementById('vResizeToggle');
const resizePicker = document.getElementById('vResizePicker');
const resizeSliderMount = document.getElementById('vResizeSlider');
const fpsToggle = document.getElementById('vFpsToggle');
const fpsPicker = document.getElementById('vFpsPicker');
const audioPicker = document.getElementById('vAudioPicker');
const audioBitrateRow = document.getElementById('vAudioBitrateRow');
const audioBitratePicker = document.getElementById('vAudioBitratePicker');
const audioHint = document.getElementById('vAudioHint');
const rotatePicker = document.getElementById('vRotatePicker');
const tagsToggle = document.getElementById('vTagsToggle');
const keyframePicker = document.getElementById('vKeyframePicker');
const accelPicker = document.getElementById('vAccelPicker');
const largeFileBanner = document.getElementById('vLargeFileBanner');
const resultsEl = document.getElementById('vResults');
const batchCounts = document.getElementById('vBatchCounts');
const batchProgressFill = document.getElementById('vBatchProgressFill');
const fileList = document.getElementById('vFileList');
const savingsSummary = document.getElementById('vSavingsSummary');
const cancelAllBtn = document.getElementById('vCancelAll');
const downloadAllBtn = document.getElementById('vDownloadAll');
const rowTemplate = document.getElementById('videoRowTemplate');
const confirmDialog = document.getElementById('vConfirmDialog');
const confirmText = document.getElementById('vConfirmText');

const entries = new Map();
const queue = [];
let activeCount = 0;
let idCounter = 0;
let announceTimer = null;

const settings = {
  convert: false,
  format: 'mp4-avc',
  quality: 'media',
  customKbps: 2000,
  resize: false,
  resizeMode: '720',
  resizePercent: 50,
  fpsCap: false,
  fps: 30,
  audio: 'keep',
  audioKbps: 128,
  rotate: 0,
  keepTags: true,
  keyFrameInterval: 5,
  hardwareAcceleration: 'no-preference'
};

// Filled in once the encoder probe below resolves; until then nothing is
// started (startEntry waits on it).
let encodableCodecs = new Set();
const supportsWebCodecs = 'VideoEncoder' in window && 'VideoDecoder' in window;
const codecsReady = supportsWebCodecs
  ? getEncodableVideoCodecs(['avc', 'hevc', 'vp9', 'av1', 'vp8'], { width: 1280, height: 720 })
    .then((list) => { encodableCodecs = new Set(list); })
    .catch(() => {})
  : Promise.resolve();

function announce(message) {
  fileAnnouncer.textContent = '';
  clearTimeout(announceTimer);
  announceTimer = setTimeout(() => {
    fileAnnouncer.textContent = message;
  }, 50);
}

// === Settings ===

if (!supportsWebCodecs) {
  // WebCodecs only exists in secure contexts: a phone opening the dev server
  // through the computer's LAN IP over plain http gets no VideoEncoder at
  // all, even in a browser that fully supports it.
  if (!window.isSecureContext) {
    unsupportedBanner.querySelector('p').textContent =
      'Esta página se abrió sin HTTPS, y los navegadores solo activan WebCodecs en páginas seguras (https:// o localhost). ' +
      'Ábrela desde su dirección https:// para comprimir videos.';
  }
  unsupportedBanner.hidden = false;
  fileInput.disabled = true;
  folderInput.disabled = true;
}

codecsReady.then(() => {
  // Same idea as the WebP check on the image tab: a format this browser
  // can't encode is withdrawn rather than left to fail mid-batch.
  for (const input of formatPicker.querySelectorAll('input')) {
    input.disabled = !encodableCodecs.has(input.value.split('-')[1]);
  }
  const checked = formatPicker.querySelector('input:checked');
  if (checked && checked.disabled) {
    const fallback = formatPicker.querySelector('input:not(:disabled)');
    if (fallback) {
      fallback.checked = true;
      settings.format = fallback.value;
    }
  }
  renderConvertHint();
  refreshQueuedPreviews();
});

function renderConvertHint() {
  let text = settings.convert
    ? FORMAT_HINTS[settings.format]
    : 'Sin convertir, cada video conserva su contenedor y su códec (o pasa a H.264 si el navegador no puede codificar el original).';
  const missing = Object.keys(FORMAT_HINTS)
    .map((key) => key.split('-')[1])
    .filter((codec) => supportsWebCodecs && encodableCodecs.size && !encodableCodecs.has(codec));
  if (missing.length) {
    text += ` Este navegador no puede codificar ${missing.map((c) => CODEC_LABELS[c]).join(', ')}.`;
  }
  convertHint.textContent = text;
}

function renderQualityHint() {
  qualityHint.textContent = settings.quality === 'custom'
    ? `La misma tasa de video para todos: ${(settings.customKbps / 1000).toFixed(1)} Mbps, sin importar su resolución.`
    : `${QUALITY_HINTS[settings.quality]} La tasa se calcula para cada video según su resolución y fps.`;
}

function renderAudioHint() {
  if (settings.audio === 'keep') {
    audioHint.textContent = 'Se copia tal cual cuando el formato de salida lo admite; si no, se recomprime.';
  } else if (settings.audio === 'reencode') {
    audioHint.textContent = `Se recomprime a ${settings.audioKbps} kbps: AAC en MP4/MOV, Opus en WebM/MKV. Por debajo de 96k la voz empieza a notarlo.`;
  } else {
    audioHint.textContent = 'Los videos quedarán sin sonido.';
  }
}

function pickedValue(fieldset) {
  return fieldset.querySelector('input:checked').value;
}

function onSettingsChange() {
  renderConvertHint();
  renderQualityHint();
  renderAudioHint();
  refreshQueuedPreviews();
}

convertToggle.addEventListener('change', () => {
  settings.convert = convertToggle.checked;
  formatPicker.disabled = !settings.convert;
  onSettingsChange();
});

formatPicker.addEventListener('change', () => {
  settings.format = pickedValue(formatPicker);
  onSettingsChange();
});

let bitrateSlider = null;
qualityPicker.addEventListener('change', () => {
  settings.quality = pickedValue(qualityPicker);
  bitrateSliderMount.hidden = settings.quality !== 'custom';
  if (settings.quality === 'custom' && !bitrateSlider) {
    // kbps rather than Mbps: RangeSlider steps in whole numbers.
    bitrateSlider = new RangeSlider(bitrateSliderMount, {
      min: 200,
      max: 20000,
      step: 100,
      def: settings.customKbps,
      title: 'kbps',
      ariaLabel: 'Tasa de video en kbps',
      minusLabel: 'Disminuir',
      plusLabel: 'Aumentar',
      color: '#6ecedb'
    });
    bitrateSlider.onValueChange((val) => {
      settings.customKbps = val;
      onSettingsChange();
    });
  }
  onSettingsChange();
});

let resizeSlider = null;
function syncResizeSlider() {
  const showSlider = settings.resize && settings.resizeMode === 'pct';
  resizeSliderMount.hidden = !showSlider;
  if (showSlider && !resizeSlider) {
    resizeSlider = new RangeSlider(resizeSliderMount, {
      min: 1,
      max: 99,
      step: 1,
      def: settings.resizePercent,
      title: '%',
      ariaLabel: 'Porcentaje de redimensionado',
      minusLabel: 'Disminuir',
      plusLabel: 'Aumentar',
      color: '#6ecedb'
    });
    resizeSlider.onValueChange((val) => {
      settings.resizePercent = val;
      onSettingsChange();
    });
  }
}

resizeToggle.addEventListener('change', () => {
  settings.resize = resizeToggle.checked;
  resizePicker.disabled = !settings.resize;
  syncResizeSlider();
  onSettingsChange();
});

resizePicker.addEventListener('change', () => {
  settings.resizeMode = pickedValue(resizePicker);
  syncResizeSlider();
  onSettingsChange();
});

fpsToggle.addEventListener('change', () => {
  settings.fpsCap = fpsToggle.checked;
  fpsPicker.disabled = !settings.fpsCap;
  onSettingsChange();
});

fpsPicker.addEventListener('change', () => {
  settings.fps = Number(pickedValue(fpsPicker));
  onSettingsChange();
});

audioPicker.addEventListener('change', () => {
  settings.audio = pickedValue(audioPicker);
  audioBitrateRow.hidden = settings.audio !== 'reencode';
  onSettingsChange();
});

audioBitratePicker.addEventListener('change', () => {
  settings.audioKbps = Number(pickedValue(audioBitratePicker));
  onSettingsChange();
});

rotatePicker.addEventListener('change', () => {
  settings.rotate = Number(pickedValue(rotatePicker));
  onSettingsChange();
});

tagsToggle.addEventListener('change', () => {
  settings.keepTags = tagsToggle.checked;
});

keyframePicker.addEventListener('change', () => {
  settings.keyFrameInterval = Number(pickedValue(keyframePicker));
});

accelPicker.addEventListener('change', () => {
  settings.hardwareAcceleration = pickedValue(accelPicker);
});

renderConvertHint();
renderQualityHint();
renderAudioHint();

// === Plan: every encode decision for one video, from settings + its probe ===

function presetBitrate(level, codec, width, height, fps) {
  const bpp = QUALITY_BPP[level] * (CODEC_EFFICIENCY[codec] || 1);
  return Math.max(100_000, Math.round(width * height * fps * bpp));
}

function targetDims(width, height) {
  let scale = 1;
  if (settings.resize) {
    scale = settings.resizeMode === 'pct'
      ? settings.resizePercent / 100
      : Math.min(1, Number(settings.resizeMode) / Math.min(width, height));
  }
  // Most encoders reject odd dimensions with 4:2:0 chroma.
  const even = (v) => Math.max(2, Math.round((v * scale) / 2) * 2);
  return { width: even(width), height: even(height) };
}

function buildPlan(entry) {
  const info = entry.info;
  let container;
  let codec;
  if (settings.convert) {
    [container, codec] = settings.format.split('-');
  } else {
    container = entry.container;
    const allowed = CONTAINERS[container].codecs;
    codec = allowed.includes(info.codec) && encodableCodecs.has(info.codec)
      ? info.codec
      : allowed.find((c) => encodableCodecs.has(c));
  }
  if (!codec) return null;

  let { width, height } = info;
  if (settings.rotate % 180) [width, height] = [height, width];
  ({ width, height } = targetDims(width, height));

  const frameRate = settings.fpsCap && info.fps > settings.fps ? settings.fps : null;
  const effectiveFps = frameRate || info.fps || 30;
  const qualityLevel = entry.qualityOverride || settings.quality;
  const videoBitrate = qualityLevel === 'custom'
    ? settings.customKbps * 1000
    : presetBitrate(qualityLevel, codec, width, height, effectiveFps);

  let audio;
  if (!info.hasAudio || settings.audio === 'remove') {
    audio = { discard: true };
  } else if (settings.audio === 'reencode') {
    audio = { codec: CONTAINERS[container].audioCodec, bitrate: settings.audioKbps * 1000, forceTranscode: true };
  } else {
    audio = {};
  }

  return {
    container,
    codec,
    width,
    height,
    frameRate,
    effectiveFps,
    qualityLevel,
    videoBitrate,
    rotate: settings.rotate,
    audio,
    keepTags: settings.keepTags,
    keyFrameInterval: settings.keyFrameInterval,
    hardwareAcceleration: settings.hardwareAcceleration
  };
}

// The next lighter preset to offer when a result came out heavier than the
// original, or null when there's nothing lighter left to try.
function strongerLevel(plan) {
  if (plan.qualityLevel !== 'custom') {
    return QUALITY_ORDER[QUALITY_ORDER.indexOf(plan.qualityLevel) + 1] || null;
  }
  return QUALITY_ORDER.find((level) =>
    presetBitrate(level, plan.codec, plan.width, plan.height, plan.effectiveFps) < plan.videoBitrate
  ) || null;
}

// === File intake ===

fileInput.addEventListener('change', () => {
  handleFiles(fileInput.files);
  fileInput.value = '';
});

folderInput.addEventListener('change', () => {
  const [firstFile] = folderInput.files;
  if (firstFile && firstFile.webkitRelativePath) {
    try {
      localStorage.setItem(LAST_FOLDER_KEY, firstFile.webkitRelativePath.split('/')[0]);
    } catch {
      // Storage can be unavailable (private mode); the hint is a convenience.
    }
    renderLastFolderHint();
  }
  handleFiles(folderInput.files);
  folderInput.value = '';
});

function renderLastFolderHint() {
  let name = null;
  try {
    name = localStorage.getItem(LAST_FOLDER_KEY);
  } catch {
    name = null;
  }
  lastFolderHint.hidden = !name;
  lastFolderHint.textContent = name ? `Última carpeta: ${name}` : '';
}
renderLastFolderHint();

// index.js prevents the browser's default drop navigation for the whole
// window; this side only claims the videos, and a drop made up purely of
// videos switches to this tab.
['dragenter', 'dragover'].forEach((evtName) => {
  window.addEventListener(evtName, () => {
    if (vTab.checked) dropZone.classList.add('drag-over');
  });
});

['dragleave', 'drop'].forEach((evtName) => {
  window.addEventListener(evtName, () => {
    dropZone.classList.remove('drag-over');
  });
});

window.addEventListener('drop', (e) => {
  if (!supportsWebCodecs || !e.dataTransfer || !e.dataTransfer.files.length) return;
  const files = [...e.dataTransfer.files];
  const videos = files.filter(isVideoFile);
  if (!videos.length) return;
  if (videos.length === files.length) vTab.checked = true;
  handleFiles(videos);
});

function handleFiles(fileListArg) {
  let skipped = 0;
  for (const file of fileListArg) {
    if (!isVideoFile(file)) {
      skipped++;
      continue;
    }
    addFile(file);
  }
  if (skipped && vTab.checked) {
    announce(skipped === 1
      ? 'Se omitió 1 archivo que no es un video compatible.'
      : `Se omitieron ${skipped} archivos que no son videos compatibles.`);
  }
}

function addFile(file) {
  const id = `v${++idCounter}`;
  const row = rowTemplate.content.firstElementChild.cloneNode(true);
  row.dataset.id = id;

  const els = {
    name: row.querySelector('.file-name'),
    format: row.querySelector('.file-format'),
    dims: row.querySelector('.file-dims'),
    extra: row.querySelector('.file-extra'),
    error: row.querySelector('.file-error'),
    sizeOriginal: row.querySelector('.file-size-original'),
    statusLabel: row.querySelector('.status-label'),
    sizeResult: row.querySelector('.file-size-result'),
    saving: row.querySelector('.file-saving'),
    actionBtn: row.querySelector('.button-action'),
    notice: row.querySelector('.file-notice'),
    noticeText: row.querySelector('.file-notice-text'),
    strongerBtn: row.querySelector('.notice-stronger'),
    anywayBtn: row.querySelector('.notice-anyway')
  };

  els.name.textContent = file.webkitRelativePath || file.name;
  els.sizeOriginal.textContent = formatBytes(file.size);
  els.dims.textContent = 'Leyendo video…';

  els.actionBtn.addEventListener('click', () => handleActionClick(id));
  els.strongerBtn.addEventListener('click', () => retryStronger(id));
  els.anywayBtn.addEventListener('click', () => downloadAnyway(id));

  fileList.appendChild(row);

  const entry = {
    id,
    file,
    container: videoContainerOf(file),
    isLarge: file.size > LARGE_FILE_THRESHOLD,
    status: 'queued',
    worker: null,
    info: null,
    probe: null,
    // A lighter preset chosen from the "heavier than original" notice; it
    // wins over the global quality setting for this one video.
    qualityOverride: null,
    // Fixed when processing starts; until then the row previews whatever the
    // settings currently say.
    plan: null,
    outputBlob: null,
    outputUrl: null,
    row,
    els
  };
  entries.set(id, entry);

  setStatus(entry, 'queued');

  entry.probe = probeVideo(file).then((info) => {
    entry.info = info;
    updatePreview(entry);
  }).catch((err) => {
    failEntry(entry, err.message || 'No se pudo leer el video.');
  });

  queue.push(id);
  processQueue();
}

async function probeVideo(file) {
  const input = new Input({ source: new BlobSource(file), formats: ALL_FORMATS });
  try {
    const video = await input.getPrimaryVideoTrack();
    if (!video) throw new Error('El archivo no tiene pista de video.');
    const audio = await input.getPrimaryAudioTrack();
    const [duration, stats] = await Promise.all([
      input.computeDuration(),
      video.computePacketStats(120)
    ]);
    return {
      width: video.displayWidth,
      height: video.displayHeight,
      codec: video.codec,
      fps: Math.round(stats.averagePacketRate * 100) / 100,
      duration,
      hasAudio: Boolean(audio),
      bitrate: duration ? (file.size * 8) / duration : 0
    };
  } finally {
    input.dispose();
  }
}

function formatLabel(container, codec) {
  return `${CONTAINERS[container].label} · ${CODEC_LABELS[codec] || codec || '?'}`;
}

function formatDuration(seconds) {
  const s = Math.round(seconds);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const ss = String(s % 60).padStart(2, '0');
  return h ? `${h}:${String(m).padStart(2, '0')}:${ss}` : `${m}:${ss}`;
}

function formatMbps(bps) {
  return `${(bps / 1e6).toFixed(1)} Mbps`;
}

function updatePreview(entry) {
  const { info, els } = entry;
  if (!info) return;
  const plan = entry.plan || (entry.status === 'queued' ? buildPlan(entry) : null);

  const from = formatLabel(entry.container, info.codec);
  const to = plan ? formatLabel(plan.container, plan.codec) : from;
  els.format.textContent = from === to ? from : `${from} → ${to}`;

  let dims = `${info.width}×${info.height}`;
  if (plan && (plan.width !== info.width || plan.height !== info.height)) {
    dims += ` → ${plan.width}×${plan.height}`;
  }
  els.dims.textContent = dims;

  const fps = info.fps ? `${Math.round(info.fps)} fps` : '';
  const parts = [plan && plan.frameRate ? `${fps} → ${plan.frameRate} fps` : fps];
  parts.push(formatDuration(info.duration));
  if (info.bitrate) {
    parts.push(plan ? `${formatMbps(info.bitrate)} → ≈${formatMbps(plan.videoBitrate)}` : formatMbps(info.bitrate));
  }
  els.extra.textContent = parts.filter(Boolean).join(' · ');
}

function refreshQueuedPreviews() {
  for (const entry of entries.values()) {
    if (entry.status === 'queued') updatePreview(entry);
  }
}

// === Processing queue ===

function processQueue() {
  while (activeCount < MAX_CONCURRENT && queue.length > 0) {
    const id = queue.shift();
    const entry = entries.get(id);
    if (!entry || entry.status !== 'queued') continue;
    startEntry(entry);
  }
}

async function startEntry(entry) {
  activeCount++;
  setStatus(entry, 'preparing');
  await Promise.all([entry.probe, codecsReady]);
  // Cancelled, or the probe failed (failEntry already released the slot).
  if (entry.status !== 'preparing') return;

  entry.plan = buildPlan(entry);
  if (!entry.plan) {
    failEntry(entry, 'Este navegador no puede codificar ningún formato compatible con este contenedor. Activa «Convertir» y elige otro formato.');
    return;
  }
  updatePreview(entry);

  const worker = new Worker('video-worker.js', { type: 'module' });
  entry.worker = worker;

  worker.onmessage = (e) => {
    const data = e.data;
    if (data.type === 'status') {
      setStatus(entry, data.status);
    } else if (data.type === 'progress') {
      entry.row.style.setProperty('--progress', data.value);
      entry.els.statusLabel.textContent = `Comprimiendo… ${data.value}%`;
    } else if (data.type === 'done') {
      finishEntry(entry, data.blob);
    } else if (data.type === 'error') {
      failEntry(entry, data.message);
    }
  };

  worker.onerror = () => {
    failEntry(entry, 'Error al procesar el video.');
  };

  worker.postMessage({ file: entry.file, plan: entry.plan });
}

function releaseWorker(entry) {
  if (entry.worker) {
    entry.worker.terminate();
    entry.worker = null;
  }
}

function finishEntry(entry, blob) {
  releaseWorker(entry);
  entry.outputBlob = blob;
  activeCount--;

  if (blob.size >= entry.file.size) {
    // No file is handed over automatically when compressing made it heavier:
    // the row asks first (lighter preset, or download it anyway).
    setStatus(entry, 'larger');
    showLargerNotice(entry);
  } else {
    markDone(entry);
  }
  processQueue();
}

function markDone(entry) {
  entry.outputUrl = URL.createObjectURL(entry.outputBlob);
  entry.els.notice.hidden = true;
  setStatus(entry, 'done');
  showSizes(entry);
}

function showSizes(entry) {
  const size = entry.outputBlob.size;
  entry.els.sizeResult.textContent = formatBytes(size);
  entry.els.saving.textContent = formatChange(entry.file.size, size);
  entry.els.saving.classList.toggle('is-larger', size >= entry.file.size);
}

function showLargerNotice(entry) {
  const { els, plan } = entry;
  const stronger = strongerLevel(plan);
  const change = formatChange(entry.file.size, entry.outputBlob.size);
  showSizes(entry);

  els.noticeText.textContent = stronger
    ? `El resultado no pesa menos que el original (${change}). Prueba con una calidad más ligera o descárgalo igual.`
    : `Incluso con la calidad más ligera, el resultado no pesa menos que el original (${change}). El video ya estaba bien comprimido.`;
  els.strongerBtn.hidden = !stronger;
  if (stronger) els.strongerBtn.textContent = `Probar calidad ${QUALITY_LABELS[stronger]}`;
  els.notice.hidden = false;
  announce(`${els.name.textContent}: el resultado pesa más que el original.`);
}

function retryStronger(id) {
  const entry = entries.get(id);
  if (!entry || entry.status !== 'larger') return;
  const stronger = strongerLevel(entry.plan);
  if (!stronger) return;
  resetOutput(entry);
  entry.qualityOverride = stronger;
  requeue(entry);
}

async function downloadAnyway(id) {
  const entry = entries.get(id);
  if (!entry || entry.status !== 'larger') return;

  // Only the last resort asks: while a lighter preset is still on offer,
  // "download anyway" is already a deliberate pick over that button.
  if (!strongerLevel(entry.plan)) {
    const change = formatChange(entry.file.size, entry.outputBlob.size);
    confirmText.textContent =
      `${entry.els.name.textContent} pesará ${formatBytes(entry.outputBlob.size)} (${change}), ` +
      `no menos que el original de ${formatBytes(entry.file.size)}. ¿Descargarlo de todos modos?`;
    if (!(await confirmLarger())) return;
  }

  markDone(entry);
  downloadEntry(entry);
}

function confirmLarger() {
  return new Promise((resolve) => {
    confirmDialog.returnValue = '';
    confirmDialog.addEventListener('close', () => {
      resolve(confirmDialog.returnValue === 'confirm');
    }, { once: true });
    confirmDialog.showModal();
  });
}

function failEntry(entry, message) {
  if (!ACTIVE_STATUSES.includes(entry.status)) return;
  const wasActive = entry.status !== 'queued';
  releaseWorker(entry);
  if (!wasActive) {
    const qIdx = queue.indexOf(entry.id);
    if (qIdx !== -1) queue.splice(qIdx, 1);
  }
  entry.els.error.hidden = false;
  entry.els.error.textContent = message;
  if (!entry.info) entry.els.dims.textContent = '';
  setStatus(entry, 'error');
  if (wasActive) {
    activeCount--;
    processQueue();
  }
  announce(`${entry.els.name.textContent}: ${message}`);
}

function cancelEntry(id) {
  const entry = entries.get(id);
  if (!entry) return;
  if (!ACTIVE_STATUSES.includes(entry.status)) return;

  // 'preparing' counts as active even before its worker exists (it may
  // still be waiting on the probe).
  const wasActive = entry.status !== 'queued';
  releaseWorker(entry);
  if (!wasActive) {
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

function resetOutput(entry) {
  if (entry.outputUrl) URL.revokeObjectURL(entry.outputUrl);
  entry.outputBlob = null;
  entry.outputUrl = null;
  entry.plan = null;
  entry.row.style.removeProperty('--progress');
  entry.els.notice.hidden = true;
  entry.els.error.hidden = true;
  entry.els.error.textContent = '';
}

function requeue(entry) {
  setStatus(entry, 'queued');
  updatePreview(entry);
  queue.push(entry.id);
  processQueue();
}

function restartEntry(id) {
  const entry = entries.get(id);
  if (!entry) return;
  if (!['cancelled', 'error'].includes(entry.status)) return;
  // A failed probe can't be fixed by retrying the encode; read it again.
  if (!entry.info) {
    entry.els.dims.textContent = 'Leyendo video…';
    entry.probe = probeVideo(entry.file).then((info) => {
      entry.info = info;
      updatePreview(entry);
    }).catch((err) => {
      failEntry(entry, err.message || 'No se pudo leer el video.');
    });
  }
  resetOutput(entry);
  entry.qualityOverride = null;
  requeue(entry);
}

// Same path and basename as the source; only the extension follows the
// output container, and only when the container actually changed.
function outputName(entry) {
  const original = entry.file.webkitRelativePath || entry.file.name;
  if (entry.plan.container === entry.container) return original;
  return `${original.replace(/\.[^./]+$/, '')}.${CONTAINERS[entry.plan.container].ext}`;
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

  // Converting can make two siblings land on the same name (clip.mov and
  // clip.mkv → clip.mp4). The later one goes into a subfolder named after
  // the container it came from.
  const usedNames = new Set();
  const zipEntries = doneEntries.map((e) => {
    let name = outputName(e);
    if (usedNames.has(name)) {
      const slash = name.lastIndexOf('/') + 1;
      name = `${name.slice(0, slash)}desde-${CONTAINERS[e.container].ext}/${name.slice(slash)}`;
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
    a.download = 'tiny-mp4-videos.zip';
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
  done: 'Listo',
  larger: 'Más pesado',
  error: 'Error',
  cancelled: 'Cancelado'
};

const ACTION_LABELS = {
  queued: 'Cancelar',
  preparing: 'Cancelar',
  compressing: 'Cancelar',
  done: 'Descargar',
  larger: '',
  error: 'Reintentar',
  cancelled: 'Reintentar'
};

function setStatus(entry, status) {
  entry.status = status;
  entry.row.dataset.status = status;
  entry.els.statusLabel.textContent = STATUS_LABELS[status] || status;
  if (status !== 'done' && status !== 'larger') {
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

  let done = 0, larger = 0, error = 0, cancelled = 0, bytesIn = 0, bytesOut = 0;
  for (const entry of all) {
    if (entry.status === 'done') {
      done++;
      bytesIn += entry.file.size;
      bytesOut += entry.outputBlob.size;
    } else if (entry.status === 'larger') larger++;
    else if (entry.status === 'error') error++;
    else if (entry.status === 'cancelled') cancelled++;
  }
  const pending = total - done - larger - error - cancelled;

  downloadAllBtn.disabled = pending > 0 || done === 0;

  batchCounts.innerHTML =
    `<strong>${done} / ${total}</strong> listos` +
    (larger ? ` · ${larger} esperan tu decisión` : '') +
    (error ? ` · ${error} con error` : '') +
    (cancelled ? ` · ${cancelled} cancelados` : '') +
    (pending ? ` · ${pending} pendientes` : '');

  const finished = done + larger + error + cancelled;
  batchProgressFill.style.width = `${(finished / total) * 100}%`;

  if (!done) {
    savingsSummary.textContent = '';
  } else if (bytesOut <= bytesIn) {
    const pct = Math.round((1 - bytesOut / bytesIn) * 100);
    savingsSummary.innerHTML =
      `Ahorraste <strong>${pct}%</strong> (${formatBytes(bytesIn - bytesOut)} en total)`;
  } else {
    // Only reachable through "Descargar igual" on heavier results.
    savingsSummary.textContent =
      `Los videos descargados pesan ${formatBytes(bytesOut - bytesIn)} más que los originales.`;
  }
}
