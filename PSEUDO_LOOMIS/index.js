// Pseudo-Loomis — Vanilla JS single-canvas editor
// Constraints satisfied:
// - Local image load (png/jpg/webp), canvas max 1000px per side
// - One perfect circle overlay: move, resize, rotate (rotation sets reference axis)
// - One dynamic arc along Top or Right axis, adjustable by dragging its handle
// - Touch: drag (move), pinch (resize), two-finger rotate; Desktop: drag, wheel resize, Alt-drag rotate
// - Export to JPG only

const $ = sel => document.querySelector(sel);
const canvas = $('#pl-canvas');
const ctx = canvas.getContext('2d', {
    alpha: true
});
const fileInput = $('#pl-file');
const fitBtn = $('#pl-fit');
const resetBtn = $('#pl-reset');
const exportBtn = $('#pl-export');
const axisBtn = $('#pl-axis');
const helpChip = $('#pl-help');
const range = $('#pl-range');

// State
const state = {
    img: null,
    imgW: 0,
    imgH: 0,
    scaleToFit: 1,
    circle: {
        cx: 0,
        cy: 0,
        r: 120,
        angleOffset: 0, // radians: rotates the reference axes
        // Arc config: centered on top (default) or right axis
        arcAxis: 'top', // 'top' or 'right'
        arcFactors: {
            top: 1,
            right: 1
        }, // normalized handle position along each axis (-1..1)
    }
};

function clamp(v, mi, ma) {
    return Math.max(mi, Math.min(ma, v));
}

function getArcFactor(axis) {
    const store = state.circle.arcFactors || {};
    const val = typeof store[axis] === 'number' ? store[axis] : 1;
    return clamp(val, -1, 1);
}

function setArcFactor(axis, value) {
    if (!state.circle.arcFactors) {
        state.circle.arcFactors = {
            top: 1,
            right: 1
        };
    }
    state.circle.arcFactors[axis] = clamp(value, -1, 1);
}

function setArcAxis(axis) {
    if (axis !== 'top' && axis !== 'right') return;
    state.circle.arcAxis = axis;
    updateAxisButton();
}

function updateAxisButton() {
    if (!axisBtn) return;
    axisBtn.textContent = `Arc axis: ${state.circle.arcAxis[0].toUpperCase()}${state.circle.arcAxis.slice(1)}`;
}

function deg(rad) {
    return rad * 180 / Math.PI;
}

function rad(deg) {
    return deg * Math.PI / 180;
}

// Resize canvas to image within <=1000px box
function sizeCanvasToImage(img) {
    const maxSide = 1000;
    const {
        naturalWidth: w,
        naturalHeight: h
    } = img;
    let scale = 1;
    if (w > maxSide || h > maxSide) {
        scale = Math.min(maxSide / w, maxSide / h);
    }
    const cw = Math.round(w * scale);
    const ch = Math.round(h * scale);
    canvas.width = cw;
    canvas.height = ch;
    state.imgW = cw;
    state.imgH = ch;
    state.scaleToFit = scale;
}

// Draw helpers
function drawImage() {
    ctx.drawImage(state.img, 0, 0, state.imgW, state.imgH);
}

function drawCircle() {
    const {
        cx,
        cy,
        r
    } = state.circle;
    ctx.save();
    ctx.lineWidth = Math.max(1, r * 0.02);
    ctx.strokeStyle = 'rgba(255,255,255,0.9)';
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
}

function drawAxes() {
    const {
        cx,
        cy,
        r,
        angleOffset
    } = state.circle;
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(angleOffset);
    ctx.lineWidth = 1;
    ctx.strokeStyle = 'rgba(117,227,255,0.7)';
    ctx.beginPath();
    // main axes (top/bottom and right/left)
    ctx.moveTo(0, -r);
    ctx.lineTo(0, r);
    ctx.moveTo(-r, 0);
    ctx.lineTo(r, 0);
    ctx.stroke();

    const handles = [{
            axis: 'top',
            dir: {
                x: 0,
                y: -1
            }
        },
        {
            axis: 'right',
            dir: {
                x: 1,
                y: 0
            }
        }
    ];
    handles.forEach(({
        axis,
        dir
    }) => {
        const factor = getArcFactor(axis);
        const hx = dir.x * factor * r;
        const hy = dir.y * factor * r;
        ctx.fillStyle = axis === state.circle.arcAxis ? 'rgba(255,209,102,0.95)' : 'rgba(255,209,102,0.7)';
        ctx.beginPath();
        ctx.arc(hx, hy, Math.max(4, r * 0.05), 0, Math.PI * 2);
        ctx.fill();
    });

    ctx.restore();
}

function drawArc() {
    const {
        cx,
        cy,
        r,
        angleOffset,
        arcAxis
    } = state.circle;
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(angleOffset);
    const axes = [{
            axis: 'top',
            isTop: true
        },
        {
            axis: 'right',
            isTop: false
        }
    ];
    axes.forEach(({
        axis,
        isTop
    }) => {
        const factor = getArcFactor(axis);
        const mag = Math.abs(factor);
        ctx.lineWidth = Math.max(2, r * 0.06);
        ctx.strokeStyle = axis === arcAxis ? 'rgba(117,227,255,0.95)' : 'rgba(117,227,255,0.55)';
        ctx.beginPath();
        if (mag <= 0.001) {
            if (isTop) {
                ctx.moveTo(-r, 0);
                ctx.lineTo(r, 0);
            } else {
                ctx.moveTo(0, -r);
                ctx.lineTo(0, r);
            }
        } else {
            const radiusX = isTop ? r : (r * mag);
            const radiusY = isTop ? (r * mag) : r;
            let start, end;
            if (isTop) {
                if (factor >= 0) {
                    start = Math.PI;
                    end = 2 * Math.PI;
                } else {
                    start = 0;
                    end = Math.PI;
                }
            } else {
                if (factor >= 0) {
                    start = -Math.PI / 2;
                    end = Math.PI / 2;
                } else {
                    start = Math.PI / 2;
                    end = 3 * Math.PI / 2;
                }
            }
            ctx.ellipse(0, 0, radiusX, radiusY, 0, start, end, false);
        }
        ctx.stroke();
    });
    ctx.restore();
}

function render() {
    if (!state.img) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        return;
    }
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawImage();
    drawArc();
    drawCircle();
    drawAxes();
}

// Hit-testing
function ptDist(x1, y1, x2, y2) {
    const dx = x1 - x2,
        dy = y1 - y2;
    return Math.hypot(dx, dy);
}

function hitTestCircle(x, y) {
    return ptDist(x, y, state.circle.cx, state.circle.cy) <= state.circle.r;
}

function hitTestAxisHandle(x, y) {
    const {
        cx,
        cy,
        r,
        angleOffset,
    } = state.circle;
    // Transform point into circle-local rotated space
    const dx = x - cx,
        dy = y - cy;
    const cos = Math.cos(-angleOffset),
        sin = Math.sin(-angleOffset);
    const rx = dx * cos - dy * sin;
    const ry = dx * sin + dy * cos;
    const handles = [{
            axis: 'top',
            dir: {
                x: 0,
                y: -1
            }
        },
        {
            axis: 'right',
            dir: {
                x: 1,
                y: 0
            }
        }
    ];
    const threshold = Math.max(8, r * 0.08);
    for (const {
            axis,
            dir
        } of handles) {
        const factor = getArcFactor(axis);
        const hx = dir.x * factor * r;
        const hy = dir.y * factor * r;
        const d = Math.hypot(rx - hx, ry - hy);
        if (d < threshold) return axis;
    }
    return null;
}

// Pointer + touch interactions
let dragging = false;
let dragMode = null; // 'move' | 'arc' | 'rotate'
let dragAxis = null;
let last = {
    x: 0,
    y: 0
};

canvas.addEventListener('pointerdown', (e) => {
    if (!state.img) return;
    canvas.setPointerCapture(e.pointerId);
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left) * (canvas.width / rect.width);
    const y = (e.clientY - rect.top) * (canvas.height / rect.height);

    const axisHit = hitTestAxisHandle(x, y);
    if (axisHit) {
        dragMode = 'arc';
        dragAxis = axisHit;
        setArcAxis(axisHit);
    } else if (e.altKey) {
        dragMode = 'rotate';
    } else if (hitTestCircle(x, y)) {
        dragMode = 'move';
    } else {
        dragMode = 'move';
    }

    dragging = true;
    last.x = x;
    last.y = y;
});

canvas.addEventListener('pointermove', (e) => {
    if (!dragging) return;
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left) * (canvas.width / rect.width);
    const y = (e.clientY - rect.top) * (canvas.height / rect.height);

    const dx = x - last.x;
    const dy = y - last.y;

    if (dragMode === 'move') {
        state.circle.cx = clamp(state.circle.cx + dx, 0, canvas.width);
        state.circle.cy = clamp(state.circle.cy + dy, 0, canvas.height);
    } else if (dragMode === 'rotate') {
        // rotate based on angle change around circle center
        const c = state.circle;
        const a0 = Math.atan2(last.y - c.cy, last.x - c.cx);
        const a1 = Math.atan2(y - c.cy, x - c.cx);
        c.angleOffset += (a1 - a0);
    } else if (dragMode === 'arc') {
        const c = state.circle;
        const axis = dragAxis || c.arcAxis;
        const pdx = x - c.cx;
        const pdy = y - c.cy;
        const cos = Math.cos(-c.angleOffset);
        const sin = Math.sin(-c.angleOffset);
        const rx = pdx * cos - pdy * sin;
        const ry = pdx * sin + pdy * cos;
        const axisDir = axis === 'top' ? {
            x: 0,
            y: -1
        } : {
            x: 1,
            y: 0
        };
        const proj = rx * axisDir.x + ry * axisDir.y;
        setArcFactor(axis, proj / c.r);
        setArcAxis(axis);
    }

    last.x = x;
    last.y = y;
    render();
    syncSliderFromCircle();
});

window.addEventListener('pointerup', () => {
    dragging = false;
    dragMode = null;
    dragAxis = null;
});

// Wheel to resize (desktop)
canvas.addEventListener('wheel', (e) => {
    if (!state.img) return;
    e.preventDefault();
    const delta = Math.sign(e.deltaY);
    const step = Math.max(1, Math.round(state.circle.r * 0.06));
    state.circle.r = clamp(state.circle.r - delta * step, 10, 1000);
    syncSliderFromCircle();
    render();
}, {
    passive: false
});

// Touch gestures: pinch (resize) + rotate (two-finger)
let touchData = null;

function analyzeTouches(touches) {
    const rect = canvas.getBoundingClientRect();
    const t = [...touches].slice(0, 2).map(tp => ({
        x: (tp.clientX - rect.left) * (canvas.width / rect.width),
        y: (tp.clientY - rect.top) * (canvas.height / rect.height)
    }));
    const mid = {
        x: (t[0].x + t[1].x) / 2,
        y: (t[0].y + t[1].y) / 2
    };
    const dist = Math.hypot(t[1].x - t[0].x, t[1].y - t[0].y);
    const ang = Math.atan2(t[1].y - t[0].y, t[1].x - t[0].x);
    return {
        t,
        mid,
        dist,
        ang
    };
}

canvas.addEventListener('touchstart', (e) => {
    if (!state.img) return;
    if (e.touches.length === 2) {
        touchData = analyzeTouches(e.touches);
        dragMode = 'gesture';
    }
}, {
    passive: true
});

canvas.addEventListener('touchmove', (e) => {
    if (!state.img) return;
    if (e.touches.length === 2 && touchData) {
        e.preventDefault();
        const prev = touchData;
        const now = analyzeTouches(e.touches);
        // Resize by pinch distance
        const scale = now.dist / prev.dist;
        state.circle.r = clamp(state.circle.r * scale, 10, 1000);
        // Rotate by angle delta
        const dAng = now.ang - prev.ang;
        state.circle.angleOffset += dAng;
        // Move by midpoint shift
        state.circle.cx += (now.mid.x - prev.mid.x);
        state.circle.cy += (now.mid.y - prev.mid.y);
        touchData = now;
        syncSliderFromCircle();
        render();
    }
}, {
    passive: false
});

window.addEventListener('touchend', () => {
    touchData = null;
    dragMode = null;
}, {
    passive: true
});

// Axis toggle (Top/Right)
axisBtn.addEventListener('click', () => {
    const next = state.circle.arcAxis === 'top' ? 'right' : 'top';
    setArcAxis(next);
    render();
});
updateAxisButton();

// Fit & Reset
fitBtn.addEventListener('click', () => {
    if (!state.img) return;
    sizeCanvasToImage(state.img);
    centerCircle();
    syncSliderFromCircle();
    render();
});
resetBtn.addEventListener('click', resetCircle);

function centerCircle() {
    state.circle.cx = canvas.width / 2;
    state.circle.cy = canvas.height / 2;
}

function resetCircle() {
    if (!state.img) return;
    centerCircle();
    state.circle.r = Math.round(Math.min(canvas.width, canvas.height) * 0.25);
    state.circle.angleOffset = 0;
    state.circle.arcFactors = {
        top: 1,
        right: 1
    };
    setArcAxis('top');
    syncSliderFromCircle();
    render();
}

// Slider ↔ circle radius (width = 2r)
function syncSliderFromCircle() {
    const widthPx = Math.min(1000, Math.round(state.circle.r * 2));
    range.value = widthPx;
    if (range.dispatchEvent) range.dispatchEvent(new Event('input', {
        bubbles: true
    }));
}
range.addEventListener('input', () => {
    state.circle.r = clamp(parseFloat(range.value) / 2, 10, 1000);
    render();
});

// File loading
fileInput.addEventListener('change', async (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    const img = new Image();
    img.onload = () => {
        state.img = img;
        sizeCanvasToImage(img);
        centerCircle();
        state.circle.r = Math.round(Math.min(canvas.width, canvas.height) * 0.25);
        state.circle.arcFactors = {
            top: 1,
            right: 1
        };
        setArcAxis('top');
        exportBtn.disabled = false;
        helpChip.textContent = 'Drag to move • Wheel/pinch to resize • Alt-drag/2 fingers to rotate • Drag yellow chip to change arc';
        syncSliderFromCircle();
        render();
    };
    img.onerror = () => {
        alert('Could not load that image. Try PNG, JPG, or WEBP.');
    };
    // Downscale large images via browser decode; we still cap canvas at 1000 in sizeCanvasToImage
    img.src = URL.createObjectURL(file);
});

// Export JPG
exportBtn.addEventListener('click', () => {
    if (!state.img) return;
    try {
        const dataURL = canvas.toDataURL('image/jpeg', 0.92);
        const a = document.createElement('a');
        a.href = dataURL;
        a.download = 'pseudo-loomis.jpg';
        document.body.appendChild(a);
        a.click();
        a.remove();
    } catch (err) {
        alert('Export failed: ' + err.message);
    }
});

// Initial inactive canvas
render();
