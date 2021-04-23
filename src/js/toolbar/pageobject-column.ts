import message from '../ui/message';
import formbuilder from '../ui/form';
import accountInfo from '../info/account';
import U from '../util/units';

import { IActaEditorParagraphColumnAttribute } from '../editor/editor';
import { Subject } from 'rxjs';

type CHANGE_ATTR = 'columncount' | 'innermargin';

class ActaToolbarText {
    private _toolbar: HTMLUListElement;
    private _itemColumnCount;
    private _itemInnerMargin;

    private _disabled: boolean;

    private _CHANGE$: Subject<{ attr: CHANGE_ATTR, value: IActaEditorParagraphColumnAttribute }>;

    constructor() {
        this._CHANGE$ = new Subject();

        this._disabled = false;

        this._toolbar = document.createElement('ul');
        this._toolbar.classList.add('toolbar');
        this._toolbar.classList.add('pageobject-column');

        this._itemColumnCount = formbuilder.inputNumber({ icon: 'columns', icontype: 'fas', label: message.TOOLBAR.PAGEOBJECT_COLUMN_COUNT, width: '4.2em', step: 1, min: 1 });
        this._itemInnerMargin = formbuilder.inputNumber({ icon: 'vertical_align_center', icontype: 'material', iconrotate: 90, label: message.TOOLBAR.PAGEOBJECT_COLUMN_INNERMARGIN, width: '4.2em', step: .01, min: 0 });

        this._toolbar.appendChild(this._itemColumnCount.el);
        this._toolbar.appendChild(this._itemInnerMargin.el);

        this._itemColumnCount.observable.subscribe(_ => this._changeValues('columncount'));
        this._itemInnerMargin.observable.subscribe(_ => this._changeValues('innermargin'));
    }

    private _changeValues(attr: CHANGE_ATTR) {
        if (this.data) this._CHANGE$.next({ attr, value: this.data });
    }

    enable() {
        this._itemColumnCount.disabled = false;
        this._itemInnerMargin.disabled = false;

        this._disabled = false;
    }

    disable() {
        this._itemColumnCount.disabled = true;
        this._itemInnerMargin.disabled = true;

        this._disabled = true;
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
    get disabled() { return this._disabled; }
    get el() { return this._toolbar; }
}
export default ActaToolbarText;