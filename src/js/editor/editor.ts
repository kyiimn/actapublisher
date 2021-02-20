import ActaPage from '../pageobject/page';
import ActaGuide from '../pageobject/guide';
import { IActaCodePageSize } from '../info/code';

import '../../css/editor.scss';
import { fromEvent, Subject } from 'rxjs';
import { filter } from 'rxjs/operators';

export default class ActaEditor {
    private _element: HTMLElement;
    private _page;

    private _CHANGE$: Subject<{ action: string, value: any }>;

    constructor(pageSize: IActaCodePageSize) {
        this._CHANGE$ = new Subject();

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
        this._page.scale$.subscribe(size => {
            this._element.style.width = `${size.width}px`;
            this._element.style.height = `${size.height}px`;
        });
        this._page.scale = 0.15;

        fromEvent<WheelEvent>(this._element, 'mousewheel').pipe(filter(e => e.ctrlKey)).subscribe(e => {
            e.preventDefault();

            let scale = this._page.scale;
            if (e.deltaY < 0) scale += 0.01; else scale -= 0.01;
            scale = Math.max(0.05, scale);
            this._page.scale = scale;

            this._CHANGE$.next({ action: 'scale', value: scale });
        });
    }
    set scale(scale: number) { this._page.scale = scale; }

    get observable() { return this._CHANGE$; }
    get scale() { return this._page.scale; }
    get page() { return this._page; }
    get el() { return this._element; }
}