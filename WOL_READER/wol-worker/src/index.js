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

  // Single-voice mode: no verse voice configured, or no brackets in text
  if (!verseVoiceId || !/\[[^\]]+\]/.test(text)) {
    return singleVoiceTTS(text, voiceId, apiKey);
  }

  // Two-voice mode: split on [verse] segments
  const segments = text.split(/(\[[^\]]+\])/);
  const chunks = [];

  for (const seg of segments) {
    const trimmed = seg.trim();
    if (!trimmed) continue;
    const isVerse = trimmed.startsWith('[') && trimmed.endsWith(']');
    const voice = isVerse ? verseVoiceId : voiceId;
    const content = isVerse ? trimmed.slice(1, -1) : trimmed;

    const buf = await callElevenLabs(content, voice, apiKey);
    if (!buf) {
      return new Response('ElevenLabs error on segment', { status: 502, headers: CORS_HEADERS });
    }
    chunks.push(buf);
  }

  const total = chunks.reduce((n, c) => n + c.byteLength, 0);
  const merged = new Uint8Array(total);
  let offset = 0;
  for (const c of chunks) {
    merged.set(new Uint8Array(c), offset);
    offset += c.byteLength;
  }

  return new Response(merged, {
    headers: { 'Content-Type': 'audio/mpeg', ...CORS_HEADERS }
  });
}

async function callElevenLabs(text, voiceId, apiKey) {
  const res = await fetch(
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
  if (!res.ok) return null;
  return res.arrayBuffer();
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

  const today = getTodayDateString();
  const { heading, theme, bodyHtml, verseLinks } = parseDailyPage(html, today);

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
