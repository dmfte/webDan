import { RangeSlider } from '../assets/js/RangeSlider.js';

const WORKER_URL = 'https://wol-worker.dmfte-dev.workers.dev';
// const WORKER_URL = 'http://localhost:8789';

const $heading = document.getElementById('heading');
const $theme = document.getElementById('theme');
const $body = document.getElementById('body');
const $playBtn = document.getElementById('playBtn');
const $status = document.getElementById('status');
const $sliderWrap = document.getElementById('sliderWrap');
const $urlInput = document.getElementById('urlInput');
const $fetchBtn = document.getElementById('fetchBtn');

let audio = null;
let fullText = '';
let slider = null;
let isSeeking = false;
let loadController = null;

function isWolUrl(url) {
  try {
    return new URL(url).hostname === 'wol.jw.org';
  } catch {
    return false;
  }
}

async function loadUrl(url) {
  if (loadController) loadController.abort();
  loadController = new AbortController();

  stopAudio();
  $playBtn.disabled = true;
  setStatus('Cargando texto...', true);
  $heading.textContent = '';
  $theme.textContent = '';
  $body.innerHTML = '';

  try {
    const res = await fetch(`${WORKER_URL}/?url=${encodeURIComponent(url)}`, {
      signal: loadController.signal
    });
    if (!res.ok) throw new Error(`Worker: ${res.status}`);
    const text = await res.text();
    displayText(text);
    $playBtn.disabled = false;
    setStatus('');
  } catch (e) {
    if (e.name === 'AbortError') return;
    setStatus('Error al cargar: ' + e.message);
    $playBtn.disabled = false;
  }
}

$fetchBtn.addEventListener('click', () => {
  const url = $urlInput.value.trim();
  if (!isWolUrl(url)) {
    setStatus('Solo se admiten URLs de wol.jw.org');
    return;
  }
  loadUrl(url);
});

$urlInput.addEventListener('keydown', e => {
  if (e.key === 'Enter') $fetchBtn.click();
});

function displayText(text) {
  const parts = text.split('\n\n');
  const heading = parts[0] || '';
  const theme = parts[1] || '';
  const body = parts.slice(2).join('\n\n');

  $heading.textContent = heading;
  $theme.textContent = theme;

  $body.innerHTML = body.replace(
    /\[([^\]]+)\]/g,
    '<span class="verse-inline">[$1]</span>'
  );

  fullText = text;
}

$playBtn.addEventListener('click', toggleAudio);

async function toggleAudio() {
  if (audio && !audio.paused) {
    audio.pause();
    $playBtn.innerHTML = '&#9654; Reanudar';
    return;
  }

  if (audio && audio.paused) {
    audio.play();
    $playBtn.innerHTML = '&#9646;&#9646; Pausar';
    return;
  }

  $playBtn.disabled = true;
  setStatus('Generando audio...', true);

  try {
    const res = await fetch(`${WORKER_URL}/tts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: fullText })
    });

    if (!res.ok) throw new Error(`TTS: ${res.status}`);

    const blob = await res.blob();
    audio = new Audio(URL.createObjectURL(blob));

    audio.addEventListener('loadedmetadata', () => {
      initSlider(audio.duration);
    });

    audio.play();
    $playBtn.disabled = false;
    $playBtn.innerHTML = '&#9646;&#9646; Pausar';
    $status.hidden = true;

    audio.addEventListener('timeupdate', () => {
      if (!slider) return;
      isSeeking = true;
      slider.val = { value: Math.floor(audio.currentTime) };
      isSeeking = false;
    });

    audio.addEventListener('ended', () => {
      audio = null;
      hideSlider();
      $playBtn.innerHTML = '&#9654; Leer';
      setStatus('');
    });
  } catch (e) {
    setStatus('Error TTS: ' + e.message);
    $playBtn.disabled = false;
  }
}

function initSlider(duration) {
  const max = Math.floor(duration);
  $sliderWrap.innerHTML = '';
  $sliderWrap.hidden = false;
  slider = new RangeSlider($sliderWrap, {
    min: 0, max, step: 0.5, def: 0,
    title: '', color: '#4fc3f7'
  });
  slider.onValueChange(val => {
    if (!audio || isSeeking) return;
    audio.currentTime = val;
  });
}

function hideSlider() {
  $sliderWrap.hidden = true;
  $sliderWrap.innerHTML = '';
  slider = null;
}

function stopAudio() {
  if (audio) {
    audio.pause();
    audio.currentTime = 0;
    audio = null;
  }
  hideSlider();
  $playBtn.innerHTML = '&#9654; Leer';
  $playBtn.disabled = false;
  setStatus('');
}

function setStatus(msg, loading = false) {
  if (msg) {
    $status.hidden = false;
    $status.innerHTML = (loading ? '<span class="loading"></span><br/>' : '') + msg;
  } else {
    $status.hidden = true;
    $status.textContent = '';
  }
}
