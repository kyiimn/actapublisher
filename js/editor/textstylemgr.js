class ActaTextStyleManager {
    static getInstance() {
        if (!ActaTextStyleManager._instance) ActaTextStyleManager._instance = new ActaTextStyleManager();
        return ActaTextStyleManager._instance;
    }
    constructor() { this._list = {}; }

    add(name, style) { this._list[name] = style; }
    remove(name) { delete this._list[name]; }
    get(name) { return this._list[name]; }

    get list() { return this._list; }
    get length() { return Object.keys(this.list).length; }
};

class ActaTextStyle {
    static TEXTALIGN_JUSTIFY = 0;
    static TEXTALIGN_LEFT = 1;
    static TEXTALIGN_RIGHT = 2;
    static TEXTALIGN_CENTER = 3;

    constructor(inherit) {
        this._font = undefined;
        this._fontSize = inherit ? undefined : 10;
        this._xscale = inherit ? undefined : 1;
        this._letterSpacing = inherit ? undefined : 0;
        this._lineHeight = inherit ? undefined : 1.2;
        this._textAlign = inherit ? undefined : this.TEXTALIGN_JUSTIFY;
        this._underline = inherit ? undefined : false;
        this._strikeline = inherit ? undefined : false;
        this._indent = inherit ? undefined : 0;
    }

    set font(font) {
        if (font instanceof ActaFont) {
            this._font = font;
        } else {
            let fontmgr = ActaFontManager.getInstance();
            this._font = fontmgr.get(font) || this._font;
        }
    }
    set fontSize(size) { this._fontSize = size; }
    set xscale(scale) { this._xscale = scale; }
    set letterSpacing(linespacing) { this._letterSpacing = linespacing; }
    set lineHeight(lineheight) { this._lineHeight = lineheight; }
    set textAlign(align) { this._textAlign = align; }
    set underline(underline) { this._underline = underline; }
    set strikeline(strikeline) { this._strikeline = strikeline; }
    set indent(indent) { this._indent = indent; }

    get font() { return this._font; }
    get fontSize() { return this._fontSize; }
    get xscale() { return this._xscale; }
    get letterSpacing() { return this._letterSpacing; }
    get lineHeight() { return this._lineHeight; }
    get textAlign() { return this._textAlign; }
    get underline() { return this._underline; }
    get strikeline() { return this._strikeline; }
    get indent() { return this._indent; }
};