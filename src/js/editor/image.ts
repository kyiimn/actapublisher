import { IActaFrame } from './iframe';
import U from './units';

export enum ImageFitType {
    NONE,
    FILL_FRAME,     // 프레임 채우기(비율X)
    FIT_CONTENT,    // 프레임 채우기(비율)
    FIT_FRAME,      // 프레임 맞추기(비율)
    CENTER          // 가운데
};

export enum ImageOverlapMethod {
    OVERLAP,        // 겹치기
    FRAMEBOX,       // 프레임박스
    SHAPE,          // 그림 테두리따라
    JUMP            // 라인점프
};

export class ActaImage extends IActaFrame {
    private _displayWidth: number | string;
    private _displayHeight: number | string;
    private _displayLeft: number | string;
    private _displayTop: number | string;
    private _displayCanvas: HTMLCanvasElement;
    private _mask: boolean;

    private _fitType: ImageFitType;
    private _overlapMethod: ImageOverlapMethod;

    private _originalCanvas: OffscreenCanvas | null;
    private _src: string;

    private _repaint() {
        const ctx = this._displayCanvas.getContext('2d');
        if (!ctx) return;

        this._displayCanvas.width = U.px(this._displayWidth);
        this._displayCanvas.height = U.px(this._displayHeight);
        this._displayCanvas.style.left = U.px(this._displayLeft) + 'px';
        this._displayCanvas.style.top = U.px(this._displayTop) + 'px';

        if (this._originalCanvas) {
            ctx.drawImage(
                this._originalCanvas,
                0, 0, this._originalCanvas.width, this._originalCanvas.height,
                0, 0, U.px(this._displayWidth), U.px(this._displayHeight)
            );
        } else {
            ctx.clearRect(0, 0, U.px(this._displayWidth), U.px(this._displayHeight));
        }
    }

    private _resize() {
        if (this._originalCanvas) {
            const orgWidth = this._originalCanvas.width;
            const orgHeight = this._originalCanvas.height;
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
        } else {
            this._displayWidth = 0;
            this._displayHeight = 0;
            this._displayLeft = 0;
            this._displayTop = 0;
        }
    }

    private _loadImage() {
        return new Promise((resolve, reject) => {
            this._mask = false;
            this._originalCanvas = null;
            if (this.src !== '') {
                const name = (this.src.lastIndexOf('.') > 0) ? this.src.substr(0, this.src.lastIndexOf('.')) : this.src;
                const ext = ((this.src.lastIndexOf('.') > 0) ? this.src.substr(this.src.lastIndexOf('.') + 1) : '').toLowerCase();
                if (ext === 'eps') {
                    const img = new Image();
                    img.src = name + '.jpg';
                    img.onload = _e => {
                        this._originalCanvas = new OffscreenCanvas(img.width, img.height);

                        const tmpCanvas = new OffscreenCanvas(img.width, img.height);
                        const tmpCtx = tmpCanvas.getContext('2d');
                        const realCtx = this._originalCanvas.getContext('2d');
                        if (tmpCtx && realCtx) {
                            tmpCtx.drawImage(img, 0, 0);

                            const maskImg = new Image();
                            maskImg.src = name + '.svg';
                            maskImg.onload = _me => {
                                tmpCtx.globalCompositeOperation = "destination-in";
                                tmpCtx.drawImage(maskImg, 0, 0);
                                tmpCtx.globalCompositeOperation = "none";

                                realCtx.drawImage(tmpCanvas, 0, 0);
                                this._mask = true;
                                resolve(this.src);
                            };
                            maskImg.onerror = _me => {
                                realCtx.drawImage(tmpCanvas, 0, 0);
                                resolve(this.src);
                            };
                        } else {
                            this._originalCanvas = null;
                            reject();
                        }
                    };
                    img.onerror = e => reject;
                } else {
                    const img = new Image();
                    img.src = this.src;
                    img.onload = _e => {
                        this._originalCanvas = new OffscreenCanvas(img.width, img.height);
                        const ctx = this._originalCanvas.getContext('2d');
                        if (ctx) {
                            ctx.drawImage(img, 0, 0);
                            resolve(this.src);
                        } else {
                            this._originalCanvas = null;
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

        this._originalCanvas = null;
        this._displayWidth = 0;
        this._displayHeight = 0;
        this._displayLeft = 0;
        this._displayTop = 0;
        this._mask = false;
        this._src = '';

        this._fitType = ImageFitType.CENTER;
        this._overlapMethod = ImageOverlapMethod.FRAMEBOX;

        this._displayCanvas = document.createElement('canvas');
        this._displayCanvas.style.position = 'absolute';
        this.append(this._displayCanvas);

        this._CHANGE_SIZE$.subscribe(() => {
            this._resize();
            this._repaint();
        });
    }

    computeOverlapArea(x1: number, y1: number, x2: number, y2: number) {
        let thisX1 = U.px(this.x) - U.px(this.margin);
        let thisY1 = U.px(this.y) - U.px(this.margin);
        let thisX2 = thisX1 + U.px(this.width) + (U.px(this.margin) * 2);
        let thisY2 = thisY1 + U.px(this.height) + (U.px(this.margin) * 2);

        if (x1 >= thisX2 || x2 <= thisX1 || y1 >= thisY2 || y2 <= thisY1) return null;
        thisX1 = Math.max(0, thisX1 - x1);
        thisY1 = Math.max(0, thisY1 - y1);
        thisX2 = Math.min(x2 - x1, thisX2 - x1);
        thisY2 = Math.min(y2 - y1, thisY2 - y1);

        const area = [thisX1, thisY1, thisX2, thisY2];
        if (this._originalCanvas) {
            if (x1 < thisX1) {
            } else if (x1 > thisX2) {
            }
        } else {
            return (this.overlapMethod === ImageOverlapMethod.FRAMEBOX) ? area : null;
        }
        return area;
    }

    preflight() {
        // IMPLEMENT ME!!!
    }

    set displayWidth(width) {
        if (this._fitType !== ImageFitType.NONE) return;
        this._displayWidth = width;
        this._EMIT_CHANGE_SIZE();
    }

    set displayHeight(height) {
        if (this._fitType !== ImageFitType.NONE) return;
        this._displayHeight = height;
        this._EMIT_CHANGE_SIZE();
    }

    set displayLeft(left) {
        if (this._fitType !== ImageFitType.NONE) return;
        this._displayLeft = left;
        this._EMIT_CHANGE_SIZE();
    }

    set displayTop(top) {
        if (this._fitType !== ImageFitType.NONE) return;
        this._displayTop = top;
        this._EMIT_CHANGE_SIZE();
    }

    set fitType(fitType: ImageFitType) {
        let changed = false;
        if (this._fitType !== fitType) changed = true;

        this._fitType = fitType;
        if (changed && this._fitType !== ImageFitType.NONE) {
            this._EMIT_CHANGE_SIZE();
        }
    }

    set overlapMethod(overlapMethod: ImageOverlapMethod) {
        if (this._overlapMethod !== overlapMethod) {
            this._overlapMethod = overlapMethod;
            this._EMIT_CHANGE_SIZE();
        }
    }

    set src(src: string) {
        this._src = src;
        this._loadImage().then(_ => this._EMIT_CHANGE_SIZE());
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