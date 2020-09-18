export class ActaParagraphMarginElement extends HTMLElement {
    constructor() { super(); }
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
};