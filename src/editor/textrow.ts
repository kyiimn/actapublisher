import { ActaParagraphColumnElement } from './element/paragraph-col-el';
import { ActaTextChar } from './textchar';
import { TextAlign } from './textstyle';

import { v4 as uuidv4 } from 'uuid';
import $ from 'jquery';

export class ActaTextRow {
    private _id: string;
    private _column: ActaParagraphColumnElement;
    private _indexOfColumn: number;
    private _indexOfLine: number;
    private _limitWidth: number;
    private _maxHeight: number;
    private _maxLeading: number;
    private _textAlign: TextAlign;
    private _indent: number;
    private _items: ActaTextChar[];
    private _offsetY: number;

    constructor(column: ActaParagraphColumnElement, indent: number = 0) {
        this._id = uuidv4();
        this._column = column;
        this._indexOfColumn = -1;
        this._indexOfLine = -1;
        this._limitWidth = -1;
        this._maxHeight = 0;
        this._maxLeading = 0;
        this._indent = indent;
        this._items = [];
        this._textAlign = TextAlign.JUSTIFY;

        this._offsetY = 0;

        this.column = column;
    }

    set column(column: ActaParagraphColumnElement) {
        this._indexOfColumn = -1;
        this._indexOfLine = -1;
        this._limitWidth = -1;

        const para = column.parentElement;
        if (!para) return;

        const columns = para.querySelectorAll<ActaParagraphColumnElement>('x-paragraph-col');
        this._indexOfColumn = Array.prototype.slice.call(columns).indexOf(column);
        this._indexOfLine = column.textRows.length;
        this._limitWidth = $(column.svg).width() || 0;

        this._column = column;
        this._column.textRows.push(this);
    }

    set maxHeight(h: number) {
        this._maxHeight = (h < 0) ? 0 : Math.max(this._maxHeight, h);
    }
    set maxLeading(leading: number) {
        this._maxLeading = (leading < 0) ? 0 : Math.max(this._maxLeading, leading);
    }
    set items(items: ActaTextChar[]) { this._items = items; }
    set textAlign(align: TextAlign) { this._textAlign = align; }
    set indent(indent: number) { this._indent = indent; }
    set offsetY(y: number) { this._offsetY = y; }

    get id() { return this._id; }
    get column() { return this._column; }
    get indexOfColumn() { return this._indexOfColumn; }
    get indexOfLine() { return this._indexOfLine; }
    get items() { return this._items; }
    get maxHeight() { return this._maxHeight; }
    get maxLeading() { return this._maxLeading; }
    get limitWidth() { return this._limitWidth; }
    get textAlign() { return this._textAlign; }
    get indent() { return this._indent; }
    get offsetY() { return this._offsetY; }
};
