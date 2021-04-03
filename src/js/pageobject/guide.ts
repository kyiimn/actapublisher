import IActaElement from "./interface/element";
import U from '../util/units';

import { Subject, Subscription } from 'rxjs';

import "../../css/pageobject/guide.scss";

type ColumnLineData = {
    lineHeight: number
    lineCount: number,
    lineSpacing: number
}

export default class ActaGuide extends IActaElement {
    private _subscriptionChangePageSize?: Subscription;
    private _columnLineData?: ColumnLineData;

    static get observedAttributes() {
        return ['direction', 'column-count', 'column-width', 'innermargin'];
    }

    private _applyAttribute(name: string, value: string) {
        switch (name) {
            case 'direction': this.style.direction = value; break;
            case 'column-count': this._applyColumnCount(parseInt(value, 10)); break;
            case 'column-width': this._applyColumnWidth(); break;
            case 'innermargin': this._applyInnerMargin(); break;
            default: break;
        }
    }

    private _applyColumnCount(count: number) {
        this.innerHTML = '';
        for (let i = 0; i < count; i++) {
            const col = document.createElement('x-guide-col') as ActaGuideColumn;
            col.lineMarker = this._columnLineData;
            this.appendChild(col);

            if (i + 1 >= count) continue;
            this.appendChild(document.createElement('x-guide-margin'));
        }
        this._applyColumnWidth();
        this._applyInnerMargin();
    }

    private _applyColumnWidth() {
        const widths = this.columnWidth;
        const columns = this.querySelectorAll('x-guide-col');
        for (let i = 0; i < columns.length; i++) {
            const width = U.px(widths[i]);
            if (!isNaN(width)) columns.item(i).setAttribute('width', width + 'px');
            else columns.item(i).removeAttribute('width');
        }
    }

    private _applyInnerMargin() {
        const innerMargin = U.px(this.innerMargin);
        for (const margin of this.querySelectorAll('x-guide-margin')) {
            margin.setAttribute('width', innerMargin + 'px');
        }
    }

    private _updateSize() {
        let top = '0px';
        let bottom = '0px';
        let left = '0px';
        let right = '0px';

        const parent = this.parentElement;
        if (parent !== null && parent.tagName.toLowerCase() === 'x-page') {
            const parentStyle = window.getComputedStyle(parent);
            top = parentStyle.paddingTop;
            bottom = parentStyle.paddingBottom;
            left = parentStyle.paddingLeft;
            right = parentStyle.paddingRight;
        }
        this.style.left = `calc(${left} - 1px)`;
        this.style.top = `calc(${top} - 1px)`;
        this.style.height = `calc(100% - (${top} + ${bottom}) + 2px)`;
        this.style.width = `calc(100% - (${left} + ${right}) + 2px)`;
    }

    constructor(columnCount: number = 1, innerMargin: string | number = 0, columnWidth: string[] | number[] = []) {
        super();

        this.columnCount = columnCount;
        this.innerMargin = innerMargin;
        if (columnWidth.length > 0) this.columnWidth = columnWidth;
    }

    connectedCallback() {
        for (const attr of ActaGuide.observedAttributes) {
            this._applyAttribute(attr, this.getAttribute(attr) || '');
        }
    }

    attributeChangedCallback(name: string, oldValue: string, newValue: string) {
        if (oldValue === newValue) return;
        this._applyAttribute(name, newValue);
    }

    subscribeChangePageSize(observer: Subject<string>) {
        this._subscriptionChangePageSize = observer.subscribe(_ => this._updateSize());
        this._updateSize();
    }

    unsubscribeChangePageSize() {
        if (this._subscriptionChangePageSize) this._subscriptionChangePageSize.unsubscribe();
        this._subscriptionChangePageSize = undefined;
    }

    set columnCount(count: number) { this.setAttribute('column-count', Math.max(count, 1).toString()); }
    set columnWidth(widths: string[] | number[]) { this.setAttribute('column-width', widths.join(' ')); }
    set innerMargin(innerMargin: string | number) { this.setAttribute('innermargin', innerMargin.toString()); }
    set lineMarker(data: ColumnLineData | undefined) {
        const columns = this.querySelectorAll<ActaGuideColumn>('x-guide-col');
        for (const col of columns) {
            col.lineMarker = data;
        }
        this._columnLineData = data;
    }

    get columnCount() { return parseInt(this.getAttribute('column-count') || '1', 10); }
    get columnWidth() { return (this.getAttribute('column-width') || '').split(' '); }
    get innerMargin() { return this.getAttribute('innermargin') || ''; }
};
customElements.define('x-guide', ActaGuide);

// tslint:disable-next-line: max-classes-per-file
class ActaGuideColumn extends IActaElement {
    static get observedAttributes() {
        return ['width'];
    }

    private _applyWidth(width: string) {
        const num = U.px(width);
        if (!isNaN(num)) {
            this.style.maxWidth = num + 'px';
            this.style.minWidth = num + 'px';
        } else {
            this.style.maxWidth = '';
            this.style.minWidth = '';
            this.removeAttribute('width');
        }
    }

    constructor(width?: string | number) {
        super();
        if (width !== undefined) this.setAttribute('width', width.toString());
    }

    connectedCallback() {
        this._applyWidth(this.getAttribute('width') || '');
    }

    attributeChangedCallback(name: string, oldValue: string, newValue: string) {
        if (oldValue === newValue) return;
        this._applyWidth(newValue);
    }

    set lineMarker(data: ColumnLineData | undefined) {
        this.innerHTML = '';
        if (!data) return;

        for (let i = 0; i < data.lineCount; i++) {
            const marker = document.createElement('x-guide-col-marker');
            marker.style.height = `${data.lineHeight}px`;
            marker.style.marginTop = `${i > 0 ? data.lineSpacing : -1}px`;
            this.appendChild(marker);
        }
    }

    set width(width: string | number | null) {
        if (width === null) {
            this.removeAttribute('width');
        } else {
            this.setAttribute('width', width.toString());
        }
    }

    get width() {
        return this.getAttribute('width') || '';
    }
};
customElements.define('x-guide-col', ActaGuideColumn);

// tslint:disable-next-line: max-classes-per-file
class ActaGuideMargin extends ActaGuideColumn {};
customElements.define('x-guide-margin', ActaGuideMargin);

// tslint:disable-next-line: max-classes-per-file
class ActaGuideColumnLineMarker extends HTMLElement {};
customElements.define('x-guide-col-marker', ActaGuideColumnLineMarker);