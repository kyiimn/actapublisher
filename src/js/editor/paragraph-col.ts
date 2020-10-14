import { ActaElement } from "./element";
import { ActaTextRow } from './textrow';
import U from './units';

export class ActaParagraphColumn extends ActaElement {
    private _root: ShadowRoot;
    private _svg: SVGElement;
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
        this._svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        this._svg.classList.add('canvas');
        this._svg.style.position = 'absolute';
    }

    connectedCallback() {
        this._applyWidth();
        this._root.appendChild(this._svg);
    }

    attributeChangedCallback(name: string, oldValue: string, newValue: string) {
        if (oldValue === newValue) return;
        this._applyWidth();
    }

    update() {
        this.textRows.forEach(textRow => textRow.update());
    }

    clear() {
        this._textRows = [];
    }

    get textRows() { return this._textRows; }
    get svg() { return this._svg; }
};
customElements.define('x-paragraph-col', ActaParagraphColumn);