import { fromEvent, Observable, Subscription } from 'rxjs';
import { filter } from 'rxjs/operators';
import '../../css/ui/dialog.scss';

import dialogPolyfill from 'dialog-polyfill';
export default abstract class IActaUIDialog {
    private _titlebar: HTMLDivElement;
    private _body: HTMLDivElement;
    private _buttons: HTMLDivElement;
    private _dialog: HTMLDialogElement;
    private _modal: boolean;

    private _ESCAPE$: Subscription;

    constructor(className?: string) {
        this._titlebar = document.createElement('div');
        this._body = document.createElement('div');
        this._buttons = document.createElement('div');

        this._titlebar.classList.add('titlebar');
        this._body.classList.add('body');
        this._buttons.classList.add('buttons');

        this._modal = false;

        this._dialog = document.createElement('dialog');
        dialogPolyfill.registerDialog(this._dialog);

        if (className) this._dialog.classList.add(className);

        this._dialog.appendChild(this._titlebar);
        this._dialog.appendChild(this._body);
        this._dialog.appendChild(this._buttons);

        this._initBody(this._body);
        this._initButtons(this._buttons);

        this._ESCAPE$ = fromEvent<KeyboardEvent>(document.body, 'keydown').pipe(filter(e => e.keyCode === 27)).subscribe(e => {
            this.close();
            e.stopPropagation();
            e.preventDefault();
        });
        document.body.appendChild(this._dialog);
    }

    protected show() {
        if (this._modal) {
            if (typeof this._dialog.showModal === 'function') {
                this._dialog.showModal();
            } else {
                this._dialog.show();
            }
        } else {
            this._dialog.show();
        }
    }

    protected hide() {
        this._dialog.removeAttribute('open');
    }

    protected abstract _initBody(bodyEl: HTMLElement): void;
    protected abstract _initButtons(buttonsEl: HTMLElement): void;

    protected get modal() { return this._modal; }
    protected set modal(modal) {
        this._modal = modal;
    }

    protected get title() { return this._titlebar.innerHTML; }
    protected set title(title: string) { this._titlebar.innerHTML = title; }

    close() {
        this._ESCAPE$.unsubscribe();
        document.body.removeChild(this._dialog);
    }
}