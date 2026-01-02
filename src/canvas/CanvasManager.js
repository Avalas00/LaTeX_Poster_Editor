import { TextElement } from '../elements/TextElement.js';
import { RectElement } from '../elements/RectElement.js';
import { ImageElement } from '../elements/ImageElement.js';
import { LineElement } from '../elements/LineElement.js';
import { SnapGuideManager } from './SnapGuideManager.js';

/**
 * CanvasManager - Manages the canvas and all elements
 */
export class CanvasManager {
    constructor(canvasElement, options = {}) {
        this.canvas = canvasElement;
        this.elements = [];
        this.selectedElement = null;

        // Poster dimensions in mm
        this.posterWidth = options.posterWidth || 841;   // A0 width
        this.posterHeight = options.posterHeight || 1189; // A0 height

        // Scale factor (pixels per mm on screen)
        this.scale = 0.5;
        this.minScale = 0.1;
        this.maxScale = 2;

        // Drag state
        this.isDragging = false;
        this.isResizing = false;
        this.dragStartX = 0;
        this.dragStartY = 0;
        this.dragElementStartX = 0;
        this.dragElementStartY = 0;
        this.resizeHandle = null;
        this.resizeStartWidth = 0;
        this.resizeStartHeight = 0;

        // Callbacks
        this.onSelectionChange = options.onSelectionChange || (() => { });
        this.onElementChange = options.onElementChange || (() => { });
        this.onLayersChange = options.onLayersChange || (() => { });

        this.init();
    }

    init() {
        this.updateCanvasSize();
        this.setupEventListeners();

        // Initialize snap guide manager
        this.snapGuideManager = new SnapGuideManager(this.canvas, {
            snapThreshold: 8
        });
    }

    updateCanvasSize() {
        this.canvas.style.width = `${this.posterWidth * this.scale}px`;
        this.canvas.style.height = `${this.posterHeight * this.scale}px`;
    }

    setupEventListeners() {
        // Canvas click (deselect)
        this.canvas.addEventListener('click', (e) => {
            if (e.target === this.canvas) {
                this.deselectAll();
            }
        });

        // Mouse events for dragging
        this.canvas.addEventListener('mousedown', (e) => this.handleMouseDown(e));
        document.addEventListener('mousemove', (e) => this.handleMouseMove(e));
        document.addEventListener('mouseup', (e) => this.handleMouseUp(e));

        // Keyboard events (delete, copy, etc.)
        document.addEventListener('keydown', (e) => this.handleKeyDown(e));

        // Listen for element changes
        window.addEventListener('elementChanged', (e) => {
            this.onElementChange(e.detail);
        });
    }

    handleMouseDown(e) {
        const element = e.target.closest('.canvas-element');
        if (!element) return;

        const canvasEl = this.elements.find(el => el.id === element.id);
        if (!canvasEl) return;

        // Check if clicking on resize handle
        const resizeHandle = e.target.closest('.resize-handle');
        if (resizeHandle && canvasEl.isSelected) {
            this.startResize(e, canvasEl, resizeHandle.dataset.position);
            return;
        }

        // Select and start drag
        this.selectElement(canvasEl);
        this.startDrag(e, canvasEl);
    }

    handleMouseMove(e) {
        if (this.isDragging && this.selectedElement) {
            this.doDrag(e);
        } else if (this.isResizing && this.selectedElement) {
            this.doResize(e);
        }
    }

    handleMouseUp(e) {
        if (this.isDragging || this.isResizing) {
            this.endDragOrResize();
        }
    }

    handleKeyDown(e) {
        if (!this.selectedElement) return;

        // Check if user is typing in an input field, select, or contentEditable element
        const activeEl = document.activeElement;
        const isEditing = activeEl && (
            activeEl.tagName === 'INPUT' ||
            activeEl.tagName === 'TEXTAREA' ||
            activeEl.tagName === 'SELECT' ||
            activeEl.contentEditable === 'true'
        );

        // Delete element
        if (e.key === 'Delete' || e.key === 'Backspace') {
            // Don't delete if user is editing an input field
            if (isEditing) return;

            this.deleteElement(this.selectedElement);
            return;
        }

        // Duplicate (Ctrl+D)
        if (e.key === 'd' && (e.ctrlKey || e.metaKey)) {
            e.preventDefault();
            this.duplicateElement(this.selectedElement);
            return;
        }

        // Arrow key movement - only when not editing
        if (isEditing) return;

        const moveAmount = e.shiftKey ? 10 : 1;
        switch (e.key) {
            case 'ArrowUp':
                e.preventDefault();
                this.selectedElement.y -= moveAmount;
                break;
            case 'ArrowDown':
                e.preventDefault();
                this.selectedElement.y += moveAmount;
                break;
            case 'ArrowLeft':
                e.preventDefault();
                this.selectedElement.x -= moveAmount;
                break;
            case 'ArrowRight':
                e.preventDefault();
                this.selectedElement.x += moveAmount;
                break;
            default:
                return;
        }

        this.selectedElement.updateDom(this.scale);
        this.onElementChange(this.selectedElement);
    }

    startDrag(e, element) {
        if (element.locked) return;

        this.isDragging = true;
        this.dragStartX = e.clientX;
        this.dragStartY = e.clientY;
        this.dragElementStartX = element.x;
        this.dragElementStartY = element.y;

        // Store line endpoints for line elements
        if (element.type === 'line') {
            this.lineStartX1 = element.x1;
            this.lineStartY1 = element.y1;
            this.lineStartX2 = element.x2;
            this.lineStartY2 = element.y2;
        }

        element.domElement.style.cursor = 'grabbing';
    }

    doDrag(e) {
        const dx = (e.clientX - this.dragStartX) / this.scale;
        const dy = (e.clientY - this.dragStartY) / this.scale;

        const el = this.selectedElement;

        // Special handling for line elements - move both endpoints
        if (el.type === 'line') {
            el.x1 = this.lineStartX1 + dx;
            el.y1 = this.lineStartY1 + dy;
            el.x2 = this.lineStartX2 + dx;
            el.y2 = this.lineStartY2 + dy;

            // Update bounds
            if (el.updateBounds) el.updateBounds();
        } else {
            // Calculate new position for other elements
            let newX = Math.max(0, Math.min(
                this.posterWidth - el.width,
                this.dragElementStartX + dx
            ));
            let newY = Math.max(0, Math.min(
                this.posterHeight - el.height,
                this.dragElementStartY + dy
            ));

            // Apply temporary position for snap calculation
            el.x = newX;
            el.y = newY;

            // Check for snap alignment
            if (this.snapGuideManager) {
                const snapResult = this.snapGuideManager.calculateSnap(
                    el,
                    this.elements,
                    this.posterWidth,
                    this.posterHeight,
                    this.scale
                );

                // Apply snap if found
                if (snapResult.snapX !== null) {
                    el.x = snapResult.snapX;
                }
                if (snapResult.snapY !== null) {
                    el.y = snapResult.snapY;
                }

                // Show/hide guides
                if (snapResult.guides.length > 0) {
                    this.snapGuideManager.showGuides(snapResult.guides);
                } else {
                    this.snapGuideManager.hideGuides();
                }
            }
        }

        el.updateDom(this.scale);
        this.onSelectionChange(el);
    }

    startResize(e, element, handlePosition) {
        if (element.locked) return;

        this.isResizing = true;
        this.resizeHandle = handlePosition;
        this.dragStartX = e.clientX;
        this.dragStartY = e.clientY;
        this.dragElementStartX = element.x;
        this.dragElementStartY = element.y;
        this.resizeStartWidth = element.width;
        this.resizeStartHeight = element.height;

        // Store line endpoint info for line elements
        if (element.type === 'line') {
            this.lineStartX1 = element.x1;
            this.lineStartY1 = element.y1;
            this.lineStartX2 = element.x2;
            this.lineStartY2 = element.y2;
        }

        e.stopPropagation();
    }

    doResize(e) {
        const dx = (e.clientX - this.dragStartX) / this.scale;
        const dy = (e.clientY - this.dragStartY) / this.scale;

        const el = this.selectedElement;
        const minSize = 10;

        // Special handling for line elements
        if (el.type === 'line' && (this.resizeHandle === 'start' || this.resizeHandle === 'end')) {
            if (this.resizeHandle === 'start') {
                el.x1 = this.lineStartX1 + dx;
                el.y1 = this.lineStartY1 + dy;
            } else if (this.resizeHandle === 'end') {
                el.x2 = this.lineStartX2 + dx;
                el.y2 = this.lineStartY2 + dy;
            }

            // Update element bounds based on line endpoints
            const minX = Math.min(el.x1, el.x2);
            const minY = Math.min(el.y1, el.y2);
            const maxX = Math.max(el.x1, el.x2);
            const maxY = Math.max(el.y1, el.y2);

            el.width = Math.max(minSize, maxX - minX);
            el.height = Math.max(minSize, maxY - minY);
        } else {
            // Standard resize for other elements
            switch (this.resizeHandle) {
                case 'se':
                    el.width = Math.max(minSize, this.resizeStartWidth + dx);
                    el.height = Math.max(minSize, this.resizeStartHeight + dy);
                    break;
                case 'sw':
                    el.x = this.dragElementStartX + dx;
                    el.width = Math.max(minSize, this.resizeStartWidth - dx);
                    el.height = Math.max(minSize, this.resizeStartHeight + dy);
                    break;
                case 'ne':
                    el.y = this.dragElementStartY + dy;
                    el.width = Math.max(minSize, this.resizeStartWidth + dx);
                    el.height = Math.max(minSize, this.resizeStartHeight - dy);
                    break;
                case 'nw':
                    el.x = this.dragElementStartX + dx;
                    el.y = this.dragElementStartY + dy;
                    el.width = Math.max(minSize, this.resizeStartWidth - dx);
                    el.height = Math.max(minSize, this.resizeStartHeight - dy);
                    break;
                case 'n':
                    el.y = this.dragElementStartY + dy;
                    el.height = Math.max(minSize, this.resizeStartHeight - dy);
                    break;
                case 's':
                    el.height = Math.max(minSize, this.resizeStartHeight + dy);
                    break;
                case 'w':
                    el.x = this.dragElementStartX + dx;
                    el.width = Math.max(minSize, this.resizeStartWidth - dx);
                    break;
                case 'e':
                    el.width = Math.max(minSize, this.resizeStartWidth + dx);
                    break;
            }
        }

        el.updateDom(this.scale);
        this.onSelectionChange(el);
    }

    endDragOrResize() {
        if (this.selectedElement && this.selectedElement.domElement) {
            this.selectedElement.domElement.style.cursor = 'move';
        }

        if (this.isDragging || this.isResizing) {
            this.onElementChange(this.selectedElement);
        }

        // Hide snap guides when drag ends
        if (this.snapGuideManager) {
            this.snapGuideManager.hideGuides();
        }

        this.isDragging = false;
        this.isResizing = false;
        this.resizeHandle = null;
    }

    selectElement(element) {
        this.deselectAll();
        element.setSelected(true);
        this.selectedElement = element;
        this.onSelectionChange(element);
    }

    deselectAll() {
        this.elements.forEach(el => el.setSelected(false));
        this.selectedElement = null;
        this.onSelectionChange(null);
    }

    /**
     * Add a new element to the canvas
     * @param {string} type - Element type (text, rect, image, line)
     * @param {Object} options - Element options
     * @returns {BaseElement}
     */
    addElement(type, options = {}) {
        let element;

        // Default position at center
        const defaultX = (this.posterWidth - (options.width || 100)) / 2;
        const defaultY = (this.posterHeight - (options.height || 50)) / 2;

        const defaultOptions = {
            x: options.x !== undefined ? options.x : defaultX,
            y: options.y !== undefined ? options.y : defaultY,
            ...options
        };

        switch (type) {
            case 'text':
                element = new TextElement(defaultOptions);
                break;
            case 'rect':
                element = new RectElement({
                    width: 150,
                    height: 100,
                    ...defaultOptions
                });
                break;
            case 'image':
                element = new ImageElement({
                    width: 150,
                    height: 100,
                    ...defaultOptions
                });
                break;
            case 'line':
                element = new LineElement({
                    width: 100,
                    height: 10,
                    x2: 100,
                    y2: 0,
                    ...defaultOptions
                });
                break;
            default:
                console.warn(`Unknown element type: ${type}`);
                return null;
        }

        this.elements.push(element);

        // Render and add to canvas
        const domElement = element.render(this.scale);
        this.canvas.appendChild(domElement);

        // Select the new element
        this.selectElement(element);

        // Update layers
        this.onLayersChange(this.elements);
        this.onElementChange(element);

        return element;
    }

    deleteElement(element) {
        const index = this.elements.indexOf(element);
        if (index > -1) {
            this.elements.splice(index, 1);
            element.domElement.remove();

            if (this.selectedElement === element) {
                this.selectedElement = null;
                this.onSelectionChange(null);
            }

            this.onLayersChange(this.elements);
            this.onElementChange(null);
        }
    }

    duplicateElement(element) {
        const clone = element.clone();
        this.elements.push(clone);

        const domElement = clone.render(this.scale);
        this.canvas.appendChild(domElement);

        this.selectElement(clone);
        this.onLayersChange(this.elements);
        this.onElementChange(clone);

        return clone;
    }

    clearCanvas() {
        this.elements.forEach(el => el.domElement.remove());
        this.elements = [];
        this.selectedElement = null;
        this.onSelectionChange(null);
        this.onLayersChange([]);
        this.onElementChange(null);
    }

    setZoom(scale) {
        this.scale = Math.max(this.minScale, Math.min(this.maxScale, scale));
        this.updateCanvasSize();

        // Update all elements
        this.elements.forEach(el => el.updateDom(this.scale));

        return this.scale;
    }

    zoomIn() {
        return this.setZoom(this.scale + 0.1);
    }

    zoomOut() {
        return this.setZoom(this.scale - 0.1);
    }

    zoomToFit() {
        const container = this.canvas.parentElement;
        const padding = 80;
        const maxWidth = container.clientWidth - padding;
        const maxHeight = container.clientHeight - padding;

        const scaleX = maxWidth / this.posterWidth;
        const scaleY = maxHeight / this.posterHeight;

        return this.setZoom(Math.min(scaleX, scaleY));
    }

    setPosterSize(width, height) {
        this.posterWidth = width;
        this.posterHeight = height;
        this.updateCanvasSize();
    }

    /**
     * Get all elements for LaTeX generation
     * @returns {BaseElement[]}
     */
    getElements() {
        return this.elements;
    }

    /**
     * Update z-indices of all elements based on their array order
     * Elements at the end of the array appear on top
     */
    updateZIndices() {
        const wrapper = this.canvas; // This is the container
        this.elements.forEach((el, index) => {
            if (el.domElement) {
                el.domElement.style.zIndex = index + 1;
                // Also move in DOM to ensure stacking context is correct
                // and to fix any browser rendering quirks
                if (el.domElement.parentNode === wrapper) {
                    wrapper.appendChild(el.domElement);
                }
            }
        });
    }

    /**
     * Export canvas state to JSON
     * @returns {Object}
     */
    toJSON() {
        return {
            posterWidth: this.posterWidth,
            posterHeight: this.posterHeight,
            elements: this.elements.map(el => el.toJSON())
        };
    }

    /**
     * Load canvas state from JSON
     * @param {Object} data
     */
    fromJSON(data) {
        this.clearCanvas();

        if (data.posterWidth) this.posterWidth = data.posterWidth;
        if (data.posterHeight) this.posterHeight = data.posterHeight;
        this.updateCanvasSize();

        if (data.elements) {
            data.elements.forEach(elData => {
                this.addElement(elData.type, elData);
            });
        }
    }
}
