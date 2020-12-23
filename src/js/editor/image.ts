import { ActaGalley } from './galley';
import { ActaClipboard } from '../clipboard';

import { Subject, fromEvent } from 'rxjs';
import { distinctUntilChanged, debounceTime, filter } from 'rxjs/operators';

export class ActaImage extends ActaGalley {
    private _originalImage: OffscreenCanvas;
    private _displayWidth: number | string;
    private _displayHeight: number | string;
    private _displayLeft: number | string;
    private _displayTop: number | string;

    private _src: string;

    private _REPAINT$: Subject<undefined>;

    /* override */
    static get observedAttributes() {
        return super.observedAttributes.concat(['src']);
    }

    /* override */
    attributeChangedCallback(name: string, oldValue: string, newValue: string) {
        super.attributeChangedCallback(name, oldValue, newValue);
        if (oldValue === newValue) return;
        if (name === 'src') this.src = newValue;
    }

    protected _onCollision() {
        // this._emitUpdate();
    }

    protected _onFocus() {
        // this._emitRedrawCursor();
    }

    protected _onBlur() {
        // this._selectionStart = null;
        // this._removeCursor();
    }

    private _EMIT_REPAINT() {
        this._REPAINT$.next();
    }

    private _repaint() {

    }

    private _loadImage() {
        return new Promise((resolve, reject) => {
            if (this.src !== '') {
                const name = (this.src.lastIndexOf('.') > 0) ? this.src.substr(0, this.src.lastIndexOf('.')) : this.src;
                const ext = ((this.src.lastIndexOf('.') > 0) ? this.src.substr(this.src.lastIndexOf('.') + 1) : '').toLowerCase();
                if (ext === 'eps') {
                    const img = new Image();
                    img.src = name + '.jpg';
                    img.onload = _e => {
                        const tmpCanvas = new OffscreenCanvas(1, 1);
                        const tmpCtx = tmpCanvas.getContext('2d');
                        const realCtx = this._originalImage.getContext('2d');
                        if (tmpCtx && realCtx) {
                            this._originalImage.width = tmpCanvas.width = img.width;
                            this._originalImage.height = tmpCanvas.height = img.height;
                            tmpCtx.drawImage(img, 0, 0);

                            const maskImg = new Image();
                            maskImg.src = name + '.svg';
                            maskImg.onload = _me => {
                                tmpCtx.globalCompositeOperation = "destination-in";
                                tmpCtx.drawImage(maskImg, 0, 0);
                                tmpCtx.globalCompositeOperation = "none";

                                realCtx.drawImage(tmpCanvas, 0, 0);
                                resolve(this.src);
                            };
                            maskImg.onerror = _me => {
                                realCtx.drawImage(tmpCanvas, 0, 0);
                                resolve(this.src);
                            };
                        } else {
                            reject();
                        }
                    };
                    img.onerror = e => reject;
                } else {
                    const img = new Image();
                    img.src = this.src;
                    img.onload = _e => {
                        const ctx = this._originalImage.getContext('2d');
                        if (ctx) {
                            this._originalImage.width = img.width;
                            this._originalImage.height = img.height;
                            ctx.drawImage(img, 0, 0);
                            resolve(this.src);
                        } else {
                            reject();
                        }
                    };
                    img.onerror = _e => reject;
                }
            }
            resolve(this.src);
        });
    }

    constructor(x: string | number, y: string | number, width: string | number, height: string | number) {
        super(x, y, width, height);

        this._originalImage = new OffscreenCanvas(1, 1);
        this._displayWidth = 0;
        this._displayHeight = 0;
        this._displayLeft = 0;
        this._displayTop = 0;
        this._src = '';

        this._REPAINT$ = new Subject();
        this._REPAINT$.pipe(debounceTime(.005)).subscribe(() => this._repaint());

        this._CHANGE_SIZE$.subscribe(_ => {
            this._EMIT_REPAINT();
        });
    }

    set src(src: string) {
        this._src = src;
        this._loadImage().then(_ => this._EMIT_REPAINT);
    }

    get src() {
        return this._src;
    }

    get type() { return 'IMAGE'; }
};
customElements.define('x-image', ActaImage);