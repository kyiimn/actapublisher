import message from '../ui/message';
import formbuilder from '../ui/form';

import { merge, Subject } from 'rxjs';

interface IActaToolbarDocumentStatusData {
    scale?: number
}

class ActaToolbarDocumentStatus {
    private _toolbar: HTMLUListElement;
    private _itemScale;

    private _CHANGE$: Subject<{ action: string, value: any }>;

    private _disabled: boolean;

    constructor() {
        this._CHANGE$ = new Subject();

        this._disabled = false;

        this._toolbar = document.createElement('ul');
        this._toolbar.classList.add('toolbar');
        this._toolbar.classList.add('document-status');

        this._itemScale = formbuilder.inputNumber({ attr: { action: 'scale' }, label: message.TOOLBAR.DOCUMENTSTATUS_SCALE, width: '3.6em', suffix: '%', step: 1, min: 5 });
        this._itemScale.value = '100';

        this._toolbar.appendChild(this._itemScale.el);

        this._itemScale.observable.subscribe(data => {
            this._CHANGE$.next({ action: 'scale', value: data.value });
        });
    }

    enable() {
        this._itemScale.disabled = false;

        this._disabled = false;
    }

    disable() {
        this._itemScale.disabled = true;

        this._disabled = true;
    }

    set data(data: IActaToolbarDocumentStatusData) {
        if (data.scale !== undefined) this._itemScale.value = data.scale.toString();
    }

    get data() {
        return {
            scale: parseInt(this._itemScale.value, 10)
        };
    }

    get observable() { return this._CHANGE$; }
    get disabled() { return this._disabled; }
    get el() { return this._toolbar; }
}
export default ActaToolbarDocumentStatus;