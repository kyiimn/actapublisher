import { IActaFrame } from './iframe';
import U from './units';

export enum ImageFitType {
    NONE,
    FILL_FRAME,     // 프레임 채우기(비율X)
    FIT_CONTENT,    // 프레임 채우기(비율)
    FIT_FRAME,      // 프레임 맞추기(비율)
    CENTER          // 가운데
};

export class ActaImage extends IActaFrame {
    private _displayWidth: number | string;
    private _displayHeight: number | string;
    private _displayLeft: number | string;
    private _displayTop: number | string;
    private _displayCanvas: HTMLCanvasElement;
    private _margin: number | string;

    private _fitType: ImageFitType;

    private _originalImage: OffscreenCanvas;
    private _src: string;

    protected _onOverlap() {
        // this._emitUpdate();
    }

    protected _onFocus() {
        // this._emitRedrawCursor();
    }

    protected _onBlur() {
        // this._selectionStart = null;
        // this._removeCursor();
    }

    private _repaint() {
        const ctx = this._displayCanvas.getContext('2d');
        if (!ctx) return;

        this._displayCanvas.width = U.px(this._displayWidth);
        this._displayCanvas.height = U.px(this._displayHeight);
        this._displayCanvas.style.left = U.px(this._displayLeft) + 'px';
        this._displayCanvas.style.top = U.px(this._displayTop) + 'px';

        ctx.drawImage(
            this._originalImage,
            0, 0, this._originalImage.width, this._originalImage.height,
            0, 0, U.px(this._displayWidth), U.px(this._displayHeight)
        );
    }

    private _resize() {
        const orgWidth = this._originalImage.width;
        const orgHeight = this._originalImage.height;
        const computeStyle = window.getComputedStyle(this);

        if (this._fitType === ImageFitType.CENTER) {
            this._displayWidth = orgWidth;
            this._displayHeight = orgHeight;
            this._displayLeft = ((orgWidth - parseInt(computeStyle.width, 10)) / 2) * -1;
            this._displayTop = ((orgHeight - parseInt(computeStyle.height, 10)) / 2) * -1;
        } else if (this._fitType === ImageFitType.FILL_FRAME) {
            this._displayWidth = computeStyle.width;
            this._displayHeight = computeStyle.height;
            this._displayLeft = 0;
            this._displayTop = 0;
        } else if (this._fitType === ImageFitType.FIT_CONTENT) {
            let ratio = parseInt(computeStyle.width, 10) / orgWidth;
            if (orgHeight * ratio > parseInt(computeStyle.height, 10)) {
                ratio = parseInt(computeStyle.height, 10) / orgHeight;
                this._displayWidth = orgWidth * ratio;
                this._displayHeight = orgHeight * ratio;
                this._displayLeft = (parseInt(computeStyle.width, 10) - this._displayWidth) / 2;
                this._displayTop = 0;
            } else {
                this._displayWidth = orgWidth * ratio;
                this._displayHeight = orgHeight * ratio;
                this._displayLeft = 0;
                this._displayTop = (parseInt(computeStyle.height, 10) - this._displayHeight) / 2;
            }
        } else if (this._fitType === ImageFitType.FIT_FRAME) {
            let ratio = parseInt(computeStyle.width, 10) / orgWidth;
            if (orgHeight * ratio < parseInt(computeStyle.height, 10)) {
                ratio = parseInt(computeStyle.height, 10) / orgHeight;
                this._displayWidth = orgWidth * ratio;
                this._displayHeight = orgHeight * ratio;
                this._displayLeft = (parseInt(computeStyle.width, 10) - this._displayWidth) / 2;
                this._displayTop = 0;
            } else {
                this._displayWidth = orgWidth * ratio;
                this._displayHeight = orgHeight * ratio;
                this._displayLeft = 0;
                this._displayTop = (parseInt(computeStyle.height, 10) - this._displayHeight) / 2;
            }
        }
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
                        const tmpCanvas = new OffscreenCanvas(img.width, img.height);
                        const tmpCtx = tmpCanvas.getContext('2d');
                        const realCtx = this._originalImage.getContext('2d');
                        if (tmpCtx && realCtx) {
                            this._originalImage.width = tmpCanvas.width;
                            this._originalImage.height = tmpCanvas.height;
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
            } else {
                resolve(this.src);
            }
        });
    }

    constructor(x: string | number, y: string | number, width: string | number, height: string | number) {
        super(x, y, width, height);

        this._originalImage = new OffscreenCanvas(1, 1);
        this._displayWidth = 0;
        this._displayHeight = 0;
        this._displayLeft = 0;
        this._displayTop = 0;
        this._margin = 0;
        this._src = '';

        this._fitType = ImageFitType.CENTER;

        this._displayCanvas = document.createElement('canvas');
        this._displayCanvas.style.position = 'absolute';
        this.append(this._displayCanvas);

        this._CHANGE_SIZE$.subscribe(_ => {
            this._resize();
            this._repaint();
        });
    }

    preflight() {
        // do implement
    }

    set displayWidth(width) {
        if (this._fitType !== ImageFitType.NONE) return;
        this._displayWidth = width;
        this._repaint();
    }

    set displayHeight(height) {
        if (this._fitType !== ImageFitType.NONE) return;
        this._displayHeight = height;
        this._repaint();
    }

    set displayLeft(left) {
        if (this._fitType !== ImageFitType.NONE) return;
        this._displayLeft = left;
        this._repaint();
    }

    set displayTop(top) {
        if (this._fitType !== ImageFitType.NONE) return;
        this._displayTop = top;
        this._repaint();
    }

    set fitType(fitType: ImageFitType) {
        this._fitType = fitType;
        if (this._fitType !== ImageFitType.NONE) {
            this._resize();
            this._repaint();
        }
    }

    set margin(margin: number | string) {
        this._margin = margin;
        this._EMIT_CHANGE_SIZE();
    }

    set src(src: string) {
        this._src = src;
        this._loadImage().then(_ => {
            this._resize();
            this._repaint();
        });
    }

    get displayWidth() { return this._displayWidth; }
    get displayHeight() { return this._displayHeight; }
    get displayLeft() { return this._displayLeft; }
    get displayTop() { return this._displayTop; }
    get fitType() { return this._fitType; }
    get src() { return this._src; }

    get type() { return 'IMAGE'; }
};
customElements.define('x-image', ActaImage);