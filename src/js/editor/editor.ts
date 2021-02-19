import { IActaCodePageSize } from '../info/code';
import ActaPage from '../pageobject/page';

export default class ActaEditor {
    private _element: HTMLElement;
    private _page;

    get page() { return this._page; }

    constructor(pageSize: IActaCodePageSize) {
        this._element = document.createElement('div');
        this._element.classList.add('editor');

        this._page = new ActaPage(
            `${pageSize.paperWidth}mm`,
            `${pageSize.paperHeight}mm`
        );
        this._page.paddingTop = `${pageSize.lineMarginTop}mm`;
        this._page.paddingBottom = `${pageSize.lineMarginBottom}mm`;
        this._page.paddingLeft = `${pageSize.columnMarginInside}mm`;
        this._page.paddingRight = `${pageSize.columnMarginOutside}mm`;

        this.el.appendChild(this._page);
    }
    get el() { return this._element; }
}