/**
 * PSEUDO LOOMIS
 *
 * A tool for placing a "Loomis sphere" overlay on images.
 * Features a draggable circle with axes, nodes, and arcs that simulate
 * a 3D sphere for drawing reference.
 *
 * Modules:
 * - ImageManager: Handles image loading and canvas setup
 * - CircleState: Manages circle position, size, rotation, and appearance
 * - NodeManager: Handles node positions and arc calculations
 * - Renderer: Draws everything on the canvas
 * - InputHandler: Manages mouse/touch interactions
 * - UIController: Connects sliders and controls to the state
 */

import { RangeSlider } from '../assets/js/RangeSlider.js';
import { Downloader } from '../assets/js/Downloader.js'
import { ImageLoader } from '../assets/js/ImageLoader.js';

// ========================================
// STATE MANAGEMENT
// ========================================

/**
 * Central state object for the application
 */
const AppState = {
  // Image state
  image: null,
  imageWidth: 0,
  imageHeight: 0,

  // Circle state
  circle: {
    x: 0,              // Center X position (relative to image)
    y: 0,              // Center Y position (relative to image)
    radius: 100,       // Circle radius in pixels
    rotation: 0,       // Rotation in degrees (-90 to 90)
    sizePercent: 50,   // Size as percentage of larger dimension
    strokeWidth: 5,    // Stroke width in pixels
    strokeColor: '#87CEEB'  // Stroke color (light blue default)
  },

  nodes: {
    yPosition: 1,  // horizontal arc curvature (-1 to 1)
    ySlide: 0,     // Y node position along horizontal arc (-1=left, 0=center, 1=right)
    xPosition: 1,  // vertical arc curvature (-1 to 1)
    xSlide: 0      // X node position along vertical arc (-1=top, 0=center, 1=bottom)
  },

  // Interaction state
  interaction: {
    isDraggingCircle: false,
    isDraggingYNode: false,
    isDraggingXNode: false,
    hoverTarget: null,  // 'circle', 'yNode', 'xNode', or null
    lastPointerPos: { x: 0, y: 0 }  // For delta-based circle dragging
  },

  // Canvas display state (for coordinate transformations)
  display: {
    scale: 1,
    offsetX: 0,
    offsetY: 0
  }
};

// ========================================
// CROP STATE
// ========================================
const CropState = {
  active: false,
  isDragging: false,
  startX: 0,
  startY: 0,
  endX: 0,
  endY: 0
};

// ========================================
// COLORS
// ========================================
const RANGE_SLIDER_FILL = '#210F37';
const RANGE_SLIDER_EMPTY = '#DCA06D';

// ========================================
// CALIBRATION
// ========================================
const NODE_RADIUS = 90;  // <- CALIBRATE: node (handle) radius in pixels
const MOBILE_BREAKPOINT = 749;  // <- CALIBRATE: max-width for mobile mode (matches CSS)

const DRAG_CONFIG = {
  velocity: 1.0  // <- CALIBRATE: 1.0 = 1:1 movement, 2.0 = 2x faster, 0.5 = half speed
};

function getNodeRadius() {
  const isMobile = window.innerWidth <= MOBILE_BREAKPOINT;
  return isMobile ? window.innerWidth * 0.4 : NODE_RADIUS;
}

// ========================================
// UTILITY FUNCTIONS
// ========================================

/**
 * Converts hex color to RGB object
 */
function hexToRgb(hex) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : { r: 135, g: 206, b: 235 };
}

/**
 * Converts RGB to hex string
 */
function rgbToHex(r, g, b) {
  return '#' + [r, g, b].map(x => {
    const hex = Math.round(x).toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  }).join('');
}

/**
 * Calculates complementary color
 */
function getComplementaryColor(hex) {
  const rgb = hexToRgb(hex);
  return rgbToHex(255 - rgb.r, 255 - rgb.g, 255 - rgb.b);
}

/**
 * Converts degrees to radians
 */
function degToRad(degrees) {
  return degrees * Math.PI / 180;
}

const BEZIER_K = 0.5522847498; // 4*(sqrt(2)-1)/3 — bezier constant for circle approximation

/**
 * Evaluates a cubic bezier at parameter t
 */
function cubicBezier(t, p0, p1, p2, p3) {
  const mt = 1 - t;
  return mt*mt*mt*p0 + 3*mt*mt*t*p1 + 3*mt*t*t*p2 + t*t*t*p3;
}

/**
 * Returns the canvas-local position of the Y node on the horizontal arc.
 * slide ∈ [-1, 1]: -1 = left endpoint, 0 = center/peak, 1 = right endpoint
 */
function getHorizontalArcPoint(yPos, slide, radius) {
  if (slide <= 0) {
    const u = slide + 1; // maps [-1, 0] → [0, 1] for the left cubic
    return {
      x: cubicBezier(u, -radius, -radius, -radius * BEZIER_K, 0),
      y: cubicBezier(u, 0, -radius * BEZIER_K * yPos, -radius * yPos, -radius * yPos)
    };
  } else {
    return {
      x: cubicBezier(slide, 0, radius * BEZIER_K, radius, radius),
      y: cubicBezier(slide, -radius * yPos, -radius * yPos, -radius * BEZIER_K * yPos, 0)
    };
  }
}

/**
 * Returns the canvas-local position of the X node on the vertical arc.
 * slide ∈ [-1, 1]: -1 = top endpoint, 0 = center/peak, 1 = bottom endpoint
 */
function getVerticalArcPoint(xPos, slide, radius) {
  if (slide <= 0) {
    const u = slide + 1; // maps [-1, 0] → [0, 1] for the top cubic
    return {
      x: cubicBezier(u, 0, radius * BEZIER_K * xPos, radius * xPos, radius * xPos),
      y: cubicBezier(u, -radius, -radius, -radius * BEZIER_K, 0)
    };
  } else {
    return {
      x: cubicBezier(slide, radius * xPos, radius * xPos, radius * BEZIER_K * xPos, 0),
      y: cubicBezier(slide, 0, radius * BEZIER_K, radius, radius)
    };
  }
}

// ========================================
// IMAGE MANAGER
// ========================================

const ImageManager = {
  canvas: null,
  ctx: null,

  /**
   * Initialize canvas references
   */
  init(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
  },

  /**
   * Set an already-loaded Image object as the active image and update state
   */
  setImage(img) {
    AppState.image = img;
    AppState.imageWidth = img.width;
    AppState.imageHeight = img.height;

    this.canvas.width = img.width;
    this.canvas.height = img.height;

    const maxDim = Math.max(img.width, img.height);
    AppState.circle.x = img.width / 2;
    AppState.circle.y = img.height / 2;
    AppState.circle.radius = (maxDim * AppState.circle.sizePercent) / 200;

    AppState.nodes.yPosition = 0;
    AppState.nodes.ySlide = 0;
    AppState.nodes.xPosition = 0;
    AppState.nodes.xSlide = 0;
  },

  /**
   * Update display scale based on canvas CSS size vs actual size
   */
  updateDisplayScale() {
    const rect = this.canvas.getBoundingClientRect();
    AppState.display.scale = this.canvas.width / rect.width;
    AppState.display.offsetX = rect.left;
    AppState.display.offsetY = rect.top;
  }
};

// ========================================
// RENDERER
// ========================================

const Renderer = {
  /**
   * Main render function - draws everything
   */
  render(includeNodes = true) {
    const ctx = ImageManager.ctx;
    const canvas = ImageManager.canvas;

    if (!AppState.image) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(AppState.image, 0, 0);

    if (CropState.active) {
      this.drawCropOverlay(ctx, canvas);
    } else {
      this.drawLoomis(ctx, includeNodes);
    }
  },

  drawCropOverlay(ctx, canvas) {
    ImageManager.updateDisplayScale();
    const s = AppState.display.scale;

    const x = Math.min(CropState.startX, CropState.endX);
    const y = Math.min(CropState.startY, CropState.endY);
    const w = Math.abs(CropState.endX - CropState.startX);
    const h = Math.abs(CropState.endY - CropState.startY);

    // Dim everything outside the crop area
    ctx.fillStyle = 'rgba(0, 0, 0, 0.55)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    if (w > 0 && h > 0) {
      // Redraw original image inside crop area to undo the dimming
      ctx.drawImage(AppState.image, x, y, w, h, x, y, w, h);

      // Dashed border scaled to appear ~2px on screen regardless of image size
      ctx.strokeStyle = 'white';
      ctx.lineWidth = 2 * s;
      ctx.setLineDash([12 * s, 6 * s]);
      ctx.strokeRect(x, y, w, h);
      ctx.setLineDash([]);
    }
  },

  /**
   * Draw the complete Loomis sphere (circle, axes, arcs, nodes)
   */
  drawLoomis(ctx, includeNodes) {
    const { x, y, radius, rotation, strokeWidth, strokeColor } = AppState.circle;
    const { yPosition, ySlide, xPosition, xSlide } = AppState.nodes;
    const yNodePx = getHorizontalArcPoint(yPosition, ySlide, radius);
    const xNodePx = getVerticalArcPoint(xPosition, xSlide, radius);

    const rotRad = degToRad(rotation);

    // Calculate axis line width (50% of stroke width, min 1px)
    const axisWidth = Math.max(1, Math.ceil(strokeWidth * 0.5));

    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rotRad);

    // --- Draw main circle ---
    ctx.beginPath();
    ctx.arc(0, 0, radius, 0, Math.PI * 2);
    ctx.strokeStyle = strokeColor;
    ctx.lineWidth = strokeWidth;
    ctx.stroke();

    // --- Draw axes (thinner lines) ---
    ctx.strokeStyle = strokeColor;
    ctx.lineWidth = axisWidth;

    // Y-axis (vertical line)
    ctx.beginPath();
    ctx.moveTo(0, -radius);
    ctx.lineTo(0, radius);
    ctx.stroke();

    // X-axis (horizontal line)
    ctx.beginPath();
    ctx.moveTo(-radius, 0);
    ctx.lineTo(radius, 0);
    ctx.stroke();

    // --- Draw arcs based on node positions ---
    // Arc width matches main stroke
    ctx.lineWidth = strokeWidth;

    this.drawHorizontalArc(ctx, radius, yPosition, strokeColor);
    this.drawVerticalArc(ctx, radius, xPosition, strokeColor);

    if (includeNodes) {
      const nodeColor = getComplementaryColor(strokeColor);
      const nodeRadius = getNodeRadius();
      this.drawNode(ctx, yNodePx.x, yNodePx.y, nodeRadius, nodeColor);
      this.drawNode(ctx, xNodePx.x, xNodePx.y, nodeRadius, nodeColor);
    }

    ctx.restore();
  },

  /**
   * Draw horizontal arc (latitude line) using two cubic beziers (circle approximation).
   * yPos: 1 = full semicircle up, 0 = flat line, -1 = full semicircle down
   */
  drawHorizontalArc(ctx, radius, yPos, color) {
    ctx.beginPath();
    ctx.strokeStyle = color;
    ctx.moveTo(-radius, 0);
    ctx.bezierCurveTo(-radius, -radius * BEZIER_K * yPos, -radius * BEZIER_K, -radius * yPos, 0, -radius * yPos);
    ctx.bezierCurveTo(radius * BEZIER_K, -radius * yPos, radius, -radius * BEZIER_K * yPos, radius, 0);
    ctx.stroke();
  },

  /**
   * Draw vertical arc (longitude line) using two cubic beziers (circle approximation).
   * xPos: 1 = full semicircle right, 0 = flat line, -1 = full semicircle left
   */
  drawVerticalArc(ctx, radius, xPos, color) {
    ctx.beginPath();
    ctx.strokeStyle = color;
    ctx.moveTo(0, -radius);
    ctx.bezierCurveTo(radius * BEZIER_K * xPos, -radius, radius * xPos, -radius * BEZIER_K, radius * xPos, 0);
    ctx.bezierCurveTo(radius * xPos, radius * BEZIER_K, radius * BEZIER_K * xPos, radius, 0, radius);
    ctx.stroke();
  },

  /**
   * Draw a node (filled circle)
   */
  drawNode(ctx, x, y, radius, color) {
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    // ctx.fillStyle = color;
    // ctx.fill();
    ctx.strokeStyle = color;
    ctx.lineWidth = 5;
    ctx.stroke();
  }
};

// ========================================
// INPUT HANDLER
// ========================================

const InputHandler = {
  canvas: null,

  init(canvas) {
    this.canvas = canvas;
    this.setupEventListeners();
  },

  setupEventListeners() {
    // Mouse events
    this.canvas.addEventListener('mousedown', this.handlePointerDown.bind(this));
    this.canvas.addEventListener('mousemove', this.handlePointerMove.bind(this));
    this.canvas.addEventListener('mouseup', this.handlePointerUp.bind(this));
    this.canvas.addEventListener('mouseleave', this.handlePointerUp.bind(this));

    // Touch events (for circle and node dragging only)
    this.canvas.addEventListener('touchstart', this.handleTouchStart.bind(this), { passive: false });
    this.canvas.addEventListener('touchmove', this.handleTouchMove.bind(this), { passive: false });
    this.canvas.addEventListener('touchend', this.handlePointerUp.bind(this));
    this.canvas.addEventListener('touchcancel', this.handlePointerUp.bind(this));
  },

  /**
   * Convert screen coordinates to image coordinates
   */
  screenToImage(screenX, screenY) {
    ImageManager.updateDisplayScale();
    const rect = this.canvas.getBoundingClientRect();
    return {
      x: (screenX - rect.left) * AppState.display.scale,
      y: (screenY - rect.top) * AppState.display.scale
    };
  },

  /**
   * Convert image coordinates to local circle coordinates (rotated)
   */
  imageToCircleLocal(imgX, imgY) {
    const { x, y, rotation } = AppState.circle;
    const rotRad = degToRad(-rotation); // Negative for inverse rotation

    // Translate to circle center
    const dx = imgX - x;
    const dy = imgY - y;

    // Rotate
    return {
      x: dx * Math.cos(rotRad) - dy * Math.sin(rotRad),
      y: dx * Math.sin(rotRad) + dy * Math.cos(rotRad)
    };
  },

  /**
   * Check what element is at the given image coordinates
   */
  hitTest(imgX, imgY) {
    const { radius, strokeWidth } = AppState.circle;
    const { yPosition, ySlide, xPosition, xSlide } = AppState.nodes;
    const local = this.imageToCircleLocal(imgX, imgY);

    const nodeRadius = getNodeRadius();
    const hitPadding = 10;

    const yNodePx = getHorizontalArcPoint(yPosition, ySlide, radius);
    const xNodePx = getVerticalArcPoint(xPosition, xSlide, radius);

    if (Math.hypot(local.x - yNodePx.x, local.y - yNodePx.y) <= nodeRadius + hitPadding) {
      return 'yNode';
    }

    if (Math.hypot(local.x - xNodePx.x, local.y - xNodePx.y) <= nodeRadius + hitPadding) {
      return 'xNode';
    }

    // Circle (check if near the circumference or inside)
    const distFromCenter = Math.hypot(local.x, local.y);
    if (distFromCenter <= radius + strokeWidth) {
      return 'circle';
    }

    return null;
  },

  /**
   * Handle pointer down (mouse or touch)
   * - Clicking on nodes: drag that specific node
   * - Clicking anywhere else: drag circle using delta movement
   */
  handlePointerDown(e) {
    if (!AppState.image) return;

    const pos = this.screenToImage(e.clientX, e.clientY);

    if (CropState.active) {
      CropController.handlePointerDown(pos);
      return;
    }

    const target = this.hitTest(pos.x, pos.y);

    if (target === 'yNode') {
      AppState.interaction.isDraggingYNode = true;
      this.canvas.classList.add('dragging-node');
    } else if (target === 'xNode') {
      AppState.interaction.isDraggingXNode = true;
      this.canvas.classList.add('dragging-node');
    } else {
      // Drag circle from anywhere (delta-based movement)
      AppState.interaction.isDraggingCircle = true;
      AppState.interaction.lastPointerPos = { x: pos.x, y: pos.y };
      this.canvas.classList.add('dragging-circle');
    }
  },

  /**
   * Handle touch start
   * - Touching nodes: drag that specific node
   * - Touching anywhere else: drag circle using delta movement
   */
  handleTouchStart(e) {
    if (!AppState.image || e.touches.length !== 1) return;
    e.preventDefault();

    const touch = e.touches[0];
    const pos = this.screenToImage(touch.clientX, touch.clientY);

    if (CropState.active) {
      CropController.handlePointerDown(pos);
      return;
    }

    const target = this.hitTest(pos.x, pos.y);

    if (target === 'yNode') {
      AppState.interaction.isDraggingYNode = true;
    } else if (target === 'xNode') {
      AppState.interaction.isDraggingXNode = true;
    } else {
      // Drag circle from anywhere (delta-based movement)
      AppState.interaction.isDraggingCircle = true;
      AppState.interaction.lastPointerPos = { x: pos.x, y: pos.y };
    }
  },

  /**
   * Handle pointer move
   */
  handlePointerMove(e) {
    if (!AppState.image) return;

    const pos = this.screenToImage(e.clientX, e.clientY);

    if (CropState.active) {
      CropController.handlePointerMove(pos);
      return;
    }

    // Handle circle dragging (delta-based movement)
    if (AppState.interaction.isDraggingCircle) {
      const lastPos = AppState.interaction.lastPointerPos;
      const deltaX = (pos.x - lastPos.x) * DRAG_CONFIG.velocity;
      const deltaY = (pos.y - lastPos.y) * DRAG_CONFIG.velocity;

      AppState.circle.x += deltaX;
      AppState.circle.y += deltaY;
      AppState.interaction.lastPointerPos = { x: pos.x, y: pos.y };

      Renderer.render();
      return;
    }

    if (AppState.interaction.isDraggingYNode) {
      this.updateYNodePosition(pos);
      Renderer.render();
      return;
    }

    if (AppState.interaction.isDraggingXNode) {
      this.updateXNodePosition(pos);
      Renderer.render();
      return;
    }

    // Update hover state
    const target = this.hitTest(pos.x, pos.y);
    this.updateCursor(target);
  },

  /**
   * Handle touch move
   */
  handleTouchMove(e) {
    if (!AppState.image || e.touches.length !== 1) return;
    e.preventDefault();

    const touch = e.touches[0];
    const pos = this.screenToImage(touch.clientX, touch.clientY);

    if (CropState.active) {
      CropController.handlePointerMove(pos);
      return;
    }

    // Handle circle dragging (delta-based movement)
    if (AppState.interaction.isDraggingCircle) {
      const lastPos = AppState.interaction.lastPointerPos;
      const deltaX = (pos.x - lastPos.x) * DRAG_CONFIG.velocity;
      const deltaY = (pos.y - lastPos.y) * DRAG_CONFIG.velocity;

      AppState.circle.x += deltaX;
      AppState.circle.y += deltaY;
      AppState.interaction.lastPointerPos = { x: pos.x, y: pos.y };

      Renderer.render();
      return;
    }

    if (AppState.interaction.isDraggingYNode) {
      this.updateYNodePosition(pos);
      Renderer.render();
      return;
    }

    if (AppState.interaction.isDraggingXNode) {
      this.updateXNodePosition(pos);
      Renderer.render();
      return;
    }
  },

  updateYNodePosition(imgPos) {
    const local = this.imageToCircleLocal(imgPos.x, imgPos.y);
    const { radius } = AppState.circle;
    // Vertical drag controls arc curvature (same as original behavior)
    AppState.nodes.yPosition = Math.max(-1, Math.min(1, -local.y / radius));
    // Horizontal drag slides the node along the arc
    AppState.nodes.ySlide = Math.max(-1, Math.min(1, local.x / radius));
  },

  updateXNodePosition(imgPos) {
    const local = this.imageToCircleLocal(imgPos.x, imgPos.y);
    const { radius } = AppState.circle;
    // Horizontal drag controls arc curvature (same as original behavior)
    AppState.nodes.xPosition = Math.max(-1, Math.min(1, local.x / radius));
    // Vertical drag slides the node along the arc
    AppState.nodes.xSlide = Math.max(-1, Math.min(1, local.y / radius));
  },

  /**
   * Handle pointer up
   */
  handlePointerUp() {
    if (CropState.active) {
      CropController.handlePointerUp();
      return;
    }

    AppState.interaction.isDraggingCircle = false;
    AppState.interaction.isDraggingYNode = false;
    AppState.interaction.isDraggingXNode = false;

    this.canvas.classList.remove('dragging-circle', 'dragging-node');
  },

  /**
   * Update cursor based on hover target
   */
  updateCursor(target) {
    this.canvas.classList.remove('hover-circle', 'hover-node');

    if (target === 'circle') {
      this.canvas.classList.add('hover-circle');
    } else if (target === 'yNode' || target === 'xNode') {
      this.canvas.classList.add('hover-node');
    }
  }
};

// ========================================
// UI CONTROLLER
// ========================================

const UIController = {
  sliders: {},

  init() {
    this.setupFileInputs();
    this.setupSliders();
    this.setupColorPickers();
    this.setupDownloadButtons();
    this.setupMobileControls();
    this.setupCropButton();
  },

  /**
   * Setup file input handlers
   */
  setupFileInputs() {
    const onLoad = (data) => {
      if (!data) return;

      ImageManager.setImage(data.image);

      document.getElementById('mainCanvas').classList.add('visible');
      document.getElementById('placeholder').classList.add('hidden');

      // Remove disabled from the container of the desktop download button
      document.getElementById('downloadBtn').parentElement.removeAttribute('disabled');

      // Remove disabled from mobile buttons
      const mobileDownload = document.getElementById('mobileDownloadBtn');
      if (mobileDownload) mobileDownload.removeAttribute('disabled');
      const mobileCut = document.getElementById('mobileCutBtn');
      if (mobileCut) mobileCut.removeAttribute('disabled');

      this.updateCircleSize(AppState.circle.sizePercent);
      Renderer.render();
    };

    ['imageInput', 'mobileImageInput'].forEach(id => {
      const loader = new ImageLoader(document.getElementById(id));
      loader.onLoad = onLoad;
    });
  },

  /**
   * Setup sliders using RangeSlider.js
   */
  setupSliders() {
    // Desktop sliders
    this.createSliders('desktop');

    // Mobile sliders (will be created if containers exist)
    this.createSliders('mobile');
  },

  /**
   * Create sliders for a specific mode (desktop or mobile)
   */
  createSliders(mode) {
    const prefix = mode === 'mobile' ? 'mobile' : '';
    const rotationContainer = document.getElementById(`${prefix}${prefix ? 'R' : 'r'}otationSlider`);
    const sizeContainer = document.getElementById(`${prefix}${prefix ? 'S' : 's'}izeSlider`);
    const strokeContainer = document.getElementById(`${prefix}${prefix ? 'S' : 's'}trokeSlider`);

    // Rotation slider (-90 to 90, step 0.5)
    if (rotationContainer) {
      const rotationSlider = new RangeSlider(rotationContainer, {
        min: -90,
        max: 90,
        step: 0.5,
        def: 0,
        title: 'Deg',
        color: RANGE_SLIDER_FILL,
        color2: RANGE_SLIDER_EMPTY
      });

      rotationSlider.onValueChange((value) => {
        AppState.circle.rotation = value;
        if (AppState.image) Renderer.render();

        // Sync with other slider if exists
        this.syncSliderValue('rotation', value, mode);
      });

      this.sliders[`${mode}Rotation`] = rotationSlider;
    }

    // Size slider (5% to 100%, step 1)
    if (sizeContainer) {
      const sizeSlider = new RangeSlider(sizeContainer, {
        min: 5,
        max: 100,
        step: 1,
        def: 50,
        title: '%',
        color: RANGE_SLIDER_FILL,
        color2: RANGE_SLIDER_EMPTY
      });

      sizeSlider.onValueChange((value) => {
        this.updateCircleSize(value);
        this.syncSliderValue('size', value, mode);
      });

      this.sliders[`${mode}Size`] = sizeSlider;
    }

    // Stroke width slider (1 to 20, step 1)
    if (strokeContainer) {
      const strokeSlider = new RangeSlider(strokeContainer, {
        min: 3,
        max: 30,
        step: 1,
        def: 7,
        title: 'px',
        color: RANGE_SLIDER_FILL,
        color2: RANGE_SLIDER_EMPTY
      });

      strokeSlider.onValueChange((value) => {
        AppState.circle.strokeWidth = value;
        if (AppState.image) Renderer.render();
        this.syncSliderValue('stroke', value, mode);
      });

      this.sliders[`${mode}Stroke`] = strokeSlider;
    }
  },

  /**
   * Update circle size based on percentage of larger image dimension
   */
  updateCircleSize(percent) {
    AppState.circle.sizePercent = percent;

    if (AppState.image) {
      const maxDim = Math.max(AppState.imageWidth, AppState.imageHeight);
      AppState.circle.radius = (maxDim * percent) / 200;
      Renderer.render();
    }
  },

  /**
   * Sync slider values between desktop and mobile
   */
  syncSliderValue(type, value, sourceMode) {
    // This is a placeholder for future sync implementation
    // Currently sliders are independent
  },

  /**
   * Setup color picker handlers
   */
  setupColorPickers() {
    const handleColorChange = (e) => {
      AppState.circle.strokeColor = e.target.value;
      if (AppState.image) Renderer.render();

      // Sync color pickers
      document.getElementById('colorPicker').value = e.target.value;
      const mobilePicker = document.getElementById('mobileColorPicker');
      if (mobilePicker) mobilePicker.value = e.target.value;
    };

    document.getElementById('colorPicker').addEventListener('input', handleColorChange);

    const mobilePicker = document.getElementById('mobileColorPicker');
    if (mobilePicker) {
      mobilePicker.addEventListener('input', handleColorChange);
    }
  },

  /**
   * Setup download button handlers
   */
  setupDownloadButtons() {
    const canvas = ImageManager.canvas;

    ['downloadBtn', 'mobileDownloadBtn'].forEach(id => {
      const btn = document.getElementById(id);
      if (!btn) return;

      new Downloader(btn, canvas, (canvas) => {
        Renderer.render(false);
        const url = canvas.toDataURL('image/png');
        Renderer.render(true);
        return url;
      });
    });
  },

  setupCropButton() {
    const handleCropClick = () => {
      if (!AppState.image) return;
      if (CropState.active) {
        CropController.accept();
      } else {
        CropController.enter();
      }
    };

    document.getElementById('cutImageBtn').addEventListener('click', handleCropClick);

    const mobileCut = document.getElementById('mobileCutBtn');
    if (mobileCut) mobileCut.addEventListener('click', handleCropClick);

    document.getElementById('cropCancelBtn').addEventListener('click', () => {
      CropController.exit();
    });
  },

  /**
   * Setup mobile control interactions
   */
  setupMobileControls() {
    const mobileItems = document.querySelectorAll('.mobile-control-item');

    mobileItems.forEach(item => {
      item.addEventListener('click', (e) => {
        // Don't toggle if clicking inside the slider area (e.g., plus/minus buttons)
        if (e.target.closest('.mobile-control-slider')) {
          return;
        }

        // Close other open items
        mobileItems.forEach(other => {
          if (other !== item) {
            other.classList.remove('active');
          }
        });

        // Toggle this item
        item.classList.toggle('active');
      });
    });

    // Close mobile controls when clicking outside
    document.addEventListener('click', (e) => {
      if (!e.target.closest('.mobile-controls')) {
        mobileItems.forEach(item => item.classList.remove('active'));
      }
    });
  }
};

// ========================================
// CROP CONTROLLER
// ========================================

const CropController = {
  enter() {
    CropState.active = true;
    CropState.isDragging = false;
    CropState.startX = 0;
    CropState.startY = 0;
    CropState.endX = AppState.imageWidth;
    CropState.endY = AppState.imageHeight;

    document.querySelector('label[for="cutImageBtn"]').textContent = 'OK';
    document.getElementById('cropCancelBtn').classList.remove('hidden');
    ImageManager.canvas.classList.add('crop-mode');

    Renderer.render();
  },

  exit() {
    CropState.active = false;
    CropState.isDragging = false;

    document.querySelector('label[for="cutImageBtn"]').textContent = '\u2704';
    document.getElementById('cropCancelBtn').classList.add('hidden');
    ImageManager.canvas.classList.remove('crop-mode');

    Renderer.render();
  },

  accept() {
    const x = Math.round(Math.min(CropState.startX, CropState.endX));
    const y = Math.round(Math.min(CropState.startY, CropState.endY));
    const w = Math.round(Math.abs(CropState.endX - CropState.startX));
    const h = Math.round(Math.abs(CropState.endY - CropState.startY));

    if (w < 1 || h < 1) { this.exit(); return; }

    // Crop from the original image (not the canvas, which has overlays)
    const tmp = document.createElement('canvas');
    tmp.width = w;
    tmp.height = h;
    tmp.getContext('2d').drawImage(AppState.image, x, y, w, h, 0, 0, w, h);

    const img = new Image();
    img.onload = () => {
      ImageManager.setImage(img);
      UIController.updateCircleSize(AppState.circle.sizePercent);
      this.exit();
    };
    img.src = tmp.toDataURL('image/png');
  },

  handlePointerDown(pos) {
    CropState.isDragging = true;
    CropState.startX = Math.max(0, Math.min(AppState.imageWidth, pos.x));
    CropState.startY = Math.max(0, Math.min(AppState.imageHeight, pos.y));
    CropState.endX = CropState.startX;
    CropState.endY = CropState.startY;
    Renderer.render();
  },

  handlePointerMove(pos) {
    if (!CropState.isDragging) return;
    CropState.endX = Math.max(0, Math.min(AppState.imageWidth, pos.x));
    CropState.endY = Math.max(0, Math.min(AppState.imageHeight, pos.y));
    Renderer.render();
  },

  handlePointerUp() {
    CropState.isDragging = false;
  }
};

// ========================================
// INITIALIZATION
// ========================================

document.addEventListener('DOMContentLoaded', () => {
  const canvas = document.getElementById('mainCanvas');

  // Initialize modules
  ImageManager.init(canvas);
  InputHandler.init(canvas);
  UIController.init();

  // Handle window resize
  window.addEventListener('resize', () => {
    ImageManager.updateDisplayScale();
  });
});
