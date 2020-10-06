import { ActaElementInstance } from './element/instance';
import { ActaGuideElement } from './element/guide-el';
import { ActaGuideColumnElement, ActaGuideMarginElement } from './element/guide-col-el';

export class ActaGuide extends ActaElementInstance {
    private _element: ActaGuideElement;
    private _columnCount: number;
    private _innerMargin: string | number;

    constructor(columnCount: number = 1, innerMargin: string | number = 0, columnWidths: string[] | number[] = []) {
        super();

        this._element = document.createElement('x-guide') as ActaGuideElement;
        this._element.instance = this;

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
            this._element.querySelectorAll('x-guide-col')[idx].setAttribute('width', (val || 0).toString());
        } else { // get
            return this._element.querySelectorAll('x-guide-col')[idx].getAttribute('width') || false;
        }
    }

    set columnCount(count: number) {
        this._element.innerHTML = '';
        this._columnCount = count || 1;
        for (let i = 0; i < this._columnCount; i++) {
            this._element.appendChild(
                document.createElement('x-guide-col') as ActaGuideColumnElement
            );
            if (i + 1 >= this._columnCount) continue;
            this._element.appendChild(
                document.createElement('x-guide-margin') as ActaGuideMarginElement
            );
        }
    }

    set innerMargin(innerMargin: string | number) {
        this._innerMargin = innerMargin;
        for (const margin of this._element.querySelectorAll('x-guide-margin')) {
            margin.setAttribute('width', innerMargin.toString());
        }
    }

    get columnCount() { return this._columnCount; }
    get innerMargin() { return this._innerMargin; }

    get el() { return this._element; }
};