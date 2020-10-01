import { ActaTextNode } from "./textstore";
import { ActaTextStyle } from "./textstyle";
import { ActaTextRow } from './textrow';

import { v4 as uuidv4 } from 'uuid';
import { ActaParagraphColumnElement } from "./element/paragraph-col-el";

export enum TextCharType {
    NEWLINE, SPACE, PATH, END_OF_NODE
};

export class ActaTextChar {
    private _id: string;

    private _char: string;
    private _type: TextCharType;

    private _modified: boolean;

    private _textNode: ActaTextNode;
    private _textRow?: ActaTextRow;
    private _indexOfNode: number;
    private _indexOfText: number;

    private _SVGPath: SVGPathElement;
    private _calcWidth: number;
    private _drawOffsetX: number;
    private _drawOffsetY: number;
    private _width: number;
    private _height: number;

    private _posX?: number;
    private _posY?: number;

    private _stylingElements: SVGLineElement[];

    private _computeHeight() {
        const textStyle = this.textNode.textStyle;
        if (textStyle.font === null || textStyle.fontSize === null) return 0;

        const font = textStyle.font.font, size = textStyle.fontSize;
        const unitsPerSize = font.unitsPerEm / size;

        this._height = (font.tables.os2.usWinAscent + font.tables.os2.usWinDescent) / unitsPerSize;
    }

    private _createSVGPath() {
        const textStyle = this.textNode.textStyle;

        if (textStyle.font == null || textStyle.fontSize == null ||
            textStyle.xscale == null || textStyle.letterSpacing == null ||
            textStyle.lineHeight == null || textStyle.textAlign == null ||
            textStyle.underline == null || textStyle.strikeline == null ||
            textStyle.indent == null || textStyle.color == null
        ) return;

        if (this._type === TextCharType.SPACE) {
            this._width = (textStyle.fontSize !== null) ? textStyle.fontSize / 3 : 0;
        } else if (this._type === TextCharType.PATH) {
            const font = textStyle.font.font, size = textStyle.fontSize;
            const glyph = font.charToGlyph(this._char);
            const unitsPerSize = font.unitsPerEm / size;
            const yMin = font.tables.head.yMin / unitsPerSize;
            const path = glyph.getPath(0, this.height, size);
            const pathData = path.toPathData(3);

            this._SVGPath.setAttribute('d', pathData);
            this._SVGPath.setAttribute('data-char', this._char);

            this._drawOffsetX = 0;
            this._drawOffsetY = this.height + yMin;
            this._width = glyph.advanceWidth / unitsPerSize;
        }
    }

    constructor(
        char: string, textNode: ActaTextNode,
        indexOfNode: number = 0, indexOfText: number = 0
    ) {
        this._id = uuidv4();
        this._modified = true;

        this._char = char;

        this._textNode = textNode;
        this._indexOfNode = indexOfNode;
        this._indexOfText = indexOfText;

        this._SVGPath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        this._stylingElements = [];

        this._drawOffsetX = 0;
        this._drawOffsetY = 0;
        this._width = 0;
        this._height = 0;
        this._calcWidth = 0;

        switch (char) {
            case '\n': this._type = TextCharType.NEWLINE; break;
            case ' ': this._type = TextCharType.SPACE; break;
            case '': this._type = TextCharType.END_OF_NODE; break;
            default: this._type = TextCharType.PATH; break;
        }
        this._computeHeight();
        this._createSVGPath();
        this._calcWidth = this.width;
    }

    update(x?: number, y?: number) {
        const textStyle = this.textNode.textStyle;

        if (!this.textRow) return;
        if (x === undefined) {
            if (this._posX === undefined) return;
            x = this._posX;
        } else {
            this._posX = x;
        }
        if (y === undefined) {
            if (this._posY === undefined) return;
            y = this._posY;
        } else {
            this._posY = y;
        }
        for (const stylingElement of this._stylingElements) if (stylingElement) stylingElement.remove();
        this._stylingElements = [];

        let transform = 'translate(';
        transform += `${(this.drawOffsetX || 0) + ((textStyle.letterSpacing || 0) / 2) + x}px`;
        transform += ', ';
        transform += `${(this.drawOffsetY || 0) + y - this.textRow.maxHeight + ((this.textRow.maxHeight - (this.height || 0)) * 2)}px`;
        transform += ') ';
        transform += `scaleX(${textStyle.xscale || 1})`;

        this._SVGPath.setAttribute('data-id', this.id);
        this._SVGPath.setAttribute('data-textnode', this._textNode.id);
        this._SVGPath.setAttribute('data-index-of-node', this.indexOfNode.toString());
        this._SVGPath.setAttribute('data-index-of-text', this.indexOfText.toString());
        this._SVGPath.setAttribute('data-width', this.calcWidth.toString());
        this._SVGPath.setAttribute('data-height', this.textRow.maxHeight.toString());
        this._SVGPath.setAttribute('data-leading', this.textRow.maxLeading.toString());

        this._SVGPath.setAttribute('data-x', x.toString());
        this._SVGPath.setAttribute('data-y', y.toString());

        if (this.indexOfColumn !== null) this._SVGPath.setAttribute('data-index-of-column', this.indexOfColumn.toString());
        if (this.indexOfLine !== null) this._SVGPath.setAttribute('data-index-of-line', this.indexOfLine.toString());

        this._SVGPath.style.transform = transform;
        this._SVGPath.style.fill = textStyle.color || '#000000';

        this.textRow.column.svg.appendChild(this._SVGPath);

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

            this._stylingElements.push(strikeline);
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

            this._stylingElements.push(underline);
            this.textRow.column.svg.appendChild(underline);
        }
        this._modified = false;
    }

    set calcWidth(w: number) {
        this._modified = true;
        this._calcWidth = w;
    }
    set textRow(textRow: ActaTextRow | null) {
        this._modified = true;
        this._textRow = textRow || undefined;
    }

    get id() { return this._id; }
    get char() { return this._char; }
    get type() { return this._type; }
    get indexOfColumn() { return (this._textRow) ? this._textRow.indexOfColumn : -1; }
    get indexOfLine() { return (this._textRow) ? this._textRow.indexOfLine : -1; }
    get indexOfNode() { return this._indexOfNode; }
    get indexOfText() { return this._indexOfText; }
    get drawOffsetX() { return this._drawOffsetX; }
    get drawOffsetY() { return this._drawOffsetY; }
    get width() { return this._width; }
    get height() { return this._height; }
    get calcWidth() { return this._calcWidth; }
    get textNode() { return this._textNode; }
    get textRow() { return this._textRow || null; }
    get textStyle() { return this.textNode.textStyle; }
    get modified() { return this._modified; }

    get x() { return this._posX || 0; }
    get y() { return this._posY || 0; }

    get visable() {
        return (this._textRow !== null && this._type !== TextCharType.END_OF_NODE) ? true : false
    }
    get el() { return this._SVGPath; }
};