/**
 * Internationalization (i18n) - Language translations
 */
export const translations = {
    en: {
        // Header
        appTitle: 'LaTeX Poster Editor',
        untitledPoster: 'Untitled Poster',
        clearCanvas: 'Clear Canvas',
        exportLatex: 'Export LaTeX',

        // Toolbar
        elements: 'Elements',
        text: 'Text',
        rectangle: 'Rectangle',
        image: 'Image',
        line: 'Line',

        // Poster Settings
        posterSettings: 'Poster Settings',
        size: 'Size',

        // Layers
        layers: 'Layers',
        noLayers: 'No layers yet',
        lock: 'Lock',
        unlock: 'Unlock',

        // Properties Panel
        textProperties: 'Text Properties',
        rectProperties: 'Rectangle Properties',
        lineProperties: 'Line Properties',
        imageProperties: 'Image Properties',

        // Text Properties
        font: 'Font',
        fontSize: 'Font Size (pt)',
        fontWeight: 'Font Weight',
        normal: 'Normal',
        bold: 'Bold',
        alignment: 'Alignment',
        textColor: 'Text Color',
        backgroundColor: 'Background',
        lineHeight: 'Line Height',

        // Shape Properties
        fillColor: 'Fill Color',
        fillOpacity: 'Fill Opacity',
        borderColor: 'Border Color',
        borderWidth: 'Border Width (pt)',
        borderRadius: 'Border Radius (mm)',

        // Line Properties
        strokeColor: 'Stroke Color',
        strokeWidth: 'Stroke Width (pt)',
        lineStyle: 'Line Style',
        solid: 'Solid',
        dashed: 'Dashed',
        dotted: 'Dotted',

        // Position
        position: 'Position',
        positionSize: 'Position & Size',

        // LaTeX Code
        latexCode: 'LaTeX Code',
        copyCode: 'Copy Code',
        copied: 'Copied!',

        // Zoom
        zoomIn: 'Zoom In',
        zoomOut: 'Zoom Out',
        fitToScreen: 'Fit',

        // Element names
        textBox: 'Text Box',
        rect: 'Rectangle',
        lineElement: 'Line',
        imageElement: 'Image',

        // Tooltips
        selectElement: 'Select an element to edit properties',

        // Language
        language: 'Language'
    },
    zh: {
        // Header
        appTitle: 'LaTeX 海報編輯器',
        untitledPoster: '未命名海報',
        clearCanvas: '清除畫布',
        exportLatex: '匯出 LaTeX',

        // Toolbar
        elements: '元件',
        text: '文字',
        rectangle: '矩形',
        image: '圖片',
        line: '線條',

        // Poster Settings
        posterSettings: '海報設定',
        size: '尺寸',

        // Layers
        layers: '圖層',
        noLayers: '尚無圖層',
        lock: '鎖定',
        unlock: '解鎖',

        // Properties Panel
        textProperties: '文字屬性',
        rectProperties: '矩形屬性',
        lineProperties: '線條屬性',
        imageProperties: '圖片屬性',

        // Text Properties
        font: '字型',
        fontSize: '字型大小 (pt)',
        fontWeight: '字型粗細',
        normal: '一般',
        bold: '粗體',
        alignment: '對齊方式',
        textColor: '文字顏色',
        backgroundColor: '背景顏色',
        lineHeight: '行高',

        // Shape Properties
        fillColor: '填充顏色',
        fillOpacity: '填充透明度',
        borderColor: '邊框顏色',
        borderWidth: '邊框寬度 (pt)',
        borderRadius: '圓角半徑 (mm)',

        // Line Properties
        strokeColor: '線條顏色',
        strokeWidth: '線條寬度 (pt)',
        lineStyle: '線條樣式',
        solid: '實線',
        dashed: '虛線',
        dotted: '點線',

        // Position
        position: '位置',
        positionSize: '位置與尺寸',

        // LaTeX Code
        latexCode: 'LaTeX 代碼',
        copyCode: '複製代碼',
        copied: '已複製！',

        // Zoom
        zoomIn: '放大',
        zoomOut: '縮小',
        fitToScreen: '適合',

        // Element names
        textBox: '文字框',
        rect: '矩形',
        lineElement: '線條',
        imageElement: '圖片',

        // Tooltips
        selectElement: '選擇元素以編輯屬性',

        // Language
        language: '語言'
    }
};

/**
 * i18n Manager Class
 */
class I18nManager {
    constructor() {
        // Load saved language or default to Chinese
        this.currentLang = localStorage.getItem('posterEditorLang') || 'zh';
        this.listeners = [];
    }

    /**
     * Get translation for a key
     */
    t(key) {
        return translations[this.currentLang][key] || translations['en'][key] || key;
    }

    /**
     * Get current language
     */
    getLang() {
        return this.currentLang;
    }

    /**
     * Set language
     */
    setLang(lang) {
        if (translations[lang]) {
            this.currentLang = lang;
            localStorage.setItem('posterEditorLang', lang);
            this.notifyListeners();
        }
    }

    /**
     * Toggle between languages
     */
    toggle() {
        this.setLang(this.currentLang === 'zh' ? 'en' : 'zh');
    }

    /**
     * Add listener for language changes
     */
    onLangChange(callback) {
        this.listeners.push(callback);
    }

    /**
     * Notify all listeners of language change
     */
    notifyListeners() {
        this.listeners.forEach(cb => cb(this.currentLang));
    }
}

// Export singleton instance
export const i18n = new I18nManager();
