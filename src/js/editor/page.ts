import { ActaGuide } from './guide';
import { ActaElement } from './element/instance';
import { Subject } from 'rxjs';
import U from './units';

export class ActaPage extends ActaElement {
    private _changeStyle$: Subject<string>;
    private _mutation$: MutationObserver;

    static get observedAttributes() {
        return ['width', 'height', 'padding-top', 'padding-bottom', 'padding-left', 'padding-right'];
    }

    private _applyAttribute(name: string, value: string | number) {
        if (typeof(value) === 'string') value = U.px(value);
        switch (name) {
            case 'width': this.style.width = !isNaN(value) ? (value + 'px') : ''; break;
            case 'height': this.style.height = !isNaN(value) ? (value + 'px') : ''; break;
            case 'padding-top': this.style.paddingTop = !isNaN(value) ? (value + 'px') : ''; break;
            case 'padding-bottom': this.style.paddingBottom = !isNaN(value) ? (value + 'px') : ''; break;
            case 'padding-left': this.style.paddingLeft = !isNaN(value) ? (value + 'px') : ''; break;
            case 'padding-right': this.style.paddingRight = !isNaN(value) ? (value + 'px') : ''; break;
            default: break;
        }
    }

    constructor(width?: string | number, height?: string | number) {
        super();

        this._changeStyle$ = new Subject();
        this._mutation$ = new MutationObserver(mutations => {
            mutations.forEach(m => {
                if (m.type !== 'childList') return;
                for (let i = 0; i < m.removedNodes.length; i++) {
                    if (!(m.removedNodes.item(i) instanceof ActaGuide)) continue;
                    const node = m.removedNodes.item(i) as ActaGuide;
                    node.unobserve();
                }
                for (let i = 0; i < m.addedNodes.length; i++) {
                    if (!(m.addedNodes.item(i) instanceof ActaGuide)) continue;
                    const node = m.addedNodes.item(i) as ActaGuide;
                    node.observe(this._changeStyle$);
                }
            });
        });
        if (!isNaN(U.px(width))) this.setAttribute('width', U.px(width) + 'px');
        if (!isNaN(U.px(height))) this.setAttribute('height', U.px(height) + 'px');
    }

    connectedCallback() {
        for (const attr of ActaPage.observedAttributes) {
            this._applyAttribute(attr, this.getAttribute(attr) || '');
        }
        this._mutation$.observe(this, { childList: true });
    }

    attributeChangedCallback(name: string, oldValue: string, newValue: string) {
        if (oldValue === newValue) return;

        this._applyAttribute(name, U.px(newValue));
        this._changeStyle$.next(name);
    }

    set width(width: string | number) {
        this.setAttribute('width', U.px(width) + 'px');
    }

    set height(height: string | number) {
        this.setAttribute('height', U.px(height) + 'px');
    }

    set padding(padding: string | number) {
        this.setAttribute('padding-top', U.px(padding) + 'px');
        this.setAttribute('padding-bottom', U.px(padding) + 'px');
        this.setAttribute('padding-left', U.px(padding) + 'px');
        this.setAttribute('padding-right', U.px(padding) + 'px');
    }

    set paddingTop(padding: string | number) {
        this.setAttribute('padding-top', U.px(padding) + 'px');
    }

    set paddingBottom(padding: string | number) {
        this.setAttribute('padding-bottom', U.px(padding) + 'px');
    }

    set paddingLeft(padding: string | number) {
        this.setAttribute('padding-left', U.px(padding) + 'px');
    }

    set paddingRight(padding: string | number) {
        this.setAttribute('padding-right', U.px(padding) + 'px');
    }

    get width() { return this.style.width; }
    get height() { return this.style.height; }
    get paddingTop() { return this.style.paddingTop; }
    get paddingBottom() { return this.style.paddingBottom; }
    get paddingLeft() { return this.style.paddingLeft; }
    get paddingRight() { return this.style.paddingRight; }
};
customElements.define('x-page', ActaPage);