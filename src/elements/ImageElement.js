import { BaseElement } from './BaseElement.js';

/**
 * ImageElement - An image placeholder element
 */
export class ImageElement extends BaseElement {
    constructor(options = {}) {
        super(options);
        this.type = 'image';
        this.name = options.name || '圖片';
        this.src = options.src || null;
        this.fileName = options.fileName || '';
        this.objectFit = options.objectFit || 'cover';
        this.borderRadius = options.borderRadius || 0;
        this.opacity = options.opacity !== undefined ? options.opacity : 1;
    }

    render(scale) {
        const element = document.createElement('div');
        element.id = this.id;
        element.className = 'canvas-element element-image';
        element.dataset.type = this.type;

        // Apply styles
        this.applyStyles(element, scale);

        // Show image or placeholder
        if (this.src) {
            const img = document.createElement('img');
            img.src = this.src;
            img.alt = this.fileName;
            img.style.objectFit = this.objectFit;
            img.draggable = false;  // Prevent image from being dragged
            element.appendChild(img);
        } else {
            element.innerHTML = `
        <div class="image-placeholder" style="display: flex; flex-direction: column; align-items: center; gap: 4px; pointer-events: none;">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <rect x="3" y="3" width="18" height="18" rx="2"/>
            <circle cx="8.5" cy="8.5" r="1.5"/>
            <path d="M21 15l-5-5L5 21"/>
          </svg>
          <span>雙擊上傳圖片</span>
        </div>
      `;
        }

        // Add resize handles
        this.createResizeHandles().forEach(handle => element.appendChild(handle));

        // Double-click to upload image
        element.addEventListener('dblclick', (e) => {
            e.stopPropagation();
            this.promptImageUpload();
        });

        // Handle file drops from outside the browser
        element.addEventListener('dragover', (e) => {
            // Only handle if dragging files from outside
            if (e.dataTransfer && e.dataTransfer.types.includes('Files')) {
                e.preventDefault();
                e.stopPropagation();
                element.style.borderColor = '#7c3aed';
                element.style.borderWidth = '2px';
            }
        });
        element.addEventListener('dragleave', (e) => {
            element.style.borderColor = '#999999';
            element.style.borderWidth = '1px';
        });
        element.addEventListener('drop', (e) => {
            // Only handle if dropping files
            if (e.dataTransfer && e.dataTransfer.files.length > 0) {
                e.preventDefault();
                e.stopPropagation();
                this.handleDrop(e);
            }
            element.style.borderColor = '#999999';
            element.style.borderWidth = '1px';
        });

        this.domElement = element;
        return element;
    }

    applyStyles(element, scale) {
        element.style.left = `${this.x * scale}px`;
        element.style.top = `${this.y * scale}px`;
        element.style.width = `${this.width * scale}px`;
        element.style.height = `${this.height * scale}px`;
        element.style.borderRadius = `${this.borderRadius * scale}px`;
        element.style.opacity = this.opacity;
        element.style.transform = `rotate(${this.rotation}deg)`;
    }

    updateDom(scale) {
        if (!this.domElement) return;
        this.applyStyles(this.domElement, scale);
    }

    promptImageUpload() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        input.onchange = (e) => {
            const file = e.target.files[0];
            if (file) {
                this.loadImage(file);
            }
        };
        input.click();
    }

    handleDrop(e) {
        e.preventDefault();
        const file = e.dataTransfer.files[0];
        if (file && file.type.startsWith('image/')) {
            this.loadImage(file);
        }
    }

    loadImage(file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            this.src = e.target.result;
            this.fileName = file.name;

            // Update DOM
            if (this.domElement) {
                this.domElement.innerHTML = '';
                const img = document.createElement('img');
                img.src = this.src;
                img.alt = this.fileName;
                img.style.objectFit = this.objectFit;
                this.domElement.appendChild(img);

                // Re-add resize handles
                this.createResizeHandles().forEach(handle => this.domElement.appendChild(handle));
            }

            window.dispatchEvent(new CustomEvent('elementChanged', { detail: this }));
        };
        reader.readAsDataURL(file);
    }

    toLatex() {
        if (!this.fileName) {
            return `% Image placeholder at (${(this.x / 10).toFixed(1)}cm, ${(this.y / 10).toFixed(1)}cm)`;
        }

        const x = this.x / 10;
        const y = this.y / 10;
        const width = this.width / 10;

        return `\\begin{textblock}{${width.toFixed(1)}}(${x.toFixed(1)},${y.toFixed(1)})
  \\includegraphics[width=${width.toFixed(1)}cm]{${this.fileName}}
\\end{textblock}`;
    }

    toJSON() {
        return {
            ...super.toJSON(),
            src: this.src,
            fileName: this.fileName,
            objectFit: this.objectFit,
            borderRadius: this.borderRadius,
            opacity: this.opacity
        };
    }

    getLayerIcon() {
        return `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <rect x="3" y="3" width="18" height="18" rx="2"/>
      <circle cx="8.5" cy="8.5" r="1.5"/>
      <path d="M21 15l-5-5L5 21"/>
    </svg>`;
    }
}
