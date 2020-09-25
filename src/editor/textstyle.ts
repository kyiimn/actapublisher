import { ActaFontManager } from './fontmgr';
import { ActaFont } from './font';

export enum TextAlign {
    JUSTIFY = 0, LEFT, RIGHT, CENTER
}

export class ActaTextStyle {
    private _font: ActaFont | null;
    private _fontSize: number | null;
    private _color: string | null;
    private _xscale: number | null;
    private _letterSpacing: number | null;
    private _lineHeight: number | null;
    private _textAlign: TextAlign | null;
    private _underline: boolean | null;
    private _strikeline: boolean | null;
    private _indent: number | null;

    constructor(inherit: boolean = false) {
        this._font = null;
        this._fontSize = inherit ? null : 10;
        this._xscale = inherit ? null : 1;
        this._letterSpacing = inherit ? null : 0;
        this._lineHeight = inherit ? null : 1.2;
        this._textAlign = inherit ? null : TextAlign.JUSTIFY;
        this._underline = inherit ? null : false;
        this._strikeline = inherit ? null : false;
        this._indent = inherit ? null : 0;
        this._color = inherit ? null : '#000000';
    }

    set fontName(fontName: string) {
        const fontmgr = ActaFontManager.getInstance();
        const font = fontmgr.get(fontName);
        if (!font) return;
        this._font = font;
    }
    set font(font: ActaFont | null) { this._font = font; }
    set fontSize(size: number | null) { this._fontSize = size; }
    set xscale(scale: number | null) { this._xscale = scale; }
    set letterSpacing(linespacing: number | null) { this._letterSpacing = linespacing; }
    set lineHeight(lineheight: number | null) { this._lineHeight = lineheight; }
    set textAlign(align: TextAlign | null) { this._textAlign = align; }
    set underline(underline: boolean | null) { this._underline = underline; }
    set strikeline(strikeline: boolean | null) { this._strikeline = strikeline; }
    set indent(indent: number | null) { this._indent = indent; }
    set color(color: string | null) { this._color = color; }

    get font() { return this._font; }
    get fontSize() { return this._fontSize; }
    get xscale() { return this._xscale; }
    get letterSpacing() { return this._letterSpacing; }
    get lineHeight() { return this._lineHeight; }
    get textAlign() { return this._textAlign; }
    get underline() { return this._underline; }
    get strikeline() { return this._strikeline; }
    get indent() { return this._indent; }
    get color() { return this._color; }
};

// tslint:disable-next-line: max-classes-per-file
export class ActaTextStyleInherit extends ActaTextStyle {
    constructor() {
        super(true);
    }
};