// Lossy PNG optimizer. A canvas can only write truecolor PNGs, which are
// lossless and routinely come out *larger* than the file that went in — so on
// its own there is no such thing as "compressing" a PNG in the browser. This
// does what dedicated PNG optimizers do instead: reduce the image to a palette
// of at most 256 RGBA colors (median cut), dither the difference away
// (Floyd–Steinberg), and write an 8-bit indexed PNG by hand. One byte per
// pixel instead of four is where the size reduction comes from.

import { crc32 } from './zip.js';

const MAX_COLORS = 256;
// Colors are bucketed at 5 bits per channel (RGBA → 20-bit key) both for the
// histogram that feeds median cut and for the nearest-color cache.
const BIN_COUNT = 1 << 20;
const PNG_SIGNATURE = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];

export async function encodeQuantizedPng(imageData) {
  if (typeof CompressionStream === 'undefined') return null;

  const { width, height, data } = imageData;
  const exact = collectExactPalette(data);
  const palette = exact ? exact.palette : medianCut(buildHistogram(data));
  const indices = exact
    ? mapExact(data, exact.lookup)
    : mapDithered(data, width, height, palette);

  // Filter type 0 ("None") on every scanline: the predictive filters are
  // designed for continuous-tone samples and only hurt palette indices.
  const raw = new Uint8Array(height * (width + 1));
  for (let y = 0; y < height; y++) {
    raw.set(indices.subarray(y * width, (y + 1) * width), y * (width + 1) + 1);
  }

  // CompressionStream's 'deflate' is zlib-wrapped, exactly what IDAT expects.
  const zlibStream = new Blob([raw]).stream().pipeThrough(new CompressionStream('deflate'));
  const idat = new Uint8Array(await new Response(zlibStream).arrayBuffer());

  const colorCount = palette.length / 4;
  const ihdr = new Uint8Array(13);
  const ihdrView = new DataView(ihdr.buffer);
  ihdrView.setUint32(0, width);
  ihdrView.setUint32(4, height);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 3; // color type: indexed

  const plte = new Uint8Array(colorCount * 3);
  let alphaLength = 0;
  for (let i = 0; i < colorCount; i++) {
    plte.set(palette.subarray(i * 4, i * 4 + 3), i * 3);
    if (palette[i * 4 + 3] < 255) alphaLength = i + 1;
  }
  const trns = new Uint8Array(alphaLength);
  for (let i = 0; i < alphaLength; i++) trns[i] = palette[i * 4 + 3];

  const parts = [new Uint8Array(PNG_SIGNATURE), chunk('IHDR', ihdr), chunk('PLTE', plte)];
  if (alphaLength) parts.push(chunk('tRNS', trns));
  parts.push(chunk('IDAT', idat), chunk('IEND', new Uint8Array(0)));

  return new Blob(parts, { type: 'image/png' });
}

function chunk(type, data) {
  const out = new Uint8Array(12 + data.length);
  const view = new DataView(out.buffer);
  view.setUint32(0, data.length);
  for (let i = 0; i < 4; i++) out[4 + i] = type.charCodeAt(i);
  out.set(data, 8);
  view.setUint32(8 + data.length, crc32(out.subarray(4, 8 + data.length)));
  return out;
}

// Images that already fit in 256 colors (icons, screenshots of flat UI) get
// their exact palette back — indexed and smaller, but still lossless.
function collectExactPalette(data) {
  const pixels = new Uint32Array(data.buffer, data.byteOffset, data.length / 4);
  const lookup = new Map();
  const colors = [];
  for (let i = 0; i < pixels.length; i++) {
    if (lookup.has(pixels[i])) continue;
    if (lookup.size === MAX_COLORS) return null;
    lookup.set(pixels[i], lookup.size);
    colors.push(data[i * 4], data[i * 4 + 1], data[i * 4 + 2], data[i * 4 + 3]);
  }
  return { palette: new Uint8Array(colors), lookup };
}

function mapExact(data, lookup) {
  const pixels = new Uint32Array(data.buffer, data.byteOffset, data.length / 4);
  const indices = new Uint8Array(pixels.length);
  for (let i = 0; i < pixels.length; i++) indices[i] = lookup.get(pixels[i]);
  return indices;
}

function binKey(r, g, b, a) {
  return ((r >> 3) << 15) | ((g >> 3) << 10) | ((b >> 3) << 5) | (a >> 3);
}

function binChannel(key, channel) {
  return (key >>> (15 - 5 * channel)) & 31;
}

// Expand a 5-bit bucket back to the 8-bit value at its center.
function binCenter(value) {
  return (value << 3) | (value >> 2);
}

function buildHistogram(data) {
  const counts = new Uint32Array(BIN_COUNT);
  for (let i = 0; i < data.length; i += 4) {
    // Fully transparent pixels all look the same, whatever RGB they carry.
    if (data[i + 3] === 0) counts[0]++;
    else counts[binKey(data[i], data[i + 1], data[i + 2], data[i + 3])]++;
  }
  return counts;
}

function medianCut(counts) {
  const allKeys = [];
  for (let key = 0; key < BIN_COUNT; key++) {
    if (counts[key]) allKeys.push(key);
  }

  const makeBox = (keys) => {
    const min = [31, 31, 31, 31];
    const max = [0, 0, 0, 0];
    let total = 0;
    for (const key of keys) {
      total += counts[key];
      for (let c = 0; c < 4; c++) {
        const v = binChannel(key, c);
        if (v < min[c]) min[c] = v;
        if (v > max[c]) max[c] = v;
      }
    }
    let axis = 0;
    for (let c = 1; c < 4; c++) {
      if (max[c] - min[c] > max[axis] - min[axis]) axis = c;
    }
    return { keys, total, axis, range: max[axis] - min[axis] };
  };

  const boxes = [makeBox(allKeys)];
  while (boxes.length < MAX_COLORS) {
    let best = -1;
    let bestScore = 0;
    for (let i = 0; i < boxes.length; i++) {
      const score = boxes[i].range * boxes[i].total;
      if (score > bestScore) {
        best = i;
        bestScore = score;
      }
    }
    if (best === -1) break;

    const box = boxes[best];
    box.keys.sort((x, y) => binChannel(x, box.axis) - binChannel(y, box.axis));
    const half = box.total / 2;
    let seen = 0;
    let cut = 0;
    while (cut < box.keys.length - 1) {
      seen += counts[box.keys[cut++]];
      if (seen >= half) break;
    }
    boxes.splice(best, 1, makeBox(box.keys.slice(0, cut)), makeBox(box.keys.slice(cut)));
  }

  const palette = new Uint8Array(boxes.length * 4);
  boxes.forEach((box, i) => {
    const sums = [0, 0, 0, 0];
    for (const key of box.keys) {
      for (let c = 0; c < 4; c++) sums[c] += binCenter(binChannel(key, c)) * counts[key];
    }
    for (let c = 0; c < 4; c++) palette[i * 4 + c] = Math.round(sums[c] / box.total);
  });
  return palette;
}

function mapDithered(data, width, height, palette) {
  const colorCount = palette.length / 4;
  const cache = new Int16Array(BIN_COUNT).fill(-1);

  const nearest = (r, g, b, a) => {
    const key = binKey(r, g, b, a);
    if (cache[key] !== -1) return cache[key];
    const cr = binCenter(r >> 3), cg = binCenter(g >> 3), cb = binCenter(b >> 3), ca = binCenter(a >> 3);
    let best = 0;
    let bestDist = Infinity;
    for (let i = 0; i < colorCount; i++) {
      const dr = cr - palette[i * 4];
      const dg = cg - palette[i * 4 + 1];
      const db = cb - palette[i * 4 + 2];
      const da = ca - palette[i * 4 + 3];
      const dist = dr * dr + dg * dg + db * db + da * da;
      if (dist < bestDist) {
        bestDist = dist;
        best = i;
      }
    }
    cache[key] = best;
    return best;
  };

  const clamp = (v) => (v < 0 ? 0 : v > 255 ? 255 : Math.round(v));
  const indices = new Uint8Array(width * height);
  const transparentIndex = nearest(0, 0, 0, 0);
  // One pixel of padding on each side so the diffusion never needs an edge check.
  let errRow = new Float32Array((width + 2) * 4);
  let errNext = new Float32Array((width + 2) * 4);
  const px = [0, 0, 0, 0];

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = (y * width + x) * 4;
      if (data[i + 3] === 0) {
        indices[y * width + x] = transparentIndex;
        continue;
      }

      const e = (x + 1) * 4;
      for (let c = 0; c < 4; c++) px[c] = clamp(data[i + c] + errRow[e + c]);
      const index = nearest(px[0], px[1], px[2], px[3]);
      indices[y * width + x] = index;

      for (let c = 0; c < 4; c++) {
        const err = px[c] - palette[index * 4 + c];
        errRow[e + 4 + c] += err * 7 / 16;
        errNext[e - 4 + c] += err * 3 / 16;
        errNext[e + c] += err * 5 / 16;
        errNext[e + 4 + c] += err / 16;
      }
    }
    [errRow, errNext] = [errNext, errRow];
    errNext.fill(0);
  }
  return indices;
}
