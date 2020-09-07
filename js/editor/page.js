class ActaPage {
    constructor(width, height) {
        this._element = document.createElement('x-page');
        if (width) this.width = width;
        if (height) this.height = height;
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
        this.paddingTop = padding;
        this.paddingBottom = padding;
        this.paddingLeft = padding;
        this.paddingRight = padding;
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

    get width() { return this._width; }
    get height() { return this._height; }
    get paddingTop() { return this._paddingTop; }
    get paddingBottom() { return this._paddingBottom; }
    get paddingLeft() { return this._paddingLeft; }
    get paddingRight() { return this._paddingRight; }

    get el() { return this._element; }
};

class ActaGuide {
    constructor(columnCount, innerMargin, columnWidths) {
        this._element = document.createElement('x-guide');

        columnWidths = columnWidths || [];

        this.columnCount = columnCount;
        for (let i = 0; i < columnCount; i++) {
            if (columnWidths[i]) this.columnWidth(i, columnWidths[i]);
        }
        this.innerMargin = innerMargin;
    }

    columnWidth(idx, val) {
        if (arguments.length > 1) { // set
            $(this._element).find('x-guide-col').get(idx).setAttribute('width', val || 0);
        } else { // get
            return $(this._element).find('x-guide-col').get(idx).getAttribute('width') || false;
        }
    }

    set columnCount(count) {
        this._element.innerHTML = '';
        this._columnCount = count || 1;
        for (let i = 0; i < this._columnCount; i++) {
            this._element.appendChild(document.createElement('x-guide-col'));
            if (i + 1 >= this._columnCount) continue;
            this._element.appendChild(document.createElement('x-guide-margin'));
        }
    }

    set innerMargin(innerMargin) {
        this._innerMargin = innerMargin;
        $(this._element).find('x-guide-margin').attr('width', innerMargin);
    }

    get columnCount() { return this._columnCount; }
    get innerMargin() { return this._innerMargin; }

    get el() { return this._element; }
};