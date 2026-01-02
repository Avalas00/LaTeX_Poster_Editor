import { BaseElement } from './BaseElement.js';

/**
 * LineElement - A line element with draggable endpoints
 */
export class LineElement extends BaseElement {
    constructor(options = {}) {
        super(options);
        this.type = 'line';
        this.name = options.name || '線條';
        this.strokeColor = options.strokeColor || '#000000';
        this.strokeWidth = options.strokeWidth || 2;
        this.lineStyle = options.lineStyle || 'solid'; // solid, dashed, dotted

        // Line endpoints in absolute coordinates (mm)
        // x1,y1 is start point, x2,y2 is end point
        this.x1 = options.x1 !== undefined ? options.x1 : this.x;
        this.y1 = options.y1 !== undefined ? options.y1 : this.y;
        this.x2 = options.x2 !== undefined ? options.x2 : this.x + this.width;
        this.y2 = options.y2 !== undefined ? options.y2 : this.y;
    }

    render(scale) {
        const element = document.createElement('div');
        element.id = this.id;
        element.className = 'canvas-element element-line';
        element.dataset.type = this.type;

        // Container covers the full canvas to allow SVG to draw anywhere
        element.style.cssText = `
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            height: 100%;
            pointer-events: none;
        `;

        // Create SVG for the line
        const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svg.style.cssText = `
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            height: 100%;
            overflow: visible;
            pointer-events: none;
        `;

        const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        line.style.pointerEvents = 'stroke';  // Make line clickable
        this.updateSvgLine(line, scale);
        svg.appendChild(line);
        element.appendChild(svg);

        // Add resize handles at line endpoints
        const handle1 = this.createEndpointHandle('start', scale);
        element.appendChild(handle1);

        const handle2 = this.createEndpointHandle('end', scale);
        element.appendChild(handle2);

        this.domElement = element;
        return element;
    }

    createEndpointHandle(endpoint, scale) {
        const handle = document.createElement('div');
        handle.className = 'resize-handle line-endpoint';
        handle.dataset.position = endpoint;
        handle.dataset.endpoint = endpoint;

        const x = endpoint === 'start' ? this.x1 : this.x2;
        const y = endpoint === 'start' ? this.y1 : this.y2;

        handle.style.cssText = `
            position: absolute;
            left: ${x * scale - 6}px;
            top: ${y * scale - 6}px;
            width: 12px;
            height: 12px;
            pointer-events: auto;
            cursor: move;
        `;

        return handle;
    }

    updateSvgLine(line, scale) {
        line.setAttribute('x1', this.x1 * scale);
        line.setAttribute('y1', this.y1 * scale);
        line.setAttribute('x2', this.x2 * scale);
        line.setAttribute('y2', this.y2 * scale);
        line.setAttribute('stroke', this.strokeColor);

        // strokeWidth is in pt, scale properly for visual preview
        // 1pt ≈ 0.35mm, and scale converts mm to pixels
        // So: strokeWidth (pt) * 0.35 (mm/pt) * scale (px/mm)
        const visualStrokeWidth = Math.max(this.strokeWidth * 0.35 * scale, 2);
        line.setAttribute('stroke-width', visualStrokeWidth);

        if (this.lineStyle === 'dashed') {
            line.setAttribute('stroke-dasharray', `${10 * scale},${5 * scale}`);
        } else if (this.lineStyle === 'dotted') {
            line.setAttribute('stroke-dasharray', `${2 * scale},${4 * scale}`);
        } else {
            line.removeAttribute('stroke-dasharray');
        }
    }

    updateDom(scale) {
        if (!this.domElement) return;

        // Update SVG line
        const line = this.domElement.querySelector('line');
        if (line) {
            this.updateSvgLine(line, scale);
        }

        // Update handles
        const handles = this.domElement.querySelectorAll('.resize-handle');
        handles.forEach(handle => {
            const endpoint = handle.dataset.endpoint;
            const x = endpoint === 'start' ? this.x1 : this.x2;
            const y = endpoint === 'start' ? this.y1 : this.y2;
            handle.style.left = `${x * scale - 6}px`;
            handle.style.top = `${y * scale - 6}px`;
        });

        // Update internal bounds for compatibility
        this.updateBounds();
    }

    updateBounds() {
        // Calculate bounding box from endpoints
        this.x = Math.min(this.x1, this.x2);
        this.y = Math.min(this.y1, this.y2);
        this.width = Math.abs(this.x2 - this.x1) || 10;
        this.height = Math.abs(this.y2 - this.y1) || 10;
    }

    toLatex() {
        // Use textblock at (0,0) to ensure Z-index order is respected
        // TikZ coordinates: X is positive right, Y is positive up (but we draw negative for down)
        const x1 = this.x1 / 10;
        const y1 = -this.y1 / 10;
        const x2 = this.x2 / 10;
        const y2 = -this.y2 / 10;

        const options = [];

        // Color
        const rgb = this.hexToRgb(this.strokeColor);
        if (rgb) {
            options.push(`draw={rgb,255:red,${rgb.r};green,${rgb.g};blue,${rgb.b}}`);
        }

        // Line width
        options.push(`line width=${(this.strokeWidth * 0.35).toFixed(2)}mm`);

        // Line style
        if (this.lineStyle === 'dashed') {
            options.push('dashed');
        } else if (this.lineStyle === 'dotted') {
            options.push('dotted');
        }

        const optionsStr = options.length > 0 ? `[${options.join(', ')}]` : '';

        return `\\begin{textblock}{0}(0,0)
  \\begin{tikzpicture}[overlay]
    \\draw${optionsStr} (${x1.toFixed(2)},${y1.toFixed(2)}) -- (${x2.toFixed(2)},${y2.toFixed(2)});
  \\end{tikzpicture}
\\end{textblock}`;
    }

    hexToRgb(hex) {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? {
            r: parseInt(result[1], 16),
            g: parseInt(result[2], 16),
            b: parseInt(result[3], 16)
        } : null;
    }

    toJSON() {
        return {
            ...super.toJSON(),
            strokeColor: this.strokeColor,
            strokeWidth: this.strokeWidth,
            lineStyle: this.lineStyle,
            x1: this.x1,
            y1: this.y1,
            x2: this.x2,
            y2: this.y2
        };
    }

    getLayerIcon() {
        return `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <line x1="5" y1="19" x2="19" y2="5"/>
    </svg>`;
    }
}
