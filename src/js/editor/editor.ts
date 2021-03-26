import ActaPage from '../pageobject/page';
import ActaGuide from '../pageobject/guide';
import ActaParagraph, { ParagraphVerticalAlign as ParagraphVerticalAlign } from '../pageobject/paragraph';
import ActaTextAttribute from '../pageobject/textstyle/textattribute';
import ActaTextStyleManager from '../pageobject/textstyle/textstylemgr';
import ActaImage from '../pageobject/image';
import IActaFrame from '../pageobject/interface/frame';
import accountInfo from '../info/account';
import U from '../util/units';

import { IActaCodePageSize } from '../info/code';
import { TextAlign } from '../pageobject/textstyle/textattribute-absolute';
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
    textStyle?: string,
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

function GET_FRAME(el: HTMLElement | null) {
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
            if (e.deltaY < 0) scale += 0.05; else scale -= 0.05;
            scale = Math.max(0.05, scale);
            this._page.scale = scale;

            this._CHANGE$.next({ action: 'scale', value: scale });
        });

        fromEvent<MouseEvent>(this._page, 'mousedown').pipe(filter(e => e.buttons === 1)).subscribe(e => {
            if (this._tool === EditorTool.FRAME_MOVE_MODE) {
                const frame = GET_FRAME(e.target as HTMLElement);
                if (!frame) return;

                if (!frame.classList.contains('selected') && !frame.classList.contains('focus')) {
                    if (!e.ctrlKey) {
                        for (const selectedFrame of this._selectedFrames) selectedFrame.classList.remove('selected');
                    }
                    frame.classList.add('selected');
                }
                this._mouseEventStartPosition = GET_OFFSET_POSITION(e);
            } else {
                this._onMouseDown(e)
            }
        });
        fromEvent<MouseEvent>(this._page, 'mousemove').pipe(filter(e => e.buttons === 1 && this._tool === EditorTool.FRAME_MOVE_MODE)).subscribe(e => this._onFrameMove(e));
        fromEvent<MouseEvent>(this._page, 'mousemove').pipe(filter(_ => this._tool !== EditorTool.FRAME_MOVE_MODE)).subscribe(e => {
            switch (e.buttons) {
                case 1: this._onMouseMove(e); break;
                case 4: this._onScrollMove(e); break;
                default: break;
            }
        });
        fromEvent<MouseEvent>(this._page, 'mouseup').pipe(filter(_ => this._mouseMovePreviousEvent !== undefined)).subscribe(e => this._onMouseUp(e));
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

    private _onFrameMove(e: MouseEvent) {
        const selectedFrames = this._selectedFrames;

        for (const frame of selectedFrames) {
            if (target.indexOf('up') > -1) {
                for (const frame of selected) frame.y = Math.max(U.pt(frame.y) - step, 0);
            } else if (target.indexOf('down') > -1) {
                for (const frame of selected) frame.y = Math.min(U.pt(frame.y) + step, U.pt(this._page.height) - U.pt(frame.height));
            } else if (target.indexOf('left') > -1) {
                for (const frame of selected) frame.x = Math.max(U.pt(frame.x) - step, 0);
            } else if (target.indexOf('right') > -1) {
                for (const frame of selected) frame.x = Math.min(U.pt(frame.x) + step, U.pt(this._page.width) - U.pt(frame.width));
            }
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

    private _onMouseDown(e: MouseEvent) {
        const previousDragGuide = this._mouseEventDragGuide;

        this._mouseEventDragGuide = undefined;

        try {
            const pos = GET_OFFSET_POSITION(e);
            this._calcGuideBoundary();
            if (EditorToolDrawFrames.indexOf(this._tool) > -1) {
                this._mouseEventStartPosition = pos;
                this._mouseEventDragGuide = document.createElement('div');
                this._mouseEventDragGuide.classList.add('draw-guide');
                this._page.appendChild(this._mouseEventDragGuide);
            }
        } finally {
            if (previousDragGuide) previousDragGuide.remove();
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

    private _onMouseUp(e: MouseEvent) {
        try {
            if (EditorToolDrawFrames.indexOf(this._tool) > -1) {
                if (!this._mouseEventDragGuide || !this._mouseEventStartPosition) return;

                const size = GET_BOX_SIZE(this._mouseEventStartPosition, GET_OFFSET_POSITION(e), this._pageGuideBoundary);
                let frame: IActaFrame | undefined, changetool: EditorTool | undefined;
                if (size.columnCount < 1 || size.lineCount < 1) return;

                switch (this._tool) {
                    case EditorTool.DRAW_EMPTY_FRAME: break;
                    case EditorTool.DRAW_IMAGE_FRAME:
                        frame = new ActaImage(U.pt(size.x, U.PX), U.pt(size.y, U.PX), U.pt(size.width, U.PX), U.pt(size.height, U.PX));
                        changetool = EditorTool.SELECT;
                        break;
                    case EditorTool.DRAW_TEXT_FRAME:
                        {
                            const paragraph = new ActaParagraph(
                                U.pt(size.x, U.PX), U.pt(size.y, U.PX), U.pt(size.width, U.PX), U.pt(size.height, U.PX),
                                accountInfo.prefDefaultBodyTextStyle, this._page.guide ? size.columnCount : 1, this._page.guide?.innerMargin
                            );
                            paragraph.onMoveCursor = (x) => this._onParagraphMoveCursor(x.paragraph, x.cursor);
                            changetool = EditorTool.TEXT_MODE;
                            frame = paragraph;
                        }
                        break;
                    case EditorTool.DRAW_TITLE_FRAME:
                        {
                            const paragraph = new ActaParagraph(
                                U.pt(size.x, U.PX), U.pt(size.y, U.PX), U.pt(size.width, U.PX), U.pt(size.height, U.PX),
                                accountInfo.prefDefaultTitleTextStyle
                            );
                            paragraph.onMoveCursor = (x) => this._onParagraphMoveCursor(x.paragraph, x.cursor);
                            changetool = EditorTool.TEXT_MODE;
                            frame = paragraph;
                        }
                        break;
                    default: break;
                }
                if (!frame) return;

                this._page.appendChild(frame as IActaFrame);
                this._CHANGE$.next({ action: 'append', value: frame as IActaFrame });

                // 프레임을 페이지에 추가 후 렌더링 이후에 실행
                setTimeout((f: IActaFrame) => {
                    f.focus({ preventScroll: true });
                    if (changetool) this._CHANGE$.next({ action: 'changetool', value: changetool });
                }, 1, frame);
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

    private _onParagraphMoveCursor(paragraph: ActaParagraph, _: number) {
        const textStyle = paragraph.getTextStyleAtCursor(true);
        const textAttr = paragraph.getTextAttributeAtCursor(true);
        const tbData: IActaEditorTextAttribute = {};

        tbData.textStyle = textStyle;
        if (textAttr.fontName !== null) tbData.fontName = textAttr.fontName;
        if (textAttr.fontSize !== null) tbData.fontSize = textAttr.fontSize;
        if (textAttr.indent !== null) tbData.indent = textAttr.indent;
        if (textAttr.xscale !== null) tbData.xscale = textAttr.xscale;
        if (textAttr.letterSpacing !== null) tbData.letterSpacing = textAttr.letterSpacing;
        if (textAttr.lineHeight !== null) tbData.lineHeight = textAttr.lineHeight;
        if (textAttr.underline !== null) tbData.underline = textAttr.underline;
        if (textAttr.strikeline !== null) tbData.strikeline = textAttr.strikeline;
        if (textAttr.textAlign !== null) tbData.textAlign = textAttr.textAlign;

        this._CHANGE$.next({ action: "textstyle", value: tbData });

        if (this._tool !== EditorTool.TEXT_MODE) {
            this._CHANGE$.next({ action: 'changetool', value: EditorTool.TEXT_MODE });
        }
    }

    private get _selectedFrames() {
        return [... this._page.querySelectorAll<IActaFrame>('.frame.focus, .frame.selected')];
    }

    private get _editableParagraph() {
        return this._page.querySelector<ActaParagraph>('x-paragraph.editable'); 
    }

    private get _focusedParagraph() {
        return this._page.querySelector<ActaParagraph>('x-paragraph.focus');
    }

    private get _allFrames() {
        const children = this._page.querySelectorAll('*');
        const frames: IActaFrame[] = [];
        for (const el of children) {
            if (el instanceof IActaFrame) frames.push(el);
        }
        return frames;
    }

    processKeyEvent(e: KeyboardEvent) {
        if (this._editableParagraph) {
            if (e.key === 'Escape') {
                this._editableParagraph.switchEditable(false);
                e.preventDefault();
                e.stopPropagation();
            }
        } else {
            const selected = this._selectedFrames;
            switch (e.key) {
                case 'Delete':
                    for (const frame of selected) frame.remove();
                    break;
                default:
                    return;
            }
            e.preventDefault();
            e.stopPropagation();
        }
    }

    processPageObjectControl(action: string, step?: number) {
        const selected = this._selectedFrames;
        if (selected.length < 1) return;

        const actionType = action.split('-')[0];
        if (actionType === 'remove') {
            for (const frame of selected) frame.remove();
        } else if (step) {
            if (actionType === 'move') {
                const target = action.split('-')[1];
                if (target.indexOf('up') > -1) {
                    for (const frame of selected) frame.y = Math.max(U.pt(frame.y) - step, 0);
                } else if (target.indexOf('down') > -1) {
                    for (const frame of selected) frame.y = Math.min(U.pt(frame.y) + step, U.pt(this._page.height) - U.pt(frame.height));
                } else if (target.indexOf('left') > -1) {
                    for (const frame of selected) frame.x = Math.max(U.pt(frame.x) - step, 0);
                } else if (target.indexOf('right') > -1) {
                    for (const frame of selected) frame.x = Math.min(U.pt(frame.x) + step, U.pt(this._page.width) - U.pt(frame.width));
                }
            } else if (actionType === 'rotate') {
                const target = action.split('-')[1];
                switch (target) {
                    case 'left':
                        for (const frame of selected) frame.rotate -= step;
                        break;
                    case 'right':
                        for (const frame of selected) frame.rotate += step;
                        break;
                    default:
                        break;
                }
            }
        } else {
            if (actionType === 'flip') {
                const target = action.split('-')[2];
                switch (target) {
                    case 'back':
                        for (const frame of selected) {
                            if (frame.previousElementSibling) {
                                const prevEl = frame.previousElementSibling;
                                if (prevEl) this._page.insertBefore(frame, prevEl);
                            }
                        }
                        break;
                    case 'front':
                        for (const frame of selected) {
                            if (frame.nextElementSibling) {
                                const nextEl = frame.nextElementSibling;
                                if (nextEl) this._page.insertBefore(frame, nextEl.nextElementSibling);
                            }
                        }
                        break;
                    default:
                        break;
                }
            } else if (actionType === 'align') {
                const target = action.split('-')[1];
                if (selected.length < 2) return;

                const left: number[] = [], right: number[] = [];
                for (const frame of selected) {
                    left.push(U.pt(frame.x));
                    right.push(U.pt(frame.x) + U.pt(frame.width));
                }
                const minLeft = Math.min(... left);
                const maxRight = Math.max(... right);
                const center = minLeft + (maxRight - minLeft) / 2;

                if (target === 'center') {
                    for (const frame of selected) frame.x = center - (U.pt(frame.width) / 2);
                } else if (target === 'left') {
                    for (const frame of selected) frame.x = minLeft;
                } else if (target === 'right') {
                    for (const frame of selected) frame.x = maxRight - U.pt(frame.width);
                }
            } else if (actionType === 'valign') {
                const target = action.split('-')[1];
                if (selected.length < 2) return;

                const top: number[] = [], bottom: number[] = [];
                for (const frame of selected) {
                    top.push(U.pt(frame.y));
                    bottom.push(U.pt(frame.y) + U.pt(frame.height));
                }
                const minTop = Math.min(... top);
                const maxBottom = Math.max(... bottom);
                const middle = minTop + (maxBottom - minTop) / 2;

                if (target === 'middle') {
                    for (const frame of selected) frame.y = middle - (U.pt(frame.height) / 2);
                } else if (target === 'top') {
                    for (const frame of selected) frame.y = minTop;
                } else if (target === 'bottom') {
                    for (const frame of selected) frame.y = maxBottom - U.pt(frame.height);
                }
            }
        }
    }

    setTextStyle(tbData: IActaEditorTextAttribute) {
        const paragraph = this._page.querySelector<ActaParagraph>('x-paragraph.focus.editable');
        if (!paragraph) return;

        const textAttr = new ActaTextAttribute();
        if (tbData.textStyle) textAttr.copy(ActaTextStyleManager.get(tbData.textStyle));
        if (tbData.fontName) textAttr.fontName = tbData.fontName;
        if (tbData.fontSize) textAttr.fontSize = tbData.fontSize;
        if (tbData.xscale) textAttr.xscale = tbData.xscale;
        if (tbData.letterSpacing) textAttr.letterSpacing = tbData.letterSpacing;
        if (tbData.lineHeight) textAttr.lineHeight = tbData.lineHeight;
        if (tbData.textAlign) textAttr.textAlign = tbData.textAlign;
        if (tbData.underline) textAttr.underline = tbData.underline;
        if (tbData.strikeline) textAttr.strikeline = tbData.strikeline;
        if (tbData.indent) textAttr.indent = tbData.indent;

        if (tbData.textStyle) paragraph.setTextStyleAtCursor(tbData.textStyle);
        paragraph.setTextAttributeAtCursor(textAttr);
    }

    cancel() {
        if (!this._mouseEventDragGuide && !this._mouseEventStartPosition) return;

        if (this._mouseEventDragGuide) this._mouseEventDragGuide.remove();
        this._mouseEventDragGuide = undefined;
        this._mouseEventStartPosition = undefined;
        this._pageGuideBoundary = undefined;
    }

    set tool(tool: EditorTool) {
        const allFrames = this._allFrames;
        this._tool = tool;
        if (this._tool !== EditorTool.FRAME_MOVE_MODE) {
            for (const frame of this._selectedFrames) frame.classList.remove('selected');
            for (const frame of allFrames) frame.moveMode = false;
        } else {
            for (const frame of allFrames) frame.moveMode = true;
        }
        if (this._tool === EditorTool.TEXT_MODE) {
            const focusedPara = this._focusedParagraph;
            if (!focusedPara) return;
            if (focusedPara.classList.contains('editable')) return;
            focusedPara.switchEditable(true);
        } else {
            if ([EditorTool.FRAME_EDIT_MODE, EditorTool.FRAME_MOVE_MODE].concat(EditorToolDrawFrames).indexOf(this._tool) > -1) {
                const editablePara = this._editableParagraph;
                if (editablePara) editablePara.switchEditable(false);
            }
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