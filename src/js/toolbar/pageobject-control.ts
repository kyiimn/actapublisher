import message from '../ui/message';
import formbuilder from '../ui/form';
import accountInfo from '../info/account';
import U from '../util/units';

import { merge, Subject } from 'rxjs';
import { map } from 'rxjs/operators';

class ActaToolbarPageObjectControl {
    private _toolbar: HTMLUListElement;
    private _itemFlipToBack;
    private _itemFlipToFront;
    private _itemAlignCenter;
    private _itemAlignLeft;
    private _itemAlignRight;
    private _itemVAlignMiddle;
    private _itemVAlignTop;
    private _itemVAlignBottom;
    private _itemMoveLeft;
    private _itemMoveUp;
    private _itemMoveDown;
    private _itemMoveRight;
    private _itemMoveStep1;
    private _itemMoveLeftUp;
    private _itemMoveRightUp;
    private _itemMoveLeftDown;
    private _itemMoveRightDown;
    private _itemMoveStep2;
    private _itemRotateLeft;
    private _itemRotateRight;
    private _itemRotateStep;
    private _itemRemove;

    private _CLICK$: Subject<{ action: string, step?: number }>;

    constructor() {
        this._CLICK$ = new Subject();

        this._toolbar = document.createElement('ul');
        this._toolbar.classList.add('toolbar');
        this._toolbar.classList.add('pageobject-control');

        this._itemFlipToBack = formbuilder.iconButton({ attr: { action: 'flip-to-back' }, icon: 'flip_to_back', icontype: 'material', label: message.TOOLBAR.PAGEOBJECT_CONTROL_FLIP_TO_BACK });
        this._itemFlipToFront = formbuilder.iconButton({ attr: { action: 'flip-to-front' }, icon: 'flip_to_front', icontype: 'material', label: message.TOOLBAR.PAGEOBJECT_CONTROL_FLIP_TO_FRONT });
        this._itemAlignCenter = formbuilder.iconButton({ attr: { action: 'align-center' }, icon: 'align_horizontal_center', icontype: 'material', label: message.TOOLBAR.PAGEOBJECT_CONTROL_ALIGN_CENTER });
        this._itemAlignLeft = formbuilder.iconButton({ attr: { action: 'align-left' }, icon: 'align_horizontal_left', icontype: 'material', label: message.TOOLBAR.PAGEOBJECT_CONTROL_ALIGN_LEFT });
        this._itemAlignRight = formbuilder.iconButton({ attr: { action: 'align-right' }, icon: 'align_horizontal_right', icontype: 'material', label: message.TOOLBAR.PAGEOBJECT_CONTROL_ALIGN_RIGHT });
        this._itemVAlignMiddle = formbuilder.iconButton({ attr: { action: 'valign-middle' }, icon: 'align_vertical_center', icontype: 'material', label: message.TOOLBAR.PAGEOBJECT_CONTROL_VALIGN_MIDDLE });
        this._itemVAlignTop = formbuilder.iconButton({ attr: { action: 'valign-top' }, icon: 'align_vertical_top', icontype: 'material', label: message.TOOLBAR.PAGEOBJECT_CONTROL_VALIGN_TOP });
        this._itemVAlignBottom = formbuilder.iconButton({ attr: { action: 'valign-bottom' }, icon: 'align_vertical_bottom', icontype: 'material', label: message.TOOLBAR.PAGEOBJECT_CONTROL_VALIGN_BOTTOM });
        this._itemMoveLeft = formbuilder.iconButton({ attr: { action: 'move-left' }, icon: 'arrow_back', icontype: 'material', label: message.TOOLBAR.PAGEOBJECT_CONTROL_MOVE_LEFT });
        this._itemMoveUp = formbuilder.iconButton({ attr: { action: 'move-up' }, icon: 'arrow_upward', icontype: 'material', label: message.TOOLBAR.PAGEOBJECT_CONTROL_MOVE_UP });
        this._itemMoveDown = formbuilder.iconButton({ attr: { action: 'move-down' }, icon: 'arrow_downward', icontype: 'material', label: message.TOOLBAR.PAGEOBJECT_CONTROL_MOVE_DOWM });
        this._itemMoveRight = formbuilder.iconButton({ attr: { action: 'move-right' }, icon: 'arrow_forward', icontype: 'material', label: message.TOOLBAR.PAGEOBJECT_CONTROL_MOVE_RIGHT });
        this._itemMoveStep1 = formbuilder.inputNumber({ attr: { action: 'move-unit' }, label: message.TOOLBAR.PAGEOBJECT_CONTROL_MOVE_STEP, width: '3.6em', step: .01, min: 0 });
        this._itemMoveLeftUp = formbuilder.iconButton({ attr: { action: 'move-leftup' }, icon: 'north_west', icontype: 'material', label: message.TOOLBAR.PAGEOBJECT_CONTROL_MOVE_LEFTUP });
        this._itemMoveRightUp = formbuilder.iconButton({ attr: { action: 'move-rightup' }, icon: 'north_east', icontype: 'material', label: message.TOOLBAR.PAGEOBJECT_CONTROL_MOVE_RIGHTUP });
        this._itemMoveLeftDown = formbuilder.iconButton({ attr: { action: 'move-leftdown' }, icon: 'south_west', icontype: 'material', label: message.TOOLBAR.PAGEOBJECT_CONTROL_MOVE_LEFTDOWN });
        this._itemMoveRightDown = formbuilder.iconButton({ attr: { action: 'move-rightdown' }, icon: 'south_east', icontype: 'material', label: message.TOOLBAR.PAGEOBJECT_CONTROL_MOVE_RIGHTDOWN });
        this._itemMoveStep2 = formbuilder.inputNumber({ attr: { action: 'move-munit' }, label: message.TOOLBAR.PAGEOBJECT_CONTROL_MOVE_STEP, width: '3.6em', step: .01, min: 0 });
        this._itemRotateLeft = formbuilder.iconButton({ attr: { action: 'rotate-left' }, icon: 'rotate_left', icontype: 'material', label: message.TOOLBAR.PAGEOBJECT_CONTROL_ROTATE_LEFT });
        this._itemRotateRight = formbuilder.iconButton({ attr: { action: 'rotate-right' }, icon: 'rotate_right', icontype: 'material', label: message.TOOLBAR.PAGEOBJECT_CONTROL_ROTATE_RIGHT });
        this._itemRotateStep = formbuilder.inputNumber({ attr: { action: 'rotate-munit' }, label: message.TOOLBAR.PAGEOBJECT_CONTROL_ROTATE_STEP, suffix: '˚', width: '3.6em', step: .1, min: -360, max: 360 });
        this._itemRemove = formbuilder.iconButton({ attr: { action: 'remove' }, icon: 'delete', icontype: 'material', label: message.TOOLBAR.PAGEOBJECT_CONTROL_REMOVE });

        this._itemMoveStep1.value = '2';
        this._itemMoveStep2.value = '2';
        this._itemRotateStep.value = '90';

        this._toolbar.appendChild(this._itemFlipToBack.el);
        this._toolbar.appendChild(this._itemFlipToFront.el);
        this._toolbar.appendChild(formbuilder.separater);
        this._toolbar.appendChild(this._itemAlignCenter.el);
        this._toolbar.appendChild(this._itemAlignLeft.el);
        this._toolbar.appendChild(this._itemAlignRight.el);
        this._toolbar.appendChild(formbuilder.separater);
        this._toolbar.appendChild(this._itemVAlignMiddle.el);
        this._toolbar.appendChild(this._itemVAlignTop.el);
        this._toolbar.appendChild(this._itemVAlignBottom.el);
        this._toolbar.appendChild(formbuilder.separater);
        this._toolbar.appendChild(this._itemMoveLeft.el);
        this._toolbar.appendChild(this._itemMoveUp.el);
        this._toolbar.appendChild(this._itemMoveDown.el);
        this._toolbar.appendChild(this._itemMoveRight.el);
        this._toolbar.appendChild(this._itemMoveStep1.el);
        this._toolbar.appendChild(formbuilder.separater);
        this._toolbar.appendChild(this._itemMoveLeftUp.el);
        this._toolbar.appendChild(this._itemMoveRightUp.el);
        this._toolbar.appendChild(this._itemMoveLeftDown.el);
        this._toolbar.appendChild(this._itemMoveRightDown.el);
        this._toolbar.appendChild(this._itemMoveStep2.el);
        this._toolbar.appendChild(formbuilder.separater);
        this._toolbar.appendChild(this._itemRotateLeft.el);
        this._toolbar.appendChild(this._itemRotateRight.el);
        this._toolbar.appendChild(this._itemRotateStep.el);
        this._toolbar.appendChild(formbuilder.separater);
        this._toolbar.appendChild(this._itemRemove.el);

        merge(
            this._itemFlipToBack.observable.pipe(map(_ => 'flip-to-back')),
            this._itemFlipToFront.observable.pipe(map(_ => 'flip-to-front')),
            this._itemAlignCenter.observable.pipe(map(_ => 'align-center')),
            this._itemAlignLeft.observable.pipe(map(_ => 'align-left')),
            this._itemAlignRight.observable.pipe(map(_ => 'align-right')),
            this._itemVAlignMiddle.observable.pipe(map(_ => 'valign-middle')),
            this._itemVAlignTop.observable.pipe(map(_ => 'valign-top')),
            this._itemVAlignBottom.observable.pipe(map(_ => 'valign-bottom')),
            this._itemRemove.observable.pipe(map(_ => 'remove')),
        ).subscribe(action => {
            this._CLICK$.next({ action });
        });

        merge(
            this._itemMoveLeft.observable.pipe(map(_ => 'move-left')),
            this._itemMoveUp.observable.pipe(map(_ => 'move-up')),
            this._itemMoveDown.observable.pipe(map(_ => 'move-down')),
            this._itemMoveRight.observable.pipe(map(_ => 'move-right'))
        ).subscribe(action => {
            this._CLICK$.next({ action, step: U.px(this._itemMoveStep1.value, accountInfo.prefFrameUnitType) });
        });

        merge(
            this._itemMoveLeftUp.observable.pipe(map(_ => 'move-leftup')),
            this._itemMoveRightUp.observable.pipe(map(_ => 'move-rightup')),
            this._itemMoveRightDown.observable.pipe(map(_ => 'move-rightdown')),
            this._itemMoveLeftDown.observable.pipe(map(_ => 'move-leftdown'))
        ).subscribe(action => {
            this._CLICK$.next({ action, step: U.px(this._itemMoveStep2.value, accountInfo.prefFrameUnitType) });
        });

        merge(
            this._itemRotateLeft.observable.pipe(map(_ => 'rotate-left')),
            this._itemRotateRight.observable.pipe(map(_ => 'rotate-right'))
        ).subscribe(action => {
            this._CLICK$.next({ action, step: parseFloat(this._itemRotateStep.value) });
        });
    }

    get el() { return this._toolbar; }
}
export default ActaToolbarPageObjectControl;