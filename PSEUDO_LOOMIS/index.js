(() => {
  const DEG = Math.PI / 180;
  const $ = id => document.getElementById(id);
  const canvas = $('c'), stage = $('stage'), ctx = canvas.getContext('2d');

  // Globe position/size are stored relative to the picture, so they survive
  // window resizes and export at full resolution exactly as seen.
  //   gx, gy: centre as % of picture width/height
  //   size:   radius as % of the picture's shorter side
  //   width:  line thickness as ‰ (per-mille) of the shorter side
  //   frontSize, frontGap: the front marker's base diameter and its distance from
  //           the ball, as % of the globe's radius
  const defaults = {
    gx: 50, gy: 50, size: 25, ry: 25, rx: 20, rz: 0,
    back: 20, width: 0.4, outline: true, diam: true, front: true, frontSize: 20, frontGap: 0, cut: 0,
    colMer: '#ffffff', colEq: '#f2b441', colOut: '#ffffff',
  };
  const state = { ...defaults };

  // Settings are remembered between visits. The globe's place on the picture
  // and its rotation belong to one picture, so they always start from the defaults.
  const STORE_KEY = 'pseudoLoomis.settings';
  const STORED = Object.keys(defaults).filter(k => !['gx', 'gy', 'ry', 'rx', 'rz'].includes(k));
  const snapshot = () => JSON.stringify(Object.fromEntries(STORED.map(k => [k, state[k]])));
  try {
    const saved = JSON.parse(localStorage.getItem(STORE_KEY)) || {};
    for (const k of STORED) {
      const v = saved[k];
      if (typeof v !== typeof defaults[k]) continue;
      if (typeof v === 'number' && !Number.isFinite(v)) continue;
      if (typeof v === 'string' && !/^#[0-9a-f]{6}$/i.test(v)) continue;
      state[k] = v;
    }
  } catch { /* storage blocked or the saved text is damaged: keep the defaults */ }
  let stored = snapshot();
  function persist() {
    const now = snapshot();
    if (now === stored) return;
    stored = now;
    try { localStorage.setItem(STORE_KEY, now); } catch { /* private window, or storage is full */ }
  }

  let img = null, imgName = 'picture', imgType = 'image/png';
  const PLACEHOLDER = { w: 1600, h: 1000 };
  const picW = () => img ? img.naturalWidth : PLACEHOLDER.w;
  const picH = () => img ? img.naturalHeight : PLACEHOLDER.h;

  // Snap points: places for the globe's centre, marked on the picture so the
  // globe can be moved away and brought back. Stored like gx/gy (% of the
  // picture's width/height); they belong to one picture, so they are not saved.
  const marks = [];
  const MAX_MARKS = 8, SNAP_PX = 14, MARK_COLOR = '#ff2d2d';
  // Snapping puts the centre exactly on a point, so the snapped one is found by comparing
  const snappedMark = () => marks.findIndex(m => m.x === state.gx && m.y === state.gy);

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
  // every drag step is applied as a rotation around one of the globe's OWN
  // axes, wherever that axis currently points:
  //   Spin = polar axis (through the poles),
  //   Tilt = ear-to-ear axis, Roll = front-to-back axis.
  // state.ry/rx/rz are the accumulated amounts turned around each axis.
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
  // Each turn is about that axis of the globe itself, wherever the axis currently
  // points. Turns about different axes don't commute, so state.ry/rx/rz are
  // per-axis totals, not a readout of the final orientation; Reset returns to
  // the neutral pose.
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
  // Tilt lock. The on-screen inclination of the Tilt axis (the globe's
  // ear-to-ear axis, the dashed line in the equator colour) is held during
  // drags: after every Spin step, Roll is turned by whatever angle puts that
  // axis back on the locked direction. The correction is an ordinary
  // globe-relative Roll turn. The lever drag changes the inclination on
  // purpose, so the lock then picks up from the new one. Tilt turns about the
  // axis itself and never moves it.
  let lockDir = null; // unit screen direction of the Tilt axis
  function tiltAxisDir() {
    const x = orient[0][0], y = orient[1][0], l = Math.hypot(x, y);
    return l > 1e-6 ? [x / l, y / l] : null; // no inclination while it points at the viewer
  }
  function captureTiltAxis() { lockDir = tiltAxisDir(); }
  function holdTiltAxis() {
    if (!lockDir) { captureTiltAxis(); return; }
    const [ux, uy] = lockDir;
    // After a Roll of φ the axis is cos φ·X + sin φ·Y (X, Y = the globe's x and y
    // axes on screen); it is parallel to the locked direction when
    // cos φ·A + sin φ·B = 0, A and B being their cross products with it.
    const X = [orient[0][0], orient[1][0]], Y = [orient[0][1], orient[1][1]];
    const A = X[0] * uy - X[1] * ux, B = Y[0] * uy - Y[1] * ux;
    if (Math.hypot(A, B) < 1e-9) return; // every Roll gives the same inclination
    let phi = Math.atan2(-A, B);
    // The two solutions are half a turn apart; take the smaller correction. The
    // axis is a line with no front end, so it may swing through pointing at the
    // viewer and come out the other side without the globe jumping.
    if (phi > Math.PI / 2) phi -= Math.PI; else if (phi < -Math.PI / 2) phi += Math.PI;
    turn('rz', phi / DEG);
  }
  function rotator() {
    const M = orient;
    return ([x, y, z]) => [
      M[0][0] * x + M[0][1] * y + M[0][2] * z,
      M[1][0] * x + M[1][1] * y + M[1][2] * z,
      M[2][0] * x + M[2][1] * y + M[2][2] * z, // z > 0 faces viewer
    ];
  }

  // Draw the globe onto any 2D context in that context's pixel units. The front
  // marker only shows which way the globe faces while it is being set up, so the
  // export leaves it out (marker = false).
  function drawGlobe(g, cx, cy, R, lw, marker = true) {
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

    // Front marker: a small wireframe cone on the front axis (+z), where the
    // brow line meets the centre line of the face, in the meridian colour. At no gap its base is a circle on the ball; the gap slides the
    // whole cone outwards. It is outside the ball, so its lines are back lines
    // only while they are behind the ball's disc. Its height follows its
    // diameter, so the size slider scales it without changing its shape.
    if (marker && state.front) {
      const r = state.frontSize / 200, z0 = Math.sqrt(1 - r * r) + state.frontGap / 100;
      const apex = [0, 0, z0 + r * 2.5], K = 48, PARTS = 4;
      const coneVis = p => { const q = rot(p); return q[0] * q[0] + q[1] * q[1] >= 1 ? 1 : q[2]; };
      let prev = [r, 0, z0];
      for (let i = 1; i <= K; i++) {
        const t = i / K * 2 * Math.PI;
        const cur = [r * Math.cos(t), r * Math.sin(t), z0];
        addSeg(paths.merF, paths.merB, prev, cur, coneVis);
        if (i % (K / 4) === 0) {
          for (let k = 0; k < PARTS; k++) {
            addSeg(paths.merF, paths.merB, lerp(cur, apex, k / PARTS), lerp(cur, apex, (k + 1) / PARTS), coneVis);
          }
        }
        prev = cur;
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
    const pad = 16, foot = 68; // foot: room for the controls along the bottom of the stage
    const s = Math.min((W - pad * 2) / picW(), (H - pad - foot) / picH());
    view = { s, ox: (W - picW() * s) / 2, oy: pad + (H - pad - foot - picH() * s) / 2 };
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
    // Roll lever: only a guide for the gesture, so it is drawn here and never exported
    const ax = lever && tiltAxisDir();
    if (ax) {
      const reach = lever.p[0] * ax[0] + lever.p[1] * ax[1];
      const cx = ox + g.cx * s, cy = oy + g.cy * s;
      ctx.save();
      ctx.lineCap = 'round'; ctx.strokeStyle = LEVER_COLOR;
      ctx.lineWidth = Math.max(2, g.lw * s * 1.5);
      ctx.globalAlpha = Math.abs(reach) >= g.R * s ? 1 : 0.6; // dimmed until it reaches the circumference
      ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(cx + ax[0] * reach, cy - ax[1] * reach); ctx.stroke();
      ctx.restore();
    }
    // Snap points: guides for placing the globe, so they are never exported either.
    // The one the globe is snapped to gets a second ring.
    if (marks.length) {
      const on = snappedMark();
      ctx.save();
      ctx.strokeStyle = MARK_COLOR; ctx.lineWidth = 1;
      marks.forEach((m, i) => {
        const x = ox + m.x / 100 * pw, y = oy + m.y / 100 * ph;
        ctx.beginPath();
        ctx.arc(x, y, 7, 0, 2 * Math.PI);
        if (i === on) { ctx.moveTo(x + 10, y); ctx.arc(x, y, 10, 0, 2 * Math.PI); }
        ctx.moveTo(x - 13, y); ctx.lineTo(x + 13, y);
        ctx.moveTo(x, y - 13); ctx.lineTo(x, y + 13);
        ctx.stroke();
      });
      ctx.restore();
    }
  }

  let raf = 0;
  const schedule = () => { if (!raf) raf = requestAnimationFrame(() => { raf = 0; draw(); persist(); }); };

  // ---------- Controls ----------
  const wrap = a => ((a + 180) % 360 + 360) % 360 - 180;
  const fmt = {
    gx: v => `${v.toFixed(1)}%`, gy: v => `${v.toFixed(1)}%`, size: v => `${v.toFixed(1)}%`,
    frontSize: v => `${Math.round(v)}%`, frontGap: v => v == 0 ? 'None' : `${Math.round(v)}%`,
    back: v => v == 0 ? 'Gone' : `${Math.round(v)}%`, cut: v => v == 0 ? 'Off' : `${Math.round(v)}%`, width: v => v.toFixed(2),
  };
  const ranges = {};
  for (const k of Object.keys(fmt)) {
    const el = $(k); ranges[k] = { el, out: el.parentElement.querySelector('output') };
    el.addEventListener('input', () => {
      state[k] = parseFloat(el.value);
      sync(); schedule();
    });
  }
  for (const k of ['colMer', 'colEq', 'colOut']) {
    $(k).addEventListener('input', e => { state[k] = e.target.value; schedule(); });
  }
  $('outline').addEventListener('change', e => { state.outline = e.target.checked; schedule(); });
  $('diam').addEventListener('change', e => { state.diam = e.target.checked; schedule(); });
  $('front').addEventListener('change', e => { state.front = e.target.checked; schedule(); });

  function sync() {
    for (const k of Object.keys(ranges)) {
      ranges[k].el.value = state[k];
      ranges[k].out.textContent = fmt[k](state[k]);
    }
    $('outline').checked = state.outline;
    $('diam').checked = state.diam;
    $('front').checked = state.front;
    for (const k of ['colMer', 'colEq', 'colOut']) $(k).value = state[k];
    const on = snappedMark();
    $('markCount').textContent = `${marks.length} / ${MAX_MARKS}`;
    $('markAdd').disabled = on >= 0 || marks.length >= MAX_MARKS;
    $('markClear').disabled = on < 0;
    $('markClearAll').disabled = !marks.length;
  }

  $('markAdd').onclick = () => {
    if (snappedMark() >= 0 || marks.length >= MAX_MARKS) return;
    marks.push({ x: state.gx, y: state.gy });
    sync(); schedule();
  };
  $('markClear').onclick = () => {
    const on = snappedMark();
    if (on < 0) return;
    marks.splice(on, 1);
    sync(); schedule();
  };
  $('markClearAll').onclick = () => { marks.length = 0; sync(); schedule(); };

  $('reset').onclick = () => {
    resetOrientation(0, 0, 0); captureTiltAxis(); sync(); schedule();
  };

  // ---------- Dragging on the picture ----------
  // Rotate: a horizontal drag spins the globe about its own polar axis and a
  // vertical drag tilts it about its own ear-to-ear axis, fed with pointer
  // deltas. Each Spin step is followed by the Tilt lock's Roll correction.
  // The drag distance is divided by the globe's on-screen radius, so the
  // surface at the centre of the globe keeps pace with the pointer.
  // Lever: a rotate drag that starts inside the globe rolls it instead. A line
  // runs from the centre along the ear-to-ear axis, on the pointer's side, as
  // long as the pointer's projection onto that axis. While it reaches past the
  // circumference, the axis follows the pointer's turn about the centre: the
  // wanted direction goes to the Tilt lock, which finds the Roll turn for it.
  // Place: a right-button drag moves the globe's centre with the pointer. The
  // place toggle swaps the two buttons, so a touch or left-button drag places
  // and a right-button drag rotates. The centre jumps onto a snap point while
  // it is within SNAP_PX of it on screen. The drag itself is tracked unsnapped
  // (free), so that pulling further away lets go of the point again.
  // Resize: the mouse wheel, or a two-finger pinch, scales the radius.
  const clamp = (v, k) => Math.min(+ranges[k].el.max, Math.max(+ranges[k].el.min, v));
  const placeMode = $('placeMode');
  const pointers = new Map(); // pointerId -> last position
  let gesture = null, dragId = null, pinchDist = 0;
  let lever = null; // { p: pointer position from the globe's centre } during a lever drag
  let free = null; // { x, y }: where a place drag has taken the centre, before snapping
  const LEVER_COLOR = '#3fd0ff';
  const pinchSpan = () => {
    const [p, q] = [...pointers.values()];
    return Math.hypot(p.x - q.x, p.y - q.y);
  };
  // Pointer position measured from the globe's centre (y up), and the globe's radius, in CSS pixels
  const fromGlobe = e => {
    const g = globeInPicture(), r = canvas.getBoundingClientRect();
    return {
      p: [e.clientX - r.left - view.ox - g.cx * view.s, r.top + view.oy + g.cy * view.s - e.clientY],
      R: g.R * view.s,
    };
  };
  const setGesture = g => {
    gesture = g;
    canvas.classList.toggle('dragging', g === 'rotate' || g === 'lever');
    canvas.classList.toggle('placing', g === 'place');
    // The lever leaves a new inclination behind for the Tilt lock to hold
    if (g !== 'lever' && lever) { lever = null; captureTiltAxis(); schedule(); }
  };
  canvas.addEventListener('pointerdown', e => {
    if (e.button !== 0 && e.button !== 2) return;
    pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
    canvas.setPointerCapture(e.pointerId);
    if (pointers.size === 1) {
      dragId = e.pointerId;
      const { p, R } = fromGlobe(e);
      if ((e.button === 2) !== placeMode.checked) { free = { x: state.gx, y: state.gy }; setGesture('place'); }
      else if (Math.hypot(...p) <= R) { lever = { p }; setGesture('lever'); schedule(); }
      else setGesture('rotate');
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
      const pw = picW() * view.s, ph = picH() * view.s;
      free.x = clamp(free.x + dx / pw * 100, 'gx');
      free.y = clamp(free.y + dy / ph * 100, 'gy');
      let near = free, best = SNAP_PX;
      for (const m of marks) {
        const dist = Math.hypot((m.x - free.x) / 100 * pw, (m.y - free.y) / 100 * ph);
        if (dist <= best) { best = dist; near = m; }
      }
      state.gx = near.x; state.gy = near.y;
    } else if (gesture === 'rotate') {
      const perPx = 1 / (globeInPicture().R * view.s) / DEG;
      turn('ry', dx * perPx); holdTiltAxis(); turn('rx', dy * perPx);
    } else if (gesture === 'lever') {
      const { p, R } = fromGlobe(e), q = lever.p, ax = tiltAxisDir();
      lever.p = p;
      if (ax && Math.abs(p[0] * ax[0] + p[1] * ax[1]) >= R) {
        // Turn the axis by the angle the pointer swept about the centre
        const a = Math.atan2(q[0] * p[1] - q[1] * p[0], q[0] * p[0] + q[1] * p[1]);
        const c = Math.cos(a), s = Math.sin(a);
        lockDir = [ax[0] * c - ax[1] * s, ax[0] * s + ax[1] * c];
        holdTiltAxis();
      }
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
        marks.length = 0; // the snap points were places on the previous picture
        layout(); sync(); schedule();
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
    drawGlobe(g2, g.cx, g.cy, g.R, g.lw, false);
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
  captureTiltAxis();
  for (const k of STORED) if (ranges[k]) state[k] = clamp(state[k], k); // saved values from an older slider range
  sync(); resize();
})();
