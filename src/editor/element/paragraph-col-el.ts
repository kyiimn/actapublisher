export class ActaParagraphColumnElement extends HTMLElement {
    private _root: ShadowRoot;
    private _svg: SVGElement | null;

    constructor() {
        super();
        this._root = this.attachShadow({ mode: 'open' });
        this._svg = null;
    }
    static get observedAttributes() {
        return ['width'];
    }
    connectedCallback() {
        this.changeWidth();
    }
    attributeChangedCallback(name: string, oldValue: string, newValue: string) {
        if (oldValue === newValue) return;
        this.changeWidth();
    }
    changeWidth() {
        const parent = this.parentElement;
        const direction = (parent !== null ? parent.style.flexDirection : false) || 'row';
        const width = this.getAttribute('width');
        if (width !== null) {
            this.style.minWidth = direction === 'row' ? width : '';
            this.style.maxWidth = direction === 'row' ? width : '';
            this.style.minHeight = direction !== 'row' ? width : '';
            this.style.maxHeight = direction !== 'row' ? width : '';
        } else {
            this.style.minWidth = '';
            this.style.maxWidth = '';
            this.style.minHeight = '';
            this.style.maxHeight = '';
            this.removeAttribute('width');
        }
    }

    initSVG() {
        const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svg.classList.add('canvas');
        svg.style.position = 'absolute';

        this._svg = svg;

        this._root.innerHTML = '';
        this._root.appendChild(this._svg);

        return svg;
    }

    empty() {
        if (this._svg === null) return;
        this._svg.innerHTML = '';
    }

    get svg() {
        return this._svg === null ? this.initSVG() : this._svg;
    }
};