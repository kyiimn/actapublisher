import { ActaGalley } from './galley';
import { ActaClipboard } from '../clipboard';

import { Subject, fromEvent } from 'rxjs';
import { distinctUntilChanged, debounceTime, filter } from 'rxjs/operators';

export class ActaImage extends ActaGalley {
    protected _collision() {
        //this._emitUpdate();
    }

    protected _focus() {
        // this._emitRedrawCursor();
    }

    protected _blur() {
        // this._selectionStart = null;
        // this._removeCursor();
    }

    constructor(x: string | number, y: string | number, width: string | number, height: string | number) {
        super(x, y, width, height);

        this._CHANGE_SIZE$.subscribe(_ => {
            // this._emitUpdate();
        });
    }

    get type() { return 'IMAGE'; }
};
customElements.define('x-image', ActaImage);