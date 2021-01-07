import IActaElement from "./interface/element";
import U from '../util/units';

export default class ActaParagraphMargin extends IActaElement {
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

    constructor() { super(); }

    connectedCallback() {
        this._applyWidth();
    }

    attributeChangedCallback(name: string, oldValue: string, newValue: string) {
        if (oldValue === newValue) return;
        this._applyWidth();
    }
};
customElements.define('x-paragraph-margin', ActaParagraphMargin);