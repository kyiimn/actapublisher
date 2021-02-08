import IDialog from './idialog';
import message from './message';
import { fromEvent } from 'rxjs';

import '../../css/ui/alert.scss';

export default class ActaUIConfirm extends IDialog {
    public static readonly OKCANCEL = 2;
    public static readonly YESNO = 1;

    private _okButton?: HTMLButtonElement;
    private _cancelButton?: HTMLButtonElement;
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

        this._cancelButton = document.createElement('button');
        fromEvent(this._cancelButton, 'click').subscribe(_ => { this.close(); });

        buttonsEl.append(this._okButton);
        buttonsEl.append(this._cancelButton);
    }

    set text(text: string) {
        if (this._text) this._text.innerHTML = text;
    }

    static async show(text: string, type?: number, title?: string) {
        const dialog = new this();
        if (type !== 0) {
            if (dialog._okButton) dialog._okButton.innerHTML = message.UI.YES;
            if (dialog._cancelButton) dialog._cancelButton.innerHTML = message.UI.NO;
        } else {
            if (dialog._okButton) dialog._okButton.innerHTML = message.UI.OK;
            if (dialog._cancelButton) dialog._cancelButton.innerHTML = message.UI.CANCEL;
        }
        dialog.title = title ? title : message.UI.CONFIRM;
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