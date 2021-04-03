import ActaPage from '../pageobject/page';
import ActaGuide from '../pageobject/guide';
import ActaParagraph from '../pageobject/paragraph';
import ActaTextAttribute from '../pageobject/textstyle/textattribute';
import ActaImage from '../pageobject/image';
import IActaFrame from '../pageobject/interface/frame';
import accountInfo from '../info/account';
import U from '../util/units';

import { CodePageSize } from '../info/code';
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

type Position = {
    x: number,
    y: number,
    xIndex?: number,
    yIndex?: number
};

type Boundary = {
    x: number[],
    y: number[]
};

export default class ActaEditor {
    private _element: HTMLElement;
    private _tool: EditorTool;
    private _page: ActaPage;
    private _readonly: boolean;
    private _magnetRange: number;

    private _mouseEventDragGuide?: HTMLElement;
    private _mouseMovePreviousEvent?: MouseEvent;
    private _mouseEventStartPosition?: { x: number, y: number };
    private _pageGuideBoundary?: Boundary;

    private _EVENT$: Subject<{ action: string, value: any }>;

    private static getOffsetPosition(e: MouseEvent, parentEl?: IActaFrame): Position {
        let left = e.offsetX, top = e.offsetY;
        if (!e.target) return { x: left, y: top };

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
        return { x: left, y: top };
    }

    private static getFrame(el: HTMLElement | null) {
        let nowEl: HTMLElement | null = el;
        while (true) {
            if (!nowEl) break;
            if (nowEl instanceof IActaFrame) break;
            nowEl = nowEl.parentElement;
        }
        return nowEl instanceof IActaFrame ? nowEl as IActaFrame : null;
    }

    private static getMagnetPosition(pos: Position, magnetData?: Boundary, open?: boolean) {
        if (!magnetData) return pos;
        if (magnetData.x.length > ((open === undefined) ? 0 : 1)) {
            let dx = Number.MAX_SAFE_INTEGER;
            let idx = -1;
            for (let i = ((open === undefined || open === true) ? 0 : 1); i < magnetData.x.length; i += ((open === undefined) ? 1 : 2)) {
                const x = magnetData.x[i];
                if (Math.abs(dx) > Math.abs(pos.x - x)) {
                    dx = pos.x - x;
                    idx = i;
                }
            }
            pos.x -= dx;
            pos.xIndex = (idx + ((open === false) ? 1 : 0)) / 2;
        }
        if (magnetData.y.length > ((open === undefined) ? 0 : 1)) {
            let dy = Number.MAX_SAFE_INTEGER;
            let idx = -1;
            for (let i = ((open === undefined || open === true) ? 0 : 1); i < magnetData.y.length; i += ((open === undefined) ? 1 : 2)) {
                const y = magnetData.y[i];
                if (Math.abs(dy) > Math.abs(pos.y - y)) {
                    dy = pos.y - y;
                    idx = i;
                }
            }
            pos.y -= dy;
            pos.yIndex = (idx + ((open === false) ? 1 : 0)) / 2;
        }
        return pos;
    }

    private static getValidMagnetPosition(pos: Position, magnetData: Boundary, range: number, open?: boolean) {
        const orgPos: Position = { x: pos.x, y: pos.y };
        const magnetPos = this.getMagnetPosition(pos, magnetData, open);

        if (Math.abs(orgPos.x - magnetPos.x) > range) magnetPos.x = orgPos.x;
        if (Math.abs(orgPos.y - magnetPos.y) > range) magnetPos.y = orgPos.y;

        return magnetPos;
    }

    private static getBoxSize(spos: Position, epos: Position, magnetData?: Boundary) {
        const x1 = Math.min(spos.x, epos.x);
        const y1 = Math.min(spos.y, epos.y);
        const x2 = Math.max(spos.x, epos.x);
        const y2 = Math.max(spos.y, epos.y);

        const nspos = this.getMagnetPosition({ x: x1, y: y1 }, magnetData, true);
        const nepos = this.getMagnetPosition({ x: x2, y: y2 }, magnetData, false);

        return {
            x: nspos.x,
            y: nspos.y,
            width: nepos.x - nspos.x,
            height: nepos.y - nspos.y,
            columnCount: (nepos.xIndex || 0) - (nspos.xIndex || 0),
            lineCount: (nepos.yIndex || 0) - (nspos.yIndex || 0)
        };
    }

    constructor(pageSize: CodePageSize) {
        this._EVENT$ = new Subject();

        this._tool = EditorTool.SELECT;
        this._readonly = false;
        this._magnetRange = 24;

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

            this._EVENT$.next({ action: 'scale', value: scale });
        });

        fromEvent<MouseEvent>(this._page, 'mousedown').pipe(filter(e => e.buttons === 1)).subscribe(e => {
            if (this._tool === EditorTool.FRAME_MOVE_MODE) {
                this._onFrameMoveStart(e);
            } else {
                this._onDrawGuideStart(e)
            }
        });
        fromEvent<MouseEvent>(this._page, 'mousemove').subscribe(e => {
            if (this._tool === EditorTool.FRAME_MOVE_MODE) {
                if (e.buttons === 1) this._onFrameMove(e);
            } else {
                switch (e.buttons) {
                    case 1: this._onDrawGuideMove(e); break;
                    case 4: this._onScrollMove(e); break;
                    default: break;
                }
            }
        });
        fromEvent<MouseEvent>(this._page, 'mouseup').pipe(filter(_ => this._mouseMovePreviousEvent !== undefined)).subscribe(e => {
            try {
                if (EditorToolDrawFrames.indexOf(this._tool) > -1) this._onDrawGuideEnd(e);
            } finally {
                if (this._mouseEventDragGuide) this._mouseEventDragGuide.remove();

                this._mouseEventDragGuide = undefined;
                this._mouseEventStartPosition = undefined;
                this._mouseMovePreviousEvent = undefined;
                this._pageGuideBoundary = undefined;

                e.preventDefault();
                e.stopPropagation();
            }
        });
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

    private _onFrameMoveStart(e: MouseEvent) {
        const frame = ActaEditor.getFrame(e.target as HTMLElement);
        if (!frame) return;

        if (!frame.classList.contains('selected') && !frame.classList.contains('focus')) {
            if (!e.ctrlKey) {
                for (const selectedFrame of this._selectedFrames) selectedFrame.classList.remove('selected');
            }
            frame.classList.add('selected');
        }
        for (const selectedFrame of this._selectedFrames) selectedFrame.savePosition();

        this._calcGuideBoundary();
        this._mouseMovePreviousEvent = e;
    }

    private _onFrameMove(e: MouseEvent) {
        try {
            if (!this._mouseMovePreviousEvent) return;

            const selectedFrames = this._selectedFrames;
            const mx = (e.clientX - this._mouseMovePreviousEvent.clientX) / this._page.scale;
            const my = (e.clientY - this._mouseMovePreviousEvent.clientY) / this._page.scale;

            for (const frame of selectedFrames) {
                let x1 = Math.min(U.px(this._page.width) - U.px(frame.width), Math.max(0, U.px(frame.savedPositionLeft) + mx));
                let y1 = Math.min(U.px(this._page.height) - U.px(frame.height), Math.max(0, U.px(frame.savedPositionTop) + my));

                if (this._pageGuideBoundary && !e.ctrlKey) {
                    if (frame instanceof ActaParagraph || frame instanceof ActaImage) {
                        const x2 = x1 + U.px(frame.width);
                        const y2 = y1 + U.px(frame.height);

                        const nspos = ActaEditor.getValidMagnetPosition({ x: x1, y: y1 }, this._pageGuideBoundary, this._magnetRange / this._page.scale, true);
                        const nepos = ActaEditor.getValidMagnetPosition({ x: x2, y: y2 }, this._pageGuideBoundary, this._magnetRange / this._page.scale, false);

                        if (nspos.x !== x1) x1 = nspos.x;
                        else if (nepos.x !== x2) x1 = nepos.x - U.px(frame.width);

                        if (nspos.y !== y1) y1 = nspos.y;
                        else if (nepos.y !== y2) y1 = nepos.y - U.px(frame.height);
                    } else {
                        const npos = ActaEditor.getValidMagnetPosition({ x: x1, y: y1 }, this._pageGuideBoundary, this._magnetRange / this._page.scale);
                        x1 = npos.x;
                        y1 = npos.y;
                    }
                }
                frame.x = `${x1}px`;
                frame.y = `${y1}px`;
            }
        } finally {
            e.preventDefault();
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

    private _onDrawGuideStart(e: MouseEvent) {
        const previousDragGuide = this._mouseEventDragGuide;

        this._mouseEventDragGuide = undefined;

        try {
            const pos = ActaEditor.getOffsetPosition(e);
            this._calcGuideBoundary();
            if (EditorToolDrawFrames.indexOf(this._tool) > -1) {
                this._mouseEventStartPosition = pos;
                this._mouseEventDragGuide = document.createElement('div');
                this._mouseEventDragGuide.classList.add('draw-guide');
                this._page.appendChild(this._mouseEventDragGuide);
            }
        } finally {
            if (previousDragGuide) previousDragGuide.remove();
            this._mouseMovePreviousEvent = e;

            e.stopPropagation();
        }
    }

    private _onDrawGuideMove(e: MouseEvent) {
        try {
            if (EditorToolDrawFrames.indexOf(this._tool) > -1 && this._mouseEventDragGuide && this._mouseEventStartPosition) {
                const size = ActaEditor.getBoxSize(this._mouseEventStartPosition, ActaEditor.getOffsetPosition(e), this._pageGuideBoundary);
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

    private async _onDrawGuideEnd(e: MouseEvent) {
        if (!this._mouseEventDragGuide || !this._mouseEventStartPosition) return;

        const size = ActaEditor.getBoxSize(this._mouseEventStartPosition, ActaEditor.getOffsetPosition(e), this._pageGuideBoundary);
        let frame: IActaFrame | undefined, changetool: EditorTool | undefined;
        if (size.columnCount < 1 || size.lineCount < 1) return;

        switch (this._tool) {
            case EditorTool.DRAW_EMPTY_FRAME:
                {
                    const paragraph = new ActaParagraph(
                        U.pt(size.x, U.PX), U.pt(size.y, U.PX), U.pt(size.width, U.PX), U.pt(size.height, U.PX),
                        accountInfo.prefDefaultBodyTextStyle
                    );
                    paragraph.onMoveCursor = (x) => this._onParagraphMoveCursor(x.paragraph, x.cursor);
                    paragraph.readonly = true;
                    frame = paragraph;
                }
                break;
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
        this._EVENT$.next({ action: 'append', value: frame as IActaFrame });

        // 프레임을 페이지에 추가 후 렌더링 이후에 실행
        await frame.focus({ preventScroll: true }, true);
        if (changetool) this._EVENT$.next({ action: 'changetool', value: changetool });
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

        this._EVENT$.next({ action: "textstyle", value: tbData });

        if (this._tool !== EditorTool.TEXT_MODE) {
            this._EVENT$.next({ action: 'changetool', value: EditorTool.TEXT_MODE });
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

    onKeydown(e: KeyboardEvent) {
        if (this._editableParagraph) {
            if (e.key === 'Escape') {
                this._editableParagraph.switchEditable(false);
            } else return true;
        } else {
            const selected = this._selectedFrames;
            switch (e.key) {
                case 'Delete':
                    for (const frame of selected) frame.remove();
                    break;
                case 'Escape':
                    for (const frame of selected) {
                        if (frame.isFocused) frame.blur();
                        frame.classList.remove('selected');
                    }
                    break;
                default:
                    return true;
            }
        }
        e.preventDefault();
        e.stopPropagation();

        return false;
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

    setTextAttribute(tbData: IActaEditorTextAttribute, type: string) {
        const paragraph = this._page.querySelector<ActaParagraph>('x-paragraph.focus.editable');
        if (!paragraph) return;

        if (type === 'textstyle') {
            if (tbData.textStyle) paragraph.setTextStyleAtCursor(tbData.textStyle);
        } else {
            const textAttr = new ActaTextAttribute();
            if (type === 'font') textAttr.fontName = tbData.fontName || '';
            if (type === 'fontsize') textAttr.fontSize = tbData.fontSize !== undefined ? tbData.fontSize : null;
            if (type === 'xscale') textAttr.xscale = tbData.xscale !== undefined ? tbData.xscale : null;
            if (type === 'letterspacing') textAttr.letterSpacing = tbData.letterSpacing !== undefined ? tbData.letterSpacing : null;
            if (type === 'lineheight') textAttr.lineHeight = tbData.lineHeight !== undefined ? tbData.lineHeight : null;
            if (type === 'align') textAttr.textAlign = tbData.textAlign !== undefined ? tbData.textAlign : null;
            if (type === 'underline') textAttr.underline = tbData.underline !== undefined ? tbData.underline : null;
            if (type === 'strikeline') textAttr.strikeline = tbData.strikeline !== undefined ? tbData.strikeline : null;
            if (type === 'indent') textAttr.indent = tbData.indent !== undefined ? tbData.indent : null;
            paragraph.setTextAttributeAtCursor(textAttr);
        }
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

    get observable() { return this._EVENT$; }
    get page() { return this._page; }
    get el() { return this._element; }
}