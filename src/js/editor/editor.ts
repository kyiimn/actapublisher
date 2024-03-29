import ActaPage from '../pageobject/page';
import ActaGuide from '../pageobject/guide';
import ActaParagraph from '../pageobject/paragraph';
import ActaTextAttribute from '../pageobject/textstyle/textattribute';
import ActaImage from '../pageobject/image';
import IActaFrame, { FrameOverlapMethod, IActaFrameAttribute } from '../pageobject/interface/frame';
import accountInfo from '../info/account';
import groupmgr from '../pageobject/groupmgr';
import U from '../util/units';

import { CodePageSize } from '../info/code';
import { TextAlign } from '../pageobject/textstyle/textattribute-absolute';
import { fromEvent, Subject } from 'rxjs';
import { filter } from 'rxjs/operators';
import { detect } from 'detect-browser';

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

const EditorToolSelect = [
    EditorTool.SELECT,
    EditorTool.FRAME_EDIT_MODE,
    EditorTool.FRAME_MOVE_MODE
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

export interface IActaEditorParagraphColumnAttribute {
    columnCount?: number,
    innerMargin?: number | string;
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

type EVENT_TYPE = 'append' | 'changetool' | 'textstyle' | 'scale' | 'frameattribute';

export default class ActaEditor {
    private _element: HTMLElement;
    private _tool: EditorTool;
    private _page: ActaPage;
    private _readonly: boolean;
    private _magnetRange: number;
    private _ignoreMoveLimit: number;

    private _mouseEventDragGuide?: HTMLElement;
    private _mouseMovePreviousEvent?: MouseEvent;
    private _mouseEventStartPosition?: { x: number, y: number };
    private _pageGuideBoundary?: Boundary;

    private _EVENT$: Subject<{ action: EVENT_TYPE, value: any }>;

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

    private _getSelectedBoundingClientRect(savedPosition?: boolean) {
        const selectedFrames = this.page.selectedFrames;
        let minX = Number.MAX_SAFE_INTEGER, minY = Number.MAX_SAFE_INTEGER;
        let maxX = 0, maxY = 0;

        if (selectedFrames.length < 1) return null;
        if (this._tool !== EditorTool.FRAME_MOVE_MODE && savedPosition) return null;

        for (const frame of selectedFrames) {
            minX = Math.min(minX, U.px(savedPosition ? frame.savedPositionLeft : frame.x));
            minY = Math.min(minY, U.px(savedPosition ? frame.savedPositionTop : frame.y));
            maxX = Math.max(maxX, U.px(savedPosition ? frame.savedPositionLeft : frame.x) + U.px(frame.width));
            maxY = Math.max(maxY, U.px(savedPosition ? frame.savedPositionTop : frame.y) + U.px(frame.height));
        }
        return new DOMRect(minX, minY, maxX - minX, maxY - minY);
    }

    private _calcGuideBoundary() {
        const guides = this.page.guide?.querySelectorAll('x-guide-col, x-guide-margin');
        if (guides && guides.length > 0) {
            const guideTop = U.px(this.page.paddingTop);
            const guideLeft = U.px(this.page.paddingLeft);

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

    private _onSelectStart(e: MouseEvent) {
        const frame = ActaEditor.getFrame(e.target as HTMLElement);
        if (!frame) return;

        if (!frame.isSelected) {
            if (!e.ctrlKey && !e.shiftKey) {
                for (const selectedFrame of this.page.selectedFrames) {
                    selectedFrame.unselect();
                }
                frame.focus({ preventScroll: true });
            } else {
                frame.select();
            }
        }
    }

    private _onSelectEnd(e: MouseEvent) {
        const frame = ActaEditor.getFrame(e.target as HTMLElement);
        if (!frame) return;

        if (!e.ctrlKey && !e.shiftKey) {
            for (const selectedFrame of this.page.selectedFrames) {
                selectedFrame.unselect();
            }
            const members = groupmgr.getMember(this.page, frame) || [];
            for (const member of members) {
                if (member === frame) continue;
                member.select();
            }
            frame.focus({ preventScroll: true });
        }
    }

    private _onFrameMoveStart(e: MouseEvent) {
        const frame = ActaEditor.getFrame(e.target as HTMLElement);
        if (!frame) return;

        for (const selectedFrame of this.page.selectedFrames) selectedFrame.savePosition();

        this._calcGuideBoundary();
        this._mouseMovePreviousEvent = e;
    }

    private _onFrameMove(e: MouseEvent) {
        if (!this._mouseMovePreviousEvent) return;

        const selectedFrames = this.page.selectedFrames;
        const mx = (e.clientX - this._mouseMovePreviousEvent.clientX) / this.page.scale;
        const my = (e.clientY - this._mouseMovePreviousEvent.clientY) / this.page.scale;

        if (selectedFrames.length > 1) {
            const rect = this._getSelectedBoundingClientRect(true);
            if (!rect) return;

            let x1 = Math.min(U.px(this.page.width) - rect.width, Math.max(0, rect.x + mx));
            let y1 = Math.min(U.px(this.page.height) - rect.height, Math.max(0, rect.y + my));

            if (this._pageGuideBoundary && !e.ctrlKey) {
                const x2 = x1 + rect.width;
                const y2 = y1 + rect.height;

                const nspos = ActaEditor.getValidMagnetPosition({ x: x1, y: y1 }, this._pageGuideBoundary, this._magnetRange / this.page.scale, true);
                const nepos = ActaEditor.getValidMagnetPosition({ x: x2, y: y2 }, this._pageGuideBoundary, this._magnetRange / this.page.scale, false);

                if (nspos.x !== x1) x1 = nspos.x;
                else if (nepos.x !== x2) x1 = nepos.x - rect.width;

                if (nspos.y !== y1) y1 = nspos.y;
                else if (nepos.y !== y2) y1 = nepos.y - rect.height;
            }

            for (const frame of selectedFrames) {
                frame.x = `${U.px(frame.savedPositionLeft) + (x1 - rect.x)}px`;
                frame.y = `${U.px(frame.savedPositionTop) + (y1 - rect.y)}px`;
            }
        } else if (selectedFrames.length === 1) {
            const frame = selectedFrames[0];
            let x1 = Math.min(U.px(this.page.width) - U.px(frame.width), Math.max(0, U.px(frame.savedPositionLeft) + mx));
            let y1 = Math.min(U.px(this.page.height) - U.px(frame.height), Math.max(0, U.px(frame.savedPositionTop) + my));

            if (this._pageGuideBoundary && !e.ctrlKey) {
                if (frame instanceof ActaParagraph || frame instanceof ActaImage) {
                    const x2 = x1 + U.px(frame.width);
                    const y2 = y1 + U.px(frame.height);

                    const nspos = ActaEditor.getValidMagnetPosition({ x: x1, y: y1 }, this._pageGuideBoundary, this._magnetRange / this.page.scale, true);
                    const nepos = ActaEditor.getValidMagnetPosition({ x: x2, y: y2 }, this._pageGuideBoundary, this._magnetRange / this.page.scale, false);

                    if (nspos.x !== x1) x1 = nspos.x;
                    else if (nepos.x !== x2) x1 = nepos.x - U.px(frame.width);

                    if (nspos.y !== y1) y1 = nspos.y;
                    else if (nepos.y !== y2) y1 = nepos.y - U.px(frame.height);
                } else {
                    const npos = ActaEditor.getValidMagnetPosition({ x: x1, y: y1 }, this._pageGuideBoundary, this._magnetRange / this.page.scale);
                    x1 = npos.x;
                    y1 = npos.y;
                }
            }
            frame.x = `${x1}px`;
            frame.y = `${y1}px`;
        }
    }

    private _onFrameMoveEnd(e: MouseEvent) {
        if (!this._mouseMovePreviousEvent) return;

        const selectedFrames = this.page.selectedFrames;
        const mx = (e.clientX - this._mouseMovePreviousEvent.clientX);
        const my = (e.clientY - this._mouseMovePreviousEvent.clientY);

        if (Math.abs(mx) > this._ignoreMoveLimit || Math.abs(my) > this._ignoreMoveLimit) return true;

        for (const frame of selectedFrames) {
            frame.restorePosition();
        }
        return false;
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
                this.page.appendChild(this._mouseEventDragGuide);
            }
        } finally {
            if (previousDragGuide) previousDragGuide.remove();
            this._mouseMovePreviousEvent = e;
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
                        accountInfo.defaultBodyTextStyle
                    );
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
                        accountInfo.defaultBodyTextStyle, this.page.guide ? size.columnCount : 1, this.page.guide?.innerMargin
                    );
                    paragraph.onChangeColumn = p => this._onParagraphChangeColumn(p);
                    paragraph.onChangeCursor = p => this._onParagraphChangeCursor(p);
                    paragraph.onChangeEditable = _ => this._onParagraphChangeEditable();
                    changetool = EditorTool.TEXT_MODE;
                    frame = paragraph;
                }
                break;
            case EditorTool.DRAW_TITLE_FRAME:
                {
                    const paragraph = new ActaParagraph(
                        U.pt(size.x, U.PX), U.pt(size.y, U.PX), U.pt(size.width, U.PX), U.pt(size.height, U.PX),
                        accountInfo.defaultTitleTextStyle
                    );
                    paragraph.onChangeColumn = p => this._onParagraphChangeColumn(p);
                    paragraph.onChangeCursor = p => this._onParagraphChangeCursor(p);
                    paragraph.onChangeEditable = _ => this._onParagraphChangeEditable();
                    changetool = EditorTool.TEXT_MODE;
                    frame = paragraph;
                }
                break;
            default: break;
        }
        if (!frame) return;

        this.page.appendChild(frame as IActaFrame);
        this._EVENT$.next({ action: 'append', value: frame as IActaFrame });

        // 프레임을 페이지에 추가 후 렌더링 이후에 실행
        await frame.focus({ preventScroll: true }, true);
        if (changetool) this._EVENT$.next({ action: 'changetool', value: changetool });
    }

    private _onParagraphChangeEditable() {
        this._EVENT$.next({ action: 'textstyle', value: null });
    }

    private _onParagraphChangeCursor(paragraph: ActaParagraph) {
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

    private _onParagraphChangeColumn(paragraph: ActaParagraph) {
        console.log(paragraph.columnCount);
        console.log(paragraph.innerMargin);
    }

    private _onPageChangeSelectFrames() {
        const frames = this.page.selectedFrames;
        let attr: IActaFrameAttribute | null = null;
        if (frames.length > 0) {
            attr = frames[0].frameAttribute;
            for (const frame of frames) {
                const fattr = frame.frameAttribute;
                if (U.pt(attr.x) !== U.pt(fattr.x)) attr.x = undefined;
                if (U.pt(attr.y) !== U.pt(fattr.y)) attr.y = undefined;
                if (U.pt(attr.width) !== U.pt(fattr.width)) attr.width = undefined;
                if (U.pt(attr.height) !== U.pt(fattr.height)) attr.height = undefined;
                if (U.pt(attr.paddingLeft) !== U.pt(fattr.paddingLeft)) attr.paddingLeft = undefined;
                if (U.pt(attr.paddingTop) !== U.pt(fattr.paddingTop)) attr.paddingTop = undefined;
                if (U.pt(attr.paddingBottom) !== U.pt(fattr.paddingBottom)) attr.paddingBottom = undefined;
                if (U.pt(attr.paddingRight) !== U.pt(fattr.paddingRight)) attr.paddingRight = undefined;
                if (U.pt(attr.borderLeft) !== U.pt(fattr.borderLeft)) attr.borderLeft = undefined;
                if (U.pt(attr.borderTop) !== U.pt(fattr.borderTop)) attr.borderTop = undefined;
                if (U.pt(attr.borderBottom) !== U.pt(fattr.borderBottom)) attr.borderBottom = undefined;
                if (U.pt(attr.borderRight) !== U.pt(fattr.borderRight)) attr.borderRight = undefined;
                if (U.pt(attr.overlapMethod) !== U.pt(fattr.overlapMethod)) attr.overlapMethod = undefined;
            }
        }
        this._EVENT$.next({ action: 'frameattribute', value: attr });
    }

    private get _editableParagraph() {
        for (const frame of this.page.allFrames) {
            if (!(frame instanceof ActaParagraph)) continue;
            if (!frame.classList.contains('editable')) continue;
            return frame;
        }
        return null;
    }

    private get _focusedParagraph() {
        for (const frame of this.page.allFrames) {
            if (!(frame instanceof ActaParagraph)) continue;
            if (!frame.classList.contains('focus')) continue;
            return frame;
        }
        return null;
    }

    private _initPageEvent() {
        const browser = detect();
        if (browser && browser.name === 'firefox') {
            fromEvent<WheelEvent>(this._element, 'DOMMouseScroll').pipe(filter(e => e.ctrlKey)).subscribe(e => {
                e.preventDefault();

                let scale = this.page.scale;
                if (e.detail > 0) scale += 0.02; else scale -= 0.02;
                scale = Math.max(0.05, scale);
                this.page.scale = scale;

                this._EVENT$.next({ action: 'scale', value: scale });
            });
        } else {
            fromEvent<WheelEvent>(this._element, 'mousewheel').pipe(filter(e => e.ctrlKey)).subscribe(e => {
                e.preventDefault();

                let scale = this.page.scale;
                if (e.deltaY < 0) scale += 0.05; else scale -= 0.05;
                scale = Math.max(0.05, scale);
                this.page.scale = scale;

                this._EVENT$.next({ action: 'scale', value: scale });
            });
        }

        fromEvent<MouseEvent>(this.page, 'mousedown').pipe(filter(e => e.buttons === 1)).subscribe(e => {
            if (EditorToolDrawFrames.indexOf(this._tool) > -1) {
                this._onDrawGuideStart(e)
            } else if (EditorToolSelect.indexOf(this._tool) > -1) {
                this._onSelectStart(e);
                if (this._tool === EditorTool.FRAME_MOVE_MODE) this._onFrameMoveStart(e);
            } else return;

            e.preventDefault();
            e.stopPropagation();
        });
        fromEvent<MouseEvent>(this.page, 'mousemove').subscribe(e => {
            if (e.buttons === 4) {
                this._onScrollMove(e);
            } else if (this._tool === EditorTool.FRAME_MOVE_MODE) {
                if (e.buttons === 1) this._onFrameMove(e);
            } else if (EditorToolDrawFrames.indexOf(this._tool) > -1 && e.buttons === 1) {
                this._onDrawGuideMove(e);
            }
            e.preventDefault();
            e.stopPropagation();
        });
        fromEvent<MouseEvent>(this.page, 'mouseup').pipe(filter(_ => this._mouseMovePreviousEvent !== undefined)).subscribe(e => {
            try {
                if (EditorToolDrawFrames.indexOf(this._tool) > -1) {
                    this._onDrawGuideEnd(e);
                } else if (EditorToolSelect.indexOf(this._tool) > -1) {
                    if (EditorTool.FRAME_MOVE_MODE === this._tool) {
                        if (this._onFrameMoveEnd(e)) return;
                    }
                    this._onSelectEnd(e);
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
        });
    }

    constructor(pageSize: CodePageSize) {
        this._EVENT$ = new Subject();

        this._tool = EditorTool.SELECT;
        this._readonly = false;
        this._magnetRange = 24;
        this._ignoreMoveLimit = 2;

        this._element = document.createElement('div');
        this._element.classList.add('editor');

        this._page = new ActaPage(
            `${pageSize.paperWidth}mm`,
            `${pageSize.paperHeight}mm`
        );
        this.page.paddingTop = `${pageSize.lineMarginTop}mm`;
        this.page.paddingBottom = `${pageSize.lineMarginBottom}mm`;
        this.page.paddingLeft = `${pageSize.columnMarginInside}mm`;
        this.page.paddingRight = `${pageSize.columnMarginOutside}mm`;

        this.page.guide = new ActaGuide(pageSize.columnCount, `${pageSize.columnSpacing}mm`);
        this.page.guide.lineMarker = {
            lineHeight: U.px(`${pageSize.lineHeight}mm`),
            lineSpacing: U.px(`${pageSize.lineSpacing}mm`),
            lineCount: pageSize.lineCount
        };

        this._element.appendChild(this.page);
        this.page.onChangeScale = (width, height) => {
            this._element.style.width = `${width}px`;
            this._element.style.height = `${height}px`;
        };
        this.page.scale = 1;
        this.page.onChangeSelectFrames = _ => this._onPageChangeSelectFrames();
        this.page.onChangeFrameSize = frame => {
            if (this.page.selectedFrames.indexOf(frame) < 0) return;
            this._onPageChangeSelectFrames();
        }
        this.page.onMoveFrame = frame => {
            if (this.page.selectedFrames.indexOf(frame) < 0) return;
            this._onPageChangeSelectFrames();
        }
        this._initPageEvent();
    }

    onKeydown(e: KeyboardEvent) {
        const editablePara = this._editableParagraph;
        if (editablePara) {
            if (e.key === 'Escape') {
                editablePara.switchEditable(false);
            } else return true;
        } else {
            const selected = this.page.selectedFrames;
            switch (e.key) {
                case 'Delete':
                    for (const frame of selected) frame.remove();
                    break;
                case 'Escape':
                    for (const frame of selected) {
                        if (frame.isFocused) frame.blur();
                        frame.unselect();
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
        const selectedFrames = this.page.selectedFrames;
        if (selectedFrames.length < 1) return;

        const actionType = action.split('-')[0];
        if (actionType === 'remove') {
            for (const frame of selectedFrames) frame.remove();
        } else if (step) {
            if (actionType === 'move') {
                const target = action.split('-')[1];
                if (target.indexOf('up') > -1) {
                    for (const frame of selectedFrames) frame.y = Math.max(U.pt(frame.y) - step, 0);
                } else if (target.indexOf('down') > -1) {
                    for (const frame of selectedFrames) frame.y = Math.min(U.pt(frame.y) + step, U.pt(this.page.height) - U.pt(frame.height));
                } else if (target.indexOf('left') > -1) {
                    for (const frame of selectedFrames) frame.x = Math.max(U.pt(frame.x) - step, 0);
                } else if (target.indexOf('right') > -1) {
                    for (const frame of selectedFrames) frame.x = Math.min(U.pt(frame.x) + step, U.pt(this.page.width) - U.pt(frame.width));
                }
            } else if (actionType === 'rotate') {
                const target = action.split('-')[1];
                switch (target) {
                    case 'left':
                        for (const frame of selectedFrames) frame.rotate -= step;
                        break;
                    case 'right':
                        for (const frame of selectedFrames) frame.rotate += step;
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
                        for (const frame of selectedFrames) {
                            if (frame.previousElementSibling) {
                                const prevEl = frame.previousElementSibling;
                                if (prevEl) this.page.insertBefore(frame, prevEl);
                            }
                        }
                        break;
                    case 'front':
                        for (const frame of selectedFrames) {
                            if (frame.nextElementSibling) {
                                const nextEl = frame.nextElementSibling;
                                if (nextEl) this.page.insertBefore(frame, nextEl.nextElementSibling);
                            }
                        }
                        break;
                    default:
                        break;
                }
            } else if (actionType === 'align') {
                const target = action.split('-')[1];
                if (selectedFrames.length < 2) return;

                const left: number[] = [], right: number[] = [];
                for (const frame of selectedFrames) {
                    left.push(U.pt(frame.x));
                    right.push(U.pt(frame.x) + U.pt(frame.width));
                }
                const minLeft = Math.min(... left);
                const maxRight = Math.max(... right);
                const center = minLeft + (maxRight - minLeft) / 2;

                if (target === 'center') {
                    for (const frame of selectedFrames) frame.x = center - (U.pt(frame.width) / 2);
                } else if (target === 'left') {
                    for (const frame of selectedFrames) frame.x = minLeft;
                } else if (target === 'right') {
                    for (const frame of selectedFrames) frame.x = maxRight - U.pt(frame.width);
                }
            } else if (actionType === 'valign') {
                const target = action.split('-')[1];
                if (selectedFrames.length < 2) return;

                const top: number[] = [], bottom: number[] = [];
                for (const frame of selectedFrames) {
                    top.push(U.pt(frame.y));
                    bottom.push(U.pt(frame.y) + U.pt(frame.height));
                }
                const minTop = Math.min(... top);
                const maxBottom = Math.max(... bottom);
                const middle = minTop + (maxBottom - minTop) / 2;

                if (target === 'middle') {
                    for (const frame of selectedFrames) frame.y = middle - (U.pt(frame.height) / 2);
                } else if (target === 'top') {
                    for (const frame of selectedFrames) frame.y = minTop;
                } else if (target === 'bottom') {
                    for (const frame of selectedFrames) frame.y = maxBottom - U.pt(frame.height);
                }
            }
        }
    }

    setTextAttribute(attr: string, value: IActaEditorTextAttribute) {
        const paragraph = this.page.querySelector<ActaParagraph>('x-paragraph.focus.editable');
        if (!paragraph) return;

        if (attr === 'textstyle') {
            if (value.textStyle) paragraph.setTextStyleAtCursor(value.textStyle);
        } else {
            const textAttr = new ActaTextAttribute();
            if (attr === 'font') textAttr.fontName = value.fontName || '';
            if (attr === 'fontsize') textAttr.fontSize = value.fontSize !== undefined ? value.fontSize : null;
            if (attr === 'xscale') textAttr.xscale = value.xscale !== undefined ? value.xscale : null;
            if (attr === 'letterspacing') textAttr.letterSpacing = value.letterSpacing !== undefined ? value.letterSpacing : null;
            if (attr === 'lineheight') textAttr.lineHeight = value.lineHeight !== undefined ? value.lineHeight : null;
            if (attr === 'align') textAttr.textAlign = value.textAlign !== undefined ? value.textAlign : null;
            if (attr === 'underline') textAttr.underline = value.underline !== undefined ? value.underline : null;
            if (attr === 'strikeline') textAttr.strikeline = value.strikeline !== undefined ? value.strikeline : null;
            if (attr === 'indent') textAttr.indent = value.indent !== undefined ? value.indent : null;
            paragraph.setTextAttributeAtCursor(textAttr);
        }
    }

    setFrameAttribute(attr: string, value: string) {
        const selectedFrames = this.page.selectedFrames;
        for (const frame of selectedFrames) {
            if (attr === 'overlap') {
                if (value === 'overlap') frame.overlapMethod = FrameOverlapMethod.OVERLAP;
                if (value === 'framebox') frame.overlapMethod = FrameOverlapMethod.FRAMEBOX;
                if (value === 'shape') frame.overlapMethod = FrameOverlapMethod.SHAPE;
                if (value === 'jump') frame.overlapMethod = FrameOverlapMethod.JUMP;
            }
            if (attr === 'x') frame.x = value;
            if (attr === 'y') frame.y = value;
            if (attr === 'width') frame.width = value;
            if (attr === 'height') frame.height = value;
            if (attr === 'padding-left') frame.paddingLeft = value;
            if (attr === 'padding-top') frame.paddingTop = value;
            if (attr === 'padding-bottom') frame.paddingBottom = value;
            if (attr === 'padding-right') frame.paddingRight = value;
            if (attr === 'border-left') frame.borderLeft = value;
            if (attr === 'border-top') frame.borderTop = value;
            if (attr === 'border-bottom') frame.borderBottom = value;
            if (attr === 'border-right') frame.borderRight = value;
            // if (attr === 'border-color');
            // if (attr === 'border-style');
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
        const allFrames = this.page.allFrames;
        this._tool = tool;
        if (EditorToolSelect.indexOf(this._tool) < 0) {
            for (const frame of this.page.selectedFrames) frame.unselect();
            for (const frame of allFrames) frame.mode = 'NONE';
        } else {
            for (const frame of allFrames) {
                if (this._tool === EditorTool.FRAME_EDIT_MODE) {
                    frame.mode = 'EDIT';
                } else {
                    frame.mode = 'MOVE';
                }
            }
        }
        if (this._tool === EditorTool.TEXT_MODE) {
            const focusedPara = this._focusedParagraph;
            if (!focusedPara) return;
            if (focusedPara.isEditable) return;
            focusedPara.switchEditable(true);
        } else {
            if ([EditorTool.FRAME_EDIT_MODE, EditorTool.FRAME_MOVE_MODE].concat(EditorToolDrawFrames).indexOf(this._tool) > -1) {
                const editablePara = this._editableParagraph;
                if (editablePara) editablePara.switchEditable(false);
            }
        }
    }

    set scale(scale: number) { this.page.scale = scale; }
    set readonly(value: boolean) { this._readonly = value; }

    get scale() { return this.page.scale; }
    get tool() { return this._tool; }
    get readonly() { return this._readonly; }

    get observable() { return this._EVENT$; }
    get page() { return this._page; }
    get el() { return this._element; }
}