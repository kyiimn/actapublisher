class ActaGalley {
    constructor(x, y, width, height) {
        this._element = document.createElement('x-galley');
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.paddingTop = 0;
        this.paddingBottom = 0;
        this.paddingLeft = 0;
        this.paddingRight = 0;
    }

    set x(x) {
        this._x = x;
        this._element.setAttribute('x', x);
    }

    set y(y) {
        this._y = y;
        this._element.setAttribute('y', y);
    }

    set width(width) {
        this._width = width;
        this._element.setAttribute('width', width);
    }

    set height(height) {
        this._height = height;
        this._element.setAttribute('height', height);
    }

    set padding(padding) {
        let p = padding.split(' ');
        this.paddingTop = p[0] || 0;
        this.paddingBottom = p[2] || p[0] || 0;
        this.paddingLeft = p[1] || p[0] || 0;
        this.paddingRight = p[3] || p[1] || p[0] || 0;
    }

    set paddingTop(padding) {
        this._paddingTop = padding;
        this._element.setAttribute('padding-top', padding);
    }

    set paddingBottom(padding) {
        this._paddingBottom = padding;
        this._element.setAttribute('padding-bottom', padding);
    }

    set paddingLeft(padding) {
        this._paddingLeft = padding;
        this._element.setAttribute('padding-left', padding);
    }

    set paddingRight(padding) {
        this._paddingRight = padding;
        this._element.setAttribute('padding-right', padding);
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