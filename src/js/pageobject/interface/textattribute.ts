import ActaFont from '../font/font';
import fontmgr from '../font/fontmgr';
import U from '../../util/units';

import { Subject } from 'rxjs';

export enum TextAlign {
    JUSTIFY = 0, LEFT, RIGHT, CENTER
}

export default class IActaTextAttribute {
    private _font: ActaFont | null;
    private _fontSize: number | null;
    private _colorId: number | null;
    private _xscale: number | null;
    private _letterSpacing: number | null;
    private _lineHeight: number | null;
    private _textAlign: TextAlign | null;
    private _underline: boolean | null;
    private _strikeline: boolean | null;
    private _indent: number | null;

    private _CHANGE$: Subject<string>;

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
        this._colorId = null;

        this._CHANGE$ = new Subject<string>();
    }

    protected merge(textAttr: IActaTextAttribute) {
        let changed = false;

        if (textAttr.font !== null) { this.font = textAttr.font; changed = true; }
        if (textAttr.fontSize !== null) { this.fontSize = textAttr.fontSize; changed = true; }
        if (textAttr.xscale !== null) { this.xscale = textAttr.xscale; changed = true; }
        if (textAttr.letterSpacing !== null) { this.letterSpacing = textAttr.letterSpacing; changed = true; }
        if (textAttr.lineHeight !== null) { this.lineHeight = textAttr.lineHeight; changed = true; }
        if (textAttr.textAlign !== null) { this.textAlign = textAttr.textAlign; changed = true; }
        if (textAttr.underline !== null) { this.underline = textAttr.underline; changed = true; }
        if (textAttr.strikeline !== null) { this.strikeline = textAttr.strikeline; changed = true; }
        if (textAttr.indent !== null) { this.indent = textAttr.indent; changed = true; }
        if (textAttr.colorId !== null) { this.colorId = textAttr.colorId; changed = true; }

        if (changed) this.emitChange('merge');
    }

    protected emitChange(attrName: string = '') {
        this._CHANGE$.next(attrName);
    }

    copy(textAttr: IActaTextAttribute) {
        this._font = textAttr.font;
        this._fontSize = textAttr.fontSize;
        this._xscale = textAttr.xscale;
        this._letterSpacing = textAttr.letterSpacing;
        this._lineHeight = textAttr.lineHeight;
        this._textAlign = textAttr.textAlign;
        this._underline = textAttr.underline;
        this._strikeline = textAttr.strikeline;
        this._indent = textAttr.indent;
        this._colorId = textAttr.colorId;

        this.emitChange('copy');
    }

    toString() {
        let returnValue = '';
        if (this.font !== null) returnValue += `font-name="${this.font.name}" `;
        if (this.fontSize !== null) returnValue += `font-size="${this.fontSize}" `;
        if (this.xscale !== null) returnValue += `xscale="${this.xscale}" `;
        if (this.letterSpacing !== null) returnValue += `letter-spacing="${this.letterSpacing}" `;
        if (this.lineHeight !== null) returnValue += `line-height="${this.lineHeight}" `;
        if (this.indent !== null) returnValue += `indent="${this.indent}" `;
        if (this.colorId !== null) returnValue += `color-id="${this.colorId}" `;
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

    subscribe(observable: any) {
        return this._CHANGE$.subscribe(observable);
    }

    set fontName(fontName: string) {
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
    set colorId(colorId: number | null) {
        if (this._colorId !== colorId) {
            this._colorId = colorId;
            this.emitChange('color');
        }
    }

    get textHeight() {
        if (this.font === null || this.fontSize === null) return 0;

        const font = this.font.font, size = U.px(this.fontSize);
        const unitsPerSize = font.unitsPerEm / size;

        return U.pt((font.tables.os2.usWinAscent + font.tables.os2.usWinDescent) / unitsPerSize, U.PX);
    }

    get font() { return this._font; }
    get fontName() { return this._font ? this._font.name : ''; }
    get fontSize() { return this._fontSize; }
    get xscale() { return this._xscale; }
    get letterSpacing() { return this._letterSpacing; }
    get lineHeight() { return this._lineHeight; }
    get leading() { return this.textHeight * ((this.lineHeight || 1) - 1); }
    get textAlign() { return this._textAlign; }
    get underline() { return this._underline; }
    get strikeline() { return this._strikeline; }
    get indent() { return this._indent; }
    get colorId() { return this._colorId; }
}