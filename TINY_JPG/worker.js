// Dedicated Worker: one per in-flight file. Cancelling a file just calls
// worker.terminate() from the main thread instead of an in-band abort message —
// the worker's own JS never gets a chance to run again either way.

import { extractExifBytes, injectExif } from './exif.js';

// Quality ladder to search, highest first. 0.82 is the commonly-cited
// "visually lossless" knee for photographic JPEG content, but Chrome's built-in
// encoder can still land above an already-optimized source file at that quality
// (measured: a pre-compressed JPEG grew from 779.7KB to 808KB at a flat 0.82).
// So instead of one fixed quality, step down until the result actually beats
// the original — that's the only way to honor "maximum size reduction" as a
// guarantee rather than a best-effort guess. No user-facing quality setting
// per the plan; this ladder is the automatic stand-in for it.
const QUALITY_STEPS = [0.82, 0.75, 0.68, 0.6, 0.5, 0.4];

self.onmessage = async (event) => {
  const { file, resizePercent } = event.data;

  try {
    self.postMessage({ type: 'status', status: 'resizing' });

    const tiffBytes = extractExifBytes(new Uint8Array(await file.arrayBuffer()), file.type);

    // 'from-image' bakes any EXIF rotation into the pixels themselves, so the
    // Orientation tag carried over below (already neutralized to "Normal" by
    // extractExifBytes) won't cause a double-rotation in EXIF-aware viewers.
    const bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' });
    let width = bitmap.width;
    let height = bitmap.height;

    if (resizePercent) {
      width = Math.max(1, Math.round(width * resizePercent / 100));
      height = Math.max(1, Math.round(height * resizePercent / 100));
    }

    const canvas = new OffscreenCanvas(width, height);
    const ctx = canvas.getContext('2d');
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(bitmap, 0, 0, width, height);
    bitmap.close();

    self.postMessage({ type: 'status', status: 'compressing' });

    let bestBlob = null;
    for (const quality of QUALITY_STEPS) {
      const candidate = await canvas.convertToBlob({ type: 'image/jpeg', quality });
      if (!bestBlob || candidate.size < bestBlob.size) bestBlob = candidate;
      if (candidate.size < file.size) break;
    }

    // Source was already a well-optimized, unresized JPEG that our encoder
    // can't beat at any quality — hand it back unchanged (its own EXIF is
    // already correct, so metadata injection below is skipped for this path).
    if (bestBlob.size >= file.size && file.type === 'image/jpeg' && !resizePercent) {
      self.postMessage({ type: 'done', blob: file, width, height });
      return;
    }

    if (tiffBytes) {
      try {
        bestBlob = await injectExif(bestBlob, tiffBytes);
      } catch {
        // Keep the metadata-less blob rather than fail the whole file over this.
      }
    }

    self.postMessage({ type: 'done', blob: bestBlob, width, height });
  } catch (err) {
    self.postMessage({ type: 'error', message: err && err.message ? err.message : 'Error desconocido.' });
  }
};
