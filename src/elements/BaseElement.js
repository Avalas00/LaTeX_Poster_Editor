/**
 * BaseElement - Abstract base class for all canvas elements
 */
export class BaseElement {
  static idCounter = 0;

  constructor(options = {}) {
    this.id = `element-${++BaseElement.idCounter}`;
    this.type = 'base';
    this.x = options.x || 0;      // Position in mm
    this.y = options.y || 0;      // Position in mm
    this.width = options.width || 100;   // Width in mm
    this.height = options.height || 50;  // Height in mm
    this.rotation = options.rotation || 0;
    this.locked = options.locked || false;
    this.visible = options.visible !== false;
    this.name = options.name || 'Element';
    
    this.domElement = null;
    this.isSelected = false;
    this.isDragging = false;
    this.isResizing = false;
  }

  /**
   * Create the DOM element representation
   * @param {number} scale - Scale factor (pixels per mm)
   * @returns {HTMLElement}
   */
  render(scale) {
    throw new Error('render() must be implemented by subclass');
  }

  /**
   * Generate LaTeX code for this element
   * @returns {string}
   */
  toLatex() {
    throw new Error('toLatex() must be implemented by subclass');
  }

  /**
   * Update the DOM element position and size
   * @param {number} scale - Scale factor
   */
  updateDom(scale) {
    if (!this.domElement) return;
    
    this.domElement.style.left = `${this.x * scale}px`;
    this.domElement.style.top = `${this.y * scale}px`;
    this.domElement.style.width = `${this.width * scale}px`;
    this.domElement.style.height = `${this.height * scale}px`;
    this.domElement.style.transform = `rotate(${this.rotation}deg)`;
  }

  /**
   * Create resize handles
   * @returns {HTMLElement[]}
   */
  createResizeHandles() {
    const positions = ['nw', 'n', 'ne', 'w', 'e', 'sw', 's', 'se'];
    return positions.map(pos => {
      const handle = document.createElement('div');
      handle.className = `resize-handle ${pos}`;
      handle.dataset.position = pos;
      return handle;
    });
  }

  /**
   * Set selection state
   * @param {boolean} selected
   */
  setSelected(selected) {
    this.isSelected = selected;
    if (this.domElement) {
      this.domElement.classList.toggle('selected', selected);
    }
  }

  /**
   * Clone this element
   * @returns {BaseElement}
   */
  clone() {
    const Constructor = this.constructor;
    return new Constructor({
      x: this.x + 10,
      y: this.y + 10,
      width: this.width,
      height: this.height,
      rotation: this.rotation,
      name: `${this.name} (copy)`
    });
  }

  /**
   * Serialize to JSON
   * @returns {Object}
   */
  toJSON() {
    return {
      id: this.id,
      type: this.type,
      x: this.x,
      y: this.y,
      width: this.width,
      height: this.height,
      rotation: this.rotation,
      locked: this.locked,
      visible: this.visible,
      name: this.name
    };
  }

  /**
   * Get layer icon SVG based on element type
   * @returns {string}
   */
  getLayerIcon() {
    return `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <rect x="3" y="3" width="18" height="18" rx="2"/>
    </svg>`;
  }
}
