export class ActaGuideColumnElement extends HTMLElement {
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
        const width = this.getAttribute('width');
        if (width !== null) {
            this.style.maxWidth = width;
            this.style.minWidth = width;
        } else {
            this.style.maxWidth = '';
            this.style.minWidth = '';
            this.removeAttribute('width');
        }
    }
};

// tslint:disable-next-line: max-classes-per-file
export class ActaGuideMarginElement extends ActaGuideColumnElement {};