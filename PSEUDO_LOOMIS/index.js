(() => {
  const DEG = Math.PI / 180;
  const $ = id => document.getElementById(id);
  const canvas = $('c'), stage = $('stage'), ctx = canvas.getContext('2d');

  // Globe position/size are stored relative to the picture, so they survive
  // window resizes and export at full resolution exactly as seen.
  //   gx, gy: centre as % of picture width/height
  //   size:   radius as % of the picture's shorter side
  //   width:  line thickness as ‰ (per-mille) of the shorter side
  const defaults = {
    gx: 50, gy: 50, size: 25, ry: 25, rx: 20, rz: 0,
    back: 20, width: 0.4, outline: true, diam: true, cut: 0,
    colMer: '#ffffff', colEq: '#f2b441', colOut: '#ffffff',
  };
  const state = { ...defaults };

  let img = null, imgName = 'picture', imgType = 'image/png';
  const PLACEHOLDER = { w: 1600, h: 1000 };
  const picW = () => img ? img.naturalWidth : PLACEHOLDER.w;
  const picH = () => img ? img.naturalHeight : PLACEHOLDER.h;

  // Great circles on a unit sphere (y = polar axis). Two meridians 90° apart
  // meet at right angles at the poles and cross the equator at right angles.
  const N = 240;
  const circle = f => Array.from({ length: N + 1 }, (_, i) => f(i / N * 2 * Math.PI));
  const shapes = [
    { key: 'eq',  pts: circle(t => [Math.cos(t), 0, Math.sin(t)]) },
    { key: 'mer', pts: circle(t => [Math.cos(t), Math.sin(t), 0]) },
    { key: 'mer', pts: circle(t => [0, Math.sin(t), Math.cos(t)]) },
  ];

  // Globe-relative rotation. The globe's orientation is kept as a matrix, and
  // every change to a slider (or a drag) is applied as a rotation around one
  // of the globe's OWN axes, wherever that axis currently points:
  //   Spin = polar axis (through the poles),
  //   Tilt = ear-to-ear axis, Roll = front-to-back axis.
  // The slider values are the accumulated amount turned around each axis.
  const screenRot = (axis, deg) => {
    const c = Math.cos(deg * DEG), s = Math.sin(deg * DEG);
    if (axis === 'ry') return [[c, 0, s], [0, 1, 0], [-s, 0, c]];
    if (axis === 'rx') return [[1, 0, 0], [0, c, -s], [0, s, c]];
    return [[c, -s, 0], [s, c, 0], [0, 0, 1]];
  };
  const mul = (A, B) => A.map(r => [0, 1, 2].map(j => r[0] * B[0][j] + r[1] * B[1][j] + r[2] * B[2][j]));
  function orthonormalize(M) {
    // Gram–Schmidt on the columns to stop floating-point drift
    const col = j => [M[0][j], M[1][j], M[2][j]];
    const norm = v => { const l = Math.hypot(...v); return v.map(x => x / l); };
    const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
    const a = norm(col(0));
    let b = col(1); const d = dot(a, b); b = norm(b.map((x, i) => x - d * a[i]));
    const c = [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
    return [0, 1, 2].map(i => [a[i], b[i], c[i]]);
  }
  // Each slider move is one turn about that axis of the globe itself, wherever the
  // axis currently points. Turns about different axes don't commute, so the slider
  // values are per-axis totals, not a readout of the final orientation; Reset
  // returns to the neutral pose.
  let orient = [[1, 0, 0], [0, 1, 0], [0, 0, 1]];
  function turn(axis, deg) {
    if (!deg) return;
    orient = orthonormalize(mul(orient, screenRot(axis, deg))); // right-multiply = globe's own frame
    state[axis] = wrap(state[axis] + deg);
  }
  function resetOrientation(ry, rx, rz) {
    orient = [[1, 0, 0], [0, 1, 0], [0, 0, 1]];
    state.ry = state.rx = state.rz = 0;
    turn('ry', ry); turn('rx', rx); turn('rz', rz);
  }
  function rotator() {
    const M = orient;
    return ([x, y, z]) => [
      M[0][0] * x + M[0][1] * y + M[0][2] * z,
      M[1][0] * x + M[1][1] * y + M[1][2] * z,
      M[2][0] * x + M[2][1] * y + M[2][2] * z, // z > 0 faces viewer
    ];
  }

  // Draw the globe onto any 2D context in that context's pixel units.
  function drawGlobe(g, cx, cy, R, lw) {
    const rot = rotator();
    const proj = p => [cx + p[0] * R, cy - p[1] * R];
    const lerp = (a, b, t) => a.map((v, i) => v + (b[i] - v) * t);
    // Loomis side cuts: two parallel planes at x = ±d (mirror images across the
    // vertical centre plane) slice off the sides of the ball.
    const d = 1 - state.cut / 100;
    const paths = { merF: new Path2D(), merB: new Path2D(), eqF: new Path2D(), eqB: new Path2D() };
    // Parts of the great circles that the side cuts removed ("leftover" sides)
    const ghost = { mer: new Path2D(), eq: new Path2D() };
    const addGhost = (P, a, b) => { P.moveTo(...proj(rot(a))); P.lineTo(...proj(rot(b))); };

    // Add a body-space segment a→b, split where the visibility value changes sign.
    // vis(p) returns > 0 where the line faces the viewer.
    function addSeg(F, B, a, b, vis) {
      const va = vis(a), vb = vis(b);
      const ra = rot(a), rb = rot(b);
      const af = va >= 0, bf = vb >= 0;
      if (af === bf) { const P = af ? F : B; P.moveTo(...proj(ra)); P.lineTo(...proj(rb)); return; }
      const m = lerp(ra, rb, va / (va - vb));
      (af ? F : B).moveTo(...proj(ra)); (af ? F : B).lineTo(...proj(m));
      (bf ? F : B).moveTo(...proj(m));  (bf ? F : B).lineTo(...proj(rb));
    }
    const sphereVis = p => rot(p)[2];

    // Great circles, with the parts beyond the cut planes removed
    for (const s of shapes) {
      const F = paths[s.key + 'F'], B = paths[s.key + 'B'];
      for (let i = 1; i < s.pts.length; i++) {
        let a = s.pts[i - 1], b = s.pts[i];
        // Clip to −d ≤ x ≤ d
        let t0 = 0, t1 = 1;
        const dx = b[0] - a[0];
        if (Math.abs(dx) < 1e-12) { if (Math.abs(a[0]) > d) { addGhost(ghost[s.key], a, b); continue; } }
        else {
          let ta = (d - a[0]) / dx, tb = (-d - a[0]) / dx;
          if (ta > tb) [ta, tb] = [tb, ta];
          t0 = Math.max(t0, ta); t1 = Math.min(t1, tb);
          if (t0 >= t1) { addGhost(ghost[s.key], a, b); continue; }
          if (t0 > 0) addGhost(ghost[s.key], a, lerp(a, b, t0));
          if (t1 < 1) addGhost(ghost[s.key], lerp(a, b, t1), b);
        }
        addSeg(F, B, lerp(a, b, t0), lerp(a, b, t1), sphereVis);
      }
    }

    // Cut-face circles and their crosses. An edge point is visible if either the flat face or the
    // neighbouring sphere surface faces the viewer.
    const cutF = new Path2D(), cutB = new Path2D();
    if (state.cut > 0) {
      const r = Math.sqrt(Math.max(0, 1 - d * d));
      const nx = rot([1, 0, 0])[2]; // z of the +x face normal
      for (const sgn of [1, -1]) {
        const faceFront = sgn * nx > 0;
        const vis = faceFront ? () => 1 : sphereVis;
        let prev = [sgn * d, r, 0];
        for (let i = 1; i <= N; i++) {
          const t = i / N * 2 * Math.PI;
          const cur = [sgn * d, r * Math.cos(t), r * Math.sin(t)];
          addSeg(cutF, cutB, prev, cur, vis);
          prev = cur;
        }
        // Cross on the flat face: its upright and front-to-back diameters, which
        // join the ends of the clipped meridian and equator. They lie in the
        // face, so they are front lines only when the face itself is turned to
        // the viewer.
        const faceVis = () => faceFront ? 1 : -1;
        addSeg(cutF, cutB, [sgn * d, -r, 0], [sgn * d, r, 0], faceVis);
        addSeg(cutF, cutB, [sgn * d, 0, -r], [sgn * d, 0, r], faceVis);
      }
    }

    g.save();
    g.lineCap = 'round'; g.lineJoin = 'round';
    if (state.back > 0) {
      g.globalAlpha = state.back / 100; g.lineWidth = lw * 0.8;
      g.strokeStyle = state.colMer; g.stroke(paths.merB); g.stroke(cutB);
      g.strokeStyle = state.colEq;  g.stroke(paths.eqB);
      if (state.cut > 0) {
        g.lineWidth = lw * 0.6;
        g.strokeStyle = state.colMer; g.stroke(ghost.mer);
        g.strokeStyle = state.colEq;  g.stroke(ghost.eq);
      }
    }
    g.globalAlpha = 1;
    if (state.outline) {
      // Sphere silhouette, minus the arcs that the side cuts removed
      g.strokeStyle = state.colOut; g.lineWidth = lw * 0.7;
      const ex = rot([1, 0, 0]); // body x axis in camera space
      // The arcs the cuts removed are kept as "leftover" outline, dimmed with the
      // Back lines slider (gone at 0), like the lines behind the globe.
      const M = 720, kept = new Path2D(), cutAway = new Path2D();
      let prevIn = null, px = 0, py = 0;
      for (let i = 0; i <= M; i++) {
        const th = i / M * 2 * Math.PI, c = Math.cos(th), sn = Math.sin(th);
        const bodyX = ex[0] * c + ex[1] * sn; // dot with camera-space silhouette point
        const x = cx + c * R, y = cy - sn * R;
        const inside = Math.abs(bodyX) <= d + 1e-9;
        const P = inside ? kept : cutAway;
        if (inside !== prevIn) { P.moveTo(prevIn === null ? x : px, prevIn === null ? y : py); }
        P.lineTo(x, y);
        prevIn = inside; px = x; py = y;
      }
      g.stroke(kept);
      if (state.cut > 0 && state.back > 0) {
        g.globalAlpha = state.back / 100; g.lineWidth = lw * 0.6;
        g.stroke(cutAway);
        g.globalAlpha = 1;
      }
    }
    if (state.diam) {
      // Dashed diameters in the equatorial plane, rotating with the globe:
      //   roll diameter   = x axis (ear to ear), equator colour; ends at the cut faces
      //   front–back axis = z axis (brow point to back of head), meridian colour
      // Both are broken around a hollow centre marker so the circle stays empty.
      const rr = lw * 3;
      g.lineWidth = lw;
      const dashed = (axis, color) => {
        g.strokeStyle = color; g.setLineDash([lw * 4, lw * 3]);
        for (const sgn of [1, -1]) {
          const [ex, ey] = proj(rot(axis.map(v => v * sgn)));
          const dx = ex - cx, dy = ey - cy, L = Math.hypot(dx, dy);
          if (L <= rr) continue; // axis points straight at the viewer
          g.beginPath(); g.moveTo(cx + dx / L * rr, cy + dy / L * rr); g.lineTo(ex, ey); g.stroke();
        }
      };
      dashed([d, 0, 0], state.colEq);
      dashed([0, 0, 1], state.colMer);
      g.setLineDash([]);
      g.strokeStyle = state.colEq;
      g.beginPath(); g.arc(cx, cy, rr, 0, 2 * Math.PI); g.stroke();
    }
    g.lineWidth = lw;
    g.strokeStyle = state.colMer; g.stroke(paths.merF); g.stroke(cutF);
    g.strokeStyle = state.colEq;  g.stroke(paths.eqF);
    g.restore();
  }

  // Globe geometry in picture pixels
  function globeInPicture() {
    const w = picW(), h = picH(), short = Math.min(w, h);
    return {
      cx: state.gx / 100 * w, cy: state.gy / 100 * h,
      R: state.size / 100 * short, lw: Math.max(0.5, state.width / 100 * short),
    };
  }

  // View transform: picture fitted inside the stage
  let W = 0, H = 0, dpr = 1, view = { s: 1, ox: 0, oy: 0 };
  function layout() {
    const pad = 16;
    const s = Math.min((W - pad * 2) / picW(), (H - pad * 2) / picH());
    view = { s, ox: (W - picW() * s) / 2, oy: (H - picH() * s) / 2 };
  }
  function resize() {
    const r = stage.getBoundingClientRect();
    dpr = window.devicePixelRatio || 1; W = r.width; H = r.height;
    canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr);
    layout(); draw();
  }

  function draw() {
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, W, H);
    const { s, ox, oy } = view;
    const pw = picW() * s, ph = picH() * s;
    if (img) {
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(img, ox, oy, pw, ph);
    } else {
      ctx.save();
      ctx.strokeStyle = getComputedStyle(document.documentElement).getPropertyValue('--frame');
      ctx.setLineDash([6, 6]); ctx.lineWidth = 1;
      ctx.strokeRect(ox + 0.5, oy + 0.5, pw - 1, ph - 1);
      ctx.restore();
    }
    // Clip the globe to the picture so the preview matches the export
    ctx.save();
    ctx.beginPath(); ctx.rect(ox, oy, pw, ph); ctx.clip();
    const g = globeInPicture();
    drawGlobe(ctx, ox + g.cx * s, oy + g.cy * s, g.R * s, g.lw * s);
    ctx.restore();
  }

  let raf = 0;
  const schedule = () => { if (!raf) raf = requestAnimationFrame(() => { raf = 0; draw(); }); };

  // ---------- Controls ----------
  const wrap = a => ((a + 180) % 360 + 360) % 360 - 180;
  const fmt = {
    gx: v => `${v.toFixed(1)}%`, gy: v => `${v.toFixed(1)}%`, size: v => `${v.toFixed(1)}%`,
    ry: v => `${Math.round(v)}°`, rx: v => `${Math.round(v)}°`, rz: v => `${Math.round(v)}°`,
    back: v => v == 0 ? 'Gone' : `${Math.round(v)}%`, cut: v => v == 0 ? 'Off' : `${Math.round(v)}%`, width: v => v.toFixed(2),
  };
  const ranges = {};
  for (const k of Object.keys(fmt)) {
    const el = $(k); ranges[k] = { el, out: el.closest('.row').querySelector('output') };
    el.addEventListener('input', () => {
      const v = parseFloat(el.value);
      if (k === 'ry' || k === 'rx' || k === 'rz') turn(k, wrap(v - state[k]));
      else state[k] = v;
      sync(); schedule();
    });
  }
  for (const k of ['colMer', 'colEq', 'colOut']) {
    $(k).addEventListener('input', e => { state[k] = e.target.value; schedule(); });
  }
  $('outline').addEventListener('change', e => { state.outline = e.target.checked; schedule(); });
  $('diam').addEventListener('change', e => { state.diam = e.target.checked; schedule(); });
  // Only one of Spin / Tilt can be locked; locking one unlocks the other

  function sync() {
    for (const k of Object.keys(ranges)) {
      ranges[k].el.value = state[k];
      ranges[k].out.textContent = fmt[k](state[k]);
    }
    $('outline').checked = state.outline;
    $('diam').checked = state.diam;
    for (const k of ['colMer', 'colEq', 'colOut']) $(k).value = state[k];
  }

  $('reset').onclick = () => {
    resetOrientation(0, 0, 0); sync(); schedule();
  };

  // ---------- Dragging on the picture ----------
  // Rotate: a horizontal drag spins the globe about its own polar axis and a
  // vertical drag tilts it about its own ear-to-ear axis: the same
  // globe-relative turns as the Spin and Tilt sliders, fed with pointer deltas.
  // The drag distance is divided by the globe's on-screen radius, so the
  // surface at the centre of the globe keeps pace with the pointer.
  // Place: a right-button drag (or any drag while the place toggle is on, for
  // touch) moves the globe's centre with the pointer.
  // Resize: the mouse wheel, or a two-finger pinch, scales the radius.
  const clamp = (v, k) => Math.min(+ranges[k].el.max, Math.max(+ranges[k].el.min, v));
  const placeMode = $('placeMode');
  const pointers = new Map(); // pointerId -> last position
  let gesture = null, dragId = null, pinchDist = 0;
  const pinchSpan = () => {
    const [p, q] = [...pointers.values()];
    return Math.hypot(p.x - q.x, p.y - q.y);
  };
  const setGesture = g => {
    gesture = g;
    canvas.classList.toggle('dragging', g === 'rotate');
    canvas.classList.toggle('placing', g === 'place');
  };
  canvas.addEventListener('pointerdown', e => {
    if (e.button !== 0 && e.button !== 2) return;
    pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
    canvas.setPointerCapture(e.pointerId);
    if (pointers.size === 1) {
      dragId = e.pointerId;
      setGesture(e.button === 2 || placeMode.checked ? 'place' : 'rotate');
    } else if (pointers.size === 2) {
      setGesture('pinch'); pinchDist = pinchSpan();
    }
  });
  canvas.addEventListener('pointermove', e => {
    const last = pointers.get(e.pointerId);
    if (!last) return;
    const dx = e.clientX - last.x, dy = e.clientY - last.y;
    last.x = e.clientX; last.y = e.clientY;
    if (gesture === 'pinch') {
      if (pointers.size < 2) return;
      const d = pinchSpan();
      if (pinchDist > 0) state.size = clamp(state.size * d / pinchDist, 'size');
      pinchDist = d;
    } else if (e.pointerId !== dragId) {
      return;
    } else if (gesture === 'place') {
      state.gx = clamp(state.gx + dx / (picW() * view.s) * 100, 'gx');
      state.gy = clamp(state.gy + dy / (picH() * view.s) * 100, 'gy');
    } else if (gesture === 'rotate') {
      const perPx = 1 / (globeInPicture().R * view.s) / DEG;
      turn('ry', dx * perPx); turn('rx', dy * perPx);
    } else {
      return;
    }
    sync(); schedule();
  });
  const endPointer = e => {
    if (!pointers.delete(e.pointerId)) return;
    // After a pinch, the finger left on the glass does nothing until it lifts too
    if (!pointers.size) { setGesture(null); dragId = null; }
    else if (gesture !== 'pinch') { if (e.pointerId === dragId) { setGesture(null); dragId = null; } }
    else setGesture('idle');
  };
  canvas.addEventListener('pointerup', endPointer);
  canvas.addEventListener('pointercancel', endPointer);
  // The right button places the globe, so it must not open the context menu
  canvas.addEventListener('contextmenu', e => e.preventDefault());
  canvas.addEventListener('wheel', e => {
    e.preventDefault();
    // Lines → pixels; a trackpad pinch arrives as a ctrl+wheel with small deltas
    const dy = e.deltaY * (e.deltaMode === 1 ? 16 : 1);
    state.size = clamp(state.size * Math.exp(-dy * (e.ctrlKey ? 0.01 : 0.0015)), 'size');
    sync(); schedule();
  }, { passive: false });
  placeMode.addEventListener('change', () => canvas.classList.toggle('place-mode', placeMode.checked));

  // ---------- Loading a picture ----------
  const status = $('status');
  function loadFile(file) {
    if (!file) return;
    if (!file.type.startsWith('image/')) { status.textContent = 'That file isn’t an image. Choose a JPG, PNG, WebP or GIF.'; return; }
    const reader = new FileReader();
    reader.onload = () => {
      const im = new Image();
      im.onload = () => {
        img = im; imgName = file.name.replace(/\.[^.]+$/, '') || 'picture';
        imgType = file.type;
        const empty = $('empty'); empty.hidden = true; empty.style.display = 'none';
        // Hide via both the attribute and inline style, so no stylesheet can override it
        const intro = $('intro'), dl = $('dlRow');
        intro.hidden = true; intro.style.display = 'none';
        dl.hidden = false; dl.style.display = 'flex';
        status.textContent = '';
        layout(); schedule();
      };
      im.onerror = () => { status.textContent = 'This browser can’t open that image format. Try a JPG or PNG.'; };
      im.src = reader.result;
    };
    reader.onerror = () => { status.textContent = 'The file couldn’t be read. Try choosing it again.'; };
    reader.readAsDataURL(file);
  }
  // The real file inputs sit invisibly on top of the buttons, so the tap lands
  // on the native input itself (programmatic .click() is blocked in some viewers).
  document.querySelectorAll('.file-in').forEach(inp =>
    inp.addEventListener('change', () => { loadFile(inp.files[0]); inp.value = ''; }));
  // Pasting an image also works
  window.addEventListener('paste', e => {
    const item = [...(e.clipboardData?.items || [])].find(i => i.type.startsWith('image/'));
    if (item) loadFile(item.getAsFile());
  });
  stage.addEventListener('dragover', e => { e.preventDefault(); stage.classList.add('over'); });
  stage.addEventListener('dragleave', () => stage.classList.remove('over'));
  stage.addEventListener('drop', e => {
    e.preventDefault(); stage.classList.remove('over');
    loadFile(e.dataTransfer.files[0]);
  });

  // ---------- Export at the picture's full resolution ----------
  // Inside claude.ai the page uses the downloads capability; opened as a plain
  // file in a browser, it falls back to an ordinary download link.
  let downloads = null;
  const saveBtn = $('save');
  if (window.claude && typeof window.claude.use === 'function') {
    window.claude.use('downloads').then(d => { downloads = d; }).catch(() => {});
  }
  saveBtn.onclick = async () => {
    if (!img) return;
    const out = document.createElement('canvas');
    out.width = picW(); out.height = picH();
    const g2 = out.getContext('2d');
    g2.drawImage(img, 0, 0);
    const g = globeInPicture();
    drawGlobe(g2, g.cx, g.cy, g.R, g.lw);
    status.textContent = 'Preparing image…';
    // Keep the original format: JPEG and WebP stay lossy at high quality, everything else is PNG
    const type = imgType === 'image/jpeg' || imgType === 'image/webp' ? imgType : 'image/png';
    const ext = { 'image/jpeg': 'jpg', 'image/webp': 'webp', 'image/png': 'png' }[type];
    const blob = await new Promise(res => out.toBlob(res, type, 0.95));
    if (!blob) { status.textContent = 'The image was too large to export on this device.'; return; }
    const filename = `${imgName}-globe.${ext}`;
    if (!downloads) {
      const url = URL.createObjectURL(blob);
      const a = Object.assign(document.createElement('a'), { href: url, download: filename });
      document.body.appendChild(a); a.click(); a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 10000);
      status.textContent = 'Downloaded.';
      return;
    }
    try {
      await downloads.save({ filename, data: blob });
      status.textContent = 'Saved.';
    } catch (err) {
      const code = err && err.code;
      status.textContent =
        code === 'declined' ? '' :
        code === 'too_large' ? 'The image is too large to save here. Try a smaller picture.' :
        code === 'rate_limited' ? 'A save prompt is already open.' :
        'Saving isn’t available in this view.';
    }
  };

  window.matchMedia('(prefers-color-scheme: dark)').addEventListener?.('change', schedule);
  new ResizeObserver(resize).observe(stage);
  resetOrientation(defaults.ry, defaults.rx, defaults.rz);
  sync(); resize();
})();
