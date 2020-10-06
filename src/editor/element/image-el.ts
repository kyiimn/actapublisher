import { ActaGalleyElement, ActaGalleyChildElement } from './galley-el';
import { ActaParagraphColumnElement } from './paragraph-col-el';
import $ from 'jquery';
import { ActaElementInstance } from './instance';

export class ActaParagraphElement extends ActaGalleyChildElement {
    private _instance?: ActaElementInstance;

    constructor() { super(); }
    static get observedAttributes() {
        return ['width', 'height', 'direction', 'text'];
    }
    connectedCallback() {
        if (!this.hasAttribute('tabindex')) this.setAttribute('tabindex', '-1');

        this.changeSize();
        this.changeDirection();
    }
    attributeChangedCallback(name: string, oldValue: string, newValue: string) {
        if (oldValue === newValue) return;
        switch (name) {
            case 'direction': this.changeDirection(); break;
            case 'text': $(this).trigger('change'); break;
            case 'width':
            case 'height': this.changeSize(); break;
            default: break;
        }
    }
    changeSize() {
        const parent = this.parentElement;
        if (parent !== null && parent.tagName.toLowerCase() === 'x-galley') {
            const parentGalley = parent as ActaGalleyElement;
            const attr = parentGalley.getAttributes();
            this.style.width = `calc(${attr.width} - ${attr.paddingLeft ? attr.paddingLeft : '0px'} - ${attr.paddingRight ? attr.paddingRight : '0px'})`;
            this.style.height = `calc(${attr.height} - ${attr.paddingTop ? attr.paddingTop : '0px'} - ${attr.paddingBottom ? attr.paddingBottom : '0px'})`;
        }
        $(this).trigger('resize');
    }
    changeDirection() {
        this.style.flexDirection = this.getAttribute('direction') || 'row';
    }
    get svg(): SVGElement[] {
        const columns = this.querySelectorAll<ActaParagraphColumnElement>('x-paragraph-col');
        const ret: SVGElement[] = [];
        for (let i = 0; i < columns.length; i++) {
            ret.push(columns.item(i).svg);
        }
        return ret;
    }

    set instance(instance: ActaElementInstance) { if (!this._instance && instance) this._instance = instance; }
    get innstance() { return this._instance; }
};