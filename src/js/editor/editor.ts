import ActaPage from '../pageobject/page';
import ActaGuide from '../pageobject/guide';
import IActaFrame from '../pageobject/interface/frame';
import U from '../util/units';

import { IActaCodePageSize } from '../info/code';
import { TextAlign } from '../pageobject/textstyle/textstyle';
import ActaParagraph, { ParagraphVAlign} from '../pageobject/paragraph';
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

const EditorToolModes = [
    EditorTool.FRAME_EDIT_MODE,
    EditorTool.FRAME_MOVE_MODE,
    EditorTool.TEXT_MODE
];

const EditorToolDrawFrames = [
    EditorTool.DRAW_EMPTY_FRAME,
    EditorTool.DRAW_IMAGE_FRAME,
    EditorTool.DRAW_TEXT_FRAME,
    EditorTool.DRAW_TITLE_FRAME
];

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

interface Position {
    left: number,
    top: number
};

function getOffsetPosition(e: MouseEvent, parentEl?: IActaFrame) {
    let left = e.offsetX, top = e.offsetY;
    if (!e.target) return { left, top };

    let nowEl: HTMLElement | null = e.target as HTMLElement;
    if (nowEl !== parentEl && nowEl.nodeName !== 'X-PAGE') {
        while (true) {
            if (!nowEl || (parentEl && nowEl === parentEl) || nowEl.nodeName === 'X-PAGE') break;
            const computedStyle = window.getComputedStyle(nowEl);
            if (computedStyle.position === 'absolute') {
                left += parseFloat(computedStyle.left);
                top += parseFloat(computedStyle.top);
            } else {
                left += nowEl.offsetLeft;
                top += nowEl.offsetTop;
            }
            nowEl = nowEl.offsetParent as HTMLElement | null;
        }
    }
    return { left, top };
}

function getBoxSize(spos: Position, epos: Position) {
    return {
        x: Math.min(spos.left, epos.left),
        y: Math.min(spos.top, epos.top),
        width: Math.max(spos.left, epos.left) - Math.min(spos.left, epos.left),
        height: Math.max(spos.top, epos.top) - Math.min(spos.top, epos.top)
    };
}

export default class ActaEditor {
    private _element: HTMLElement;
    private _tool: EditorTool;
    private _page: ActaPage;
    private _readonly: boolean;

    private _eveEventMouseMove?: MouseEvent;

    private _CHANGE$: Subject<{ action: string, value: any }>;

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
        this._page.guide.lineMarker = {
            lineHeight: U.px(`${pageSize.lineHeight}mm`),
            lineSpacing: U.px(`${pageSize.lineSpacing}mm`),
            lineCount: pageSize.lineCount
        };

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
        fromEvent<MouseEvent>(this._page, 'mousemove').subscribe(e => this._onMouseMove(e));
        fromEvent<MouseEvent>(this._page, 'mouseup').subscribe(e => this._onMouseUp(e));
    }

    private _drawEventStartPosition?: { left: number, top: number };
    private _drawGuide?: HTMLElement;

    private _onMouseDown(e: MouseEvent) {
        const eveDrawGuide = this._drawGuide;
        try {
            if (EditorToolDrawFrames.indexOf(this._tool) > -1) {
                const pos = getOffsetPosition(e);
                this._drawEventStartPosition = pos;
                this._drawGuide = document.createElement('div');
                this._drawGuide.classList.add('draw-guide');
                this._page.appendChild(this._drawGuide);
            }
        } finally {
            if (eveDrawGuide) eveDrawGuide.remove();
            e.stopPropagation();
        }
    }

    private _onMouseUp(e: MouseEvent) {
        try {
            if (EditorToolDrawFrames.indexOf(this._tool) > -1 && this._drawGuide && this._drawEventStartPosition) {
                const size = getBoxSize(this._drawEventStartPosition, getOffsetPosition(e));
                let frame: IActaFrame | undefined;
                switch (this._tool) {
                    case EditorTool.DRAW_EMPTY_FRAME: break;
                    case EditorTool.DRAW_IMAGE_FRAME: break;
                    case EditorTool.DRAW_TEXT_FRAME:
                        frame = new ActaParagraph(size.x, size.y, size.width, size.height, '본문', '3mm');
                        break;
                    case EditorTool.DRAW_TITLE_FRAME: break;
                    default: break;
                }
                if (!frame) return;

                this._page.appendChild(frame);
            }
        } finally {
            if (this._drawGuide) {
                this._drawGuide.remove();
                this._drawGuide = undefined;
            }
            if (this._drawEventStartPosition) {
                this._drawEventStartPosition = undefined;
            }
            e.preventDefault();
            e.stopPropagation();
        }
    }

    private _onMouseMove(e: MouseEvent) {
        try {
            if (e.buttons !== 1 || this._eveEventMouseMove?.buttons !== 1) return;
            if (this._tool === EditorTool.SELECT && e.ctrlKey) {
                if (!this._eveEventMouseMove?.ctrlKey || this._eveEventMouseMove?.buttons !== 1) return;
                const mx = e.clientX - this._eveEventMouseMove.clientX;
                const my = e.clientY - this._eveEventMouseMove.clientY;
                const body = this._element.parentElement;
                if (!body) return;
                body.scrollLeft -= mx;
                body.scrollTop -= my;
            } else if (EditorToolDrawFrames.indexOf(this._tool) > -1 && this._drawGuide && this._drawEventStartPosition) {
                const size = getBoxSize(this._drawEventStartPosition, getOffsetPosition(e));
                this._drawGuide.style.left = `${size.x}px`;
                this._drawGuide.style.top = `${size.y}px`;
                this._drawGuide.style.width = `${size.width}px`;
                this._drawGuide.style.height = `${size.height}px`;
            }
        } finally {
            this._eveEventMouseMove = e;

            e.preventDefault();
            e.stopPropagation();
        }
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