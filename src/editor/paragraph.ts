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

const KEYCODE_CHAR_MAP: { [key: number]: string[] } = {
    81: ['q','Q','ㅂ','ㅃ'],
    87: ['w','W','ㅈ','ㅉ'],
    69: ['e','E','ㄷ','ㄸ'],
    82: ['r','R','ㄱ','ㄲ'],
    84: ['t','T','ㅅ','ㅆ'],
    89: ['y','Y','ㅛ','ㅛ'],
    85: ['u','U','ㅕ','ㅕ'],
    73: ['i','I','ㅑ','ㅑ'],
    79: ['o','O','ㅐ','ㅒ'],
    80: ['p','P','ㅔ','ㅖ'],
    65: ['a','A','ㅁ','ㅁ'],
    83: ['s','S','ㄴ','ㄴ'],
    68: ['d','D','ㅇ','ㅇ'],
    70: ['f','F','ㄹ','ㄹ'],
    71: ['g','G','ㅎ','ㅎ'],
    72: ['h','H','ㅗ','ㅗ'],
    74: ['j','J','ㅓ','ㅓ'],
    75: ['k','K','ㅏ','ㅏ'],
    76: ['l','L','ㅣ','ㅣ'],
    90: ['z','Z','ㅋ','ㅋ'],
    88: ['x','X','ㅌ','ㅌ'],
    67: ['c','C','ㅊ','ㅊ'],
    86: ['v','V','ㅍ','ㅍ'],
    66: ['b','B','ㅠ','ㅠ'],
    78: ['n','N','ㅜ','ㅜ'],
    77: ['m','M','ㅡ','ㅡ']
};

const KEYCODE_SPECIALCHAR_MAP: { [key: number ]: string[] } = {
    13: ['\n', '\n'],
    32: [' ', ' '],
    48: ['0',')'],
    49: ['1','!'],
    50: ['2','@'],
    51: ['3','#'],
    52: ['4','$'],
    53: ['5','%'],
    54: ['6','^'],
    55: ['7','&'],
    56: ['8','*'],
    57: ['9','('],
    186: [';',':'],
    187: ['=','+'],
    188: [',','<'],
    189: ['-','_'],
    190: ['.','>'],
    191: ['/','?'],
    192: ['`','~'],
    219: ['[','{'],
    220: ['\\','|'],
    221: [']','}'],
    222: ['\'','"']
};
const KEYCODE_BACKSPACE = 8;
const KEYCODE_TAB = 9;
const KEYCODE_ENTER = 13;
const KEYCODE_HANGUL = 21;
const KEYCODE_HANJA = 25;
const KEYCODE_END = 35;
const KEYCODE_HOME = 36;
const KEYCODE_LEFT = 37;
const KEYCODE_UP = 38;
const KEYCODE_RIGHT = 39;
const KEYCODE_DOWN = 40;
const KEYCODE_DELETE = 46;

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
    NEWLINE, SPACE, PATH, END_OF_NODE
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
    private _drawableTextNodeList: string[];
    private _selectionStartItem: IDrawableTextItem | null;
    private _cursorMode: CursorMode;
    private _cursorPosition: ICursorPosition | null;
    private _editable: boolean;
    private _inputChar: string;

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
            if (KEYCODE_CHAR_MAP[keyCode]) retChar = KEYCODE_CHAR_MAP[keyCode][isShiftKey ? 2 : 1];
        } else {
            if (isCapsLock) {
                if (KEYCODE_CHAR_MAP[keyCode]) retChar = KEYCODE_CHAR_MAP[keyCode][isShiftKey ? 0 : 1];
            } else {
                if (KEYCODE_CHAR_MAP[keyCode]) retChar = KEYCODE_CHAR_MAP[keyCode][isShiftKey ? 1 : 0];
            }
        }
        if (retChar === undefined) {
            if (KEYCODE_SPECIALCHAR_MAP[keyCode]) retChar = KEYCODE_SPECIALCHAR_MAP[keyCode][isShiftKey ? 1 : 0];
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

    private _editorInputChar(e: KeyboardEvent) {
        const char: string | undefined = ActaParagraph.getKeycode2Char(e);
        if (char === undefined || this._cursorPosition === null) {
            console.log(e.keyCode);
            return;
        }
        const lineData = this._getLineDataByCursor();
        let textItem, textNode, textValue;
        if (lineData === undefined) return;

        const beforeInputTextItemCount = lineData.items.length;
        let fixVal = 0;
        if (this._cursorPosition.position >= lineData.items.length) fixVal = 1;

        textItem = lineData.items[this._cursorPosition.position - fixVal];
        if (!textItem) return;

        textNode = textItem.textNode;
        textValue = textNode.value[textItem.indexOfNode] as string;
        textValue = `${textValue.substr(0, textItem.indexOfText + fixVal)}${char}${textValue.substr(textItem.indexOfText + fixVal)}`;

        textNode.edit(textItem.indexOfNode, textValue);
        this._redraw();

        const afterInputLineData = this._getLineDataByCursor();
        if (!afterInputLineData) {
            this._cursorPosition = null;
        } else {
            if (this._cursorPosition.position < afterInputLineData.items.length || beforeInputTextItemCount < afterInputLineData.items.length) {
                this._cursorPosition.position++;
            } else if (this._getLineData(this._cursorPosition.column, this._cursorPosition.line + 1)) {
                this._cursorPosition.line++;
                this._cursorPosition.position = (beforeInputTextItemCount >= afterInputLineData.items.length) ? 1 : 0;
            } else if (this._cursorPosition.column + 1 < this.columnCount) {
                this._cursorPosition.column++;
                this._cursorPosition.line = 0;
                this._cursorPosition.position = 0;
            }
        }
        this._redrawCursor();

        return false;
    }

    private _editorKeyboardControl(e: KeyboardEvent) {

        if (this._cursorPosition === null) return;

        switch (e.keyCode) {
            case KEYCODE_HANGUL:
                ActaParagraph.toggleInputMethod();
                return false;

            case KEYCODE_HANJA:
                return false;

            case KEYCODE_BACKSPACE:
            case KEYCODE_TAB:
            case KEYCODE_ENTER:
            case KEYCODE_END:
            case KEYCODE_HOME:
            case KEYCODE_LEFT:
            case KEYCODE_UP:
            case KEYCODE_RIGHT:
            case KEYCODE_DOWN:
            case KEYCODE_DELETE:
            default:
                return this._editorInputChar(e);
                break;
        }
    }

    private _setCursorPosition(column: number, line: number, position: number) {
        this._cursorPosition = { column, line, position };
    }

    private _getTextItemByCursor() {
        if (this._cursorPosition === null) return;
        const lineData = this._getLineDataByCursor();
        return lineData ? lineData.items[this._cursorPosition.position] : undefined;
    }

    private _getLineDataByCursor() {
        if (this._cursorPosition === null) return;
        return this._getLineData(this._cursorPosition.column, this._cursorPosition.line);
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
            let currentLine = -1, startx = 0, selection;

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
        this._drawableTextNodeList = [];
        if (this._textObject == null) return false;
        return this._convertTextNodeToData(
            this._textObject,
            ActaTextStyleManager.getInstance().get(this._defaultTextStyleName || '') || new ActaTextStyle()
        );
    }

    private _updateDrawableTextData() {
        if (this._textObject == null) {
            this._drawableTextData = [];
            this._drawableTextNodeList = [];
            return false;
        }
        return this._convertTextNodeToData(
            this._textObject,
            ActaTextStyleManager.getInstance().get(this._defaultTextStyleName || '') || new ActaTextStyle(),
            true
        );
    }

    private _splitTextDataByNodeID(id: string) {
        let preList: IDrawableTextItem[] | undefined;
        let postList: IDrawableTextItem[] | undefined;

        const tmpNodeIDList: string[] = [];
        for (const tmpTextItem of this._drawableTextData) tmpNodeIDList.push(tmpTextItem.textNode.id);

        const s = tmpNodeIDList.indexOf(id);
        const e = tmpNodeIDList.lastIndexOf(id);

        if (s > -1) {
            preList = this._drawableTextData.slice(undefined, s);
            postList = this._drawableTextData.slice(e + 1);
        }
        return [preList, postList];
    }

    private _convertTextNodeToData(textNode: ActaTextNode, parentTextStyle: ActaTextStyle, modifyOnly: boolean = false) {
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

        let preList: IDrawableTextItem[] | undefined;
        let postList: IDrawableTextItem[] | undefined;
        if (modifyOnly && textNode.modified) {
            [preList, postList] = this._splitTextDataByNodeID(textNode.id);
            if (preList === undefined || postList === undefined) return false;
            this._drawableTextData = preList;
        }
        for (let indexOfNode = 0; indexOfNode < textNode.length; indexOfNode++) {
            if (textNode.value[indexOfNode] instanceof ActaTextNode) {
                if (!this._convertTextNodeToData(textNode.value[indexOfNode], textStyle, modifyOnly && !textNode.modified ? true : false)) return false;
                if (indexOfNode >= textNode.length - 1) {
                    // 노드 업데이트를 위해 노드 마지막부분을 마킹
                    this._drawableTextData.push({
                        id: uuidv4(),
                        type: DrawableTextItemType.END_OF_NODE,
                        calcWidth: 0,
                        width: 0,
                        line: null,
                        indexOfText: 0,
                        char: '',
                        textNode, textStyle, indexOfNode
                    });
                }
            } else {
                if (modifyOnly && !textNode.modified) continue;

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
        if (modifyOnly && textNode.modified) {
            this._drawableTextData = this._drawableTextData.concat(postList || []);
        }
        if (this._drawableTextNodeList.indexOf(textNode.id) < 0) {
            this._drawableTextNodeList.push(textNode.id);
        }
        textNode.modified = false;

        return true;
    }

    private _computeDrawableTextSize(): void {
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
            if (textItem.type === DrawableTextItemType.END_OF_NODE) continue;
            if (this._drawableTextNodeList.indexOf(textItem.textNode.id) < 0) {
                const [preList, postList] = this._splitTextDataByNodeID(textItem.textNode.id);
                if (preList === undefined || postList === undefined) {
                    this._generateDrawableTextData();
                } else {
                    this._drawableTextData = [];
                    this._drawableTextData.concat(preList).concat(postList);
                }
                return this._computeDrawableTextSize();
            } else if (textItem.textNode.modified) {
                if (!this._updateDrawableTextData()) this._generateDrawableTextData();
                return this._computeDrawableTextSize();
            }
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
                for (let j = 0; j < drawableTextData.length; j++) {
                    const line = drawableTextData[j];
                    filledHeight += line.maxHeight;
                    if (j < drawableTextData.length - 1) filledHeight += line.maxLeading;
                }
                if (filledHeight > ($(canvas).height() || 0)) {
                    lineData = drawableTextData.pop() || null;
                    $(canvas).data('drawableTextData', drawableTextData);

                    canvas = canvasList[++canvasPos];
                    if (!canvas) break;

                    if (lineData != null) {
                        lineData.indexOfColumn = canvasPos;
                        lineData.indexOfLine = 0;
                    }
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
                    if ([DrawableTextItemType.NEWLINE, DrawableTextItemType.END_OF_NODE].indexOf(textItem.type) < 0) {
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
                                'data-textnode': textItem.textNode.id,
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
                                'data-textnode': textItem.textNode.id,
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
                                    'data-textnode': textItem.textNode.id,
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
                                    'data-textnode': textItem.textNode.id,
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

    private _redraw() {
        this._computeDrawableTextSize();
        this._drawText();
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
        this._inputChar = '';

        this.columnCount = columnCount;
        for (let i = 0; i < columnCount; i++) {
            if (columnWidths[i]) this.columnWidth(i, columnWidths[i]);
        }
        this.innerMargin = innerMargin;

        this._drawableTextData = [];
        this._drawableTextNodeList = [];

        $(this._element).on('resize', e => {
            this._redraw();
            return false;
        });
        $(this._element).on('keydown', (e) => e.originalEvent ? this._editorKeyboardControl(e.originalEvent) : {});

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

    update() {
        this._generateDrawableTextData();
        this._computeDrawableTextSize();
        this._drawText();
    }

    set text(text: string) {
        this._textObject = ActaTextConverter.textobject(text);
        this.update();
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