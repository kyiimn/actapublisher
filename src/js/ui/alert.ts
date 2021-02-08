import IDialog from './idialog';
import message from './message';
import { fromEvent } from 'rxjs';

import '../../css/ui/alert.scss';

export default class ActaUIAlert extends IDialog {
    private _text?: HTMLElement;

    constructor() {
        super('alert');
    }

    protected _initBody(bodyEl: HTMLElement): void {
        this._text = document.createElement('div');
        bodyEl.appendChild(this._text);
    }
    protected _initButtons(buttonsEl: HTMLElement): void {
        const okButton = document.createElement('button');
        okButton.innerHTML = message.UI.CLOSE;
        fromEvent(okButton, 'click').subscribe(_ => { this.close(); });

        buttonsEl.append(okButton);
    }

    set text(text: string) {
        if (this._text) this._text.innerHTML = text;
    }

    static show(text: string, title?: string) {
        const dialog = new this();
        dialog.title = title ? title : message.UI.ALERT;
        dialog.text = text;
        dialog.modal = true;
        dialog.show();
    }
}