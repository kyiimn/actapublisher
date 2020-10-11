import { ActaElement } from "./instance";
import { Subject } from 'rxjs';

export class ActaGalleyElement extends ActaElement {
    private _changeSize$: Subject<undefined>;
    private _mutation$: MutationObserver;

    static get observedAttributes() {
        return [
            'width', 'height', 'x', 'y',
            'padding', 'padding-top', 'padding-bottom', 'padding-left', 'padding-right',
            'border-color', 'border', 'border-top', 'border-bottom', 'border-left', 'border-right'
        ];
    }

    private _applyLeft() {
        const attr = this.getAttributes();
        this.style.left = `calc(${attr.left} - ${attr.borderLeft ? '0px' : '1px'})`;
    }

    private _applyTop() {
        const attr = this.getAttributes();
        this.style.top = `calc(${attr.top} - ${attr.borderTop ? '0px' : '1px'})`;
    }

    private _applyWidth() {
        const attr = this.getAttributes();
        this.style.width = `calc(${attr.width} + ${attr.borderLeft ? '0px' : '1px'} + ${attr.borderRight ? '0px' : '1px'})`;
    }

    private _applyHeight() {
        const attr = this.getAttributes();
        this.style.height = `calc(${attr.height} + ${attr.borderTop ? '0px' : '1px'} + ${attr.borderBottom ? '0px' : '1px'})`;
    }

    private _applyPaddingTop() {
        const attr = this.getAttributes();
        this.style.paddingTop = attr.paddingTop;
    }

    private _applyPaddingBottom() {
        const attr = this.getAttributes();
        this.style.paddingBottom = attr.paddingBottom;
    }

    private _applyPaddingLeft() {
        const attr = this.getAttributes();
        this.style.paddingLeft = attr.paddingLeft;
    }

    private _applyPaddingRight() {
        const attr = this.getAttributes();
        this.style.paddingRight = attr.paddingRight;
    }

    private _applyBorderTop() {
        const attr = this.getAttributes();
        this.style.borderTop = attr.borderTop ? `${attr.borderTop} solid ${attr.borderColor}` : '';
    }

    private _applyBorderBottom() {
        const attr = this.getAttributes();
        this.style.borderBottom = attr.borderBottom ? `${attr.borderBottom} solid ${attr.borderColor}` : '';
    }

    private _applyBorderLeft() {
        const attr = this.getAttributes();
        this.style.borderLeft = attr.borderLeft ? `${attr.borderLeft} solid ${attr.borderColor}` : '';
    }

    private _applyBorderRight() {
        const attr = this.getAttributes();
        this.style.borderRight = attr.borderRight ? `${attr.borderRight} solid ${attr.borderColor}` : '';
    }

    private _emitChangeStyle() { this._changeSize$.next(); }

    constructor(x?: string | number, y?: string | number, width?: string | number, height?: string | number) {
        super();

        this._changeSize$ = new Subject();
        this._mutation$ = new MutationObserver(mutations => {
            mutations.forEach(m => {
                if (m.type !== 'childList') return;
                for (let i = 0; i < m.removedNodes.length; i++) {
                    if (!(m.removedNodes.item(i) instanceof ActaGalleyChildElement)) continue;
                    const node = m.removedNodes.item(i) as ActaGalleyChildElement;
                    node.unobserve();
                }
                for (let i = 0; i < m.addedNodes.length; i++) {
                    if (!(m.addedNodes.item(i) instanceof ActaGalleyChildElement)) continue;
                    const node = m.addedNodes.item(i) as ActaGalleyChildElement;
                    node.observe(this._changeSize$);
                }
            });
        });
        if (x !== undefined) this.setAttribute('x', x.toString());
        if (y !== undefined) this.setAttribute('y', y.toString());
        if (width !== undefined) this.setAttribute('width', width.toString());
        if (height !== undefined) this.setAttribute('height', height.toString());
    }

    connectedCallback() {
        this._applyLeft();
        this._applyTop();
        this._applyPaddingTop();
        this._applyPaddingBottom();
        this._applyPaddingLeft();
        this._applyPaddingRight();

        this._mutation$.observe(this, { childList: true });
    }

    getAttributes() {
        const style = window.getComputedStyle(this);
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
            case 'x': this._applyLeft(); break;
            case 'y': this._applyTop(); break;

            case 'width': this._applyWidth(); this._emitChangeStyle(); break;
            case 'height': this._applyHeight(); this._emitChangeStyle(); break;

            case 'padding-top': this._applyPaddingTop(); this._emitChangeStyle(); break;
            case 'padding-bottom': this._applyPaddingBottom(); this._emitChangeStyle(); break;
            case 'padding-left': this._applyPaddingLeft(); this._emitChangeStyle(); break;
            case 'padding-right': this._applyPaddingRight(); this._emitChangeStyle(); break;
            case 'padding': this._applyPaddingTop(); this._applyPaddingBottom(); this._applyPaddingLeft(); this._applyPaddingRight(); this._emitChangeStyle(); break;

            case 'border-top': this._applyBorderTop(); this._applyHeight(); this._emitChangeStyle(); break;
            case 'border-bottom': this._applyBorderBottom(); this._applyHeight(); this._emitChangeStyle(); break;
            case 'border-left': this._applyBorderLeft(); this._applyWidth(); this._emitChangeStyle(); break;
            case 'border-right': this._applyBorderRight(); this._applyWidth(); this._emitChangeStyle(); break;
            case 'border':
                this._applyBorderTop(); this._applyBorderLeft(); this._applyBorderLeft(); this._applyBorderRight();
                this._applyWidth(); this._applyHeight(); this._emitChangeStyle(); break;

            case 'border-color': this._applyBorderTop(); this._applyBorderLeft(); this._applyBorderLeft(); this._applyBorderRight(); this._emitChangeStyle(); break;

            default: break;
        }
    }

    set x(x: string | number) {
        this.setAttribute('x', x.toString());
    }

    set y(y: string | number) {
        this.setAttribute('y', y.toString());
    }

    set width(width: string | number) {
        this.setAttribute('width', width.toString());
    }

    set height(height: string | number) {
        this.setAttribute('height', height.toString());
    }

    set padding(padding: string | number) {
        const p = padding.toString().split(' ');
        this.paddingTop = p[0] || 0;
        this.paddingBottom = p[2] || p[0] || 0;
        this.paddingLeft = p[1] || p[0] || 0;
        this.paddingRight = p[3] || p[1] || p[0] || 0;
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

    get x() { return this.getAttributes().left; }
    get y() { return this.getAttributes().top; }
    get width() { return this.getAttributes().width; }
    get height() { return this.getAttributes().height; }
    get paddingTop() { return this.getAttributes().paddingTop; }
    get paddingBottom() { return this.getAttributes().paddingBottom; }
    get paddingLeft() { return this.getAttributes().paddingLeft; }
    get paddingRight() { return this.getAttributes().paddingRight; }
    get padding() {
        return `${this.paddingTop} ${this.paddingLeft} ${this.paddingBottom} ${this.paddingRight}`;
    }
};
customElements.define('x-galley', ActaGalleyElement);

// tslint:disable-next-line: max-classes-per-file
export abstract class ActaGalleyChildElement extends ActaElement {
    abstract observe(observer: Subject<undefined>): void;
    abstract unobserve(): void;
};