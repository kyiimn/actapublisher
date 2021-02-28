import ActaPage from '../pageobject/page';
import ActaGuide from '../pageobject/guide';
import IActaFrame from '../pageobject/interface/frame';
import ActaParagraph, { ParagraphVAlign } from '../pageobject/paragraph';
import ActaImage from '../pageobject/image';
import U from '../util/units';
import accountInfo from '../info/account';

import { IActaCodePageSize } from '../info/code';
import { TextAlign } from '../pageobject/textstyle/textstyle';
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
    top: number,
    xIndex?: number,
    yIndex?: number
};

interface Boundary {
    x: number[],
    y: number[]
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

function applyMagnet(pos: Position, magnet?: Boundary, open?: boolean) {
    if (!magnet) return pos;

    if (magnet.x.length > ((open === undefined) ? 0 : 1)) {
        let dx = Number.MAX_SAFE_INTEGER;
        let idx = -1;
        for (let i = ((open === undefined || open === true) ? 0 : 1); i < magnet.x.length; i += ((open === undefined) ? 1 : 2)) {
            const x = magnet.x[i];
            if (Math.abs(dx) > Math.abs(pos.left - x)) {
                dx = pos.left - x;
                idx = i;
            }
        }
        pos.left -= dx;
        pos.xIndex = (idx + ((open === false) ? 1 : 0)) / 2;
    }
    if (magnet.y.length > ((open === undefined) ? 0 : 1)) {
        let dy = Number.MAX_SAFE_INTEGER;
        let idx = -1;
        for (let i = ((open === undefined || open === true) ? 0 : 1); i < magnet.y.length; i += ((open === undefined) ? 1 : 2)) {
            const y = magnet.y[i];
            if (Math.abs(dy) > Math.abs(pos.top - y)) {
                dy = pos.top - y;
                idx = i;
            }
        }
        pos.top -= dy;
        pos.yIndex = (idx + ((open === false) ? 1 : 0)) / 2;
    }
    return pos;
}

function getBoxSize(spos: Position, epos: Position, magnetData?: Boundary) {
    const x1 = Math.min(spos.left, epos.left);
    const y1 = Math.min(spos.top, epos.top);
    const x2 = Math.max(spos.left, epos.left);
    const y2 = Math.max(spos.top, epos.top);

    const nspos = applyMagnet({ left: x1, top: y1 }, magnetData, true);
    const nepos = applyMagnet({ left: x2, top: y2 }, magnetData, false); 

    return {
        x: nspos.left,
        y: nspos.top,
        width: nepos.left - nspos.left,
        height: nepos.top - nspos.top,
        columnCount: (nepos.xIndex || 0) - (nspos.xIndex || 0),
        lineCount: (nepos.yIndex || 0) - (nspos.yIndex || 0)
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
        this._page.scale = 1;

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
    private _drawBoundary?: Boundary;

    private _onMouseDown(e: MouseEvent) {
        const eveDrawGuide = this._drawGuide;
        try {
            if (EditorToolDrawFrames.indexOf(this._tool) > -1) {
                const guides = this._page.guide?.querySelectorAll('x-guide-col, x-guide-margin');
                if (guides && guides.length > 0) {
                    const guideTop = U.px(this._page.paddingTop);
                    const guideLeft = U.px(this._page.paddingLeft);

                    this._drawBoundary = { x: [guideLeft], y: [guideTop] };
                    for (const guide of guides) {
                        const style = window.getComputedStyle(guide);
                        const width = parseFloat(style.width);
                        const lastVal = this._drawBoundary.x[this._drawBoundary.x.length - 1];
                        this._drawBoundary.x.push(lastVal + width);
                    }
                    for (const line of guides[0].querySelectorAll<HTMLElement>('x-guide-col-marker')) {
                        const style = window.getComputedStyle(line);
                        const marginTop = parseFloat(style.marginTop);
                        const height = parseFloat(style.height);
                        const lastVal = this._drawBoundary.y[this._drawBoundary.y.length - 1];
                        if (marginTop > 0) this._drawBoundary.y.push(lastVal + marginTop);
                        this._drawBoundary.y.push(lastVal + marginTop + height);
                    }
                }
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
                const size = getBoxSize(this._drawEventStartPosition, getOffsetPosition(e), this._drawBoundary);
                let frame: IActaFrame | undefined;
                let changetool: EditorTool | undefined;
                if (size.columnCount < 1 || size.lineCount < 1) return;

                switch (this._tool) {
                    case EditorTool.DRAW_EMPTY_FRAME: break;
                    case EditorTool.DRAW_IMAGE_FRAME:
                        frame = new ActaImage(U.pt(`${size.x}px`), U.pt(`${size.y}px`), U.pt(`${size.width}px`), U.pt(`${size.height}px`));
                        changetool = EditorTool.SELECT;
                        break;
                    case EditorTool.DRAW_TEXT_FRAME:
                        frame = new ActaParagraph(U.pt(`${size.x}px`), U.pt(`${size.y}px`), U.pt(`${size.width}px`), U.pt(`${size.height}px`), accountInfo.prefDefaultBodyTextStyle, this._page.guide ? size.columnCount : 1, this._page.guide?.innerMargin);
                        changetool = EditorTool.TEXT_MODE;
                        break;
                    case EditorTool.DRAW_TITLE_FRAME:
                        frame = new ActaParagraph(U.pt(`${size.x}px`), U.pt(`${size.y}px`), U.pt(`${size.width}px`), U.pt(`${size.height}px`), accountInfo.prefDefaultTitleTextStyle);
                        changetool = EditorTool.TEXT_MODE;
                        break;
                    default: break;
                }
                if (!frame) return;

                this._page.appendChild(frame);
                this._CHANGE$.next({ action: 'append', value: frame });
                if (changetool) this._CHANGE$.next({ action: 'changetool', value: changetool });
            }
        } finally {
            if (this._drawGuide) this._drawGuide.remove();

            this._drawGuide = undefined;
            this._drawEventStartPosition = undefined;
            this._drawBoundary = undefined;

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
                const size = getBoxSize(this._drawEventStartPosition, getOffsetPosition(e), this._drawBoundary);
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

    cancel() {
        if (!this._drawGuide && !this._drawEventStartPosition) return;

        if (this._drawGuide) this._drawGuide.remove();
        this._drawGuide = undefined;
        this._drawEventStartPosition = undefined;
        this._drawBoundary = undefined;
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