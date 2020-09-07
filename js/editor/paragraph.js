class ActaParagraph {
    constructor(columnCount, innerMargin, columnWidths) {
        this._element = document.createElement('x-paragraph');

        columnWidths = columnWidths || [];

        this.columnCount = columnCount;
        for (let i = 0; i < columnCount; i++) {
            if (columnWidths[i]) this.columnWidth(i, columnWidths[i]);
        }
        this.innerMargin = innerMargin;
    }

    columnWidth(idx, val) {
        if (arguments.length > 1) { // set
            $(this._element).find('x-paragraph-col').get(idx).setAttribute('width', val || 0);
        } else { // get
            return $(this._element).find('x-paragraph-col').get(idx).getAttribute('width') || false;
        }
    }

    set columnCount(count) {
        this._element.innerHTML = '';
        this._columnCount = count || 1;
        for (let i = 0; i < this._columnCount; i++) {
            this._element.appendChild(document.createElement('x-paragraph-col'));
            if (i + 1 >= this._columnCount) continue;
            this._element.appendChild(document.createElement('x-paragraph-margin'));
        }
    }

    set innerMargin(innerMargin) {
        this._innerMargin = innerMargin;
        $(this._element).find('x-paragraph-margin').attr('width', innerMargin);
    }

    get columnCount() { return this._columnCount; }
    get innerMargin() { return this._innerMargin; }

    get el() { return this._element; }

};