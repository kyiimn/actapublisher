import $ from 'jquery';

export class ActaGalley {
    private _element: HTMLElement;
    private _x: string | number;
    private _y: string | number;
    private _width: string | number;
    private _height: string | number;
    private _paddingTop: string | number;
    private _paddingBottom: string | number;
    private _paddingLeft: string | number;
    private _paddingRight: string | number;

    constructor(x: string | number, y: string | number, width: string | number, height: string | number) {
        this._element = document.createElement('x-galley');
        this._x = 0;
        this._y = 0;
        this._width = 0;
        this._height = 0;
        this._paddingTop = 0;
        this._paddingBottom = 0;
        this._paddingLeft = 0;
        this._paddingRight = 0;

        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.paddingTop = 0;
        this.paddingBottom = 0;
        this.paddingLeft = 0;
        this.paddingRight = 0;

        $(this._element).data('ActaGalley', this);
    }

    set x(x: string | number) {
        this._x = x;
        this._element.setAttribute('x', x.toString());
    }

    set y(y: string | number) {
        this._y = y;
        this._element.setAttribute('y', y.toString());
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
        const p = padding.toString().split(' ');
        this.paddingTop = p[0] || 0;
        this.paddingBottom = p[2] || p[0] || 0;
        this.paddingLeft = p[1] || p[0] || 0;
        this.paddingRight = p[3] || p[1] || p[0] || 0;
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

    get x() { return this._x; }
    get y() { return this._y; }
    get width() { return this._width; }
    get height() { return this._height; }
    get padding() { return `${this._paddingTop} ${this._paddingLeft} ${this._paddingBottom} ${this._paddingRight}`; }
    get paddingTop() { return this.paddingTop; }
    get paddingBottom() { return this._paddingBottom; }
    get paddingLeft() { return this._paddingLeft; }
    get paddingRight() { return this._paddingRight; }

    get el() { return this._element; }
};