/*
 * Hasta la Vista, Line
 * Buscador de puntos de fuga: dos pares de lineas -> dos fugas -> linea de horizonte.
 *
 * Todo el trabajo ocurre en un SVG cuyo viewBox hace de camara (pan + zoom).
 * El espacio de usuario del SVG ("mundo") coincide 1:1 con los pixeles de la
 * imagen original: la imagen se dibuja en (0,0) con su tamano natural, asi que
 * las coordenadas de las fugas son directamente coordenadas de la imagen y
 * pueden ser negativas o superar su ancho/alto.
 */
(function () {
  'use strict';

  var SVGNS = 'http://www.w3.org/2000/svg';
  var MAX_LINES = 4;
  var LINES_PER_PAIR = 2;
  var PARALLEL_EPS = 1e-6; // |sin(angulo)| por debajo de esto => paralelas
  var COORD_LIMIT = 1e7;   // mas alla de esto no dibujamos el marcador
  var LOUPE_SIZE = 160;    // debe coincidir con el ancho/alto de .loupe en CSS
  var LOUPE_ZOOM = 5;      // aumento de la lupa respecto al zoom actual del lienzo
  var LOUPE_GAP = 18;      // separacion vertical entre la lupa y el punto real

  /* ---------------------------------------------------------------- DOM */

  var svg = document.getElementById('board');
  var worldBg = document.getElementById('worldBg');
  var gridPattern = document.getElementById('gridPattern');
  var gridPath = document.getElementById('gridPath');
  var photo = document.getElementById('photo');
  var photoFrame = document.getElementById('photoFrame');
  var raysLayer = document.getElementById('raysLayer');
  var linesLayer = document.getElementById('linesLayer');
  var edgeLayer = document.getElementById('edgeLayer');
  var vpLayer = document.getElementById('vpLayer');
  var horizonLine = document.getElementById('horizonLine');
  var horizonHalo = document.getElementById('horizonHalo');
  var previewLine = document.getElementById('previewLine');

  var fileInput = document.getElementById('ifLoadImg');
  var btnAddLine = document.getElementById('btnAddLine');
  var pairBadge = document.getElementById('pairBadge');
  var btnDelLine = document.getElementById('btnDelLine');
  var btnClear = document.getElementById('btnClear');
  var btnZoomIn = document.getElementById('btnZoomIn');
  var btnZoomOut = document.getElementById('btnZoomOut');
  var btnFit = document.getElementById('btnFit');
  var btnFitAll = document.getElementById('btnFitAll');
  var zoomLabel = document.getElementById('zoomLabel');
  var hintEl = document.getElementById('hint');
  var emptyHint = document.getElementById('emptyHint');
  var panel = document.querySelector('.panel');
  var selCursorMode = document.getElementById('selCursorMode');
  var loupeEl = document.getElementById('loupe');
  var loupeSvg = document.getElementById('loupeSvg');

  var readout = {
    A: {
      count: document.getElementById('countA'),
      coords: document.getElementById('coordsA')
    },
    B: {
      count: document.getElementById('countB'),
      coords: document.getElementById('coordsB')
    }
  };
  var horizonInfo = document.getElementById('horizonInfo');

  /* -------------------------------------------------------------- Estado */

  var state = {
    img: { url: null, w: 1200, h: 800, loaded: false },
    view: { x: 0, y: 0, w: 1200, h: 800 },
    lines: [],          // { id, pair: 'A'|'B', a: {x,y}, b: {x,y} }
    selectedId: null,
    mode: 'idle',       // 'idle' | 'add'
    cursorMode: 'crosshair', // 'crosshair' | 'magnify'
    pending: null,      // primer punto mientras se inserta una linea
    pointerWorld: null, // posicion del puntero en el mundo (vista previa)
    nextId: 1
  };

  var pointers = new Map(); // pointerId -> {x, y} en pixeles de pantalla
  var drag = null;          // arrastre activo
  var pendingDrag = null;   // lo prepara el hijo, lo confirma el handler del svg
  var pinch = null;         // gesto de dos dedos
  var rafId = null;

  /* ------------------------------------------------------ Utilidades geom */

  function clamp(v, lo, hi) {
    return v < lo ? lo : (v > hi ? hi : v);
  }

  /**
   * Pantalla -> espacio de usuario del SVG.
   * Usa la matriz viva del SVG (getScreenCTM), que ya incorpora el viewBox
   * actual, el tamano en CSS y cualquier desplazamiento de la pagina, asi que
   * el resultado es exacto sea cual sea el estado de pan/zoom.
   */
  function toWorldXY(cx, cy) {
    var ctm = svg.getScreenCTM ? svg.getScreenCTM() : null;
    if (ctm) {
      var inv = ctm.inverse();
      return {
        x: inv.a * cx + inv.c * cy + inv.e,
        y: inv.b * cx + inv.d * cy + inv.f
      };
    }
    // Reserva: mapeo lineal con el viewBox (valido porque mantenemos la
    // relacion de aspecto del viewBox igual a la del elemento).
    var r = svg.getBoundingClientRect();
    return {
      x: state.view.x + (cx - r.left) * (state.view.w / r.width),
      y: state.view.y + (cy - r.top) * (state.view.h / r.height)
    };
  }

  /** Unidades de mundo por pixel CSS con el zoom actual. */
  function worldPerPx() {
    var r = svg.getBoundingClientRect();
    if (!r.width) return 1;
    return state.view.w / r.width;
  }

  /**
   * Interseccion de dos rectas INFINITAS definidas cada una por dos puntos.
   * Determinantes clasicos; denominador ~ 0 => paralelas (o casi).
   */
  function intersectLines(l1, l2) {
    var x1 = l1.a.x, y1 = l1.a.y, x2 = l1.b.x, y2 = l1.b.y;
    var x3 = l2.a.x, y3 = l2.a.y, x4 = l2.b.x, y4 = l2.b.y;

    var d1x = x1 - x2, d1y = y1 - y2;
    var d2x = x3 - x4, d2y = y3 - y4;

    var len1 = Math.hypot(d1x, d1y);
    var len2 = Math.hypot(d2x, d2y);
    if (len1 === 0 || len2 === 0) return null;

    var den = d1x * d2y - d1y * d2x;
    // den = len1 * len2 * sin(angulo): normalizamos para que el umbral sea
    // independiente de la longitud de los segmentos dibujados.
    if (Math.abs(den) / (len1 * len2) < PARALLEL_EPS) return null;

    var c1 = x1 * y2 - y1 * x2;
    var c2 = x3 * y4 - y3 * x4;

    return {
      x: (c1 * d2x - d1x * c2) / den,
      y: (c1 * d2y - d1y * c2) / den
    };
  }

  /**
   * Recorta una recta infinita (por p1,p2) contra un rectangulo (Liang-Barsky
   * con t inicial en +-infinito). Devuelve el segmento visible o null.
   */
  function clipInfiniteLine(p1, p2, x0, y0, x1, y1) {
    var dx = p2.x - p1.x;
    var dy = p2.y - p1.y;
    if (Math.abs(dx) < 1e-12 && Math.abs(dy) < 1e-12) return null;

    var t0 = -Infinity;
    var t1 = Infinity;
    var p = [-dx, dx, -dy, dy];
    var q = [p1.x - x0, x1 - p1.x, p1.y - y0, y1 - p1.y];

    for (var i = 0; i < 4; i++) {
      if (Math.abs(p[i]) < 1e-12) {
        if (q[i] < 0) return null;
      } else {
        var r = q[i] / p[i];
        if (p[i] < 0) {
          if (r > t1) return null;
          if (r > t0) t0 = r;
        } else {
          if (r < t0) return null;
          if (r < t1) t1 = r;
        }
      }
    }
    if (!isFinite(t0) || !isFinite(t1)) return null;
    return {
      a: { x: p1.x + t0 * dx, y: p1.y + t0 * dy },
      b: { x: p1.x + t1 * dx, y: p1.y + t1 * dy }
    };
  }

  /**
   * Punto donde la recta INFINITA (p1,p2) cruza el borde vertical x = edgeX,
   * o null si la recta es (casi) vertical o el cruce cae fuera de [yMin, yMax]
   * (es decir, la recta sale por arriba/abajo antes de llegar a ese borde).
   */
  function edgeCrossing(p1, p2, edgeX, yMin, yMax) {
    var dx = p2.x - p1.x;
    if (Math.abs(dx) < 1e-9) return null;
    var t = (edgeX - p1.x) / dx;
    var y = p1.y + t * (p2.y - p1.y);
    if (y < yMin - 1e-6 || y > yMax + 1e-6) return null;
    return { x: edgeX, y: y };
  }

  function isOutsideImage(pt) {
    return pt.x < 0 || pt.x > state.img.w || pt.y < 0 || pt.y > state.img.h;
  }

  /* --------------------------------------------------------- Pares y fugas */

  function pairLines(pair) {
    return state.lines.filter(function (l) { return l.pair === pair; });
  }

  function nextPair() {
    if (pairLines('A').length < LINES_PER_PAIR) return 'A';
    if (pairLines('B').length < LINES_PER_PAIR) return 'B';
    return null;
  }

  /** { status: 'incomplete' | 'parallel' | 'ok', point? } */
  function pairVP(pair) {
    var ls = pairLines(pair);
    if (ls.length < LINES_PER_PAIR) {
      return { status: 'incomplete', missing: LINES_PER_PAIR - ls.length };
    }
    var pt = intersectLines(ls[0], ls[1]);
    if (!pt || !isFinite(pt.x) || !isFinite(pt.y)) return { status: 'parallel' };
    return { status: 'ok', point: pt };
  }

  /**
   * Una fuga "necesita" marcadores de borde cuando queda fuera del encuadre:
   * fuera de la imagen, o en el infinito (par paralelo). Un par incompleto
   * todavia no tiene nada que marcar.
   */
  function pairNeedsEdgeMarkers(vp) {
    if (vp.status === 'parallel') return true;
    if (vp.status === 'ok') return isOutsideImage(vp.point);
    return false;
  }

  /* ------------------------------------------------------------ Camara */

  /**
   * Vuelca state.view en el atributo viewBox SIN esperar al render.
   * El repintado va throttleado con requestAnimationFrame, pero toWorldXY lee
   * la matriz viva del SVG: si el viewBox se quedara atras, un toque o un
   * segundo evento de rueda dentro del mismo fotograma se anclaria en una
   * transformacion caduca. Por eso la camara se aplica siempre en el acto.
   */
  function applyViewBox() {
    var v = state.view;
    svg.setAttribute('viewBox', v.x + ' ' + v.y + ' ' + v.w + ' ' + v.h);
  }

  /** Iguala la relacion de aspecto del viewBox a la del elemento. */
  function syncAspect() {
    var r = svg.getBoundingClientRect();
    if (!r.width || !r.height) return;
    var target = r.height / r.width;
    var cy = state.view.y + state.view.h / 2;
    state.view.h = state.view.w * target;
    state.view.y = cy - state.view.h / 2;
    applyViewBox();
  }

  function minViewW() { return 8; }

  function maxViewW() {
    return Math.max(state.img.w, state.img.h, 400) * 120;
  }

  /** Zoom manteniendo fijo el punto del mundo bajo (cx, cy) de pantalla. */
  function zoomAt(cx, cy, factor) {
    var r = svg.getBoundingClientRect();
    if (!r.width || !r.height) return;

    // Posicion relativa del cursor dentro del elemento (0..1). El punto del
    // mundo se deduce de state.view (no del DOM) para que encadenar zooms en
    // el mismo fotograma no acumule error.
    var rx = (cx - r.left) / r.width;
    var ry = (cy - r.top) / r.height;
    var before = {
      x: state.view.x + rx * state.view.w,
      y: state.view.y + ry * state.view.h
    };

    var newW = clamp(state.view.w * factor, minViewW(), maxViewW());
    var newH = state.view.h * (newW / state.view.w);

    state.view.w = newW;
    state.view.h = newH;
    state.view.x = before.x - rx * newW;
    state.view.y = before.y - ry * newH;
    applyViewBox();
    scheduleRender();
  }

  function panByScreen(dx, dy) {
    var k = worldPerPx();
    state.view.x -= dx * k;
    state.view.y -= dy * k;
    applyViewBox();
  }

  function fitBox(x0, y0, x1, y1, pad) {
    var r = svg.getBoundingClientRect();
    if (!r.width || !r.height) return;

    var w = Math.max(x1 - x0, 1) * pad;
    var h = Math.max(y1 - y0, 1) * pad;
    var aspect = r.height / r.width;

    if (h / w < aspect) h = w * aspect;
    else w = h / aspect;

    w = clamp(w, minViewW(), maxViewW());
    h = w * aspect;

    state.view.w = w;
    state.view.h = h;
    state.view.x = (x0 + x1) / 2 - w / 2;
    state.view.y = (y0 + y1) / 2 - h / 2;
    applyViewBox();
    scheduleRender();
  }

  function fitImage() {
    fitBox(0, 0, state.img.w, state.img.h, 1.08);
  }

  function fitAll() {
    var x0 = 0, y0 = 0, x1 = state.img.w, y1 = state.img.h;
    ['A', 'B'].forEach(function (pair) {
      var vp = pairVP(pair);
      if (vp.status !== 'ok') return;
      if (Math.abs(vp.point.x) > COORD_LIMIT || Math.abs(vp.point.y) > COORD_LIMIT) return;
      x0 = Math.min(x0, vp.point.x);
      x1 = Math.max(x1, vp.point.x);
      y0 = Math.min(y0, vp.point.y);
      y1 = Math.max(y1, vp.point.y);
    });
    fitBox(x0, y0, x1, y1, 1.14);
  }

  /** Centra la vista en un punto, alejando lo justo para no perder la imagen. */
  function centerOnPoint(pt) {
    var r = svg.getBoundingClientRect();
    if (!r.width || !r.height) return;

    var dx = Math.max(0 - pt.x, 0, pt.x - state.img.w);
    var dy = Math.max(0 - pt.y, 0, pt.y - state.img.h);
    var dist = Math.hypot(dx, dy);

    var w = Math.max(state.view.w, dist * 2.4 + state.img.w * 0.25);
    w = clamp(w, minViewW(), maxViewW());
    var h = w * (r.height / r.width);

    state.view.w = w;
    state.view.h = h;
    state.view.x = pt.x - w / 2;
    state.view.y = pt.y - h / 2;
    applyViewBox();
    scheduleRender();
  }

  /* ------------------------------------------------------------- Render */

  function scheduleRender() {
    if (rafId) return;
    rafId = requestAnimationFrame(function () {
      rafId = null;
      render();
    });
  }

  function el(name, attrs, cls) {
    var node = document.createElementNS(SVGNS, name);
    for (var k in attrs) {
      if (Object.prototype.hasOwnProperty.call(attrs, k)) {
        node.setAttribute(k, attrs[k]);
      }
    }
    if (cls) node.setAttribute('class', cls);
    return node;
  }

  function gridStepFor(k) {
    var target = 42 * k; // ~42 px CSS entre lineas
    var steps = [1, 2, 5, 10, 25, 50, 100, 250, 500, 1000, 2500, 5000, 10000,
      25000, 50000, 100000, 250000, 500000, 1000000];
    for (var i = 0; i < steps.length; i++) {
      if (steps[i] >= target) return steps[i];
    }
    return steps[steps.length - 1];
  }

  function render() {
    var r = svg.getBoundingClientRect();
    if (!r.width || !r.height) return;

    var v = state.view;
    var k = v.w / r.width; // unidades de mundo por pixel CSS

    applyViewBox();

    // Fondo con cuadricula: cubre siempre la vista actual.
    var step = gridStepFor(k);
    gridPattern.setAttribute('width', step);
    gridPattern.setAttribute('height', step);
    gridPath.setAttribute('d', 'M ' + step + ' 0 L 0 0 L 0 ' + step);
    worldBg.setAttribute('x', v.x - v.w);
    worldBg.setAttribute('y', v.y - v.h);
    worldBg.setAttribute('width', v.w * 3);
    worldBg.setAttribute('height', v.h * 3);

    // Marco de la imagen
    photoFrame.setAttribute('width', state.img.w);
    photoFrame.setAttribute('height', state.img.h);

    // Rectangulo de recorte para los rayos: un poco mas grande que la vista.
    var padX = v.w * 0.02;
    var padY = v.h * 0.02;
    var cx0 = v.x - padX, cy0 = v.y - padY;
    var cx1 = v.x + v.w + padX, cy1 = v.y + v.h + padY;

    raysLayer.textContent = '';
    linesLayer.textContent = '';
    edgeLayer.textContent = '';
    vpLayer.textContent = '';

    var segFrag = document.createDocumentFragment();
    var nodeFrag = document.createDocumentFragment();

    state.lines.forEach(function (line) {
      var pairCls = 'pair-' + line.pair.toLowerCase();
      var sel = line.id === state.selectedId;

      // Prolongacion infinita (discontinua) hasta el borde de la vista
      var ray = clipInfiniteLine(line.a, line.b, cx0, cy0, cx1, cy1);
      if (ray) {
        var rayAttrs = {
          x1: ray.a.x, y1: ray.a.y, x2: ray.b.x, y2: ray.b.y,
          'vector-effect': 'non-scaling-stroke'
        };
        raysLayer.appendChild(el('line', rayAttrs, 'ray-halo'));
        raysLayer.appendChild(el('line', rayAttrs, 'ray ' + pairCls));
      }

      var segAttrs = {
        x1: line.a.x, y1: line.a.y, x2: line.b.x, y2: line.b.y,
        'vector-effect': 'non-scaling-stroke'
      };

      // Zona de agarre del cuerpo (transparente y ancha), debajo de todo
      var hit = el('line', segAttrs, 'hit');
      hit.addEventListener('pointerdown', makeBodyHandler(line));
      segFrag.appendChild(hit);

      // Segmento visible + halo
      segFrag.appendChild(el('line', segAttrs, 'seg-halo' + (sel ? ' is-selected' : '')));
      segFrag.appendChild(el('line', segAttrs, 'seg ' + pairCls + (sel ? ' is-selected' : '')));

      // Nodos
      ['a', 'b'].forEach(function (key) {
        var p = line[key];
        var grab = el('circle', { cx: p.x, cy: p.y, r: 16 * k }, 'node-hit');
        grab.addEventListener('pointerdown', makeNodeHandler(line, key));
        nodeFrag.appendChild(grab);
        nodeFrag.appendChild(el('circle', {
          cx: p.x, cy: p.y, r: 6 * k, 'vector-effect': 'non-scaling-stroke'
        }, 'node ' + pairCls));
      });
    });

    linesLayer.appendChild(segFrag);
    linesLayer.appendChild(nodeFrag);

    // Marcadores de fuga
    var vps = { A: pairVP('A'), B: pairVP('B') };
    ['A', 'B'].forEach(function (pair) {
      var vp = vps[pair];
      if (vp.status !== 'ok') return;
      var p = vp.point;
      if (Math.abs(p.x) > COORD_LIMIT || Math.abs(p.y) > COORD_LIMIT) return;

      var cls = 'pair-' + pair.toLowerCase();
      var rad = 11 * k;
      var arm = 20 * k;
      var ringAttrs = {
        cx: p.x, cy: p.y, r: rad, 'vector-effect': 'non-scaling-stroke'
      };
      var hAttrs = {
        x1: p.x - arm, y1: p.y, x2: p.x + arm, y2: p.y,
        'vector-effect': 'non-scaling-stroke'
      };
      var vAttrs = {
        x1: p.x, y1: p.y - arm, x2: p.x, y2: p.y + arm,
        'vector-effect': 'non-scaling-stroke'
      };

      var g = el('g', {}, 'vp');
      g.appendChild(el('circle', ringAttrs, 'vp-halo-ring'));
      g.appendChild(el('line', hAttrs, 'vp-halo-cross'));
      g.appendChild(el('line', vAttrs, 'vp-halo-cross'));
      g.appendChild(el('circle', ringAttrs, 'vp-ring ' + cls));
      g.appendChild(el('line', hAttrs, 'vp-cross ' + cls));
      g.appendChild(el('line', vAttrs, 'vp-cross ' + cls));

      var label = el('text', {
        x: p.x + arm * 0.7, y: p.y - arm * 0.7, 'font-size': 20 * k
      }, 'vp-label');
      label.textContent = 'VP-' + pair;
      g.appendChild(label);
      vpLayer.appendChild(g);
    });

    // Linea de horizonte: recta infinita que pasa por las dos fugas
    var horizonExists = vps.A.status === 'ok' && vps.B.status === 'ok';
    var horizonSeg = horizonExists
      ? clipInfiniteLine(vps.A.point, vps.B.point, cx0, cy0, cx1, cy1)
      : null;
    [horizonHalo, horizonLine].forEach(function (node) {
      if (horizonSeg) {
        node.setAttribute('x1', horizonSeg.a.x);
        node.setAttribute('y1', horizonSeg.a.y);
        node.setAttribute('x2', horizonSeg.b.x);
        node.setAttribute('y2', horizonSeg.b.y);
        node.style.display = '';
      } else {
        node.style.display = 'none';
      }
    });

    // Marcadores donde las lineas de cada par (y el horizonte) cruzan los
    // bordes izquierdo/derecho de la imagen: solo cuando la fuga de ese par
    // queda fuera del encuadre, para poder apuntar hacia ella sin verla.
    var edgeXs = [0, state.img.w];
    var edgeFrag = document.createDocumentFragment();

    function markEdgeCrossings(p1, p2, cls) {
      edgeXs.forEach(function (edgeX) {
        var pt = edgeCrossing(p1, p2, edgeX, 0, state.img.h);
        if (!pt) return;
        var s = 8 * k;
        edgeFrag.appendChild(el('rect', {
          x: pt.x - s, y: pt.y - s, width: s * 2, height: s * 2,
          transform: 'rotate(45 ' + pt.x + ' ' + pt.y + ')',
          'vector-effect': 'non-scaling-stroke'
        }, 'edge-marker ' + cls));
      });
    }

    var needA = pairNeedsEdgeMarkers(vps.A);
    var needB = pairNeedsEdgeMarkers(vps.B);
    if (needA) {
      pairLines('A').forEach(function (line) { markEdgeCrossings(line.a, line.b, 'pair-a'); });
    }
    if (needB) {
      pairLines('B').forEach(function (line) { markEdgeCrossings(line.a, line.b, 'pair-b'); });
    }
    if (horizonExists && (needA || needB)) {
      markEdgeCrossings(vps.A.point, vps.B.point, 'horizon');
    }
    edgeLayer.appendChild(edgeFrag);

    // Vista previa mientras se inserta una linea
    if (state.mode === 'add' && state.pending && state.pointerWorld) {
      previewLine.setAttribute('x1', state.pending.x);
      previewLine.setAttribute('y1', state.pending.y);
      previewLine.setAttribute('x2', state.pointerWorld.x);
      previewLine.setAttribute('y2', state.pointerWorld.y);
      previewLine.style.display = '';
    } else {
      previewLine.style.display = 'none';
    }

    renderReadout(vps);
    zoomLabel.textContent = Math.round((r.width / v.w) * 100) + '%';
  }

  function fmtCoord(n) {
    var v = Math.round(n);
    if (Object.is(v, -0)) v = 0;
    return String(v);
  }

  function renderReadout(vps) {
    ['A', 'B'].forEach(function (pair) {
      var vp = vps[pair];
      var ls = pairLines(pair);
      var ui = readout[pair];
      ui.count.textContent = ls.length + '/' + LINES_PER_PAIR;
      ui.coords.className = 'vp-coords';

      if (vp.status === 'incomplete') {
        ui.coords.textContent = vp.missing === 2
          ? 'Faltan 2 líneas'
          : 'Falta 1 línea';
      } else if (vp.status === 'parallel') {
        ui.coords.className = 'vp-coords is-parallel';
        ui.coords.textContent = 'Líneas paralelas — punto de fuga en el infinito';
      } else {
        var p = vp.point;
        var out = isOutsideImage(p);
        ui.coords.className = 'vp-coords is-ready';
        ui.coords.textContent = 'x ' + fmtCoord(p.x) + ' · y ' + fmtCoord(p.y) +
          (out ? ' · fuera de la imagen' : '');
      }

      panel.querySelectorAll('[data-pair="' + pair + '"]').forEach(function (btn) {
        if (btn.dataset.act === 'center') btn.disabled = vp.status !== 'ok';
        else btn.disabled = ls.length === 0;
      });
    });

    if (vps.A.status === 'ok' && vps.B.status === 'ok') {
      var dy = vps.B.point.y - vps.A.point.y;
      var dx = vps.B.point.x - vps.A.point.x;
      var deg = Math.atan2(dy, dx) * 180 / Math.PI;
      if (deg > 90) deg -= 180;
      if (deg < -90) deg += 180;
      horizonInfo.className = 'vp-coords is-ready';
      horizonInfo.textContent = 'Trazado · inclinación ' + deg.toFixed(1) + '°';
    } else if (vps.A.status === 'parallel' || vps.B.status === 'parallel') {
      horizonInfo.className = 'vp-coords is-parallel';
      horizonInfo.textContent = 'Se necesitan dos fugas finitas.';
    } else {
      horizonInfo.className = 'vp-coords';
      horizonInfo.textContent = 'Aparece cuando existen las dos fugas.';
    }

    btnDelLine.disabled = state.selectedId === null;
    btnAddLine.disabled = state.lines.length >= MAX_LINES;
    var np = nextPair();
    pairBadge.textContent = np || '—';
    pairBadge.setAttribute('data-pair', np || '');
    btnAddLine.classList.toggle('is-active', state.mode === 'add');
    emptyHint.classList.toggle('hidden', state.img.loaded || state.lines.length > 0);
  }

  function setHint(text) {
    if (text) {
      hintEl.textContent = text;
      hintEl.classList.add('show');
    } else {
      hintEl.classList.remove('show');
      hintEl.textContent = '';
    }
  }

  function hideLoupe() {
    loupeEl.classList.remove('show');
  }

  /**
   * Vista previa ampliada del punto bajo el cursor, mientras se coloca una
   * linea. Se desplaza por encima del cursor (no sobre el) para que el punto
   * que realmente se va a tocar quede libre. La ventana del mundo que
   * muestra se calcula a partir de worldPerPx(), no de state.view.w/h
   * directamente, porque la lupa es cuadrada y el lienzo principal no
   * siempre lo es: usar sus proporciones distorsionaria la imagen ampliada.
   */
  function updateLoupe(clientX, clientY, worldPt) {
    if (state.cursorMode !== 'magnify' || state.mode !== 'add') {
      hideLoupe();
      return;
    }

    var top = clientY - LOUPE_SIZE - LOUPE_GAP;
    var left = clientX - LOUPE_SIZE / 2;
    top = clamp(top, 8, window.innerHeight - LOUPE_SIZE - 8);
    left = clamp(left, 8, window.innerWidth - LOUPE_SIZE - 8);
    loupeEl.style.top = top + 'px';
    loupeEl.style.left = left + 'px';
    loupeEl.classList.add('show');

    var span = LOUPE_SIZE * worldPerPx() / LOUPE_ZOOM;
    loupeSvg.setAttribute('viewBox',
      (worldPt.x - span / 2) + ' ' + (worldPt.y - span / 2) + ' ' + span + ' ' + span);
  }

  /* --------------------------------------------------------- Interaccion */

  function selectLine(id) {
    state.selectedId = id;
    scheduleRender();
  }

  function makeNodeHandler(line, key) {
    return function (ev) {
      if (state.mode === 'add') return;
      if (typeof ev.button === 'number' && ev.button > 0) return;
      selectLine(line.id);
      pendingDrag = { type: 'node', lineId: line.id, key: key };
    };
  }

  function makeBodyHandler(line) {
    return function (ev) {
      if (state.mode === 'add') return;
      if (typeof ev.button === 'number' && ev.button > 0) return;
      selectLine(line.id);
      var w = toWorldXY(ev.clientX, ev.clientY);
      pendingDrag = {
        type: 'body',
        lineId: line.id,
        startWorld: w,
        startA: { x: line.a.x, y: line.a.y },
        startB: { x: line.b.x, y: line.b.y }
      };
    };
  }

  function lineById(id) {
    for (var i = 0; i < state.lines.length; i++) {
      if (state.lines[i].id === id) return state.lines[i];
    }
    return null;
  }

  function startAddMode() {
    if (state.lines.length >= MAX_LINES) return;
    state.mode = 'add';
    state.pending = null;
    state.pointerWorld = null;
    svg.classList.add('is-adding');
    setHint('Toca para colocar el primer punto (Esc para cancelar)');
    scheduleRender();
  }

  function cancelAddMode() {
    state.mode = 'idle';
    state.pending = null;
    state.pointerWorld = null;
    svg.classList.remove('is-adding');
    setHint('');
    hideLoupe();
    scheduleRender();
  }

  function handleAddTap(ev) {
    var p = toWorldXY(ev.clientX, ev.clientY);
    if (!state.pending) {
      state.pending = p;
      state.pointerWorld = p;
      setHint('Toca para colocar el segundo punto (Esc para cancelar)');
      scheduleRender();
      return;
    }
    var minLen = 8 * worldPerPx();
    if (Math.hypot(p.x - state.pending.x, p.y - state.pending.y) < minLen) {
      return; // demasiado corta: seguimos esperando el segundo punto
    }
    var pair = nextPair();
    if (!pair) { cancelAddMode(); return; }
    state.lines.push({
      id: state.nextId++,
      pair: pair,
      a: { x: state.pending.x, y: state.pending.y },
      b: { x: p.x, y: p.y }
    });
    state.selectedId = state.lines[state.lines.length - 1].id;
    cancelAddMode();
  }

  function onPointerDown(ev) {
    if (typeof ev.button === 'number' && ev.button > 0) {
      pendingDrag = null;
      return;
    }
    pointers.set(ev.pointerId, { x: ev.clientX, y: ev.clientY });

    if (pointers.size >= 2) {
      pendingDrag = null;
      drag = null;
      svg.classList.remove('is-panning');
      startPinch();
      return;
    }

    if (state.mode === 'add') {
      pendingDrag = null;
      handleAddTap(ev);
      return;
    }

    if (pendingDrag) {
      drag = pendingDrag;
      pendingDrag = null;
    } else {
      if (state.selectedId !== null) selectLine(null);
      drag = {
        type: 'pan',
        startClient: { x: ev.clientX, y: ev.clientY },
        startView: { x: state.view.x, y: state.view.y, w: state.view.w, h: state.view.h }
      };
      svg.classList.add('is-panning');
    }

    try { svg.setPointerCapture(ev.pointerId); } catch (e) { /* ignorar */ }
  }

  function onPointerMove(ev) {
    if (pointers.has(ev.pointerId)) {
      pointers.set(ev.pointerId, { x: ev.clientX, y: ev.clientY });
    }

    if (pinch) {
      updatePinch();
      return;
    }

    if (state.mode === 'add') {
      var addWorld = toWorldXY(ev.clientX, ev.clientY);
      updateLoupe(ev.clientX, ev.clientY, addWorld);
      if (state.pending) {
        state.pointerWorld = addWorld;
        scheduleRender();
      }
      return;
    }

    if (!drag) return;

    if (drag.type === 'pan') {
      var r = svg.getBoundingClientRect();
      if (!r.width) return;
      var kx = drag.startView.w / r.width;
      var ky = drag.startView.h / r.height;
      state.view.x = drag.startView.x - (ev.clientX - drag.startClient.x) * kx;
      state.view.y = drag.startView.y - (ev.clientY - drag.startClient.y) * ky;
      applyViewBox();
      scheduleRender();
      return;
    }

    var line = lineById(drag.lineId);
    if (!line) { drag = null; return; }
    var w = toWorldXY(ev.clientX, ev.clientY);

    if (drag.type === 'node') {
      // El otro nodo queda fijo: la linea gira sobre el.
      line[drag.key].x = w.x;
      line[drag.key].y = w.y;
    } else if (drag.type === 'body') {
      // Traslacion pura: se conserva el angulo.
      var dx = w.x - drag.startWorld.x;
      var dy = w.y - drag.startWorld.y;
      line.a.x = drag.startA.x + dx;
      line.a.y = drag.startA.y + dy;
      line.b.x = drag.startB.x + dx;
      line.b.y = drag.startB.y + dy;
    }
    scheduleRender();
  }

  function endPointer(ev) {
    pointers.delete(ev.pointerId);
    if (pinch && pointers.size < 2) pinch = null;
    if (drag) {
      drag = null;
      svg.classList.remove('is-panning');
    }
    pendingDrag = null;
    try {
      if (svg.hasPointerCapture && svg.hasPointerCapture(ev.pointerId)) {
        svg.releasePointerCapture(ev.pointerId);
      }
    } catch (e) { /* ignorar */ }
  }

  function startPinch() {
    var pts = Array.from(pointers.values());
    var p1 = pts[0], p2 = pts[1];
    pinch = {
      dist: Math.hypot(p2.x - p1.x, p2.y - p1.y),
      mid: { x: (p1.x + p2.x) / 2, y: (p1.y + p2.y) / 2 }
    };
  }

  function updatePinch() {
    var pts = Array.from(pointers.values());
    if (pts.length < 2) return;
    var p1 = pts[0], p2 = pts[1];
    var dist = Math.hypot(p2.x - p1.x, p2.y - p1.y);
    var mid = { x: (p1.x + p2.x) / 2, y: (p1.y + p2.y) / 2 };

    panByScreen(mid.x - pinch.mid.x, mid.y - pinch.mid.y);
    if (dist > 0 && pinch.dist > 0) {
      zoomAt(mid.x, mid.y, pinch.dist / dist);
    }
    pinch.dist = dist;
    pinch.mid = mid;
    scheduleRender();
  }

  function onWheel(ev) {
    ev.preventDefault();
    var delta = ev.deltaMode === 1 ? ev.deltaY * 16 : ev.deltaY;
    zoomAt(ev.clientX, ev.clientY, Math.exp(clamp(delta, -400, 400) * 0.0016));
  }

  /* --------------------------------------------------------- Comandos UI */

  function deleteSelected() {
    if (state.selectedId === null) return;
    state.lines = state.lines.filter(function (l) { return l.id !== state.selectedId; });
    state.selectedId = null;
    scheduleRender();
  }

  function clearPair(pair) {
    state.lines = state.lines.filter(function (l) { return l.pair !== pair; });
    state.selectedId = null;
    scheduleRender();
  }

  function clearAll() {
    state.lines = [];
    state.selectedId = null;
    cancelAddMode();
    scheduleRender();
  }

  function loadImageFile(file) {
    if (!file) return;
    var url = URL.createObjectURL(file);
    var probe = new Image();
    probe.onload = function () {
      if (state.img.url) URL.revokeObjectURL(state.img.url);
      state.img.url = url;
      state.img.w = probe.naturalWidth || probe.width || 1200;
      state.img.h = probe.naturalHeight || probe.height || 800;
      state.img.loaded = true;

      photo.setAttribute('href', url);
      photo.setAttributeNS('http://www.w3.org/1999/xlink', 'xlink:href', url);
      photo.setAttribute('width', state.img.w);
      photo.setAttribute('height', state.img.h);
      photo.style.display = '';

      fitImage();
      render();
    };
    probe.onerror = function () {
      URL.revokeObjectURL(url);
      setHint('No se pudo leer la imagen');
      setTimeout(function () { setHint(''); }, 2500);
    };
    probe.src = url;
  }

  /* --------------------------------------------------------------- Eventos */

  svg.addEventListener('pointerdown', onPointerDown);
  svg.addEventListener('pointermove', onPointerMove);
  svg.addEventListener('pointerup', endPointer);
  svg.addEventListener('pointercancel', endPointer);
  svg.addEventListener('pointerleave', hideLoupe);
  svg.addEventListener('wheel', onWheel, { passive: false });
  svg.addEventListener('contextmenu', function (ev) { ev.preventDefault(); });
  svg.addEventListener('dragstart', function (ev) { ev.preventDefault(); });

  fileInput.addEventListener('change', function (ev) {
    loadImageFile(ev.target.files && ev.target.files[0]);
    ev.target.value = '';
  });

  btnAddLine.addEventListener('click', function () {
    if (state.mode === 'add') cancelAddMode();
    else startAddMode();
  });
  btnDelLine.addEventListener('click', deleteSelected);
  btnClear.addEventListener('click', clearAll);

  selCursorMode.addEventListener('change', function () {
    state.cursorMode = selCursorMode.value;
    if (state.cursorMode !== 'magnify') hideLoupe();
  });
  btnFit.addEventListener('click', fitImage);
  btnFitAll.addEventListener('click', fitAll);

  btnZoomIn.addEventListener('click', function () {
    var r = svg.getBoundingClientRect();
    zoomAt(r.left + r.width / 2, r.top + r.height / 2, 1 / 1.3);
  });
  btnZoomOut.addEventListener('click', function () {
    var r = svg.getBoundingClientRect();
    zoomAt(r.left + r.width / 2, r.top + r.height / 2, 1.3);
  });

  panel.addEventListener('click', function (ev) {
    var btn = ev.target.closest('button[data-act]');
    if (!btn) return;
    var pair = btn.dataset.pair;
    if (btn.dataset.act === 'clear') {
      clearPair(pair);
    } else if (btn.dataset.act === 'center') {
      var vp = pairVP(pair);
      if (vp.status === 'ok') centerOnPoint(vp.point);
    }
  });

  document.addEventListener('keydown', function (ev) {
    var tag = ev.target && ev.target.tagName;
    if (tag === 'INPUT' || tag === 'TEXTAREA') return;
    if (ev.key === 'Escape') {
      if (state.mode === 'add') cancelAddMode();
      else selectLine(null);
    } else if (ev.key === 'Delete' || ev.key === 'Backspace') {
      if (state.selectedId !== null) {
        ev.preventDefault();
        deleteSelected();
      }
    } else if (ev.key === 'a' || ev.key === 'A') {
      if (!btnAddLine.disabled) startAddMode();
    }
  });

  if (window.ResizeObserver) {
    new ResizeObserver(function () {
      syncAspect();
      scheduleRender();
    }).observe(svg);
  } else {
    window.addEventListener('resize', function () {
      syncAspect();
      scheduleRender();
    });
  }

  /* ------------------------------------------------------------- Arranque */

  syncAspect();
  fitImage();
  render();

  // Expuesto solo para pruebas manuales desde la consola.
  window.HLVL = {
    state: state,
    toWorldXY: toWorldXY,
    intersectLines: intersectLines,
    pairVP: pairVP,
    render: render
  };
})();
