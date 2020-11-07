import { ActaTextNode } from "./textnode";
import { ActaTextRow } from './textrow';

import { v4 as uuidv4 } from 'uuid';

export enum CharType {
    RETURN, SPACE, CHAR
};

export class ActaTextChar {
    private _id: string;

    private _char: string;
    private _type: CharType;
    private _invalidFont: boolean;

    private _modified: boolean;

    private _textNode: ActaTextNode;
    private _textRow?: ActaTextRow;

    private _SVGPath: SVGPathElement;
    private _drawOffsetX: number;
    private _drawOffsetY: number;
    private _width: number;
    private _calcWidth: number;
    private _marginWidth: number;

    private _drawable: boolean;

    private _oldOffsetX?: number;
    private _oldOffsetY?: number;
    private _oldMaxHeight?: number;
    private _oldLetterSpacing?: number;
    private _oldMarginWidth?: number;
    private _oldTransform?: string;

    private _textDecorations: SVGLineElement[];

    private _createSVGPath() {
        const textStyle = this.textNode.textStyle;
        if (this._type === CharType.SPACE) {
            const width = (textStyle.fontSize !== null) ? textStyle.fontSize / 3 : 0;
            if (this._width !== width) {
                this._width = width;
                this._modified = true;
            }
        } else if (this._type === CharType.CHAR) {
            const font = textStyle.font.font, size = textStyle.fontSize;
            const glyph = font.charToGlyph(this._char);
            const unitsPerSize = font.unitsPerEm / size;
            const yMin = font.tables.head.yMin / unitsPerSize;
            const height = this.height;
            const path = glyph.getPath(0, height, size);
            const pathData = path.toPathData(3);

            this._invalidFont = (glyph.unicode === undefined) ? true : false;

            this._SVGPath.setAttribute('d', pathData);
            this._SVGPath.setAttribute('data-char', this._char);

            if (this._drawOffsetX !== 0) {
                this._drawOffsetX = 0;
                this._modified = true;
            }
            if (this._drawOffsetY !== height + yMin) {
                this._drawOffsetY = height + yMin;
                this._modified = true;
            }
            if (this._width !== glyph.advanceWidth / unitsPerSize ) {
                this._width = glyph.advanceWidth / unitsPerSize;
                this._modified = true;
            }
        }
    }

    constructor(char: string, textNode: ActaTextNode) {
        this._id = uuidv4();
        this._modified = true;

        this._char = char;
        this._invalidFont = false;

        this._textNode = textNode;

        this._SVGPath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        this._textDecorations = [];

        this._drawOffsetX = 0;
        this._drawOffsetY = 0;
        this._width = 0;
        this._calcWidth = 0;
        this._marginWidth = 0;

        this._drawable = true;

        switch (char) {
            case '\n': this._type = CharType.RETURN; break;
            case ' ': this._type = CharType.SPACE; break;
            default: this._type = CharType.CHAR; break;
        }
        this._createSVGPath();

        this.initWidth();
    }

    changeTextStyle() {
        this._createSVGPath();
        this._oldLetterSpacing = undefined;

        this.initWidth();
    }

    update() {
        const textStyle = this.textNode.textStyle;
        if (!this.textRow || !this.modified) return;

        this._oldOffsetX = this.offsetLeft;
        this._oldMarginWidth = this.marginWidth;
        this._oldOffsetY = this.textRow.offsetTop;
        this._oldMaxHeight = this.textRow.maxHeight;
        this._oldLetterSpacing = textStyle.letterSpacing;

        for (const textDecoration of this._textDecorations) if (textDecoration) textDecoration.remove();
        this._textDecorations = [];

        let transform = 'translate(';
        transform += `${(this.drawOffsetX || 0) + ((textStyle.letterSpacing || 0) / 2) + this._oldOffsetX}px`;
        transform += ', ';
        transform += `${(this.drawOffsetY || 0) + this._oldOffsetY - this.textRow.maxHeight + ((this.textRow.maxHeight - (this.height || 0)) * 2)}px`;
        transform += ') ';
        transform += `scaleX(${textStyle.xscale || 1})`;

        this._SVGPath.setAttribute('data-id', this.id);
        this._SVGPath.setAttribute('data-textnode', this._textNode.id);
        this._SVGPath.setAttribute('data-index-of-node', this.indexOfNode.toString());
        this._SVGPath.setAttribute('data-width', this.calcWidth.toString());
        this._SVGPath.setAttribute('data-height', this.textRow.maxHeight.toString());
        this._SVGPath.setAttribute('data-leading', this.textRow.maxLeading.toString());

        this._SVGPath.setAttribute('data-x', this._oldOffsetX.toString());
        this._SVGPath.setAttribute('data-y', this._oldOffsetY.toString());

        if (this.indexOfColumn !== null) this._SVGPath.setAttribute('data-index-of-column', this.indexOfColumn.toString());
        if (this.indexOfLine !== null) this._SVGPath.setAttribute('data-index-of-line', this.indexOfLine.toString());

        if (this._oldTransform !== transform) {
            this._oldTransform = transform;
            this._SVGPath.style.transform = transform;
        }
        this._SVGPath.style.fill = this._invalidFont ? 'red' : (textStyle.color || '#000000');

        if (!this._SVGPath.parentElement || this._SVGPath.parentElement as any as SVGElement !== this.textRow.column.canvas) {
            this.textRow.column.canvas.appendChild(this._SVGPath);
        }

        if (textStyle.strikeline) {
            const strikeline = document.createElementNS('http://www.w3.org/2000/svg', 'line');
            strikeline.setAttribute('data-id', this.id);
            strikeline.setAttribute('data-textnode', this._textNode.id);
            strikeline.setAttribute('x1', (this.drawOffsetX + ((textStyle.letterSpacing || 0) / 2) + this._oldOffsetX).toString());
            strikeline.setAttribute('x2', (this.drawOffsetX + ((textStyle.letterSpacing || 0) / 2) + this._oldOffsetX + this.calcWidth).toString());
            strikeline.setAttribute('y1', (this.drawOffsetY + this._oldOffsetY - (this.textRow.maxHeight / 3)).toString());
            strikeline.setAttribute('y2', (this.drawOffsetY + this._oldOffsetY - (this.textRow.maxHeight / 3)).toString());
            strikeline.style.stroke = textStyle.color || '#000000';
            strikeline.style.strokeLinecap = 'butt';
            strikeline.style.strokeWidth = '1';

            this._textDecorations.push(strikeline);
            this.textRow.column.canvas.appendChild(strikeline);
        }
        if (textStyle.underline) {
            const underline = document.createElementNS('http://www.w3.org/2000/svg', 'line');
            underline.setAttribute('data-id', this.id);
            underline.setAttribute('data-textnode', this._textNode.id);
            underline.setAttribute('x1', (this.drawOffsetX + ((textStyle.letterSpacing || 0) / 2) + this._oldOffsetX).toString());
            underline.setAttribute('x2', (this.drawOffsetX + ((textStyle.letterSpacing || 0) / 2) + this._oldOffsetX + this.calcWidth).toString());
            underline.setAttribute('y1', (this.drawOffsetY + this._oldOffsetY).toString());
            underline.setAttribute('y2', (this.drawOffsetY + this._oldOffsetY).toString());
            underline.style.stroke = textStyle.color || '#000000';
            underline.style.strokeLinecap = 'butt';
            underline.style.strokeWidth = '1';

            this._textDecorations.push(underline);
            this.textRow.column.canvas.appendChild(underline);
        }
        this._modified = false;
    }

    remove() {
        if (this._SVGPath.parentElement) this._SVGPath.parentElement.removeChild(this._SVGPath);
        if (this.indexOfNode > -1) this.textNode.remove(this);
    }

    initWidth() {
        const textStyle = this.textStyle;
        const scaledWidth = textStyle.xscale * this.width;

        this._calcWidth = this.isDrawable ? (scaledWidth + (textStyle.letterSpacing || 0)) : 0;
        this._marginWidth = 0;
    }

    toString() { return this._char; }

    private get drawOffsetX() { return this._drawOffsetX; }
    private get drawOffsetY() { return this._drawOffsetY; }

    set textRow(textRow: ActaTextRow | null) {
        if (this._textRow === textRow) return;
        if (textRow) {
            if (this._textRow && this._textRow.column !== textRow.column) this._modified = true;
            this._textRow = textRow;
        } else {
            this._textRow = undefined;
            if (this._SVGPath.parentElement) {
                this._oldOffsetX = undefined;
                this._oldOffsetY = undefined;
                this._oldMaxHeight = undefined;
                this._SVGPath.parentElement.removeChild(this._SVGPath);
            }
            this._modified = true;
        }
        this.initWidth();
    }

    set char(char: string) {
        this._char = char;
        this._createSVGPath();
        this._modified = true;
    }

    set marginWidth(width: number) {
        this._marginWidth = width;
    }

    set drawable(val: boolean) {
        if (this._drawable === val) return;
        this._drawable = val;
        this._modified = true;
    }

    set modified(v) { this._modified = v; }

    get id() { return this._id; }
    get char() { return this._char; }
    get type() { return this._type; }
    get indexOfColumn() { return (this._textRow) ? this._textRow.indexOfColumn : -1; }
    get indexOfLine() { return (this._textRow) ? this._textRow.indexOfLine : -1; }
    get indexOfNode() { return this._textNode.value.indexOf(this); }
    get width() { return this._width; }
    get textNode() { return this._textNode; }
    get textRow() { return this._textRow || null; }
    get textStyle() { return this.textNode.textStyle; }
    get height() { return this.textStyle.textHeight; }
    get leading() { return this.textStyle.leading; }

    get x() { return this._oldOffsetX !== undefined ? this._oldOffsetX : -1; }
    get y() { return this._oldOffsetY !== undefined ? this._oldOffsetY : -1; }

    get isVisable() {
        return (this._textRow !== null) ? true : false;
    }

    get isInvalidFont() {
        return this._invalidFont;
    }

    get isDrawable() {
        const blinkCharType = [CharType.SPACE, CharType.RETURN];
        if (blinkCharType.indexOf(this.type) < 0) return true;
        if (!this.textRow) return false;

        const items = this.textRow.items;
        if (items.length < 1) return false;

        let check = false;
        for (let i = 0; i < items.indexOf(this); i++) {
            if (blinkCharType.indexOf(items[i].type) < 0) check = true;
        }
        if (!check) return false;

        for (let i = items.indexOf(this); i < items.length; i++) {
            if (blinkCharType.indexOf(items[i].type) < 0) return true;
        }
    }

    get marginWidth() {
        return this._marginWidth;
    }

    get calcWidth() {
        return this._calcWidth;
    }

    get offsetLeft() {
        if (this.textRow === null) return 0;

        let offsetX = this.textRow.indent + this.textRow.paddingLeft;
        for (const otherChar of this.textRow.items) {
            if (otherChar === this) break;
            offsetX += otherChar.calcWidth + otherChar.marginWidth;
        }
        return offsetX;
    }

    get modified() {
        if (!this.textRow) return false;
        if (this._modified) return true;
        if (this._oldOffsetX !== this.offsetLeft || this._oldOffsetY !== this.textRow.offsetTop) return true;
        if (this._oldMarginWidth !== this.marginWidth) return true;
        if (this._oldMaxHeight !== this.textRow.maxHeight) return true;
        if (this._oldLetterSpacing !== this.textStyle.letterSpacing) return true;

        return false;
    }

    get markupText() {
        let returnValue = '';
        switch (this._type) {
            case CharType.RETURN: returnValue = '<br>'; break;
            default: returnValue = this._char; break;
        }
        return returnValue;
    }
};