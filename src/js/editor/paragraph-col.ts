import { ActaParagraph } from "./paragraph";
import { ActaElement } from "./element";
import { ActaTextChar, CharType } from "./textchar";
import { ActaTextRow } from './textrow';
import U from './units';

export class ActaParagraphColumn extends ActaElement {
    private _root: ShadowRoot;
    private _canvas: SVGElement;
    private _textRows: ActaTextRow[];

    static get observedAttributes() {
        return ['width'];
    }

    private _applyWidth() {
        const parent = this.parentElement;
        const direction = (parent !== null ? parent.style.flexDirection : false) || 'row';
        const width = U.px(this.getAttribute('width')) || 0;
        if (width) {
            this.style.minWidth = direction === 'row' ? width + 'px' : '';
            this.style.maxWidth = direction === 'row' ? width + 'px' : '';
            this.style.minHeight = direction !== 'row' ? width + 'px' : '';
            this.style.maxHeight = direction !== 'row' ? width + 'px' : '';
        } else {
            this.style.minWidth = '';
            this.style.maxWidth = '';
            this.style.minHeight = '';
            this.style.maxHeight = '';
            this.removeAttribute('width');
        }
    }

    constructor() {
        super();

        this._textRows = [];
        this._root = this.attachShadow({ mode: 'open' });
        this._canvas = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        this._canvas.classList.add('canvas');
        this._canvas.style.position = 'absolute';
    }

    connectedCallback() {
        this._applyWidth();
        this._root.appendChild(this._canvas);
    }

    attributeChangedCallback(name: string, oldValue: string, newValue: string) {
        if (oldValue === newValue) return;
        this._applyWidth();
    }

    update() {
        this.textRows.forEach(textRow => textRow.update());
    }

    clear() {
        const rect = this.getBoundingClientRect();
        const style = window.getComputedStyle(this);

        this._canvas.setAttribute('width', rect.width > 0 ? (rect.width - (parseFloat(style.borderLeftWidth) || 0) - (parseFloat(style.borderRightWidth) || 0)).toString() : '0');
        this._canvas.setAttribute('height', rect.height > 0 ? (rect.height - (parseFloat(style.borderTopWidth) || 0) - (parseFloat(style.borderBottomWidth) || 0)).toString() : '0');
        this._textRows = [];
    }

    push(textChar: ActaTextChar) {
        const paragraph = this.paragraph;
        let currentRow = this.lastRow;
        let newpara: boolean | undefined;

        while (true) {
            if (!currentRow) {
                if (!this.availablePushTextChar(textChar)) return false;
                if (newpara === undefined) {
                    if (paragraph) {
                        const textChars = paragraph.textChars;
                        const lastTextChar = textChars[textChars.indexOf(textChar) - 1];
                        newpara = lastTextChar ? (lastTextChar.type === CharType.RETURN ? true : false) : true;
                    } else {
                        newpara = false;
                    }
                }
                currentRow = new ActaTextRow(this, newpara ? textChar.textStyle.indent : 0);
                if (paragraph) paragraph.computeDrawableAreaOfTextRow(currentRow, textChar);
            }
            if (currentRow.push(textChar)) break;
            currentRow = null;
        }
        if (paragraph && currentRow) {
            if (paragraph.lastTextChar === textChar) currentRow.endLine = true;
        }
        return true;
    }

    availablePushTextChar(textChar: ActaTextChar) {
        const rect = this.canvas.getBoundingClientRect();
        return (this.calcHeight + textChar.height <= (rect.height || 0)) ? true : false;
    }

    get paragraph() {
        return this.parentElement ? this.parentElement as ActaParagraph : null;
    }

    get calcHeight() {
        let height = 0;
        this.textRows.forEach(textRows => {
            height += !textRows.fragment ? textRows.calcHeight : 0;
        });
        return height;
    }

    get firstRow() { return this._textRows.length > 0 ? this._textRows[0] : null; }
    get lastRow() { return this._textRows.length > 0 ? this._textRows[this._textRows.length - 1] : null; }

    get firstTextChar(): ActaTextChar | null {
        let textChar = null;
        this.textRows.some(textRow => textChar = textRow.firstTextChar);
        return textChar;
    }

    get lastTextChar(): ActaTextChar | null {
        let textChar = null;
        for (let i = this.textRows.length; i > 0; i--) {
            textChar = this.textRows[i - 1].lastTextChar;
            if (textChar) break;
        }
        return textChar;
    }

    get textRows() { return this._textRows; }
    get canvas() { return this._canvas; }
};
customElements.define('x-paragraph-col', ActaParagraphColumn);