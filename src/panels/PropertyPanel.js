/**
 * PropertyPanel - Manages the properties panel for selected elements
 */
export class PropertyPanel {
  constructor(containerElement, options = {}) {
    this.container = containerElement;
    this.currentElement = null;
    this.onPropertyChange = options.onPropertyChange || (() => { });
  }

  /**
   * Update panel to show properties of selected element
   * @param {BaseElement} element
   */
  update(element) {
    this.currentElement = element;

    if (!element) {
      this.showEmpty();
      return;
    }

    switch (element.type) {
      case 'text':
        this.showTextProperties(element);
        break;
      case 'rect':
        this.showRectProperties(element);
        break;
      case 'image':
        this.showImageProperties(element);
        break;
      case 'line':
        this.showLineProperties(element);
        break;
      default:
        this.showEmpty();
    }
  }

  showEmpty() {
    this.container.innerHTML = `
      <h3 class="sidebar-title">屬性</h3>
      <div class="properties-empty">
        <p>選取元件以編輯屬性</p>
      </div>
    `;

    // Hide position panel
    const posPanel = document.getElementById('positionInfo');
    if (posPanel) posPanel.style.display = 'none';
  }

  showTextProperties(element) {
    this.container.innerHTML = `
      <h3 class="sidebar-title">文字屬性</h3>
      
      <div class="property-group">
        <label>字型</label>
        <select id="propFontFamily" class="input-select">
          <option value="sans-serif" ${element.fontFamily === 'sans-serif' ? 'selected' : ''}>Sans-serif (預設)</option>
          <option value="Times New Roman" ${element.fontFamily === 'Times New Roman' ? 'selected' : ''}>Times New Roman</option>
          <option value="Georgia" ${element.fontFamily === 'Georgia' ? 'selected' : ''}>Georgia</option>
          <option value="Arial" ${element.fontFamily === 'Arial' ? 'selected' : ''}>Arial</option>
          <option value="Courier New" ${element.fontFamily === 'Courier New' ? 'selected' : ''}>Courier New (等寬)</option>
          <option value="serif" ${element.fontFamily === 'serif' ? 'selected' : ''}>Serif</option>
        </select>
      </div>

      <div class="property-group">
        <label>字型大小 (pt)</label>
        <input type="number" id="propFontSize" class="input-text" value="${element.fontSize}" min="6" max="200">
      </div>
      
      <div class="property-group">
        <label>字型粗細</label>
        <select id="propFontWeight" class="input-select">
          <option value="normal" ${element.fontWeight === 'normal' ? 'selected' : ''}>一般</option>
          <option value="bold" ${element.fontWeight === 'bold' ? 'selected' : ''}>粗體</option>
        </select>
      </div>
      
      <div class="property-group">
        <label>對齊方式</label>
        <div class="button-group">
          <button class="btn-toggle ${element.textAlign === 'left' ? 'active' : ''}" data-align="left" title="靠左">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="15" y2="12"/><line x1="3" y1="18" x2="18" y2="18"/>
            </svg>
          </button>
          <button class="btn-toggle ${element.textAlign === 'center' ? 'active' : ''}" data-align="center" title="置中">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="3" y1="6" x2="21" y2="6"/><line x1="6" y1="12" x2="18" y2="12"/><line x1="4" y1="18" x2="20" y2="18"/>
            </svg>
          </button>
          <button class="btn-toggle ${element.textAlign === 'right' ? 'active' : ''}" data-align="right" title="靠右">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="3" y1="6" x2="21" y2="6"/><line x1="9" y1="12" x2="21" y2="12"/><line x1="6" y1="18" x2="21" y2="18"/>
            </svg>
          </button>
        </div>
      </div>

      <div class="property-group">
        <label>旋轉角度</label>
        <div class="rotation-control">
          <div class="button-group">
            <button class="btn-toggle ${element.rotation === 0 ? 'active' : ''}" data-rotation="0" title="0°">0°</button>
            <button class="btn-toggle ${element.rotation === 45 ? 'active' : ''}" data-rotation="45" title="45°">45°</button>
            <button class="btn-toggle ${element.rotation === 90 ? 'active' : ''}" data-rotation="90" title="90°">90°</button>
            <button class="btn-toggle ${element.rotation === 135 ? 'active' : ''}" data-rotation="135" title="135°">135°</button>
          </div>
          <div class="button-group" style="margin-top: 4px;">
            <button class="btn-toggle ${element.rotation === 180 ? 'active' : ''}" data-rotation="180" title="180°">180°</button>
            <button class="btn-toggle ${element.rotation === 225 ? 'active' : ''}" data-rotation="225" title="225°">225°</button>
            <button class="btn-toggle ${element.rotation === 270 ? 'active' : ''}" data-rotation="270" title="270°">270°</button>
            <button class="btn-toggle ${element.rotation === 315 ? 'active' : ''}" data-rotation="315" title="315°">315°</button>
          </div>
        </div>
      </div>
      
      <div class="property-group">
        <label>文字顏色</label>
        <div class="color-picker-wrapper">
          <input type="color" id="propTextColor" class="color-picker" value="${element.color}">
          <span class="color-value">${element.color}</span>
        </div>
      </div>
      
      <div class="property-group">
        <label>背景顏色</label>
        <div class="color-picker-wrapper">
          <input type="color" id="propBgColor" class="color-picker" value="${element.backgroundColor === 'transparent' ? '#ffffff' : element.backgroundColor}">
          <label style="display: flex; align-items: center; gap: 4px; margin: 0;">
            <input type="checkbox" id="propBgTransparent" ${element.backgroundColor === 'transparent' ? 'checked' : ''}>
            透明
          </label>
        </div>
      </div>
    `;

    this.showPositionPanel(element);
    this.setupTextListeners(element);
  }

  showRectProperties(element) {
    this.container.innerHTML = `
      <h3 class="sidebar-title">矩形屬性</h3>
      
      <div class="property-group">
        <label>填充顏色</label>
        <div class="color-picker-wrapper">
          <input type="color" id="propFillColor" class="color-picker" value="${this.rgbaToHex(element.fillColor)}">
          <span class="color-value">${this.rgbaToHex(element.fillColor)}</span>
        </div>
      </div>
      
      <div class="property-group">
        <label>填充透明度</label>
        <input type="range" id="propFillOpacity" class="input-range" min="0" max="100" value="${this.getOpacity(element.fillColor) * 100}">
      </div>
      
      <div class="property-group">
        <label>邊框顏色</label>
        <div class="color-picker-wrapper">
          <input type="color" id="propStrokeColor" class="color-picker" value="${element.strokeColor}">
          <span class="color-value">${element.strokeColor}</span>
        </div>
      </div>
      
      <div class="property-group">
        <label>邊框寬度 (pt)</label>
        <input type="number" id="propStrokeWidth" class="input-text" value="${element.strokeWidth}" min="0" max="20">
      </div>
      
      <div class="property-group">
        <label>圓角 (mm)</label>
        <input type="number" id="propBorderRadius" class="input-text" value="${element.borderRadius}" min="0" max="50">
      </div>
    `;

    this.showPositionPanel(element);
    this.setupRectListeners(element);
  }

  showImageProperties(element) {
    this.container.innerHTML = `
      <h3 class="sidebar-title">圖片屬性</h3>
      
      <div class="property-group">
        <label>檔案名稱</label>
        <input type="text" id="propFileName" class="input-text" value="${element.fileName}" placeholder="image.png">
      </div>
      
      <div class="property-group">
        <button class="btn btn-secondary" id="btnUploadImage" style="width: 100%;">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12"/>
          </svg>
          上傳圖片
        </button>
      </div>
      
      <div class="property-group">
        <label>填滿方式</label>
        <select id="propObjectFit" class="input-select">
          <option value="cover" ${element.objectFit === 'cover' ? 'selected' : ''}>填滿 (Cover)</option>
          <option value="contain" ${element.objectFit === 'contain' ? 'selected' : ''}>包含 (Contain)</option>
          <option value="fill" ${element.objectFit === 'fill' ? 'selected' : ''}>拉伸 (Fill)</option>
        </select>
      </div>
      
      <div class="property-group">
        <label>圓角 (mm)</label>
        <input type="number" id="propBorderRadius" class="input-text" value="${element.borderRadius}" min="0" max="50">
      </div>
    `;

    this.showPositionPanel(element);
    this.setupImageListeners(element);
  }

  showLineProperties(element) {
    this.container.innerHTML = `
      <h3 class="sidebar-title">線條屬性</h3>
      
      <div class="property-group">
        <label>線條顏色</label>
        <div class="color-picker-wrapper">
          <input type="color" id="propStrokeColor" class="color-picker" value="${element.strokeColor}">
          <span class="color-value">${element.strokeColor}</span>
        </div>
      </div>
      
      <div class="property-group">
        <label>線條寬度 (pt)</label>
        <input type="number" id="propStrokeWidth" class="input-text" value="${element.strokeWidth}" min="1" max="20">
      </div>
      
      <div class="property-group">
        <label>線條樣式</label>
        <select id="propLineStyle" class="input-select">
          <option value="solid" ${element.lineStyle === 'solid' ? 'selected' : ''}>實線</option>
          <option value="dashed" ${element.lineStyle === 'dashed' ? 'selected' : ''}>虛線</option>
          <option value="dotted" ${element.lineStyle === 'dotted' ? 'selected' : ''}>點線</option>
        </select>
      </div>
    `;

    this.showPositionPanel(element);
    this.setupLineListeners(element);
  }

  showPositionPanel(element) {
    const posPanel = document.getElementById('positionInfo');
    if (!posPanel) return;

    posPanel.style.display = 'block';

    document.getElementById('propX').value = Math.round(element.x);
    document.getElementById('propY').value = Math.round(element.y);
    document.getElementById('propWidth').value = Math.round(element.width);
    document.getElementById('propHeight').value = Math.round(element.height);

    this.setupPositionListeners(element);
  }

  setupPositionListeners(element) {
    const propX = document.getElementById('propX');
    const propY = document.getElementById('propY');
    const propWidth = document.getElementById('propWidth');
    const propHeight = document.getElementById('propHeight');

    // For line elements, we need to update x1,y1,x2,y2 based on x,y,width,height changes
    const isLine = element.type === 'line';

    if (propX) {
      propX.onchange = () => {
        const newX = parseFloat(propX.value) || 0;
        if (isLine) {
          const deltaX = newX - element.x;
          element.x1 += deltaX;
          element.x2 += deltaX;
          if (element.updateBounds) element.updateBounds();
        } else {
          element.x = newX;
        }
        this.onPropertyChange(element);
      };
    }

    if (propY) {
      propY.onchange = () => {
        const newY = parseFloat(propY.value) || 0;
        if (isLine) {
          const deltaY = newY - element.y;
          element.y1 += deltaY;
          element.y2 += deltaY;
          if (element.updateBounds) element.updateBounds();
        } else {
          element.y = newY;
        }
        this.onPropertyChange(element);
      };
    }

    if (propWidth) {
      propWidth.onchange = () => {
        const newWidth = parseFloat(propWidth.value) || 10;
        if (isLine) {
          // Scale the line endpoint x2 based on new width
          const ratio = newWidth / element.width;
          const centerX = (element.x1 + element.x2) / 2;
          element.x1 = centerX - (centerX - element.x1) * ratio;
          element.x2 = centerX + (element.x2 - centerX) * ratio;
          if (element.updateBounds) element.updateBounds();
        } else {
          element.width = newWidth;
        }
        this.onPropertyChange(element);
      };
    }

    if (propHeight) {
      propHeight.onchange = () => {
        const newHeight = parseFloat(propHeight.value) || 10;
        if (isLine) {
          // Scale the line endpoint y2 based on new height
          const ratio = newHeight / element.height;
          const centerY = (element.y1 + element.y2) / 2;
          element.y1 = centerY - (centerY - element.y1) * ratio;
          element.y2 = centerY + (element.y2 - centerY) * ratio;
          if (element.updateBounds) element.updateBounds();
        } else {
          element.height = newHeight;
        }
        this.onPropertyChange(element);
      };
    }
  }

  setupTextListeners(element) {
    const fontFamily = document.getElementById('propFontFamily');
    const fontSize = document.getElementById('propFontSize');
    const fontWeight = document.getElementById('propFontWeight');
    const textColor = document.getElementById('propTextColor');
    const bgColor = document.getElementById('propBgColor');
    const bgTransparent = document.getElementById('propBgTransparent');

    if (fontFamily) {
      fontFamily.onchange = () => {
        element.fontFamily = fontFamily.value;
        this.onPropertyChange(element);
      };
    }

    if (fontSize) {
      fontSize.onchange = () => {
        element.fontSize = parseInt(fontSize.value) || 14;
        this.onPropertyChange(element);
      };
    }

    if (fontWeight) {
      fontWeight.onchange = () => {
        element.fontWeight = fontWeight.value;
        this.onPropertyChange(element);
      };
    }

    // Alignment buttons
    document.querySelectorAll('[data-align]').forEach(btn => {
      btn.onclick = () => {
        element.textAlign = btn.dataset.align;
        document.querySelectorAll('[data-align]').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.onPropertyChange(element);
      };
    });

    // Rotation buttons
    document.querySelectorAll('[data-rotation]').forEach(btn => {
      btn.onclick = () => {
        element.rotation = parseInt(btn.dataset.rotation) || 0;
        document.querySelectorAll('[data-rotation]').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.onPropertyChange(element);
      };
    });

    if (textColor) {
      textColor.oninput = () => {
        element.color = textColor.value;
        textColor.nextElementSibling.textContent = textColor.value;
        this.onPropertyChange(element);
      };
    }

    if (bgColor && bgTransparent) {
      bgColor.oninput = () => {
        if (!bgTransparent.checked) {
          element.backgroundColor = bgColor.value;
          this.onPropertyChange(element);
        }
      };

      bgTransparent.onchange = () => {
        element.backgroundColor = bgTransparent.checked ? 'transparent' : bgColor.value;
        this.onPropertyChange(element);
      };
    }
  }

  setupRectListeners(element) {
    const fillColor = document.getElementById('propFillColor');
    const fillOpacity = document.getElementById('propFillOpacity');
    const strokeColor = document.getElementById('propStrokeColor');
    const strokeWidth = document.getElementById('propStrokeWidth');
    const borderRadius = document.getElementById('propBorderRadius');

    if (fillColor) {
      fillColor.oninput = () => {
        const opacity = fillOpacity ? fillOpacity.value / 100 : 1;
        element.fillColor = this.hexToRgba(fillColor.value, opacity);
        fillColor.nextElementSibling.textContent = fillColor.value;
        this.onPropertyChange(element);
      };
    }

    if (fillOpacity) {
      fillOpacity.oninput = () => {
        const hex = fillColor ? fillColor.value : '#7c3aed';
        element.fillColor = this.hexToRgba(hex, fillOpacity.value / 100);
        this.onPropertyChange(element);
      };
    }

    if (strokeColor) {
      strokeColor.oninput = () => {
        element.strokeColor = strokeColor.value;
        strokeColor.nextElementSibling.textContent = strokeColor.value;
        this.onPropertyChange(element);
      };
    }

    if (strokeWidth) {
      strokeWidth.onchange = () => {
        element.strokeWidth = parseInt(strokeWidth.value) || 0;
        this.onPropertyChange(element);
      };
    }

    if (borderRadius) {
      borderRadius.onchange = () => {
        element.borderRadius = parseInt(borderRadius.value) || 0;
        this.onPropertyChange(element);
      };
    }
  }

  setupImageListeners(element) {
    const fileName = document.getElementById('propFileName');
    const uploadBtn = document.getElementById('btnUploadImage');
    const objectFit = document.getElementById('propObjectFit');
    const borderRadius = document.getElementById('propBorderRadius');

    if (fileName) {
      fileName.onchange = () => {
        element.fileName = fileName.value;
        this.onPropertyChange(element);
      };
    }

    if (uploadBtn) {
      uploadBtn.onclick = () => element.promptImageUpload();
    }

    if (objectFit) {
      objectFit.onchange = () => {
        element.objectFit = objectFit.value;
        if (element.domElement) {
          const img = element.domElement.querySelector('img');
          if (img) img.style.objectFit = objectFit.value;
        }
        this.onPropertyChange(element);
      };
    }

    if (borderRadius) {
      borderRadius.onchange = () => {
        element.borderRadius = parseInt(borderRadius.value) || 0;
        this.onPropertyChange(element);
      };
    }
  }

  setupLineListeners(element) {
    const strokeColor = document.getElementById('propStrokeColor');
    const strokeWidth = document.getElementById('propStrokeWidth');
    const lineStyle = document.getElementById('propLineStyle');

    if (strokeColor) {
      strokeColor.oninput = () => {
        element.strokeColor = strokeColor.value;
        strokeColor.nextElementSibling.textContent = strokeColor.value;
        this.onPropertyChange(element);
      };
    }

    if (strokeWidth) {
      strokeWidth.onchange = () => {
        element.strokeWidth = parseInt(strokeWidth.value) || 1;
        this.onPropertyChange(element);
      };
    }

    if (lineStyle) {
      lineStyle.onchange = () => {
        element.lineStyle = lineStyle.value;
        this.onPropertyChange(element);
      };
    }
  }

  // Helper functions
  rgbaToHex(rgba) {
    if (!rgba || rgba === 'transparent') return '#ffffff';

    const match = rgba.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
    if (match) {
      const r = parseInt(match[1]).toString(16).padStart(2, '0');
      const g = parseInt(match[2]).toString(16).padStart(2, '0');
      const b = parseInt(match[3]).toString(16).padStart(2, '0');
      return `#${r}${g}${b}`;
    }

    return rgba.startsWith('#') ? rgba : '#ffffff';
  }

  hexToRgba(hex, alpha = 1) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    if (result) {
      return `rgba(${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}, ${alpha})`;
    }
    return hex;
  }

  getOpacity(rgba) {
    const match = rgba.match(/rgba?\([^)]+,\s*([\d.]+)\)/);
    return match ? parseFloat(match[1]) : 1;
  }
}
