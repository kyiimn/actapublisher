export class ActaGuideElement extends HTMLElement {
    constructor() {
        super();
    }
    static get observedAttributes() {
        return ['direction'];
    }
    connectedCallback() {
        this.changeFlexDirection();
        this.changePadding();
    }
    attributeChangedCallback(name: string, oldValue: string, newValue: string) {
        if (oldValue === newValue) return;
        this.changeFlexDirection();
    }
    changeFlexDirection() {
        this.style.flexDirection = this.getAttribute('direction') || 'row';
    }
    changePadding() {
        let top = '0';
        let bottom = '0';
        let left = '0';
        let right = '0';

        const parent = this.parentElement;
        if (parent !== null && parent.tagName.toLowerCase() === 'x-page') {
            top = parent.style.paddingTop || '0';
            bottom = parent.style.paddingBottom || '0';
            left = parent.style.paddingLeft || '0';
            right = parent.style.paddingRight || '0';
        }
        this.style.left = `calc(${left} - 1px)`;
        this.style.top = `calc(${top} - 1px)`;
        this.style.height = `calc(100% - (${top} + ${bottom}) + 2px)`;
        this.style.width = `calc(100% - (${left} + ${right}) + 2px)`;
    }
};