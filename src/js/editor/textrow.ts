import { ActaParagraphColumn } from './paragraph-col';
import { ActaTextChar } from './textchar';
import { TextAlign } from './textstyle';

import { v4 as uuidv4 } from 'uuid';

export class ActaTextRow {
    private _id: string;
    private _column: ActaParagraphColumn;
    private _maxHeight: number;
    private _maxLeading: number;
    private _textAlign: TextAlign;
    private _indent: number;
    private _items: ActaTextChar[];
    private _modified: boolean;

    constructor(column: ActaParagraphColumn, indent: number = 0) {
        this._id = uuidv4();
        this._column = column;
        this._maxHeight = 0;
        this._maxLeading = 0;
        this._indent = indent;
        this._items = [];
        this._textAlign = TextAlign.JUSTIFY;

        this._modified = true;

        this.column = column;
    }

    indexOf(textChar: ActaTextChar) {
        return this._items.indexOf(textChar);
    }

    item(i: number) {
        return this._items[i];
    }

    push(textChar: ActaTextChar) {
        this.maxHeight = textChar.height;
        this.maxLeading = (textChar.height || 0) * ((textChar.textStyle.lineHeight || 1) - 1);
        this.textAlign = textChar.textStyle.textAlign;

        textChar.textRow = this;
        this._items.push(textChar);
    }

    clear() {
        this._items = [];
    }

    update() {
        if (!this.modified) return;
        this.items.forEach(textChar => textChar.update());
    }

    set indent(indent: number) { this._indent = indent; }

    set column(column: ActaParagraphColumn) {
        const oldIdx = this.column.textRows.indexOf(this);
        if (oldIdx > -1) this.column.textRows.splice(oldIdx, 1);

        this._column = column;
        this._column.textRows.push(this);
    }

    set maxHeight(h: number) {
        const newValue = Math.max(this._maxHeight, h || 0);
        if (this._maxHeight === newValue) return;
        this._maxHeight = newValue;
        this._modified = true;
    }

    set maxLeading(leading: number) {
        const newValue = (leading < 0) ? 0 : Math.max(this._maxLeading, leading);
        if (this._maxLeading === newValue) return;
        this._maxLeading = newValue;
        this._modified = true;
    }

    set textAlign(align: TextAlign) {
        const newValue = Math.max(this._textAlign, align || TextAlign.JUSTIFY);
        if (this._textAlign === newValue) return;
        this._textAlign = newValue;
        this._modified = true;
    }

    get id() { return this._id; }
    get column() { return this._column; }
    get items() { return this._items; }
    get maxHeight() { return this._maxHeight; }
    get maxLeading() { return this._maxLeading; }
    get textAlign() { return this._textAlign; }
    get indent() { return this._indent; }

    get length() { return this._items.length; }
    get firstItem() { return this.items[0]; }
    get lastItem() { return this.items[this.length - 1]; }

    get indexOfColumn() {
        const para = this.column.parentElement;
        if (!para) return -1;

        const columns = para.querySelectorAll<ActaParagraphColumn>('x-paragraph-col');
        return Array.prototype.slice.call(columns).indexOf(this.column);
    }

    get indexOfLine() {
        return this.column.textRows.indexOf(this);
    }

    get limitWidth() {
        const svgRect = this.column.canvas.getBoundingClientRect();
        return svgRect.width;
    }

    get offsetY() {
        let offsetY = 0;
        for (const otherRow of this.column.textRows) {
            if (otherRow === this) break;
            offsetY += otherRow.calcHeight;
        }
        return offsetY;
    }

    get calcHeight() {
        return this.maxHeight + this.maxLeading;
    }

    get modified() {
        let modified = false;
        if (this._modified) return true;
        for (const textChar of this.items) {
            modified = (textChar.modified) ? true : modified;
        }
        return modified;
    }
};
