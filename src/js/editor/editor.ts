import { IActaCodePageSize } from '../info/code';
import ActaPage from '../pageobject/page';

import '../../css/editor.scss';
import ActaGuide from '../pageobject/guide';

export default class ActaEditor {
    private _element: HTMLElement;
    private _page;

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

        this._page.guide = new ActaGuide(pageSize.columnCount, `${pageSize.columnSpacing}mm`);

        this._element.appendChild(this._page);
        this._page.scale$.subscribe(scale => {
            this._element.style.width = `${this._page.scaledWidth}px`;
            this._element.style.height = `${this._page.scaledHeight}px`;
        });
        this._page.scale = 0.15;
    }
    get page() { return this._page; }
    get el() { return this._element; }
}