# YA MERITO — Implementation Plan

## Context

This is a countdown timer web app. The user configures start/end times and clock style; the clock shows how much time is left until the end time. All HTML controls and CSS styling are already complete. Only `index.js` needs to be written.

The brainstorming phase evaluated 3 rendering approaches each for the analog and digital clocks (Canvas 2D, SVG/CSS hybrid, WebGL for analog; DOM text, Canvas, SVG text for digital). The lowest-resource approaches are chosen below.

---

## Chosen Approaches

### Digital clock — DOM text + CSS clamp

**Why:** ~0.1ms CPU per second tick. One `textContent` write triggers a single text repaint; the browser layout engine is heavily optimised for this. No canvas buffer, no continuous redraws. Blinking colon runs on the GPU compositor thread via CSS `@keyframes` — zero JS cost. `font-size: clamp()` + `ResizeObserver` for responsive scaling.

**Structure injected into `.contenedor-reloj`:**
```html
<div class="reloj-digital">
  <span class="tiempo">HH:MM:SS</span>
</div>
```

**Update:** `setInterval(tick, 1000)` → compute remaining seconds → `el.textContent = formattedTime`.

**Remaining time:** `Math.max(0, endTimestamp - Date.now())` → split into H/M/S with `padStart(2,'0')`.

**Font scaling:** `ResizeObserver` on `.contenedor-reloj` → `fontSize = Math.min(w / 7, h / 2.5)` → applied via `el.style.fontSize`.

---

### Analog clock — Inline SVG + CSS custom properties for hands + one SVG path for sector

**Why:** Static SVG geometry (outer ring, black gap, face circle, 12 dot markers, center pivot) is painted once and never repainted. Hand rotation is via CSS `transform: rotate(var(--hand-X))` — GPU-accelerated, no layout reflow. Only the sector `<path d>` is recalculated on each 1-second tick (3 sin/cos calls). ~80-100 lines of JS total. `viewBox="0 0 200 200"` + `width:100%; height:100%` gives free responsive scaling.

**SVG structure injected into `.contenedor-reloj`:**
```html
<svg class="reloj-svg" viewBox="0 0 200 200" width="100%" height="100%">
  <!-- THEME: edit fill/stroke values in these groups to restyle the clock -->

  <!-- OUTER RING: stroke-width controls ring thickness -->
  <circle class="anillo" cx="100" cy="100" r="96" />

  <!-- BLACK GAP between ring and face -->
  <circle class="brecha" cx="100" cy="100" r="88" />

  <!-- FACE: fill color is the lavender-blue of the face -->
  <circle class="cara" cx="100" cy="100" r="85" />

  <!-- SECTOR: pie slice showing remaining span; d attribute updated by JS -->
  <path class="sector" d="" />

  <!-- HOUR MARKERS: 12 dots; r controls dot size -->
  <g class="marcadores"><!-- 12 <circle> elements placed by JS init --></g>

  <!-- HANDS: rotated via CSS custom props set by JS -->
  <line class="manecilla manecilla-hora"    x1="100" y1="100" x2="100" y2="42" />
  <line class="manecilla manecilla-minuto"  x1="100" y1="100" x2="100" y2="30" />
  <line class="manecilla manecilla-segundo" x1="100" y1="100" x2="100" y2="22" />

  <!-- CENTER PIVOT: r controls pivot dot size -->
  <circle class="pivote" cx="100" cy="100" r="5" />
</svg>
```

CSS (added to `styles.css`):
```css
/* THEME: colors */
.reloj-svg .anillo   { fill: white; }
.reloj-svg .brecha   { fill: black; }
.reloj-svg .cara     { fill: #7a9fd4; } /* lavender-blue face */
.reloj-svg .sector   { fill: rgba(180,210,255,0.35); }
.reloj-svg .marcadores circle { fill: white; }
.reloj-svg .manecilla { stroke: white; stroke-linecap: round; }
.reloj-svg .manecilla-hora    { stroke-width: 6; transform-origin: 100px 100px; transform: rotate(var(--deg-hora,   0deg)); }
.reloj-svg .manecilla-minuto  { stroke-width: 4; transform-origin: 100px 100px; transform: rotate(var(--deg-minuto, 0deg)); }
.reloj-svg .manecilla-segundo { stroke-width: 2; transform-origin: 100px 100px; transform: rotate(var(--deg-segundo,0deg)); }
.reloj-svg .pivote   { fill: white; }
```

**Hand rotation (JS):** 1 s tick → compute angles → `svg.style.setProperty('--deg-hora', angleH + 'deg')` etc.

**Sector path (JS):**
```js
// Angles in radians, offset by -π/2 so 0 = 12 o'clock
function sectorPath(cx, cy, r, startRad, endRad) {
  const large = (endRad - startRad + 2*Math.PI) % (2*Math.PI) > Math.PI ? 1 : 0;
  const x1 = cx + r * Math.cos(startRad), y1 = cy + r * Math.sin(startRad);
  const x2 = cx + r * Math.cos(endRad),   y2 = cy + r * Math.sin(endRad);
  return `M ${cx},${cy} L ${x1},${y1} A ${r},${r} 0 ${large},1 ${x2},${y2} Z`;
}
```

**Hour markers (JS init, once):**
```js
const svgNS = 'http://www.w3.org/2000/svg';
for (let i = 0; i < 12; i++) {
  const a = (i / 12) * 2 * Math.PI - Math.PI / 2;
  // r=80 = marker ring radius; 3 = dot radius — THEME: edit these two values
  const c = document.createElementNS(svgNS, 'circle');
  c.setAttribute('cx', 100 + 80 * Math.cos(a));
  c.setAttribute('cy', 100 + 80 * Math.sin(a));
  c.setAttribute('r', 3);
  marcadores.appendChild(c);
}
```

---

## All Controls — Wiring Plan

### State object
```js
const state = {
  running: false,
  usarDispositivo: false,   // #horaDispositivo
  analogico: false,          // #relojAnalogo
  horaInicial: null,         // Date object (today + HH:MM)
  horaFinal: null,           // Date object (today + HH:MM)
  ventanaExtra: false,
  autoCerrar: false,
  intervalId: null,
  watcherId: null,           // interval that polls device time for auto-start
  popupWin: null,
  canal: null,               // BroadcastChannel('ya-merito')
};
```

### `#horaDispositivo`
- When checked: `state.usarDispositivo = true`; starts `watcherId = setInterval(watchHora, 5000)` that compares `Date.now()` to `state.horaInicial` and calls `iniciar()` when reached.
- When checked: sets `title="Para iniciar manualmente, desactive 'Usar hora del dispositivo'"` on `#iniciarReloj` + adds `.desactivado` class (pointer-events: none; opacity: 0.5).
- When unchecked: cancels `watcherId`, removes `.desactivado` class, clears `title`.

### `#relojAnalogo`
- Checked = analog SVG mode; unchecked = digital DOM mode.
- Both `#aplicarConfiguracion` and the initial page render call `renderizarReloj()` which clears `.contenedor-reloj` and injects the appropriate markup.
- Switching while running continues the countdown with new UI immediately.

### `#horaInicial` / `#horaFinal`
- Read as `"HH:MM"` strings → `new Date()` with today's date + those hours/minutes, seconds=0.
- If `horaFinal <= horaInicial`, add 24 h to `horaFinal` (overnight countdown support).

### `#ventanaExtra`
- On countdown start: if checked, `state.popupWin = window.open('about:blank', 'reloj-extra', 'width=600,height=400,menubar=no,toolbar=no,location=no')`.
- Write minimal HTML into popup: clock container div + same CSS `<link>` + a `<script>` that listens on `new BroadcastChannel('ya-merito')` and updates its own clock from tick messages.
- Main window posts `{ h, m, s, analogico, horaInicial, horaFinal }` to the channel every second.

### `#autoCerrarVentanaExtra`
- On countdown end (remaining <= 0): if `state.autoCerrar && state.popupWin && !state.popupWin.closed` → `state.popupWin.close()`.

### `#aplicarConfiguracion`
- Reads all inputs → updates `state` → calls `renderizarReloj()` (swaps clock type if needed) → if `state.running`, recalculates `horaFinal` and continues; does NOT restart.

### `#iniciarReloj`
- Inert when `state.usarDispositivo` is true (CSS `.desactivado` + title tooltip).
- On click: reads inputs via `aplicarConfig()`, sets `state.running = true`, opens popup if needed, starts `state.intervalId = setInterval(tick, 1000)`, calls `tick()` immediately.

---

## Tick / Time Computation

```js
function tick() {
  const remaining = Math.max(0, state.horaFinal - Date.now()); // ms
  const totalSec = Math.floor(remaining / 1000);
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  actualizarReloj(h, m, s);
  state.canal?.postMessage({ h, m, s, analogico: state.analogico });
  if (remaining <= 0) terminarReloj();
}
```

For the **analog** clock, the **sector** spans from the `horaInicial` wall-clock angle to the `horaFinal` wall-clock angle (fixed arc showing the total session). The **minute hand** (and hour hand) show current wall time (i.e., `horaFinal - remaining`), sweeping across that sector as time passes. Second hand always shows current seconds.

---

## Files to Modify

| File | Change |
|------|--------|
| `/YA_MERITO/index.js` | Write from scratch — all logic |
| `/YA_MERITO/styles.css` | Add analog SVG rules, digital clock rules, `.desactivado` button style |
| `/YA_MERITO/index.html` | No changes needed |

---

## Verification Checklist

1. `npx serve .` from repo root → open `http://localhost:3000/YA_MERITO/`
2. Set `horaInicial` = now+1 min, `horaFinal` = now+3 min → Iniciar → countdown runs, stops at zero.
3. Toggle analog/digital mid-countdown → clock swaps, countdown continues uninterrupted.
4. Enable `Ventana extra` → start → popup opens, mirrors main clock each second.
5. Enable `Auto cerrar` → let countdown finish → popup closes automatically.
6. Enable `Usar hora del dispositivo` → Iniciar button shows tooltip, clicks are inert → countdown auto-starts at `horaInicial`.
7. Click `Aplicar` mid-run with a new `horaFinal` → remaining time recalculates live.
8. Overnight test: set `horaInicial=23:55`, `horaFinal=00:05` → confirm 10-minute countdown works.
