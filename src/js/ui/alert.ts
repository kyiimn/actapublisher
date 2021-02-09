import IDialog from './idialog';
import message from './message';
import { fromEvent } from 'rxjs';

import '../../css/ui/alert.scss';

export default class ActaUIAlert extends IDialog {
    private _okButton?: HTMLButtonElement;
    private _text?: HTMLElement;

    constructor() {
        super('alert');
    }

    protected _initBody(bodyEl: HTMLElement): void {
        this._text = document.createElement('div');
        bodyEl.appendChild(this._text);
    }
    protected _initButtons(buttonsEl: HTMLElement): void {
        this._okButton = document.createElement('button');
        this._okButton.innerHTML = message.UI.CLOSE;

        buttonsEl.append(this._okButton);
    }

    set text(text: string) {
        if (this._text) this._text.innerHTML = text;
    }

    static async show(text: string, title?: string) {
        const dialog = new this();
        dialog.title = title ? title : message.UI.ALERT;
        dialog.text = text;
        dialog.modal = true;
        dialog.show();

        return new Promise((r, _) => {
            fromEvent(dialog._okButton as HTMLButtonElement, 'click').subscribe(_e => {
                r(true);
                dialog.close();
            });
        });
    }
}