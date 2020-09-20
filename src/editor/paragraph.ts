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
import { clone } from '../utils';

const KEYCODE_CHAR_MAP: { [key: string]: string[] } = {
    'Q': ['Q','ㅃ'], 'q': ['q','ㅂ'],
    'W': ['W','ㅉ'], 'w': ['w','ㅈ'],
    'E': ['E','ㄸ'], 'e': ['e','ㄷ'],
    'R': ['R','ㄲ'], 'r': ['r','ㄱ'],
    'T': ['T','ㅆ'], 't': ['t','ㅅ'],
    'Y': ['Y','ㅛ'], 'y': ['y','ㅛ'],
    'U': ['U','ㅕ'], 'u': ['u','ㅕ'],
    'I': ['I','ㅑ'], 'i': ['i','ㅑ'],
    'O': ['O','ㅒ'], 'o': ['o','ㅐ'],
    'P': ['P','ㅖ'], 'p': ['p','ㅔ'],
    'A': ['A','ㅁ'], 'a': ['a','ㅁ'],
    'S': ['S','ㄴ'], 's': ['s','ㄴ'],
    'D': ['D','ㅇ'], 'd': ['d','ㅇ'],
    'F': ['F','ㄹ'], 'f': ['f','ㄹ'],
    'G': ['G','ㅎ'], 'g': ['g','ㅎ'],
    'H': ['H','ㅗ'], 'h': ['h','ㅗ'],
    'J': ['J','ㅓ'], 'j': ['j','ㅓ'],
    'K': ['K','ㅏ'], 'k': ['k','ㅏ'],
    'L': ['L','ㅣ'], 'l': ['l','ㅣ'],
    'Z': ['Z','ㅋ'], 'z': ['z','ㅋ'],
    'X': ['X','ㅌ'], 'x': ['x','ㅌ'],
    'C': ['C','ㅊ'], 'c': ['c','ㅊ'],
    'V': ['V','ㅍ'], 'v': ['v','ㅍ'],
    'B': ['B','ㅠ'], 'b': ['b','ㅠ'],
    'N': ['N','ㅜ'], 'n': ['n','ㅜ'],
    'M': ['M','ㅡ'], 'm': ['m','ㅡ']
};

const KEYCODE_SPECIALCHAR_MAP: { [key: string ]: string } = {
    'Enter': '\n',
    ' ': ' ',

    '0': '0', ')': ')',
    '1': '1', '!': '!',
    '2': '2', '@': '@',
    '3': '3', '#': '#',
    '4': '4', '$': '$',
    '5': '5', '%': '%',
    '6': '6', '^': '^',
    '7': '7', '&': '&',
    '8': '8', '*': '*',
    '9': '9', '(': '(',
    ';': ';', ':': ':',
    '=': '=', '+': '+',
    ',': ',', '<': '<',
    '-': '-', '_': '_',
    '.': '.', '>': '>',
    '/': '/', '?': '?',
    '`': '`', '~': '~',
    '[': '[', '{': '{',
    '\\': '\\', '|': '|',
    ']': ']', '}': '}',
    '\'': '\'', '"': '"'
};

enum CharType {
    TEXT, SPECIAL, NONE
};

enum Keycode {
    BACKSPACE = 8,
    TAB = 9,
    ENTER = 13,
    SHIFT = 16,
    CONTROL = 17,
    ALT = 18,
    HANGUL = 21,
    HANJA = 25,
    SPACE = 32,
    END = 35,
    HOME = 36,
    LEFT = 37,
    UP = 38,
    RIGHT = 39,
    DOWN = 40,
    DELETE = 46
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
    offsetY?: number;
};

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
    private _drawableTextItems: IDrawableTextItem[];
    private _drawableTextNodeList: string[];
    private _selectionStartItem: number | null;
    private _cursorMode: CursorMode;
    private _cursor: number | null;
    private _editable: boolean;
    private _inputChar: string;

    private static _inputMethod:InputMethod = InputMethod.EN;

    private static toggleInputMethod() {
        ActaParagraph._inputMethod = ActaParagraph._inputMethod === InputMethod.KO ? InputMethod.EN : InputMethod.KO;
    }

    private static get inputMethod() {
        return ActaParagraph._inputMethod;
    }

    private static getChar(e: KeyboardEvent) {
        let retChar: string | undefined;
        if (KEYCODE_CHAR_MAP[e.key]) retChar = (ActaParagraph.inputMethod === InputMethod.KO) ? KEYCODE_CHAR_MAP[e.key][1] : KEYCODE_CHAR_MAP[e.key][0];
        if (retChar === undefined && KEYCODE_SPECIALCHAR_MAP[e.key]) retChar = KEYCODE_SPECIALCHAR_MAP[e.key];
        return retChar;
    }

    private static isCharType(e: KeyboardEvent) {
        if (KEYCODE_CHAR_MAP[e.key]) return CharType.TEXT;
        else if (KEYCODE_SPECIALCHAR_MAP[e.key]) return CharType.SPECIAL;
        return CharType.NONE;
    }

    private static getCharHeight(font: opentype.Font, size: number) {
        const unitsPerSize = font.unitsPerEm / size;
        return (font.tables.os2.usWinAscent + font.tables.os2.usWinDescent) / unitsPerSize;
    }

    private static getCharPath(font: opentype.Font, char: string, size: number) {
        const glyph = font.charToGlyph(char);
        const unitsPerSize = font.unitsPerEm / size;
        const charWidth = glyph.advanceWidth / unitsPerSize;
        const charHeight = (font.tables.os2.usWinAscent + font.tables.os2.usWinDescent) / unitsPerSize;
        const yMin = font.tables.head.yMin / unitsPerSize;
        const path = glyph.getPath(0, charHeight, size);
        const pathData = path.toPathData(8);
        const el = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        el.setAttribute('d', pathData);

        return { path: el, offsetX: 0, offsetY: charHeight + yMin, width: charWidth, height: charHeight };
    }

    private _initElement() {
        this._element.innerHTML = '';
    }

    private _editorInputChar(e: KeyboardEvent) {
        const char = ActaParagraph.getChar(e);
        let needGenerateTextData = false;

        if ([CursorMode.EDIT, CursorMode.SELECTION, CursorMode.INPUT].indexOf(this._cursorMode) < 0) return;
        if (this._cursor === null) { this._cursorMode = CursorMode.NONE; return; }
        if (char === undefined) { this._cursorMode = CursorMode.EDIT; return; }

        if (this._cursorMode === CursorMode.SELECTION) {
            const selectionTextItems = this._getSelectionTextItems();
            this._cursor = this._drawableTextItems.indexOf(selectionTextItems[0]);
            this._removeTextItems(selectionTextItems);
            this._cursorMode = CursorMode.EDIT;
        }
        let textNode: ActaTextNode | null = null;
        let indexOfNode: number = 0;
        let indexOfText: number = 0;
        if (this._cursor > this._drawableTextItems.length - 1) {
            if (this.lastDrawableTextItem !== null) {
                indexOfNode = this.lastDrawableTextItem.indexOfNode;
                indexOfText = this.lastDrawableTextItem.indexOfText + 1;
                textNode = this.lastDrawableTextItem.textNode;
                if (!textNode) return false;
            } else {
                textNode = this._textObject;
                if (!textNode) return false;
                if (textNode.length < 1) textNode.add('');
                needGenerateTextData = true;
            }
        } else {
            const textItem = this._getTextItemByCursor();
            if (!textItem) { this._cursorMode = CursorMode.EDIT; return; }
            indexOfNode = textItem.indexOfNode;
            indexOfText = textItem.indexOfText;
            textNode = textItem.textNode;
            if (!textNode) return false;
        }

        let textValue = textNode.value[indexOfNode] as string;
        if (ActaParagraph.inputMethod === InputMethod.KO && ActaParagraph.isCharType(e) === CharType.TEXT) {
            if (this._cursorMode === CursorMode.INPUT) {
                this._cursorMode = CursorMode.EDIT;
                this._inputChar += char;
                this._inputChar = Hangul.a(this._inputChar.split(''));

                textValue = `${textValue.substr(0, indexOfText - 1)}${this._inputChar}${textValue.substr(indexOfText)}`;
                if (this._inputChar.length > 1) {
                    this._cursor += this._inputChar.length - 1;
                    this._inputChar = this._inputChar[this._inputChar.length - 1];
                }
            } else {
                this._inputChar = char;
                this._cursor++;
                textValue = `${textValue.substr(0, indexOfText)}${this._inputChar}${textValue.substr(indexOfText)}`;
            }
            this._inputChar = Hangul.d(this._inputChar).join('');
            this._cursorMode = CursorMode.INPUT;
        } else {
            textValue = `${textValue.substr(0, indexOfText)}${char}${textValue.substr(indexOfText)}`;
            this._inputChar = '';
            this._cursorMode = CursorMode.EDIT;
            this._cursor++;
        }
        textNode.edit(indexOfNode, textValue);

        if (needGenerateTextData) this._generateDrawableTextData();

        this._redraw();
        this._redrawCursor();

        return false;
    }

    private _editorKeyboardControl(e: KeyboardEvent) {
        if (this._cursor === null) return;

        // 컨트롤, 시프트, 알트키는 무시
        if ([Keycode.CONTROL, Keycode.SHIFT, Keycode.ALT].indexOf(e.keyCode) > -1) return;

        // 커서 이동
        if ([Keycode.HOME, Keycode.END, Keycode.UP, Keycode.DOWN, Keycode.LEFT, Keycode.RIGHT].indexOf(e.keyCode) > -1) {
            // Shift키를 누르고 커서이동시 셀럭션모드
            if (e.shiftKey) {
                if (this._cursorMode !== CursorMode.SELECTION) this._selectionStartItem = this._cursor;
                this._cursorMode = CursorMode.SELECTION;
            } else {
                this._cursorMode = CursorMode.EDIT;
            }
            if ([Keycode.HOME, Keycode.END].indexOf(e.keyCode) > -1) {
                if (this._cursor > this._drawableTextItems.length - 1) this._cursor--;
                const lineData = this._getLineDataByCursor();
                if (lineData && lineData.items.length > 0) {
                    this._cursor = this._drawableTextItems.indexOf((e.keyCode === Keycode.HOME) ? lineData.items[0] : lineData.items[lineData.items.length - 1]);
                    if (this._cursor === this._drawableTextItems.length - 1 && this._drawableTextItems[this._cursor].type !== DrawableTextItemType.NEWLINE) this._cursor++;
                    this._redrawCursor();
                }
                return false;
            } else if ([Keycode.UP, Keycode.DOWN].indexOf(e.keyCode) > -1) {
                const nearLineData = (e.keyCode === Keycode.UP) ? this._getPrevLineDataByCursor() : this._getNextLineDataByCursor();
                if (nearLineData !== null) {
                    const nearestItem = this._computeNearestItem(this._getTextItemByCursor(), nearLineData.items);
                    if (nearestItem) {
                        this._cursor = this._drawableTextItems.indexOf(nearestItem);
                        this._redrawCursor();
                        return false;
                    }
                }
                this._cursorMode = CursorMode.EDIT;
                return false;
            } else if ([Keycode.LEFT, Keycode.RIGHT].indexOf(e.keyCode) > -1) {
                this._cursor = (e.keyCode === Keycode.LEFT) ? Math.max(this._cursor - 1, 0) : Math.min(this._cursor + 1, this._drawableTextItems.length);
                this._redrawCursor();
                return false;
            }
        } else if ([Keycode.BACKSPACE, Keycode.DELETE].indexOf(e.keyCode) > -1) {
            if (this._cursorMode === CursorMode.SELECTION) {
                const selectionTextItems = this._getSelectionTextItems();
                if (selectionTextItems.length > 0) {
                    this._cursor = this._drawableTextItems.indexOf(selectionTextItems[0]);
                    this._removeTextItems(selectionTextItems);
                } else return false;
            } else {
                if (e.keyCode === Keycode.BACKSPACE) {
                    if (this._cursor === 0) return false;
                    this._cursor--;
                }
                this._removeTextItems([this._drawableTextItems[this._cursor]]);
            }
            this._cursorMode = CursorMode.EDIT;
            this._redrawCursor();
            return false;
        } else if (e.keyCode === Keycode.HANGUL) {
            ActaParagraph.toggleInputMethod();
            return false;
        } else if (e.keyCode === Keycode.HANJA) {
            //
        }
        return (!e.ctrlKey) ? this._editorInputChar(e) : undefined;
    }

    private _applyDefinedTextStyle(textItems: IDrawableTextItem[], textStyleName: string) {

    }

    private _applyTextStyle(textItems: IDrawableTextItem[], textStyle: ActaTextStyle) {

    }

    private _removeTextItems(textItems: IDrawableTextItem[]) {
        let removedCnt = 0;
        textItems.reverse();
        for (const textItem of textItems) {
            if (!textItem) continue;

            const textNode = textItem.textNode;
            if (textItem.type === DrawableTextItemType.END_OF_NODE) continue;
            let textValue = textNode.value[textItem.indexOfNode];
            textValue = `${textValue.substr(0, textItem.indexOfText)}${textValue.substr(textItem.indexOfText + 1)}`;
            textNode.edit(textItem.indexOfNode, textValue);
            removedCnt++;
        }
        if (removedCnt > 0) this._redraw();
    }

    private _findVisableTextItem(textItem: IDrawableTextItem | null) {
        if (textItem === null) return null;

        const path = $(this._element.svg).find(`path[data-id="${textItem.id}"]`);
        if (path.length < 1) {
            if (!textItem.line) return null;
            let tmpIdx = textItem.line.items.indexOf(textItem);
            if (tmpIdx < 0) return null;
            else {
                do {
                    if (--tmpIdx < 1) break;
                    const tmpItem = $(this._element.svg).find(`path[data-id="${textItem.line.items[tmpIdx].id}"]`);
                    if (tmpItem.length < 1) continue;
                } while (false);
            }
            textItem = textItem.line.items[Math.max(tmpIdx, 0)];
        }
        return textItem || null;
    }

    private _computeNearestItem(curItem: IDrawableTextItem | null, targetItems: IDrawableTextItem[]) {
        if (!curItem) return null;

        const curPath = $(this._element.svg).find(`path[data-id="${curItem.id}"]`);
        let curOffsetX = 0;

        if (curPath.length < 1) {
            const tmpItem = this._findVisableTextItem(curItem);
            if (tmpItem) {
                const tmpPath = $(this._element.svg).find(`path[data-id="${tmpItem.id}"]`);
                curOffsetX = parseFloat(tmpPath.attr('data-x') || '0');
                curOffsetX += parseFloat(tmpPath.attr('data-width') || '0');
            }
        } else {
            curOffsetX = parseFloat(curPath.attr('data-x') || '0');
        }
        const distance: number[] = [];
        let prevOffsetX = 0;

        for (const targetItem of targetItems) {
            const path = $(this._element.svg).find(`path[data-id="${targetItem.id}"]`);
            if (path.length > 0) {
                const targetOffsetX = parseFloat(path.attr('data-x') || '0')
                prevOffsetX = Math.max(targetOffsetX, prevOffsetX);
            }
            distance.push(Math.abs(prevOffsetX - curOffsetX));
        }
        return targetItems[distance.indexOf(Math.min(...distance))];
    }

    private _getTextItemByCursor() {
        if (this._cursor === null) return null;
        return this._drawableTextItems[this._cursor];
    }

    private _getLineDataByCursor() {
        if (this._cursor === null) return null;
        const textItem = this._drawableTextItems[this._cursor];
        return (textItem) ? (textItem.line || null) : null;
    }

    private _getPrevLineDataByCursor() {
        const curLineData = this._getLineDataByCursor();
        if (!curLineData) return null;

        const firstTextItemOfLine = curLineData.items[0];
        const firstTextItemIdx = this._drawableTextItems.indexOf(firstTextItemOfLine);
        if (firstTextItemIdx === 0)  return null;

        return this._drawableTextItems[firstTextItemIdx - 1].line;
    }

    private _getNextLineDataByCursor() {
        const curLineData = this._getLineDataByCursor();
        if (!curLineData) return null;

        const lastTextItemOfLine = curLineData.items[curLineData.items.length - 1];
        const lastTextItemIdx = this._drawableTextItems.indexOf(lastTextItemOfLine);
        if (lastTextItemIdx === this._drawableTextItems.length - 1)  return null;

        return this._drawableTextItems[lastTextItemIdx + 1].line;
    }

    private _setCursor(textItem: IDrawableTextItem | undefined, x?: number) {
        let position = 0;
        if (textItem) {
            const path = $(this._element.svg).find(`path[data-id="${textItem.id}"]`);
            position = this._drawableTextItems.indexOf(textItem);

            if (textItem.line === null) return null;
            if (x !== undefined && path.length > 0) {
                const pathX = parseFloat(path.attr('data-x') || '0');
                const pathWidth = parseFloat(path.attr('data-width') || '0');
                if (pathWidth > 0) {
                    const offsetX = x - pathX;
                    if (pathWidth / 2 < offsetX) position++;
                }
            }
        } else {
            position = this._drawableTextItems.length;
        }
        this._cursor = position;

        return this._cursor;
    };

    private _getSelectionTextItems() {
        const textItems: IDrawableTextItem[] = [];
        if (this._cursorMode === CursorMode.SELECTION) {
            if (this._selectionStartItem !== null && this._cursor !== null) {
                let startpos = this._selectionStartItem;
                let endpos = this._cursor;

                if (startpos > endpos) {
                    [startpos, endpos] = [endpos, startpos];
                }
                endpos--;

                for (let i = startpos; i <= endpos; i++) {
                    textItems.push(this._drawableTextItems[Math.min(i, this._drawableTextItems.length - 1)]);
                }
            }
        }
        return textItems;
    }

    private get lastDrawableTextItem() {
        return this._drawableTextItems.length > 0 ? this._drawableTextItems[this._drawableTextItems.length - 1] : null;
    }

    private _redrawCursor() {
        $(this._element.svg).find('.cursor').remove();
        if (this._cursor === null) return;

        if (this._cursorMode === CursorMode.SELECTION && this._cursor !== this._selectionStartItem) {
            const textItem = this._getTextItemByCursor();
            const lineData = this._getLineDataByCursor();
            if (!textItem || !lineData) return;

            let currentColumn: ActaParagraphColumnElement | undefined;
            let currentLine = -1, startx = 0, selection;

            const selectionTextItems = this._getSelectionTextItems();
            for (const selectTextItem of selectionTextItems) {
                if (!selectTextItem.line) continue;

                const path = $(this._element.svg).find(`path[data-id="${selectTextItem.id}"]`);
                if (path.length < 1) continue;

                const column = $(this._element).find<ActaParagraphColumnElement>('x-paragraph-col').get(selectTextItem.line.indexOfColumn);
                if (!column) continue;

                if (selectTextItem.line === null) continue;
                if (currentColumn !== column || currentLine !== selectTextItem.line.indexOfLine || selection === undefined) {
                    currentColumn = column;
                    currentLine = selectTextItem.line.indexOfLine;
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
                        'data-start-id': selectionTextItems[0].id,
                        'data-end-id': selectionTextItems[selectionTextItems.length - 1].id
                    }).addClass('cursor');
                    $(currentColumn.svg).append(selection);
                } else {
                    const endx = parseFloat($(path).attr('data-x') || '0') + parseFloat($(path).attr('data-width') || '0');
                    $(selection).attr('width', endx - startx);
                }
            }
        } else {
            let currentColumn: ActaParagraphColumnElement | undefined;
            let textItem: IDrawableTextItem | null;
            let lineData: IDrawableLineData | null;
            let x, y, height;

            if (this._cursor > this._drawableTextItems.length - 1) {
                let lastItemNewline = false;
                if (this._drawableTextItems.length > 0) {
                    if (this.lastDrawableTextItem && this.lastDrawableTextItem.type === DrawableTextItemType.NEWLINE) lastItemNewline = true;
                }
                if (lastItemNewline || this._drawableTextItems.length < 1) {
                    let indexOfColumn = 0;
                    if (lastItemNewline) {
                        textItem = this._findVisableTextItem(this.lastDrawableTextItem);
                        lineData = textItem ? textItem.line : null;
                        if (!textItem || !lineData) return;
                        indexOfColumn = lineData.indexOfColumn;
                    }
                    currentColumn = $(this._element).find<ActaParagraphColumnElement>('x-paragraph-col').get(indexOfColumn);
                    const drawableLineDatas: IDrawableLineData[] = $(currentColumn.svg).data('drawableLineDatas') || [];
                    lineData = drawableLineDatas[Math.max(drawableLineDatas.length - 1, 0)];
                    if (!lineData) return;

                    x = lineData.indent;
                    y = lineData.offsetY || 0;
                    height = lineData.maxHeight;
                } else {
                    textItem = this._findVisableTextItem(this.lastDrawableTextItem);
                    lineData = textItem ? textItem.line : null;
                    if (!textItem || !lineData) return;

                    currentColumn = $(this._element).find<ActaParagraphColumnElement>('x-paragraph-col').get(lineData.indexOfColumn);
                    const path = $(this._element.svg).find(`path[data-id="${textItem.id}"]`);
                    x = (path.length < 1) ? lineData.indent : (parseFloat(path.attr('data-x') || '0') + parseFloat(path.attr('data-width') || '0'));
                    y = (path.length < 1) ? (lineData.offsetY || 0) : parseFloat(path.attr('data-y') || '0');
                    height = (path.length < 1) ? lineData.maxHeight : parseFloat(path.attr('data-height') || '0');
                }
            } else {
                textItem = this._getTextItemByCursor();
                lineData = textItem ? textItem.line : null;
                if (!textItem || !lineData) return;

                currentColumn = $(this._element).find<ActaParagraphColumnElement>('x-paragraph-col').get(lineData.indexOfColumn);
                if (textItem.type !== DrawableTextItemType.NEWLINE) {
                    const path = $(this._element.svg).find(`path[data-id="${textItem.id}"]`);
                    x = (path.length < 1) ? lineData.indent : (path.attr('data-x') || '0');
                    y = (path.length < 1) ? (lineData.offsetY || 0) : parseFloat(path.attr('data-y') || '0');
                    height = (path.length < 1) ? lineData.maxHeight : parseFloat(path.attr('data-height') || '0');
                } else {
                    let path = $('null');
                    textItem = this._findVisableTextItem(textItem);
                    if (textItem) path = $(this._element.svg).find(`path[data-id="${textItem.id}"]`);
                    x = (path.length < 1) ? lineData.indent : (parseFloat(path.attr('data-x') || '0') + parseFloat(path.attr('data-width') || '0'));
                    y = (path.length < 1) ? (lineData.offsetY || 0) : parseFloat(path.attr('data-y') || '0');
                    height = (path.length < 1) ? lineData.maxHeight : parseFloat(path.attr('data-height') || '0');
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

    private _getTextItemByPosition(column: ActaParagraphColumnElement, x: number, y: number) {
        let textItem: IDrawableTextItem | undefined;
        let id: string | undefined;

        $(column.svg).find('path').each((i: number, path: SVGPathElement) => {
            const itemX1 = parseFloat($(path).attr('data-x') || '');
            const itemX2 = parseFloat($(path).attr('data-x') || '') + parseFloat($(path).attr('data-width') || '');
            const itemY1 = parseFloat($(path).attr('data-y') || '');
            const itemY2 = parseFloat($(path).attr('data-y') || '') + parseFloat($(path).attr('data-height') || '') + parseFloat($(path).attr('data-leading') || '');

            if (isNaN(itemX1) || isNaN(itemX2) || isNaN(itemY1) || isNaN(itemY2)) return;
            if (itemX1 < x && itemX2 > x && itemY1 < y && itemY2 > y) {
                id = $(path).attr('data-id') || '';
                return false;
            }
        });
        if (!id) {
            const drawableLineDatas: IDrawableLineData[] = $(column.svg).data('drawableLineDatas') || [];
            for (const lineData of drawableLineDatas) {
                if (lineData.offsetY === undefined) continue;

                const itemY1 = lineData.offsetY;
                const itemY2 = lineData.offsetY + lineData.maxHeight + lineData.maxLeading;
                if (itemY1 < y && itemY2 > y) {
                    let maxWidth = 0;
                    for (const lineTextItem of lineData.items) maxWidth += lineTextItem.calcWidth;
                    id = lineData.items[maxWidth <= x ? lineData.items.length - 1 : 0].id;
                    break;
                }
            }
        }
        for (const findTextItem of this._drawableTextItems) {
            if (findTextItem.id !== id) continue;
            textItem = findTextItem;
        }
        return textItem;
    }

    private _getTextItemsByPosition(column: ActaParagraphColumnElement, x: number, y: number, width?: number, height?: number) {
        const textItems: IDrawableTextItem[] = [];
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
        for (const textItem of this._drawableTextItems) {
            if (idList.indexOf(textItem.id) < 0) continue;
            textItems.push(textItem);
        }
        return textItems;
    }

    private _generateDrawableTextData() {
        this._drawableTextItems = [];
        this._drawableTextNodeList = [];
        if (this._textObject == null) return false;
        return this._convertTextNodeToData(
            this._textObject,
            ActaTextStyleManager.getInstance().get(this._defaultTextStyleName || '') || new ActaTextStyle()
        );
    }

    private _updateDrawableTextData() {
        if (this._textObject == null) {
            this._drawableTextItems = [];
            this._drawableTextNodeList = [];
            return false;
        }
        return this._convertTextNodeToData(
            this._textObject,
            ActaTextStyleManager.getInstance().get(this._defaultTextStyleName || '') || new ActaTextStyle(),
            true
        );
    }

    private _splitTextDataByNodeID(id: string, indexOfNode?: number) {
        let preList: IDrawableTextItem[] | undefined;
        let postList: IDrawableTextItem[] | undefined;
        let s = -1, e = -1;

        if (indexOfNode === undefined) {
            const tmpNodeIDList: string[] = [];
            for (const tmpTextItem of this._drawableTextItems) tmpNodeIDList.push(tmpTextItem.textNode.id);

            s = tmpNodeIDList.indexOf(id);
            e = tmpNodeIDList.lastIndexOf(id);
        } else {
            for (let i = 0; i < this._drawableTextItems.length; i++) {
                const tmpTextItem =this._drawableTextItems[i];
                if (tmpTextItem.textNode.id !== id || tmpTextItem.indexOfNode !== indexOfNode) continue;
                if (s < 0) s = i;
                e = i;
            }
        }
        if (s > -1) {
            preList = this._drawableTextItems.slice(undefined, s);
            postList = this._drawableTextItems.slice(e + 1);
        }
        return [preList, postList];
    }

    private _convertTextNodeToData(textNode: ActaTextNode, parentTextStyle: ActaTextStyle, modifyOnly: boolean = false): boolean {
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
        if (modifyOnly && textNode.modified && !textNode.partModified) {
            [preList, postList] = this._splitTextDataByNodeID(textNode.id);
            if (preList === undefined || postList === undefined) return false;
            this._drawableTextItems = preList;
        }
        for (let indexOfNode = 0; indexOfNode < textNode.length; indexOfNode++) {
            let childModifyOnly = modifyOnly;
            if (modifyOnly && textNode.modified) {
                if (!textNode.partModified) {
                    childModifyOnly = false;
                } else if (textNode.isModified(indexOfNode)) {
                    [preList, postList] = this._splitTextDataByNodeID(textNode.id, indexOfNode);
                    if (preList === undefined || postList === undefined) {
                        textNode.modified = true;
                        return this._convertTextNodeToData(textNode, parentTextStyle, true);
                    }
                    this._drawableTextItems = preList;
                }
            }
            if (textNode.value[indexOfNode] instanceof ActaTextNode) {
                if (!this._convertTextNodeToData(textNode.value[indexOfNode], textStyle, childModifyOnly)) return false;
                if (indexOfNode >= textNode.length - 1) {
                    // 노드 업데이트를 위해 노드 마지막부분을 마킹
                    this._drawableTextItems.push({
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
                if (modifyOnly && !textNode.isModified(indexOfNode)) continue;

                const textvalue = textNode.value[indexOfNode].toString();
                for (let indexOfText = 0; indexOfText < textvalue.length; indexOfText++) {
                    const char = textvalue[indexOfText];
                    if (char === "\n") {
                        this._drawableTextItems.push({
                            id: uuidv4(),
                            type: DrawableTextItemType.NEWLINE,
                            calcWidth: 0,
                            width: 0,
                            height: ActaParagraph.getCharHeight(textStyle.font.font, textStyle.fontSize),
                            line: null,
                            textNode, textStyle, indexOfNode, indexOfText, char
                        });
                    } else if (char === ' ') {
                        this._drawableTextItems.push({
                            id: uuidv4(),
                            type: DrawableTextItemType.SPACE,
                            calcWidth: textStyle.fontSize / 3,
                            width: textStyle.fontSize / 3,
                            height: ActaParagraph.getCharHeight(textStyle.font.font, textStyle.fontSize),
                            line: null,
                            textNode, textStyle, indexOfNode, indexOfText, char
                        });
                    } else {
                        const glyphData = ActaParagraph.getCharPath(textStyle.font.font, char, textStyle.fontSize);
                        this._drawableTextItems.push({
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
            if (modifyOnly && textNode.modified && textNode.partModified && textNode.isModified(indexOfNode) && postList !== undefined) {
                this._drawableTextItems = this._drawableTextItems.concat(postList);
                preList = undefined;
                postList = undefined;
            }
        }
        if (modifyOnly && textNode.modified && !textNode.partModified && postList !== undefined) {
            this._drawableTextItems = this._drawableTextItems.concat(postList);
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

        $(this._element).find<ActaParagraphColumnElement>('x-paragraph-col').each((i, child) => {
            const column = child;
            $(column.svg).attr({
                width: ($(column).innerWidth() || 0),
                height: ($(column).innerHeight() || 0)
            }).data('drawableLineDatas', []);
            canvasList.push(column.svg);
        });
        for (const textItem of this._drawableTextItems) {
            if (textItem.type === DrawableTextItemType.END_OF_NODE) continue;
            if (textItem.textNode.modified) {
                // 수정된 노드라면 업데이트
                if (!this._updateDrawableTextData()) this._generateDrawableTextData();
                return this._computeDrawableTextSize();
            } else if (this._drawableTextNodeList.indexOf(textItem.textNode.id) < 0) {
                // 삭제된 노드라면... 노드 제거
                const [preList, postList] = this._splitTextDataByNodeID(textItem.textNode.id);
                if (preList === undefined || postList === undefined) {
                    this._generateDrawableTextData();
                } else {
                    this._drawableTextItems = [];
                    this._drawableTextItems.concat(preList).concat(postList);
                }
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
                        indexOfLine: $(canvas).data('drawableLineDatas').length,
                        limitWidth: $(canvas).width() || 0,
                        maxHeight: 0,
                        maxLeading: 0,
                        indent: indent ? textItem.textStyle.indent || 0 : 0,
                        items: [],
                        textAlign: TextAlign.JUSTIFY
                    };
                    indent = false;

                    $(canvas).data('drawableLineDatas').push(lineData);
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

                const drawableLineDatas: IDrawableLineData[] = $(canvas).data('drawableLineDatas');
                for (let j = 0; j < drawableLineDatas.length; j++) {
                    const line = drawableLineDatas[j];
                    filledHeight += line.maxHeight;
                    if (j < drawableLineDatas.length - 1) filledHeight += line.maxLeading;
                }
                if (filledHeight > ($(canvas).height() || 0)) {
                    lineData = drawableLineDatas.pop() || null;
                    $(canvas).data('drawableLineDatas', drawableLineDatas);

                    canvas = canvasList[++canvasPos];
                    if (!canvas) break;

                    if (lineData != null) {
                        lineData.indexOfColumn = canvasPos;
                        lineData.indexOfLine = 0;
                    }
                    $(canvas).data('drawableLineDatas').push(lineData)
                }
            }
        }
        let lastItemNewline = false;
        if (this.lastDrawableTextItem !== null) {
            if (this.lastDrawableTextItem.type === DrawableTextItemType.NEWLINE) lastItemNewline = true;
        }
        if (this._drawableTextItems.length < 1 || lastItemNewline) {
            let column: ActaParagraphColumnElement | undefined;
            let textStyle: ActaTextStyle | undefined;
            let indexOfColumn = 0;
            if (lastItemNewline && this.lastDrawableTextItem !== null) {
                textStyle = this.lastDrawableTextItem.textStyle;
                indexOfColumn = this.lastDrawableTextItem.line ? this.lastDrawableTextItem.line.indexOfColumn : 0;
            }
            textStyle = ActaTextStyleManager.getInstance().get(this._defaultTextStyleName || '');
            if (!textStyle || !textStyle.font || !textStyle.fontSize) return;

            const textHeight = ActaParagraph.getCharHeight(textStyle.font.font, textStyle.fontSize)
            const leading = (textHeight || 0) * ((textStyle.lineHeight || 1) - 1);

            column = $(this._element).find<ActaParagraphColumnElement>('x-paragraph-col').get(indexOfColumn);
            $(column.svg).data('drawableLineDatas').push({
                indexOfColumn: 0,
                indexOfLine: $(column.svg).data('drawableLineDatas').length - 1,
                limitWidth: $(column.svg).width() || 0,
                maxHeight: textHeight,
                maxLeading: leading,
                indent: textStyle.indent || 0,
                items: [],
                textAlign: textStyle.textAlign || TextAlign.JUSTIFY
            })
        }
    }

    private _drawText() {
        $(this._element.svg).each((i, canvas) => {
            const textData: IDrawableLineData[] = $(canvas).data('drawableLineDatas');
            const paths: SVGPathElement[] = [];
            const lines: SVGLineElement[] = [];
            let offsetY = 0;

            $(canvas).empty();
            for (const lineData of textData) {
                let offsetX = lineData.indent;
                let leading = 0;

                lineData.offsetY = offsetY;
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
                        const attr = {
                            'data-id': textItem.id,
                            'data-line': textItem.line.indexOfLine,
                            'data-textnode': textItem.textNode.id,
                            'data-index-of-node': textItem.indexOfNode,
                            'data-index-of-text': textItem.indexOfText
                        };
                        const attrText = Object.assign(clone(attr), {
                            'data-x': offsetX,
                            'data-y': offsetY,
                            'data-width': textItem.calcWidth,
                            'data-height': lineData.maxHeight,
                            'data-leading': lineData.maxLeading
                        });
                        const attrStyle = Object.assign(clone(attr), {
                            'x1': (textItem.drawOffsetX || 0) + ((textItem.textStyle.letterSpacing || 0) / 2) + offsetX,
                            'x2': (textItem.drawOffsetX || 0) + ((textItem.textStyle.letterSpacing || 0) / 2) + offsetX + textItem.calcWidth,
                            'stroke': textItem.textStyle.color,
                            'stroke-width': 1,
                            'stroke-linecap': 'butt'
                        });
                        if (textItem.path !== undefined) {
                            $(textItem.path).attr(
                                Object.assign(attrText, { 'fill': textItem.textStyle.color || '#000000'})
                            ).css('transform', transform);
                            paths.push(textItem.path);
                        } else {
                            const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
                            $(path).attr(attrText).css('transform', transform);
                            paths.push(path);
                        }
                        if (textItem.textStyle !== undefined) {
                            if (textItem.textStyle.strikeline) {
                                const strikeline = document.createElementNS('http://www.w3.org/2000/svg', 'line');
                                $(strikeline).attr(Object.assign(attrStyle, {
                                    'y1': (textItem.drawOffsetY || 0) + offsetY - (lineData.maxHeight / 3),
                                    'y2': (textItem.drawOffsetY || 0) + offsetY - (lineData.maxHeight / 3),
                                }));
                                lines.push(strikeline);
                            }
                            if (textItem.textStyle.underline) {
                                const underline = document.createElementNS('http://www.w3.org/2000/svg', 'line');
                                $(underline).attr(Object.assign(attrStyle, {
                                    'y1': (textItem.drawOffsetY || 0) + offsetY,
                                    'y2': (textItem.drawOffsetY || 0) + offsetY,
                                }));
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
        this._cursor = null;
        this._inputChar = '';

        this.columnCount = columnCount;
        for (let i = 0; i < columnCount; i++) {
            if (columnWidths[i]) this.columnWidth(i, columnWidths[i]);
        }
        this.innerMargin = innerMargin;

        this._drawableTextItems = [];
        this._drawableTextNodeList = [];

        $(this._element).on('resize', e => {
            this._redraw();
            return false;
        });
        $(this._element).on('keydown', (e) => e.originalEvent ? this._editorKeyboardControl(e.originalEvent) : {});
        $(this._element).on('mousedown', 'x-paragraph-col', (e) => {
            if (!this._editable) return false;
            const eventElement = this._getTextItemByPosition(e.currentTarget, e.offsetX, e.offsetY);
            this._cursorMode = CursorMode.SELECTION;
            this._cursor = null;
            this._selectionStartItem = this._setCursor(eventElement, e.offsetX);
            this._redrawCursor();

            this._element.focus();

            return false;
        });
        $(this._element).on('mousemove', 'x-paragraph-col', (e) => {
            const ev = e.originalEvent as MouseEvent;
            if (!this._editable) return false;
            if (this._cursorMode !== CursorMode.SELECTION || ev.buttons !== 1) return false;
            const eventElement = this._getTextItemByPosition(e.currentTarget, e.offsetX, e.offsetY);
            if (this._selectionStartItem != null) {
                this._setCursor(eventElement, e.offsetX);
                this._redrawCursor();
            }
            return false;
        });
        $(this._element).on('mouseup', 'x-paragraph-col', (e) => {
            if (!this._editable) return false;
            if (this._cursorMode !== CursorMode.SELECTION) return false;
            const eventElement = this._getTextItemByPosition(e.currentTarget, e.offsetX, e.offsetY);
            if (this._selectionStartItem != null) {
                this._setCursor(eventElement, e.offsetX);
                this._redrawCursor();
            }
            if (this._cursor === null) {
                this._cursorMode = CursorMode.NONE;
                return false;
            } else if (this._cursor === this._selectionStartItem || !this._selectionStartItem) {
                this._cursorMode = CursorMode.EDIT;
            }
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
        this._cursor = null;
        this.update();
    }

    set columnCount(count) {
        this._initElement();

        this._columnCount = count || 1;
        for (let i = 0; i < this._columnCount; i++) {
            const column = document.createElement('x-paragraph-col') as ActaParagraphColumnElement;
            this._element.appendChild(column);
            $(column.svg).data('drawableLineDatas', []);

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