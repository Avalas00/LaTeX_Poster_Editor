import { BaseElement } from './BaseElement.js';

/**
 * TextElement - A text box element
 */
export class TextElement extends BaseElement {
    constructor(options = {}) {
        super(options);
        this.type = 'text';
        this.name = options.name || '文字框';
        this.content = options.content || '雙擊編輯文字';
        this.fontSize = options.fontSize || 14;      // Font size in pt
        this.fontFamily = options.fontFamily || 'sans-serif';
        this.fontWeight = options.fontWeight || 'normal';
        this.fontStyle = options.fontStyle || 'normal';
        this.textAlign = options.textAlign || 'left';
        this.color = options.color || '#000000';
        this.backgroundColor = options.backgroundColor || 'transparent';
        this.lineHeight = options.lineHeight || 1.4;
    }

    render(scale) {
        const element = document.createElement('div');
        element.id = this.id;
        element.className = 'canvas-element element-text';
        element.contentEditable = 'false';
        element.spellcheck = false;
        element.dataset.type = this.type;

        // Set content
        element.textContent = this.content;

        // Apply styles
        this.applyStyles(element, scale);

        // Add resize handles
        this.createResizeHandles().forEach(handle => element.appendChild(handle));

        // Double-click to edit
        element.addEventListener('dblclick', (e) => {
            e.stopPropagation();
            this.startEditing();
        });

        this.domElement = element;
        return element;
    }

    applyStyles(element, scale) {
        element.style.left = `${this.x * scale}px`;
        element.style.top = `${this.y * scale}px`;
        element.style.width = `${this.width * scale}px`;
        element.style.height = `${this.height * scale}px`;
        // Convert pt to mm (1 pt = 0.352778 mm), then to pixels via scale
        element.style.fontSize = `${this.fontSize * 0.3528 * scale}px`;
        element.style.fontFamily = this.fontFamily;
        element.style.fontWeight = this.fontWeight;
        element.style.fontStyle = this.fontStyle;
        element.style.textAlign = this.textAlign;
        element.style.color = this.color;
        element.style.backgroundColor = this.backgroundColor;
        element.style.lineHeight = this.lineHeight;
        element.style.transform = `rotate(${this.rotation}deg)`;
        // Dynamic padding that scales with zoom
        element.style.padding = `${4 * scale}px ${6 * scale}px`;
    }

    updateDom(scale) {
        if (!this.domElement) return;
        this.applyStyles(this.domElement, scale);
    }

    startEditing() {
        if (!this.domElement || this.locked) return;

        this.domElement.contentEditable = 'true';
        this.domElement.style.cursor = 'text';
        this.domElement.focus();

        // Only select the text content, not the resize handles
        const textNode = this.domElement.firstChild;
        if (textNode && textNode.nodeType === Node.TEXT_NODE) {
            const range = document.createRange();
            range.selectNodeContents(textNode);
            const selection = window.getSelection();
            selection.removeAllRanges();
            selection.addRange(range);
        }

        // Listen for blur to stop editing
        const stopEditing = () => {
            this.stopEditing();
            this.domElement.removeEventListener('blur', stopEditing);
        };
        this.domElement.addEventListener('blur', stopEditing);
    }

    stopEditing() {
        if (!this.domElement) return;

        this.domElement.contentEditable = 'false';
        this.domElement.style.cursor = 'move';

        // Get text content with proper line breaks
        // ContentEditable creates <br>, <div>, or separate text nodes for line breaks
        this.content = this.getTextWithLineBreaks(this.domElement);

        // Re-add resize handles if they were deleted during editing
        const existingHandles = this.domElement.querySelectorAll('.resize-handle');
        if (existingHandles.length < 8) {
            // Remove any remaining handles first
            existingHandles.forEach(h => h.remove());
            // Re-add all handles
            this.createResizeHandles().forEach(handle => this.domElement.appendChild(handle));
        }

        // Dispatch event for latex update
        window.dispatchEvent(new CustomEvent('elementChanged', { detail: this }));
    }

    /**
     * Extract text content with proper line breaks from contentEditable element
     * Handles <br>, <div>, <p> tags that browsers create for line breaks
     */
    getTextWithLineBreaks(element) {
        let text = '';

        for (const node of element.childNodes) {
            // Skip resize handles
            if (node.nodeType === Node.ELEMENT_NODE && node.classList.contains('resize-handle')) {
                continue;
            }

            if (node.nodeType === Node.TEXT_NODE) {
                text += node.textContent;
            } else if (node.nodeType === Node.ELEMENT_NODE) {
                const tagName = node.tagName.toLowerCase();

                // Handle line break elements
                if (tagName === 'br') {
                    text += '\n';
                } else if (tagName === 'div' || tagName === 'p') {
                    // Divs and paragraphs represent new lines
                    if (text.length > 0 && !text.endsWith('\n')) {
                        text += '\n';
                    }
                    text += this.getTextWithLineBreaks(node);
                } else {
                    // For other elements, just get inner text
                    text += node.innerText || node.textContent || '';
                }
            }
        }

        return text.trim();
    }

    toLatex() {
        // Convert position to LaTeX coordinates
        const latexX = this.x / 10;  // Convert mm to cm
        const latexY = this.y / 10;  // Convert mm to cm
        const latexWidth = this.width / 10;

        // Escape special LaTeX characters and convert line breaks
        const escapedContent = this.escapeLatex(this.content);

        // Determine font family command
        let fontFamilyCmd = '';
        switch (this.fontFamily) {
            case 'Times New Roman':
            case 'Georgia':
            case 'serif':
                fontFamilyCmd = '\\rmfamily';  // Roman/Serif family
                break;
            case 'Arial':
            case 'sans-serif':
                fontFamilyCmd = '\\sffamily';  // Sans-serif family
                break;
            case 'Courier New':
                fontFamilyCmd = '\\ttfamily';  // Monospace/Typewriter family
                break;
            default:
                fontFamilyCmd = '';
        }

        // Determine font commands
        let fontCommands = fontFamilyCmd;
        if (this.fontWeight === 'bold') fontCommands += '\\bfseries';
        if (this.fontStyle === 'italic') fontCommands += '\\itshape';

        // Determine alignment command for parbox
        let alignCmd = '';
        switch (this.textAlign) {
            case 'center': alignCmd = '\\centering'; break;
            case 'right': alignCmd = '\\raggedleft'; break;
            default: alignCmd = '\\raggedright';
        }

        // Generate color if not black
        let colorCmd = '';
        if (this.color !== '#000000') {
            const rgb = this.hexToRgb(this.color);
            colorCmd = `\\color[RGB]{${rgb.r},${rgb.g},${rgb.b}}`;
        }

        // Build the text content using parbox for proper line breaks
        // parbox[t] aligns content to top, width matches textblock
        let textContent = `\\parbox[t]{${latexWidth.toFixed(1)}cm}{${alignCmd}\\fontsize{${this.fontSize}pt}{${Math.round(this.fontSize * this.lineHeight)}pt}\\selectfont${fontCommands}${colorCmd} ${escapedContent}}`;

        // Wrap with rotation if needed
        if (this.rotation !== 0) {
            textContent = `\\rotatebox{${-this.rotation}}{${textContent}}`;
        }

        return `\\begin{textblock}{${latexWidth.toFixed(1)}}(${latexX.toFixed(1)},${latexY.toFixed(1)})
${textContent}
\\end{textblock}`;
    }

    escapeLatex(text) {
        return text
            .replace(/\\/g, '\\textbackslash{}')
            .replace(/[&%$#_{}]/g, '\\$&')
            .replace(/~/g, '\\textasciitilde{}')
            .replace(/\^/g, '\\textasciicircum{}')
            .replace(/\n/g, ' \\\\ ');  // Convert line breaks to LaTeX line breaks (\\)
    }

    hexToRgb(hex) {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? {
            r: parseInt(result[1], 16),
            g: parseInt(result[2], 16),
            b: parseInt(result[3], 16)
        } : { r: 0, g: 0, b: 0 };
    }

    toJSON() {
        return {
            ...super.toJSON(),
            content: this.content,
            fontSize: this.fontSize,
            fontFamily: this.fontFamily,
            fontWeight: this.fontWeight,
            fontStyle: this.fontStyle,
            textAlign: this.textAlign,
            color: this.color,
            backgroundColor: this.backgroundColor,
            lineHeight: this.lineHeight
        };
    }

    getLayerIcon() {
        return `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <path d="M4 7V4h16v3M9 20h6M12 4v16"/>
    </svg>`;
    }
}
