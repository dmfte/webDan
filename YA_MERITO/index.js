(() => {
  /* ── State ─────────────────────────────────────────────────────────── */
  const state = {
    running: false,
    usarDispositivo: false,
    analogico: false,
    lapso: null,   // ms (duration)
    horaFinal: null,     // Date
    ventanaExtra: false,
    autoCerrar: false,
    mostrarSegundos: false,
    startedAt: null,       // Date.now() when Iniciar was pressed
    intervalId: null,
    watcherId: null,
    popupWin: null,
    canal: null,
  };

  /* ── DOM refs ───────────────────────────────────────────────────────── */
  const elContenedor     = document.querySelector('.contenedor-reloj');
  const elHoraDispositivo= document.getElementById('horaDispositivo');
  const elRelojAnalogo   = document.getElementById('relojAnalogo');
  const elLapso    = document.getElementById('lapso');
  const elHoraFinal      = document.getElementById('horaFinal');
  const elVentanaExtra   = document.getElementById('ventanaExtra');
  const elAutoCerrar     = document.getElementById('autoCerrarVentanaExtra');
  const elMostrarSegundos= document.getElementById('mostrarSegundos');
  const elIniciar        = document.getElementById('iniciarReloj');

  /* ── localStorage persistence ──────────────────────────────────────── */
  const STORAGE_KEY = 'ya-merito-config';
  const elsPersistidos = [elHoraDispositivo, elRelojAnalogo, elMostrarSegundos, elVentanaExtra, elAutoCerrar];

  function guardarConfig() {
    const data = {};
    elsPersistidos.forEach(el => { data[el.id] = el.checked; });
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }

  function restaurarConfig() {
    try {
      const data = JSON.parse(localStorage.getItem(STORAGE_KEY));
      if (!data) return;
      elsPersistidos.forEach(el => { if (el.id in data) el.checked = data[el.id]; });
    } catch {}
  }

  document.getElementById('configuracion').addEventListener('change', e => {
    if (e.target.type === 'checkbox') guardarConfig();
  });

  /* ── Time helpers ───────────────────────────────────────────────────── */
  function timeInputToDate(value) {
    /* value = "HH:MM" or "HH:MM:SS" */
    const parts = value.split(':').map(Number);
    const [h, m, s = 0] = parts;
    const d = new Date();
    d.setHours(h, m, s, 0);
    return d;
  }

  function pad(n) { return String(n).padStart(2, '0'); }

  /* ── Read inputs → update state ─────────────────────────────────────── */
  function aplicarConfig() {
    state.analogico     = elRelojAnalogo.checked;
    state.usarDispositivo = elHoraDispositivo.checked;
    state.ventanaExtra    = elVentanaExtra.checked;
    state.autoCerrar      = elAutoCerrar.checked;
    state.mostrarSegundos = elMostrarSegundos.checked;

    if (elLapso.value) {
      const [h, m, s = 0] = elLapso.value.split(':').map(Number);
      state.lapso = (h * 3600 + m * 60 + s) * 1000;
    }

    if (state.usarDispositivo) {
      if (elHoraFinal.value) state.horaFinal = timeInputToDate(elHoraFinal.value);
      if (state.horaFinal && state.horaFinal.getTime() <= Date.now()) {
        state.horaFinal = new Date(state.horaFinal.getTime() + 24 * 3600 * 1000);
      }
    } else {
      state.horaFinal = null;
    }
  }

  /* ── Digital clock ──────────────────────────────────────────────────── */
  function buildDigital() {
    elContenedor.innerHTML =
      '<div class="reloj-digital"><span class="tiempo">' +
      '<span class="digits hh">00</span><span class="colon">:</span>' +
      '<span class="digits mm">00</span><span class="colon">:</span>' +
      '<span class="digits ss">00</span></span></div>';
    const root = elContenedor.querySelector('.reloj-digital');
    const span = root.querySelector('.tiempo');
    const elHH = span.querySelector('.hh');
    const elMM = span.querySelector('.mm');
    const elSS = span.querySelector('.ss');

    const ro = new ResizeObserver(([e]) => {
      const { width: w, height: h } = e.contentRect;
      span.style.fontSize = Math.min(w / 7, h / 2.5) + 'px';
    });
    ro.observe(elContenedor);

    return {
      update(h, m, s) {
        elHH.textContent = pad(h);
        elMM.textContent = pad(m);
        elSS.textContent = pad(s);
      },
      setTicking(on) { root.classList.toggle('ticking', on); },
      destroy() { ro.disconnect(); },
    };
  }

  /* ── Analog clock ───────────────────────────────────────────────────── */
  const svgNS = 'http://www.w3.org/2000/svg';

  function buildAnalog() {
    const svg = document.createElementNS(svgNS, 'svg');
    svg.setAttribute('viewBox', '0 0 200 200');
    svg.setAttribute('width', '100%');
    svg.setAttribute('height', '100%');
    svg.classList.add('reloj-svg');

    function el(tag, attrs) {
      const e = document.createElementNS(svgNS, tag);
      for (const [k, v] of Object.entries(attrs)) e.setAttribute(k, v);
      return e;
    }

    const anillo  = el('circle', { class: 'anillo',  cx: 100, cy: 100, r: 96 });
    const brecha  = el('circle', { class: 'brecha',  cx: 100, cy: 100, r: 88 });
    const cara    = el('circle', { class: 'cara',    cx: 100, cy: 100, r: 85 });
    const sector  = el('path',   { class: 'sector',  d: '' });
    const marcG   = el('g',      { class: 'marcadores' });
    const manHora = el('line',   { class: 'manecilla manecilla-hora',    x1: 100, y1: 100, x2: 100, y2: 42 });
    const manMin  = el('line',   { class: 'manecilla manecilla-minuto',  x1: 100, y1: 100, x2: 100, y2: 30 });
    const manSeg  = el('line',   { class: 'manecilla manecilla-segundo', x1: 100, y1: 100, x2: 100, y2: 22 });
    const pivote  = el('circle', { class: 'pivote',  cx: 100, cy: 100, r: 5 });

    /* 12 hour markers */
    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * 2 * Math.PI - Math.PI / 2;
      const c = el('circle', {
        cx: 100 + 80 * Math.cos(a),
        cy: 100 + 80 * Math.sin(a),
        r: 3,
      });
      marcG.appendChild(c);
    }

    for (const node of [anillo, brecha, cara, sector, marcG, manHora, manMin, manSeg, pivote]) {
      svg.appendChild(node);
    }
    elContenedor.appendChild(svg);

    function sectorPath(cx, cy, r, startRad, endRad) {
      /* Normalize so arc always goes clockwise from start to end */
      let diff = (endRad - startRad + 2 * Math.PI) % (2 * Math.PI);
      if (diff === 0) diff = 2 * Math.PI;  /* full circle */
      const large = diff > Math.PI ? 1 : 0;
      const x1 = cx + r * Math.cos(startRad), y1 = cy + r * Math.sin(startRad);
      const x2 = cx + r * Math.cos(endRad),   y2 = cy + r * Math.sin(endRad);
      if (Math.abs(diff - 2 * Math.PI) < 0.001) {
        /* Full circle — two half-arcs (SVG can't draw a full-circle arc) */
        const xOpp = cx + r * Math.cos(startRad + Math.PI);
        const yOpp = cy + r * Math.sin(startRad + Math.PI);
        return `M ${cx},${cy} L ${x1},${y1} A ${r},${r} 0 1,1 ${xOpp},${yOpp} A ${r},${r} 0 1,1 ${x1},${y1} Z`;
      }
      return `M ${cx},${cy} L ${x1},${y1} A ${r},${r} 0 ${large},1 ${x2},${y2} Z`;
    }

    function wallAngle(date) {
      /* Angle in radians for the minute+hour position of a Date, 0=12 o'clock */
      const h = date.getHours() % 12, m = date.getMinutes(), s = date.getSeconds();
      const totalMin = h * 60 + m + s / 60;
      return (totalMin / 720) * 2 * Math.PI - Math.PI / 2;
    }

    return {
      update(h, m, s) {
        /* h, m, s are the simulated wall-clock time directly */
        const totalSec = h * 3600 + m * 60 + s;
        const degH = (totalSec / 43200) * 360;
        const degM = ((totalSec % 3600) / 3600) * 360;
        const degS = (s / 60) * 360;

        svg.style.setProperty('--deg-hora',    degH + 'deg');
        svg.style.setProperty('--deg-minuto',  degM + 'deg');
        svg.style.setProperty('--deg-segundo', degS + 'deg');
        manSeg.style.display = state.mostrarSegundos ? '' : 'none';

        /* Sector: fixed arc from (horaFinal - lapso) to horaFinal */
        if (state.lapso && state.horaFinal) {
          const startDate = new Date(state.horaFinal.getTime() - state.lapso);
          const startRad  = wallAngle(startDate);
          const endRad    = wallAngle(state.horaFinal);
          sector.setAttribute('d', sectorPath(100, 100, 85, startRad, endRad));
        }
      },
      destroy() {
        svg.remove();
      },
    };
  }

  /* ── Clock renderer ─────────────────────────────────────────────────── */
  let clock = null;

  function renderizarReloj() {
    if (clock) { clock.destroy(); clock = null; }
    elContenedor.innerHTML = '';
    if (state.running) {
      clock = state.analogico ? buildAnalog() : buildDigital();
    }
  }

  /* ── Popup window ───────────────────────────────────────────────────── */
  function abrirPopup() {
    state.canal = new BroadcastChannel('ya-merito');
    state.popupWin = window.open('about:blank', 'reloj-extra',
      'width=600,height=450,menubar=no,toolbar=no,location=no,resizable=yes');

    if (!state.popupWin) return; /* blocked by browser */

    const html = `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<title>Ya Mérito — Reloj</title>
<style>
*{margin:0;padding:0;box-sizing:border-box}
html,body{width:100vw;height:100vh;background:#05070a;display:grid;place-items:center;overflow:hidden}
.contenedor-reloj{width:min(90vw,90vh);height:min(90vw,90vh);display:grid;place-items:center}
/* digital */
.reloj-digital{display:grid;place-items:center;width:100%;height:100%}
.reloj-digital .tiempo{color:#c8d6e8;font-family:'IBM Plex Sans',Arial,sans-serif;font-weight:700;font-size:14vw;white-space:nowrap}
.reloj-digital.ticking .colon{animation:parpadeo 1s step-start infinite}
@keyframes parpadeo{50%{opacity:.2}}
/* analog */
.reloj-svg .anillo{fill:white}
.reloj-svg .brecha{fill:black}
.reloj-svg .cara{fill:#7a9fd4}
.reloj-svg .sector{fill:rgba(180,210,255,0.35)}
.reloj-svg .marcadores circle{fill:white}
.reloj-svg .manecilla{stroke:white;stroke-linecap:round}
.reloj-svg .manecilla-hora{stroke-width:6;transform-origin:100px 100px;transform:rotate(var(--deg-hora,0deg))}
.reloj-svg .manecilla-minuto{stroke-width:4;transform-origin:100px 100px;transform:rotate(var(--deg-minuto,0deg))}
.reloj-svg .manecilla-segundo{stroke-width:2;transform-origin:100px 100px;transform:rotate(var(--deg-segundo,0deg))}
.reloj-svg .pivote{fill:white}
</style>
</head>
<body>
<div class="contenedor-reloj"></div>
<script>
(function(){
  const svgNS='http://www.w3.org/2000/svg';
  const cont=document.querySelector('.contenedor-reloj');
  let mode=null,clock=null;
  const pad=n=>String(n).padStart(2,'0');

  function buildDigital(){
    cont.innerHTML='<div class="reloj-digital"><span class="tiempo"><span class="digits hh">00</span><span class="colon">:</span><span class="digits mm">00</span><span class="colon">:</span><span class="digits ss">00</span></span></div>';
    const root=cont.querySelector('.reloj-digital');
    const elHH=root.querySelector('.hh'),elMM=root.querySelector('.mm'),elSS=root.querySelector('.ss');
    return{
      update(h,m,s){elHH.textContent=pad(h);elMM.textContent=pad(m);elSS.textContent=pad(s);},
      setTicking(on){root.classList.toggle('ticking',on);}
    };
  }
  function el(tag,attrs){const e=document.createElementNS(svgNS,tag);for(const[k,v]of Object.entries(attrs))e.setAttribute(k,v);return e;}
  function buildAnalog(){
    cont.innerHTML='';
    const svg=document.createElementNS(svgNS,'svg');
    svg.setAttribute('viewBox','0 0 200 200');svg.setAttribute('width','100%');svg.setAttribute('height','100%');svg.classList.add('reloj-svg');
    const sec=el('path',{class:'sector',d:''});
    const mG=el('g',{class:'marcadores'});
    for(let i=0;i<12;i++){const a=(i/12)*2*Math.PI-Math.PI/2;mG.appendChild(el('circle',{cx:100+80*Math.cos(a),cy:100+80*Math.sin(a),r:3}));}
    [el('circle',{class:'anillo',cx:100,cy:100,r:96}),el('circle',{class:'brecha',cx:100,cy:100,r:88}),el('circle',{class:'cara',cx:100,cy:100,r:85}),sec,mG,
     el('line',{class:'manecilla manecilla-hora',x1:100,y1:100,x2:100,y2:42}),el('line',{class:'manecilla manecilla-minuto',x1:100,y1:100,x2:100,y2:30}),
     el('line',{class:'manecilla manecilla-segundo',x1:100,y1:100,x2:100,y2:22}),el('circle',{class:'pivote',cx:100,cy:100,r:5})].forEach(n=>svg.appendChild(n));
    cont.appendChild(svg);
    function sp(cx,cy,r,s,e){let d=(e-s+2*Math.PI)%(2*Math.PI);if(d===0)d=2*Math.PI;const lg=d>Math.PI?1:0;const x1=cx+r*Math.cos(s),y1=cy+r*Math.sin(s),x2=cx+r*Math.cos(e),y2=cy+r*Math.sin(e);if(Math.abs(d-2*Math.PI)<0.001){const xo=cx+r*Math.cos(s+Math.PI),yo=cy+r*Math.sin(s+Math.PI);return'M '+cx+','+cy+' L '+x1+','+y1+' A '+r+','+r+' 0 1,1 '+xo+','+yo+' A '+r+','+r+' 0 1,1 '+x1+','+y1+' Z';}return'M '+cx+','+cy+' L '+x1+','+y1+' A '+r+','+r+' 0 '+lg+',1 '+x2+','+y2+' Z';}
    return{update(h,m,s,meta){
      const ts=h*3600+m*60+s;
      svg.style.setProperty('--deg-hora',(ts/43200)*360+'deg');
      svg.style.setProperty('--deg-minuto',((ts%3600)/3600)*360+'deg');
      svg.style.setProperty('--deg-segundo',(s/60)*360+'deg');
      if(meta&&meta.lapso&&meta.horaFinal){
        function wa(d){const t=new Date(d);const hh=t.getHours()%12,mm=t.getMinutes(),ss=t.getSeconds();return((hh*60+mm+ss/60)/720)*2*Math.PI-Math.PI/2;}
        sec.setAttribute('d',sp(100,100,85,wa(meta.lapso),wa(meta.horaFinal)));
      }
    }};
  }

  new BroadcastChannel('ya-merito').onmessage=function(e){
    const{h,m,s,ticking,analogico,lapso,horaFinal}=e.data;
    if(analogico!==undefined&&analogico!==mode){mode=analogico;clock=analogico?buildAnalog():buildDigital();}
    if(clock){if(h!==undefined)clock.update(h,m,s,{lapso,horaFinal});if(clock.setTicking)clock.setTicking(ticking);}
  };
})();
<\/script>
</body>
</html>`;

    state.popupWin.document.open();
    state.popupWin.document.write(html);
    state.popupWin.document.close();
  }

  /* ── Tick ───────────────────────────────────────────────────────────── */
  function tick() {
    if (!state.horaFinal) return;

    const remainingMs = state.horaFinal - Date.now();
    const totalSec    = Math.max(0, Math.ceil(remainingMs / 1000));
    const h = Math.floor(totalSec / 3600);
    const m = Math.floor((totalSec % 3600) / 60);
    const s = totalSec % 60;

    if (clock) clock.update(h, m, s);

    if (state.canal) {
      state.canal.postMessage({
        h, m, s,
        ticking: state.running,
        analogico: state.analogico,
        lapso: state.lapso,
        horaFinal: state.horaFinal?.getTime(),
      });
    }

    if (remainingMs <= 0) terminarReloj();
  }

  /* ── Start / stop ───────────────────────────────────────────────────── */
  function iniciar() {
    if (state.running) return;

    aplicarConfig();
    if (!state.lapso) return;

    if (!state.usarDispositivo) {
      state.horaFinal = new Date(Date.now() + state.lapso);
    }
    if (!state.horaFinal) return;

    state.running = true;
    renderizarReloj();

    if (state.ventanaExtra) abrirPopup();

    tick();
    state.intervalId = setInterval(tick, 1000);
    clock?.setTicking?.(true);
    elIniciar.textContent = 'Iniciado';
  }

  function terminarReloj() {
    clearInterval(state.intervalId);
    clearInterval(state.watcherId);
    state.intervalId = null;
    state.watcherId = null;
    state.running = false;
    clock?.setTicking?.(false);
    elIniciar.textContent = 'Iniciar';

    if (state.canal) {
      state.canal.postMessage({ ticking: false });
      if (state.autoCerrar && state.popupWin && !state.popupWin.closed) {
        state.popupWin.close();
      }
      state.canal.close();
      state.canal = null;
    } else if (state.autoCerrar && state.popupWin && !state.popupWin.closed) {
      state.popupWin.close();
    }
  }

  /* ── Device-time watcher ────────────────────────────────────────────── */
  function lapsoDurationMs() {
    return state.lapso ?? 0;
  }

  function watchHora() {
    if (!state.horaFinal) return;
    const triggerAt = state.horaFinal.getTime() - lapsoDurationMs();
    if (Date.now() >= triggerAt) {
      clearInterval(state.watcherId);
      state.watcherId = null;
      iniciar();
    }
  }

  /* ── horaDispositivo toggle ─────────────────────────────────────────── */
  elHoraDispositivo.addEventListener('change', () => {
    if (!elHoraDispositivo.checked && state.watcherId && !state.running) {
      clearInterval(state.watcherId);
      state.watcherId = null;
      elIniciar.textContent = 'Iniciar';
    }
  });


  /* ── Iniciar ────────────────────────────────────────────────────────── */
  elIniciar.addEventListener('click', () => {
    if (state.running || state.watcherId) return;
    if (elHoraDispositivo.checked) {
      aplicarConfig();
      if (!state.horaFinal) return;
      state.watcherId = setInterval(watchHora, 1000);
      elIniciar.textContent = 'Esperando…';
      watchHora();
    } else {
      iniciar();
    }
  });

  /* ── relojAnalogo live toggle ───────────────────────────────────────── */
  elRelojAnalogo.addEventListener('change', () => {
    state.analogico = elRelojAnalogo.checked;
    if (state.running) { renderizarReloj(); clock?.setTicking?.(true); tick(); }
  });

  /* ── mostrarSegundos live toggle ────────────────────────────────────── */
  elMostrarSegundos.addEventListener('change', () => {
    state.mostrarSegundos = elMostrarSegundos.checked;
    if (state.running) tick();
  });

  restaurarConfig();
  aplicarConfig();
})();
