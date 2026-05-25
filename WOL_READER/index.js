import { RangeSlider } from '/assets/js/RangeSlider.js';

const WORKER_URL = 'https://wol-worker.dmfte-dev.workers.dev';
const WOL_DAILY = 'https://wol.jw.org/es/wol/h/r4/lp-s';

const $date = document.getElementById('date');
const $theme = document.getElementById('theme');
const $body = document.getElementById('body');
const $playBtn = document.getElementById('playBtn');
const $status = document.getElementById('status');
const $prevDay = document.getElementById('prevDayBtn');
const $nextDay = document.getElementById('nextDayBtn');
const $sliderWrap = document.getElementById('sliderWrap');

let audio = null;
let fullText = '';
let currentDate = new Date();
let slider = null;
let isSeeking = false;
let loadController = null;

init();

function wolUrlForDate(date) {
  return `${WOL_DAILY}/${date.getFullYear()}/${date.getMonth() + 1}/${date.getDate()}`;
}

async function loadDay(date) {
  if (loadController) loadController.abort();
  loadController = new AbortController();

  currentDate = date;
  stopAudio();
  $playBtn.disabled = true;
  setStatus('Cargando texto...', true);
  $theme.textContent = '';
  $body.innerHTML = '';

  try {
    const url = wolUrlForDate(date);
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
  }
}

async function init() {
  loadDay(currentDate);
}

$prevDay.addEventListener('click', () => {
  const prev = new Date(currentDate);
  prev.setDate(prev.getDate() - 1);
  loadDay(prev);
});

$nextDay.addEventListener('click', () => {
  const next = new Date(currentDate);
  next.setDate(next.getDate() + 1);
  loadDay(next);
});

function displayText(text) {
  const lines = text.split('\n\n');
  const heading = lines[0] || '';
  const theme = lines[1] || '';
  const body = lines.slice(2).join('\n\n');

  $date.textContent = heading;
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
