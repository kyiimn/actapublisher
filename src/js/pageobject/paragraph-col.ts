import IActaElement from "./interface/element";
import ActaParagraph from "./paragraph";
import ActaTextChar from "./text/textchar";
import { CharType } from "./text/textchar";
import ActaTextRow from './text/textrow';
import U from '../util/units';

export default class ActaParagraphColumn extends IActaElement {
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
        const rect = this.getScaledBoundingClientRect();
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
                currentRow = new ActaTextRow(this, newpara ? U.px(textChar.textAttribute.indent) : 0);
                if (paragraph) paragraph.computeTextRowPaddingSize(currentRow, textChar);
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
        const rect = this.getScaledBoundingClientRect(this._canvas);
        return (this.calcHeight + textChar.height <= (rect.height || 0)) ? true : false;
    }

    getScaledBoundingClientRect(el?: Element): DOMRect {
        const rect = el ? el.getBoundingClientRect() : this.getBoundingClientRect();
        let scaleX = 1, scaleY = 1;
        let nowEl: HTMLElement | null = this;
        while (true) {
            if (!nowEl) break;
            const transform = nowEl.style.transform;
            for (const v of transform.split(' ')) {
                if (v.indexOf('scale') < 0) continue;

                const v2 = v.substr(0, v.length - 1).split('(');
                if (v2.length < 2) continue;

                switch (v2[0].toLowerCase()) {
                    case 'scale':
                        if (v2[1].indexOf(',') > -1) {
                            const v3 = v2[1].split(',');
                            scaleX *= parseFloat(v3[0]);
                            scaleY *= parseFloat(v3[1]);
                        } else {
                            scaleX *= parseFloat(v2[1]);
                            scaleY *= parseFloat(v2[1]);
                        }
                        break;
                    case 'scalex':
                        scaleX *= parseFloat(v2[1]);
                        break;
                    case 'scaley':
                        scaleY *= parseFloat(v2[1]);
                        break;
                    default:
                        break;
                }
            }
            nowEl = nowEl.parentElement;
        }
        rect.x /= scaleX;
        rect.y /= scaleY;
        rect.width /= scaleX;
        rect.height /= scaleY;

        return rect;
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