import '../../css/ui/dialog.scss';
import { fromEvent, merge } from 'rxjs';
import { filter } from 'rxjs/operators';

export default abstract class ActaUIDialog {
    private _titlebar: HTMLDivElement;
    private _body: HTMLDivElement;
    private _buttons: HTMLDivElement;
    private _dialog: HTMLDialogElement;
    private _modal: boolean;

    private _moveable: boolean;
    private _moveBeforeLeft?: number;
    private _moveBeforeTop?: number;

    constructor(className?: string) {
        this._titlebar = document.createElement('div');
        this._body = document.createElement('div');
        this._buttons = document.createElement('div');

        this._titlebar.classList.add('titlebar');
        this._body.classList.add('body');
        this._buttons.classList.add('buttons');

        this._modal = false;

        this._dialog = document.createElement('dialog');
        if (className) this._dialog.classList.add(className);
        this._dialog.appendChild(this._titlebar);
        this._dialog.appendChild(this._body);
        this._dialog.appendChild(this._buttons);

        this._initBody(this._body);
        this._initButtons(this._buttons);

        document.body.appendChild(this._dialog);

        this._moveable = false;

        fromEvent<MouseEvent>(this._titlebar, 'mousedown').subscribe(e => {
            this._moveable = true;
            this._moveBeforeLeft = e.screenX;
            this._moveBeforeTop = e.screenY;
            e.stopPropagation();
        });
        fromEvent<MouseEvent>(this._dialog, 'mousemove').pipe(filter(_ => this._moveable)).subscribe(e => {
            const dLeft = (this._moveBeforeLeft || 0) - e.screenX;
            const dTop = (this._moveBeforeTop || 0) - e.screenY;
            const nLeft = this._dialog.clientLeft;
            const nTop = this._dialog.clientTop;

            console.log(dLeft, dTop, nLeft, nTop);

            this._moveBeforeLeft = e.screenX;
            this._moveBeforeTop = e.screenY;

            this._dialog.style.top = `${nTop - dTop}px`;
            this._dialog.style.left = `${nLeft - dLeft}px`;

            e.stopPropagation();
        });
        merge(
            fromEvent(this._titlebar, 'mouseup'),
            fromEvent(this._titlebar, 'mouseout')
        ).subscribe(e => {
            this._moveable = false;
            e.stopPropagation();
        });
    }

    close() {
        document.body.removeChild(this._dialog);
    }

    show() {
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

    hide() {
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
}