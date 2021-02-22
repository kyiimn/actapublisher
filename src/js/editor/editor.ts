import ActaPage from '../pageobject/page';
import ActaGuide from '../pageobject/guide';
import { IActaCodePageSize } from '../info/code';
import { TextAlign } from '../pageobject/textstyle/textstyle';
import { ParagraphVAlign} from '../pageobject/paragraph';

import { fromEvent, Subject } from 'rxjs';
import { filter } from 'rxjs/operators';

import '../../css/editor.scss';

export enum EditorTool {
    SELECT,
    FRAME_EDIT_MODE,
    FRAME_MOVE_MODE,
    TEXT_MODE,
    DRAW_EMPTY_FRAME,
    DRAW_TITLE_FRAME,
    DRAW_TEXT_FRAME,
    DRAW_IMAGE_FRAME,
    DRAW_LINE
};

export interface IActaEditorTextAttribute {
    textStyleName?: string,
    fontName?: string,
    fontSize?: number,
    indent?: number,
    xscale?: number,
    letterSpacing?: number,
    lineHeight?: number,
    underline?: boolean,
    strikeline?: boolean,
    textAlign?: TextAlign,
    textVAlign?: ParagraphVAlign
};

export default class ActaEditor {
    private _element: HTMLElement;
    private _tool: EditorTool;
    private _page: ActaPage;
    private _readonly: boolean;

    private _CHANGE$: Subject<{ action: string, value: any }>;

    private static _emitedPosition(e: MouseEvent) {
        let left = e.offsetX, top = e.offsetY;
        if (e.target) {
            let nowEl: HTMLElement | null = e.target as HTMLElement;
            if (nowEl.nodeName !== 'X-PAGE') {
                while (true) {
                    if (!nowEl || nowEl.nodeName === 'X-PAGE') break;
                    left += nowEl.offsetLeft;
                    top += nowEl.offsetTop;
                    nowEl = nowEl.offsetParent as HTMLElement | null;
                }
            }
        }
        return { left, top };
    }

    constructor(pageSize: IActaCodePageSize) {
        this._CHANGE$ = new Subject();

        this._tool = EditorTool.SELECT;
        this._readonly = false;

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

        fromEvent<MouseEvent>(this._page, 'mousedown').subscribe(e => this._onMouseDown(e));
    }

    private _onMouseDown(e: MouseEvent) {
        const pos = ActaEditor._emitedPosition(e);
        console.log(pos.left, pos.top);
        e.stopPropagation();
    }

    set scale(scale: number) { this._page.scale = scale; }
    set tool(tool: EditorTool) { this._tool = tool; }
    set readonly(value: boolean) { this._readonly = value; }

    get scale() { return this._page.scale; }
    get tool() { return this._tool; }
    get readonly() { return this._readonly; }

    get observable() { return this._CHANGE$; }
    get page() { return this._page; }
    get el() { return this._element; }
}