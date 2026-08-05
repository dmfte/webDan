// Best-effort EXIF/GPS/date preservation. Canvas-based re-encoding produces a
// blob with zero metadata — createImageBitmap + convertToBlob only ever deal
// in pixels — so without this, every compressed photo would silently lose its
// capture date and GPS location. This extracts the raw TIFF-formatted EXIF
// block from the source file (wherever each container hides it) and splices
// it into the compressed JPEG unchanged, so GPS/date/camera tags survive
// as opaque bytes with no need to parse or understand them individually.
//
// The one tag that DOES need touching is Orientation: worker.js decodes with
// {imageOrientation: 'from-image'}, which bakes the correct rotation into the
// output pixels. Copying the original Orientation tag as-is would tell an
// EXIF-aware viewer to rotate an image that's already upright — so it gets
// zeroed to "Normal" here rather than dropped or left as a silent bug.

const EXIF_PREFIX = [0x45, 0x78, 0x69, 0x66, 0x00, 0x00]; // "Exif\0\0"

export function extractExifBytes(bytes, mimeType) {
  try {
    let tiff = null;
    if (mimeType === 'image/jpeg') tiff = extractFromJpeg(bytes);
    else if (mimeType === 'image/png') tiff = extractFromPng(bytes);
    else if (mimeType === 'image/webp') tiff = extractFromWebp(bytes);
    if (tiff) neutralizeOrientation(tiff);
    return tiff;
  } catch {
    return null;
  }
}

export async function injectExif(jpegBlob, tiffBytes) {
  const payloadLength = EXIF_PREFIX.length + tiffBytes.length;
  if (payloadLength + 2 > 0xffff) return jpegBlob; // APP1 length field is 16-bit; bail rather than truncate.

  const original = new Uint8Array(await jpegBlob.arrayBuffer());
  const app1Header = new Uint8Array(4);
  new DataView(app1Header.buffer).setUint16(0, 0xffe1, false);
  new DataView(app1Header.buffer).setUint16(2, payloadLength + 2, false);

  const result = new Uint8Array(2 + app1Header.length + payloadLength + (original.length - 2));
  let o = 0;
  result.set(original.subarray(0, 2), o); o += 2; // SOI
  result.set(app1Header, o); o += app1Header.length;
  result.set(EXIF_PREFIX, o); o += EXIF_PREFIX.length;
  result.set(tiffBytes, o); o += tiffBytes.length;
  result.set(original.subarray(2), o);

  return new Blob([result], { type: 'image/jpeg' });
}

function extractFromJpeg(bytes) {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  if (view.getUint16(0) !== 0xffd8) return null;

  let offset = 2;
  while (offset + 4 <= bytes.length) {
    if (view.getUint8(offset) !== 0xff) break;
    const marker = view.getUint8(offset + 1);

    if (marker === 0xd8 || marker === 0x01 || (marker >= 0xd0 && marker <= 0xd7)) {
      offset += 2;
      continue;
    }
    if (marker === 0xda || marker === 0xd9) break; // start of scan / end of image: no more header segments

    const length = view.getUint16(offset + 2);
    if (marker === 0xe1) {
      const p = offset + 4;
      if (matchesSignature(bytes, p, EXIF_PREFIX)) {
        return bytes.slice(p + EXIF_PREFIX.length, offset + 2 + length);
      }
    }
    offset += 2 + length;
  }
  return null;
}

function extractFromPng(bytes) {
  const sig = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
  if (!matchesSignature(bytes, 0, sig)) return null;

  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  let offset = 8;
  while (offset + 8 <= bytes.length) {
    const length = view.getUint32(offset);
    const type = String.fromCharCode(bytes[offset + 4], bytes[offset + 5], bytes[offset + 6], bytes[offset + 7]);
    if (type === 'eXIf') return bytes.slice(offset + 8, offset + 8 + length);
    if (type === 'IDAT' || type === 'IEND') break; // eXIf must precede IDAT per spec
    offset += 8 + length + 4; // length + type + data + crc
  }
  return null;
}

function extractFromWebp(bytes) {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  if (view.getUint32(0) !== 0x52494646 || view.getUint32(8) !== 0x57454250) return null; // "RIFF"..."WEBP"

  let offset = 12;
  while (offset + 8 <= bytes.length) {
    const fourcc = String.fromCharCode(bytes[offset], bytes[offset + 1], bytes[offset + 2], bytes[offset + 3]);
    const size = view.getUint32(offset + 4, true); // RIFF chunk sizes are little-endian
    if (fourcc === 'EXIF') return bytes.slice(offset + 8, offset + 8 + size);
    offset += 8 + size + (size % 2); // chunks are padded to an even length
  }
  return null;
}

function neutralizeOrientation(tiff) {
  const little = tiff[0] === 0x49 && tiff[1] === 0x49; // 'II'
  const big = tiff[0] === 0x4d && tiff[1] === 0x4d; // 'MM'
  if (!little && !big) return;

  const view = new DataView(tiff.buffer, tiff.byteOffset, tiff.byteLength);
  const ifd0Offset = view.getUint32(4, little);
  if (ifd0Offset + 2 > tiff.length) return;

  const entryCount = view.getUint16(ifd0Offset, little);
  for (let i = 0; i < entryCount; i++) {
    const entryOffset = ifd0Offset + 2 + i * 12;
    if (entryOffset + 12 > tiff.length) break;
    if (view.getUint16(entryOffset, little) === 0x0112) {
      view.setUint16(entryOffset + 8, 1, little); // Orientation, SHORT, count 1 -> "Normal"
      break;
    }
  }
}

function matchesSignature(bytes, offset, signature) {
  if (offset + signature.length > bytes.length) return false;
  for (let i = 0; i < signature.length; i++) {
    if (bytes[offset + i] !== signature[i]) return false;
  }
  return true;
}
