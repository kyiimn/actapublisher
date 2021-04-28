import IActaToolbar from './toolbar';

import message from '../ui/message';
import formbuilder, { ActaUIFormInputItem } from '../ui/form';
import accountInfo from '../info/account';
import U from '../util/units';

import { IActaEditorParagraphColumnAttribute } from '../editor/editor';
import { Subject } from 'rxjs';

type CHANGE_ATTR = 'columncount' | 'innermargin';

class ActaToolbarText extends IActaToolbar {
    private _itemColumnCount!: ActaUIFormInputItem;
    private _itemInnerMargin!: ActaUIFormInputItem;

    private _CHANGE$!: Subject<{ attr: CHANGE_ATTR, value: IActaEditorParagraphColumnAttribute }>;

    protected _initToolbar() {
        this._CHANGE$ = new Subject();

        this.el.classList.add('pageobject-column');

        this._itemColumnCount = formbuilder.inputNumber({ icon: 'columns', icontype: 'fas', label: message.TOOLBAR.PAGEOBJECT_COLUMN_COUNT, width: '4.2em', step: 1, min: 1 });
        this._itemInnerMargin = formbuilder.inputNumber({ icon: 'vertical_align_center', icontype: 'material', iconrotate: 90, label: message.TOOLBAR.PAGEOBJECT_COLUMN_INNERMARGIN, width: '4.2em', step: .01, min: 0 });

        this.el.appendChild(this._itemColumnCount.el);
        this.el.appendChild(this._itemInnerMargin.el);
    }

    protected _initEvent() {
        this._itemColumnCount.observable.subscribe(_ => this._changeValues('columncount'));
        this._itemInnerMargin.observable.subscribe(_ => this._changeValues('innermargin'));
    }

    private _changeValues(attr: CHANGE_ATTR) {
        if (this.data) this._CHANGE$.next({ attr, value: this.data });
    }

    enable() {
        this._itemColumnCount.disabled = false;
        this._itemInnerMargin.disabled = false;

        this.disabled = false;
    }

    disable() {
        this._itemColumnCount.disabled = true;
        this._itemInnerMargin.disabled = true;

        this.disabled = true;
    }

    set data(data: IActaEditorParagraphColumnAttribute | null) {
        const unit = accountInfo.frameUnitType;

        if (data) {
            this._itemColumnCount.value = data.columnCount === undefined ? '' : (data.columnCount).toString();
            this._itemInnerMargin.value = data.innerMargin === undefined ? '' : U.convert(unit, data.innerMargin).toFixed(2);
            this.enable();
        } else {
            this._itemColumnCount.value = '';
            this._itemInnerMargin.value = '';
            this.disable();
        }
    }

    get data() {
        const data: IActaEditorParagraphColumnAttribute = {};
        const unit = accountInfo.frameUnitType;

        data.columnCount = this._itemColumnCount.value !== '' ? parseInt(this._itemColumnCount.value, 10) : undefined;
        data.innerMargin = this._itemInnerMargin.value !== '' ? U.pt(this._itemInnerMargin.value, unit) : undefined;

        return data;
    }

    get observable() { return this._CHANGE$; }
}
export default ActaToolbarText;