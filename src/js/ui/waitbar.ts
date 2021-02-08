import IDialog from './idialog';

import '../../css/ui/waitbar.scss';

export default class ActaUIWaitbar extends IDialog {
    constructor() {
        super('waitbar');
    }

    protected _initBody(bodyEl: HTMLElement) {
        const el = document.createElement('div');
        for (let i = 0; i < 12; i++) {
            el.append(
                document.createElement('div')
            );
        }
        el.classList.add('lds-spinner');

        bodyEl.appendChild(el);
    }

    protected _initButtons(_: HTMLElement) {
        /* nothing... */
    }

    static show() {
        const dialog = new this();
        dialog.modal = true;
        dialog.show();
        return dialog;
    }
}