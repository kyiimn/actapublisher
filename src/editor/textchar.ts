import { ActaTextNode } from "./textnode";
import { ActaTextStyle } from "./textstyle";
import { ActaTextRow } from './textrow';

import { v4 as uuidv4 } from 'uuid';

export enum TextCharType {
    NEWLINE, SPACE, CHAR
};

export class ActaTextChar {
    private _id: string;

    private _char: string;
    private _type: TextCharType;

    private _modified: boolean;

    private _textNode: ActaTextNode;
    private _textRow?: ActaTextRow;

    private _SVGPath: SVGPathElement;
    private _calcWidth: number;
    private _drawOffsetX: number;
    private _drawOffsetY: number;
    private _width: number;

    private _posX?: number;
    private _posY?: number;

    private _oldMaxHeight?: number;
    private _oldLetterSpacing?: number;

    private _textDecorations: SVGLineElement[];

    private _createSVGPath() {
        const textStyle = this.textNode.textStyle;
        if (this._type === TextCharType.SPACE) {
            const width = (textStyle.fontSize !== null) ? textStyle.fontSize / 3 : 0;
            if (this._width !== width) {
                this._width = width;
                this.modified = true;
            }
        } else if (this._type === TextCharType.CHAR) {
            const font = textStyle.font.font, size = textStyle.fontSize;
            const glyph = font.charToGlyph(this._char);
            const unitsPerSize = font.unitsPerEm / size;
            const yMin = font.tables.head.yMin / unitsPerSize;
            const height = this.height;
            const path = glyph.getPath(0, height, size);
            const pathData = path.toPathData(3);

            this._SVGPath.setAttribute('d', pathData);
            this._SVGPath.setAttribute('data-char', this._char);

            if (this._drawOffsetX !== 0) {
                this._drawOffsetX = 0;
                this.modified = true;
            }
            if (this._drawOffsetY !== height + yMin) {
                this._drawOffsetY = height + yMin;
                this.modified = true;
            }
            if (this._width !== glyph.advanceWidth / unitsPerSize ) {
                this._width = glyph.advanceWidth / unitsPerSize;
                this.modified = true;
            }
        }
        this.calcWidth = this.width;
    }

    constructor(char: string, textNode: ActaTextNode) {
        this._id = uuidv4();
        this._modified = true;

        this._char = char;

        this._textNode = textNode;

        this._SVGPath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        this._textDecorations = [];

        this._drawOffsetX = 0;
        this._drawOffsetY = 0;
        this._width = 0;
        this._calcWidth = 0;

        switch (char) {
            case '\n': this._type = TextCharType.NEWLINE; break;
            case ' ': this._type = TextCharType.SPACE; break;
            default: this._type = TextCharType.CHAR; break;
        }
        this._createSVGPath();
    }

    changeTextStyle() {
        this._createSVGPath();
        this._oldLetterSpacing = undefined;
    }

    update(x?: number, y?: number) {
        const textStyle = this.textNode.textStyle;

        if (!this.textRow) return;
        if (x !== undefined && y !== undefined) {
            if (this._posX !== x || this._posY !== y) this.modified = true;
            this._posX = x;
            this._posY = y;
        } else {
            if (this._posX === undefined || this._posY === undefined) return;
            x = this._posX;
            y = this._posY;
        }
        if (this._oldMaxHeight !== this.textRow.maxHeight) {
            this._oldMaxHeight = this.textRow.maxHeight;
            this.modified = true;
        }
        if (this._oldLetterSpacing !== textStyle.letterSpacing) {
            this._oldLetterSpacing = textStyle.letterSpacing;
            this.modified = true;
        }
        if (!this.modified) return;

        for (const textDecoration of this._textDecorations) if (textDecoration) textDecoration.remove();
        this._textDecorations = [];

        let transform = 'translate(';
        transform += `${(this.drawOffsetX || 0) + ((textStyle.letterSpacing || 0) / 2) + x}px`;
        transform += ', ';
        transform += `${(this.drawOffsetY || 0) + y - this.textRow.maxHeight + ((this.textRow.maxHeight - (this.height || 0)) * 2)}px`;
        transform += ') ';
        transform += `scaleX(${textStyle.xscale || 1})`;

        this._SVGPath.setAttribute('data-id', this.id);
        this._SVGPath.setAttribute('data-textnode', this._textNode.id);
        this._SVGPath.setAttribute('data-index-of-node', this.indexOfNode.toString());
        this._SVGPath.setAttribute('data-width', this.calcWidth.toString());
        this._SVGPath.setAttribute('data-height', this.textRow.maxHeight.toString());
        this._SVGPath.setAttribute('data-leading', this.textRow.maxLeading.toString());

        this._SVGPath.setAttribute('data-x', x.toString());
        this._SVGPath.setAttribute('data-y', y.toString());

        if (this.indexOfColumn !== null) this._SVGPath.setAttribute('data-index-of-column', this.indexOfColumn.toString());
        if (this.indexOfLine !== null) this._SVGPath.setAttribute('data-index-of-line', this.indexOfLine.toString());

        this._SVGPath.style.transform = transform;
        this._SVGPath.style.fill = textStyle.color || '#000000';

        if (!this._SVGPath.parentElement || this._SVGPath.parentElement as any as SVGElement !== this.textRow.column.svg) {
            this.textRow.column.svg.appendChild(this._SVGPath);
        }

        if (textStyle.strikeline) {
            const strikeline = document.createElementNS('http://www.w3.org/2000/svg', 'line');
            strikeline.setAttribute('data-id', this.id);
            strikeline.setAttribute('data-textnode', this._textNode.id);
            strikeline.setAttribute('x1', (this.drawOffsetX + ((textStyle.letterSpacing || 0) / 2) + x).toString());
            strikeline.setAttribute('x2', (this.drawOffsetX + ((textStyle.letterSpacing || 0) / 2) + x + this.calcWidth).toString());
            strikeline.setAttribute('y1', (this.drawOffsetY + y - (this.textRow.maxHeight / 3)).toString());
            strikeline.setAttribute('y2', (this.drawOffsetY + y - (this.textRow.maxHeight / 3)).toString());
            strikeline.style.stroke = textStyle.color || '#000000';
            strikeline.style.strokeLinecap = 'butt';
            strikeline.style.strokeWidth = '1';

            this._textDecorations.push(strikeline);
            this.textRow.column.svg.appendChild(strikeline);
        }
        if (textStyle.underline) {
            const underline = document.createElementNS('http://www.w3.org/2000/svg', 'line');
            underline.setAttribute('data-id', this.id);
            underline.setAttribute('data-textnode', this._textNode.id);
            underline.setAttribute('x1', (this.drawOffsetX + ((textStyle.letterSpacing || 0) / 2) + x).toString());
            underline.setAttribute('x2', (this.drawOffsetX + ((textStyle.letterSpacing || 0) / 2) + x + this.calcWidth).toString());
            underline.setAttribute('y1', (this.drawOffsetY + y).toString());
            underline.setAttribute('y2', (this.drawOffsetY + y).toString());
            underline.style.stroke = textStyle.color || '#000000';
            underline.style.strokeLinecap = 'butt';
            underline.style.strokeWidth = '1';

            this._textDecorations.push(underline);
            this.textRow.column.svg.appendChild(underline);
        }
        this.modified = false;
    }

    remove() {
        if (this._SVGPath.parentElement) this._SVGPath.parentElement.removeChild(this._SVGPath);
        if (this.indexOfNode > -1) this.textNode.remove(this);
    }

    toString() { return this._char; }

    private get drawOffsetX() { return this._drawOffsetX; }
    private get drawOffsetY() { return this._drawOffsetY; }

    private set modified(modify) {
        this._modified = modify;
    }

    private get modified() {
        return this._modified;
    }

    get markupText() {
        let returnValue = '';
        switch (this._type) {
            case TextCharType.NEWLINE: returnValue = '<br>'; break;
            default: returnValue = this._char; break;
        }
        return returnValue;
    }

    set textRow(textRow: ActaTextRow | null) {
        if (this._textRow === textRow) return;
        if (textRow) {
            if (this._textRow && this._textRow.column !== textRow.column) this.modified = true;
            this._textRow = textRow;
        } else {
            this._textRow = undefined;
            if (this._SVGPath.parentElement) {
                this._posX = undefined;
                this._posY = undefined;
                this._oldMaxHeight = undefined;
                this._SVGPath.parentElement.removeChild(this._SVGPath);
            }
            this.modified = true;
        }
    }
    set calcWidth(width: number) { this._calcWidth = width; }

    get id() { return this._id; }
    get char() { return this._char; }
    get type() { return this._type; }
    get indexOfColumn() { return (this._textRow) ? this._textRow.indexOfColumn : -1; }
    get indexOfLine() { return (this._textRow) ? this._textRow.indexOfLine : -1; }
    get indexOfNode() { return this._textNode.value.indexOf(this); }
    get width() { return this._width; }
    get height() { return this.textStyle.textHeight; }
    get calcWidth() { return this._calcWidth; }
    get textNode() { return this._textNode; }
    get textRow() { return this._textRow || null; }
    get textStyle() { return this.textNode.textStyle; }
    get visable() { return (this._textRow !== null) ? true : false; }

    get x() { return this._posX !== undefined ? this._posX : -1; }
    get y() { return this._posY !== undefined ? this._posY : -1; }

    get el() { return this._SVGPath; }
};