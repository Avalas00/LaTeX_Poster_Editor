/**
 * SnapGuideManager - Manages snap alignment guides and auto-snapping
 * Provides Canva-like alignment experience with visual guide lines
 */
export class SnapGuideManager {
    constructor(canvas, options = {}) {
        this.canvas = canvas;
        this.snapThreshold = options.snapThreshold || 8;  // pixels
        this.enabled = true;

        // Guide line elements
        this.guides = {
            vertical: [],
            horizontal: []
        };

        // Container for guide lines
        this.guideContainer = null;
        this.createGuideContainer();
    }

    createGuideContainer() {
        this.guideContainer = document.createElement('div');
        this.guideContainer.className = 'snap-guide-container';
        this.guideContainer.style.cssText = `
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            pointer-events: none;
            z-index: 1000;
        `;
        this.canvas.appendChild(this.guideContainer);
    }

    /**
     * Calculate snap positions based on other elements and canvas
     * @param {BaseElement} movingElement - The element being dragged
     * @param {BaseElement[]} allElements - All elements on canvas
     * @param {number} canvasWidth - Canvas width in mm
     * @param {number} canvasHeight - Canvas height in mm
     * @param {number} scale - Current zoom scale
     * @returns {Object} Snap positions and guides to show
     */
    calculateSnap(movingElement, allElements, canvasWidth, canvasHeight, scale) {
        const result = {
            snapX: null,
            snapY: null,
            guides: []
        };

        if (!this.enabled) return result;

        // Moving element bounds (in mm)
        const moving = {
            left: movingElement.x,
            right: movingElement.x + movingElement.width,
            centerX: movingElement.x + movingElement.width / 2,
            top: movingElement.y,
            bottom: movingElement.y + movingElement.height,
            centerY: movingElement.y + movingElement.height / 2
        };

        // Threshold in mm (convert from pixels)
        const threshold = this.snapThreshold / scale;

        // Collect all snap points
        const verticalSnapPoints = [];  // x positions
        const horizontalSnapPoints = [];  // y positions

        // Canvas snap points
        verticalSnapPoints.push({ pos: 0, type: 'canvas-edge', label: 'left' });
        verticalSnapPoints.push({ pos: canvasWidth / 2, type: 'canvas-center', label: 'center' });
        verticalSnapPoints.push({ pos: canvasWidth, type: 'canvas-edge', label: 'right' });

        horizontalSnapPoints.push({ pos: 0, type: 'canvas-edge', label: 'top' });
        horizontalSnapPoints.push({ pos: canvasHeight / 2, type: 'canvas-center', label: 'center' });
        horizontalSnapPoints.push({ pos: canvasHeight, type: 'canvas-edge', label: 'bottom' });

        // Other elements' snap points
        allElements.forEach(el => {
            if (el.id === movingElement.id) return;

            // Vertical alignment points (x)
            verticalSnapPoints.push({ pos: el.x, type: 'element-edge', label: 'left', elementId: el.id });
            verticalSnapPoints.push({ pos: el.x + el.width / 2, type: 'element-center', label: 'center', elementId: el.id });
            verticalSnapPoints.push({ pos: el.x + el.width, type: 'element-edge', label: 'right', elementId: el.id });

            // Horizontal alignment points (y)
            horizontalSnapPoints.push({ pos: el.y, type: 'element-edge', label: 'top', elementId: el.id });
            horizontalSnapPoints.push({ pos: el.y + el.height / 2, type: 'element-center', label: 'center', elementId: el.id });
            horizontalSnapPoints.push({ pos: el.y + el.height, type: 'element-edge', label: 'bottom', elementId: el.id });
        });

        // Check vertical (X) snapping
        // For each edge/center of the moving element, check if it's close to a snap point
        const movingXPoints = [
            { pos: moving.left, type: 'left' },      // Left edge
            { pos: moving.centerX, type: 'center' }, // Center
            { pos: moving.right, type: 'right' }     // Right edge
        ];

        for (const movingPoint of movingXPoints) {
            for (const snapPoint of verticalSnapPoints) {
                const diff = Math.abs(movingPoint.pos - snapPoint.pos);
                if (diff <= threshold) {
                    // Calculate new X position so that movingPoint aligns with snapPoint
                    if (movingPoint.type === 'left') {
                        result.snapX = snapPoint.pos;
                    } else if (movingPoint.type === 'center') {
                        result.snapX = snapPoint.pos - movingElement.width / 2;
                    } else { // right
                        result.snapX = snapPoint.pos - movingElement.width;
                    }
                    result.guides.push({
                        type: 'vertical',
                        position: snapPoint.pos * scale,
                        snapType: snapPoint.type
                    });
                    break;
                }
            }
            if (result.snapX !== null) break;
        }

        // Check horizontal (Y) snapping
        const movingYPoints = [
            { pos: moving.top, type: 'top' },        // Top edge
            { pos: moving.centerY, type: 'center' }, // Center
            { pos: moving.bottom, type: 'bottom' }   // Bottom edge
        ];

        for (const movingPoint of movingYPoints) {
            for (const snapPoint of horizontalSnapPoints) {
                const diff = Math.abs(movingPoint.pos - snapPoint.pos);
                if (diff <= threshold) {
                    // Calculate new Y position so that movingPoint aligns with snapPoint
                    if (movingPoint.type === 'top') {
                        result.snapY = snapPoint.pos;
                    } else if (movingPoint.type === 'center') {
                        result.snapY = snapPoint.pos - movingElement.height / 2;
                    } else { // bottom
                        result.snapY = snapPoint.pos - movingElement.height;
                    }
                    result.guides.push({
                        type: 'horizontal',
                        position: snapPoint.pos * scale,
                        snapType: snapPoint.type
                    });
                    break;
                }
            }
            if (result.snapY !== null) break;
        }

        return result;
    }

    /**
     * Show guide lines on canvas
     * @param {Array} guides - Guide definitions from calculateSnap
     */
    showGuides(guides) {
        this.hideGuides();

        guides.forEach(guide => {
            const line = document.createElement('div');
            line.className = `snap-guide snap-guide-${guide.type} snap-${guide.snapType}`;

            if (guide.type === 'vertical') {
                line.style.cssText = `
                    position: absolute;
                    left: ${guide.position}px;
                    top: 0;
                    width: 1px;
                    height: 100%;
                    background: transparent;
                    border-left: 1px dashed #ff6b6b;
                    pointer-events: none;
                    z-index: 1001;
                `;
            } else {
                line.style.cssText = `
                    position: absolute;
                    top: ${guide.position}px;
                    left: 0;
                    height: 1px;
                    width: 100%;
                    background: transparent;
                    border-top: 1px dashed #ff6b6b;
                    pointer-events: none;
                    z-index: 1001;
                `;
            }

            // Different color for center alignment
            if (guide.snapType === 'canvas-center' || guide.snapType === 'element-center') {
                line.style.borderColor = '#4ecdc4';
            }

            this.guideContainer.appendChild(line);

            if (guide.type === 'vertical') {
                this.guides.vertical.push(line);
            } else {
                this.guides.horizontal.push(line);
            }
        });
    }

    /**
     * Hide all guide lines
     */
    hideGuides() {
        [...this.guides.vertical, ...this.guides.horizontal].forEach(line => {
            line.remove();
        });
        this.guides.vertical = [];
        this.guides.horizontal = [];
    }

    /**
     * Enable/disable snapping
     * @param {boolean} enabled
     */
    setEnabled(enabled) {
        this.enabled = enabled;
        if (!enabled) {
            this.hideGuides();
        }
    }

    /**
     * Set snap threshold
     * @param {number} threshold - Threshold in pixels
     */
    setThreshold(threshold) {
        this.snapThreshold = threshold;
    }

    /**
     * Cleanup
     */
    destroy() {
        this.hideGuides();
        if (this.guideContainer) {
            this.guideContainer.remove();
        }
    }
}
