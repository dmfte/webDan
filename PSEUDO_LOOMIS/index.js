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

import RangeSlider from '../assets/js/RangeSlider.js';

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

  // Node positions (0 = center, 1 = edge)
  // Y node: 1 = top, -1 = bottom
  // X node: 1 = right, -1 = left
  nodes: {
    yPosition: 1,      // Y-axis node position (starts at top = 1)
    xPosition: 1       // X-axis node position (starts at right = 1)
  },

  // Interaction state
  interaction: {
    isDraggingCircle: false,
    isDraggingYNode: false,
    isDraggingXNode: false,
    hoverTarget: null  // 'circle', 'yNode', 'xNode', or null
  },

  // Canvas display state (for coordinate transformations)
  display: {
    scale: 1,
    offsetX: 0,
    offsetY: 0
  }
};

// ========================================
// COLORS
// ========================================
const RANGE_SLIDER_FILL = '#210F37';
const RANGE_SLIDER_EMPTY = '#DCA06D';

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
   * Load an image from a File object
   */
  loadImage(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          AppState.image = img;
          AppState.imageWidth = img.width;
          AppState.imageHeight = img.height;

          // Set canvas size to match image
          this.canvas.width = img.width;
          this.canvas.height = img.height;

          // Initialize circle at center with 50% size
          const maxDim = Math.max(img.width, img.height);
          AppState.circle.x = img.width / 2;
          AppState.circle.y = img.height / 2;
          AppState.circle.radius = (maxDim * AppState.circle.sizePercent) / 200;

          // Reset nodes to extreme positions
          AppState.nodes.yPosition = 1;
          AppState.nodes.xPosition = 1;

          resolve(img);
        };
        img.onerror = reject;
        img.src = e.target.result;
      };

      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
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

    // Clear and draw image
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(AppState.image, 0, 0);

    // Draw the Loomis sphere overlay
    this.drawLoomis(ctx, includeNodes);
  },

  /**
   * Draw the complete Loomis sphere (circle, axes, arcs, nodes)
   */
  drawLoomis(ctx, includeNodes) {
    const { x, y, radius, rotation, strokeWidth, strokeColor } = AppState.circle;
    const { yPosition, xPosition } = AppState.nodes;

    const rotRad = degToRad(rotation);

    // Calculate axis line width (10% of stroke width, min 1px)
    const axisWidth = Math.max(1, Math.ceil(strokeWidth * 0.1));

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

    // Horizontal arc (controlled by Y node)
    // yPosition: 1 = top (full semicircle up), 0 = flat line, -1 = full semicircle down
    this.drawHorizontalArc(ctx, radius, yPosition, strokeColor);

    // Vertical arc (controlled by X node)
    // xPosition: 1 = right (full semicircle right), 0 = flat line, -1 = full semicircle left
    this.drawVerticalArc(ctx, radius, xPosition, strokeColor);

    // --- Draw nodes (only in edit mode, not for download) ---
    if (includeNodes) {
      const nodeColor = getComplementaryColor(strokeColor);
      const nodeRadius = Math.max(8, strokeWidth * 1.5);

      // Y-axis node (moves along Y axis)
      const yNodeY = -yPosition * radius;
      this.drawNode(ctx, 0, yNodeY, nodeRadius, nodeColor);

      // X-axis node (moves along X axis)
      const xNodeX = xPosition * radius;
      this.drawNode(ctx, xNodeX, 0, nodeRadius, nodeColor);
    }

    ctx.restore();
  },

  /**
   * Draw horizontal arc (latitude line)
   * Creates a semicircle from left to right, scaled vertically by yPos.
   * - yPos = 1: full semicircle curving upward (top half of circle)
   * - yPos = 0: straight horizontal line
   * - yPos = -1: full semicircle curving downward (bottom half of circle)
   */
  drawHorizontalArc(ctx, radius, yPos, color) {
    // Bezier constant for circle approximation: k = 4 * (sqrt(2) - 1) / 3
    const k = 0.5522847498;

    ctx.beginPath();
    ctx.strokeStyle = color;

    // Arc goes from left edge (-radius, 0) to right edge (radius, 0)
    // The vertical scale factor determines how much it curves
    const scaleY = yPos; // 1 = full up, 0 = flat, -1 = full down

    // For a semicircle approximation, we use two cubic bezier curves
    // From (-r, 0) to (0, -r*scale) to (r, 0)

    // Start point
    ctx.moveTo(-radius, 0);

    // First bezier: left half of the arc
    // Control points scaled in Y direction
    ctx.bezierCurveTo(
      -radius, -radius * k * scaleY,  // First control point
      -radius * k, -radius * scaleY,  // Second control point
      0, -radius * scaleY              // End at top/bottom center
    );

    // Second bezier: right half of the arc
    ctx.bezierCurveTo(
      radius * k, -radius * scaleY,   // First control point
      radius, -radius * k * scaleY,   // Second control point
      radius, 0                        // End at right edge
    );

    ctx.stroke();
  },

  /**
   * Draw vertical arc (longitude line)
   * Creates a semicircle from top to bottom, scaled horizontally by xPos.
   * - xPos = 1: full semicircle curving rightward (right half of circle)
   * - xPos = 0: straight vertical line
   * - xPos = -1: full semicircle curving leftward (left half of circle)
   */
  drawVerticalArc(ctx, radius, xPos, color) {
    // Bezier constant for circle approximation
    const k = 0.5522847498;

    ctx.beginPath();
    ctx.strokeStyle = color;

    // Arc goes from top edge (0, -radius) to bottom edge (0, radius)
    // The horizontal scale factor determines how much it curves
    const scaleX = xPos; // 1 = full right, 0 = flat, -1 = full left

    // Start point
    ctx.moveTo(0, -radius);

    // First bezier: top half of the arc
    ctx.bezierCurveTo(
      radius * k * scaleX, -radius,   // First control point
      radius * scaleX, -radius * k,   // Second control point
      radius * scaleX, 0               // End at middle right/left
    );

    // Second bezier: bottom half of the arc
    ctx.bezierCurveTo(
      radius * scaleX, radius * k,    // First control point
      radius * k * scaleX, radius,    // Second control point
      0, radius                        // End at bottom edge
    );

    ctx.stroke();
  },

  /**
   * Draw a node (filled circle)
   */
  drawNode(ctx, x, y, radius, color) {
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.fill();
    ctx.strokeStyle = 'rgba(0,0,0,0.3)';
    ctx.lineWidth = 2;
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
    const { yPosition, xPosition } = AppState.nodes;
    const local = this.imageToCircleLocal(imgX, imgY);

    const nodeRadius = Math.max(8, strokeWidth * 1.5);
    const hitPadding = 10;

    // Y-axis node position
    const yNodeY = -yPosition * radius;
    const yNodeDist = Math.hypot(local.x - 0, local.y - yNodeY);
    if (yNodeDist <= nodeRadius + hitPadding) {
      return 'yNode';
    }

    // X-axis node position
    const xNodeX = xPosition * radius;
    const xNodeDist = Math.hypot(local.x - xNodeX, local.y - 0);
    if (xNodeDist <= nodeRadius + hitPadding) {
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
   */
  handlePointerDown(e) {
    if (!AppState.image) return;

    const pos = this.screenToImage(e.clientX, e.clientY);
    const target = this.hitTest(pos.x, pos.y);

    if (target === 'yNode') {
      AppState.interaction.isDraggingYNode = true;
      this.canvas.classList.add('dragging-node');
    } else if (target === 'xNode') {
      AppState.interaction.isDraggingXNode = true;
      this.canvas.classList.add('dragging-node');
    } else if (target === 'circle') {
      AppState.interaction.isDraggingCircle = true;
      this.canvas.classList.add('dragging-circle');
    }
  },

  /**
   * Handle touch start
   */
  handleTouchStart(e) {
    if (!AppState.image || e.touches.length !== 1) return;
    e.preventDefault();

    const touch = e.touches[0];
    const pos = this.screenToImage(touch.clientX, touch.clientY);
    const target = this.hitTest(pos.x, pos.y);

    if (target === 'yNode') {
      AppState.interaction.isDraggingYNode = true;
    } else if (target === 'xNode') {
      AppState.interaction.isDraggingXNode = true;
    } else if (target === 'circle') {
      AppState.interaction.isDraggingCircle = true;
    }
  },

  /**
   * Handle pointer move
   */
  handlePointerMove(e) {
    if (!AppState.image) return;

    const pos = this.screenToImage(e.clientX, e.clientY);

    // Handle dragging
    if (AppState.interaction.isDraggingCircle) {
      AppState.circle.x = pos.x;
      AppState.circle.y = pos.y;
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

    if (AppState.interaction.isDraggingCircle) {
      AppState.circle.x = pos.x;
      AppState.circle.y = pos.y;
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

  /**
   * Update Y node position based on pointer position
   * Node stays on Y axis within circle bounds
   */
  updateYNodePosition(imgPos) {
    const local = this.imageToCircleLocal(imgPos.x, imgPos.y);
    const { radius } = AppState.circle;

    // Constrain to Y axis (local.x = 0) and within radius
    // Map local.y to position (-1 to 1)
    let newPos = -local.y / radius;
    newPos = Math.max(-1, Math.min(1, newPos));

    AppState.nodes.yPosition = newPos;
  },

  /**
   * Update X node position based on pointer position
   * Node stays on X axis within circle bounds
   */
  updateXNodePosition(imgPos) {
    const local = this.imageToCircleLocal(imgPos.x, imgPos.y);
    const { radius } = AppState.circle;

    // Constrain to X axis (local.y = 0) and within radius
    let newPos = local.x / radius;
    newPos = Math.max(-1, Math.min(1, newPos));

    AppState.nodes.xPosition = newPos;
  },

  /**
   * Handle pointer up
   */
  handlePointerUp() {
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
  },

  /**
   * Setup file input handlers
   */
  setupFileInputs() {
    const handleFileChange = async (e) => {
      const file = e.target.files[0];
      if (!file) return;

      try {
        await ImageManager.loadImage(file);

        // Show canvas, hide placeholder
        const canvas = document.getElementById('mainCanvas');
        const placeholder = document.getElementById('placeholder');
        canvas.classList.add('visible');
        placeholder.classList.add('hidden');

        // Enable download buttons
        document.getElementById('downloadBtn').disabled = false;
        const mobileDownload = document.getElementById('mobileDownloadBtn');
        if (mobileDownload) mobileDownload.disabled = false;

        // Update circle size based on slider
        this.updateCircleSize(AppState.circle.sizePercent);

        // Initial render
        Renderer.render();
      } catch (err) {
        console.error('Error loading image:', err);
      }
    };

    document.getElementById('imageInput').addEventListener('change', handleFileChange);
    document.getElementById('mobileImageInput').addEventListener('change', handleFileChange);
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
        min: 1,
        max: 20,
        step: 1,
        def: 5,
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
    const handleDownload = () => {
      if (!AppState.image) return;

      // Render without nodes
      Renderer.render(false);

      // Create download link
      const link = document.createElement('a');
      link.download = 'pseudo-loomis-output.png';
      link.href = ImageManager.canvas.toDataURL('image/png');
      link.click();

      // Re-render with nodes
      Renderer.render(true);
    };

    document.getElementById('downloadBtn').addEventListener('click', handleDownload);

    const mobileDownload = document.getElementById('mobileDownloadBtn');
    if (mobileDownload) {
      mobileDownload.addEventListener('click', handleDownload);
    }
  },

  /**
   * Setup mobile control interactions
   */
  setupMobileControls() {
    const mobileItems = document.querySelectorAll('.mobile-control-item');

    mobileItems.forEach(item => {
      item.addEventListener('click', (e) => {
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
