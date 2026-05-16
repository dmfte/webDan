# WOL_READER

Daily text reader for wol.jw.org with TTS playback via ElevenLabs. Fetches the "Texto del Dia" from the Watchtower Online Library, resolves all inline Bible verse references, and reads the result aloud.

## Architecture

Two-layer system: a Cloudflare Worker (proxy + scraper + TTS relay) and a vanilla JS frontend.

```
Browser (index.html)
  GET  /?url=<wol-page>  →  Cloudflare Worker  →  wol.jw.org (scrape + verse resolution)
                          ←  plain text response

  POST /tts { text }      →  Cloudflare Worker  →  ElevenLabs API
                           ←  audio/mpeg blob    ←  audio stream
```

The Worker lives on `https://wol-worker.dmfte-dev.workers.dev`. The frontend calls it for both text and audio.

## File structure

```
WOL_READER/
├── index.html              ← Single-page UI (Spanish)
├── index.js                ← Frontend: day navigation, text display, audio playback
├── styles.css              ← Dark theme, uses shared Chivo Mono / VT323 fonts
├── wol-tts-plan.md         ← Original project plan (sprint-based)
└── wol-worker/
    ├── src/index.js        ← Cloudflare Worker source (proxy, scraper, TTS relay)
    ├── wrangler.toml       ← Worker config (name: wol-worker, port 8789)
    └── package.json        ← Scripts: dev, deploy (via wrangler)
```

## Running locally

**Frontend** — serve from the repo root (font paths reference `/assets/`):
```bash
npx serve .
# then open http://localhost:3000/WOL_READER/
```

**Worker** — requires Wrangler authenticated with Cloudflare:
```bash
cd WOL_READER/wol-worker
npm run dev          # local dev server on port 8789
npm run deploy       # deploy to Cloudflare edge
```

The worker uses three Wrangler secrets (stored encrypted in Cloudflare, not in code):
- `ELEVENLABS_API_KEY` — ElevenLabs API key
- `ELEVENLABS_VOICE_ID` — primary voice for body text
- `ELEVENLABS_VERSE_VOICE_ID` — optional second voice for inline verse quotes

Set with `wrangler secret put <NAME>`.

## How the Worker works (`wol-worker/src/index.js`)

### Routes

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/?url=<wol-url>` | Fetch + scrape a WOL page, resolve verses, return plain text |
| POST | `/tts` | Relay text to ElevenLabs, return audio blob |
| OPTIONS | `*` | CORS preflight |

### Text pipeline (`buildDailyText`)

1. **Fetch** the WOL daily page HTML.
2. **Parse** with regex: find the `<div class="tabContent" data-date="...">` matching today (or the latest available date).
3. **Extract** heading (`<h2>`), theme (`<p class="themeScrp">`), and body (`<div class="bodyTxt">`).
4. **Collect verse links** — `<a>` tags with `href="/es/wol/bc/..."` and `class="b"`.
5. **Resolve verses** — follow each `/bc/` redirect (307) to get the chapter URL + `#v=` hash, fetch unique chapters in parallel, extract verse spans by ID pattern `v{book}-{chapter}-{verse}-1`.
6. **Inject** resolved verse text in `[brackets]` after each citation link in the body HTML.
7. **Strip HTML** — `extractText()` removes tags, footnote markers (`class="fn"`), cross-ref markers, and normalizes whitespace.
8. Return `heading\n\ntheme\n\nbody` as plain text.

### TTS pipeline (`handleTTS`)

- **Single-voice**: if no `ELEVENLABS_VERSE_VOICE_ID` secret or no `[brackets]` in text, send entire text to ElevenLabs with the primary voice.
- **Two-voice**: split text on `[...]` segments, call ElevenLabs per segment with the appropriate voice, concatenate MP3 buffers.
- Model: `eleven_multilingual_v2`. Settings: stability 0.5, similarity_boost 0.75.

### Security

- The Worker only proxies URLs starting with `https://wol.jw.org/` (403 otherwise).
- CORS headers allow any origin (`*`) — this is a personal tool.

## How the frontend works (`index.js`)

### State
- `currentDate` — the day being viewed (starts at today).
- `fullText` — the plain text returned by the Worker for the current day.
- `audio` — the current `Audio` object (or null).

### Flow
1. On load, `init()` calls `loadDay(currentDate)`.
2. `loadDay(date)` builds the WOL URL (today uses the bare homepage URL, other dates use `/{year}/{month}/{day}`), fetches via Worker, calls `displayText()`.
3. `displayText(text)` splits on `\n\n`: line 0 = date heading, line 1 = theme, rest = body. Verse brackets `[...]` are wrapped in `<span class="verse-inline">`.
4. Play button calls `speak(fullText)` which POSTs to `/tts`, creates an `Audio` from the blob, and plays it.
5. Prev/Next buttons adjust `currentDate` by one day and reload.

### UI pattern
- Play and Stop buttons toggle visibility (not disabled state) for active playback.
- Status area shows a CSS spinner + message during loading/generation.

## CSS variables

```css
--bg: #1a1a2e;
--surface: #16213e;
--text: #e0e0e0;
--muted: #8888aa;
--accent: #4fc3f7;
--accent-dim: #2a7a9e;
--radius: 8px;
```

Dark blue theme. Uses shared fonts from `/assets/fonts/` (Chivo Mono body, VT323 headings/buttons).

## Conventions

- Spanish UI throughout.
- No build step, no dependencies on the frontend side.
- Worker has no npm dependencies — uses Cloudflare built-in APIs only.
- Regex-based HTML parsing (no DOM/HTMLRewriter despite the plan doc mentioning it).
- WOL page structure is assumed stable: `tabContent[data-date]`, `bodyTxt`, `themeScrp`, `class="b"` verse links, `#v=` hash format for verse references.
