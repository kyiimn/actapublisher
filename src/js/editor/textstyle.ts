import { ActaFontManager } from './fontmgr';
import { ActaFont } from './font';
import { Subject } from 'rxjs';
import { distinctUntilChanged } from 'rxjs/operators';

export enum TextAlign {
    JUSTIFY = 0, LEFT, RIGHT, CENTER
}

class ActaTextStylePrivate {
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

    private _change$: Subject<string>;

    constructor() {
        this._font = null;
        this._fontSize = null;
        this._xscale = null;
        this._letterSpacing = null;
        this._lineHeight = null;
        this._textAlign = null;
        this._underline = null;
        this._strikeline = null;
        this._indent = null;
        this._color = null;

        this._change$ = new Subject<string>();
    }

    protected merge(textStyle: ActaTextStylePrivate) {
        let changed = false;

        if (textStyle.font !== null) { this.font = textStyle.font; changed = true; }
        if (textStyle.fontSize !== null) { this.fontSize = textStyle.fontSize; changed = true; }
        if (textStyle.xscale !== null) { this.xscale = textStyle.xscale; changed = true; }
        if (textStyle.letterSpacing !== null) { this.letterSpacing = textStyle.letterSpacing; changed = true; }
        if (textStyle.lineHeight !== null) { this.lineHeight = textStyle.lineHeight; changed = true; }
        if (textStyle.textAlign !== null) { this.textAlign = textStyle.textAlign; changed = true; }
        if (textStyle.underline !== null) { this.underline = textStyle.underline; changed = true; }
        if (textStyle.strikeline !== null) { this.strikeline = textStyle.strikeline; changed = true; }
        if (textStyle.indent !== null) { this.indent = textStyle.indent; changed = true; }
        if (textStyle.color !== null) { this.color = textStyle.color; changed = true; }

        if (changed) this.emitChange();
    }

    protected emitChange(styleName: string = '') {
        this._change$.next(styleName);
    }

    copy(textStyle: ActaTextStylePrivate) {
        this._font = textStyle.font;
        this._fontSize = textStyle.fontSize;
        this._xscale = textStyle.xscale;
        this._letterSpacing = textStyle.letterSpacing;
        this._lineHeight = textStyle.lineHeight;
        this._textAlign = textStyle.textAlign;
        this._underline = textStyle.underline;
        this._strikeline = textStyle.strikeline;
        this._indent = textStyle.indent;
        this._color = textStyle.color;

        this.emitChange();
    }

    toString() {
        let returnValue = '';
        if (this.font !== null) returnValue += `font-name="${this.font.fullname}" `;
        if (this.fontSize !== null) returnValue += `font-size="${this.fontSize}" `;
        if (this.xscale !== null) returnValue += `xscale="${this.xscale}" `;
        if (this.letterSpacing !== null) returnValue += `letter-spacing="${this.letterSpacing}" `;
        if (this.lineHeight !== null) returnValue += `font-size="${this.lineHeight}" `;
        if (this.indent !== null) returnValue += `indent="${this.indent}" `;
        if (this.color !== null) returnValue += `color="${this.color}" `;
        if (this.underline !== null) returnValue += `underline="${this.underline ? 'yes' : 'no'}" `;
        if (this.strikeline !== null) returnValue += `strikeline="${this.strikeline ? 'yes' : 'no'}" `;
        if (this.textAlign !== null) {
            switch (this.textAlign) {
                case TextAlign.CENTER: returnValue += `text-align="center" `; break;
                case TextAlign.LEFT: returnValue += `text-align="left" `; break;
                case TextAlign.RIGHT: returnValue += `text-align="right" `; break;
                default: returnValue += `text-align="justify" `; break;
            }
        }
        return returnValue.trim();
    }

    subscribe(observer: any) {
        return this._change$.pipe(distinctUntilChanged()).subscribe(observer);
    }

    set fontName(fontName: string) {
        const fontmgr = ActaFontManager.getInstance();
        const font = fontmgr.get(fontName);
        if (!font) return;
        if (this._font !== font) {
            this._font = font;
            this.emitChange('font');
        }
    }
    set font(font: ActaFont | null) {
        if (this._font !== font) {
            this._font = font;
            this.emitChange('font');
        }
    }

    set fontSize(size: number | null) {
        if (this._fontSize !== size) {
            this._fontSize = size;
            this.emitChange('fontSize');
        }
    }
    set xscale(scale: number | null) {
        if (this._xscale !== scale) {
            this._xscale = scale;
            this.emitChange('xscale');
        }
    }
    set letterSpacing(linespacing: number | null) {
        if (this._letterSpacing !== linespacing) {
            this._letterSpacing = linespacing;
            this.emitChange('letterSpacing');
        }
    }
    set lineHeight(lineheight: number | null) {
        if (this._lineHeight !== lineheight) {
            this._lineHeight = lineheight;
            this.emitChange('lineHeight');
        }
    }
    set textAlign(align: TextAlign | null) {
        if (this._textAlign !== align) {
            this._textAlign = align;
            this.emitChange('textAlign');
        }
    }
    set underline(underline: boolean | null) {
        if (this._underline !== underline) {
            this._underline = underline;
            this.emitChange('underline');
        }
    }
    set strikeline(strikeline: boolean | null) {
        if (this._strikeline !== strikeline) {
            this._strikeline = strikeline;
            this.emitChange('strikeline');
        }
    }
    set indent(indent: number | null) {
        if (this._indent !== indent) {
            this._indent = indent;
            this.emitChange('indent');
        }
    }
    set color(color: string | null) {
        if (this._color !== color) {
            this._color = color;
            this.emitChange('color');
        }
    }

    get textHeight() {
        if (this.font === null || this.fontSize === null) return 0;

        const font = this.font.font, size = this.fontSize;
        const unitsPerSize = font.unitsPerEm / size;

        return (font.tables.os2.usWinAscent + font.tables.os2.usWinDescent) / unitsPerSize;
    }

    get font() { return this._font; }
    get fontName() { return this._font ? this._font.fullname : ''; }
    get fontSize() { return this._fontSize; }
    get xscale() { return this._xscale; }
    get letterSpacing() { return this._letterSpacing; }
    get lineHeight() { return this._lineHeight; }
    get textAlign() { return this._textAlign; }
    get underline() { return this._underline; }
    get strikeline() { return this._strikeline; }
    get indent() { return this._indent; }
    get color() { return this._color; }
}

// tslint:disable-next-line: max-classes-per-file
export class ActaTextStyle extends ActaTextStylePrivate {
    private _name?: string;

    constructor(fontName: string) {
        super();

        this.fontName = fontName;
        this.fontSize = 10;
        this.xscale = 1;
        this.letterSpacing = 0;
        this.lineHeight = 1.2;
        this.textAlign = TextAlign.JUSTIFY;
        this.underline = false;
        this.strikeline = false;
        this.indent = 0;
        this.color = '#000000';
    }

    merge(textStyle: ActaTextStyle | ActaTextStyleInherit) {
        super.merge(textStyle);
    }

    copy(textStyle: ActaTextStyle) {
        super.copy(textStyle);
    }

    set name(name: string) { this._name = name; }
    set font(font: ActaFont) { super.font = font; }
    set fontName(fontName: string) { super.fontName = fontName; }
    set fontSize(size: number) { super.fontSize = size; }
    set xscale(scale: number) { super.xscale = scale; }
    set letterSpacing(linespacing: number) { super.letterSpacing = linespacing; }
    set lineHeight(lineheight: number) { super.lineHeight = lineheight; }
    set textAlign(align: TextAlign) { super.textAlign = align; }
    set underline(underline: boolean) { super.underline = underline; }
    set strikeline(strikeline: boolean) { super.strikeline = strikeline; }
    set indent(indent: number) { super.indent = indent; }
    set color(color: string) { super.color = color; }

    get name() { return this._name || ''; }
    get font() { return super.font as ActaFont; }
    get fontName() { return super.fontName; }
    get fontSize() { return super.fontSize as number; }
    get xscale() { return super.xscale as number; }
    get letterSpacing() { return super.letterSpacing as number; }
    get lineHeight() { return super.lineHeight as number; }
    get textAlign() { return super.textAlign as TextAlign; }
    get underline() { return super.underline as boolean; }
    get strikeline() { return super.strikeline as boolean; }
    get indent() { return super.indent as number; }
    get color() { return super.color as string; }
};

// tslint:disable-next-line: max-classes-per-file
export class ActaTextStyleInherit extends ActaTextStylePrivate {
    merge(textStyle: ActaTextStyle | ActaTextStyleInherit) {
        super.merge(textStyle);
    }

    copy(textStyle: ActaTextStyle | ActaTextStyleInherit) {
        super.copy(textStyle);
    }
};