const WOL_BASE = 'https://wol.jw.org';
const FETCH_HEADERS = { 'User-Agent': 'Mozilla/5.0 (compatible; WOLReader/1.0)' };

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type'
};

export default {
  async fetch(request, env) {
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: CORS_HEADERS });
    }

    const url = new URL(request.url);

    if (url.pathname === '/tts' && request.method === 'POST') {
      return handleTTS(request, env);
    }

    const target = url.searchParams.get('url');

    if (!target) {
      return new Response('WOL Worker running. Pass ?url=<wol-page-url>', {
        headers: { 'Content-Type': 'text/plain; charset=utf-8', ...CORS_HEADERS }
      });
    }

    if (!target.startsWith('https://wol.jw.org/')) {
      return new Response('Forbidden: only wol.jw.org URLs allowed', {
        status: 403, headers: CORS_HEADERS
      });
    }

    try {
      const text = await buildDailyText(target);
      return new Response(text, {
        headers: { 'Content-Type': 'text/plain; charset=utf-8', ...CORS_HEADERS }
      });
    } catch (e) {
      return new Response('Error: ' + e.message, { status: 500, headers: CORS_HEADERS });
    }
  }
};

async function handleTTS(request, env) {
  const apiKey = env.ELEVENLABS_API_KEY;
  const voiceId = env.ELEVENLABS_VOICE_ID;
  const verseVoiceId = env.ELEVENLABS_VERSE_VOICE_ID;

  if (!apiKey || !voiceId) {
    return new Response('TTS not configured', { status: 500, headers: CORS_HEADERS });
  }

  const { text } = await request.json();
  if (!text) {
    return new Response('Missing text', { status: 400, headers: CORS_HEADERS });
  }

  if (!verseVoiceId || !/\[[^\]]+\]/.test(text)) {
    return singleVoiceTTS(text, voiceId, apiKey);
  }

  const segments = text.split(/(\[[^\]]+\])/);
  const parsed = [];
  for (const seg of segments) {
    const trimmed = seg.trim();
    if (!trimmed) continue;
    const isVerse = trimmed.startsWith('[') && trimmed.endsWith(']');
    parsed.push({
      voice: isVerse ? verseVoiceId : voiceId,
      content: isVerse ? trimmed.slice(1, -1) : trimmed
    });
  }

  const pcmChunks = [];
  for (let i = 0; i < parsed.length; i++) {
    const { voice, content } = parsed[i];
    const prevText = parsed.slice(0, i).map(s => s.content).join(' ');
    const nextText = parsed.slice(i + 1).map(s => s.content).join(' ');

    const buf = await callElevenLabsPCM(content, voice, apiKey, prevText, nextText);
    if (!buf) {
      return new Response('ElevenLabs error on segment', { status: 502, headers: CORS_HEADERS });
    }
    pcmChunks.push(buf);
  }

  const wav = buildWav(pcmChunks, PCM_SAMPLE_RATE);
  return new Response(wav, {
    headers: { 'Content-Type': 'audio/wav', ...CORS_HEADERS }
  });
}

const PCM_SAMPLE_RATE = 24000;

async function callElevenLabsPCM(text, voiceId, apiKey, previousText, nextText) {
  const body = {
    text,
    model_id: 'eleven_multilingual_v2',
    voice_settings: { stability: 0.5, similarity_boost: 0.75 }
  };
  if (previousText) body.previous_text = previousText;
  if (nextText) body.next_text = nextText;

  const res = await fetch(
    `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}?output_format=pcm_${PCM_SAMPLE_RATE}`,
    {
      method: 'POST',
      headers: {
        'xi-api-key': apiKey,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    }
  );
  if (!res.ok) return null;
  return res.arrayBuffer();
}

function buildWav(pcmChunks, sampleRate) {
  const numChannels = 1;
  const bitsPerSample = 16;
  const byteRate = sampleRate * numChannels * (bitsPerSample / 8);
  const blockAlign = numChannels * (bitsPerSample / 8);

  const dataSize = pcmChunks.reduce((n, c) => n + c.byteLength, 0);
  const buffer = new ArrayBuffer(44 + dataSize);
  const view = new DataView(buffer);

  writeString(view, 0, 'RIFF');
  view.setUint32(4, 36 + dataSize, true);
  writeString(view, 8, 'WAVE');
  writeString(view, 12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, byteRate, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, bitsPerSample, true);
  writeString(view, 36, 'data');
  view.setUint32(40, dataSize, true);

  const output = new Uint8Array(buffer);
  let offset = 44;
  for (const chunk of pcmChunks) {
    output.set(new Uint8Array(chunk), offset);
    offset += chunk.byteLength;
  }

  return buffer;
}

function writeString(view, offset, str) {
  for (let i = 0; i < str.length; i++) {
    view.setUint8(offset + i, str.charCodeAt(i));
  }
}

async function singleVoiceTTS(text, voiceId, apiKey) {
  const ttsRes = await fetch(
    `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
    {
      method: 'POST',
      headers: {
        'xi-api-key': apiKey,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        text,
        model_id: 'eleven_multilingual_v2',
        voice_settings: { stability: 0.5, similarity_boost: 0.75 }
      })
    }
  );

  if (!ttsRes.ok) {
    const msg = await ttsRes.text();
    return new Response('ElevenLabs error: ' + msg, {
      status: ttsRes.status, headers: CORS_HEADERS
    });
  }

  return new Response(ttsRes.body, {
    headers: {
      'Content-Type': ttsRes.headers.get('Content-Type') || 'audio/mpeg',
      ...CORS_HEADERS
    }
  });
}

async function buildDailyText(target) {
  const res = await fetch(target, { headers: FETCH_HEADERS });
  if (!res.ok) throw new Error(`Upstream ${res.status}`);
  const html = await res.text();

  const dateStr = extractDateFromUrl(target) || getTodayDateString();
  const { heading, theme, bodyHtml, verseLinks } = parseDailyPage(html, dateStr);

  const resolvedVerses = await resolveAllVerses(verseLinks);

  // Inject verse text into the HTML right after each <a> tag, keyed by href
  let finalBody = bodyHtml;
  for (const { href, text } of resolvedVerses) {
    const escaped = href.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const pattern = new RegExp(`(<a[^>]*href="${escaped}"[^>]*>[\\s\\S]*?<\\/a>)`);
    finalBody = finalBody.replace(pattern, `$1 [${text}]`);
  }

  const cleanBody = extractText(finalBody);
  return `${heading}\n\n${theme}\n\n${cleanBody}`;
}

function findTabForDate(html, dateStr) {
  const datePrefix = dateStr + 'T';
  const tabRegex = new RegExp(
    `<div class="tabContent" data-date="${datePrefix}[^"]*">[\\s\\S]*?(?=<div class="tabContent"|<div id="noDailyText")`,
    ''
  );
  return html.match(tabRegex);
}

function extractDateFromUrl(url) {
  const match = url.match(/\/(\d{4})\/(\d{1,2})\/(\d{1,2})$/);
  if (!match) return null;
  const [, y, m, d] = match;
  return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
}

function getTodayDateString() {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function parseDailyPage(html, dateStr) {
  let match = findTabForDate(html, dateStr);

  if (!match) {
    const allDates = [...html.matchAll(/data-date="(\d{4}-\d{2}-\d{2})T/g)]
      .map(m => m[1]).sort();
    const latest = allDates[allDates.length - 1];
    if (latest) match = findTabForDate(html, latest);
  }

  if (!match) throw new Error('No daily text found');

  const block = match[0];
  const heading = extractText(block.match(/<h2[^>]*>([\s\S]*?)<\/h2>/)?.[1] || '');
  const theme = extractText(block.match(/<p[^>]*class="themeScrp"[^>]*>([\s\S]*?)<\/p>/)?.[1] || '');

  const bodyMatch = block.match(/<div class="bodyTxt">([\s\S]*?)<\/div>/);
  const bodyHtml = bodyMatch?.[1] || '';

  const verseLinks = [];
  const linkRegex = /<a[^>]*href="(\/es\/wol\/bc\/[^"]*)"[^>]*class="b"[^>]*>([\s\S]*?)<\/a>/g;
  let m;
  while ((m = linkRegex.exec(bodyHtml)) !== null) {
    verseLinks.push({ href: m[1], citation: extractText(m[2]) });
  }

  return { heading, theme, bodyHtml, verseLinks };
}

async function resolveAllVerses(verseLinks) {
  const chapterCache = {};
  const results = [];

  // Step 1: Resolve /bc/ redirects (307) to get chapter URLs + verse refs
  const resolved = await Promise.all(
    verseLinks.map(async ({ href, citation }) => {
      const redirectRes = await fetch(WOL_BASE + href, {
        headers: FETCH_HEADERS,
        redirect: 'manual'
      });
      const location = redirectRes.headers.get('Location');
      if (!location) return null;

      const hashMatch = location.match(/#v=(.+)$/);
      if (!hashMatch) return null;

      const chapterUrl = location.split('#')[0];
      const verseRef = hashMatch[1];

      return { href, chapterUrl, verseRef };
    })
  );

  // Step 2: Fetch unique chapters
  const uniqueChapters = [...new Set(resolved.filter(Boolean).map(r => r.chapterUrl))];
  await Promise.all(
    uniqueChapters.map(async (chUrl) => {
      const res = await fetch(WOL_BASE + chUrl, { headers: FETCH_HEADERS });
      chapterCache[chUrl] = await res.text();
    })
  );

  // Step 3: Extract verse text for each reference
  for (const item of resolved) {
    if (!item) continue;
    const chapterHtml = chapterCache[item.chapterUrl];
    if (!chapterHtml) continue;

    const verseText = extractVerseText(chapterHtml, item.verseRef);
    if (verseText) {
      results.push({ href: item.href, text: verseText });
    }
  }

  return results;
}

function extractVerseText(chapterHtml, verseRef) {
  // verseRef: "58:12:7" or "47:11:23-47:11:25"
  const parts = verseRef.split('-');
  const startParts = parts[0].split(':');
  const book = startParts[0];
  const chapter = startParts[1];
  const startVerse = parseInt(startParts[2]);

  let endVerse = startVerse;
  if (parts[1]) {
    const endParts = parts[1].split(':');
    endVerse = parseInt(endParts[2]);
  }

  const texts = [];
  for (let v = startVerse; v <= endVerse; v++) {
    const spanId = `v${book}-${chapter}-${v}-1`;
    const spanRegex = new RegExp(`<span id="${spanId}"[^>]*>([\\s\\S]*?)<\\/span>`);
    const match = chapterHtml.match(spanRegex);
    if (match) {
      texts.push(cleanVerseText(match[1], v));
    }
  }

  return texts.join(' ') || null;
}

function cleanVerseText(html, verseNum) {
  return html
    .replace(/<a[^>]*class="[^"]*vl[^"]*"[^>]*>\d+\s*<\/a>/g, '') // strip verse number links
    .replace(/<a[^>]*class="fn"[^>]*>[^<]*<\/a>/g, '')              // strip footnote markers
    .replace(/<a[^>]*class="b"[^>]*>\+<\/a>/g, '')                  // strip cross-ref +
    .replace(/<a[^>]*>([\s\S]*?)<\/a>/g, '$1')                      // unwrap remaining links
    .replace(/<[^>]+>/g, '')                                         // strip all tags
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function extractText(html) {
  if (!html) return '';
  return html
    .replace(/<a[^>]*class="fn"[^>]*>\*<\/a>/g, '')
    .replace(/<a[^>]*class="b"[^>]*>\+<\/a>/g, '')
    .replace(/<a[^>]*class="b"[^>]*>([\s\S]*?)<\/a>/g, '$1')
    .replace(/<a[^>]*href="\/es\/wol\/pc\/[^"]*"[^>]*>[\s\S]*?<\/a>/g, '')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/\s+/g, ' ')
    .trim();
}
