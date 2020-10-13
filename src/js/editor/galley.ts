import { ActaElement } from "./element";
import { Subject, Subscription, fromEvent } from 'rxjs';
import U from './units';

export class ActaGalley extends ActaElement {
    private _changeSize$: Subject<undefined>;
    private _collision$: Subject<ActaGalley>;
    private _mutation$: MutationObserver;

    private _collisionList: ActaGalley[];

    static get observedAttributes() {
        return [
            'width', 'height', 'x', 'y',
            'padding-top', 'padding-bottom', 'padding-left', 'padding-right',
            'border-color', 'border-top', 'border-bottom', 'border-left', 'border-right'
        ];
    }

    private _applyX() {
        const x = U.px(this.getAttribute('x') || '') || 0;
        const borderLeft = U.px(this.getAttribute('border-left') || '') || 1;
        this.style.left = `calc(${x + 'px'} - ${borderLeft + 'px'})`;
    }

    private _applyY() {
        const y = U.px(this.getAttribute('y') || '') || 0;
        const borderTop = U.px(this.getAttribute('border-top') || '') || 1;
        this.style.top = `calc(${y + 'px'} - ${borderTop + 'px'})`;
    }

    private _applyWidth() {
        const width = U.px(this.getAttribute('width') || '') || 0;
        const borderLeft = U.px(this.getAttribute('border-left') || '') || 1;
        const borderRight = U.px(this.getAttribute('border-right') || '') || 1;
        this.style.width = `calc(${width + 'px'} + ${borderLeft + 'px'} + ${borderRight + 'px'})`;
    }

    private _applyHeight() {
        const height = U.px(this.getAttribute('height') || '') || 0;
        const borderTop = U.px(this.getAttribute('border-top') || '') || 1;
        const borderBottom = U.px(this.getAttribute('border-bottom') || '') || 1;
        this.style.height = `calc(${height + 'px'} + ${borderTop + 'px'} + ${borderBottom + 'px'})`;
    }

    private _applyPaddingTop() { this.style.paddingTop = (U.px(this.getAttribute('padding-top')) || 0) + 'px'; }
    private _applyPaddingBottom() { this.style.paddingBottom = (U.px(this.getAttribute('padding-bottom')) || 0) + 'px'; }
    private _applyPaddingLeft() { this.style.paddingLeft = (U.px(this.getAttribute('padding-left')) || 0) + 'px'; }
    private _applyPaddingRight() { this.style.paddingRight = (U.px(this.getAttribute('padding-right')) || 0) + 'px'; }

    private _applyBorderTop() {
        const border = U.px(this.getAttribute('border-top')) || 0;
        this.style.borderTopWidth = (border) ? border + 'px' : '';
        this.style.borderTopStyle = (border) ? 'solid' : '';
        this.style.borderTopColor = (border) ? this.getAttribute('border-color') || '#000000' : '';
    }

    private _applyBorderBottom() {
        const border = U.px(this.getAttribute('border-bottom')) || 0;
        this.style.borderBottomWidth = (border) ? border + 'px' : '';
        this.style.borderBottomStyle = (border) ? 'solid' : '';
        this.style.borderBottomColor = (border) ? this.getAttribute('border-color') || '#000000' : '';
    }

    private _applyBorderLeft() {
        const border = U.px(this.getAttribute('border-left')) || 0;
        this.style.borderLeftWidth = (border) ? border + 'px' : '';
        this.style.borderLeftStyle = (border) ? 'solid' : '';
        this.style.borderLeftColor = (border) ? this.getAttribute('border-color') || '#000000' : '';
    }

    private _applyBorderRight() {
        const border = U.px(this.getAttribute('border-right')) || 0;
        this.style.borderRightWidth = (border) ? border + 'px' : '';
        this.style.borderRightStyle = (border) ? 'solid' : '';
        this.style.borderRightColor = (border) ? this.getAttribute('border-color') || '#000000' : '';
    }

    private _emitChangeSize() { this._changeSize$.next(); }

    constructor(x?: string | number, y?: string | number, width?: string | number, height?: string | number) {
        super();

        this._collisionList = [];
        this._changeSize$ = new Subject();
        this._collision$ = new Subject();
        this._mutation$ = new MutationObserver(mutations => {
            mutations.forEach(m => {
                if (m.type !== 'childList') return;
                for (let i = 0; i < m.removedNodes.length; i++) {
                    if (!(m.removedNodes.item(i) instanceof ActaGalleyChild)) continue;
                    const node = m.removedNodes.item(i) as ActaGalleyChild;
                    node.unsubscribeCollision();
                    node.unsubscribeChangeSize();
                }
                for (let i = 0; i < m.addedNodes.length; i++) {
                    if (!(m.addedNodes.item(i) instanceof ActaGalleyChild)) continue;
                    const node = m.addedNodes.item(i) as ActaGalleyChild;
                    node.subscribeCollision(this._collision$);
                    node.subscribeChangeSize(this._changeSize$);
                }
            });
        });
        this._mutation$.observe(this, { childList: true });

        if (x !== undefined) this.setAttribute('x', x.toString());
        if (y !== undefined) this.setAttribute('y', y.toString());
        if (width !== undefined) this.setAttribute('width', width.toString());
        if (height !== undefined) this.setAttribute('height', height.toString());
    }

    connectedCallback() {
        this._applyX();
        this._applyY();
        this._applyWidth();
        this._applyHeight();
        this._applyBorderTop();
        this._applyBorderBottom();
        this._applyBorderLeft();
        this._applyBorderRight();
        this._applyPaddingTop();
        this._applyPaddingBottom();
        this._applyPaddingLeft();
        this._applyPaddingRight();
    }

    attributeChangedCallback(name: string, oldValue: string, newValue: string) {
        if (oldValue === newValue) return;
        switch (name) {
            case 'x': this._applyX(); break;
            case 'y': this._applyY(); break;

            case 'width': this._applyWidth(); this._emitChangeSize(); break;
            case 'height': this._applyHeight(); this._emitChangeSize(); break;

            case 'padding-top': this._applyPaddingTop(); this._emitChangeSize(); break;
            case 'padding-bottom': this._applyPaddingBottom(); this._emitChangeSize(); break;
            case 'padding-left': this._applyPaddingLeft(); this._emitChangeSize(); break;
            case 'padding-right': this._applyPaddingRight(); this._emitChangeSize(); break;
            case 'padding': this._applyPaddingTop(); this._applyPaddingBottom(); this._applyPaddingLeft(); this._applyPaddingRight(); this._emitChangeSize(); break;

            case 'border-top': this._applyY(); this._applyBorderTop(); this._applyHeight(); this._emitChangeSize(); break;
            case 'border-bottom': this._applyBorderBottom(); this._applyHeight(); this._emitChangeSize(); break;
            case 'border-left': this._applyX(); this._applyBorderLeft(); this._applyWidth(); this._emitChangeSize(); break;
            case 'border-right': this._applyBorderRight(); this._applyWidth(); this._emitChangeSize(); break;
            case 'border':
                this._applyBorderTop(); this._applyBorderLeft(); this._applyBorderLeft(); this._applyBorderRight();
                this._applyWidth(); this._applyHeight(); this._emitChangeSize(); break;

            case 'border-color': this._applyBorderTop(); this._applyBorderLeft(); this._applyBorderLeft(); this._applyBorderRight(); this._emitChangeSize(); break;

            default: break;
        }
    }

    set x(x: string | number) { this.setAttribute('x', x.toString()); }
    set y(y: string | number) { this.setAttribute('y', y.toString()); }
    set width(width: string | number) { this.setAttribute('width', width.toString()); }
    set height(height: string | number) { this.setAttribute('height', height.toString()); }
    set borderTop(border: string | number) { this.setAttribute('border-top', border.toString()); }
    set borderBottom(border: string | number) { this.setAttribute('border-bottom', border.toString()); }
    set borderLeft(border: string | number) { this.setAttribute('border-left', border.toString()); }
    set borderRight(border: string | number) { this.setAttribute('border-right', border.toString()); }
    set paddingTop(padding: string | number) { this.setAttribute('padding-top', padding.toString()); }
    set paddingBottom(padding: string | number) { this.setAttribute('padding-bottom', padding.toString()); }
    set paddingLeft(padding: string | number) { this.setAttribute('padding-left', padding.toString()); }
    set paddingRight(padding: string | number) { this.setAttribute('padding-right', padding.toString()); }
    set collisionList(list: ActaGalley[]) { this._collisionList = list; }

    get x() { return this.getAttribute('x') || '0'; }
    get y() { return this.getAttribute('y') || '0'; }
    get width() { return this.getAttribute('width') || '0'; }
    get height() { return this.getAttribute('height') || '0'; }
    get borderTop() { return this.getAttribute('border-top') || '0'; }
    get borderBottom() { return this.getAttribute('border-bottom') || '0'; }
    get borderLeft() { return this.getAttribute('border-left') || '0'; }
    get borderRight() { return this.getAttribute('border-right') || '0'; }
    get paddingTop() { return this.getAttribute('padding-top') || '0'; }
    get paddingBottom() { return this.getAttribute('padding-bottom') || '0'; }
    get paddingLeft() { return this.getAttribute('padding-left') || '0'; }
    get paddingRight() { return this.getAttribute('padding-right') || '0'; }
    get collisionList() { return this._collisionList; }
    get collisionObservable() { return this._collision$; }
};
customElements.define('x-galley', ActaGalley);

// tslint:disable-next-line: max-classes-per-file
export abstract class ActaGalleyChild extends ActaElement {
    private _subscriptionChangeSize$?: Subscription;
    private _subscriptionCollision$?: Subscription;
    protected _resize$: Subject<Event>;

    static get observedAttributes() {
        return ['direction'];
    }

    protected _emitResize() {
        this._resize$.next(new Event('resize'));
    }

    private _applyDirection() {
        this.style.flexDirection = this.getAttribute('direction') || 'row';
    }

    private _changeSize() {
        const parent = this.parentElement;
        if (parent !== null && parent.tagName.toLowerCase() === 'x-galley') {
            const parentGalley = parent as ActaGalley;
            const paddingTop = U.px(parentGalley.paddingTop) || 0;
            const paddingBottom = U.px(parentGalley.paddingBottom) || 0;
            const paddingLeft = U.px(parentGalley.paddingLeft) || 0;
            const paddingRight = U.px(parentGalley.paddingRight) || 0;

            this.style.width = `calc(100% - ${paddingLeft + 'px'} - ${paddingRight + 'px'})`;
            this.style.height = `calc(100% - ${paddingTop + 'px'} - ${paddingBottom + 'px'})`;
        }
        this._emitResize();
    }

    constructor() {
        super();

        this._resize$ = new Subject<Event>();
        fromEvent(this, 'resize').subscribe(e => this._resize$);
    }

    subscribeChangeSize(observable: Subject<undefined>) {
        this._subscriptionChangeSize$ = observable.subscribe(_ => this._changeSize());
        this._changeSize();
    }

    unsubscribeChangeSize() {
        if (this._subscriptionChangeSize$) this._subscriptionChangeSize$.unsubscribe();
        this._subscriptionChangeSize$ = undefined;
    }

    subscribeCollision(observable: Subject<ActaGalley>) {
        this._subscriptionCollision$ = observable.subscribe(_ => this.collision());
        this.collision();
    }

    unsubscribeCollision() {
        if (this._subscriptionCollision$) this._subscriptionCollision$.unsubscribe();
        this._subscriptionCollision$ = undefined;
    }

    connectedCallback() {
        if (!this.hasAttribute('tabindex')) this.setAttribute('tabindex', '-1');

        this._changeSize();
        this._applyDirection();
    }

    attributeChangedCallback(name: string, oldValue: string, newValue: string) {
        if (oldValue === newValue) return;
        this._applyDirection();
    }

    get collisionList() {
        if (!(this.parentElement instanceof ActaGalley)) return [];

        const parent = this.parentElement as ActaGalley;
        return parent.collisionList;
    }

    abstract collision(): void;
};