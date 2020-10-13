import { ActaGuide } from './guide';
import { ActaGalley } from './galley';
import { ActaElement } from './element';
import { Subject } from 'rxjs';
import U from './units';

export class ActaPage extends ActaElement {
    private _changePageStyle$: Subject<string>;
    private _changeGalleyStyle$: Subject<ActaGalley>;
    private _mutationAddRemoveGuide$: MutationObserver;
    private _mutationChangeGalleyStyle$: MutationObserver;

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

    private _refreshCollisionList() {
        const childList = this.querySelectorAll<ActaGalley>('x-galley');
        for (const src of childList) {
            const srcX1 = U.px(src.x);
            const srcY1 = U.px(src.y);
            const srcX2 = srcX1 + U.px(src.width);
            const srcY2 = srcY1 + U.px(src.height);
            src.collisionList = [];

            for (const dest of childList) {
                if (src === dest) continue;
                const destX1 = U.px(dest.x);
                const destY1 = U.px(dest.y);
                const destX2 = destX1 + U.px(dest.width);
                const destY2 = destY1 + U.px(dest.height);
                if (srcX1 < destX2 && srcX2 > destX1 && srcY1 < destY2 && srcY2 > destY1) src.collisionList.push(dest);
            }
        }
    }

    constructor(width?: string | number, height?: string | number) {
        super();

        this._changePageStyle$ = new Subject();
        this._changeGalleyStyle$ = new Subject();

        this._changeGalleyStyle$.subscribe(src => {
            for (const dest of src.collisionList) {
                dest.collisionObservable.next(src);
            }
            src.collisionObservable.next(src);
        });

        this._mutationChangeGalleyStyle$ = new MutationObserver(mutations => {
            if (mutations.length > 0) this._refreshCollisionList();
            mutations.forEach(m => {
                this._changeGalleyStyle$.next(m.target as ActaGalley);
            });
        });

        this._mutationAddRemoveGuide$ = new MutationObserver(mutations => {
            mutations.forEach(m => {
                if (m.type !== 'childList') return;
                for (let i = 0; i < m.removedNodes.length; i++) {
                    const removedNode = m.removedNodes.item(i);
                    if (removedNode instanceof ActaGuide) {
                        const node = removedNode as ActaGuide;
                        node.unsubscribeChangePageSize();
                    }
                }
                for (let i = 0; i < m.addedNodes.length; i++) {
                    const addedNode = m.addedNodes.item(i);
                    if (addedNode instanceof ActaGuide) {
                        const node = addedNode as ActaGuide;
                        node.subscribeChangePageSize(this._changePageStyle$);
                    } else if (addedNode instanceof ActaGalley) {
                        this._refreshCollisionList();
                        this._changeGalleyStyle$.next(addedNode as ActaGalley);

                        this._mutationChangeGalleyStyle$.observe(addedNode, {
                            attributes: true,
                            attributeFilter: ActaGalley.observedAttributes
                        });
                    }
                }
            });
        });
        this._mutationAddRemoveGuide$.observe(this, { childList: true });

        if (width !== undefined) this.setAttribute('width', width.toString());
        if (height !== undefined) this.setAttribute('height', height.toString());
    }

    connectedCallback() {
        for (const attr of ActaPage.observedAttributes) {
            this._applyAttribute(attr, this.getAttribute(attr) || '');
        }
    }

    attributeChangedCallback(name: string, oldValue: string | null, newValue: string | null) {
        if (oldValue === newValue) return;

        this._applyAttribute(name, newValue);
        this._changePageStyle$.next(name);
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