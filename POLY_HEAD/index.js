import * as THREE from 'https://unpkg.com/three@0.160.0/build/three.module.js';
import { OrbitControls } from 'https://unpkg.com/three@0.160.0/examples/jsm/controls/OrbitControls.js';
import RangeSlider from '../assets/js/RangeSlider.js'; // ← your file; API used per its top comments
import {
    clamp,
    degToRad,
    saveState,
    loadState
} from './utils.js';

const CANVAS = document.getElementById('scene');
const PANEL = document.getElementById('control-panel');
const BTN_COLLAPSE = document.getElementById('btn-collapse');
const BG_PICKER = document.getElementById('bg-color');
const SEL_LOD = document.getElementById('lod');
const SEL_GENDER = document.getElementById('gender');
const TGL_GIZMO = document.getElementById('tgl-gizmo');
const TGL_ORBIT = document.getElementById('tgl-orbit');
const TGL_SMOOTH = document.getElementById('tgl-smooth');
const DLG = document.getElementById('dlg-disclaimer');
const BTN_DLG = document.getElementById('btn-disclaimer');
const BTN_CLOSE_DLG = document.getElementById('btn-close-dlg');

const STATE_KEY = 'poly-head:state:v1';

const defaultState = {
    bg: '#202225',
    lod: 'low',
    gender: 'female',
    rot: {
        x: 0,
        y: 0,
        z: 0
    }, // degrees 0..360
    lightPos: {
        x: 0.6,
        y: 0.6,
        z: 0.6
    }, // translation in scene units
    intensity: 1.0,
    gizmo: false,
    orbit: false,
    smooth: true,
    panelCollapsed: false
};
const state = loadState(STATE_KEY, defaultState);

// --- THREE setup
const renderer = new THREE.WebGLRenderer({
    canvas: CANVAS,
    antialias: true
});
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.setSize(CANVAS.clientWidth, CANVAS.clientHeight, false);
renderer.setClearColor(new THREE.Color(state.bg), 1);

const scene = new THREE.Scene();

// Camera – fixed (no orbit by default)
const camera = new THREE.PerspectiveCamera(40, 1, 0.01, 50);
camera.position.set(0, 0.15, 2.2);
scene.add(camera);

// Light (point light that translates within a box)
const light = new THREE.PointLight(0xffffff, state.intensity, 100);
scene.add(light);

// Small ambient for visibility (very low)
const amb = new THREE.AmbientLight(0xffffff, 0.12);
scene.add(amb);

// Light gizmo (arrow from origin to light)
let gizmo = makeLightGizmo();
gizmo.visible = state.gizmo;
scene.add(gizmo);

function makeLightGizmo() {
    const dir = new THREE.Vector3().subVectors(light.position, new THREE.Vector3(0, 0, 0)).normalize();
    const len = 0.8;
    const arrow = new THREE.ArrowHelper(dir, new THREE.Vector3(0, 0, 0), len, 0x64b5ff);
    return arrow;
}

function updateGizmo() {
    scene.remove(gizmo);
    gizmo = makeLightGizmo();
    gizmo.visible = TGL_GIZMO.checked;
    scene.add(gizmo);
}

// OrbitControls (only if user enables)
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.enabled = !!state.orbit;

// Head material (flat/smooth toggle)
const material = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    metalness: 0.0,
    roughness: 0.35,
    flatShading: !state.smooth
});

let headMesh = buildHead(state.gender, state.lod, material);
scene.add(headMesh);

// Resize
function resize() {
    const w = CANVAS.clientWidth;
    const h = CANVAS.clientHeight;
    if (CANVAS.width !== w || CANVAS.height !== h) {
        renderer.setSize(w, h, false);
    }
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
}
window.addEventListener('resize', resize);
resize();

// Animation loop
renderer.setAnimationLoop(() => {
    controls.enabled && controls.update();
    renderer.render(scene, camera);
});

// ------------------- UI: RangeSlider wiring -------------------
const sliders = {
    rotX: new RangeSlider(document.getElementById('rot-x'), {
        min: 0,
        max: 360,
        step: 1,
        def: state.rot.x,
        title: 'Rotate X (deg)',
        color: '#3d98c2'
    }),
    rotY: new RangeSlider(document.getElementById('rot-y'), {
        min: 0,
        max: 360,
        step: 1,
        def: state.rot.y,
        title: 'Rotate Y (deg)',
        color: '#3d98c2'
    }),
    rotZ: new RangeSlider(document.getElementById('rot-z'), {
        min: 0,
        max: 360,
        step: 1,
        def: state.rot.z,
        title: 'Rotate Z (deg)',
        color: '#3d98c2'
    }),
    lX: new RangeSlider(document.getElementById('lx'), {
        min: -1.2,
        max: 1.2,
        step: 0.01,
        def: state.lightPos.x,
        title: 'Light X',
        color: '#7ad3ff'
    }),
    lY: new RangeSlider(document.getElementById('ly'), {
        min: -1.2,
        max: 1.2,
        step: 0.01,
        def: state.lightPos.y,
        title: 'Light Y',
        color: '#7ad3ff'
    }),
    lZ: new RangeSlider(document.getElementById('lz'), {
        min: -1.2,
        max: 1.2,
        step: 0.01,
        def: state.lightPos.z,
        title: 'Light Z',
        color: '#7ad3ff'
    }),
    lInt: new RangeSlider(document.getElementById('l-int'), {
        min: 0,
        max: 2,
        step: 0.01,
        def: state.intensity,
        title: 'Intensity',
        color: '#7ad3ff'
    })
};

// Apply initial values to scene
applyRotation(state.rot);
applyLight();
material.flatShading = !state.smooth;
material.needsUpdate = true;
PANEL.classList.toggle('collapsed', !!state.panelCollapsed);

// Slider listeners
sliders.rotX.onValueChange((v) => {
    state.rot.x = v;
    applyRotation(state.rot);
    save();
});
sliders.rotY.onValueChange((v) => {
    state.rot.y = v;
    applyRotation(state.rot);
    save();
});
sliders.rotZ.onValueChange((v) => {
    state.rot.z = v;
    applyRotation(state.rot);
    save();
});

sliders.lX.onValueChange((v) => {
    state.lightPos.x = v;
    applyLight();
    save();
});
sliders.lY.onValueChange((v) => {
    state.lightPos.y = v;
    applyLight();
    save();
});
sliders.lZ.onValueChange((v) => {
    state.lightPos.z = v;
    applyLight();
    save();
});
sliders.lInt.onValueChange((v) => {
    state.intensity = v;
    applyLight();
    save();
});

// Other controls
BG_PICKER.value = state.bg;
BG_PICKER.addEventListener('input', () => {
    state.bg = BG_PICKER.value;
    renderer.setClearColor(new THREE.Color(state.bg), 1);
    save();
});

SEL_LOD.value = state.lod;
SEL_LOD.addEventListener('change', () => {
    state.lod = SEL_LOD.value;
    rebuildHead();
    save();
});

SEL_GENDER.value = state.gender;
SEL_GENDER.addEventListener('change', () => {
    state.gender = SEL_GENDER.value;
    rebuildHead();
    save();
});

TGL_GIZMO.checked = state.gizmo;
TGL_GIZMO.addEventListener('change', () => {
    state.gizmo = TGL_GIZMO.checked;
    updateGizmo();
    save();
});

TGL_ORBIT.checked = state.orbit;
TGL_ORBIT.addEventListener('change', () => {
    state.orbit = TGL_ORBIT.checked;
    controls.enabled = state.orbit;
    save();
});

TGL_SMOOTH.checked = state.smooth;
TGL_SMOOTH.addEventListener('change', () => {
    state.smooth = TGL_SMOOTH.checked;
    material.flatShading = !state.smooth;
    material.needsUpdate = true;
    save();
});

BTN_COLLAPSE.addEventListener('click', () => {
    PANEL.classList.toggle('collapsed');
    state.panelCollapsed = PANEL.classList.contains('collapsed');
    save();
});

// Disclaimer dialog
BTN_DLG.addEventListener('click', () => DLG.showModal());
BTN_CLOSE_DLG.addEventListener('click', () => DLG.close());

// ------------------- Helpers -------------------
function applyRotation(r) {
    if (!headMesh) return;
    headMesh.rotation.set(degToRad(r.x), degToRad(r.y), degToRad(r.z));
}

function applyLight() {
    light.position.set(state.lightPos.x, state.lightPos.y, state.lightPos.z);
    light.intensity = state.intensity;
    updateGizmo();
}

function save() {
    saveState(STATE_KEY, state);
}

// (Re)build head when LOD/gender changes
function rebuildHead() {
    if (headMesh) {
        scene.remove(headMesh);
        headMesh.geometry.dispose();
    }
    headMesh = buildHead(state.gender, state.lod, material);
    scene.add(headMesh);
    applyRotation(state.rot);
}

// ------------------- Head geometry -------------------
/**
 * Procedural low-poly head using LatheGeometry.
 * LOD affects radial segments; gender tweaks the silhouette.
 */
function buildHead(gender, lod, material) {
    const lodMap = {
        low: 24,
        med: 36,
        high: 48,
        ultra: 64
    };
    const seg = lodMap[lod] || 24;

    // Profile points (Y up). Units around ~0.1–0.95 radius. Tuned for low-poly look.
    const P = [];
    // Gender morphs
    const g = (gender === 'male') ? {
        jaw: 1.05,
        chin: 1.02,
        crown: 1.03,
        cheek: 0.98,
        brow: 1.04
    } : {
        jaw: 0.96,
        chin: 0.96,
        crown: 1.01,
        cheek: 1.04,
        brow: 1.00
    };

    // y from neck (-0.9) to crown (+0.95)
    const profile = [{
            y: -0.90,
            r: 0.20 * g.jaw
        }, // base neck
        {
            y: -0.75,
            r: 0.35 * g.jaw
        }, // lower jaw
        {
            y: -0.62,
            r: 0.44 * g.jaw
        }, // jawline
        {
            y: -0.50,
            r: 0.48 * g.cheek
        }, // lower cheek
        {
            y: -0.30,
            r: 0.53 * g.cheek
        }, // cheek
        {
            y: -0.10,
            r: 0.50 * g.cheek
        }, // upper cheek
        {
            y: 0.05,
            r: 0.45 * g.brow
        }, // temples
        {
            y: 0.20,
            r: 0.40 * g.brow
        }, // brow
        {
            y: 0.35,
            r: 0.36 * g.crown
        }, // forehead
        {
            y: 0.55,
            r: 0.31 * g.crown
        }, // upper forehead
        {
            y: 0.75,
            r: 0.24 * g.crown
        }, // top
        {
            y: 0.90,
            r: 0.10 * g.crown
        }, // crown
    ];
    profile.forEach(p => P.push(new THREE.Vector2(p.r, p.y)));

    const geo = new THREE.LatheGeometry(P, seg, 0, Math.PI * 2);
    // Slight non-uniform scale to break symmetry and hint facial planes
    const sx = (gender === 'male') ? 1.02 : 0.98;
    const sy = (gender === 'male') ? 0.98 : 1.02;
    const sz = 1.00;
    geo.scale(sx, sy, sz);

    // Sharpen some rings to keep low-poly feel
    geo.computeVertexNormals();

    const mesh = new THREE.Mesh(geo, material);
    mesh.position.set(0, 0, 0);
    return mesh;
}

// ------------------- OPTIONAL: Use GLB files instead -------------------
/*
  // [SWAP_TO_GLB]
  // If you prefer GLBs (per LOD and gender), you can replace buildHead with a loader.
  // Example (pseudo):
  import { GLTFLoader } from 'https://unpkg.com/three@0.160.0/examples/jsm/loaders/GLTFLoader.js';
  const GLBS = {
    female: { low:'assets/female_low.glb', med:'assets/female_med.glb', high:'assets/female_high.glb', ultra:'assets/female_ultra.glb' },
    male:   { low:'assets/male_low.glb',   med:'assets/male_med.glb',   high:'assets/male_high.glb',   ultra:'assets/male_ultra.glb' }
  };
  // In rebuildHead(), load with new GLTFLoader().load(GLBS[state.gender][state.lod], (gltf)=>{ ... });
  // Make sure to set material to white, and apply flat/smooth toggle to mesh.material.flatShading.
*/