import ActaPage from '../pageobject/page';
import ActaGuide from '../pageobject/guide';
import ActaParagraph, { ParagraphVerticalAlign as ParagraphVerticalAlign } from '../pageobject/paragraph';
import ActaTextStyleInherit from '../pageobject/textstyle/textstyle-inherit';
import ActaTextStyleManager from '../pageobject/textstyle/textstylemgr';
import ActaImage from '../pageobject/image';
import IActaFrame from '../pageobject/interface/frame';
import accountInfo from '../info/account';
import U from '../util/units';

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
    textAlign?: TextAlign
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

function GET_OFFSET_POSITION(e: MouseEvent, parentEl?: IActaFrame) {
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

function APPLY_MAGNET(pos: Position, magnet?: Boundary, open?: boolean) {
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

function GET_BOX_SIZE(spos: Position, epos: Position, magnetData?: Boundary) {
    const x1 = Math.min(spos.left, epos.left);
    const y1 = Math.min(spos.top, epos.top);
    const x2 = Math.max(spos.left, epos.left);
    const y2 = Math.max(spos.top, epos.top);

    const nspos = APPLY_MAGNET({ left: x1, top: y1 }, magnetData, true);
    const nepos = APPLY_MAGNET({ left: x2, top: y2 }, magnetData, false);

    return {
        x: nspos.left,
        y: nspos.top,
        width: nepos.left - nspos.left,
        height: nepos.top - nspos.top,
        columnCount: (nepos.xIndex || 0) - (nspos.xIndex || 0),
        lineCount: (nepos.yIndex || 0) - (nspos.yIndex || 0)
    };
}

function GET_FRAME(el: HTMLElement) {
    let nowEl: HTMLElement | null = el;
    while (true) {
        if (!nowEl) break;
        if (nowEl instanceof IActaFrame) break;
        nowEl = nowEl.parentElement;
    }
    return nowEl instanceof IActaFrame ? nowEl as IActaFrame : null;
}

export default class ActaEditor {
    private _element: HTMLElement;
    private _tool: EditorTool;
    private _page: ActaPage;
    private _readonly: boolean;

    private _mouseEventDragGuide?: HTMLElement;
    private _mouseMovePreviousEvent?: MouseEvent;
    private _mouseEventStartPosition?: { left: number, top: number };
    private _mouseEventTarget?: IActaFrame;
    private _pageGuideBoundary?: Boundary;

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

        fromEvent<MouseEvent>(this._page, 'mousedown').pipe(filter(e => e.buttons === 1)).subscribe(e => this._onMouseDown(e));
        fromEvent<MouseEvent>(this._page, 'mousemove').pipe(filter(e => e.buttons === 1)).subscribe(e => this._onMouseMove(e));
        fromEvent<MouseEvent>(this._page, 'mouseup').pipe(filter(_ => this._mouseMovePreviousEvent !== undefined)).subscribe(e => this._onMouseUp(e));

        fromEvent<MouseEvent>(this._page, 'mousemove').pipe(filter(e => e.buttons === 4)).subscribe(e => this._onScrollMove(e));
    }

    private _calcGuideBoundary() {
        const guides = this._page.guide?.querySelectorAll('x-guide-col, x-guide-margin');
        if (guides && guides.length > 0) {
            const guideTop = U.px(this._page.paddingTop);
            const guideLeft = U.px(this._page.paddingLeft);

            this._pageGuideBoundary = { x: [guideLeft], y: [guideTop] };
            for (const guide of guides) {
                const style = window.getComputedStyle(guide);
                const width = parseFloat(style.width);
                const lastVal = this._pageGuideBoundary.x[this._pageGuideBoundary.x.length - 1];
                this._pageGuideBoundary.x.push(lastVal + width);
            }
            for (const line of guides[0].querySelectorAll<HTMLElement>('x-guide-col-marker')) {
                const style = window.getComputedStyle(line);
                const marginTop = parseFloat(style.marginTop);
                const height = parseFloat(style.height);
                const lastVal = this._pageGuideBoundary.y[this._pageGuideBoundary.y.length - 1];
                if (marginTop > 0) this._pageGuideBoundary.y.push(lastVal + marginTop);
                this._pageGuideBoundary.y.push(lastVal + marginTop + height);
            }
        } else {
            this._pageGuideBoundary = undefined;
        }
    }

    private _onMouseDown(e: MouseEvent) {
        const previousDragGuide = this._mouseEventDragGuide;

        this._mouseEventDragGuide = undefined;
        this._mouseEventTarget = undefined;

        try {
            const pos = GET_OFFSET_POSITION(e);
            this._calcGuideBoundary();
            if (EditorToolDrawFrames.indexOf(this._tool) > -1) {
                this._mouseEventStartPosition = pos;
                this._mouseEventDragGuide = document.createElement('div');
                this._mouseEventDragGuide.classList.add('draw-guide');
                this._page.appendChild(this._mouseEventDragGuide);
            } else if (this._tool === EditorTool.FRAME_MOVE_MODE) {
                const frame = GET_FRAME(e.target as HTMLElement);
                if (!frame) return;
                this._mouseEventStartPosition = pos;
                this._mouseEventTarget = frame;
                this._mouseEventTarget.focus();
            }
        } finally {
            if (previousDragGuide) previousDragGuide.remove();
            e.stopPropagation();
        }
    }

    private _onScrollMove(e: MouseEvent) {
        try {
            if (!this._mouseMovePreviousEvent) return;

            const mx = e.clientX - this._mouseMovePreviousEvent.clientX;
            const my = e.clientY - this._mouseMovePreviousEvent.clientY;
            const body = this._element.parentElement;
            if (!body) return;

            body.scrollLeft -= mx;
            body.scrollTop -= my;
        } finally {
            this._mouseMovePreviousEvent = e;

            e.preventDefault();
            e.stopPropagation();
        }
    }

    private _onMouseUp(e: MouseEvent) {
        try {
            if (EditorToolDrawFrames.indexOf(this._tool) > -1) {
                if (!this._mouseEventDragGuide || !this._mouseEventStartPosition) return;

                const size = GET_BOX_SIZE(this._mouseEventStartPosition, GET_OFFSET_POSITION(e), this._pageGuideBoundary);
                let frame, changetool: EditorTool | undefined;
                if (size.columnCount < 1 || size.lineCount < 1) return;

                switch (this._tool) {
                    case EditorTool.DRAW_EMPTY_FRAME: break;
                    case EditorTool.DRAW_IMAGE_FRAME:
                        frame = new ActaImage(U.pt(size.x, U.PX), U.pt(size.y, U.PX), U.pt(size.width, U.PX), U.pt(size.height, U.PX));
                        changetool = EditorTool.SELECT;
                        break;
                    case EditorTool.DRAW_TEXT_FRAME:
                        frame = new ActaParagraph(
                            U.pt(size.x, U.PX), U.pt(size.y, U.PX), U.pt(size.width, U.PX), U.pt(size.height, U.PX),
                            accountInfo.prefDefaultBodyTextStyle, this._page.guide ? size.columnCount : 1, this._page.guide?.innerMargin
                        );
                        frame.onMoveCursor = (x) => this._onParagraphMoveCursor(x.paragraph, x.cursor);
                        changetool = EditorTool.TEXT_MODE;
                        break;
                    case EditorTool.DRAW_TITLE_FRAME:
                        frame = new ActaParagraph(
                            U.pt(size.x, U.PX), U.pt(size.y, U.PX), U.pt(size.width, U.PX), U.pt(size.height, U.PX),
                            accountInfo.prefDefaultTitleTextStyle
                        );
                        frame.onMoveCursor = (x) => this._onParagraphMoveCursor(x.paragraph, x.cursor);
                        changetool = EditorTool.TEXT_MODE;
                        break;
                    default: break;
                }
                if (!frame) return;

                this._page.appendChild(frame as IActaFrame);
                this._CHANGE$.next({ action: 'append', value: frame as IActaFrame });
                if (changetool) this._CHANGE$.next({ action: 'changetool', value: changetool });
            }
        } finally {
            if (this._mouseEventDragGuide) this._mouseEventDragGuide.remove();

            this._mouseEventDragGuide = undefined;
            this._mouseEventStartPosition = undefined;
            this._mouseMovePreviousEvent = undefined;
            this._pageGuideBoundary = undefined;

            e.preventDefault();
            e.stopPropagation();
        }
    }

    private _onMouseMove(e: MouseEvent) {
        try {
            if (EditorToolDrawFrames.indexOf(this._tool) > -1 && this._mouseEventDragGuide && this._mouseEventStartPosition) {
                const size = GET_BOX_SIZE(this._mouseEventStartPosition, GET_OFFSET_POSITION(e), this._pageGuideBoundary);
                this._mouseEventDragGuide.style.left = `${size.x}px`;
                this._mouseEventDragGuide.style.top = `${size.y}px`;
                this._mouseEventDragGuide.style.width = `${size.width}px`;
                this._mouseEventDragGuide.style.height = `${size.height}px`;
            }
        } finally {
            this._mouseMovePreviousEvent = e;

            e.preventDefault();
            e.stopPropagation();
        }
    }

    private _onParagraphMoveCursor(paragraph: ActaParagraph, cursor: number) {
        const textStyle = paragraph.getTextStyleAtCursor(true);
        const tbData: IActaEditorTextAttribute = {};

        if (textStyle.fontName !== null) tbData.fontName = textStyle.fontName;
        if (textStyle.fontSize !== null) tbData.fontSize = textStyle.fontSize;
        if (textStyle.indent !== null) tbData.indent = textStyle.indent;
        if (textStyle.xscale !== null) tbData.xscale = textStyle.xscale;
        if (textStyle.letterSpacing !== null) tbData.letterSpacing = textStyle.letterSpacing;
        if (textStyle.lineHeight !== null) tbData.lineHeight = textStyle.lineHeight;
        if (textStyle.underline !== null) tbData.underline = textStyle.underline;
        if (textStyle.strikeline !== null) tbData.strikeline = textStyle.strikeline;
        if (textStyle.textAlign !== null) tbData.textAlign = textStyle.textAlign;

        this._CHANGE$.next({ action: "textstyle", value: tbData });

        if (this._tool !== EditorTool.TEXT_MODE) {
            this._CHANGE$.next({ action: 'changetool', value: EditorTool.TEXT_MODE });
        }
    }

    setTextStyle(tbData: IActaEditorTextAttribute) {
        const paragraph = this._page.querySelector<ActaParagraph>('x-paragraph.focus.editable');
        if (!paragraph) return;

        const textStyle = new ActaTextStyleInherit();
        if (tbData.textStyleName) textStyle.copy(ActaTextStyleManager.get(tbData.textStyleName));
        if (tbData.fontName) textStyle.fontName = tbData.fontName;
        if (tbData.fontSize) textStyle.fontSize = tbData.fontSize;
        if (tbData.xscale) textStyle.xscale = tbData.xscale;
        if (tbData.letterSpacing) textStyle.letterSpacing = tbData.letterSpacing;
        if (tbData.lineHeight) textStyle.lineHeight = tbData.lineHeight;
        if (tbData.textAlign) textStyle.textAlign = tbData.textAlign;
        if (tbData.underline) textStyle.underline = tbData.underline;
        if (tbData.strikeline) textStyle.strikeline = tbData.strikeline;
        if (tbData.indent) textStyle.indent = tbData.indent;

        paragraph.setTextStyleAtCursor(textStyle);
    }

    cancel() {
        if (!this._mouseEventDragGuide && !this._mouseEventStartPosition) return;

        if (this._mouseEventDragGuide) this._mouseEventDragGuide.remove();
        this._mouseEventDragGuide = undefined;
        this._mouseEventStartPosition = undefined;
        this._pageGuideBoundary = undefined;
    }

    set tool(tool: EditorTool) {
        this._tool = tool;
        if (this._tool === EditorTool.TEXT_MODE) {
            const focusedPara = this._page.querySelector<ActaParagraph>('x-paragraph.focus');
            if (!focusedPara) return;
            if (focusedPara.classList.contains('editable')) return;
            focusedPara.switchEditable(true);
        } else if (this._tool === EditorTool.FRAME_EDIT_MODE) {
            const editablePara = this._page.querySelector<ActaParagraph>('x-paragraph.editable');
            if (editablePara) editablePara.switchEditable(false);
        } else if (this._tool === EditorTool.FRAME_MOVE_MODE) {
            const editablePara = this._page.querySelector<ActaParagraph>('x-paragraph.editable');
            if (editablePara) editablePara.switchEditable(false);
        } else if (EditorToolDrawFrames.indexOf(this._tool) > -1) {
            const editablePara = this._page.querySelector<ActaParagraph>('x-paragraph.editable');
            if (editablePara) editablePara.switchEditable(false);
        }
    }

    set scale(scale: number) { this._page.scale = scale; }
    set readonly(value: boolean) { this._readonly = value; }

    get scale() { return this._page.scale; }
    get tool() { return this._tool; }
    get readonly() { return this._readonly; }

    get observable() { return this._CHANGE$; }
    get page() { return this._page; }
    get el() { return this._element; }
}