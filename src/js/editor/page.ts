import { ActaGuide } from './guide';
import { ActaElement } from './element/instance';
import { Subject } from 'rxjs';

export class ActaPage extends ActaElement {
    private _changeStyle$: Subject<string>;
    private _mutation$: MutationObserver;

    static get observedAttributes() {
        return ['width', 'height', 'padding', 'padding-top', 'padding-bottom', 'padding-left', 'padding-right'];
    }

    private _applyAttribute(name: string, value: string) {
        switch (name) {
            case 'width': this.style.width = value; break;
            case 'height': this.style.height = value; break;
            case 'padding': this.style.padding = value; break;
            case 'padding-top': this.style.paddingTop = value; break;
            case 'padding-bottom': this.style.paddingBottom = value; break;
            case 'padding-left': this.style.paddingLeft = value; break;
            case 'padding-right': this.style.paddingRight = value; break;
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
        if (width !== undefined) this.setAttribute('width', width.toString());
        if (height !== undefined) this.setAttribute('height', height.toString());
    }

    connectedCallback() {
        for (const attr of ActaPage.observedAttributes) {
            const val = this.getAttribute(attr) || '';
            if (val === '') continue;

            this._applyAttribute(attr, val);
        }
        this._mutation$.observe(this, { childList: true });
    }

    attributeChangedCallback(name: string, oldValue: string, newValue: string) {
        if (oldValue === newValue) return;

        this._applyAttribute(name, newValue);
        this._changeStyle$.next(name);
    }

    set width(width: string | number) {
        this.setAttribute('width', width.toString());
    }

    set height(height: string | number) {
        this.setAttribute('height', height.toString());
    }

    set padding(padding: string | number) {
        this.setAttribute('padding', padding.toString());
    }

    set paddingTop(padding: string | number) {
        this.setAttribute('padding-top', padding.toString());
    }

    set paddingBottom(padding: string | number) {
        this.setAttribute('padding-bottom', padding.toString());
    }

    set paddingLeft(padding: string | number) {
        this.setAttribute('padding-left', padding.toString());
    }

    set paddingRight(padding: string | number) {
        this.setAttribute('padding-right', padding.toString());
    }

    get width() { return this.style.width; }
    get height() { return this.style.height; }
    get paddingTop() { return this.style.paddingTop; }
    get paddingBottom() { return this.style.paddingBottom; }
    get paddingLeft() { return this.style.paddingLeft; }
    get paddingRight() { return this.style.paddingRight; }
};
customElements.define('x-page', ActaPage);