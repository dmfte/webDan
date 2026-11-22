// Dedicated Worker: one per in-flight video, same lifecycle as worker.js —
// cancelling just calls worker.terminate() from the main thread. Every
// decision (container, codec, size, bitrate…) was already made by video.js
// and arrives as `plan`; this side only carries it out.

import {
  Input,
  Output,
  Conversion,
  ALL_FORMATS,
  BlobSource,
  BufferTarget,
  StreamTarget,
  Mp4OutputFormat,
  MovOutputFormat,
  WebMOutputFormat,
  MkvOutputFormat,
  Quality
} from './mediabunny.min.mjs';

const OUTPUT_FORMATS = {
  mp4: { Format: Mp4OutputFormat, mime: 'video/mp4' },
  mov: { Format: MovOutputFormat, mime: 'video/quicktime' },
  webm: { Format: WebMOutputFormat, mime: 'video/webm' },
  mkv: { Format: MkvOutputFormat, mime: 'video/x-matroska' }
};

const DISCARD_MESSAGES = {
  unknown_source_codec: 'No se reconoce el códec de este video.',
  undecodable_source_codec: 'Este navegador no puede leer el códec de este video.',
  no_encodable_target_codec: 'Este navegador no puede codificar el formato elegido.'
};

// Must match video.js: the folder in the origin-private file system (OPFS)
// that holds results too big to keep in memory.
const DISK_DIR = 'tinymp4-output';

// Writes the result straight to an OPFS file as it's encoded, so its size is
// bounded by disk space instead of by the largest ArrayBuffer the browser
// will allocate. The sync access handle is worker-only but is the variant
// every current browser supports.
async function openDiskTarget(name) {
  const root = await navigator.storage.getDirectory();
  const dir = await root.getDirectoryHandle(DISK_DIR, { create: true });
  const handle = await dir.getFileHandle(name, { create: true });
  const access = await handle.createSyncAccessHandle();
  access.truncate(0);
  const stream = new WritableStream({
    write(chunk) {
      access.write(chunk.data, { at: chunk.position });
    },
    close() {
      access.flush();
      access.close();
    }
  });
  // chunked batches the muxer's many small writes into 16 MiB ones.
  return { target: new StreamTarget(stream, { chunked: true }), access };
}

self.onmessage = async (event) => {
  const { file, plan } = event.data;
  const { Format, mime } = OUTPUT_FORMATS[plan.container];
  let disk = null;

  try {
    self.postMessage({ type: 'status', status: 'preparing' });

    const input = new Input({ source: new BlobSource(file), formats: ALL_FORMATS });
    // MP4/MOV only: the equivalent of ffmpeg's -movflags +faststart, so the
    // result starts playing in a browser before it has fully downloaded. It
    // needs the whole file in memory, so results written to disk skip it.
    const isMp4Family = Format === Mp4OutputFormat || Format === MovOutputFormat;
    let target;
    let formatOptions = {};
    if (plan.diskName) {
      disk = await openDiskTarget(plan.diskName);
      target = disk.target;
      if (isMp4Family) formatOptions = { fastStart: false };
    } else {
      target = new BufferTarget();
      if (isMp4Family) formatOptions = { fastStart: 'in-memory' };
    }
    const output = new Output({ format: new Format(formatOptions), target });

    const conversion = await Conversion.init({
      input,
      output,
      tracks: 'primary',
      video: {
        codec: plan.codec,
        width: plan.width,
        height: plan.height,
        fit: 'fill',
        rotate: plan.rotate,
        frameRate: plan.frameRate || undefined,
        quality: new Quality({ bitrate: plan.videoBitrate }),
        keyFrameInterval: plan.keyFrameInterval,
        hardwareAcceleration: plan.hardwareAcceleration,
        // Without this, a video already in the target codec would be copied
        // packet-for-packet — nothing would actually get compressed.
        forceTranscode: true
      },
      audio: plan.audio,
      // undefined copies the source's tags; an empty object writes none.
      tags: plan.keepTags ? undefined : {},
      showWarnings: false
    });

    // Judge by what made it in, not by what was dropped: phone files often
    // carry extra tracks (metadata, thumbnails) that are fine to lose.
    const used = (type) => conversion.utilizedTracks.some((t) => t.type === type);
    const lostReason = (type) => {
      const lost = conversion.discardedTracks.find((d) => d.track.type === type && d.reason !== 'discarded_by_user');
      return lost ? lost.reason : null;
    };
    if (!conversion.isValid || !used('video')) {
      throw new Error(DISCARD_MESSAGES[lostReason('video')] || 'No se pudo preparar la conversión.');
    }
    if (!plan.audio.discard && !used('audio')) {
      throw new Error('Este navegador no puede codificar el audio para este formato. Prueba con «Quitar» audio o con salida MP4.');
    }

    self.postMessage({ type: 'status', status: 'compressing' });

    let lastPct = -1;
    conversion.onProgress = (progress) => {
      const pct = Math.floor(progress * 100);
      if (pct === lastPct) return;
      lastPct = pct;
      self.postMessage({ type: 'progress', value: pct });
    };

    await conversion.execute();
    input.dispose();

    if (disk) {
      // The main thread reopens the file from OPFS by name.
      self.postMessage({ type: 'done', diskName: plan.diskName, mime });
    } else {
      const blob = new Blob([output.target.buffer], { type: mime });
      self.postMessage({ type: 'done', blob });
    }
  } catch (err) {
    self.postMessage({ type: 'error', message: err && err.message ? err.message : 'Error desconocido.' });
  } finally {
    // Normally the muxer already closed it; on failure this frees the lock
    // so the main thread can delete the partial file.
    if (disk) {
      try {
        disk.access.close();
      } catch {
        // Already closed.
      }
    }
  }
};
