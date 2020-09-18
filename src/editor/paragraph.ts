import { ActaParagraphElement } from './element/paragraph-el';
import { ActaParagraphColumnElement } from './element/paragraph-col-el';
import { ActaParagraphMarginElement } from './element/paragraph-margin-el';

import { ActaTextStyleManager } from './textstylemgr';
import { ActaTextConverter } from './textconverter';
import { ActaTextNode } from './textnode';
import { ActaTextStyle, TextAlign } from './textstyle';
import { v4 as uuidv4 } from 'uuid';

import Hangul from 'hangul-js';
import opentype from 'opentype.js';
import $ from 'jquery';

const KEYCODE_MAP: { [key: number]: string[] } = {
    81: ['q','ㅂ','ㅃ'],
    87: ['w','ㅈ','ㅉ'],
    69: ['e','ㄷ','ㄸ'],
    82: ['r','ㄱ','ㄲ'],
    84: ['t','ㅅ','ㅆ'],
    89: ['y','ㅛ','ㅛ'],
    85: ['u','ㅕ','ㅕ'],
    73: ['i','ㅑ','ㅑ'],
    79: ['o','ㅐ','ㅒ'],
    80: ['p','ㅔ','ㅖ'],
    65: ['a','ㅁ','ㅁ'],
    83: ['s','ㄴ','ㄴ'],
    68: ['d','ㅇ','ㅇ'],
    70: ['f','ㄹ','ㄹ'],
    71: ['g','ㅎ','ㅎ'],
    72: ['h','ㅗ','ㅗ'],
    74: ['j','ㅓ','ㅓ'],
    75: ['k','ㅏ','ㅏ'],
    76: ['l','ㅣ','ㅣ'],
    90: ['z','ㅋ','ㅋ'],
    88: ['x','ㅌ','ㅌ'],
    67: ['c','ㅊ','ㅊ'],
    86: ['v','ㅍ','ㅍ'],
    66: ['b','ㅠ','ㅠ'],
    78: ['n','ㅜ','ㅜ'],
    77: ['m','ㅡ','ㅡ']
};

interface IDrawableTextItem {
    id: string;
    textNode: ActaTextNode,
    textStyle: ActaTextStyle;
    indexOfNode: number;
    indexOfText: number;
    line: IDrawableLineData | null;
    char: string;
    type: DrawableTextItemType;
    calcWidth: number;
    width: number;

    path?: SVGPathElement;
    drawOffsetX?: number;
    drawOffsetY?: number;
    height?: number;
};

interface IDrawableLineData {
    indexOfColumn: number;
    indexOfLine: number;
    limitWidth: number;
    maxHeight: number;
    maxLeading: number;
    textAlign: TextAlign;
    indent: number;
    items: IDrawableTextItem[];
};

interface ICursorPosition {
    column: number;
    line: number;
    position: number;
}

enum CursorMode {
    NONE, EDIT, INPUT, SELECTION
};

enum DrawableTextItemType {
    NEWLINE, SPACE, PATH
};

enum InputMethod {
    EN, KO
};

export class ActaParagraph {
    private _element: ActaParagraphElement;
    private _columnCount: number;
    private _innerMargin: string | number;
    private _textObject: ActaTextNode | null;
    private _defaultTextStyleName: string | null;
    private _drawableTextData: IDrawableTextItem[];
    private _selectionStartItem: IDrawableTextItem | null;
    private _cursorMode: CursorMode;
    private _cursorPosition: ICursorPosition | null;
    private _editable: boolean;

    private static _inputMethod:InputMethod = InputMethod.EN;

    static toggleInputMethod() {
        ActaParagraph._inputMethod = ActaParagraph._inputMethod === InputMethod.KO ? InputMethod.EN : InputMethod.KO;
    }

    static getInputMethod() {
        return ActaParagraph._inputMethod;
    }

    static getKeycode2Char(e: KeyboardEvent) {
        const isCapsLock = e.getModifierState('CapsLock');
        const isShiftKey = e.shiftKey;
        const keyCode = e.keyCode;
        let retChar: string | undefined;

        retChar = undefined;
        if (ActaParagraph.getInputMethod() === InputMethod.KO) {
            if (KEYCODE_MAP[keyCode]) retChar = KEYCODE_MAP[keyCode][isShiftKey ? 2 : 1];
        } else {
            if (isCapsLock) {
                if (KEYCODE_MAP[keyCode]) {
                    retChar = KEYCODE_MAP[keyCode][0];
                    if (!isShiftKey) retChar = retChar.toUpperCase();
                }
            } else {
                if (KEYCODE_MAP[keyCode]) {
                    retChar = KEYCODE_MAP[keyCode][0];
                    if (isShiftKey) retChar = retChar.toUpperCase();
                }
            }
        }
        return retChar;
    }

    private _getTextPath(font: opentype.Font, char: string, size: number) {
        const glyph = font.charToGlyph(char);
        const unitsPerSize = font.unitsPerEm / size;
        const charWidth = glyph.advanceWidth / unitsPerSize;
        const charHeight = (font.tables.os2.usWinAscent + font.tables.os2.usWinDescent) / unitsPerSize;
        const yMin = font.tables.head.yMin / unitsPerSize;
        const path = glyph.getPath(0, charHeight, size);
        const pathData = path.toPathData(8);

        const el = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        el.setAttribute('d', pathData);

        return {
            path: el,
            offsetX: 0,
            offsetY: charHeight + yMin,
            width: charWidth,
            height: charHeight
        };
    }

    private _initElement() {
        this._element.innerHTML = '';
    }

    private _setCursorPosition(column: number, line: number, position: number) {
        this._cursorPosition = { column, line, position };
    }

    private _getTextItemsByLine(column: number, line: number) {
        const lineData: IDrawableTextItem[] = [];
        for (const textItem of this._drawableTextData) {
            if (textItem.line === null) continue;
            if (textItem.line.indexOfColumn !== column) continue;
            if (textItem.line.indexOfLine !== line) continue;
            lineData.push(textItem);
        }
        return lineData;
    }

    private _getTextData(column: number): IDrawableLineData[] {
        const columnEl: ActaParagraphColumnElement | undefined = this._element.querySelectorAll<ActaParagraphColumnElement>('x-paragraph-col').item(column);
        if (columnEl === undefined) return [];
        return $(columnEl.svg).data('drawableTextData');
    }

    private _getLineData(column: number, line: number): IDrawableLineData | undefined {
        const textData = this._getTextData(column);
        return textData[line];
    }

    private _setCursor(textItem: IDrawableTextItem, x?: number) {
        const path = $(this._element.svg).find(`path[data-id="${textItem.id}"]`);
        if (textItem.line === null) return null;

        const lineItem = this._getTextItemsByLine(textItem.line.indexOfColumn, textItem.line.indexOfLine);
        let position = lineItem.indexOf(textItem);
        if (x !== undefined && path.length > 0) {
            const pathX = parseFloat(path.attr('data-x') || '0');
            const pathWidth = parseFloat(path.attr('data-width') || '0');
            if (pathWidth > 0) {
                const offsetX = x - pathX;
                if (pathWidth / 2 < offsetX) position++;
            }
        }
        this._setCursorPosition(textItem.line.indexOfColumn, textItem.line.indexOfLine, position);

        return lineItem[position];
    };

    private _redrawCursor() {
        $(this._element.svg).find('.cursor').remove();
        if (this._cursorPosition === null) return;

        const lineItems = this._getTextItemsByLine(this._cursorPosition.column, this._cursorPosition.line);
        if (this._cursorMode === CursorMode.SELECTION && lineItems[this._cursorPosition.position] !== this._selectionStartItem) {
            let currentColumn: ActaParagraphColumnElement | undefined;
            let currentLine = -1;
            let selection;
            let startx = 0;

            if (this._selectionStartItem === null) return;

            let startpos = this._drawableTextData.indexOf(this._selectionStartItem);
            let endpos = this._drawableTextData.indexOf(lineItems[Math.min(this._cursorPosition.position, lineItems.length - 1)]);

            if (startpos > endpos) {
                [startpos, endpos] = [endpos, startpos];
            } else {
                endpos--;
            }
            for (let i = startpos; i <= endpos; i++) {
                const textItem = this._drawableTextData[Math.min(i, this._drawableTextData.length - 1)];
                let path: SVGPathElement | null = null;
                let columnIdx = -1;

                $(this._element.svg).each((j, svg) => {
                    path = svg.querySelector<SVGPathElement>(`path[data-id="${textItem.id}"]`);
                    if (!path) return;

                    columnIdx = j;
                    return false;
                });
                if (path === null) continue;

                const column = $(this._element).find('x-paragraph-col').get(columnIdx);

                if (textItem.line === null) continue;
                if (currentColumn !== column || currentLine !== textItem.line.indexOfLine || selection === undefined) {
                    currentColumn = column as ActaParagraphColumnElement;
                    currentLine = textItem.line.indexOfLine;
                    startx = parseFloat($(path).attr('data-x') || '0');
                    selection = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
                    $(selection).attr({
                        'x': startx,
                        'y': $(path).attr('data-y') || 0,
                        'width': parseFloat($(path).attr('data-width') || '0'),
                        'height': parseFloat($(path).attr('data-height') || '0'),
                        'fill': '#5555ff',
                        'fill-opacity': 0.4,
                        'stroke': '#0000ff',
                        'data-start-id': this._drawableTextData[startpos].id,
                        'data-end-id': this._drawableTextData[startpos].id
                    }).addClass('cursor');
                    $(currentColumn.svg).append(selection);
                } else {
                    const endx = parseFloat($(path).attr('data-x') || '0') + parseFloat($(path).attr('data-width') || '0');
                    $(selection).attr('width', endx - startx);
                }
            }
        } else {
            const currentColumn: ActaParagraphColumnElement | undefined = $(this._element).find('x-paragraph-col').get(this._cursorPosition.column) as ActaParagraphColumnElement;
            let x = 0;
            let y = 0;
            let height = 0;

            if (this._cursorPosition.position === lineItems.length) {
                const path = $(this._element.svg).find(`path[data-id="${lineItems[lineItems.length - 1].id}"]`);
                x = parseFloat(path.attr('data-x') || '0') + parseFloat(path.attr('data-width') || '0');
                y = parseFloat(path.attr('data-y') || '0');
                height = parseFloat(path.attr('data-height') || '0');
            } else {
                if (lineItems.length > 0) {
                    const path = $(this._element.svg).find(`path[data-id="${lineItems[this._cursorPosition.position].id}"]`);
                    x = parseFloat(path.attr('data-x') || '0');
                    y = parseFloat(path.attr('data-y') || '0');
                    height = parseFloat(path.attr('data-height') || '0');
                }
            }
            const cursor = document.createElementNS('http://www.w3.org/2000/svg', 'line');
            $(cursor).attr({
                'x1': x,
                'x2': x,
                'y1': y - 1,
                'y2': y + height + 1,
                'stroke-width': 1,
                'stroke': '#0000ff'
            }).addClass('cursor');
            $(currentColumn.svg).append(cursor);
        }
    }

    private _getTextDataByPosition(column: ActaParagraphColumnElement, x: number, y: number, width?: number, height?: number) {
        const textData: IDrawableTextItem[] = [];
        const idList: string[] = [];

        if (width === undefined) width = 1;
        if (height === undefined) height = 1;

        const x2 = x + width;
        const y2 = y + height;

        $(column.svg).find('path').each((i: number, path: SVGPathElement) => {
            const itemX1 = parseFloat($(path).attr('data-x') || '');
            const itemX2 = parseFloat($(path).attr('data-x') || '') + parseFloat($(path).attr('data-width') || '');
            const itemY1 = parseFloat($(path).attr('data-y') || '');
            const itemY2 = parseFloat($(path).attr('data-y') || '') + parseFloat($(path).attr('data-height') || '') + parseFloat($(path).attr('data-leading') || '');
            const id = $(path).attr('data-id');

            if (isNaN(itemX1) || isNaN(itemX2) || isNaN(itemY1) || isNaN(itemY2) || id === undefined) return;
            if (itemX1 < x2 && itemX2 > x && itemY1 < y2 && itemY2 > y) idList.push(id);
        });
        for (const textItem of this._drawableTextData) {
            if (idList.indexOf(textItem.id) < 0) continue;
            textData.push(textItem);
        }
        return textData;
    }

    private _generateDrawableTextData() {
        this._drawableTextData = [];
        if (this._textObject == null) return false;
        return this._convertTextNodeToData(
            this._textObject,
            ActaTextStyleManager.getInstance().get(this._defaultTextStyleName || '') || new ActaTextStyle()
        );
    }

    private _convertTextNodeToData(textNode: ActaTextNode, parentTextStyle: ActaTextStyle) {
        const textStyle = textNode.appliedTextStyle(parentTextStyle);
        if (textStyle.font == null ||
            textStyle.fontSize == null ||
            textStyle.xscale == null ||
            textStyle.letterSpacing == null ||
            textStyle.lineHeight == null ||
            textStyle.textAlign == null ||
            textStyle.underline == null ||
            textStyle.strikeline == null ||
            textStyle.indent == null ||
            textStyle.color == null
        ) return false;

        for (let indexOfNode = 0; indexOfNode < textNode.length; indexOfNode++) {
            if (textNode.value[indexOfNode] instanceof ActaTextNode) {
                if (!this._convertTextNodeToData(textNode.value[indexOfNode], textStyle)) return false;
            } else {
                const textvalue = textNode.value[indexOfNode].toString();
                for (let indexOfText = 0; indexOfText < textvalue.length; indexOfText++) {
                    const char = textvalue[indexOfText];
                    if (char === "\n") {
                        this._drawableTextData.push({
                            id: uuidv4(),
                            type: DrawableTextItemType.NEWLINE,
                            calcWidth: 0,
                            width: 0,
                            line: null,
                            textNode, textStyle, indexOfNode, indexOfText, char
                        });
                    } else if (char === ' ') {
                        this._drawableTextData.push({
                            id: uuidv4(),
                            type: DrawableTextItemType.SPACE,
                            calcWidth: textStyle.fontSize / 3,
                            width: textStyle.fontSize / 3,
                            line: null,
                            textNode, textStyle, indexOfNode, indexOfText, char
                        });
                    } else {
                        const glyphData = this._getTextPath(textStyle.font.font, char, textStyle.fontSize);
                        this._drawableTextData.push({
                            id: uuidv4(),
                            type: DrawableTextItemType.PATH,
                            path: glyphData.path,
                            drawOffsetX: glyphData.offsetX,
                            drawOffsetY: glyphData.offsetY,
                            calcWidth: glyphData.width,
                            width: glyphData.width,
                            height: glyphData.height,
                            line: null,
                            textNode, textStyle, indexOfNode, indexOfText, char
                        });
                    }
                }
            }
        }
        return true;
    }

    private _computeDrawableTextSize() {
        const canvasList: SVGElement[] = [];
        let canvasPos = 0;
        let lineData: IDrawableLineData | null = null;
        let indent = true;

        $(this._element).find('x-paragraph-col').each((i, child) => {
            const column = child as ActaParagraphColumnElement;
            $(column.svg).attr({
                width: ($(column).innerWidth() || 0),
                height: ($(column).innerHeight() || 0)
            }).data('drawableTextData', []);
            canvasList.push(column.svg);
        });
        for (const textItem of this._drawableTextData) {
            textItem.calcWidth = textItem.width * (textItem.textStyle.xscale || 1);
            if (textItem.calcWidth > 0) textItem.calcWidth += textItem.textStyle.letterSpacing || 0;
            while (1) {
                if (!lineData) {
                    const canvas = canvasList[canvasPos];
                    if (!canvas) break;
                    lineData = {
                        indexOfColumn: canvasPos,
                        indexOfLine: $(canvas).data('drawableTextData').length,
                        limitWidth: $(canvas).width() || 0,
                        maxHeight: 0,
                        maxLeading: 0,
                        indent: indent ? textItem.textStyle.indent || 0 : 0,
                        items: [],
                        textAlign: TextAlign.JUSTIFY
                    };
                    indent = false;

                    $(canvas).data('drawableTextData').push(lineData);
                    if (textItem.type === DrawableTextItemType.SPACE) textItem.calcWidth = 0;
                } else {
                    let itemcnt = 0;
                    let filledWidth = lineData.indent;
                    $.each(lineData.items, (j, item: IDrawableTextItem) => {
                        if (item.calcWidth > 0) {
                            filledWidth += item.calcWidth;
                            itemcnt++;
                        }
                    });
                    if (filledWidth + textItem.calcWidth > lineData.limitWidth) {
                        itemcnt = lineData.items.length;
                        if (itemcnt > 0) {
                            const firstItem = lineData.items[0];
                            if (firstItem.type === DrawableTextItemType.SPACE) {
                                filledWidth -= firstItem.calcWidth;
                                itemcnt--;
                                firstItem.calcWidth = 0;
                            }
                        }
                        if (itemcnt > 1) {
                            const lastItem = lineData.items[lineData.items.length - 1];
                            if (lastItem.type === DrawableTextItemType.SPACE) {
                                filledWidth -= lastItem.calcWidth;
                                itemcnt--;
                                lastItem.calcWidth = 0;
                            }
                        }
                        if (lineData.textAlign === TextAlign.JUSTIFY) {
                            const diffWidth = (lineData.limitWidth - filledWidth) / itemcnt;
                            $.each(lineData.items, (j, item) => {
                                if (item.calcWidth > 0) item.calcWidth += diffWidth;
                            });
                        } else if (lineData.textAlign === TextAlign.RIGHT) {
                            lineData.indent += lineData.limitWidth - filledWidth;
                        } else if (lineData.textAlign === TextAlign.CENTER) {
                            lineData.indent += (lineData.limitWidth - filledWidth) / 2;
                        }
                        lineData = null;
                        continue;
                    }
                }
                break;
            }
            if (lineData == null) continue;

            lineData.maxHeight = Math.max(textItem.height || 0, lineData.maxHeight);
            lineData.maxLeading = Math.max((textItem.height || 0) * ((textItem.textStyle.lineHeight || 1) - 1), lineData.maxLeading);
            lineData.textAlign = Math.max(textItem.textStyle.textAlign || TextAlign.JUSTIFY, lineData.textAlign);
            lineData.items.push(textItem);
            textItem.line = lineData;
            if (textItem.type === DrawableTextItemType.NEWLINE) {
                indent = true;
                lineData = null;
            } else {
                let canvas = canvasList[canvasPos];
                let filledHeight = 0;
                if (!canvas) break;

                const drawableTextData: IDrawableLineData[] = $(canvas).data('drawableTextData');
                for (let i = 0; i < drawableTextData.length; i++) {
                    const line = drawableTextData[i];
                    filledHeight += line.maxHeight;
                    if (i < drawableTextData.length - 1) filledHeight += line.maxLeading;
                }
                if (filledHeight > ($(canvas).height() || 0)) {
                    lineData = drawableTextData.pop() || null;
                    $(canvas).data('drawableTextData', drawableTextData);

                    canvas = canvasList[++canvasPos];
                    if (!canvas) break;

                    $(canvas).data('drawableTextData').push(lineData)
                }
            }
        }
    }

    private _drawText() {
        $(this._element.svg).each((i, canvas) => {
            const textData: IDrawableLineData[] = $(canvas).data('drawableTextData');
            const paths: SVGPathElement[] = [];
            const lines: SVGLineElement[] = [];
            let offsetY = 0;

            $(canvas).empty();
            for (const lineData of textData) {
                let offsetX = lineData.indent;
                let leading = 0;
                for (const textItem of lineData.items) {
                    if (textItem.line === null) textItem.line = lineData;
                    if (textItem.type !== DrawableTextItemType.NEWLINE) {
                        let transform = 'translate(';
                        transform += `${(textItem.drawOffsetX || 0) + ((textItem.textStyle.letterSpacing || 0) / 2) + offsetX}px`;
                        transform += ', ';
                        transform += `${(textItem.drawOffsetY || 0) + offsetY - lineData.maxHeight + ((lineData.maxHeight - (textItem.height || 0)) * 2)}px`;
                        transform += ')';
                        transform += ` scaleX(${textItem.textStyle.xscale})`;
                        leading = Math.max(leading, (textItem.textStyle.fontSize || 10) * ((textItem.textStyle.lineHeight || 1) - 1));

                        if (textItem.path !== undefined) {
                            $(textItem.path).attr({
                                'data-id': textItem.id,
                                'data-line': textItem.line.indexOfLine,
                                'data-textnode': textItem.textNode.uuid,
                                'data-index-of-node': textItem.indexOfNode,
                                'data-index-of-text': textItem.indexOfText,
                                'data-x': offsetX,
                                'data-y': offsetY,
                                'data-width': textItem.calcWidth,
                                'data-height': lineData.maxHeight,
                                'data-leading': lineData.maxLeading,
                                'fill': textItem.textStyle.color || '#000000'
                            }).css('transform', transform);
                            paths.push(textItem.path);
                        } else {
                            const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
                            $(path).attr({
                                'data-id': textItem.id,
                                'data-line': textItem.line.indexOfLine,
                                'data-textnode': textItem.textNode.uuid,
                                'data-index-of-node': textItem.indexOfNode,
                                'data-index-of-text': textItem.indexOfText,
                                'data-x': offsetX,
                                'data-y': offsetY,
                                'data-width': textItem.calcWidth,
                                'data-height': lineData.maxHeight,
                                'data-leading': lineData.maxLeading
                            }).css('transform', transform);
                            paths.push(path);
                        }
                        if (textItem.textStyle !== undefined) {
                            if (textItem.textStyle.strikeline) {
                                const strikeline = document.createElementNS('http://www.w3.org/2000/svg', 'line');
                                $(strikeline).attr({
                                    'data-id': textItem.id,
                                    'data-line': textItem.line.indexOfLine,
                                    'data-textnode': textItem.textNode.uuid,
                                    'data-index-of-node': textItem.indexOfNode,
                                    'data-index-of-text': textItem.indexOfText,
                                    'x1': (textItem.drawOffsetX || 0) + ((textItem.textStyle.letterSpacing || 0) / 2) + offsetX,
                                    'x2': (textItem.drawOffsetX || 0) + ((textItem.textStyle.letterSpacing || 0) / 2) + offsetX + textItem.calcWidth,
                                    'y1': (textItem.drawOffsetY || 0) + offsetY - (lineData.maxHeight / 3),
                                    'y2': (textItem.drawOffsetY || 0) + offsetY - (lineData.maxHeight / 3),
                                    'stroke': textItem.textStyle.color,
                                    'stroke-width': 1,
                                    'stroke-linecap': 'butt'
                                });
                                lines.push(strikeline);
                            }
                            if (textItem.textStyle.underline) {
                                const underline = document.createElementNS('http://www.w3.org/2000/svg', 'line');
                                $(underline).attr({
                                    'data-id': textItem.id,
                                    'data-line': textItem.line.indexOfLine,
                                    'data-textnode': textItem.textNode.uuid,
                                    'data-index-of-node': textItem.indexOfNode,
                                    'data-index-of-text': textItem.indexOfText,
                                    'x1': (textItem.drawOffsetX || 0) + ((textItem.textStyle.letterSpacing || 0) / 2) + offsetX,
                                    'x2': (textItem.drawOffsetX || 0) + ((textItem.textStyle.letterSpacing || 0) / 2) + offsetX + textItem.calcWidth,
                                    'y1': (textItem.drawOffsetY || 0) + offsetY,
                                    'y2': (textItem.drawOffsetY || 0) + offsetY,
                                    'stroke': textItem.textStyle.color,
                                    'stroke-width': 1,
                                    'stroke-linecap': 'butt'
                                });
                                lines.push(underline);
                            }
                        }
                    }
                    offsetX += textItem.calcWidth;
                }
                offsetY += lineData.maxHeight;
                offsetY += lineData.maxLeading;
            }
            $(canvas).append(paths);
            $(canvas).append(lines);
        });
    }

    constructor(defaultTextStyleName: string | null, columnCount: number = 1, innerMargin: string | number = 0, columnWidths: string[] | number[] = []) {
        this._element = document.createElement('x-paragraph') as ActaParagraphElement;
        this._columnCount = 1;
        this._innerMargin = 0;
        this._textObject = null;
        this._defaultTextStyleName = defaultTextStyleName;

        this._editable = true;
        this._selectionStartItem = null;
        this._cursorMode = CursorMode.NONE;
        this._cursorPosition = null;

        this.columnCount = columnCount;
        for (let i = 0; i < columnCount; i++) {
            if (columnWidths[i]) this.columnWidth(i, columnWidths[i]);
        }
        this.innerMargin = innerMargin;

        this._drawableTextData = [];

        $(this._element).on('resize', e => {
            this._computeDrawableTextSize();
            this._drawText();
            return false;
        });
        $(this._element).on('keyup', e => {
            const ev = e.originalEvent;
            if (!ev) return;
            if (ev.keyCode === 21) {
                ActaParagraph.toggleInputMethod();
                return false;
            } else if (ev.keyCode === 25) {
                // 한자변환
            } else {
                const char = ActaParagraph.getKeycode2Char(ev);
                if (char) {
                    console.log(char);
                    return false;
                }
            }
        });
        $(this._element).on('mousedown', 'x-paragraph-col', (e) => {
            if (!this._editable) return false;
            const eventElement = this._getTextDataByPosition(e.currentTarget, e.offsetX, e.offsetY);
            if (eventElement.length > 0) {
                this._cursorMode = CursorMode.SELECTION;
                this._cursorPosition = null;
                this._selectionStartItem = this._setCursor(eventElement[0], e.offsetX);
                this._redrawCursor();
            }
            this._element.focus();

            return false;
        });
        $(this._element).on('focus', (e) => {
            this._redrawCursor();
            return false;
        });
        $(this._element).on('blur', (e) => {
            $(this._element.svg).find('.cursor').remove();
            this._selectionStartItem = null;
            return false;
        });
        $(this._element).on('mousemove', 'x-paragraph-col', (e) => {
            if (!this._editable) return false;
            if (this._cursorMode !== CursorMode.SELECTION || e.which !== 1) return false;
            const eventElement = this._getTextDataByPosition(e.currentTarget, e.offsetX, e.offsetY);
            if (eventElement.length > 0 && this._selectionStartItem != null) {
                this._setCursor(eventElement[0], e.offsetX);
                this._redrawCursor();
            }
            return false;
        });
        $(this._element).on('mouseup', 'x-paragraph-col', (e) => {
            if (!this._editable) return false;
            const eventElement = this._getTextDataByPosition(e.currentTarget, e.offsetX, e.offsetY);
            if (eventElement.length > 0 && this._selectionStartItem != null) {
                this._setCursor(eventElement[0], e.offsetX);
                this._redrawCursor();
            }
            this._cursorMode = CursorMode.EDIT;
            return false;
        });
    }

    columnWidth(idx: number, val: string | number) {
        if (arguments.length > 1) {
            $(this._element).find('x-paragraph-col').get(idx).setAttribute('width', (val || 0).toString());
            $(this._element).trigger('resize');
        } else {
            return $(this._element).find('x-paragraph-col').get(idx).getAttribute('width') || false;
        }
    }

    redraw() {
        this._generateDrawableTextData();
        this._computeDrawableTextSize();
        this._drawText();
    }

    set text(text: string) {
        this._textObject = ActaTextConverter.textobject(text);
        this.redraw();
    }

    set columnCount(count) {
        this._initElement();

        this._columnCount = count || 1;
        for (let i = 0; i < this._columnCount; i++) {
            const column = document.createElement('x-paragraph-col') as ActaParagraphColumnElement;
            this._element.appendChild(column);
            $(column.svg).data('drawableTextData', []);

            if (i + 1 >= this._columnCount) continue;

            const margin = document.createElement('x-paragraph-margin') as ActaParagraphMarginElement;
            $(margin).attr('width', this.innerMargin);
            this._element.appendChild(margin);
        }
        $(this._element).trigger('resize');
    }

    set innerMargin(innerMargin) {
        this._innerMargin = innerMargin;
        $(this._element).find('x-paragraph-margin').attr('width', innerMargin);
        $(this._element).trigger('resize');
    }
    set defaultTextStyleName(styleName: string) { this._defaultTextStyleName = styleName; }
    set editable(val: boolean) { this._editable = val; }

    get columnCount() { return this._columnCount; }
    get innerMargin() { return this._innerMargin; }
    get text() { return ''; }
    get defaultTextStyleName() { return this._defaultTextStyleName || ''; }
    get editable() { return this._editable; }

    get el() { return this._element; }
};