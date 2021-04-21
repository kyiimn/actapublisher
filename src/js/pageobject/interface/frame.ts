import IActaElement from './element';
import IActaFrameOverlapArea from './frame-overlap-area';
import IActaPreflightProfile from './preflight-profile';
import U from '../../util/units';

import { fromEvent, Subject, Subscription } from 'rxjs';

import "../../../css/pageobject/frame.scss";
import { filter, map } from 'rxjs/operators';

type FrameMode = 'NONE' | 'MOVE' | 'EDIT';

type EVENT_TYPE = 'overlap' | 'changeselect' | 'changefocus' | 'changesize';

export enum FrameOverlapMethod {
    OVERLAP,        // 겹치기
    FRAMEBOX,       // 프레임박스
    SHAPE,          // 그림 테두리따라
    JUMP            // 라인점프
};

export interface IActaFrameAttribute {
    width?: number | string,
    height?: number | string,
    paddingLeft?: number | string,
    paddingTop?: number | string,
    paddingBottom?: number | string,
    paddingRight?: number | string,
    borderLeft?: number | string,
    borderTop?: number | string,
    borderBottom?: number | string,
    borderRight?: number | string,
    overlapMethod?: FrameOverlapMethod
};

export default abstract class IActaFrame extends IActaElement {
    private _subscriptionChangeSelect?: Subscription;
    private _subscriptionChangeSize?: Subscription;

    private _overlapFrames: IActaFrame[];
    private _margin: number | string;
    private _focused: boolean;

    private _mode: FrameMode;
    private _moveOriginalLeft?: number | string;
    private _moveOriginalTop?: number | string;

    private _overlapMethod: FrameOverlapMethod;

    protected _preflightProfiles: IActaPreflightProfile[];

    protected _EVENT$: Subject<{ type: EVENT_TYPE, value?: any }>;

    static get observedAttributes() {
        return [
            'width', 'height', 'x', 'y', 'rotate',
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

    private _applyRotate() {
        const rotate = this.rotate;
        const css = `rotate(${rotate}deg)`;
        if (this.style.transform.toLowerCase().indexOf('rotate') > -1) {
            this.style.transform = this.style.transform.toLowerCase().replace(/rotate[\s]?\([^\)]*?\)/, css);
        } else {
            this.style.transform = css;
        }
    }

    private _onChangeFocus(frame: IActaFrame) {
        if (frame === this) {
            if (this.classList.contains('focus')) return;
            this.classList.add('focus');
            this._focused = true;
            this._onFocus();
        } else {
            this.classList.remove('focus');
            this._focused = false;
            this._onBlur();
        }
        this._EMIT_CHANGE_SELECT();
    }

    protected _onFocus() { return; }
    protected _onBlur() { return; }
    protected _onOverlap() { return; }

    protected _onConnected() {
        this._EMIT_CHANGE_SIZE();
    }

    protected _EMIT_CHANGE_SELECT() { this._EVENT$.next({ type: 'changeselect' }); }
    protected _EMIT_CHANGE_SIZE() { this._EVENT$.next({ type: 'changesize' }); }

    protected constructor(x: string | number, y: string | number, width: string | number, height: string | number) {
        super();

        this._overlapMethod = FrameOverlapMethod.FRAMEBOX;

        this._overlapFrames = [];
        this._preflightProfiles = [];
        this._margin = 0;
        this._focused = false;
        this._mode = 'NONE';

        this._EVENT$ = new Subject();
        this._EVENT$.pipe(
            filter(v => v.type === 'overlap' && v.value),
            map(v => v.value as IActaFrame)
        ).subscribe(v => this._onOverlap());

        this._EVENT$.pipe(
            filter(v => v.type === 'changefocus' && v.value),
            map(v => v.value as IActaFrame)
        ).subscribe(v => this._onChangeFocus(v));

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
        this._applyRotate();

        if (!this.hasAttribute('tabindex')) this.setAttribute('tabindex', '-1');
        this.classList.add('frame');

        this._onConnected();
    }

    attributeChangedCallback(name: string, oldValue: string, newValue: string) {
        if (oldValue === newValue) return;
        switch (name) {
            case 'x': this._applyX(); break;
            case 'y': this._applyY(); break;

            case 'width': this._applyWidth(); this._EMIT_CHANGE_SIZE(); break;
            case 'height': this._applyHeight(); this._EMIT_CHANGE_SIZE(); break;

            case 'padding-top': this._applyPaddingTop(); this._EMIT_CHANGE_SIZE(); break;
            case 'padding-bottom': this._applyPaddingBottom(); this._EMIT_CHANGE_SIZE(); break;
            case 'padding-left': this._applyPaddingLeft(); this._EMIT_CHANGE_SIZE(); break;
            case 'padding-right': this._applyPaddingRight(); this._EMIT_CHANGE_SIZE(); break;
            case 'padding': this._applyPaddingTop(); this._applyPaddingBottom(); this._applyPaddingLeft(); this._applyPaddingRight(); this._EMIT_CHANGE_SIZE(); break;

            case 'rotate': this._applyRotate(); this._EMIT_CHANGE_SIZE(); break;

            case 'border-top': this._applyY(); this._applyBorderTop(); this._applyHeight(); this._EMIT_CHANGE_SIZE(); break;
            case 'border-bottom': this._applyBorderBottom(); this._applyHeight(); this._EMIT_CHANGE_SIZE(); break;
            case 'border-left': this._applyX(); this._applyBorderLeft(); this._applyWidth(); this._EMIT_CHANGE_SIZE(); break;
            case 'border-right': this._applyBorderRight(); this._applyWidth(); this._EMIT_CHANGE_SIZE(); break;
            case 'border':
                this._applyBorderTop(); this._applyBorderLeft(); this._applyBorderLeft(); this._applyBorderRight();
                this._applyWidth(); this._applyHeight(); this._EMIT_CHANGE_SIZE(); break;

            case 'border-color': this._applyBorderTop(); this._applyBorderLeft(); this._applyBorderLeft(); this._applyBorderRight(); this._EMIT_CHANGE_SIZE(); break;

            default: break;
        }
    }

    computeOverlapArea(x1: number, y1: number, x2: number, y2: number): IActaFrameOverlapArea | null {
        let thisX1 = U.px(this.x) - U.px(this.margin);
        let thisY1 = U.px(this.y) - U.px(this.margin);
        let thisX2 = thisX1 + U.px(this.width) + (U.px(this.margin) * 2);
        let thisY2 = thisY1 + U.px(this.height) + (U.px(this.margin) * 2);

        if (x1 < thisX2 && x2 > thisX1 && y1 < thisY2 && y2 > thisY1 && this.overlapMethod !== FrameOverlapMethod.OVERLAP) {
            thisX1 = Math.max(0, thisX1 - x1);
            thisY1 = Math.max(0, thisY1 - y1);
            thisX2 = Math.min(x2 - x1, thisX2 - x1);
            thisY2 = Math.min(y2 - y1, thisY2 - y1);

            return {
                x: [thisX1, thisX2],
                y: [thisY1, thisY2]
            };
        }
        return null;
    }

    savePosition() {
        if (this._mode) {
            this._moveOriginalLeft = this.x;
            this._moveOriginalTop = this.y;
        } else {
            this._moveOriginalLeft = undefined;
            this._moveOriginalTop = undefined;
        }
    }

    restorePosition() {
        if (!this._mode) return;
        if (this._moveOriginalLeft === undefined || this._moveOriginalTop === undefined) return;

        this.x = this._moveOriginalLeft;
        this.y = this._moveOriginalTop;
    }

    async focus(options?: FocusOptions | undefined, afterRender?: boolean) {
        if (!afterRender) {
            super.focus(options);
        } else return new Promise(r => {
            setTimeout(o => {
                super.focus(o);
                r(true);
            }, 1, options);
        });
    }

    blur() {
        super.blur();

        this.classList.remove('focus');
        this._focused = false;
        this._onBlur();

        this._EMIT_CHANGE_SELECT();
    }

    select() {
        this.classList.add('selected');
        this._EMIT_CHANGE_SELECT();
    }

    unselect() {
        this.classList.remove('selected');
        this._EMIT_CHANGE_SELECT();
    }

    EMIT_OVERLAP(frame: IActaFrame) {
        return this._EVENT$.next({ type: 'overlap', value: frame });
    }

    EMIT_CHANGE_FOCUS(frame: IActaFrame) {
        return this._EVENT$.next({ type: 'changefocus', value: frame });
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
    set rotate(rotate: number) { this.setAttribute('rotate', rotate.toString()); }
    set overlapFrames(list: IActaFrame[]) { this._overlapFrames = list; }
    set overlapMethod(overlapMethod: FrameOverlapMethod) {
        if (this._overlapMethod !== overlapMethod) {
            this._overlapMethod = overlapMethod;
            for (const frame of this.overlapFrames) {
                frame._EMIT_CHANGE_SIZE();
            }
        }
    }
    set mode(mode: FrameMode) {
        this._mode = mode;
        this.savePosition();
    }
    set margin(margin: number | string) {
        let changed = false;
        if (U.px(this._margin) !== U.px(margin)) changed = true;
        this._margin = margin;
        if (changed) this._EMIT_CHANGE_SIZE();
    }

    set onChangeSelect(handler: ((frame: IActaFrame, selected?: boolean) => void) | null) {
        if (this._subscriptionChangeSelect) this._subscriptionChangeSelect.unsubscribe();
        if (handler) {
            this._subscriptionChangeSelect = this._EVENT$.pipe(filter(v => v.type === 'changeselect')).subscribe(_ => handler(this, this.isSelected));
        } else {
            this._subscriptionChangeSelect = undefined;
        }
    }

    set onChangeSize(handler: ((frame: IActaFrame) => void) | null) {
        if (this._subscriptionChangeSize) this._subscriptionChangeSize.unsubscribe();
        if (handler) {
            this._subscriptionChangeSize = this._EVENT$.pipe(filter(v => v.type === 'changesize')).subscribe(_ => handler(this));
        } else {
            this._subscriptionChangeSize = undefined;
        }
    }

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
    get rotate() { return parseFloat(this.getAttribute('rotate') || '0'); }
    get overlapFrames() { return this._overlapFrames; }
    get overlapMethod() { return this._overlapMethod; }
    get preflightProfiles() { return this._preflightProfiles; }
    get mode() { return this._mode; }
    get savedPositionLeft() { return this._moveOriginalLeft || 0; }
    get savedPositionTop() { return this._moveOriginalTop || 0; }
    get margin() { return this._margin; }
    get isFocused() { return this._focused; }
    get isSelected() { return (this._focused || this.classList.contains('selected')) ? true : false; }

    get order() {
        const parentElement = this.parentElement;
        if (!parentElement) return -1;

        const children = [... parentElement.children];
        return children.indexOf(this) + 1;
    }

    get frameAttribute(): IActaFrameAttribute {
        return {
            width: this.width,
            height: this.height,
            paddingTop: this.paddingTop,
            paddingBottom: this.paddingBottom,
            paddingLeft: this.paddingLeft,
            paddingRight: this.paddingRight,
            borderTop: this.borderTop,
            borderBottom: this.borderBottom,
            borderLeft: this.borderLeft,
            borderRight: this.borderRight,
            overlapMethod: this.overlapMethod
        };
    }

    abstract preflight(): void;
    abstract get type(): string;
};