import IActaFrame, { FrameOverlapMethod } from './interface/frame';
import IActaFrameOverlapArea from './interface/frame-overlap-area';
import U from '../util/units';

export enum ImageFitType {
    NONE,
    FILL_FRAME,     // 프레임 채우기(비율X)
    FIT_CONTENT,    // 프레임 채우기(비율)
    FIT_FRAME,      // 프레임 맞추기(비율)
    CENTER          // 가운데
};

export default class ActaImage extends IActaFrame {
    private _displayWidth: number | string;
    private _displayHeight: number | string;
    private _displayLeft: number | string;
    private _displayTop: number | string;
    private _displayCanvas: HTMLCanvasElement;
    private _hasMask: boolean;
    private _maskDataX: number[][] | null;
    private _maskDataY: number[][] | null;

    private _fitType: ImageFitType;

    private _originalCanvas: OffscreenCanvas | HTMLCanvasElement | null;
    private _src: string;

    private _rememberOverlapCalc: {
        [pos: string]: IActaFrameOverlapArea | null
    };

    private _repaint() {
        const ctx = this._displayCanvas.getContext('2d');
        if (!ctx) return;

        const left = Math.floor(U.px(this._displayLeft));
        const top = Math.floor(U.px(this._displayTop));
        const width = Math.ceil(U.px(this._displayWidth));
        const height = Math.ceil(U.px(this._displayHeight));
        const frameWidth = Math.ceil(U.px(this.width));
        const frameHeight = Math.ceil(U.px(this.height));
        const margin = U.px(this.margin);

        this._displayCanvas.width = width;
        this._displayCanvas.height = height;
        this._displayCanvas.style.left = `${left}px`;
        this._displayCanvas.style.top = `${top}px`;
        this._maskDataX = null;
        this._maskDataY = null;

        if (this._originalCanvas) {
            ctx.drawImage(
                this._originalCanvas,
                0, 0, this._originalCanvas.width, this._originalCanvas.height,
                0, 0, U.px(this._displayWidth), U.px(this._displayHeight)
            );
            if (this._hasMask) {
                this._maskDataX = [];
                this._maskDataY = [];
                for (let x = 0; x < frameWidth + Math.ceil(margin * 2); x++) {
                    for (let y = 0; y < frameHeight + Math.ceil(margin * 2); y++) {
                        this._maskDataX[x] = this._maskDataX[x] || [];
                        this._maskDataX[x][y] = 0;

                        this._maskDataY[y] = this._maskDataY[y] || [];
                        this._maskDataY[y][x] = 0;
                    }
                }

                const imagedata = ctx.getImageData(
                    Math.max(left * -1, 0), Math.max(top * -1, 0),
                    Math.min(width + left, frameWidth), Math.min(height + top, frameHeight)
                );
                for (let i = 3; i < imagedata.data.length; i += 4) {
                    const x = Math.floor((i / 4) % imagedata.width) + Math.max(0, left) + Math.ceil(margin);
                    const y = Math.floor((i / 4) / imagedata.width) + Math.max(0, top) + Math.ceil(margin);

                    if (this._maskDataX[x] !== undefined && this._maskDataX[x][y] !== undefined) {
                        if (imagedata.data[i] !== 0) {
                            this._maskDataX[x][y] = 1;
                            for (let m1 = 1; m1 <= Math.ceil(margin); m1++) {
                                for (let m2 = Math.ceil(margin) - m1; m2 > 0; m2--) {
                                    if (this._maskDataX[x - m1] !== undefined && this._maskDataX[x - m1][y - m2] !== undefined && this._maskDataX[x - m1][y - m2] !== 1) this._maskDataX[x - m1][y - m2] = 2;
                                    if (this._maskDataX[x - m1] !== undefined && this._maskDataX[x - m1][y + m2] !== undefined && this._maskDataX[x - m1][y + m2] !== 1) this._maskDataX[x - m1][y + m2] = 2;
                                    if (this._maskDataX[x + m1] !== undefined && this._maskDataX[x + m1][y - m2] !== undefined && this._maskDataX[x + m1][y - m2] !== 1) this._maskDataX[x + m1][y - m2] = 2;
                                    if (this._maskDataX[x + m1] !== undefined && this._maskDataX[x + m1][y + m2] !== undefined && this._maskDataX[x + m1][y + m2] !== 1) this._maskDataX[x + m1][y + m2] = 2;
                                    if (this._maskDataX[x - m2] !== undefined) {
                                        if (this._maskDataX[x - m2][y - m1] !== undefined && this._maskDataX[x - m2][y - m1] !== 1) this._maskDataX[x - m2][y - m1] = 2;
                                        if (this._maskDataX[x - m2][y + m1] !== undefined && this._maskDataX[x - m2][y + m1] !== 1) this._maskDataX[x - m2][y + m1] = 2;
                                    }
                                    if (this._maskDataX[x + m2] !== undefined) {
                                        if (this._maskDataX[x + m2][y - m1] !== undefined && this._maskDataX[x + m2][y - m1] !== 1) this._maskDataX[x + m2][y - m1] = 2;
                                        if (this._maskDataX[x + m2][y + m1] !== undefined && this._maskDataX[x + m2][y + m1] !== 1) this._maskDataX[x + m2][y + m1] = 2;
                                    }
                                }
                            }
                        }
                    }
                    if (this._maskDataY[y] !== undefined && this._maskDataY[y][x] !== undefined) {
                        if (imagedata.data[i] !== 0) {
                            this._maskDataY[y][x] = 1;
                            for (let m1 = 1; m1 <= Math.ceil(margin); m1++) {
                                for (let m2 = Math.ceil(margin) - m1; m2 > 0; m2--) {
                                    if (this._maskDataY[y - m1] !== undefined && this._maskDataY[y - m1][x - m2] !== undefined && this._maskDataY[y - m1][x - m2] !== 1) this._maskDataY[y - m1][x - m2] = 2;
                                    if (this._maskDataY[y - m1] !== undefined && this._maskDataY[y - m1][x + m2] !== undefined && this._maskDataY[y - m1][x + m2] !== 1) this._maskDataY[y - m1][x + m2] = 2;
                                    if (this._maskDataY[y + m1] !== undefined && this._maskDataY[y + m1][x - m2] !== undefined && this._maskDataY[y + m1][x - m2] !== 1) this._maskDataY[y + m1][x - m2] = 2;
                                    if (this._maskDataY[y + m1] !== undefined && this._maskDataY[y + m1][x + m2] !== undefined && this._maskDataY[y + m1][x + m2] !== 1) this._maskDataY[y + m1][x + m2] = 2;
                                    if (this._maskDataY[y - m2] !== undefined) {
                                        if (this._maskDataY[y - m2][x - m1] !== undefined && this._maskDataY[y - m2][x - m1] !== 1) this._maskDataY[y - m2][x - m1] = 2;
                                        if (this._maskDataY[y - m2][x + m1] !== undefined && this._maskDataY[y - m2][x + m1] !== 1) this._maskDataY[y - m2][x + m1] = 2;
                                    }
                                    if (this._maskDataY[y + m2] !== undefined) {
                                        if (this._maskDataY[y + m2][x - m1] !== undefined && this._maskDataY[y + m2][x - m1] !== 1) this._maskDataY[y + m2][x - m1] = 2;
                                        if (this._maskDataY[y + m2][x + m1] !== undefined && this._maskDataY[y + m2][x + m1] !== 1) this._maskDataY[y + m2][x + m1] = 2;
                                    }
                                }
                            }
                        }
                    }
                }
            }
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
        this._rememberOverlapCalc = {};
    }

    private _loadImage() {
        return new Promise((resolve, reject) => {
            this._hasMask = false;
            this._originalCanvas = null;
            if (this.src !== '') {
                const name = (this.src.lastIndexOf('.') > 0) ? this.src.substr(0, this.src.lastIndexOf('.')) : this.src;
                const ext = ((this.src.lastIndexOf('.') > 0) ? this.src.substr(this.src.lastIndexOf('.') + 1) : '').toLowerCase();
                if (ext === 'eps') {
                    const img = new Image();
                    img.src = name + '.jpg';
                    img.onload = _e => {
                        if (window.OffscreenCanvas) {
                            this._originalCanvas = new OffscreenCanvas(img.width, img.height);
                        } else {
                            this._originalCanvas = document.createElement('canvas');
                            this._originalCanvas.setAttribute('width', img.width.toString());
                            this._originalCanvas.setAttribute('height', img.height.toString());
                        }
                        let tmpCanvas: OffscreenCanvas | HTMLCanvasElement;
                        if (window.OffscreenCanvas) {
                            tmpCanvas = new OffscreenCanvas(img.width, img.height);
                        } else {
                            tmpCanvas = document.createElement('canvas');
                            tmpCanvas.setAttribute('width', img.width.toString());
                            tmpCanvas.setAttribute('height', img.height.toString());
                        }
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
                                this._hasMask = true;
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
                        if (window.OffscreenCanvas) {
                            this._originalCanvas = new OffscreenCanvas(img.width, img.height);
                        } else {
                            this._originalCanvas = document.createElement('canvas');
                            this._originalCanvas.setAttribute('width', img.width.toString());
                            this._originalCanvas.setAttribute('height', img.height.toString());
                        }
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
        this._hasMask = false;
        this._maskDataX = null;
        this._maskDataY = null;
        this._src = '';

        this._fitType = ImageFitType.CENTER;

        this._displayCanvas = document.createElement('canvas');
        this._displayCanvas.style.position = 'absolute';
        this.append(this._displayCanvas);

        this._rememberOverlapCalc = {};

        this._onChangeSize = _ => {
            this._resize();
            this._repaint();
        };
    }

    private _getCacheKey(x1: number, y1: number, x2: number, y2: number) {
        return `${x1}_${y1}_${x2}_${y2}`;
    }

    computeOverlapArea(x1: number, y1: number, x2: number, y2: number): IActaFrameOverlapArea | null {
        if (this.overlapMethod === FrameOverlapMethod.OVERLAP) {
            return null;
        } else if (this.overlapMethod === FrameOverlapMethod.FRAMEBOX || !this._originalCanvas || (!this._hasMask || this._maskDataX === null || this._maskDataY === null)) {
            // 이미지가 배치되지 않았거나, 마스크정보가 없으면 프레임박스와 동일하게 처리
            return super.computeOverlapArea(x1, y1, x2, y2);
        }
        let thisX1 = U.px(this.x) - U.px(this.margin);
        let thisY1 = U.px(this.y) - U.px(this.margin);
        let thisX2 = thisX1 + U.px(this.width) + (U.px(this.margin) * 2);
        let thisY2 = thisY1 + U.px(this.height) + (U.px(this.margin) * 2);

        if (x1 >= thisX2 || x2 <= thisX1 || y1 >= thisY2 || y2 <= thisY1) return null;

        x1 = Math.floor(x1); x2 = Math.ceil(x2);
        y1 = Math.floor(y1); y2 = Math.ceil(y2);

        const cacheKey = this._getCacheKey(x1, y1, x2, y2);
        if (this._rememberOverlapCalc[cacheKey] !== undefined) return this._rememberOverlapCalc[cacheKey];

        thisX1 = Math.floor(thisX1); thisX2 = Math.ceil(thisX2);
        thisY1 = Math.floor(thisY1); thisY2 = Math.ceil(thisY2);

        let area: IActaFrameOverlapArea | null = {
            x: [Math.max(0, thisX1 - x1), Math.min(x2 - x1, thisX2 - x1)],
            y: [Math.max(0, thisY1 - y1), Math.min(y2 - y1, thisY2 - y1)]
        };
        const inArea: IActaFrameOverlapArea = {
            x: [Math.max(0, x1 - thisX1), Math.min(thisX2 - thisX1, x2 - thisX1)],
            y: [Math.max(0, y1 - thisY1), Math.min(thisY2 - thisY1, y2 - thisY1)]
        };

        if (this.overlapMethod === FrameOverlapMethod.SHAPE) {
            let hasYPx = false;
            for (let y = 0; y < this._maskDataY.length; y++) {
                if (Math.max(...this._maskDataY[y].slice(inArea.x[0], inArea.x[1])) > 0) hasYPx = true;
                else if (!hasYPx && y >= inArea.y[0] && y < inArea.y[1]) area.y[0]++;
            }
            hasYPx = false;
            for (let y = this._maskDataY.length - 1; y >= 0; y--) {
                if (Math.max(...this._maskDataY[y].slice(inArea.x[0], inArea.x[1])) > 0) hasYPx = true;
                else if (!hasYPx && y >= inArea.y[0] && y < inArea.y[1]) area.y[1]--;
            }
            let hasXPx = false;
            for (let x = 0; x < this._maskDataX.length; x++) {
                if (Math.max(...this._maskDataX[x].slice(inArea.y[0], inArea.y[1])) > 0) hasXPx = true;
                else if (!hasXPx && x >= inArea.x[0] && x < inArea.x[1]) area.x[0]++;
            }
            hasXPx = false;
            for (let x = this._maskDataX.length - 1; x >= 0; x--) {
                if (Math.max(...this._maskDataX[x].slice(inArea.y[0], inArea.y[1])) > 0) hasXPx = true;
                else if (!hasXPx && x >= inArea.x[0] && x < inArea.x[1]) area.x[1]--;
            }
        } else if (this.overlapMethod === FrameOverlapMethod.JUMP) {
            let hasYPx = false;
            for (let y = 0; y < this._maskDataY.length; y++) {
                if (Math.max(...this._maskDataY[y]) > 0) hasYPx = true;
                else if (!hasYPx && y >= inArea.y[0] && y < inArea.y[1]) area.y[0]++;
            }
            hasYPx = false;
            for (let y = this._maskDataY.length - 1; y >= 0; y--) {
                if (Math.max(...this._maskDataY[y]) > 0) hasYPx = true;
                else if (!hasYPx && y >= inArea.y[0] && y < inArea.y[1]) area.y[1]--;
            }
        }
        if (Math.abs(area.x[0] - area.x[1]) <= 1 || Math.abs(area.y[0] - area.y[1]) <= 1) area = null;

        this._rememberOverlapCalc[cacheKey] = area;

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