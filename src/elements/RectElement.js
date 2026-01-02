import { BaseElement } from './BaseElement.js';

/**
 * RectElement - A rectangle/shape element
 */
export class RectElement extends BaseElement {
    constructor(options = {}) {
        super(options);
        this.type = 'rect';
        this.name = options.name || '矩形';
        this.fillColor = options.fillColor || 'rgba(124, 58, 237, 0.1)';
        this.strokeColor = options.strokeColor || '#7c3aed';
        this.strokeWidth = options.strokeWidth || 2;    // Stroke width in pt
        this.borderRadius = options.borderRadius || 0;  // Border radius in mm
        this.opacity = options.opacity !== undefined ? options.opacity : 1;
    }

    render(scale) {
        const element = document.createElement('div');
        element.id = this.id;
        element.className = 'canvas-element element-rect';
        element.dataset.type = this.type;

        // Apply styles
        this.applyStyles(element, scale);

        // Add resize handles
        this.createResizeHandles().forEach(handle => element.appendChild(handle));

        this.domElement = element;
        return element;
    }

    applyStyles(element, scale) {
        element.style.left = `${this.x * scale}px`;
        element.style.top = `${this.y * scale}px`;
        element.style.width = `${this.width * scale}px`;
        element.style.height = `${this.height * scale}px`;
        element.style.backgroundColor = this.fillColor;
        element.style.borderColor = this.strokeColor;
        element.style.borderWidth = `${this.strokeWidth * 0.3528 * scale}px`;
        element.style.borderStyle = 'solid';
        element.style.borderRadius = `${this.borderRadius * scale}px`;
        element.style.opacity = this.opacity;
        element.style.transform = `rotate(${this.rotation}deg)`;
    }

    updateDom(scale) {
        if (!this.domElement) return;
        this.applyStyles(this.domElement, scale);
    }

    toLatex(posterHeight) {
        // Convert to TikZ coordinates (cm)
        // TikZ uses shift from page.north west, so Y needs to be negative (downward)
        const x1 = this.x / 10;
        const y1 = -this.y / 10;  // Negative because Y goes down from top
        const x2 = (this.x + this.width) / 10;
        const y2 = -(this.y + this.height) / 10;  // Negative because Y goes down from top

        // Build TikZ options
        const options = [];

        // Fill color
        if (this.fillColor && this.fillColor !== 'transparent') {
            const fillRgb = this.parseColor(this.fillColor);
            if (fillRgb) {
                options.push(`fill={rgb,255:red,${fillRgb.r};green,${fillRgb.g};blue,${fillRgb.b}}`);
                if (fillRgb.a < 1) {
                    options.push(`fill opacity=${fillRgb.a.toFixed(2)}`);
                }
            }
        }

        // Stroke color
        if (this.strokeColor && this.strokeWidth > 0) {
            const strokeRgb = this.parseColor(this.strokeColor);
            if (strokeRgb) {
                options.push(`draw={rgb,255:red,${strokeRgb.r};green,${strokeRgb.g};blue,${strokeRgb.b}}`);
                options.push(`line width=${(this.strokeWidth * 0.35).toFixed(2)}mm`);
            }
        }

        // Border radius
        if (this.borderRadius > 0) {
            options.push(`rounded corners=${(this.borderRadius / 10).toFixed(2)}cm`);
        }

        // Opacity
        if (this.opacity < 1) {
            options.push(`opacity=${this.opacity.toFixed(2)}`);
        }

        const optionsStr = options.length > 0 ? `[${options.join(', ')}]` : '';

        return `\\begin{textblock}{0}(0,0)
  \\begin{tikzpicture}[overlay]
    \\draw${optionsStr} (${x1.toFixed(2)},${y1.toFixed(2)}) rectangle (${x2.toFixed(2)},${y2.toFixed(2)});
  \\end{tikzpicture}
\\end{textblock}`;
    }

    parseColor(colorStr) {
        // Handle rgba
        const rgbaMatch = colorStr.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/);
        if (rgbaMatch) {
            return {
                r: parseInt(rgbaMatch[1]),
                g: parseInt(rgbaMatch[2]),
                b: parseInt(rgbaMatch[3]),
                a: rgbaMatch[4] !== undefined ? parseFloat(rgbaMatch[4]) : 1
            };
        }

        // Handle hex
        const hexMatch = colorStr.match(/^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i);
        if (hexMatch) {
            return {
                r: parseInt(hexMatch[1], 16),
                g: parseInt(hexMatch[2], 16),
                b: parseInt(hexMatch[3], 16),
                a: 1
            };
        }

        return null;
    }

    toJSON() {
        return {
            ...super.toJSON(),
            fillColor: this.fillColor,
            strokeColor: this.strokeColor,
            strokeWidth: this.strokeWidth,
            borderRadius: this.borderRadius,
            opacity: this.opacity
        };
    }

    getLayerIcon() {
        return `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <rect x="3" y="3" width="18" height="18" rx="2"/>
    </svg>`;
    }
}
