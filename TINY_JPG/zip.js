// Minimal ZIP writer, "store" method only (no compression). The files going
// in are already-compressed JPEGs, so re-compressing them inside the archive
// buys nothing — storing them raw skips needing a DEFLATE implementation
// entirely and keeps this a zero-dependency module like the rest of the repo.

function crc32(bytes) {
  let crc = ~0;
  for (let i = 0; i < bytes.length; i++) {
    crc ^= bytes[i];
    for (let j = 0; j < 8; j++) {
      crc = (crc >>> 1) ^ (0xedb88320 & -(crc & 1));
    }
  }
  return ~crc >>> 0;
}

function dosDateTime(date) {
  const time = ((date.getHours() & 0x1f) << 11) | ((date.getMinutes() & 0x3f) << 5) | ((date.getSeconds() >> 1) & 0x1f);
  const day = (((date.getFullYear() - 1980) & 0x7f) << 9) | (((date.getMonth() + 1) & 0xf) << 5) | (date.getDate() & 0x1f);
  return { time, day };
}

export async function createZipBlob(entries) {
  const encoder = new TextEncoder();
  const { time, day } = dosDateTime(new Date());
  const chunks = [];
  const centralRecords = [];
  let offset = 0;

  for (const { name, blob } of entries) {
    const nameBytes = encoder.encode(name);
    const data = new Uint8Array(await blob.arrayBuffer());
    const crc = crc32(data);

    const local = new DataView(new ArrayBuffer(30));
    local.setUint32(0, 0x04034b50, true);
    local.setUint16(4, 20, true);
    local.setUint16(6, 0, true);
    local.setUint16(8, 0, true);
    local.setUint16(10, time, true);
    local.setUint16(12, day, true);
    local.setUint32(14, crc, true);
    local.setUint32(18, data.length, true);
    local.setUint32(22, data.length, true);
    local.setUint16(26, nameBytes.length, true);
    local.setUint16(28, 0, true);

    chunks.push(new Uint8Array(local.buffer), nameBytes, data);
    centralRecords.push({ nameBytes, crc, size: data.length, offset });
    offset += 30 + nameBytes.length + data.length;
  }

  const centralStart = offset;
  for (const rec of centralRecords) {
    const central = new DataView(new ArrayBuffer(46));
    central.setUint32(0, 0x02014b50, true);
    central.setUint16(4, 20, true);
    central.setUint16(6, 20, true);
    central.setUint16(8, 0, true);
    central.setUint16(10, 0, true);
    central.setUint16(12, time, true);
    central.setUint16(14, day, true);
    central.setUint32(16, rec.crc, true);
    central.setUint32(20, rec.size, true);
    central.setUint32(24, rec.size, true);
    central.setUint16(28, rec.nameBytes.length, true);
    central.setUint16(30, 0, true);
    central.setUint16(32, 0, true);
    central.setUint16(34, 0, true);
    central.setUint16(36, 0, true);
    central.setUint32(38, 0, true);
    central.setUint32(42, rec.offset, true);

    chunks.push(new Uint8Array(central.buffer), rec.nameBytes);
    offset += 46 + rec.nameBytes.length;
  }
  const centralSize = offset - centralStart;

  const end = new DataView(new ArrayBuffer(22));
  end.setUint32(0, 0x06054b50, true);
  end.setUint16(4, 0, true);
  end.setUint16(6, 0, true);
  end.setUint16(8, centralRecords.length, true);
  end.setUint16(10, centralRecords.length, true);
  end.setUint32(12, centralSize, true);
  end.setUint32(16, centralStart, true);
  end.setUint16(20, 0, true);
  chunks.push(new Uint8Array(end.buffer));

  return new Blob(chunks, { type: 'application/zip' });
}
