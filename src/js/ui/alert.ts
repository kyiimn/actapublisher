import Dialog from './dialog';
import message from './message';

import '../../css/ui/alert.scss';

export default class ActaUIAlert extends Dialog {
    private _text?: HTMLElement;

    constructor() {
        super('alert');
    }

    protected _initBody(bodyEl: HTMLElement): void {
        this._text = document.createElement('div');
        bodyEl.appendChild(this._text);
    }
    protected _initButtons(buttonsEl: HTMLElement): void {
        const okbtn = document.createElement('button');
        okbtn.innerHTML = message.UI.CLOSE;
        okbtn.onclick = e => {
            this.close();
        };
        buttonsEl.append(okbtn);
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