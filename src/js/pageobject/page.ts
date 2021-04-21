import ActaGuide from './guide';
import IActaFrame from './interface/frame';
import IActaElement from './interface/element';
import U from '../util/units';

import { fromEvent, Subject, Subscription } from 'rxjs';
import { distinctUntilChanged, filter, map } from 'rxjs/operators';

import "../../css/pageobject/page.scss";

type EVENT_TYPE = 'scale' | 'changeselectframes' | 'changeframestyle' | 'changepagestyle' | 'changefocus';

export default class ActaPage extends IActaElement {
    private _subscriptionChangeSelectFrames?: Subscription;
    private _subscriptionChangeScale?: Subscription;
    private _subscriptionChangePageStyle?: Subscription;

    private _guide: ActaGuide | undefined;

    private _EVENT$: Subject<{ type: EVENT_TYPE, value: any }>;

    private _OBSERVER_ADDREMOVE_GUIDE$: MutationObserver;
    private _OBSERVER_CHANGE_FRAME_STYLE$: MutationObserver;

    static get observedAttributes() {
        return ['width', 'height', 'padding-top', 'padding-bottom', 'padding-left', 'padding-right', 'scale'];
    }

    private _applyAttribute(name: string, value: string | null) {
        if (name === 'scale') {
            const num = parseFloat(value || '1');
            this.style.transform = !isNaN(num) ? `scale(${num})` : '';
            this._EVENT$.next({ type: 'scale', value: { width: this.scaledWidth, height: this.scaledHeight } });
        } else {
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
    }

    private _updateOverlapFrameList() {
        const childNodes = this.childNodes;
        for (const src of childNodes) {
            if (!(src instanceof IActaFrame)) continue;

            const srcX1 = U.px(src.x);
            const srcY1 = U.px(src.y);
            const srcX2 = srcX1 + U.px(src.width);
            const srcY2 = srcY1 + U.px(src.height);
            src.overlapFrames = [];

            for (const dest of childNodes) {
                if (src === dest || !(dest instanceof IActaFrame)) continue;

                const destX1 = U.px(dest.x) - U.px(dest.margin);
                const destY1 = U.px(dest.y) - U.px(dest.margin);
                const destX2 = destX1 + U.px(dest.width) + (U.px(dest.margin) * 2);
                const destY2 = destY1 + U.px(dest.height) + (U.px(dest.margin) * 2);
                if (srcX1 < destX2 && srcX2 > destX1 && srcY1 < destY2 && srcY2 > destY1) src.overlapFrames.push(dest);
            }
        }
    }

    private _getChildFrames(parent?: IActaFrame) {
        const frames: IActaFrame[] = [];
        (parent || this).childNodes.forEach(child => {
            if (child instanceof IActaFrame) frames.push(child);
        });
        frames.sort((x, y) => ((x.order < y.order) ? -1 : ((x.order > y.order) ? 1 : 0)));
        return frames;
    }

    constructor(width?: string | number, height?: string | number) {
        super();

        this._EVENT$ = new Subject();
        this._EVENT$.pipe(
            filter(v => v.type === 'changeframestyle'),
            map(v => v.value as IActaFrame)
        ).subscribe(frame => {
            for (const dest of frame.overlapFrames) {
                dest.EMIT_OVERLAP(frame);
            }
            frame.EMIT_OVERLAP(frame);
        });

        this._EVENT$.pipe(
            filter(v => v.type === 'changefocus'),
            map(v => v.value as IActaFrame)
        ).subscribe(focusedFrame => {
            for (const frame of this.allFrames) {
                frame.EMIT_CHANGE_FOCUS(focusedFrame);
            }
        });

        this._OBSERVER_CHANGE_FRAME_STYLE$ = new MutationObserver(mutations => {
            if (mutations.length > 0) this._updateOverlapFrameList();
            mutations.forEach(m => {
                this._EVENT$.next({ type: 'changeframestyle', value: m.target as IActaFrame });
            });
        });

        this._OBSERVER_ADDREMOVE_GUIDE$ = new MutationObserver(mutations => {
            mutations.forEach(m => {
                if (m.type !== 'childList') return;
                for (let i = 0; i < m.removedNodes.length; i++) {
                    const removedNode = m.removedNodes.item(i);
                    if (removedNode instanceof IActaFrame) {
                        const node = removedNode as IActaFrame;
                        node.onChangeSelect = null;
                    }
                }
                for (let i = 0; i < m.addedNodes.length; i++) {
                    const addedNode = m.addedNodes.item(i);
                    if (addedNode instanceof IActaFrame) {
                        const node = addedNode as IActaFrame;
                        this._updateOverlapFrameList();
                        this._EVENT$.next({ type: 'changeframestyle', value: node });
                        this._OBSERVER_CHANGE_FRAME_STYLE$.observe(node, {
                            attributes: true,
                            attributeFilter: IActaFrame.observedAttributes
                        });
                        fromEvent(node, 'focus').pipe(filter(e => e.target ? true : false), map(e => {
                            e.preventDefault();
                            return e.target as IActaFrame;
                        })).subscribe(target => {
                            this._EVENT$.next({ type: 'changefocus', value: target });
                        });
                        node.onChangeSelect = _ => this._EVENT$.next({ type: 'changeselectframes', value: this.selectedFrames });
                    }
                }
            });
        });
        this._OBSERVER_ADDREMOVE_GUIDE$.observe(this, { childList: true });

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
        this._EVENT$.next({ type: 'changepagestyle', value: name });
    }

    set width(width: string | number) { this.setAttribute('width', width.toString()); }
    set height(height: string | number) { this.setAttribute('height', height.toString()); }
    set paddingTop(padding: string | number) { this.setAttribute('padding-top', padding.toString()); }
    set paddingBottom(padding: string | number) { this.setAttribute('padding-bottom', padding.toString()); }
    set paddingLeft(padding: string | number) { this.setAttribute('padding-left', padding.toString()); }
    set paddingRight(padding: string | number) { this.setAttribute('padding-right', padding.toString()); }
    set scale(scale: number) { this.setAttribute('scale', scale.toString()); }

    set guide(guide: ActaGuide | undefined) {
        if (this._guide !== undefined) this.removeChild(this._guide);
        this._guide = guide;
        if (this._guide) this.prepend(this._guide);
    }

    set onChangeSelectFrames(handler: ((frames: IActaFrame[]) => void) | null) {
        if (this._subscriptionChangeSelectFrames) this._subscriptionChangeSelectFrames.unsubscribe();
        if (handler) {
            this._subscriptionChangeSelectFrames = this._EVENT$.pipe(
                filter(v => v.type === 'changeselectframes'),
                map(v => v.value as IActaFrame[]),
                distinctUntilChanged((a, b) => {
                    if (a.length !== b.length) return false;
                    for (const c of a) {
                        if (b.indexOf(c) < 0) return false;
                    }
                    return true;
                })
            ).subscribe(frames => handler(frames));
        } else {
            this._subscriptionChangeSelectFrames = undefined;
        }
    }

    set onChangeScale(handler: ((width: number, height: number) => void) | null) {
        if (this._subscriptionChangeScale) this._subscriptionChangeScale.unsubscribe();
        if (handler) {
            this._subscriptionChangeScale = this._EVENT$.pipe(
                filter(v => v.type === 'scale'),
                map(v => v.value as { width: number, height: number })
            ).subscribe(v => handler(v.width, v.height));
        } else {
            this._subscriptionChangeScale = undefined;
        }
    }

    set onChangePageStyle(handler: ((name: string) => void) | null) {
        if (this._subscriptionChangePageStyle) this._subscriptionChangePageStyle.unsubscribe();
        if (handler) {
            this._subscriptionChangePageStyle = this._EVENT$.pipe(
                filter(v => v.type === 'changepagestyle'),
                map(v => v.value as string)
            ).subscribe(name => handler(name));
        } else {
            this._subscriptionChangePageStyle = undefined;
        }
    }

    get width() { return this.getAttribute('width') || ''; }
    get height() { return this.getAttribute('height') || ''; }
    get paddingTop() { return this.getAttribute('padding-top') || ''; }
    get paddingBottom() { return this.getAttribute('padding-bottom') || ''; }
    get paddingLeft() { return this.getAttribute('padding-left') || ''; }
    get paddingRight() { return this.getAttribute('padding-right') || ''; }
    get scale() { return parseFloat(this.getAttribute('scale') || '1'); }
    get scaledWidth() { return U.px(this.width) * this.scale; }
    get scaledHeight() { return U.px(this.height) * this.scale; }
    get guide() { return this._guide; }

    get selectedFrames() { return [... this.querySelectorAll<IActaFrame>('.frame.focus, .frame.selected')]; }
    get topFrames() { return this._getChildFrames(); }
    get allFrames() {
        const children = this.querySelectorAll('*');
        const frames: IActaFrame[] = [];
        for (const el of children) {
            if (el instanceof IActaFrame) frames.push(el);
        }
        return frames;
    }
};
customElements.define('x-page', ActaPage);