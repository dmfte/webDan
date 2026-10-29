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

self.onmessage = async (event) => {
  const { file, plan } = event.data;
  const { Format, mime } = OUTPUT_FORMATS[plan.container];

  try {
    self.postMessage({ type: 'status', status: 'preparing' });

    const input = new Input({ source: new BlobSource(file), formats: ALL_FORMATS });
    // MP4/MOV only: the equivalent of ffmpeg's -movflags +faststart, so the
    // result starts playing in a browser before it has fully downloaded.
    const formatOptions = Format === Mp4OutputFormat || Format === MovOutputFormat
      ? { fastStart: 'in-memory' }
      : {};
    const output = new Output({ format: new Format(formatOptions), target: new BufferTarget() });

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

    const blob = new Blob([output.target.buffer], { type: mime });
    self.postMessage({ type: 'done', blob });
  } catch (err) {
    self.postMessage({ type: 'error', message: err && err.message ? err.message : 'Error desconocido.' });
  }
};
