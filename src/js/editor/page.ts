import { ActaGuide } from './guide';
import { ActaElement } from './element';
import { Subject } from 'rxjs';
import U from './units';

export class ActaPage extends ActaElement {
    private _changeStyle$: Subject<string>;
    private _mutation$: MutationObserver;

    static get observedAttributes() {
        return ['width', 'height', 'padding-top', 'padding-bottom', 'padding-left', 'padding-right'];
    }

    private _applyAttribute(name: string, value: string | null) {
        const num = U.px(value);
        switch (name) {
            case 'width': this.style.width = !isNaN(num) ? (num + 'px') : ''; break;
            case 'height': this.style.height = !isNaN(num) ? (num + 'px') : ''; break;
            case 'padding-top': this.style.paddingTop = !isNaN(num) ? (num + 'px') : ''; break;
            case 'padding-bottom': this.style.paddingBottom = !isNaN(num) ? (num + 'px') : ''; break;
            case 'padding-left': this.style.paddingLeft = !isNaN(num) ? (num + 'px') : ''; break;
            case 'padding-right': this.style.paddingRight = !isNaN(num) ? (num + 'px') : ''; break;
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
            this._applyAttribute(attr, this.getAttribute(attr) || '');
        }
        this._mutation$.observe(this, { childList: true });
    }

    attributeChangedCallback(name: string, oldValue: string | null, newValue: string | null) {
        if (oldValue === newValue) return;

        this._applyAttribute(name, newValue);
        this._changeStyle$.next(name);
    }

    set width(width: string | number) { this.setAttribute('width', width.toString()); }
    set height(height: string | number) { this.setAttribute('height', height.toString()); }
    set paddingTop(padding: string | number) { this.setAttribute('padding-top', padding.toString()); }
    set paddingBottom(padding: string | number) { this.setAttribute('padding-bottom', padding.toString()); }
    set paddingLeft(padding: string | number) { this.setAttribute('padding-left', padding.toString()); }
    set paddingRight(padding: string | number) { this.setAttribute('padding-right', padding.toString()); }

    get width() { return this.getAttribute('width') || ''; }
    get height() { return this.getAttribute('height') || ''; }
    get paddingTop() { return this.getAttribute('padding-top') || ''; }
    get paddingBottom() { return this.getAttribute('padding-bottom') || ''; }
    get paddingLeft() { return this.getAttribute('padding-left') || ''; }
    get paddingRight() { return this.getAttribute('padding-right') || ''; }
};
customElements.define('x-page', ActaPage);