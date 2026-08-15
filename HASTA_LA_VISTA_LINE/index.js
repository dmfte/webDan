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
  var colorA = document.getElementById('colorA');
  var colorB = document.getElementById('colorB');
  var colorH = document.getElementById('colorH');

  var btnHelp = document.getElementById('btnHelp');
  var helpDialog = document.getElementById('helpDialog');
  var btnHelpClose = document.getElementById('btnHelpClose');

  var btnExport = document.getElementById('btnExport');
  var exportDialog = document.getElementById('exportDialog');
  var btnExportClose = document.getElementById('btnExportClose');
  var selPageSize = document.getElementById('selPageSize');
  var exportPreview = document.getElementById('exportPreview');
  var exportSliderMount = document.getElementById('exportSliderMount');
  var exportHint = document.getElementById('exportHint');
  var btnExportDownload = document.getElementById('btnExportDownload');

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
  var btnLevel = document.getElementById('btnLevel');
  var chkAutoCrop = document.getElementById('chkAutoCrop');

  /* -------------------------------------------------------------- Estado */

  /**
   * Lee una variable CSS ya aplicada (p.ej. --pair-a) del elemento raiz.
   * Los colores por defecto de los pares VIVEN en styles.css (:root); esto
   * solo los lee para darle un valor inicial a state.colors y a los
   * selectores de color, no duplica el valor.
   */
  function cssVar(name, fallback) {
    var v = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
    return v || fallback;
  }

  var state = {
    img: { url: null, file: null, w: 1200, h: 800, loaded: false },
    view: { x: 0, y: 0, w: 1200, h: 800 },
    lines: [],          // { id, pair: 'A'|'B', a: {x,y}, b: {x,y} }
    selectedId: null,
    mode: 'idle',       // 'idle' | 'add'
    cursorMode: 'crosshair', // 'crosshair' | 'magnify'
    // Colores editables por el usuario (selector junto a cada fuga); el
    // valor de partida sale de --pair-a/--pair-b en styles.css.
    colors: {
      A: cssVar('--pair-a', '#ff6b35'),
      B: cssVar('--pair-b', '#35c2ff'),
      horizon: cssVar('--horizon', '#b6ff3f')
    },
    pending: null,      // primer punto mientras se inserta una linea
    pointerWorld: null, // posicion del puntero en el mundo (vista previa)
    nextId: 1
  };

  var pointers = new Map(); // pointerId -> {x, y} en pixeles de pantalla
  var drag = null;          // arrastre activo
  var pendingDrag = null;   // lo prepara el hijo, lo confirma el handler del svg
  var pinch = null;         // gesto de dos dedos
  var middlePan = null;     // paneo con boton central, independiente de "drag"
  var rafId = null;

  /* ----------------------------------------------------------- Ajustes
   * Preferencias que sobreviven a un recargo de pagina (localStorage), no
   * el trabajo en curso: la imagen, las lineas y la vista se quedan fuera
   * a proposito, solo persisten los controles de configuracion.
   */

  var SETTINGS_KEY = 'hlvl:settings';
  var CURSOR_MODES = ['crosshair', 'magnify'];
  var PAGE_SIZE_VALUES = ['A4-portrait', 'A4-landscape', 'Letter-portrait', 'Letter-landscape'];
  var HEX_COLOR_RE = /^#[0-9a-f]{6}$/i;

  function loadSettings() {
    try {
      var raw = localStorage.getItem(SETTINGS_KEY);
      var parsed = raw ? JSON.parse(raw) : null;
      return (parsed && typeof parsed === 'object') ? parsed : {};
    } catch (e) {
      return {}; // localStorage no disponible (privado, cuota, etc.)
    }
  }

  function saveSetting(key, value) {
    try {
      var current = loadSettings();
      current[key] = value;
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(current));
    } catch (e) { /* se ignora: no hay forma de persistir, no es fatal */ }
  }

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
   * o null si la recta es (casi) horizontal o el cruce cae fuera de
   * [yMin, yMax] (es decir, la recta sale por arriba/abajo antes de llegar
   * a ese borde).
   */
  function edgeCrossingV(p1, p2, edgeX, yMin, yMax) {
    var dx = p2.x - p1.x;
    if (Math.abs(dx) < 1e-9) return null;
    var t = (edgeX - p1.x) / dx;
    var y = p1.y + t * (p2.y - p1.y);
    if (y < yMin - 1e-6 || y > yMax + 1e-6) return null;
    return { x: edgeX, y: y };
  }

  /**
   * Analogo a edgeCrossingV pero para el borde horizontal y = edgeY: null si
   * la recta es (casi) vertical o el cruce cae fuera de [xMin, xMax].
   */
  function edgeCrossingH(p1, p2, edgeY, xMin, xMax) {
    var dy = p2.y - p1.y;
    if (Math.abs(dy) < 1e-9) return null;
    var t = (edgeY - p1.y) / dy;
    var x = p1.x + t * (p2.x - p1.x);
    if (x < xMin - 1e-6 || x > xMax + 1e-6) return null;
    return { x: x, y: edgeY };
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

    // Marcadores donde las lineas de cada par (y el horizonte) cruzan
    // cualquiera de los cuatro bordes de la imagen: solo cuando la fuga de
    // ese par queda fuera del encuadre, para poder apuntar hacia ella sin
    // verla.
    var edgeXs = [0, state.img.w]; // bordes izquierdo/derecho
    var edgeYs = [0, state.img.h]; // bordes superior/inferior
    var edgeFrag = document.createDocumentFragment();

    function addEdgeMarker(pt, cls) {
      var s = 8 * k;
      edgeFrag.appendChild(el('rect', {
        x: pt.x - s, y: pt.y - s, width: s * 2, height: s * 2,
        transform: 'rotate(45 ' + pt.x + ' ' + pt.y + ')',
        'vector-effect': 'non-scaling-stroke'
      }, 'edge-marker ' + cls));
    }

    function markEdgeCrossings(p1, p2, cls) {
      edgeXs.forEach(function (edgeX) {
        var pt = edgeCrossingV(p1, p2, edgeX, 0, state.img.h);
        if (pt) addEdgeMarker(pt, cls);
      });
      edgeYs.forEach(function (edgeY) {
        var pt = edgeCrossingH(p1, p2, edgeY, 0, state.img.w);
        if (pt) addEdgeMarker(pt, cls);
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
        var out = isOutsideImage(vp.point);
        ui.coords.className = 'vp-coords is-ready';
        ui.coords.textContent = out ? 'Fuera de la imagen' : '';
      }

      panel.querySelectorAll('[data-pair="' + pair + '"]').forEach(function (btn) {
        btn.disabled = ls.length === 0;
      });
    });

    var horizonOk = vps.A.status === 'ok' && vps.B.status === 'ok';
    if (horizonOk) {
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

    btnLevel.disabled = !horizonOk;
    btnLevel.classList.toggle('is-active', exportState.leveled && horizonOk);
    btnLevel.setAttribute('aria-pressed', String(exportState.leveled && horizonOk));
    chkAutoCrop.disabled = !exportState.leveled || !horizonOk;

    btnAddLine.disabled = state.lines.length >= MAX_LINES;
    btnExport.disabled = !state.img.loaded;
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
   * Vista previa ampliada del punto bajo el cursor, mientras se coloca o se
   * reposiciona una linea (nodo o cuerpo). Se desplaza por encima del cursor
   * (no sobre el) para que el punto que realmente se va a tocar quede libre.
   * La ventana del mundo que muestra se calcula a partir de worldPerPx(), no
   * de state.view.w/h directamente, porque la lupa es cuadrada y el lienzo
   * principal no siempre lo es: usar sus proporciones distorsionaria la
   * imagen ampliada.
   */
  function updateLoupe(clientX, clientY, worldPt) {
    var repositioning = drag && (drag.type === 'node' || drag.type === 'body');
    if (state.cursorMode !== 'magnify' || !(state.mode === 'add' || repositioning)) {
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

  function updatePanningCursor() {
    svg.classList.toggle('is-panning', !!middlePan || (!!drag && drag.type === 'pan'));
  }

  function onPointerDown(ev) {
    if (ev.button === 1) {
      // Boton central: solo mueve la camara. No toca selectedId, drag ni
      // pendingDrag, para poder pasear la imagen por debajo de un nodo que
      // se esta arrastrando (o de una linea a medio colocar) sin soltarlo.
      ev.preventDefault();
      pointers.set(ev.pointerId, { x: ev.clientX, y: ev.clientY });
      middlePan = {
        startClient: { x: ev.clientX, y: ev.clientY },
        startView: { x: state.view.x, y: state.view.y, w: state.view.w, h: state.view.h }
      };
      updatePanningCursor();
      try { svg.setPointerCapture(ev.pointerId); } catch (e) { /* ignorar */ }
      return;
    }
    if (typeof ev.button === 'number' && ev.button > 0) {
      pendingDrag = null;
      return;
    }
    pointers.set(ev.pointerId, { x: ev.clientX, y: ev.clientY });

    if (pointers.size >= 2) {
      pendingDrag = null;
      drag = null;
      middlePan = null;
      updatePanningCursor();
      hideLoupe();
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
      updatePanningCursor();
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

    // El paneo con boton central es independiente de cualquier otro gesto:
    // se aplica siempre que este activo, y lo que siga (nodo, cuerpo o
    // vista previa de "add") lee la camara ya actualizada.
    if (middlePan) {
      var mr = svg.getBoundingClientRect();
      if (mr.width) {
        var mkx = middlePan.startView.w / mr.width;
        var mky = middlePan.startView.h / mr.height;
        state.view.x = middlePan.startView.x - (ev.clientX - middlePan.startClient.x) * mkx;
        state.view.y = middlePan.startView.y - (ev.clientY - middlePan.startClient.y) * mky;
        applyViewBox();
        scheduleRender();
      }
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
    updateLoupe(ev.clientX, ev.clientY, w);

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
    // Cada boton del raton dispara su propio pointerup (mismo pointerId,
    // "button" indica cual se solto): soltar el central no debe terminar un
    // arrastre de nodo/cuerpo que siga vivo con el izquierdo, ni viceversa.
    // pointercancel no trae un "button" fiable, asi que ahi soltamos todo.
    var cancelled = ev.type === 'pointercancel';
    var isOtherButton = typeof ev.button === 'number' && ev.button > 0 && ev.button !== 1;

    if (cancelled || ev.button === 1) {
      middlePan = null;
    }
    if (!isOtherButton && (cancelled || ev.button !== 1)) {
      if (drag) {
        hideLoupe();
        drag = null;
      }
      pendingDrag = null;
    }
    updatePanningCursor();

    if (cancelled || !ev.buttons) {
      pointers.delete(ev.pointerId);
      if (pinch && pointers.size < 2) pinch = null;
      try {
        if (svg.hasPointerCapture && svg.hasPointerCapture(ev.pointerId)) {
          svg.releasePointerCapture(ev.pointerId);
        }
      } catch (e) { /* ignorar */ }
    }
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
      state.img.file = file; // bytes originales, para poder incrustarla al exportar a PDF
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

  /* ----------------------------------------------------------- Exportar PDF
   *
   * Todo el trabajo ocurre en "espacio de pagina": igual que el mundo del
   * SVG principal, pero en puntos PDF (1pt = 1/72"), origen arriba-izquierda
   * (como el SVG; solo se invierte el eje Y al dibujar con pdf-lib, que usa
   * origen abajo-izquierda). Esto permite reutilizar clipInfiniteLine /
   * edgeCrossingV / edgeCrossingH / pairVP tal cual, pasandoles el
   * rectangulo de la pagina en vez del rectangulo de la imagen o de la
   * vista.
   *
   * El mando deslizante (0..1) interpola entre dos encuadres fijos, los dos
   * "contain-fit" (nunca cover-fit: la foto jamas debe cruzar el margen):
   *  - t=0: el rectangulo que envuelve la imagen Y las fugas finitas queda
   *    centrado en la pagina -> las fugas se ven.
   *  - t=1: la imagen sola, centrada, tan grande como quepa sin cruzar el
   *    margen -> su dimension mayor toca el margen; la otra queda con
   *    holgura.
   * Tanto la escala como la posicion se interpolan linealmente entre esos
   * dos extremos, asi que el encuadre se desplaza (no solo cambia de
   * tamano) segun donde caigan las fugas. Como ambos extremos respetan el
   * margen y la interpolacion es lineal, cualquier "borde de la foto" es
   * tambien una funcion lineal de t acotada en los dos extremos -> se
   * mantiene dentro del margen en TODO el recorrido del mando, no solo en
   * los extremos.
   */

  var CM_TO_PT = 72 / 2.54;
  var EXPORT_MARGIN_PT = 0.5 * CM_TO_PT;
  var PAGE_SIZES = { A4: [595.28, 841.89], Letter: [612, 792] };

  var exportState = { t: 0, slider: null, pageSizeRestored: false, leveled: false, autoCrop: true };

  function rotatePoint(pt, theta, pivot) {
    var dx = pt.x - pivot.x, dy = pt.y - pivot.y;
    var cos = Math.cos(theta), sin = Math.sin(theta);
    return { x: pivot.x + dx * cos - dy * sin, y: pivot.y + dx * sin + dy * cos };
  }

  /**
   * Rectangulo axis-aligned mas grande que cabe dentro de un rectangulo
   * WxH girado un angulo phi (radianes; se usa su valor absoluto).
   * Sistema general (las dos restricciones -ancho y alto- a tope a la
   * vez); cuando ese sistema pide una dimension negativa (angulo
   * pronunciado en una imagen alargada -- nada raro para corregir un
   * horizonte en una foto panoramica), solo UNA restriccion queda a tope
   * y el rectangulo se dimensiona a partir de esa sola cara.
   */
  function computeInscribedCrop(W, H, phi) {
    phi = Math.abs(phi) % Math.PI;
    if (phi > Math.PI / 2) phi = Math.PI - phi;
    // Reducir a [0, 45°]: el problema a mas de 45° es el mismo que a
    // (90°-phi) con W y H intercambiados, y asi cos(2*phi) nunca es
    // negativo en el resto de la funcion.
    var swapped = false;
    if (phi > Math.PI / 4) {
      phi = Math.PI / 2 - phi;
      var t = W; W = H; H = t;
      swapped = true;
    }

    var cosP = Math.cos(phi), sinP = Math.sin(phi);
    var cos2 = Math.cos(2 * phi);
    var w, h;
    if (Math.abs(cos2) < 1e-9) {
      // 45° exactos: caso clasico del cuadrado inscrito.
      w = h = Math.min(W, H) / Math.SQRT2;
    } else {
      var fullW = (W * cosP - H * sinP) / cos2;
      var fullH = (H * cosP - W * sinP) / cos2;
      if (fullW >= 0 && fullH >= 0) {
        w = fullW; h = fullH;
      } else if (fullH < 0) {
        // H es la dimension que limita: solo esa cara queda a tope.
        w = H / (2 * sinP); h = H / (2 * cosP);
      } else {
        w = W / (2 * cosP); h = W / (2 * sinP);
      }
    }

    if (swapped) { var tmp = w; w = h; h = tmp; }
    return { w: Math.max(w, 1), h: Math.max(h, 1) };
  }

  /**
   * Angulo y pivote para "nivelar" la exportacion: gira foto + lineas +
   * fugas para que el horizonte quede perfectamente horizontal. null si
   * el nivelado esta desactivado o el horizonte todavia no existe (hacen
   * falta las dos fugas finitas).
   */
  function getLevelTransform() {
    if (!exportState.leveled) return null;
    var vpA = pairVP('A'), vpB = pairVP('B');
    if (vpA.status !== 'ok' || vpB.status !== 'ok') return null;
    var dy = vpB.point.y - vpA.point.y;
    var dx = vpB.point.x - vpA.point.x;
    var deg = Math.atan2(dy, dx) * 180 / Math.PI;
    if (deg > 90) deg -= 180;
    if (deg < -90) deg += 180;
    return {
      deg: deg,
      thetaDeg: -deg,
      theta: -deg * Math.PI / 180,
      pivot: { x: state.img.w / 2, y: state.img.h / 2 }
    };
  }

  /**
   * Marco efectivo para exportar: identidad si no hay nivelado. Si lo hay,
   * mapPoint gira cualquier punto del mundo (foto, lineas, fugas) el mismo
   * angulo alrededor del centro de la imagen, e imgBBox es el rectangulo
   * -en ese mismo espacio ya girado- que representa "la foto" a efectos
   * de encaje en la pagina: el rectangulo inscrito si se recorta, o el
   * bbox de sus 4 esquinas giradas si no (la foto entera, inclinada).
   */
  function getExportFrame() {
    var lvl = getLevelTransform();
    if (!lvl) {
      return {
        mapPoint: function (pt) { return pt; },
        imgBBox: { x0: 0, y0: 0, x1: state.img.w, y1: state.img.h },
        leveled: null
      };
    }
    var mapPoint = function (pt) { return rotatePoint(pt, lvl.theta, lvl.pivot); };
    var imgBBox;
    if (exportState.autoCrop) {
      var crop = computeInscribedCrop(state.img.w, state.img.h, lvl.theta);
      imgBBox = {
        x0: lvl.pivot.x - crop.w / 2, y0: lvl.pivot.y - crop.h / 2,
        x1: lvl.pivot.x + crop.w / 2, y1: lvl.pivot.y + crop.h / 2
      };
    } else {
      var corners = [
        mapPoint({ x: 0, y: 0 }), mapPoint({ x: state.img.w, y: 0 }),
        mapPoint({ x: state.img.w, y: state.img.h }), mapPoint({ x: 0, y: state.img.h })
      ];
      var xs = corners.map(function (c) { return c.x; });
      var ys = corners.map(function (c) { return c.y; });
      imgBBox = {
        x0: Math.min.apply(null, xs), y0: Math.min.apply(null, ys),
        x1: Math.max.apply(null, xs), y1: Math.max.apply(null, ys)
      };
    }
    return { mapPoint: mapPoint, imgBBox: imgBBox, leveled: lvl };
  }

  function currentPageDims() {
    var parts = selPageSize.value.split('-');
    var base = PAGE_SIZES[parts[0]] || PAGE_SIZES.A4;
    var w = base[0], h = base[1];
    if (parts[1] === 'landscape') { var tmp = w; w = h; h = tmp; }
    return { w: w, h: h };
  }

  function withinRect(p, x0, y0, x1, y1) {
    return p.x >= x0 - 1e-6 && p.x <= x1 + 1e-6 && p.y >= y0 - 1e-6 && p.y <= y1 + 1e-6;
  }

  /**
   * Bbox-min (imagen + fugas finitas) y bbox-max (solo imagen), y las
   * escalas de contain-fit de cada una (dentro del area imprimible, ya
   * descontado el margen) para la pagina dada. bbox-max SIEMPRE contiene a
   * bbox-min (la imagen es parte de las dos), asi que scaleMax >= scaleMin
   * por construccion.
   */
  function computePageGeom(pageW, pageH) {
    var frame = getExportFrame();
    var x0 = frame.imgBBox.x0, y0 = frame.imgBBox.y0;
    var x1 = frame.imgBBox.x1, y1 = frame.imgBBox.y1;
    var vps = { A: pairVP('A'), B: pairVP('B') };

    ['A', 'B'].forEach(function (pair) {
      var vp = vps[pair];
      if (vp.status !== 'ok') return;
      if (Math.abs(vp.point.x) > COORD_LIMIT || Math.abs(vp.point.y) > COORD_LIMIT) return;
      var p = frame.mapPoint(vp.point);
      x0 = Math.min(x0, p.x);
      x1 = Math.max(x1, p.x);
      y0 = Math.min(y0, p.y);
      y1 = Math.max(y1, p.y);
    });

    var printW = Math.max(pageW - 2 * EXPORT_MARGIN_PT, 1);
    var printH = Math.max(pageH - 2 * EXPORT_MARGIN_PT, 1);
    var bw = Math.max(x1 - x0, 1);
    var bh = Math.max(y1 - y0, 1);
    var imgBW = Math.max(frame.imgBBox.x1 - frame.imgBBox.x0, 1);
    var imgBH = Math.max(frame.imgBBox.y1 - frame.imgBBox.y0, 1);

    var scaleMin = Math.min(printW / bw, printH / bh);
    var scaleMax = Math.min(printW / imgBW, printH / imgBH);
    if (scaleMax < scaleMin) scaleMax = scaleMin; // resguardo por redondeo

    return {
      printW: printW, printH: printH, x0: x0, y0: y0, bw: bw, bh: bh,
      imgBW: imgBW, imgBH: imgBH,
      scaleMin: scaleMin, scaleMax: scaleMax, vps: vps, frame: frame
    };
  }

  /** Escala + origen (mundo -> pagina) para la posicion t (0..1) del mando. */
  function pageTransformAt(t, geom, pageW, pageH) {
    var scale = geom.scaleMin + t * (geom.scaleMax - geom.scaleMin);

    var px0 = EXPORT_MARGIN_PT + (geom.printW - geom.bw * geom.scaleMin) / 2;
    var py0 = EXPORT_MARGIN_PT + (geom.printH - geom.bh * geom.scaleMin) / 2;
    var originX0 = px0 - geom.x0 * geom.scaleMin;
    var originY0 = py0 - geom.y0 * geom.scaleMin;

    var imgBBox = geom.frame.imgBBox;
    var px1 = EXPORT_MARGIN_PT + (geom.printW - geom.imgBW * geom.scaleMax) / 2;
    var py1 = EXPORT_MARGIN_PT + (geom.printH - geom.imgBH * geom.scaleMax) / 2;
    var originX1 = px1 - imgBBox.x0 * geom.scaleMax;
    var originY1 = py1 - imgBBox.y0 * geom.scaleMax;

    return {
      scale: scale,
      originX: originX0 + t * (originX1 - originX0),
      originY: originY0 + t * (originY1 - originY0)
    };
  }

  function worldToPage(pt, xf) {
    return { x: xf.originX + pt.x * xf.scale, y: xf.originY + pt.y * xf.scale };
  }

  /**
   * Resuelve toda la escena en espacio de pagina (top-down) para la posicion
   * t del mando: foto, segmentos, rayos hasta la fuga, linea de horizonte,
   * marcadores de fuga (si caen dentro) y marcadores de borde (si la fuga
   * queda fuera). Rayos, horizonte y marcadores se recortan contra el
   * rectangulo IMPRIMIBLE (pagina menos el margen de 0.5cm), no contra la
   * pagina entera: igual que la foto, ningun marcador ni linea debe llegar
   * al borde fisico de la hoja.
   */
  function buildExportScene(t, pageW, pageH) {
    var geom = computePageGeom(pageW, pageH);
    var xf = pageTransformAt(t, geom, pageW, pageH);
    var frame = geom.frame;

    var mx0 = EXPORT_MARGIN_PT, my0 = EXPORT_MARGIN_PT;
    var mx1 = pageW - EXPORT_MARGIN_PT, my1 = pageH - EXPORT_MARGIN_PT;

    // La foto se coloca SIEMPRE en su posicion natural (sin girar); el
    // nivelado se aplica como metadato (rotateDeg/pivotPage/clipRectPage)
    // que cada dibujante (SVG o PDF) interpreta a su manera al final.
    var imgTL = worldToPage({ x: 0, y: 0 }, xf);
    var imgBR = worldToPage({ x: state.img.w, y: state.img.h }, xf);
    var photo = { x: imgTL.x, y: imgTL.y, w: imgBR.x - imgTL.x, h: imgBR.y - imgTL.y };

    if (frame.leveled) {
      photo.rotateDeg = frame.leveled.thetaDeg;
      photo.pivotPage = worldToPage(frame.leveled.pivot, xf);
      if (exportState.autoCrop) {
        var cTL = worldToPage({ x: frame.imgBBox.x0, y: frame.imgBBox.y0 }, xf);
        var cBR = worldToPage({ x: frame.imgBBox.x1, y: frame.imgBBox.y1 }, xf);
        photo.clipRectPage = { x: cTL.x, y: cTL.y, w: cBR.x - cTL.x, h: cBR.y - cTL.y };
      }
    }

    var segments = state.lines.map(function (line) {
      return { pair: line.pair, a: worldToPage(frame.mapPoint(line.a), xf), b: worldToPage(frame.mapPoint(line.b), xf) };
    });

    var rays = [];
    state.lines.forEach(function (line) {
      var a = worldToPage(frame.mapPoint(line.a), xf), b = worldToPage(frame.mapPoint(line.b), xf);
      var seg = clipInfiniteLine(a, b, mx0, my0, mx1, my1);
      if (seg) rays.push({ pair: line.pair, a: seg.a, b: seg.b });
    });

    var vpMarkers = [];
    var edgeMarkers = [];
    var vpPagePoints = {};

    function markPairEdges(pair) {
      pairLines(pair).forEach(function (line) {
        var a = worldToPage(frame.mapPoint(line.a), xf), b = worldToPage(frame.mapPoint(line.b), xf);
        [mx0, mx1].forEach(function (edgeX) {
          var pt = edgeCrossingV(a, b, edgeX, my0, my1);
          if (pt) edgeMarkers.push({ pair: pair, point: pt });
        });
        [my0, my1].forEach(function (edgeY) {
          var pt = edgeCrossingH(a, b, edgeY, mx0, mx1);
          if (pt) edgeMarkers.push({ pair: pair, point: pt });
        });
      });
    }

    ['A', 'B'].forEach(function (pair) {
      var vp = geom.vps[pair];
      var p = null;
      if (vp.status === 'ok' && Math.abs(vp.point.x) <= COORD_LIMIT && Math.abs(vp.point.y) <= COORD_LIMIT) {
        p = worldToPage(frame.mapPoint(vp.point), xf);
        vpPagePoints[pair] = p;
      }
      if (p && withinRect(p, mx0, my0, mx1, my1)) {
        vpMarkers.push({ pair: pair, point: p });
        return;
      }
      if (vp.status === 'incomplete') return;
      markPairEdges(pair);
    });

    var horizon = null;
    if (vpPagePoints.A && vpPagePoints.B) {
      var hseg = clipInfiniteLine(vpPagePoints.A, vpPagePoints.B, mx0, my0, mx1, my1);
      if (hseg) horizon = hseg;
      var aIn = withinRect(vpPagePoints.A, mx0, my0, mx1, my1);
      var bIn = withinRect(vpPagePoints.B, mx0, my0, mx1, my1);
      if (!aIn || !bIn) {
        [mx0, mx1].forEach(function (edgeX) {
          var pt = edgeCrossingV(vpPagePoints.A, vpPagePoints.B, edgeX, my0, my1);
          if (pt) edgeMarkers.push({ pair: 'horizon', point: pt });
        });
        [my0, my1].forEach(function (edgeY) {
          var pt = edgeCrossingH(vpPagePoints.A, vpPagePoints.B, edgeY, mx0, mx1);
          if (pt) edgeMarkers.push({ pair: 'horizon', point: pt });
        });
      }
    }

    return {
      geom: geom, photo: photo, segments: segments, rays: rays,
      horizon: horizon, vpMarkers: vpMarkers, edgeMarkers: edgeMarkers,
      pageW: pageW, pageH: pageH
    };
  }

  /* ------------------------------------------------- Vista previa (SVG) */

  // Los tres se mantienen sincronizados con state.colors (ver los
  // listeners de colorA/colorB/colorH mas abajo).
  var EXPORT_COLORS = { A: state.colors.A, B: state.colors.B, horizon: state.colors.horizon };

  function svgEl(name, attrs) {
    var node = document.createElementNS('http://www.w3.org/2000/svg', name);
    for (var k in attrs) {
      if (Object.prototype.hasOwnProperty.call(attrs, k)) node.setAttribute(k, attrs[k]);
    }
    return node;
  }

  function renderExportPreview() {
    if (!state.img.loaded) return;
    var dims = currentPageDims();
    var scene = buildExportScene(exportState.t, dims.w, dims.h);

    exportPreview.style.aspectRatio = dims.w + ' / ' + dims.h;
    exportPreview.setAttribute('viewBox', '0 0 ' + dims.w + ' ' + dims.h);
    exportPreview.textContent = '';

    var m = EXPORT_MARGIN_PT;
    exportPreview.appendChild(svgEl('rect', {
      x: m, y: m, width: dims.w - 2 * m, height: dims.h - 2 * m,
      fill: 'none', stroke: '#c7c7c7', 'stroke-width': 1, 'stroke-dasharray': '4 3'
    }));

    var photoImg = svgEl('image', {
      x: scene.photo.x, y: scene.photo.y, width: scene.photo.w, height: scene.photo.h,
      href: state.img.url, preserveAspectRatio: 'none'
    });
    if (scene.photo.rotateDeg) {
      photoImg.setAttribute('transform', 'rotate(' + scene.photo.rotateDeg + ' ' +
        scene.photo.pivotPage.x + ' ' + scene.photo.pivotPage.y + ')');
    }
    if (scene.photo.clipRectPage) {
      // El recorte se aplica ANTES de rotar (en espacio de pagina sin
      // girar): un <g> exterior con el clip envuelve la <image> rotada.
      var clipRect = scene.photo.clipRectPage;
      var defs = svgEl('defs', {});
      var clipPath = svgEl('clipPath', { id: 'exportCropClip' });
      clipPath.appendChild(svgEl('rect', { x: clipRect.x, y: clipRect.y, width: clipRect.w, height: clipRect.h }));
      defs.appendChild(clipPath);
      exportPreview.appendChild(defs);
      var photoGroup = svgEl('g', { 'clip-path': 'url(#exportCropClip)' });
      photoGroup.appendChild(photoImg);
      exportPreview.appendChild(photoGroup);
    } else {
      exportPreview.appendChild(photoImg);
    }

    scene.rays.forEach(function (r) {
      exportPreview.appendChild(svgEl('line', {
        x1: r.a.x, y1: r.a.y, x2: r.b.x, y2: r.b.y,
        stroke: EXPORT_COLORS[r.pair], 'stroke-width': 1.2, 'stroke-dasharray': '6 4', opacity: 0.85
      }));
    });

    if (scene.horizon) {
      exportPreview.appendChild(svgEl('line', {
        x1: scene.horizon.a.x, y1: scene.horizon.a.y, x2: scene.horizon.b.x, y2: scene.horizon.b.y,
        stroke: EXPORT_COLORS.horizon, 'stroke-width': 1.4, 'stroke-dasharray': '9 3 2 3'
      }));
    }

    scene.segments.forEach(function (s) {
      exportPreview.appendChild(svgEl('line', {
        x1: s.a.x, y1: s.a.y, x2: s.b.x, y2: s.b.y,
        stroke: EXPORT_COLORS[s.pair], 'stroke-width': 2.2, 'stroke-linecap': 'round'
      }));
    });

    scene.edgeMarkers.forEach(function (mk) {
      var s = 4.5;
      exportPreview.appendChild(svgEl('rect', {
        x: mk.point.x - s, y: mk.point.y - s, width: s * 2, height: s * 2,
        transform: 'rotate(45 ' + mk.point.x + ' ' + mk.point.y + ')',
        fill: '#fff', stroke: EXPORT_COLORS[mk.pair], 'stroke-width': 1.4
      }));
    });

    scene.vpMarkers.forEach(function (mk) {
      var color = EXPORT_COLORS[mk.pair];
      var p = mk.point, rad = 6, arm = 11;
      exportPreview.appendChild(svgEl('circle', {
        cx: p.x, cy: p.y, r: rad, fill: 'none', stroke: color, 'stroke-width': 1.4
      }));
      exportPreview.appendChild(svgEl('line', {
        x1: p.x - arm, y1: p.y, x2: p.x + arm, y2: p.y, stroke: color, 'stroke-width': 1
      }));
      exportPreview.appendChild(svgEl('line', {
        x1: p.x, y1: p.y - arm, x2: p.x, y2: p.y + arm, stroke: color, 'stroke-width': 1
      }));
      var label = svgEl('text', { x: p.x + arm * 0.7, y: p.y - arm * 0.7, 'font-size': 10, fill: '#222' });
      label.textContent = 'VP-' + mk.pair;
      exportPreview.appendChild(label);
    });

    updateExportHint(scene);
  }

  function updateExportHint(scene) {
    var offPage = [];
    ['A', 'B'].forEach(function (pair) {
      var vp = scene.geom.vps[pair];
      if (vp.status === 'incomplete') return;
      var shown = scene.vpMarkers.some(function (mk) { return mk.pair === pair; });
      if (!shown) offPage.push('Fuga ' + pair);
    });
    if (!offPage.length) { exportHint.textContent = ''; return; }
    var verb = offPage.length > 1 ? 'quedarán' : 'quedará';
    exportHint.textContent = offPage.join(' y ') + ' ' + verb + ' fuera de la página con este tamaño.';
  }

  /* -------------------------------------------------- Mando deslizante */

  function ensureExportSlider() {
    if (exportState.slider) return Promise.resolve(exportState.slider);
    return import('/assets/js/RangeSlider.js').then(function (mod) {
      var slider = new mod.RangeSlider(exportSliderMount, {
        min: 0, max: 100, step: 1, def: 0, title: 'Encuadre', color: '#f6c94b'
      });
      slider.onValueChange(function (val) {
        exportState.t = val / 100;
        renderExportPreview();
      });
      exportState.slider = slider;
      return slider;
    });
  }

  function openExportDialog() {
    if (!state.img.loaded) return;
    var firstOpen = !exportState.slider;
    ensureExportSlider().then(function () {
      if (firstOpen && !exportState.pageSizeRestored) {
        // Sugerencia inicial de orientacion segun la foto (solo si no hay
        // una preferencia guardada); el desplegable sigue siendo libre
        // para cambiarla.
        var landscape = state.img.w >= state.img.h;
        selPageSize.value = 'A4-' + (landscape ? 'landscape' : 'portrait');
      }
      renderExportPreview();
      exportDialog.showModal();
    });
  }

  function closeExportDialog() {
    exportDialog.close();
  }

  /* ------------------------------------------------------- Generar PDF */

  function hexToRgb01(hex) {
    var n = parseInt(hex.slice(1), 16);
    return PDFLib.rgb(((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255);
  }

  /**
   * pdf-lib rota page.drawImage alrededor de su propia esquina (x,y), no
   * de su centro. Dado el tamano w x h y un angulo de rotacion (grados,
   * convencion pdf-lib: Y arriba), devuelve el (x,y) que hay que pasarle
   * para que el CENTRO de la imagen ya rotada caiga exactamente en target.
   */
  function drawImageAnchorForCenter(target, w, h, rotDeg) {
    var rad = rotDeg * Math.PI / 180;
    var cos = Math.cos(rad), sin = Math.sin(rad);
    var cx = w / 2, cy = h / 2;
    return {
      x: target.x - (cx * cos - cy * sin),
      y: target.y - (cx * sin + cy * cos)
    };
  }

  async function embedExportPhoto(pdfDoc) {
    var file = state.img.file;
    var bytes = await file.arrayBuffer();
    if (file.type === 'image/png') return pdfDoc.embedPng(bytes);
    if (file.type === 'image/jpeg' || file.type === 'image/jpg') return pdfDoc.embedJpg(bytes);
    // Formato no soportado de forma nativa (webp, gif...): transcodificar a JPEG.
    var bitmap = await createImageBitmap(file);
    var canvas = document.createElement('canvas');
    canvas.width = bitmap.width;
    canvas.height = bitmap.height;
    canvas.getContext('2d').drawImage(bitmap, 0, 0);
    var blob = await new Promise(function (resolve) { canvas.toBlob(resolve, 'image/jpeg', 0.92); });
    return pdfDoc.embedJpg(await blob.arrayBuffer());
  }

  async function buildExportPdf() {
    var dims = currentPageDims();
    var pageW = dims.w, pageH = dims.h;
    var scene = buildExportScene(exportState.t, pageW, pageH);

    var pdfDoc = await PDFLib.PDFDocument.create();
    var page = pdfDoc.addPage([pageW, pageH]);
    var font = await pdfDoc.embedFont(PDFLib.StandardFonts.Helvetica);

    var colors = {
      A: hexToRgb01(EXPORT_COLORS.A),
      B: hexToRgb01(EXPORT_COLORS.B),
      horizon: hexToRgb01(EXPORT_COLORS.horizon)
    };

    function flipY(p) { return { x: p.x, y: pageH - p.y }; }

    page.drawRectangle({ x: 0, y: 0, width: pageW, height: pageH, color: PDFLib.rgb(1, 1, 1) });

    var embedded = await embedExportPhoto(pdfDoc);
    if (scene.photo.rotateDeg) {
      // Y-arriba invierte el sentido visual de la rotacion respecto al
      // espacio de pagina (Y-abajo): mismo angulo, signo contrario.
      var pdfRotateDeg = -scene.photo.rotateDeg;
      var pivotPdf = flipY(scene.photo.pivotPage);
      var anchor = drawImageAnchorForCenter(pivotPdf, scene.photo.w, scene.photo.h, pdfRotateDeg);
      var hasClip = !!scene.photo.clipRectPage;

      if (hasClip) {
        var clip = scene.photo.clipRectPage;
        var clipPdfY = pageH - clip.y - clip.h;
        page.pushOperators(
          PDFLib.pushGraphicsState(),
          PDFLib.rectangle(clip.x, clipPdfY, clip.w, clip.h),
          PDFLib.clip(),
          PDFLib.endPath()
        );
      }

      page.drawImage(embedded, {
        x: anchor.x, y: anchor.y, width: scene.photo.w, height: scene.photo.h,
        rotate: PDFLib.degrees(pdfRotateDeg)
      });

      if (hasClip) page.pushOperators(PDFLib.popGraphicsState());
    } else {
      page.drawImage(embedded, {
        x: scene.photo.x,
        y: pageH - scene.photo.y - scene.photo.h,
        width: scene.photo.w,
        height: scene.photo.h
      });
    }

    scene.rays.forEach(function (r) {
      page.drawLine({
        start: flipY(r.a), end: flipY(r.b),
        thickness: 0.9, color: colors[r.pair], dashArray: [5, 3.5], opacity: 0.85
      });
    });

    if (scene.horizon) {
      page.drawLine({
        start: flipY(scene.horizon.a), end: flipY(scene.horizon.b),
        thickness: 1.1, color: colors.horizon, dashArray: [7, 2, 1.5, 2]
      });
    }

    scene.segments.forEach(function (s) {
      page.drawLine({ start: flipY(s.a), end: flipY(s.b), thickness: 2, color: colors[s.pair] });
    });

    scene.edgeMarkers.forEach(function (mk) {
      var s = 3.2, p = flipY(mk.point);
      page.drawRectangle({
        x: p.x, y: p.y - s * Math.SQRT2, width: s * 2, height: s * 2,
        rotate: PDFLib.degrees(45), color: PDFLib.rgb(1, 1, 1),
        borderColor: colors[mk.pair], borderWidth: 1
      });
    });

    scene.vpMarkers.forEach(function (mk) {
      var p = flipY(mk.point), rad = 5, arm = 10, color = colors[mk.pair];
      page.drawEllipse({ x: p.x, y: p.y, xScale: rad, yScale: rad, borderColor: color, borderWidth: 1.1 });
      page.drawLine({ start: { x: p.x - arm, y: p.y }, end: { x: p.x + arm, y: p.y }, thickness: 0.8, color: color });
      page.drawLine({ start: { x: p.x, y: p.y - arm }, end: { x: p.x, y: p.y + arm }, thickness: 0.8, color: color });
      page.drawText('VP-' + mk.pair, { x: p.x + arm * 0.7, y: p.y + arm * 0.5, size: 8, font: font, color: color });
    });

    return pdfDoc.save();
  }

  async function downloadExportPdf() {
    btnExportDownload.disabled = true;
    var prevHint = exportHint.textContent;
    try {
      var bytes = await buildExportPdf();
      var blob = new Blob([bytes], { type: 'application/pdf' });
      var url = URL.createObjectURL(blob);
      var a = document.createElement('a');
      a.href = url;
      a.download = 'hasta-la-vista-line.pdf';
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(function () { URL.revokeObjectURL(url); }, 10000);
    } catch (err) {
      exportHint.textContent = 'No se pudo generar el PDF.';
      setTimeout(function () { exportHint.textContent = prevHint; }, 3000);
    } finally {
      btnExportDownload.disabled = false;
    }
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
  btnClear.addEventListener('click', clearAll);

  selCursorMode.addEventListener('change', function () {
    state.cursorMode = selCursorMode.value;
    if (state.cursorMode !== 'magnify') hideLoupe();
    saveSetting('cursorMode', state.cursorMode);
  });

  /**
   * Aplica un color elegido para un par: actualiza el estado, la variable
   * CSS que pinta todo lo del par en el lienzo (segmentos, rayos, nodos,
   * marcador de fuga...) y el color que usara la exportacion a PDF.
   */
  function applyPairColor(pair, hex) {
    state.colors[pair] = hex;
    document.documentElement.style.setProperty('--pair-' + pair.toLowerCase(), hex);
    EXPORT_COLORS[pair] = hex;
    if (exportDialog.open) renderExportPreview();
  }

  colorA.addEventListener('input', function () {
    applyPairColor('A', colorA.value);
    saveSetting('colorA', colorA.value);
  });
  colorB.addEventListener('input', function () {
    applyPairColor('B', colorB.value);
    saveSetting('colorB', colorB.value);
  });

  /** Igual que applyPairColor pero para la linea de horizonte (--horizon). */
  function applyHorizonColor(hex) {
    state.colors.horizon = hex;
    document.documentElement.style.setProperty('--horizon', hex);
    EXPORT_COLORS.horizon = hex;
    if (exportDialog.open) renderExportPreview();
  }

  colorH.addEventListener('input', function () {
    applyHorizonColor(colorH.value);
    saveSetting('colorH', colorH.value);
  });

  btnLevel.addEventListener('click', function () {
    exportState.leveled = !exportState.leveled;
    scheduleRender();
    if (exportDialog.open) renderExportPreview();
  });
  chkAutoCrop.addEventListener('change', function () {
    exportState.autoCrop = chkAutoCrop.checked;
    if (exportDialog.open) renderExportPreview();
  });

  btnFit.addEventListener('click', fitImage);
  btnFitAll.addEventListener('click', fitAll);

  btnExport.addEventListener('click', openExportDialog);
  btnExportClose.addEventListener('click', closeExportDialog);
  btnExportDownload.addEventListener('click', downloadExportPdf);
  selPageSize.addEventListener('change', function () {
    renderExportPreview();
    saveSetting('pageSize', selPageSize.value);
  });
  exportDialog.addEventListener('click', function (ev) {
    if (ev.target === exportDialog) closeExportDialog();
  });

  btnHelp.addEventListener('click', function () { helpDialog.showModal(); });
  btnHelpClose.addEventListener('click', function () { helpDialog.close(); });
  helpDialog.addEventListener('click', function (ev) {
    if (ev.target === helpDialog) helpDialog.close();
  });

  btnZoomIn.addEventListener('click', function () {
    var r = svg.getBoundingClientRect();
    zoomAt(r.left + r.width / 2, r.top + r.height / 2, 1 / 1.3);
  });
  btnZoomOut.addEventListener('click', function () {
    var r = svg.getBoundingClientRect();
    zoomAt(r.left + r.width / 2, r.top + r.height / 2, 1.3);
  });

  panel.addEventListener('click', function (ev) {
    var btn = ev.target.closest('button[data-act="clear"]');
    if (!btn) return;
    clearPair(btn.dataset.pair);
  });

  document.addEventListener('keydown', function (ev) {
    if (exportDialog.open || helpDialog.open) return; // el dialogo modal gestiona su propio teclado
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

  (function applySettings() {
    var saved = loadSettings();
    if (CURSOR_MODES.indexOf(saved.cursorMode) !== -1) {
      state.cursorMode = saved.cursorMode;
      selCursorMode.value = saved.cursorMode;
    }
    if (PAGE_SIZE_VALUES.indexOf(saved.pageSize) !== -1) {
      selPageSize.value = saved.pageSize;
      exportState.pageSizeRestored = true;
    }
    if (HEX_COLOR_RE.test(saved.colorA)) applyPairColor('A', saved.colorA);
    if (HEX_COLOR_RE.test(saved.colorB)) applyPairColor('B', saved.colorB);
    if (HEX_COLOR_RE.test(saved.colorH)) applyHorizonColor(saved.colorH);
    // Sincroniza los selectores con el color final (guardado o el de
    // partida de --pair-a/--pair-b/--horizon), sea cual sea su origen.
    colorA.value = state.colors.A;
    colorB.value = state.colors.B;
    colorH.value = state.colors.horizon;
  })();

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
