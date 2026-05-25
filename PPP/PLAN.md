# PPP — SVG-based interactive layout + PDF export

## Context

PPP (Fotos por Página) currently has a scaffolded UI (file upload, param panel, canvas stub, pdf-lib PDF export) but the layout engine and all interactive editing are unimplemented (`generateBtn` handler is empty). The task is to implement the full feature: auto-layout, interactive editing (swap, rotate, resize), and PDF export.

**Chosen approach: SVG preview** — an `<svg viewBox="0 0 W H">` whose viewBox matches the page dimensions in PDF points. SVG coordinate units equal PDF points, so export needs only a Y-axis flip (SVG top-left origin → PDF bottom-left origin). No CSS-scale hit-testing math (canvas) and no CSS transform decomposition (DOM divs).

**User decisions:**
- Layout algorithm: fixed grid (equal slots)
- Edit-settings conflict: preserve all manual edits (swaps, rotations, resizes), re-flow unmodified slots around pinned ones
- Interactions: drag-to-swap, rotate slot 90°, resize slot (corner handle)

---

## Critical files

| File | Role |
|---|---|
| `PPP/index.html` | Replace `<canvas>` with `<svg id="previewSvg">` in `.preview-area` |
| `PPP/index.js` | Main implementation — all changes go here |
| `PPP/styles.css` | Add SVG + handle styles; remove canvas-specific rules |
| `assets/js/pdf-lib.min.js` | Already vendored, no change |

---

## State shape changes

Add two new fields alongside the existing `state`:

```js
state.overrides   // Map<slotKey, {rotated, w, h, x, y}>  — manual edits
                  // slotKey = `p${pageIdx}_s${slotIdx}`
state.pinned      // Set<slotKey>  — slots touched by user (skip re-layout)
```

`state.layout` stays identical (`{ pages: [{ pictures: [{id,x,y,width,height,rotated}] }] }`).  
`state.params`, `state.files`, `state.currentPage`, `state.status` unchanged.

---

## Implementation plan

### Step 1 — HTML: replace canvas with SVG

In `PPP/index.html`, replace:
```html
<canvas id="previewCanvas"></canvas>
```
with:
```html
<svg id="previewSvg" xmlns="http://www.w3.org/2000/svg"></svg>
```
Keep all other elements (placeholder, loading, error, footer) unchanged.

### Step 2 — CSS: swap canvas rules for SVG rules

In `PPP/styles.css`:
- Rename `#previewCanvas` selector → `#previewSvg`
- Keep `max-width: 100%; max-height: 100%; border-radius: 4px; border: 1px solid var(--line); box-shadow: var(--shadow-lg);`
- Add `display: none;` default, `.visible` shows it (same pattern as canvas)
- Add `.slot-handle` style: small filled square, cursor `nw-resize`, `pointer-events: all`
- Add `.slot-rotate-btn` style: small circle, cursor `pointer`
- Add `.slot-drop-target` style: highlighted border on drag-over target slot

### Step 3 — Layout algorithm (`computeLayout`)

New function in `index.js`. Replaces the empty `generateBtn` handler stub.

```
function computeLayout(files, params) → { pages: [{ pictures: [{id,x,y,width,height,rotated,baseX,baseY,baseCellW,baseCellH}] }] }
```

Logic:
1. `dims = getPageDimsPt()` (already exists)
2. `margin = params.marginMm * MM_TO_PT`, `gap = params.gapMm * MM_TO_PT`
3. `availW = dims.w - 2*margin`, `availH = dims.h - 2*margin`
4. `n = params.picsPerPage`
5. Compute grid: `cols = Math.ceil(Math.sqrt(n))`, `rows = Math.ceil(n / cols)`
   - Adjust: if `cols * (rows-1) >= n`, decrement rows (avoid empty last row when possible)
6. `cellW = (availW - (cols-1)*gap) / cols`
   `cellH = (availH - (rows-1)*gap) / rows`
7. For each file, compute slot index `i`, `col = i % cols`, `row = Math.floor(i / cols)`
8. `x = margin + col*(cellW + gap)`, `y = margin + row*(cellH + gap)`
9. `rotated` flag: if `params.allowRotation`, compare fit ratio for normal vs rotated orientation; pick whichever gives a larger `Math.min(cellW/imgAR, cellH)` scale. Store `rotated: true` if rotating improves fit.
10. Width/height in layout = slot bounding box (`cellW × cellH`); `rotated` flag controls draw orientation only.
11. Store `baseX = x`, `baseY = y`, `baseCellW = cellW`, `baseCellH = cellH` on each picture for rotate re-centering.
12. Chunk `files` into pages of `n`; return `{ pages }`.

### Step 4 — Override system

```js
function applyOverrides(layout, overrides) {
  for (const [key, ov] of overrides) {
    const [, pi, si] = key.match(/p(\d+)_s(\d+)/);
    const pic = layout.pages[pi]?.pictures[si];
    if (pic) Object.assign(pic, ov);
  }
  return layout;
}
```

When `generateBtn` is clicked:
- Re-run `computeLayout` (fresh base)
- Call `applyOverrides(layout, state.overrides)`
- Set `state.layout`, `state.status = 'ready'`, call `renderStatus()` and `renderSvg()`

When a setting changes and a layout already exists:
- If `picsPerPage` changed: clear `state.overrides` + `state.pinned`, re-layout
- Otherwise: re-run `computeLayout` + `applyOverrides` silently and re-render

### Step 5 — SVG renderer (`renderSvg`)

Replaces `renderPreview`. Builds SVG declaratively each time state changes.

Per slot, the SVG group contains:
- A `<clipPath>` + `<image>` element (with `preserveAspectRatio="xMidYMid meet"`)
- A `<rect>` slot border
- A `<circle>` rotate button (top-right corner)
- A `<rect>` resize handle (bottom-right corner)

Rotation is applied as `transform="rotate(90, cx, cy)"` on the `<image>` element where `cx/cy` is the slot center. The clip path is always the unrotated slot rect, so the image is always clipped to the slot boundary.

Helper:
```js
function svgEl(tag, attrs = {}) {
  const el = document.createElementNS('http://www.w3.org/2000/svg', tag);
  for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, v);
  return el;
}
```

### Step 6 — Rotate interaction

```js
function rotateSlot(pageIdx, slotIdx) {
  const pic = state.layout.pages[pageIdx].pictures[slotIdx];
  pic.rotated = !pic.rotated;
  [pic.width, pic.height] = [pic.height, pic.width];
  // Re-center in original cell using stored base dimensions
  pic.x = pic.baseX + (pic.baseCellW - pic.width) / 2;
  pic.y = pic.baseY + (pic.baseCellH - pic.height) / 2;
  saveOverride(pageIdx, slotIdx, pic);
  renderSvg();
}
```

### Step 7 — Drag-to-swap interaction

- `pointerdown` on `<image>` → capture pointer to SVG, store `dragState = { pageIdx, slotIdx }`
- `pointermove` on SVG → `svgPoint()` to get SVG-coordinate pointer pos, `findSlotAt()` to find target slot, highlight with `.slot-drop-target` CSS class
- `pointerup` on SVG → if target ≠ source, call `swapSlots()` (swap only `id`, not geometry), then `renderSvg()`

```js
function svgPoint(svgEl, e) {
  const pt = svgEl.createSVGPoint();
  pt.x = e.clientX; pt.y = e.clientY;
  return pt.matrixTransform(svgEl.getScreenCTM().inverse());
}

function findSlotAt(x, y, page) {
  for (let i = 0; i < page.pictures.length; i++) {
    const p = page.pictures[i];
    if (x >= p.x && x <= p.x+p.width && y >= p.y && y <= p.y+p.height) return i;
  }
  return null;
}

function swapSlots(pageIdx, a, b) {
  const pics = state.layout.pages[pageIdx].pictures;
  [pics[a].id, pics[b].id] = [pics[b].id, pics[a].id];
  saveOverride(pageIdx, a, pics[a]);
  saveOverride(pageIdx, b, pics[b]);
}
```

### Step 8 — Resize interaction

- `pointerdown` on resize handle → capture pointer to SVG, store `resizeState = { pageIdx, slotIdx, startPt, origW, origH }`
- `pointermove` on SVG → compute `dx/dy` from start point in SVG coords, update `pic.width/height` (min 20pt), call `saveOverride`, call `renderSvg()`
- `pointerup` → clear `resizeState`

Adjacent slots are NOT reflowed — slot geometry is fully independent after a manual resize.

The `pointermove` and `pointerup` listeners on `previewSvg` handle both drag-to-swap and resize (check which state is active first: resize takes priority).

### Step 9 — Override persistence helper

```js
function saveOverride(pageIdx, slotIdx, pic) {
  const key = `p${pageIdx}_s${slotIdx}`;
  state.overrides.set(key, {
    id: pic.id, x: pic.x, y: pic.y,
    width: pic.width, height: pic.height,
    rotated: pic.rotated
  });
  state.pinned.add(key);
}
```

### Step 10 — Settings change: re-layout with overrides

Updated `invalidateLayout()`:

```js
function invalidateLayout() {
  if (state._lastPicsPerPage !== state.params.picsPerPage) {
    state.overrides.clear();
    state.pinned.clear();
    state._lastPicsPerPage = state.params.picsPerPage;
  }
  if (state.files.length === 0) {
    state.layout = null; state.status = 'idle'; renderStatus(); return;
  }
  if (state.status === 'ready' || state.overrides.size > 0) {
    const base = computeLayout(state.files, state.params);
    state.layout = applyOverrides(base, state.overrides);
    state.status = 'ready';
    renderStatus();
    renderSvg();
  } else {
    state.layout = null;
    state.status = 'idle';
    renderStatus();
  }
}
```

### Step 11 — PDF export update

Keep existing Y-flip (`pdfY = dims.h - pic.y - pic.height`) and rotated-image logic. Add embed cache to avoid duplicate PNG embeds:

```js
const embeddedCache = new Map();
// for each pic: check cache before embedPng, store result, reuse
```

### Step 12 — DOM ref update

Replace `previewCanvas` DOM ref → `previewSvg`. Update `renderStatus()` to toggle `.visible` on `#previewSvg` instead of `#previewCanvas`.

---

## Reused existing code (no changes needed)

| Function/pattern | Location | Reused as-is |
|---|---|---|
| `loadImageFromFile()` | `index.js:68` | Yes |
| `handleFiles()` | `index.js:117` | Yes |
| `renderThumbnails()` | `index.js:138` | Yes |
| `getPageDimsPt()` | `index.js:253` | Yes |
| `PAGE_SIZES`, `MM_TO_PT` | `index.js:6` | Yes |
| `renderStatus()` | `index.js:333` | Minimal edit (canvas→svg ref) |
| `downloadPDF()` | `index.js:352` | Minimal edit (embed cache) |
| Mobile hamburger/overlay | `index.js:418` | Yes |
| All param event listeners | `index.js:205` | Call `invalidateLayout()` as before |

---

## Verification

1. Serve from repo root: `npx serve /path/to/webDan` → open `http://localhost:3000/PPP/`
2. Upload 6+ photos of mixed orientations
3. Click "Generar distribución" → SVG preview appears, photos in a fixed grid
4. Drag one photo onto another → they swap; layout reflects change
5. Click rotate button on a slot → photo rotates 90°; PDF export includes the rotation
6. Drag resize handle → slot grows/shrinks independently
7. Change margin or gap → layout re-flows without losing swaps/rotations
8. Change picsPerPage → layout resets (overrides cleared)
9. Click "Descargar PDF" → PDF opens; positions/rotations match the preview exactly
10. Mobile: hamburger opens params panel; upload strip appears at top
