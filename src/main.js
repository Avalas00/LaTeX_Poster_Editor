import { CanvasManager } from './canvas/CanvasManager.js';
import { PropertyPanel } from './panels/PropertyPanel.js';
import { LatexGenerator } from './latex/LatexGenerator.js';

/**
 * Main Application Entry Point
 */
class App {
  constructor() {
    this.canvasManager = null;
    this.propertyPanel = null;
    this.latexGenerator = null;
    this.isPanelCollapsed = false;

    this.init();
  }

  init() {
    // Wait for DOM
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => this.setup());
    } else {
      this.setup();
    }
  }

  setup() {
    // Initialize Canvas Manager
    const canvas = document.getElementById('canvas');
    this.canvasManager = new CanvasManager(canvas, {
      onSelectionChange: (element) => this.handleSelectionChange(element),
      onElementChange: (element) => this.handleElementChange(element),
      onLayersChange: (elements) => this.handleLayersChange(elements)
    });

    // Initialize Property Panel
    const propertiesPanel = document.getElementById('propertiesPanel');
    this.propertyPanel = new PropertyPanel(propertiesPanel, {
      onPropertyChange: (element) => this.handlePropertyChange(element)
    });

    // Initialize LaTeX Generator
    this.latexGenerator = new LatexGenerator({
      posterWidth: this.canvasManager.posterWidth,
      posterHeight: this.canvasManager.posterHeight
    });

    // Setup event listeners
    this.setupToolbar();
    this.setupZoomControls();
    this.setupPosterSettings();
    this.setupHeaderButtons();
    this.setupBottomPanel();

    // Initial zoom to fit
    setTimeout(() => {
      this.canvasManager.zoomToFit();
      this.updateZoomDisplay();
    }, 100);

    // Update LaTeX preview
    this.updateLatexPreview();
  }

  setupToolbar() {
    const toolItems = document.querySelectorAll('.tool-item');

    toolItems.forEach(item => {
      item.addEventListener('click', () => {
        const toolType = item.dataset.tool;
        this.canvasManager.addElement(toolType);
      });
    });
  }

  setupZoomControls() {
    const zoomIn = document.getElementById('zoomIn');
    const zoomOut = document.getElementById('zoomOut');
    const zoomFit = document.getElementById('zoomFit');

    if (zoomIn) {
      zoomIn.addEventListener('click', () => {
        this.canvasManager.zoomIn();
        this.updateZoomDisplay();
      });
    }

    if (zoomOut) {
      zoomOut.addEventListener('click', () => {
        this.canvasManager.zoomOut();
        this.updateZoomDisplay();
      });
    }

    if (zoomFit) {
      zoomFit.addEventListener('click', () => {
        this.canvasManager.zoomToFit();
        this.updateZoomDisplay();
      });
    }

    // Mouse wheel zoom
    const canvasWrapper = document.getElementById('canvasWrapper');
    if (canvasWrapper) {
      canvasWrapper.addEventListener('wheel', (e) => {
        if (e.ctrlKey) {
          e.preventDefault();
          if (e.deltaY < 0) {
            this.canvasManager.zoomIn();
          } else {
            this.canvasManager.zoomOut();
          }
          this.updateZoomDisplay();
        }
      }, { passive: false });
    }
  }

  updateZoomDisplay() {
    const zoomLevel = document.getElementById('zoomLevel');
    if (zoomLevel) {
      zoomLevel.textContent = `${Math.round(this.canvasManager.scale * 100)}%`;
    }
  }

  setupPosterSettings() {
    const posterSize = document.getElementById('posterSize');
    const customSizeGroup = document.getElementById('customSizeGroup');
    const posterWidth = document.getElementById('posterWidth');
    const posterHeight = document.getElementById('posterHeight');

    const sizes = {
      a0: { width: 841, height: 1189 },
      a1: { width: 594, height: 841 },
      a2: { width: 420, height: 594 }
    };

    if (posterSize) {
      posterSize.addEventListener('change', () => {
        const size = posterSize.value;

        if (size === 'custom') {
          customSizeGroup.style.display = 'block';
        } else {
          customSizeGroup.style.display = 'none';
          const { width, height } = sizes[size];
          this.updatePosterSize(width, height);
        }
      });
    }

    if (posterWidth && posterHeight) {
      const updateCustomSize = () => {
        const width = parseInt(posterWidth.value) || 841;
        const height = parseInt(posterHeight.value) || 1189;
        this.updatePosterSize(width, height);
      };

      posterWidth.addEventListener('change', updateCustomSize);
      posterHeight.addEventListener('change', updateCustomSize);
    }
  }

  updatePosterSize(width, height) {
    this.canvasManager.setPosterSize(width, height);
    this.latexGenerator.setPosterSize(width, height);
    this.canvasManager.zoomToFit();
    this.updateZoomDisplay();
    this.updateLatexPreview();
  }

  setupHeaderButtons() {
    const btnClearCanvas = document.getElementById('btnClearCanvas');
    const btnExportLatex = document.getElementById('btnExportLatex');

    if (btnClearCanvas) {
      btnClearCanvas.addEventListener('click', () => {
        if (confirm('確定要清除畫布上的所有元件嗎？')) {
          this.canvasManager.clearCanvas();
          this.updateLatexPreview();
        }
      });
    }

    if (btnExportLatex) {
      btnExportLatex.addEventListener('click', () => this.exportLatex());
    }
  }

  setupBottomPanel() {
    const btnTogglePanel = document.getElementById('btnTogglePanel');
    const btnCopyLatex = document.getElementById('btnCopyLatex');
    const bottomPanel = document.getElementById('bottomPanel');

    if (btnTogglePanel && bottomPanel) {
      btnTogglePanel.addEventListener('click', () => {
        this.isPanelCollapsed = !this.isPanelCollapsed;
        bottomPanel.classList.toggle('collapsed', this.isPanelCollapsed);
      });
    }

    if (btnCopyLatex) {
      btnCopyLatex.addEventListener('click', () => this.copyLatexToClipboard());
    }
  }

  handleSelectionChange(element) {
    this.propertyPanel.update(element);
  }

  handleElementChange(element) {
    this.updateLatexPreview();
  }

  handlePropertyChange(element) {
    if (element && element.domElement) {
      element.updateDom(this.canvasManager.scale);
    }
    this.updateLatexPreview();
  }

  handleLayersChange(elements) {
    const layerList = document.getElementById('layerList');
    if (!layerList) return;

    if (elements.length === 0) {
      layerList.innerHTML = '<div class="layer-empty">尚無元件</div>';
      return;
    }

    // Render layers in reverse order (top layer first in list)
    const reversedElements = [...elements].reverse();

    layerList.innerHTML = reversedElements.map((el, index) => `
      <div class="layer-item ${el.isSelected ? 'selected' : ''} ${el.locked ? 'locked' : ''}" 
           data-id="${el.id}" 
           data-index="${elements.length - 1 - index}"
           draggable="true">
        <span class="layer-drag-handle">⋮⋮</span>
        <span class="layer-icon">${el.getLayerIcon()}</span>
        <span class="layer-name">${el.name}</span>
        <button class="layer-lock-btn" data-id="${el.id}" title="${el.locked ? '解鎖' : '鎖定'}">
          ${el.locked
        ? '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>'
        : '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 019.9-1"/></svg>'
      }
        </button>
      </div>
    `).join('');

    // Add click and drag handlers
    const layerItems = layerList.querySelectorAll('.layer-item');

    layerItems.forEach(item => {
      // Click to select (but not on lock button or drag handle)
      item.addEventListener('click', (e) => {
        if (e.target.classList.contains('layer-drag-handle')) return;
        if (e.target.closest('.layer-lock-btn')) return;
        const element = this.canvasManager.elements.find(el => el.id === item.dataset.id);
        if (element) {
          this.canvasManager.selectElement(element);
        }
      });

      // Lock button click
      const lockBtn = item.querySelector('.layer-lock-btn');
      if (lockBtn) {
        lockBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          const element = this.canvasManager.elements.find(el => el.id === lockBtn.dataset.id);
          if (element) {
            element.locked = !element.locked;
            this.handleLayersChange(this.canvasManager.elements);
            this.propertyPanel.update(element);
          }
        });
      }

      // Drag start
      item.addEventListener('dragstart', (e) => {
        item.classList.add('dragging');
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', item.dataset.id);
      });

      // Drag end
      item.addEventListener('dragend', () => {
        item.classList.remove('dragging');
        layerList.querySelectorAll('.layer-item').forEach(li => {
          li.classList.remove('drag-over');
        });
      });

      // Drag over
      item.addEventListener('dragover', (e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        const dragging = layerList.querySelector('.dragging');
        if (dragging && dragging !== item) {
          item.classList.add('drag-over');
        }
      });

      // Drag leave
      item.addEventListener('dragleave', () => {
        item.classList.remove('drag-over');
      });

      // Drop
      item.addEventListener('drop', (e) => {
        e.preventDefault();
        item.classList.remove('drag-over');

        const draggedId = e.dataTransfer.getData('text/plain');
        const targetId = item.dataset.id;

        if (draggedId !== targetId) {
          this.reorderLayers(draggedId, targetId);
        }
      });
    });
  }

  reorderLayers(draggedId, targetId) {
    const elements = this.canvasManager.elements;

    // Find indices
    const draggedIndex = elements.findIndex(el => el.id === draggedId);
    const targetIndex = elements.findIndex(el => el.id === targetId);

    if (draggedIndex === -1 || targetIndex === -1) return;

    // Remove dragged element
    const [draggedElement] = elements.splice(draggedIndex, 1);

    // Insert at new position
    elements.splice(targetIndex, 0, draggedElement);

    // Update z-indices and re-render
    this.canvasManager.updateZIndices();
    this.handleLayersChange(elements);
    this.updateLatexPreview();
  }

  updateLatexPreview() {
    const latexOutput = document.getElementById('latexOutput');
    if (latexOutput) {
      const latex = this.latexGenerator.generate(this.canvasManager.getElements());
      latexOutput.innerHTML = `<code>${this.escapeHtml(latex)}</code>`;
    }
  }

  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  async copyLatexToClipboard() {
    const latex = this.latexGenerator.generate(this.canvasManager.getElements());

    try {
      await navigator.clipboard.writeText(latex);
      this.showToast('LaTeX 代碼已複製到剪貼簿！', 'success');
    } catch (err) {
      // Fallback for older browsers
      const textarea = document.createElement('textarea');
      textarea.value = latex;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      this.showToast('LaTeX 代碼已複製到剪貼簿！', 'success');
    }
  }

  exportLatex() {
    const latex = this.latexGenerator.generate(this.canvasManager.getElements());
    const documentName = document.querySelector('.document-name')?.textContent || 'poster';
    // Sanitize filename - replace non-alphanumeric characters with underscores
    const sanitizedName = documentName.replace(/[^a-zA-Z0-9\u4e00-\u9fa5]/g, '_').replace(/_+/g, '_');
    const fileName = `${sanitizedName || 'poster'}.tex`;

    // Create blob with proper MIME type
    const blob = new Blob([latex], { type: 'application/x-tex;charset=utf-8' });

    // Use a more reliable download method
    const link = document.createElement('a');
    link.style.display = 'none';
    link.href = URL.createObjectURL(blob);
    link.download = fileName;

    // Append to body, click, then remove
    document.body.appendChild(link);
    link.click();

    // Cleanup after a short delay
    setTimeout(() => {
      document.body.removeChild(link);
      URL.revokeObjectURL(link.href);
    }, 100);

    this.showToast(`已匯出 ${fileName}`, 'success');
  }

  showToast(message, type = 'info') {
    // Create toast container if not exists
    let container = document.querySelector('.toast-container');
    if (!container) {
      container = document.createElement('div');
      container.className = 'toast-container';
      document.body.appendChild(container);
    }

    // Create toast
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        ${type === 'success'
        ? '<path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>'
        : type === 'error'
          ? '<circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/>'
          : '<circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>'
      }
      </svg>
      <span>${message}</span>
    `;

    container.appendChild(toast);

    // Remove after 3 seconds
    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateX(100px)';
      setTimeout(() => toast.remove(), 300);
    }, 3000);
  }
}

// Start the application
new App();
