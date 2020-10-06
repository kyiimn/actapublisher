import { ActaElementInstance } from './element/instance';
import { ActaPageElement } from './element/page-el';

export class ActaPage extends ActaElementInstance {
    private _element: ActaPageElement;
    private _width: string | number;
    private _height: string | number;
    private _paddingTop: string | number;
    private _paddingBottom: string | number;
    private _paddingLeft: string | number;
    private _paddingRight: string | number;

    constructor(width: string | number, height: string | number) {
        super();

        this._element = document.createElement('x-page') as ActaPageElement;
        this._element.instance = this;

        this._paddingTop = 0;
        this._paddingBottom = 0;
        this._paddingLeft = 0;
        this._paddingRight = 0;
        this._width = 0;
        this._height = 0;

        if (width) this.width = width;
        if (height) this.height = height;
    }

    set width(width: string | number) {
        this._width = width;
        this._element.setAttribute('width', width.toString());
    }

    set height(height: string | number) {
        this._height = height;
        this._element.setAttribute('height', height.toString());
    }

    set padding(padding: string | number) {
        this.paddingTop = padding;
        this.paddingBottom = padding;
        this.paddingLeft = padding;
        this.paddingRight = padding;
    }

    set paddingTop(padding: string | number) {
        this._paddingTop = padding;
        this._element.setAttribute('padding-top', padding.toString());
    }

    set paddingBottom(padding: string | number) {
        this._paddingBottom = padding;
        this._element.setAttribute('padding-bottom', padding.toString());
    }

    set paddingLeft(padding: string | number) {
        this._paddingLeft = padding;
        this._element.setAttribute('padding-left', padding.toString());
    }

    set paddingRight(padding: string | number) {
        this._paddingRight = padding;
        this._element.setAttribute('padding-right', padding.toString());
    }

    get width() { return this._width; }
    get height() { return this._height; }
    get paddingTop() { return this._paddingTop; }
    get paddingBottom() { return this._paddingBottom; }
    get paddingLeft() { return this._paddingLeft; }
    get paddingRight() { return this._paddingRight; }

    get el() { return this._element; }
};