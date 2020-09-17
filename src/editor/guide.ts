import $ from 'jquery';

export class ActaGuide {
    private _element: HTMLElement;
    private _columnCount: number;
    private _innerMargin: string | number;

    constructor(columnCount: number = 1, innerMargin: string | number = 0, columnWidths: string[] | number[] = []) {
        this._element = document.createElement('x-guide');
        this._columnCount = 1;
        this._innerMargin = 0;

        this.columnCount = columnCount;
        for (let i = 0; i < columnCount; i++) {
            if (columnWidths[i]) this.columnWidth(i, columnWidths[i]);
        }
        this.innerMargin = innerMargin;
    }

    columnWidth(idx: number, val: string | number) {
        if (arguments.length > 1) { // set
            $(this._element).find('x-guide-col').get(idx).setAttribute('width', (val || 0).toString());
        } else { // get
            return $(this._element).find('x-guide-col').get(idx).getAttribute('width') || false;
        }
    }

    set columnCount(count: number) {
        this._element.innerHTML = '';
        this._columnCount = count || 1;
        for (let i = 0; i < this._columnCount; i++) {
            this._element.appendChild(document.createElement('x-guide-col'));
            if (i + 1 >= this._columnCount) continue;
            this._element.appendChild(document.createElement('x-guide-margin'));
        }
    }

    set innerMargin(innerMargin: string | number) {
        this._innerMargin = innerMargin;
        $(this._element).find('x-guide-margin').attr('width', innerMargin);
    }

    get columnCount() { return this._columnCount; }
    get innerMargin() { return this._innerMargin; }

    get el() { return this._element; }
};