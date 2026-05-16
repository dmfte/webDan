# WOL Reader — Project Plan
**Personal TTS Web App for wol.jw.org**

---

## Overview

A personal web app that fetches the daily text from the WOL (Watchtower Online Library), resolves all Bible verse references inline, and reads the full content aloud via ElevenLabs TTS. A Cloudflare Worker acts as a proxy (bypassing CORS) and text extractor, returning clean plain text in a single response. The frontend is minimal: open the page, hit Play.

---

## Architecture

```
Browser (your frontend)
    │
    │  1. GET /fetch?url=<wol-page>
    ▼
Cloudflare Worker  (your proxy + scraper)
    │
    │  2. fetch(main WOL page)
    │  3. parse → extract text + verse link targets
    │  4. fetch(unique chapter pages) ← parallel, one per chapter
    │  5. extract verse text, strip footnotes/links
    │  6. assemble final plain text string
    ▼
Browser receives plain text
    │
    │  7. POST to ElevenLabs TTS API
    ▼
Audio plays
```

---

## Tech Stack

| Layer | Tech |
|---|---|
| Proxy / Scraper | Cloudflare Worker (JS) |
| HTML Parsing | Cloudflare HTMLRewriter (streaming, built-in) |
| Frontend | Single HTML file (vanilla JS) |
| TTS | ElevenLabs `/v1/text-to-speech` API |
| CLI tooling | Wrangler (Cloudflare's official CLI) |
| Hosting | Cloudflare Workers (free tier) |

---

## Sprints

---

### Sprint 0 — Wrangler CLI Setup
**Goal:** Get comfortable with Wrangler and deploy a Hello World Worker.

#### 0.1 — Install Wrangler
```bash
npm install -g wrangler
wrangler --version
```
Wrangler is Cloudflare's CLI. It handles everything: local dev server, secrets, and deployment.

#### 0.2 — Authenticate with Cloudflare
```bash
wrangler login
```
This opens a browser window. Log in with your Cloudflare account (free tier is fine). Wrangler stores a token locally.

#### 0.3 — Create your Worker project
```bash
mkdir wol-worker && cd wol-worker
wrangler init
```
Choose: *"Hello World" Worker*, TypeScript: No (plain JS is fine for this), Git: Yes.

This generates:
```
wol-worker/
├── src/
│   └── index.js       ← your Worker code lives here
├── wrangler.toml      ← project config (name, compatibility date, etc.)
└── package.json
```

#### 0.4 — Run it locally
```bash
wrangler dev
```
Opens a local server at `http://localhost:8787`. Every save to `index.js` hot-reloads. You can test with `curl` or your browser.

#### 0.5 — Deploy Hello World to Cloudflare
```bash
wrangler deploy
```
Wrangler bundles your code, uploads it to Cloudflare's edge, and gives you a live URL like:
`https://wol-worker.<your-subdomain>.workers.dev`

✅ **Checkpoint:** Visit that URL in your browser and see "Hello World".

---

### Sprint 1 — Worker: Fetch & Parse the Main WOL Page
**Goal:** Worker receives a WOL URL, fetches it, and returns extracted plain text for the main content only (no verses yet).

#### 1.1 — Worker routing
The Worker will accept requests like:
```
GET https://wol-worker.yourname.workers.dev/?url=https://wol.jw.org/es/wol/h/r4/lp-s
```

Basic Worker structure (`src/index.js`):
```js
export default {
  async fetch(request) {
    const url = new URL(request.url);
    const target = url.searchParams.get('url');
    if (!target) return new Response('Missing ?url param', { status: 400 });

    const res = await fetch(target, {
      headers: { 'User-Agent': 'Mozilla/5.0' }
    });
    const html = await res.text();

    // parse and return plain text
    const text = extractMainText(html);
    return new Response(text, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Access-Control-Allow-Origin': '*'
      }
    });
  }
};
```

#### 1.2 — HTML parsing strategy
WOL pages are server-rendered. The daily text lives inside a `<div class="bodyTxt">` or similar container. Use Cloudflare's **HTMLRewriter** to stream-extract it:

```js
class TextCollector {
  constructor() { this.text = ''; this.inside = false; }
  element(el) { this.inside = true; }
  text(chunk) { if (this.inside) this.text += chunk.text; }
}
```

> **Why HTMLRewriter over DOMParser?**
> Workers don't have a DOM. HTMLRewriter is built into the Workers runtime — it's streaming, low-memory, and fast. It works like a SAX parser with CSS selectors.

#### 1.3 — Identify the right CSS selectors
From inspecting the WOL page, the relevant selectors are:
- Main article content: `article` or `.docSubContent`
- Verse link anchors: `a[href*="/bc/r4/lp-s/"]`
- Footnote markers to strip: `a[href*="/fn/"]`

These will be confirmed and adjusted during development.

#### 1.4 — Also collect verse link URLs
While parsing the main page, collect all unique `href` values from verse links. Return them alongside the text (as JSON) so the Worker can fetch them in the next step.

✅ **Checkpoint:** `curl "https://your-worker.workers.dev/?url=https://wol.jw.org/es/wol/h/r4/lp-s"` returns readable Spanish text from the daily page.

---

### Sprint 2 — Worker: Resolve Bible Verses Inline
**Goal:** Worker fetches each referenced Bible chapter, extracts the target verse(s), and injects them into the main text.

#### 2.1 — Decode verse link URLs
The verse links on WOL use `/bc/` URLs (bible context popups). We'll convert these to `/b/` chapter URLs:

```
/bc/r4/lp-s/{docId}/{n}/{m}
→ /b/r4/lp-s/nwtsty/{book}/{chapter}
```

The `docId` encodes book+chapter. We need a small lookup or to parse the `#v=` anchor from the original href. During Sprint 1 we'll log the actual link formats found on the daily page to finalize this logic.

#### 2.2 — Fetch all chapters in parallel
```js
const chapterUrls = [...new Set(verseLinks.map(toChapterUrl))];
const chapterPages = await Promise.all(
  chapterUrls.map(url => fetch('https://wol.jw.org' + url, {
    headers: { 'User-Agent': 'Mozilla/5.0' }
  }).then(r => r.text()))
);
```
One fetch per unique chapter — if the daily text cites Hechos 10:2 and 10:5, that's one fetch total.

#### 2.3 — Extract target verse text
Each chapter page contains all verses as numbered blocks. Extract the specific verse, then:
- Strip `[*]` and `[+]` footnote/cross-reference markers
- Strip any nested `<a>` tags (keep only their text content)
- Trim whitespace

```js
function extractVerse(chapterHtml, verseNumber) {
  // Use HTMLRewriter to collect text nodes inside the verse block
  // identified by the verse number anchor
}
```

#### 2.4 — Assemble final text
Replace each verse citation in the main text with:
```
[Hech. 10:2: Era un hombre devoto que temía a Dios, al igual que toda su casa...]
```
Or simply insert the verse text inline after the citation reference.

#### 2.5 — Return plain text
The Worker returns one plain text string. No HTML, no JSON — just the reading-ready text.

✅ **Checkpoint:** Worker response includes the daily text with verse quotes woven in, readable as a continuous paragraph.

---

### Sprint 3 — Frontend: Minimal Player UI
**Goal:** A single HTML file you can open locally or host on GitHub Pages / Cloudflare Pages. Hit Play → it reads.

#### 3.1 — Fetch text from Worker on load
```js
const WORKER_URL = 'https://wol-worker.yourname.workers.dev';
const WOL_HOME = 'https://wol.jw.org/es/wol/h/r4/lp-s';

const response = await fetch(`${WORKER_URL}/?url=${encodeURIComponent(WOL_HOME)}`);
const text = await response.text();
```

#### 3.2 — ElevenLabs TTS call
```js
async function speak(text) {
  const res = await fetch(
    'https://api.elevenlabs.io/v1/text-to-speech/{voice_id}',
    {
      method: 'POST',
      headers: {
        'xi-api-key': YOUR_API_KEY,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        text,
        model_id: 'eleven_multilingual_v2',
        voice_settings: { stability: 0.5, similarity_boost: 0.75 }
      })
    }
  );
  const blob = await res.blob();
  const audio = new Audio(URL.createObjectURL(blob));
  audio.play();
}
```

> **Note on API key security:** Since this is personal use and the HTML file won't be publicly shared, hardcoding the key in the file is acceptable. If you ever host it publicly, move the ElevenLabs call to the Worker and store the key as a Wrangler secret (covered in Sprint 4).

#### 3.3 — UI
Minimal interface:
- Date + "Texto del Día" heading (auto-filled)
- The extracted text displayed for reading along
- A single **▶ Leer en voz alta** button
- Loading indicator while Worker fetches / TTS generates

No frameworks. Plain HTML + a few lines of CSS.

✅ **Checkpoint:** Open the HTML file in your browser, click Play, hear the daily text read aloud in Spanish.

---

### Sprint 4 — Secrets & Production Hardening
**Goal:** Clean up credentials, lock down the Worker, deploy properly.

#### 4.1 — Store ElevenLabs key as a Wrangler secret
If you move the TTS call to the Worker (optional but cleaner):
```bash
wrangler secret put ELEVENLABS_API_KEY
```
Wrangler prompts you to paste the value. It's stored encrypted in Cloudflare — never in your code or `wrangler.toml`.

Access it in the Worker:
```js
// env.ELEVENLABS_API_KEY is available automatically
```

#### 4.2 — Add an allowlist to the Worker
Since the Worker is publicly reachable, add a simple guard so it only proxies WOL URLs:
```js
if (!target.startsWith('https://wol.jw.org/')) {
  return new Response('Forbidden', { status: 403 });
}
```

#### 4.3 — Final deploy
```bash
wrangler deploy
```

✅ **Checkpoint:** Full flow works end-to-end from a phone browser. Open the URL, tap Play, done.

---

## Wrangler CLI Quick Reference

| Command | What it does |
|---|---|
| `wrangler login` | Authenticate with your Cloudflare account |
| `wrangler init` | Scaffold a new Worker project |
| `wrangler dev` | Start local dev server (hot reload) |
| `wrangler deploy` | Deploy to Cloudflare edge |
| `wrangler tail` | Stream live logs from your deployed Worker |
| `wrangler secret put KEY` | Store an encrypted secret |
| `wrangler secret list` | List stored secrets (values hidden) |
| `wrangler secret delete KEY` | Remove a secret |
| `wrangler whoami` | Show currently authenticated account |

---

## File Structure (end state)

```
wol-worker/
├── src/
│   └── index.js          ← Worker: proxy, scraper, verse resolver
├── wrangler.toml          ← Worker config
├── package.json
│
frontend/
└── index.html             ← Single-file player UI
```

---

## Open Questions to Resolve During Development

1. **Exact CSS selectors** for the daily text container on `/h/` pages — confirm via DevTools on the live page.
2. **Verse link href format** on the daily text page — are they `/bc/` or `/b/` or something else? Log them in Sprint 1.
3. **ElevenLabs voice ID** — pick a Spanish voice from your ElevenLabs dashboard before Sprint 3.
4. **Text length limits** — ElevenLabs free tier limits request size. If the daily text + verses exceeds ~2500 chars, we may need to split and queue audio chunks.

---

*Built for personal use. WOL content © Watch Tower Bible and Tract Society of Pennsylvania.*
