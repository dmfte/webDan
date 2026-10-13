// Dedicated Worker: one per in-flight file. Cancelling a file just calls
// worker.terminate() from the main thread instead of an in-band abort message —
// the worker's own JS never gets a chance to run again either way.

import { extractExifBytes, injectExif } from './exif.js';
import { encodeQuantizedPng } from './png.js';

// Quality ladder to search, highest first. 0.82 is the commonly-cited
// "visually lossless" knee for photographic JPEG content, but Chrome's built-in
// encoder can still land above an already-optimized source file at that quality
// (measured: a pre-compressed JPEG grew from 779.7KB to 808KB at a flat 0.82).
// So instead of one fixed quality, step down until the result actually beats
// the original — that's the only way to honor "maximum size reduction" as a
// guarantee rather than a best-effort guess. No user-facing quality setting
// per the plan; this ladder is the automatic stand-in for it. WebP shares it.
const QUALITY_STEPS = [0.82, 0.75, 0.68, 0.6, 0.5, 0.4];

self.onmessage = async (event) => {
  const { file, resizePercent, outputType } = event.data;

  try {
    self.postMessage({ type: 'status', status: 'preparing' });

    const tiffBytes = outputType === 'image/jpeg'
      ? extractExifBytes(new Uint8Array(await file.arrayBuffer()), file.type)
      : null;

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
    const ctx = canvas.getContext('2d', { willReadFrequently: outputType === 'image/png' });
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    if (outputType === 'image/jpeg') {
      // JPEG has no alpha; without this, transparent areas of a PNG/WebP
      // source would encode as black.
      ctx.fillStyle = '#fff';
      ctx.fillRect(0, 0, width, height);
    }
    ctx.drawImage(bitmap, 0, 0, width, height);
    bitmap.close();

    self.postMessage({ type: 'status', status: 'compressing' });

    let bestBlob = outputType === 'image/png'
      ? await encodePng(canvas, ctx, width, height)
      : await encodeLossy(canvas, outputType, file.size);

    // Source was already well-optimized in this same format and our encoder
    // can't beat it — hand it back unchanged (its own EXIF is already correct,
    // so metadata injection below is skipped for this path).
    if (bestBlob.size >= file.size && file.type === outputType && !resizePercent) {
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

async function encodeLossy(canvas, type, sourceSize) {
  let bestBlob = null;
  for (const quality of QUALITY_STEPS) {
    const candidate = await canvas.convertToBlob({ type, quality });
    // An encoder that doesn't know the requested type silently answers in PNG.
    if (candidate.type !== type) throw new Error('Este navegador no puede generar ese formato.');
    if (!bestBlob || candidate.size < bestBlob.size) bestBlob = candidate;
    if (candidate.size < sourceSize) break;
  }
  return bestBlob;
}

// Keep whichever is smaller: the canvas's lossless truecolor PNG or the
// palette-quantized one. The quantized version wins for nearly everything.
async function encodePng(canvas, ctx, width, height) {
  const lossless = await canvas.convertToBlob({ type: 'image/png' });
  const quantized = await encodeQuantizedPng(ctx.getImageData(0, 0, width, height));
  return quantized && quantized.size < lossless.size ? quantized : lossless;
}
