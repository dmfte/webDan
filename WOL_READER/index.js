const WORKER_URL = 'https://wol-worker.dmfte-dev.workers.dev';
const WOL_DAILY = 'https://wol.jw.org/es/wol/h/r4/lp-s';

const $date = document.getElementById('date');
const $theme = document.getElementById('theme');
const $body = document.getElementById('body');
const $playBtn = document.getElementById('playBtn');
const $stopBtn = document.getElementById('stopBtn');
const $status = document.getElementById('status');
const $prevDay = document.getElementById('prevDayBtn');
const $nextDay = document.getElementById('nextDayBtn');

let audio = null;
let fullText = '';
let currentDate = new Date();

init();

function wolUrlForDate(date) {
  const today = new Date();
  const isToday = date.getFullYear() === today.getFullYear()
    && date.getMonth() === today.getMonth()
    && date.getDate() === today.getDate();
  if (isToday) return WOL_DAILY;
  return `${WOL_DAILY}/${date.getFullYear()}/${date.getMonth() + 1}/${date.getDate()}`;
}

async function loadDay(date) {
  stopAudio();
  $playBtn.disabled = true;
  setStatus('Cargando texto...');
  $theme.textContent = '';
  $body.innerHTML = '';

  try {
    const url = wolUrlForDate(date);
    const res = await fetch(`${WORKER_URL}/?url=${encodeURIComponent(url)}`);
    if (!res.ok) throw new Error(`Worker: ${res.status}`);
    const text = await res.text();
    currentDate = date;
    displayText(text);
    $playBtn.disabled = false;
    setStatus('');
  } catch (e) {
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

$playBtn.addEventListener('click', () => speak(fullText));
$stopBtn.addEventListener('click', stopAudio);

async function speak(text) {
  $playBtn.disabled = true;
  $playBtn.style.display = 'none';
  $stopBtn.style.display = '';
  setStatus('Generando audio...');

  try {
    const res = await fetch(`${WORKER_URL}/tts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text })
    });

    if (!res.ok) throw new Error(`TTS: ${res.status}`);

    const blob = await res.blob();
    audio = new Audio(URL.createObjectURL(blob));
    audio.play();
    setStatus('Reproduciendo...');

    audio.addEventListener('ended', () => {
      resetControls();
      setStatus('');
    });
  } catch (e) {
    setStatus('Error TTS: ' + e.message);
    resetControls();
  }
}

function stopAudio() {
  if (audio) {
    audio.pause();
    audio.currentTime = 0;
    audio = null;
  }
  resetControls();
  setStatus('');
}

function resetControls() {
  $playBtn.disabled = false;
  $playBtn.style.display = '';
  $stopBtn.style.display = 'none';
}

function setStatus(msg) {
  if (msg) {
    $status.innerHTML = '<span class="loading"></span><br/>' + msg;
  } else {
    $status.textContent = '';
  }
}
