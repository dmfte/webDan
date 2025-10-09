export const clamp = (v, min, max) => Math.max(min, Math.min(max, v));
export const degToRad = (d) => d * Math.PI / 180;

export const saveState = (key, obj) => {
  try { localStorage.setItem(key, JSON.stringify(obj)); } catch {}
};
export const loadState = (key, fallback) => {
  try { return JSON.parse(localStorage.getItem(key)) ?? fallback; } catch { return fallback; }
};
