import { ActaParagraphColumn } from './paragraph-col';
import { ActaTextChar, CharType } from './textchar';
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
    private _paddingLeft: number;
    private _paddingRight: number;
    private _fragment: boolean;
    private _limitWidth: number;
    private _endLine: boolean;

    private _computePosition() {
        this.items.forEach(item => {
            item.calcWidth = item.scaledWidth;
            item.calcWidth += (item.calcWidth > 0) ? (item.textStyle.letterSpacing || 0) : 0;
        });

        let filledWidth = this.calcWidth;
        let itemcnt = this.length;
        if (itemcnt < 1) return;

        if ([CharType.SPACE].indexOf(this.firstTextChar.type) > -1) {
            filledWidth -= this.firstTextChar.calcWidth;
            itemcnt--;
            this.firstTextChar.calcWidth = 0;
        }
        if ([CharType.SPACE].indexOf(this.lastTextChar.type) > -1) {
            filledWidth -= this.lastTextChar.calcWidth;
            itemcnt--;
            this.lastTextChar.calcWidth = 0;
        }
        if (this.textAlign === TextAlign.JUSTIFY) {
            const diffWidth = (this.limitWidth - filledWidth) / itemcnt;
            if (!this.endLine) {
                this.items.forEach(item => item.calcWidth += (item.calcWidth > 0) ? diffWidth : 0);
            }
        } else if (this.textAlign === TextAlign.RIGHT) {
            this.indent += this.limitWidth - filledWidth;
        } else if (this.textAlign === TextAlign.CENTER) {
            this.indent += (this.limitWidth - filledWidth) / 2;
        }
    }

    constructor(column: ActaParagraphColumn, indent: number = 0) {
        this._id = uuidv4();
        this._column = column;
        this._maxHeight = 0;
        this._maxLeading = 0;
        this._indent = indent;
        this._items = [];
        this._textAlign = TextAlign.JUSTIFY;

        this._paddingLeft = 0;
        this._paddingRight = 0;

        this._fragment = false;
        this._limitWidth = 0;

        this._endLine = false;
        this._modified = true;

        this.column = column;
    }

    indexOf(textChar: ActaTextChar) {
        return this._items.indexOf(textChar);
    }

    get(i: number) {
        return this._items[i];
    }

    push(textChar: ActaTextChar) {
        if (!this.availablePushTextChar(textChar)) return false;

        this.maxHeight = textChar.height;
        this.maxLeading = textChar.leading;
        this.textAlign = textChar.textStyle.textAlign;

        if (this._items.length === 0 && [CharType.SPACE].indexOf(textChar.type) > -1) {
            textChar.calcWidth = 0;
        }
        textChar.textRow = this;
        this._items.push(textChar);

        this._modified = true;

        return true;
    }

    clear() {
        this._items = [];
    }

    availablePushTextChar(textChar: ActaTextChar) {
        return !this.endLine && this.calcWidth + textChar.calcWidth <= this.limitWidth ? true : false;
    }

    update() {
        if (!this.modified) return;
        this._computePosition();
        this.items.forEach(textChar => textChar.update());
    }

    set indent(indent: number) { this._indent = indent; }
    set endLine(val: boolean) { this._endLine = val; }

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

    set paddingLeft(padding: number) {
        this._paddingLeft = padding;
        this._modified = true;
    }

    set paddingRight(padding: number) {
        this._paddingRight = padding;
        this._modified = true;
    }

    set fragment(fragment: boolean) {
        this._fragment = fragment;
        this._modified = true;
    }

    get id() { return this._id; }
    get column() { return this._column; }
    get paragraph() { return this._column.paragraph; }
    get items() { return this._items; }
    get textAlign() { return this._textAlign; }
    get indent() { return this._indent; }
    get paddingLeft() { return this._paddingLeft; }
    get paddingRight() { return this._paddingRight; }
    get fragment() { return this._fragment; }
    get length() { return this._items.length; }
    get firstTextChar() { return this.items[0]; }
    get lastTextChar() { return this.items[this.length - 1]; }

    get endLine() {
        let lastIsReturn = false;
        if (this.length > 0) {
            if (this.lastTextChar.type === CharType.RETURN) lastIsReturn = true;
        }
        return lastIsReturn || this._endLine;
    }

    get maxHeight() {
        let height = this._maxHeight;
        if (this.length === 0) {
            if (this.paragraph) {
                const lastTextChar = this.paragraph.visableLastTextChar;
                const textStyle = (lastTextChar) ? lastTextChar.textStyle : this.paragraph.defaultTextStyle;
                height = textStyle.textHeight;
            }
        }
        return height;
    }

    get maxLeading() {
        let leading = this._maxLeading;
        if (this.length === 0) {
            if (this.paragraph) {
                const lastTextChar = this.paragraph.visableLastTextChar;
                const textStyle = (lastTextChar) ? lastTextChar.textStyle : this.paragraph.defaultTextStyle;
                leading = textStyle.leading;
            }
        }
        return leading;
    }

    get indexOfColumn() {
        const para = this.column.parentElement;
        if (!para) return -1;

        const columns = para.querySelectorAll<ActaParagraphColumn>('x-paragraph-col');
        return Array.prototype.slice.call(columns).indexOf(this.column);
    }

    get indexOfLine() {
        return this.column.textRows.indexOf(this);
    }

    get calcWidth() {
        let width = this.indent;
        this.items.forEach(item => width += Math.max(item.width, 0));
        return width;
    }

    get limitWidth() {
        const svgRect = this.column.canvas.getBoundingClientRect();
        return svgRect.width - this._paddingLeft - this._paddingRight;
    }

    get columnWidth() {
        const svgRect = this.column.canvas.getBoundingClientRect();
        return svgRect.width;
    }

    get offsetTop() {
        let offsetY = 0;
        for (const otherRow of this.column.textRows) {
            if (otherRow === this) break;
            offsetY += !otherRow.fragment ? otherRow.calcHeight : 0;
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