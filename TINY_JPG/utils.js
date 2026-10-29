// Shared by both tabs: Tiny JPG (index.js) and Tiny MP4 (video.js).

const VIDEO_CONTAINERS_BY_TYPE = {
  'video/mp4': 'mp4',
  'video/quicktime': 'mov',
  'video/webm': 'webm',
  'video/x-matroska': 'mkv'
};

const VIDEO_CONTAINERS_BY_EXT = {
  mp4: 'mp4',
  m4v: 'mp4',
  mov: 'mov',
  webm: 'webm',
  mkv: 'mkv'
};

// Some systems hand over .mkv (and occasionally .mov) files with an empty or
// generic MIME type, so the extension is the fallback.
export function videoContainerOf(file) {
  if (VIDEO_CONTAINERS_BY_TYPE[file.type]) return VIDEO_CONTAINERS_BY_TYPE[file.type];
  const ext = (file.name.match(/\.([^./]+)$/) || [])[1];
  return ext ? VIDEO_CONTAINERS_BY_EXT[ext.toLowerCase()] || null : null;
}

export function isVideoFile(file) {
  return Boolean(videoContainerOf(file));
}

export function formatChange(sizeIn, sizeOut) {
  const pct = Math.round((1 - sizeOut / sizeIn) * 100);
  return pct >= 0 ? `−${pct}%` : `+${-pct}%`;
}

export function formatBytes(bytes) {
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
