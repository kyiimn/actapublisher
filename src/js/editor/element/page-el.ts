import { ActaGuideElement } from './guide-el';
import { ActaElementInstance } from './instance';

export class ActaPageElement extends HTMLElement {
    private _instance?: ActaElementInstance;

    constructor() { super(); }
    connectedCallback() {
        this.changeStyle();
    }
    static get observedAttributes() {
        return ['width', 'height', 'padding', 'padding-top', 'padding-bottom', 'padding-left', 'padding-right'];
    }
    attributeChangedCallback(name: string, oldValue: string, newValue: string) {
        if (oldValue === newValue) return;
        this.changeStyle();

        const guides = this.querySelectorAll<ActaGuideElement>('x-guide');
        for (let i = 0; i < guides.length; i++) {
            const el: ActaGuideElement = guides.item(i);
            el.changePadding();
        }
    }
    changeStyle() {
        this.style.width = this.getAttribute('width') || '';
        this.style.height = this.getAttribute('height') || '';

        const padding = this.getAttribute('padding') || '';
        const paddingTop = this.getAttribute('padding-top') || padding;
        const paddingBottom = this.getAttribute('padding-bottom') || padding;
        const paddingLeft = this.getAttribute('padding-left') || padding;
        const paddingRight = this.getAttribute('padding-right') || padding;

        this.style.paddingTop = paddingTop;
        this.style.paddingBottom = paddingBottom;
        this.style.paddingLeft = paddingLeft;
        this.style.paddingRight = paddingRight;
    }

    set instance(instance: ActaElementInstance) { if (!this._instance && instance) this._instance = instance; }
    get innstance() { return this._instance; }
};