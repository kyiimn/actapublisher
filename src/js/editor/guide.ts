import { ActaElement } from "./element/instance";
import { Subject, Subscription } from 'rxjs';
import U from './units';

export class ActaGuide extends ActaElement {
    private _parentChangeStyle$?: Subscription;
    private _columnCount: number;
    private _columnWidth: string[] | number[];
    private _innerMargin: string | number;

    static get observedAttributes() {
        return ['direction', 'column', 'innermargin', 'column-width'];
    }

    private _applyAttribute(name: string, value: string) {
        switch (name) {
            case 'direction': this.style.direction = value; break;
            case 'column': this._applyColumnCount(parseInt(value, 10)); break;
            case 'innermargin': this._applyInnerMargin(value); break;
            case 'column-width': this._applyColumnWidth(value.split(' ')); break;
            default: break;
        }
    }

    private _updateColumnWidth() {
        const columns = this.querySelectorAll<ActaGuideColumn>('x-guide-col');
        for (let i = 0; i < columns.length; i++) {
            columns.item(i).width = this._columnWidth[i] || null;
        }
    }

    private _updateInnerMargin() {
        for (const margin of this.querySelectorAll('x-guide-margin')) {
            margin.setAttribute('width', U.px(this._innerMargin) + 'px');
        }
    }

    private _applyColumnCount(count: number) {
        this._columnCount = count || 1;
        this.innerHTML = '';
        for (let i = 0; i < this._columnCount; i++) {
            this.appendChild(document.createElement('x-guide-col'));

            if (i + 1 >= this._columnCount) continue;
            this.appendChild(document.createElement('x-guide-margin'));
        }
        this._updateColumnWidth();
        this._updateInnerMargin();
    }

    private _applyInnerMargin(innerMargin: string | number) {
        this._innerMargin = U.px(innerMargin) || 0;
        this._updateInnerMargin();
    }

    private _applyColumnWidth(widths: string[] | number[]) {
        this._columnWidth = [];
        for (let i = 0; i < this._columnCount; i++) {
            this._columnWidth[i] = U.px(widths[i]) || 0;
        }
        this._updateColumnWidth();
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

        this._columnCount = columnCount;
        this._columnWidth = columnWidth;
        this._innerMargin = innerMargin;
    }

    connectedCallback() {
        for (const attr of ActaGuide.observedAttributes) {
            let val = this.getAttribute(attr) || '';
            switch (attr) {
                case 'column': val = this._columnCount.toString(); break;
                case 'column-width': val = this._columnWidth.join(' '); break;
                case 'innermargin': val = this._innerMargin.toString(); break;
                default: break;
            }
            this._applyAttribute(attr, val);
        }
    }

    attributeChangedCallback(name: string, oldValue: string, newValue: string) {
        if (oldValue === newValue) return;
        this._applyAttribute(name, newValue);
    }

    observe(observer: Subject<string>) {
        this._parentChangeStyle$ = observer.subscribe(_ => this._updateSize());
        this._updateSize();
    }

    unobserve() {
        if (this._parentChangeStyle$) this._parentChangeStyle$.unsubscribe();
        this._parentChangeStyle$ = undefined;
    }

    set columnWidth(widths: string[] | number[]) {
        this.setAttribute('column-width', widths.join(' '));
    }

    set columnCount(count: number) {
        this.setAttribute('column', count.toString());
    }

    set innerMargin(innerMargin: string | number) {
        this.setAttribute('innermargin', innerMargin.toString());
    }

    get innerMargin() { return this._innerMargin; }
    get columnCount() { return this._columnCount; }
    get columnWidth() { return this._columnWidth; }
};
customElements.define('x-guide', ActaGuide);

// tslint:disable-next-line: max-classes-per-file
export class ActaGuideColumn extends ActaElement {
    static get observedAttributes() {
        return ['width'];
    }

    private _applyWidth(width: number) {
        if (width) {
            this.style.maxWidth = width + 'px';
            this.style.minWidth = width + 'px';
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
        this._applyWidth(U.px(this.getAttribute('width')));
    }

    attributeChangedCallback(name: string, oldValue: string, newValue: string) {
        if (oldValue === newValue) return;
        this._applyWidth(U.px(newValue));
    }

    set width(width: string | number | null) {
        if (width === null) {
            this.removeAttribute('width');
        } else {
            this.setAttribute('width', width.toString());
        }
    }

    get width() {
        return U.px(this.style.width);
    }
};
customElements.define('x-guide-col', ActaGuideColumn);

// tslint:disable-next-line: max-classes-per-file
export class ActaGuideMargin extends ActaGuideColumn {};
customElements.define('x-guide-margin', ActaGuideMargin);