// ===== Constants =====

const DB_NAME = "mp_simple_3";
const DB_VERSION = 1;
const STORE_TRACKS = "tracks";
const LS_PREFIX = "mp3player.";
const ID3_PROBE_BYTES = 262144; // 256KB covers the ID3v2 tag on the vast majority of files
const PROGRESS_SAVE_INTERVAL_MS = 2000;

const DISPLAY_MODES = ["title", "artist", "artist-title"];
const DISPLAY_LABELS = {
    title: "Cancion",
    artist: "Artista",
    "artist-title": "Artista - Cancion",
};

const DEFAULT_SETTINGS = { volume: 0.8, repeat: "off", shuffle: false, displayMode: "title" };

// ===== DOM refs =====

const btnMenu = document.getElementById("btnMenu");
const menuDropdown = document.getElementById("menuDropdown");
const btnClearPlaylist = document.getElementById("btnClearPlaylist");

const playlistPanel = document.getElementById("playlistPanel");
const btnAdd = document.getElementById("btnAdd");
const trackList = document.getElementById("trackList");
const emptyHint = document.getElementById("emptyHint");
const searchInput = document.getElementById("searchInput");
const fileInput = document.getElementById("fileInput");

const npArtist = document.getElementById("npArtist");
const npSong = document.getElementById("npSong");
const lcdProgress = document.getElementById("lcdProgress");
const lcdProgressFill = document.getElementById("lcdProgressFill");
const npElapsed = document.getElementById("npElapsed");
const npTotal = document.getElementById("npTotal");

const btnPrev = document.getElementById("btnPrev");
const btnPlay = document.getElementById("btnPlay");
const btnNext = document.getElementById("btnNext");

const volumeSlider = document.getElementById("volumeSlider");
const btnRepeat = document.getElementById("btnRepeat");
const btnShuffle = document.getElementById("btnShuffle");
const displayModeBtn = document.getElementById("displayModeBtn");
const displayModeLabel = document.getElementById("displayModeLabel");

const audioEl = document.getElementById("audioEl");
const statusBar = document.getElementById("statusBar");
const confirmDialogEl = document.getElementById("confirmDialog");

// ===== State =====

let tracks = [];
let currentIndex = -1;
let currentObjectURL = null;
let isSeeking = false;
let shuffleOrder = [];
let shufflePos = -1;
let settings = loadSettings();
let lastProgressSaveAt = 0;

// ===== IndexedDB layer =====

function openDB() {
    return new Promise((resolve, reject) => {
        const req = indexedDB.open(DB_NAME, DB_VERSION);
        req.onupgradeneeded = () => {
            const db = req.result;
            if (!db.objectStoreNames.contains(STORE_TRACKS)) {
                db.createObjectStore(STORE_TRACKS, { keyPath: "id" });
            }
        };
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
    });
}

async function dbAddTrack(track) {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_TRACKS, "readwrite");
        tx.objectStore(STORE_TRACKS).put(track);
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
    });
}

async function dbGetAllTracks() {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_TRACKS, "readonly");
        const req = tx.objectStore(STORE_TRACKS).getAll();
        req.onsuccess = () => resolve(req.result.sort((a, b) => a.addedAt - b.addedAt));
        req.onerror = () => reject(req.error);
    });
}

async function dbDeleteAllTracks() {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_TRACKS, "readwrite");
        tx.objectStore(STORE_TRACKS).clear();
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
    });
}

// ===== localStorage settings =====

function loadSettings() {
    const s = { ...DEFAULT_SETTINGS };
    try {
        const v = localStorage.getItem(LS_PREFIX + "volume");
        if (v !== null) s.volume = parseFloat(v);
        const r = localStorage.getItem(LS_PREFIX + "repeat");
        if (r) s.repeat = r;
        const sh = localStorage.getItem(LS_PREFIX + "shuffle");
        if (sh !== null) s.shuffle = sh === "true";
        const dm = localStorage.getItem(LS_PREFIX + "displayMode");
        if (dm && DISPLAY_MODES.includes(dm)) s.displayMode = dm;
    } catch (err) {
        console.warn("No se pudo leer la configuracion guardada.", err);
    }
    return s;
}

function saveSetting(key, value) {
    try {
        localStorage.setItem(LS_PREFIX + key, String(value));
    } catch (err) {
        console.warn("No se pudo guardar la configuracion.", err);
    }
}

// Throttled: timeupdate fires several times a second, but a "resume where I left
// off" feature doesn't need sub-second resolution, so most ticks are skipped.
function saveProgress(force = false) {
    if (currentIndex < 0) return;
    const now = Date.now();
    if (!force && now - lastProgressSaveAt < PROGRESS_SAVE_INTERVAL_MS) return;
    lastProgressSaveAt = now;
    saveSetting("currentTrackId", tracks[currentIndex].id);
    saveSetting("currentTime", audioEl.currentTime || 0);
}

function clearSavedProgress() {
    try {
        localStorage.removeItem(LS_PREFIX + "currentTrackId");
        localStorage.removeItem(LS_PREFIX + "currentTime");
    } catch (err) {
        console.warn("No se pudo limpiar el progreso guardado.", err);
    }
}

// ===== ID3v2 parsing =====
// Supports ID3v2.3 / ID3v2.4 text frames (TIT2 = title, TPE1 = artist).
// Falls back silently to filename parsing for v2.2 tags or files without ID3.

function readSyncsafeInt(bytes, offset) {
    return (
        ((bytes[offset] & 0x7f) << 21) |
        ((bytes[offset + 1] & 0x7f) << 14) |
        ((bytes[offset + 2] & 0x7f) << 7) |
        (bytes[offset + 3] & 0x7f)
    );
}

function decodeID3Text(bytes, start, size) {
    if (size <= 0) return "";
    const encodingByte = bytes[start];
    const textBytes = bytes.subarray(start + 1, start + size);
    let text = "";
    try {
        if (encodingByte === 0) {
            text = new TextDecoder("iso-8859-1").decode(textBytes);
        } else if (encodingByte === 1) {
            text = new TextDecoder("utf-16").decode(textBytes);
        } else if (encodingByte === 2) {
            text = new TextDecoder("utf-16be").decode(textBytes);
        } else {
            text = new TextDecoder("utf-8").decode(textBytes);
        }
    } catch (err) {
        text = "";
    }
    return text.replace(/\0+$/, "").trim();
}

function parseID3(buffer) {
    const bytes = new Uint8Array(buffer);
    const result = {};
    if (bytes.length < 10) return result;
    if (bytes[0] !== 0x49 || bytes[1] !== 0x44 || bytes[2] !== 0x33) return result; // "ID3"

    const majorVersion = bytes[3];
    const tagSize = readSyncsafeInt(bytes, 6);
    const end = Math.min(10 + tagSize, bytes.length);
    let offset = 10;

    while (offset + 10 <= end) {
        const frameId = String.fromCharCode(bytes[offset], bytes[offset + 1], bytes[offset + 2], bytes[offset + 3]);
        if (frameId === "\0\0\0\0") break; // padding reached

        let frameSize;
        if (majorVersion >= 4) {
            frameSize = readSyncsafeInt(bytes, offset + 4);
        } else {
            frameSize = (bytes[offset + 4] << 24) | (bytes[offset + 5] << 16) | (bytes[offset + 6] << 8) | bytes[offset + 7];
        }

        const frameStart = offset + 10;
        if (frameSize <= 0 || frameStart + frameSize > bytes.length) break;

        if (frameId === "TIT2") result.title = decodeID3Text(bytes, frameStart, frameSize);
        if (frameId === "TPE1") result.artist = decodeID3Text(bytes, frameStart, frameSize);

        offset = frameStart + frameSize;
    }

    return result;
}

async function safeParseID3(file) {
    try {
        const probe = await file.slice(0, ID3_PROBE_BYTES).arrayBuffer();
        return parseID3(probe);
    } catch (err) {
        console.warn("No se pudo leer ID3 de " + file.name, err);
        return {};
    }
}

function deriveMetadata(fileName, id3) {
    const baseName = fileName.replace(/\.mp3$/i, "");
    if (id3.title) {
        return { title: id3.title, artist: id3.artist || "" };
    }
    const parts = baseName.split(" - ");
    if (parts.length >= 2) {
        return { artist: parts[0].trim(), title: parts.slice(1).join(" - ").trim() };
    }
    return { artist: "", title: baseName };
}

// ===== Utilities =====

function formatTime(seconds) {
    if (!isFinite(seconds) || seconds < 0) return "0:00";
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${String(s).padStart(2, "0")}`;
}

function showStatus(message) {
    statusBar.textContent = message;
    statusBar.hidden = false;
    clearTimeout(showStatus._t);
    showStatus._t = setTimeout(() => {
        statusBar.hidden = true;
    }, 3500);
}

function setRangeFill(input) {
    const min = parseFloat(input.min) || 0;
    const max = parseFloat(input.max) || 100;
    const pct = ((parseFloat(input.value) - min) / (max - min)) * 100;
    input.style.setProperty("--fill", `${pct}%`);
}

function updateLcdProgressAria(current, duration) {
    lcdProgress.setAttribute("aria-valuenow", Math.round(current || 0));
    lcdProgress.setAttribute("aria-valuemax", Math.round(duration || 0));
}

function seekLcdProgressTo(pointerEvent) {
    if (!audioEl.duration) return;
    const rect = lcdProgress.getBoundingClientRect();
    const fraction = Math.min(1, Math.max(0, (pointerEvent.clientX - rect.left) / rect.width));
    audioEl.currentTime = fraction * audioEl.duration;
    lcdProgressFill.style.width = `${fraction * 100}%`;
    npElapsed.textContent = formatTime(audioEl.currentTime);
    updateLcdProgressAria(audioEl.currentTime, audioEl.duration);
}

// ===== Rendering =====

function getFilteredTracks() {
    const q = searchInput.value.trim().toLowerCase();
    if (!q) return tracks;
    return tracks.filter(
        (t) => (t.title || "").toLowerCase().includes(q) || (t.artist || "").toLowerCase().includes(q)
    );
}

function formatTrackLabel(track) {
    switch (settings.displayMode) {
        case "artist":
            return track.artist || "(Sin artista)";
        case "artist-title":
            return track.artist ? `${track.artist} - ${track.title}` : track.title;
        default:
            return track.title;
    }
}

function renderTrackList() {
    const filtered = getFilteredTracks();
    trackList.innerHTML = "";
    emptyHint.hidden = tracks.length > 0;

    filtered.forEach((track) => {
        const li = document.createElement("li");
        li.className = "track-item";
        li.dataset.id = track.id;
        li.textContent = formatTrackLabel(track);
        li.title = track.artist ? `${track.artist} - ${track.title}` : track.title;
        li.tabIndex = 0;
        li.setAttribute("role", "button");
        const realIndex = tracks.indexOf(track);
        if (realIndex === currentIndex) li.classList.add("active");
        li.addEventListener("click", () => loadTrack(realIndex));
        li.addEventListener("keydown", (e) => {
            if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                loadTrack(realIndex);
            }
        });
        trackList.appendChild(li);
    });
}

// ===== Playback =====

function loadTrack(index, opts = {}) {
    const { autoplay = true, resumeTime = 0 } = opts;
    if (index < 0 || index >= tracks.length) return;
    currentIndex = index;
    const track = tracks[index];

    if (currentObjectURL) URL.revokeObjectURL(currentObjectURL);
    currentObjectURL = URL.createObjectURL(track.blob);
    audioEl.src = currentObjectURL;

    npArtist.textContent = `ARTISTA: ${track.artist || "Desconocido"}`;
    npSong.textContent = `CANCION: ${track.title}`;
    npTotal.textContent = track.duration ? formatTime(track.duration) : "0:00";

    if (settings.shuffle) shufflePos = shuffleOrder.indexOf(index);

    if (resumeTime > 0) {
        const applyResume = () => {
            audioEl.currentTime = resumeTime;
            npElapsed.textContent = formatTime(resumeTime);
            if (audioEl.duration) {
                const pct = (resumeTime / audioEl.duration) * 100;
                lcdProgressFill.style.width = `${pct}%`;
                updateLcdProgressAria(resumeTime, audioEl.duration);
            }
            audioEl.removeEventListener("loadedmetadata", applyResume);
        };
        audioEl.addEventListener("loadedmetadata", applyResume);
    }

    if (autoplay) {
        audioEl.play().catch(() => {
            /* Autoplay can be blocked before the first user gesture; ignore. */
        });
    }

    renderTrackList();
}

function ensureShuffleOrder() {
    shuffleOrder = tracks.map((_, i) => i);
    for (let i = shuffleOrder.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffleOrder[i], shuffleOrder[j]] = [shuffleOrder[j], shuffleOrder[i]];
    }
    shufflePos = shuffleOrder.indexOf(currentIndex);
}

function playRelative(direction) {
    if (!tracks.length) return;

    if (settings.shuffle) {
        if (shuffleOrder.length !== tracks.length) ensureShuffleOrder();
        shufflePos = (shufflePos + direction + shuffleOrder.length) % shuffleOrder.length;
        loadTrack(shuffleOrder[shufflePos]);
    } else {
        const nextIndex = (currentIndex + direction + tracks.length) % tracks.length;
        loadTrack(nextIndex);
    }
}

function handleTrackEnded() {
    if (settings.repeat === "one") {
        audioEl.currentTime = 0;
        audioEl.play();
        return;
    }

    const atEnd = settings.shuffle ? shufflePos === shuffleOrder.length - 1 : currentIndex === tracks.length - 1;

    if (settings.repeat === "off" && atEnd) {
        updatePlayButtonIcon();
        return;
    }

    playRelative(1);
}

function updatePlayButtonIcon() {
    btnPlay.classList.toggle("playing", !audioEl.paused && !audioEl.ended);
}

function updateRepeatButtonUI() {
    btnRepeat.classList.toggle("active", settings.repeat !== "off");
    btnRepeat.classList.toggle("repeat-one", settings.repeat === "one");
}

function updateShuffleButtonUI() {
    btnShuffle.classList.toggle("active", settings.shuffle);
}

// ===== File ingestion =====

async function handleFiles(fileList) {
    const files = Array.from(fileList).filter(
        (f) => f.type === "audio/mpeg" || f.name.toLowerCase().endsWith(".mp3")
    );
    if (!files.length) return;

    let added = 0;
    for (const file of files) {
        try {
            const id3 = await safeParseID3(file);
            const meta = deriveMetadata(file.name, id3);
            const track = {
                id: crypto.randomUUID(),
                fileName: file.name,
                artist: meta.artist,
                title: meta.title,
                duration: null,
                blob: file,
                addedAt: Date.now() + added,
            };
            await dbAddTrack(track);
            tracks.push(track);
            added++;
        } catch (err) {
            console.error("No se pudo guardar " + file.name, err);
            showStatus(`No se pudo guardar "${file.name}" (espacio insuficiente?)`);
        }
    }

    if (added) renderTrackList();
}

// ===== Menu / clear playlist =====

function closeMenu() {
    menuDropdown.hidden = true;
    btnMenu.setAttribute("aria-expanded", "false");
}

const clearDialog = new AutoDialog({ dialog: confirmDialogEl, title: "Vaciar lista", ok: true, cancel: true });
clearDialog.onOk(async () => {
    await dbDeleteAllTracks();
    tracks = [];
    currentIndex = -1;
    shuffleOrder = [];
    shufflePos = -1;

    if (currentObjectURL) {
        URL.revokeObjectURL(currentObjectURL);
        currentObjectURL = null;
    }
    audioEl.pause();
    audioEl.removeAttribute("src");
    audioEl.load();
    clearSavedProgress();

    npArtist.textContent = "ARTISTA: —";
    npSong.textContent = "CANCION: —";
    npElapsed.textContent = "0:00";
    npTotal.textContent = "0:00";
    lcdProgressFill.style.width = "0%";
    updateLcdProgressAria(0, 0);

    updatePlayButtonIcon();
    renderTrackList();
    showStatus("Playlist vaciada.");
});

// ===== Event wiring =====

function wireEvents() {
    btnMenu.addEventListener("click", (e) => {
        e.stopPropagation();
        const willOpen = menuDropdown.hidden;
        menuDropdown.hidden = !willOpen;
        btnMenu.setAttribute("aria-expanded", String(willOpen));
    });
    menuDropdown.addEventListener("click", (e) => e.stopPropagation());
    document.addEventListener("click", closeMenu);

    btnClearPlaylist.addEventListener("click", () => {
        closeMenu();
        clearDialog.show();
    });

    btnAdd.addEventListener("click", () => fileInput.click());
    fileInput.addEventListener("change", () => {
        handleFiles(fileInput.files);
        fileInput.value = "";
    });

    playlistPanel.addEventListener("dragover", (e) => {
        e.preventDefault();
        playlistPanel.classList.add("drag-over");
    });
    playlistPanel.addEventListener("dragleave", () => playlistPanel.classList.remove("drag-over"));
    playlistPanel.addEventListener("drop", (e) => {
        e.preventDefault();
        playlistPanel.classList.remove("drag-over");
        handleFiles(e.dataTransfer.files);
    });

    searchInput.addEventListener("input", renderTrackList);

    btnPlay.addEventListener("click", () => {
        if (!tracks.length) return;
        if (currentIndex === -1) {
            loadTrack(0);
            return;
        }
        if (audioEl.paused) audioEl.play();
        else audioEl.pause();
    });

    btnPrev.addEventListener("click", () => playRelative(-1));
    btnNext.addEventListener("click", () => playRelative(1));

    audioEl.addEventListener("play", updatePlayButtonIcon);
    audioEl.addEventListener("pause", () => {
        updatePlayButtonIcon();
        saveProgress(true);
    });
    audioEl.addEventListener("ended", handleTrackEnded);

    audioEl.addEventListener("loadedmetadata", () => {
        if (currentIndex >= 0) tracks[currentIndex].duration = audioEl.duration;
        npTotal.textContent = formatTime(audioEl.duration);
        updateLcdProgressAria(audioEl.currentTime, audioEl.duration);
    });

    audioEl.addEventListener("timeupdate", () => {
        if (!isSeeking) {
            npElapsed.textContent = formatTime(audioEl.currentTime);
            if (audioEl.duration) {
                const pct = (audioEl.currentTime / audioEl.duration) * 100;
                lcdProgressFill.style.width = `${pct}%`;
                updateLcdProgressAria(audioEl.currentTime, audioEl.duration);
            }
        }
        saveProgress();
    });

    window.addEventListener("beforeunload", () => saveProgress(true));

    lcdProgress.addEventListener("pointerdown", (e) => {
        if (!audioEl.duration) return;
        isSeeking = true;
        lcdProgress.setPointerCapture(e.pointerId);
        seekLcdProgressTo(e);
    });
    lcdProgress.addEventListener("pointermove", (e) => {
        if (!isSeeking) return;
        seekLcdProgressTo(e);
    });
    const endLcdSeek = () => {
        if (!isSeeking) return;
        isSeeking = false;
        saveProgress(true);
    };
    lcdProgress.addEventListener("pointerup", endLcdSeek);
    lcdProgress.addEventListener("pointercancel", endLcdSeek);

    lcdProgress.addEventListener("keydown", (e) => {
        if (!audioEl.duration) return;
        const step = 5;
        if (e.key === "ArrowRight") audioEl.currentTime = Math.min(audioEl.duration, audioEl.currentTime + step);
        else if (e.key === "ArrowLeft") audioEl.currentTime = Math.max(0, audioEl.currentTime - step);
        else if (e.key === "Home") audioEl.currentTime = 0;
        else if (e.key === "End") audioEl.currentTime = audioEl.duration;
        else return;
        e.preventDefault();
        lcdProgressFill.style.width = `${(audioEl.currentTime / audioEl.duration) * 100}%`;
        npElapsed.textContent = formatTime(audioEl.currentTime);
        updateLcdProgressAria(audioEl.currentTime, audioEl.duration);
        saveProgress(true);
    });

    volumeSlider.addEventListener("input", () => {
        audioEl.volume = parseFloat(volumeSlider.value);
        setRangeFill(volumeSlider);
        saveSetting("volume", audioEl.volume);
    });

    btnRepeat.addEventListener("click", () => {
        const modes = ["off", "all", "one"];
        const idx = (modes.indexOf(settings.repeat) + 1) % modes.length;
        settings.repeat = modes[idx];
        saveSetting("repeat", settings.repeat);
        updateRepeatButtonUI();
    });

    btnShuffle.addEventListener("click", () => {
        settings.shuffle = !settings.shuffle;
        saveSetting("shuffle", settings.shuffle);
        if (settings.shuffle) ensureShuffleOrder();
        updateShuffleButtonUI();
    });

    displayModeBtn.addEventListener("click", () => {
        const idx = (DISPLAY_MODES.indexOf(settings.displayMode) + 1) % DISPLAY_MODES.length;
        settings.displayMode = DISPLAY_MODES[idx];
        saveSetting("displayMode", settings.displayMode);
        displayModeLabel.textContent = DISPLAY_LABELS[settings.displayMode];
        renderTrackList();
    });
}

// ===== Init =====

function applySettingsToUI() {
    volumeSlider.value = settings.volume;
    audioEl.volume = settings.volume;
    setRangeFill(volumeSlider);

    updateRepeatButtonUI();
    updateShuffleButtonUI();

    displayModeLabel.textContent = DISPLAY_LABELS[settings.displayMode];
}

async function init() {
    applySettingsToUI();
    wireEvents();
    try {
        tracks = await dbGetAllTracks();
    } catch (err) {
        console.error("No se pudo abrir la base de datos local.", err);
        showStatus("No se pudo cargar la playlist guardada.");
        tracks = [];
    }
    renderTrackList();
    restoreLastProgress();
}

function restoreLastProgress() {
    let savedTrackId, savedTime;
    try {
        savedTrackId = localStorage.getItem(LS_PREFIX + "currentTrackId");
        savedTime = parseFloat(localStorage.getItem(LS_PREFIX + "currentTime"));
    } catch (err) {
        return;
    }
    if (!savedTrackId) return;
    const idx = tracks.findIndex((t) => t.id === savedTrackId);
    if (idx === -1) return;
    loadTrack(idx, { autoplay: false, resumeTime: isFinite(savedTime) ? savedTime : 0 });
}

init();
