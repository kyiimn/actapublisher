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
    constructor(colCount, innerMargin, colWidths) {
        this._element = document.createElement('x-guide');
        this._innerMargin = innerMargin;

        colCount = colCount || 1;
        colWidths = colWidths || [];
        for (let i = 0; i < colCount; i++) {
            let col = document.createElement('x-guide-col');
            if (colWidths[i]) {
                col.style.minWidth = colWidths[i];
                col.style.maxWidth = colWidths[i];
            }
            this._element.appendChild(col);

            if ((parseFloat(innerMargin) || 0.0) > 0.0 && i + 1 < colCount) {
                let margin = document.createElement('x-guide-margin');
                margin.style.minWidth = innerMargin;
                margin.style.maxWidth = innerMargin;
                this._element.appendChild(margin);
            }
        }
    }
    getColumnWidth(idx) {
        if (!this._element.children(idx)) return false;
        return this._element.children[idx].style.minWidth || -1;
    }

    get el() { return this._element; }
};