import { ActaElementInstance } from "./instance";

export class ActaGalleyElement extends HTMLElement {
    private _instance?: ActaElementInstance;

    constructor() { super(); }
    connectedCallback() {
        this.changePosition();
        this.changeSize();
    }
    static get observedAttributes() {
        return [
            'width', 'height', 'x', 'y',
            'padding', 'padding-top', 'padding-bottom', 'padding-left', 'padding-right',
            'border-color', 'border', 'border-top', 'border-bottom', 'border-left', 'border-right'
        ];
    }
    getAttributes() {
        return {
            paddingTop: this.getAttribute('padding-top') || this.getAttribute('padding') || '0',
            paddingBottom: this.getAttribute('padding-bottom') || this.getAttribute('padding') || '0',
            paddingLeft: this.getAttribute('padding-left') || this.getAttribute('padding') || '0',
            paddingRight: this.getAttribute('padding-right') || this.getAttribute('padding') || '0',
            borderTop: this.getAttribute('border-top') || this.getAttribute('border') || '0',
            borderBottom: this.getAttribute('border-bottom') || this.getAttribute('border') || '0',
            borderLeft: this.getAttribute('border-left') || this.getAttribute('border') || '0',
            borderRight: this.getAttribute('border-right') || this.getAttribute('border') || '0',
            borderColor: this.getAttribute('border-color') || '#000000',
            left: this.getAttribute('x') || '0',
            top: this.getAttribute('y') || '0',
            width: this.getAttribute('width') || '',
            height: this.getAttribute('height') || ''
        };
    }
    attributeChangedCallback(name: string, oldValue: string, newValue: string) {
        if (oldValue === newValue) return;
        switch (name) {
            case 'x':
            case 'y': this.changePosition(); break;
            default: this.changeSize(); break;
        }
    }
    changePosition() {
        const attr = this.getAttributes();
        this.style.left = `calc(${attr.left} - ${attr.borderLeft ? '0px' : '1px'})`;
        this.style.top = `calc(${attr.top} - ${attr.borderTop ? '0px' : '1px'})`;
    }
    changeSize() {
        const attr = this.getAttributes();
        this.style.width = `calc(${attr.width} + ${attr.borderLeft ? '0px' : '1px'} + ${attr.borderRight ? '0px' : '1px'})`;
        this.style.height = `calc(${attr.height} + ${attr.borderTop ? '0px' : '1px'} + ${attr.borderBottom ? '0px' : '1px'})`;

        this.style.paddingTop = attr.paddingTop;
        this.style.paddingBottom = attr.paddingBottom;
        this.style.paddingLeft = attr.paddingLeft;
        this.style.paddingRight = attr.paddingRight;

        this.style.borderTop = attr.borderTop ? `${attr.borderTop} solid ${attr.borderColor}` : '';
        this.style.borderBottom = attr.borderBottom ? `${attr.borderBottom} solid ${attr.borderColor}` : '';
        this.style.borderLeft = attr.borderLeft ? `${attr.borderLeft} solid ${attr.borderColor}` : '';
        this.style.borderRight = attr.borderRight ? `${attr.borderRight} solid ${attr.borderColor}` : '';

        const children = this.childNodes as NodeListOf<ActaGalleyChildElement>;
        for (let i = 0; i < children.length; i++) {
            const el = children.item(i);
            el.changeSize();
        }
    }

    set instance(instance: ActaElementInstance) { if (!this._instance && instance) this._instance = instance; }
    get innstance() { return this._instance; }
};

// tslint:disable-next-line: max-classes-per-file
export class ActaGalleyChildElement extends HTMLElement {
    constructor() { super(); }
    changeSize() { 'empty'; }
};