import { IActaFrameAttribute, FrameOverlapMethod } from '../pageobject/interface/frame';

import message from '../ui/message';
import formbuilder from '../ui/form';
import accountInfo from '../info/account';
import U from '../util/units';

import { merge, Subject } from 'rxjs';
import { map } from 'rxjs/operators';

type CHANGE_ATTR = 'overlap' | 'width' | 'height' | 'padding-left' | 'padding-top' | 'padding-bottom' | 'padding-right' | 'border-left' | 'border-top' | 'border-bottom' | 'border-right' | 'border-color' | 'border-style';

class ActaToolbarPageObjectTransform {
    private _toolbar: HTMLUListElement;
    private _itemSizeWidth;
    private _itemSizeHeight;
    private _itemPaddingLeft;
    private _itemPaddingTop;
    private _itemPaddingBottom;
    private _itemPaddingRight;
    private _itemBorderLeft;
    private _itemBorderTop;
    private _itemBorderBottom;
    private _itemBorderRight;
    // private _itemBorderColor;
    // private _itemBorderStyle;
    private _itemOverlapMethodOverlap;
    private _itemOverlapMethodFramebox;
    private _itemOverlapMethodShape;
    private _itemOverlapMethodJump;

    private _disabled: boolean;

    private _CHANGE$: Subject<{ attr: CHANGE_ATTR, value: string }>;

    constructor() {
        this._CHANGE$ = new Subject();

        this._disabled = false;

        this._toolbar = document.createElement('ul');
        this._toolbar.classList.add('toolbar');
        this._toolbar.classList.add('pageobject-transform');

        this._itemSizeWidth = formbuilder.inputNumber({ attr: { action: 'width' }, icon: 'arrows-alt-h', icontype: 'fas', label: message.TOOLBAR.PAGEOBJECT_TRANSFORM_WIDTH, width: '3.6em', step: .01, min: 0 });
        this._itemSizeHeight = formbuilder.inputNumber({ attr: { action: 'height' }, icon: 'arrows-alt-v', icontype: 'fas', label: message.TOOLBAR.PAGEOBJECT_TRANSFORM_HEIGHT, width: '3.6em', step: .01, min: 0 });
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

        this._toolbar.appendChild(this._itemSizeWidth.el);
        this._toolbar.appendChild(this._itemSizeHeight.el);
        this._toolbar.appendChild(formbuilder.separater);
        this._toolbar.appendChild(this._itemPaddingLeft.el);
        this._toolbar.appendChild(this._itemPaddingTop.el);
        this._toolbar.appendChild(this._itemPaddingBottom.el);
        this._toolbar.appendChild(this._itemPaddingRight.el);
        this._toolbar.appendChild(formbuilder.separater);
        this._toolbar.appendChild(this._itemBorderLeft.el);
        this._toolbar.appendChild(this._itemBorderTop.el);
        this._toolbar.appendChild(this._itemBorderBottom.el);
        this._toolbar.appendChild(this._itemBorderRight.el);
        this._toolbar.appendChild(formbuilder.separater);
        this._toolbar.appendChild(this._itemOverlapMethodOverlap.el);
        this._toolbar.appendChild(this._itemOverlapMethodFramebox.el);
        this._toolbar.appendChild(this._itemOverlapMethodShape.el);
        this._toolbar.appendChild(this._itemOverlapMethodJump.el);

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
            this._itemSizeWidth.observable.pipe(map(e => [ 'width', e.value] )),
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

        this._disabled = false;
    }

    disable() {
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

        this._disabled = true;
    }

    set value(value: IActaFrameAttribute | null) {
        const unit = accountInfo.frameUnitType;

        if (value === null) {
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
    get disabled() { return this._disabled; }
    get value() {
        const retVal: IActaFrameAttribute = {
            width: this._itemSizeWidth.value,
            height: this._itemSizeHeight.value,
            paddingLeft: this._itemPaddingLeft.value,
            paddingTop: this._itemPaddingTop.value,
            paddingBottom: this._itemPaddingBottom.value,
            paddingRight: this._itemPaddingRight.value,
            borderLeft: this._itemBorderLeft.value,
            borderTop: this._itemBorderTop.value,
            borderBottom: this._itemBorderBottom.value,
            borderRight: this._itemBorderRight.value
        };
        if (this._itemOverlapMethodOverlap.value) retVal.overlapMethod = FrameOverlapMethod.OVERLAP;
        if (this._itemOverlapMethodFramebox.value) retVal.overlapMethod = FrameOverlapMethod.FRAMEBOX;
        if (this._itemOverlapMethodShape.value) retVal.overlapMethod = FrameOverlapMethod.SHAPE;
        if (this._itemOverlapMethodJump.value) retVal.overlapMethod = FrameOverlapMethod.JUMP;

        return retVal;
    }
    get el() { return this._toolbar; }
}
export default ActaToolbarPageObjectTransform;