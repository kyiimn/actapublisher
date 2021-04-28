import { IActaFrameAttribute, FrameOverlapMethod } from '../pageobject/interface/frame';
import IActaToolbar from './toolbar';

import message from '../ui/message';
import formbuilder, { ActaUIFormInputItem, ActaUIFormButtonItem } from '../ui/form';
import accountInfo from '../info/account';
import U from '../util/units';

import { merge, Subject } from 'rxjs';
import { map } from 'rxjs/operators';

type CHANGE_ATTR = 'overlap' | 'width' | 'height' | 'padding-left' | 'padding-top' | 'padding-bottom' | 'padding-right' | 'border-left' | 'border-top' | 'border-bottom' | 'border-right' | 'border-color' | 'border-style';

class ActaToolbarPageObjectTransform extends IActaToolbar {
    private _itemX!: ActaUIFormInputItem;
    private _itemY!: ActaUIFormInputItem;
    private _itemSizeWidth!: ActaUIFormInputItem;
    private _itemSizeHeight!: ActaUIFormInputItem;
    private _itemPaddingLeft!: ActaUIFormInputItem;
    private _itemPaddingTop!: ActaUIFormInputItem;
    private _itemPaddingBottom!: ActaUIFormInputItem;
    private _itemPaddingRight!: ActaUIFormInputItem;
    private _itemBorderLeft!: ActaUIFormInputItem;
    private _itemBorderTop!: ActaUIFormInputItem;
    private _itemBorderBottom!: ActaUIFormInputItem;
    private _itemBorderRight!: ActaUIFormInputItem;
    // private _itemBorderColor;
    // private _itemBorderStyle;
    private _itemOverlapMethodOverlap!: ActaUIFormButtonItem;
    private _itemOverlapMethodFramebox!: ActaUIFormButtonItem;
    private _itemOverlapMethodShape!: ActaUIFormButtonItem;
    private _itemOverlapMethodJump!: ActaUIFormButtonItem;

    private _CHANGE$!: Subject<{ attr: CHANGE_ATTR, value: string }>;

    protected _initToolbar() {
        this.el.classList.add('pageobject-transform');

        this._itemX = formbuilder.inputNumber({ attr: { action: 'x' }, label: message.TOOLBAR.PAGEOBJECT_TRANSFORM_X, width: '4.4em', step: .01, min: 0 });
        this._itemY = formbuilder.inputNumber({ attr: { action: 'y' }, label: message.TOOLBAR.PAGEOBJECT_TRANSFORM_Y, width: '4.4em', step: .01, min: 0 });
        this._itemSizeWidth = formbuilder.inputNumber({ attr: { action: 'width' }, label: message.TOOLBAR.PAGEOBJECT_TRANSFORM_WIDTH, width: '4.4em', step: .01, min: 0 });
        this._itemSizeHeight = formbuilder.inputNumber({ attr: { action: 'height' }, label: message.TOOLBAR.PAGEOBJECT_TRANSFORM_HEIGHT, width: '4.4em', step: .01, min: 0 });
        this._itemPaddingLeft = formbuilder.inputNumber({ attr: { action: 'padding-left' }, icon: 'padding', icontype: 'material', iconrotate: 270, label: message.TOOLBAR.PAGEOBJECT_TRANSFORM_PADDING_LEFT, width: '3.6em', step: .01, min: 0 });
        this._itemPaddingTop = formbuilder.inputNumber({ attr: { action: 'padding-top' }, icon: 'padding', icontype: 'material', label: message.TOOLBAR.PAGEOBJECT_TRANSFORM_PADDING_TOP, width: '3.6em', step: .01, min: 0 });
        this._itemPaddingBottom = formbuilder.inputNumber({ attr: { action: 'padding-bottom' }, icon: 'padding', icontype: 'material', iconrotate: 180, label: message.TOOLBAR.PAGEOBJECT_TRANSFORM_PADDING_BOTTOM, width: '3.6em', step: .01, min: 0 });
        this._itemPaddingRight = formbuilder.inputNumber({ attr: { action: 'padding-right' }, icon: 'padding', icontype: 'material', iconrotate: 90, label: message.TOOLBAR.PAGEOBJECT_TRANSFORM_PADDING_RIGHT, width: '3.6em', step: .01, min: 0 });
        this._itemBorderLeft = formbuilder.inputNumber({ attr: { action: 'border-left' }, icon: 'border_left', icontype: 'material', label: message.TOOLBAR.PAGEOBJECT_TRANSFORM_BORDER_LEFT, width: '3.6em', step: .01, min: 0 });
        this._itemBorderTop = formbuilder.inputNumber({ attr: { action: 'border-top' }, icon: 'border_top', icontype: 'material', label: message.TOOLBAR.PAGEOBJECT_TRANSFORM_BORDER_TOP, width: '3.6em', step: .01, min: 0 });
        this._itemBorderBottom = formbuilder.inputNumber({ attr: { action: 'border-bottom' }, icon: 'border_bottom', icontype: 'material', label: message.TOOLBAR.PAGEOBJECT_TRANSFORM_BORDER_BOTTOM, width: '3.6em', step: .01, min: 0 });
        this._itemBorderRight = formbuilder.inputNumber({ attr: { action: 'border-right' }, icon: 'border_right', icontype: 'material', label: message.TOOLBAR.PAGEOBJECT_TRANSFORM_BORDER_RIGHT, width: '3.6em', step: .01, min: 0 });

        this._itemOverlapMethodOverlap = formbuilder.iconButton({ icon: 'flow-overlap', icontype: 'custom', label: message.TOOLBAR.PAGEOBJECT_TRANSFORM_OVERLAP_METHOD_OVERLAP });
        this._itemOverlapMethodFramebox = formbuilder.iconButton({ icon: 'flow-framebox', icontype: 'custom', label: message.TOOLBAR.PAGEOBJECT_TRANSFORM_OVERLAP_METHOD_FRAMEBOX });
        this._itemOverlapMethodShape = formbuilder.iconButton({ icon: 'flow-shape', icontype: 'custom', label: message.TOOLBAR.PAGEOBJECT_TRANSFORM_OVERLAP_METHOD_SHAPE });
        this._itemOverlapMethodJump = formbuilder.iconButton({ icon: 'flow-jump', icontype: 'custom', label: message.TOOLBAR.PAGEOBJECT_TRANSFORM_OVERLAP_METHOD_JUMP });

        this.el.appendChild(this._itemX.el);
        this.el.appendChild(this._itemY.el);
        this.el.appendChild(formbuilder.separater);
        this.el.appendChild(this._itemSizeWidth.el);
        this.el.appendChild(this._itemSizeHeight.el);
        this.el.appendChild(formbuilder.separater);
        this.el.appendChild(this._itemPaddingLeft.el);
        this.el.appendChild(this._itemPaddingTop.el);
        this.el.appendChild(this._itemPaddingBottom.el);
        this.el.appendChild(this._itemPaddingRight.el);
        this.el.appendChild(formbuilder.separater);
        this.el.appendChild(this._itemBorderLeft.el);
        this.el.appendChild(this._itemBorderTop.el);
        this.el.appendChild(this._itemBorderBottom.el);
        this.el.appendChild(this._itemBorderRight.el);
        this.el.appendChild(formbuilder.separater);
        this.el.appendChild(this._itemOverlapMethodOverlap.el);
        this.el.appendChild(this._itemOverlapMethodFramebox.el);
        this.el.appendChild(this._itemOverlapMethodShape.el);
        this.el.appendChild(this._itemOverlapMethodJump.el);
    }

    protected _initEvent() {
        this._CHANGE$ = new Subject();

        merge(
            this._itemOverlapMethodOverlap.observable.pipe(map(_ => 'overlap')),
            this._itemOverlapMethodFramebox.observable.pipe(map(_ => 'framebox')),
            this._itemOverlapMethodShape.observable.pipe(map(_ => 'shape')),
            this._itemOverlapMethodJump.observable.pipe(map(_ => 'jump'))
        ).subscribe(value => {
            this._itemOverlapMethodOverlap.value = value === 'overlap' ? true : false;
            this._itemOverlapMethodFramebox.value = value === 'framebox' ? true : false;
            this._itemOverlapMethodShape.value = value === 'shape' ? true : false;
            this._itemOverlapMethodJump.value = value === 'jump' ? true : false;
            this._CHANGE$.next({ attr: 'overlap', value });
        });

        merge<any[]>(
            this._itemX.observable.pipe(map(e => ['x', e.value] )),
            this._itemY.observable.pipe(map(e => ['y', e.value] )),
            this._itemSizeWidth.observable.pipe(map(e => ['width', e.value] )),
            this._itemSizeHeight.observable.pipe(map(e => ['height', e.value] )),
            this._itemPaddingLeft.observable.pipe(map(e => ['padding-left', e.value] )),
            this._itemPaddingTop.observable.pipe(map(e => ['padding-top', e.value] )),
            this._itemPaddingBottom.observable.pipe(map(e => ['padding-bottom', e.value] )),
            this._itemPaddingRight.observable.pipe(map(e => ['padding-right', e.value] )),
            this._itemBorderLeft.observable.pipe(map(e => ['border-left', e.value] )),
            this._itemBorderTop.observable.pipe(map(e => ['border-top', e.value] )),
            this._itemBorderBottom.observable.pipe(map(e => ['border-bottom', e.value] )),
            this._itemBorderRight.observable.pipe(map(e => ['border-right', e.value] ))
        ).subscribe(value => {
            this._CHANGE$.next({ attr: value[0], value: U.pt(value[1], accountInfo.frameUnitType).toString() });
        });
    }

    enable() {
        this._itemX.disabled = false;
        this._itemY.disabled = false;
        this._itemSizeWidth.disabled = false;
        this._itemSizeHeight.disabled = false;
        this._itemPaddingLeft.disabled = false;
        this._itemPaddingTop.disabled = false;
        this._itemPaddingBottom.disabled = false;
        this._itemPaddingRight.disabled = false;
        this._itemBorderLeft.disabled = false;
        this._itemBorderTop.disabled = false;
        this._itemBorderBottom.disabled = false;
        this._itemBorderRight.disabled = false;
        // this._itemBorderColor.disabled = false;
        // this._itemBorderStyle.disabled = false;
        this._itemOverlapMethodOverlap.disabled = false;
        this._itemOverlapMethodFramebox.disabled = false;
        this._itemOverlapMethodShape.disabled = false;
        this._itemOverlapMethodJump.disabled = false;

        this.disabled = false;
    }

    disable() {
        this._itemX.disabled = true;
        this._itemY.disabled = true;
        this._itemSizeWidth.disabled = true;
        this._itemSizeHeight.disabled = true;
        this._itemPaddingLeft.disabled = true;
        this._itemPaddingTop.disabled = true;
        this._itemPaddingBottom.disabled = true;
        this._itemPaddingRight.disabled = true;
        this._itemBorderLeft.disabled = true;
        this._itemBorderTop.disabled = true;
        this._itemBorderBottom.disabled = true;
        this._itemBorderRight.disabled = true;
        // this._itemBorderColor.disabled = true;
        // this._itemBorderStyle.disabled = true;
        this._itemOverlapMethodOverlap.disabled = true;
        this._itemOverlapMethodFramebox.disabled = true;
        this._itemOverlapMethodShape.disabled = true;
        this._itemOverlapMethodJump.disabled = true;

        this.disabled = true;
    }

    set value(value: IActaFrameAttribute | null) {
        if (value === null) {
            this._itemX.value = '';
            this._itemY.value = '';
            this._itemSizeWidth.value = '';
            this._itemSizeHeight.value = '';
            this._itemPaddingLeft.value = '';
            this._itemPaddingTop.value = '';
            this._itemPaddingBottom.value = '';
            this._itemPaddingRight.value = '';
            this._itemBorderLeft.value = '';
            this._itemBorderTop.value = '';
            this._itemBorderBottom.value = '';
            this._itemBorderRight.value = '';
            this._itemOverlapMethodOverlap.value = false;
            this._itemOverlapMethodFramebox.value = false;
            this._itemOverlapMethodShape.value = false;
            this._itemOverlapMethodJump.value = false;
            this.disable();
        } else {
            const unit = accountInfo.frameUnitType;
            this._itemX.value = value.x === undefined ? '' : U.convert(unit, value.x).toFixed(2);
            this._itemY.value = value.y === undefined ? '' : U.convert(unit, value.y).toFixed(2);
            this._itemSizeWidth.value = value.width === undefined ? '' : U.convert(unit, value.width).toFixed(2);
            this._itemSizeHeight.value = value.height === undefined ? '' : U.convert(unit, value.height).toFixed(2);
            this._itemPaddingLeft.value = value.paddingLeft === undefined ? '' : U.convert(unit, value.paddingLeft).toFixed(2);
            this._itemPaddingTop.value = value.paddingTop === undefined ? '' : U.convert(unit, value.paddingTop).toFixed(2);
            this._itemPaddingBottom.value = value.paddingBottom === undefined ? '' : U.convert(unit, value.paddingBottom).toFixed(2);
            this._itemPaddingRight.value = value.paddingRight === undefined ? '' : U.convert(unit, value.paddingRight).toFixed(2);
            this._itemBorderLeft.value = value.borderLeft === undefined ? '' : U.convert(unit, value.borderLeft).toFixed(2);
            this._itemBorderTop.value = value.borderTop === undefined ? '' : U.convert(unit, value.borderTop).toFixed(2);
            this._itemBorderBottom.value = value.borderBottom === undefined ? '' : U.convert(unit, value.borderBottom).toFixed(2);
            this._itemBorderRight.value = value.borderRight === undefined ? '' : U.convert(unit, value.borderRight).toFixed(2);
            this._itemOverlapMethodOverlap.value = value.overlapMethod === undefined || value.overlapMethod !== FrameOverlapMethod.OVERLAP ? false : true;
            this._itemOverlapMethodFramebox.value = value.overlapMethod === undefined || value.overlapMethod !== FrameOverlapMethod.FRAMEBOX ? false : true;
            this._itemOverlapMethodShape.value = value.overlapMethod === undefined || value.overlapMethod !== FrameOverlapMethod.SHAPE ? false : true;
            this._itemOverlapMethodJump.value = value.overlapMethod === undefined || value.overlapMethod !== FrameOverlapMethod.JUMP ? false : true;
            this.enable();
        }
    }

    get observable() { return this._CHANGE$; }
    get value() {
        const unit = accountInfo.frameUnitType;
        const retVal: IActaFrameAttribute = {
            x: U.pt(this._itemX.value, unit),
            y: U.pt(this._itemY.value, unit),
            width: U.pt(this._itemSizeWidth.value, unit),
            height: U.pt(this._itemSizeHeight.value, unit),
            paddingLeft: U.pt(this._itemPaddingLeft.value, unit),
            paddingTop: U.pt(this._itemPaddingTop.value, unit),
            paddingBottom: U.pt(this._itemPaddingBottom.value, unit),
            paddingRight: U.pt(this._itemPaddingRight.value, unit),
            borderLeft: U.pt(this._itemBorderLeft.value, unit),
            borderTop: U.pt(this._itemBorderTop.value, unit),
            borderBottom: U.pt(this._itemBorderBottom.value, unit),
            borderRight: U.pt(this._itemBorderRight.value, unit)
        };
        if (this._itemOverlapMethodOverlap.value) retVal.overlapMethod = FrameOverlapMethod.OVERLAP;
        if (this._itemOverlapMethodFramebox.value) retVal.overlapMethod = FrameOverlapMethod.FRAMEBOX;
        if (this._itemOverlapMethodShape.value) retVal.overlapMethod = FrameOverlapMethod.SHAPE;
        if (this._itemOverlapMethodJump.value) retVal.overlapMethod = FrameOverlapMethod.JUMP;

        return retVal;
    }
}
export default ActaToolbarPageObjectTransform;