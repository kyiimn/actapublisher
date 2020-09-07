class ActaGalley {
    constructor(x, y, width, height) {
        this._element = document.createElement('x-galley');
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
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

    get x() { return this._x; }
    get y() { return this._y; }
    get width() { return this._width; }
    get height() { return this._height; }

    get el() { return this._element; }
};