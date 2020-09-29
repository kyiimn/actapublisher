import { ActaParagraphElement } from './element/paragraph-el';
import { ActaParagraphColumnElement } from './element/paragraph-col-el';
import { ActaParagraphMarginElement } from './element/paragraph-margin-el';

import { ActaTextStyleManager } from './textstylemgr';
import { ActaTextConverter } from './textconverter';
import { ActaTextNode, ActaTextStore } from './textstore';
import { ActaTextStyle, ActaTextStyleInherit, TextAlign } from './textstyle';

import { ActaClipboard } from '../clipboard';

import { ITextItem, ITextLineItem, TextItemType } from './textstruct';

import Hangul from 'hangul-js';
import opentype from 'opentype.js';
import $ from 'jquery';
import { v4 as uuidv4 } from 'uuid';
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
    INSERT = 45,
    DELETE = 46
};

enum CursorMode {
    NONE, EDIT, INPUT, SELECTION
};

enum InputMethod {
    EN, KO
};

export class ActaParagraph {
    private _element: ActaParagraphElement;
    private _columnCount: number;
    private _innerMargin: string | number;
    private _textStore: ActaTextStore | null;
    private _defaultTextStyleName: string | null;
    private _textItems: ITextItem[];
    private _textNodeList: string[];
    private _selectionStartItem: number | null;
    private _cursorMode: CursorMode;
    private _cursor: number | null;
    private _editable: boolean;
    private _inputChar: string;
    private _overflow: boolean;

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
        const pathData = path.toPathData(3);
        const el = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        el.setAttribute('d', pathData);

        return { path: el, offsetX: 0, offsetY: charHeight + yMin, width: charWidth, height: charHeight };
    }

    private _initElement() {
        this._element.innerHTML = '';
    }

    private _updateInputMethodChar() {
        if (!this._cursor) return;

        const textItem = this._textItems[this._cursor - 1];
        if (!textItem) return;

        let hangulText = Hangul.a(this._inputChar.split(''));
        let textValue = textItem.textNode.value[textItem.indexOfNode];
        textValue = `${textValue.substr(0, textItem.indexOfText)}${hangulText}${textValue.substr(textItem.indexOfText + 1)}`;
        textItem.textNode.replace(textItem.indexOfNode, textValue);

        if (hangulText.length > 1) {
            this._cursor += hangulText.length - 1;
            hangulText = hangulText.substr(hangulText.length - 1);
        }
        this._inputChar = Hangul.d(hangulText).join('');
    }

    private _onCharKeyPress(e: KeyboardEvent) {
        const char = ActaParagraph.getChar(e);
        let needGenerateTextData = false;

        if ([CursorMode.EDIT, CursorMode.SELECTION, CursorMode.INPUT].indexOf(this._cursorMode) < 0) return;
        if (this._cursor === null) { this._cursorMode = CursorMode.NONE; return; }
        if (char === undefined) { this._cursorMode = CursorMode.EDIT; return; }

        if (this._cursorMode === CursorMode.SELECTION) {
            const selectionTextItems = this._getSelectionTextItems();
            this._cursor = this._textItems.indexOf(selectionTextItems[0]);
            this._removeTextItems(selectionTextItems);
            this._cursorMode = CursorMode.EDIT;
        }
        let textNode: ActaTextStore | null = null;
        let indexOfNode: number = 0;
        let indexOfText: number = 0;
        if (this._cursor > this._textItems.length - 1) {
            if (this.lastTextItem !== null) {
                indexOfNode = this.lastTextItem.indexOfNode;
                indexOfText = this.lastTextItem.indexOfText + 1;
                textNode = this.lastTextItem.textNode;
                if (!textNode) return false;
            } else {
                textNode = this._textStore;
                if (!textNode) return false;
                if (textNode.length < 1) textNode.push('');
                needGenerateTextData = true;
            }
        } else {
            const textItem = this._getCursorTextItem();
            if (!textItem) { this._cursorMode = CursorMode.EDIT; return; }
            indexOfNode = textItem.indexOfNode;
            indexOfText = textItem.indexOfText;
            textNode = textItem.textNode;
            if (!textNode) return false;
        }

        let textValue: string = textNode.value[indexOfNode];
        if (ActaParagraph.inputMethod === InputMethod.KO && ActaParagraph.isCharType(e) === CharType.TEXT) {
            if (this._cursorMode === CursorMode.INPUT) {
                this._cursorMode = CursorMode.EDIT;
                this._inputChar += char;
                this._updateInputMethodChar();
            } else {
                this._inputChar = char;
                this._cursor++;
                textValue = `${textValue.substr(0, indexOfText)}${this._inputChar}${textValue.substr(indexOfText)}`;
                textNode.replace(indexOfNode, textValue);
            }
            if (this._inputChar !== '') this._cursorMode = CursorMode.INPUT;
        } else {
            textValue = `${textValue.substr(0, indexOfText)}${char}${textValue.substr(indexOfText)}`;
            this._inputChar = '';
            this._cursorMode = CursorMode.EDIT;
            this._cursor++;
            textNode.replace(indexOfNode, textValue);
        }
        if (needGenerateTextData) this._generateTextItems();

        this._redraw();
        this._redrawCursor();

        return false;
    }

    private _insertText(text: string) {
        let textNode: ActaTextStore | null = null;
        let indexOfNode: number = 0;
        let indexOfText: number = 0;

        if (this._cursor === null) return false;
        if (this._cursor > this._textItems.length - 1) {
            if (this.lastTextItem !== null) {
                indexOfNode = this.lastTextItem.indexOfNode;
                indexOfText = this.lastTextItem.indexOfText + 1;
                textNode = this.lastTextItem.textNode;
                if (!textNode) return false;
            } else {
                textNode = this._textStore;
                if (!textNode) return false;
                if (textNode.length < 1) textNode.push('');
                this._generateTextItems();
            }
        } else {
            const textItem = this._getCursorTextItem();
            if (!textItem) return false;
            indexOfNode = textItem.indexOfNode;
            indexOfText = textItem.indexOfText;
            textNode = textItem.textNode;
            if (!textNode) return false;
        }
        let textValue: string = textNode.value[indexOfNode];

        textValue = `${textValue.substr(0, indexOfText)}${text}${textValue.substr(indexOfText)}`;
        this._cursor += text.length;

        textNode.replace(indexOfNode, textValue);

        return true;
    }

    private _onKeyPress(e: KeyboardEvent) {
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
                if (this._cursor > this._textItems.length - 1) this._cursor--;
                const lineItem = this._getCursorLineItem();
                if (lineItem && lineItem.items.length > 0) {
                    this._cursor = this._textItems.indexOf((e.keyCode === Keycode.HOME) ? lineItem.items[0] : lineItem.items[lineItem.items.length - 1]);
                    if (this._cursor === this._textItems.length - 1 && this._textItems[this._cursor].type !== TextItemType.NEWLINE) this._cursor++;
                    this._redrawCursor();
                }
                return false;
            } else if ([Keycode.UP, Keycode.DOWN].indexOf(e.keyCode) > -1) {
                const nearLineItem = (e.keyCode === Keycode.UP) ? this._getCursorPrevLineItem() : this._getCursorNextLineItem();
                if (nearLineItem !== null) {
                    const nearestItem = this._getNearestLineTextItem(this._getCursorTextItem(), nearLineItem.items);
                    if (nearestItem) {
                        this._cursor = this._textItems.indexOf(nearestItem);
                        this._redrawCursor();
                        return false;
                    }
                }
                this._cursorMode = CursorMode.EDIT;
                return false;
            } else if ([Keycode.LEFT, Keycode.RIGHT].indexOf(e.keyCode) > -1) {
                this._cursor = (e.keyCode === Keycode.LEFT) ? Math.max(this._cursor - 1, 0) : Math.min(this._cursor + 1, this._textItems.length);
                this._redrawCursor();
                return false;
            }
        } else if ([Keycode.BACKSPACE, Keycode.DELETE].indexOf(e.keyCode) > -1) {
            if (this._cursorMode === CursorMode.SELECTION) {
                const selTextItems = this._getSelectionTextItems();
                if (selTextItems.length > 0) {
                    this._cursor = this._textItems.indexOf(selTextItems[0]);
                    this._removeTextItems(selTextItems);
                } else return false;
            } else {
                if (e.keyCode === Keycode.BACKSPACE) {
                    if (ActaParagraph.inputMethod === InputMethod.KO && this._cursorMode === CursorMode.INPUT && this._inputChar !== '') {
                        this._inputChar = this._inputChar.substr(0, this._inputChar.length - 1);
                        this._updateInputMethodChar();
                        if (this._inputChar === '') {
                            this._cursor--;
                            this._cursorMode = CursorMode.EDIT;
                        }
                        this._redraw();
                        this._redrawCursor();
                        return false;
                    }
                    if (this._cursor === 0) return false;
                    this._cursor--;
                }
                this._removeTextItems([this._textItems[this._cursor]]);
            }
            this._cursorMode = CursorMode.EDIT;
            this._redrawCursor();
            return false;
        } else if (e.keyCode === Keycode.HANGUL) {
            ActaParagraph.toggleInputMethod();
            this._cursorMode = CursorMode.EDIT;
            this._redrawCursor();
            return false;
        } else if (e.keyCode === Keycode.HANJA) {
            this._cursorMode = CursorMode.EDIT;
            this._redrawCursor();
            return false;
        } else if ((e.ctrlKey && e.key.toLowerCase() === 'c') || (e.ctrlKey && e.keyCode === Keycode.INSERT)) {
            const selTextItems = this._getSelectionTextItems();
            let selText = '';
            if (selTextItems.length < 1) return false;
            for (const textItem of selTextItems) selText += textItem.char || '';
            ActaClipboard.in.write(selText);
            return false;
        } else if (e.ctrlKey && e.key.toLowerCase() === 'x') {
            const selTextItems = this._getSelectionTextItems();
            let selText = '';
            if (selTextItems.length < 1) return false;
            this._cursor = this._textItems.indexOf(selTextItems[0]);
            for (const textItem of selTextItems) selText += textItem.char || '';
            this._removeTextItems(selTextItems);
            this._redraw();
            this._redrawCursor();
            ActaClipboard.in.write(selText);
            return false;
        } else if ((e.ctrlKey && e.key.toLowerCase() === 'v') || (e.shiftKey && e.keyCode === Keycode.INSERT)) {
            const selTextItems = this._getSelectionTextItems();
            if (selTextItems.length > 0) {
                this._cursor = this._textItems.indexOf(selTextItems[0]);
                this._removeTextItems(selTextItems);
            } else return false;
            this._redraw();
            this._redrawCursor();

            ActaClipboard.in.read().then(v => {
                if (!v) return;
                if (this._cursor === null || typeof(v) !== 'string') return;
                this._insertText(v);
                this._redraw();
                this._redrawCursor();
            });
            return false;
        } else if (e.altKey && e.key === 'd') {
            const selTextItems = this._getSelectionTextItems();
            if (selTextItems.length > 0) {
                const aa = new ActaTextStyleInherit();
                aa.fontSize = 15;
                this._applyTextStyle(selTextItems, aa);//'본문2');
            }
            return false;
        } else if (e.altKey && e.key === 'c') {
            const selTextItems = this._getSelectionTextItems();
            if (selTextItems.length > 0) {
                const aa = new ActaTextStyleInherit();
                this._applyDefinedTextStyle(selTextItems, '본문2');
            }
            return false;
        }
        return (!e.ctrlKey && !e.altKey) ? this._onCharKeyPress(e) : undefined;
    }

    private _applyDefinedTextStyle(textItems: ITextItem[], textStyleName: string | null) {
        if (textItems.length < 1) return;

        if (textItems[0].textNode === textItems[textItems.length - 1].textNode &&
            textItems[0].indexOfNode === 0 && textItems[0].indexOfText === 0 &&
            textItems[textItems.length - 1].indexOfNode === (textItems[textItems.length - 1].textNode.length - 1) &&
            textItems[textItems.length - 1].indexOfText === (textItems[textItems.length - 1].textNode.value[textItems[textItems.length - 1].indexOfNode].length - 1)
        ) {
            // 노드 전체를 선택했을 경우...
            const textNode = textItems[0].textNode;
            const oldValue = textNode.value;
            const newValue = [];
            for (const value of oldValue) newValue.push(value.toString());
            textNode.value = newValue;
            textNode.customTextStyle = new ActaTextStyleInherit();
        } else {
            for (let i = 0; i < textItems.length; i++) {
                const currItem = textItems[i];
                const textNode = currItem.textNode;
                let endItem = currItem, str = '';

                for (let j = textItems.length - 1; j > i; j--) {
                    if (textItems[j].textNode !== textNode) continue;
                    endItem = textItems[j];
                    i = j;
                    break;
                }
                const oldValue = textNode.value;
                const newValue = [];
                for (let j = 0; j < oldValue.length; j++) {
                    if (j < currItem.indexOfNode || j > endItem.indexOfNode) {
                        newValue.push(oldValue[j]);
                    } else if (j === currItem.indexOfNode) {
                        newValue.push(oldValue[j].substr(0, currItem.indexOfText));
                        if (currItem.indexOfNode === endItem.indexOfNode) {
                            newValue.push(oldValue[j].substr(endItem.indexOfText + 1));
                            str = oldValue[j].substr(currItem.indexOfText, endItem.indexOfText - currItem.indexOfText + 1);
                        } else {
                            str += oldValue[j].substr(currItem.indexOfText);
                        }
                    } else if (j === endItem.indexOfNode) {
                        newValue.push(oldValue[j].substr(endItem.indexOfText + 1));
                        str += oldValue[j].substr(0, endItem.indexOfText + 1);
                    } else {
                        if (oldValue[j] instanceof ActaTextNode && oldValue[j] !== textNode) {
                            const nodeIdx = this._textNodeList.indexOf(oldValue[j]);
                            if (nodeIdx > -1) this._textNodeList.splice(nodeIdx, 1);
                        }
                        str += oldValue[j].toString();
                    }
                }
                if (str !== '') {
                    const newNode = new ActaTextNode();
                    const splitedStr = str.split('\n');
                    for (let j = 0; j < splitedStr.length; j++) {
                        newNode.push(splitedStr[j] + ((j !== splitedStr.length - 1) ? '\n' : ''));
                    }
                    newNode.defaultTextStyleName = textStyleName;
                    newValue.splice(currItem.indexOfNode + 1, 0, newNode);
                }console.log(str);
                textNode.value = newValue;
            }
        }
        this._redraw();
        this._redrawCursor();
    }

    private _applyTextStyle(textItems: ITextItem[], textStyle: ActaTextStyleInherit) {
        if (textItems.length < 1) return;
        for (let i = textItems.length; i > 0; i--) {
            const endItem = textItems[i - 1];
            const textNode = endItem.textNode;
            const oldValue = textNode.value;
            const newValue = [];
            let startItem = endItem;

            for (let j = i - 1; j >= 0; j--) {
                if (textItems[j].textNode !== textNode) {
                    i = j - 1;
                    break;
                }
                startItem = textItems[j];
            }
            for (let j = 0; j < startItem.indexOfNode; j++) newValue.push(oldValue[j]);

            const startIndexOfNode = startItem.indexOfNode;
            const endIndexOfNode = endItem.indexOfNode;
            const preValue = oldValue[startIndexOfNode].substr(0, startItem.indexOfText);
            const postValue = oldValue[endIndexOfNode].substr(endItem.indexOfText + 1);
            let str = '';
            if (preValue !== '') newValue.push(preValue);

            const newNode = new ActaTextNode();
            newNode.customTextStyle = textStyle;
            if (startIndexOfNode === endIndexOfNode) {
                str = oldValue[startIndexOfNode].substr(startItem.indexOfText, endItem.indexOfText - startItem.indexOfText + 1);
            } else {
                str = oldValue[startIndexOfNode].substr(startItem.indexOfText);
                for (let j = startIndexOfNode + 1; j <= endIndexOfNode; j++) {
                    str += oldValue[j];
                }
                str += oldValue[endIndexOfNode].substr(0, endItem.indexOfText + 1);
            }
            const splitedStr = str.split('\n');
            for (let j = 0; j < splitedStr.length; j++) {
                newNode.push(splitedStr[j] + ((j !== splitedStr.length - 1) ? '\n' : ''));
            }
            newValue.push(newNode);
            if (postValue !== '') newValue.push(postValue);
            for (let j = endItem.indexOfNode + 1; j < oldValue.length; j++) newValue.push(oldValue[j]);

            textNode.value = newValue;
        }
        this._redraw();
        this._redrawCursor();
    }

    private _removeTextItems(textItems: ITextItem[]) {
        let removedCnt = 0;
        textItems.reverse();
        for (const textItem of textItems) {
            if (!textItem) continue;

            const textNode = textItem.textNode;
            if (textItem.type === TextItemType.END_OF_NODE) continue;
            let textValue = textNode.value[textItem.indexOfNode];
            textValue = `${textValue.substr(0, textItem.indexOfText)}${textValue.substr(textItem.indexOfText + 1)}`;
            textNode.replace(textItem.indexOfNode, textValue);
            removedCnt++;
        }
        if (removedCnt > 0) this._redraw();
    }

    private _getColumnSVG(idx?: number) {
        if (idx === undefined) {
            return $<SVGElement>(this._element.svg);
        } else {
            $<SVGElement>(this._element.querySelectorAll<ActaParagraphElement>('x-paragraph-col')[idx].svg);
        }
    }

    private get columns() {
        const nodeList = this._element.querySelectorAll<ActaParagraphColumnElement>('x-paragraph-col');
        const ret = [];
        for (let i = 0; i < nodeList.length; i++) {
            ret.push(nodeList.item(i));
        }
        return ret
    }

    private _getTextPath(id: string | undefined, column?: SVGElement | number) {
        const svg = (column === undefined) ? this._getColumnSVG() : (typeof(column) === 'number' ? this._getColumnSVG(column) : $(column));
        if (!svg || svg.length < 1) return $<SVGPathElement>('n');
        return svg.find(`path[data-id="${id || ''}"]`) as unknown as JQuery<SVGPathElement>;
    }

    private _getNearestVisableTextItem(textItem: ITextItem | null) {
        if (!textItem) return null;

        const path = this._getTextPath(textItem.id);
        if (path.length < 1) {
            if (!textItem.lineItem) return null;
            let tmpIdx = textItem.lineItem.items.indexOf(textItem);
            if (tmpIdx < 0) return null;
            else {
                do {
                    if (--tmpIdx < 1) break;
                    const tmpItem = this._getTextPath(textItem.lineItem.items[tmpIdx].id);
                    if (tmpItem.length < 1) continue;
                } while (false);
            }
            textItem = textItem.lineItem.items[Math.max(tmpIdx, 0)];
        }
        return textItem || null;
    }

    private _getNearestLineTextItem(curItem: ITextItem | null, targetItems: ITextItem[]) {
        if (!curItem) return null;

        const curPath = this._getTextPath(curItem.id);
        let curOffsetX = 0;

        if (curPath.length < 1) {
            const tmpItem = this._getNearestVisableTextItem(curItem);
            if (tmpItem) {
                const tmpPath = this._getTextPath(tmpItem.id);
                curOffsetX = parseFloat(tmpPath.attr('data-x') || '0');
                curOffsetX += parseFloat(tmpPath.attr('data-width') || '0');
            }
        } else {
            curOffsetX = parseFloat(curPath.attr('data-x') || '0');
        }
        const distance: number[] = [];
        let prevOffsetX = 0;

        for (const targetItem of targetItems) {
            const path = this._getTextPath(targetItem.id);
            if (path.length > 0) {
                const targetOffsetX = parseFloat(path.attr('data-x') || '0')
                prevOffsetX = Math.max(targetOffsetX, prevOffsetX);
            }
            distance.push(Math.abs(prevOffsetX - curOffsetX));
        }
        return targetItems[distance.indexOf(Math.min(...distance))];
    }

    private _getCursorTextItem() {
        if (this._cursor === null) return null;
        return this._textItems[this._cursor];
    }

    private _getCursorLineItem() {
        if (this._cursor === null) return null;
        const textItem = this._textItems[this._cursor];
        return (textItem) ? (textItem.lineItem || null) : null;
    }

    private _getCursorPrevLineItem() {
        const curLineItem = this._getCursorLineItem();
        if (!curLineItem) return null;

        const firstTextItemOfLine = curLineItem.items[0];
        const firstTextItemIdx = this._textItems.indexOf(firstTextItemOfLine);
        if (firstTextItemIdx === 0)  return null;

        return this._textItems[firstTextItemIdx - 1].lineItem;
    }

    private _getCursorNextLineItem() {
        const curLineItem = this._getCursorLineItem();
        if (!curLineItem) return null;

        const lastTextItemOfLine = curLineItem.items[curLineItem.items.length - 1];
        const lastTextItemIdx = this._textItems.indexOf(lastTextItemOfLine);
        if (lastTextItemIdx === this._textItems.length - 1)  return null;

        return this._textItems[lastTextItemIdx + 1].lineItem;
    }

    private _setCursor(textItem: ITextItem | undefined, x?: number) {
        let position = 0;
        if (textItem) {
            const path = this._getTextPath(textItem.id);
            position = this._textItems.indexOf(textItem);

            if (textItem.lineItem === null) return null;
            if (x !== undefined && path.length > 0) {
                const pathX = parseFloat(path.attr('data-x') || '0');
                const pathWidth = parseFloat(path.attr('data-width') || '0');
                if (pathWidth > 0) {
                    const offsetX = x - pathX;
                    if (pathWidth / 2 < offsetX) position++;
                }
            }
        } else {
            position = this._textItems.length;
        }
        this._cursor = position;

        return this._cursor;
    };

    private _getSelectionTextItems() {
        const textItems: ITextItem[] = [];
        if (this._cursorMode === CursorMode.SELECTION) {
            if (this._selectionStartItem !== null && this._cursor !== null) {
                let startpos = this._selectionStartItem;
                let endpos = this._cursor;

                if (startpos > endpos) [startpos, endpos] = [endpos, startpos];
                endpos--;

                for (let i = startpos; i <= endpos; i++) {
                    textItems.push(this._textItems[Math.min(i, this._textItems.length - 1)]);
                }
            }
        }
        return textItems;
    }

    private get lastTextItem() {
        return this._textItems.length > 0 ? this._textItems[this._textItems.length - 1] : null;
    }

    private _redrawCursor() {
        $(this._element.svg).find('.cursor').remove();
        if (this._cursor === null) return;

        if (this._cursorMode === CursorMode.SELECTION && this._cursor !== this._selectionStartItem) {
            let currentColumn: ActaParagraphColumnElement | undefined;
            let currentLine = -1, startx = 0, selection;

            const selectionTextItems = this._getSelectionTextItems();
            for (const selectTextItem of selectionTextItems) {
                if (!selectTextItem.lineItem) continue;

                const path = this._getTextPath(selectTextItem.id);
                if (path.length < 1) continue;

                const column = this.columns[selectTextItem.lineItem.indexOfColumn];
                if (!column) continue;

                if (selectTextItem.lineItem === null) continue;
                if (currentColumn !== column || currentLine !== selectTextItem.lineItem.indexOfLine || selection === undefined) {
                    currentColumn = column;
                    currentLine = selectTextItem.lineItem.indexOfLine;
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
        } else if (ActaParagraph.inputMethod !== InputMethod.EN && this._cursorMode === CursorMode.INPUT && this._inputChar !== '') {
            const textItem = this._getNearestVisableTextItem(this._textItems[this._cursor - 1]);
            if (!textItem || !textItem.lineItem) return;

            const column = this.columns[textItem.lineItem.indexOfColumn];
            if (!column) return;

            const path = this._getTextPath(textItem.id);
            if (path.length < 1) return;

            const selection = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
            $(selection).attr({
                'x': $(path).attr('data-x') || '0',
                'y': $(path).attr('data-y') || '0',
                'width': parseFloat($(path).attr('data-width') || '0'),
                'height': parseFloat($(path).attr('data-height') || '0'),
                'fill': '#5555ff',
                'fill-opacity': 0.4,
                'stroke': '#0000ff',
                'data-start-id': textItem.id,
                'data-end-id': textItem.id
            }).addClass('cursor');
            $(column.svg).append(selection);
        } else {
            let currentColumn: ActaParagraphColumnElement | undefined;
            let textItem: ITextItem | null;
            let lineItem: ITextLineItem | null;
            let x, y, height;

            if (this._cursor > this._textItems.length - 1) {
                let lastItemNewline = false;
                if (this._textItems.length > 0) {
                    if (this.lastTextItem && this.lastTextItem.type === TextItemType.NEWLINE) lastItemNewline = true;
                }
                if (lastItemNewline || this._textItems.length < 1) {
                    let indexOfColumn = 0;
                    if (lastItemNewline) {
                        textItem = this._getNearestVisableTextItem(this.lastTextItem);
                        lineItem = textItem ? textItem.lineItem : null;
                        if (!textItem || !lineItem) return;
                        indexOfColumn = lineItem.indexOfColumn;
                    }
                    currentColumn = this.columns[indexOfColumn];
                    const lineItems: ITextLineItem[] = currentColumn.textLineItems;
                    lineItem = lineItems[Math.max(lineItems.length - 1, 0)];
                    if (!lineItem) return;

                    x = lineItem.indent;
                    y = lineItem.offsetY || 0;
                    height = lineItem.maxHeight;
                } else {
                    textItem = this._getNearestVisableTextItem(this.lastTextItem);
                    lineItem = textItem ? textItem.lineItem : null;
                    if (!textItem || !lineItem) return;

                    currentColumn = this.columns[lineItem.indexOfColumn];
                    const path = this._getTextPath(textItem.id);
                    x = (path.length < 1) ? lineItem.indent : (parseFloat(path.attr('data-x') || '0') + parseFloat(path.attr('data-width') || '0'));
                    y = (path.length < 1) ? (lineItem.offsetY || 0) : parseFloat(path.attr('data-y') || '0');
                    height = (path.length < 1) ? lineItem.maxHeight : parseFloat(path.attr('data-height') || '0');
                }
            } else {
                textItem = this._getCursorTextItem();
                lineItem = textItem ? textItem.lineItem : null;
                if (!textItem || !lineItem) return;

                currentColumn = this.columns[lineItem.indexOfColumn];
                if (textItem.type !== TextItemType.NEWLINE) {
                    const path = this._getTextPath(textItem.id);
                    x = (path.length < 1) ? lineItem.indent : (path.attr('data-x') || '0');
                    y = (path.length < 1) ? (lineItem.offsetY || 0) : parseFloat(path.attr('data-y') || '0');
                    height = (path.length < 1) ? lineItem.maxHeight : parseFloat(path.attr('data-height') || '0');
                } else {
                    let path = $<SVGPathElement>('null');
                    textItem = this._getNearestVisableTextItem(textItem);
                    if (textItem) path = this._getTextPath(textItem.id);
                    x = (path.length < 1) ? lineItem.indent : (parseFloat(path.attr('data-x') || '0') + parseFloat(path.attr('data-width') || '0'));
                    y = (path.length < 1) ? (lineItem.offsetY || 0) : parseFloat(path.attr('data-y') || '0');
                    height = (path.length < 1) ? lineItem.maxHeight : parseFloat(path.attr('data-height') || '0');
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

    private _getPositionTextItem(column: ActaParagraphColumnElement, x: number, y: number) {
        let textItem: ITextItem | undefined;
        let id: string | undefined;

        $(column.svg).find('path').each((i: number, path: SVGPathElement) => {
            const itemX1 = parseFloat($(path).attr('data-x') || '');
            const itemX2 = parseFloat($(path).attr('data-x') || '') + parseFloat($(path).attr('data-width') || '0');
            const itemY1 = parseFloat($(path).attr('data-y') || '');
            const itemY2 = parseFloat($(path).attr('data-y') || '') + parseFloat($(path).attr('data-height') || '0') + parseFloat($(path).attr('data-leading') || '0');

            if (isNaN(itemX1) || isNaN(itemX2) || isNaN(itemY1) || isNaN(itemY2)) return;
            if (itemX1 <= x && itemX2 >= x && itemY1 <= y && itemY2 >= y) {
                id = $(path).attr('data-id') || '';
                return false;
            }
        });
        if (!id) {
            const lineItems: ITextLineItem[] = column.textLineItems;
            for (const lineItem of lineItems) {
                if (lineItem.offsetY === undefined) continue;

                const itemY1 = lineItem.offsetY;
                const itemY2 = lineItem.offsetY + lineItem.maxHeight + lineItem.maxLeading;
                if (itemY1 < y && itemY2 > y) {
                    let maxWidth = 0;
                    for (const lineTextItem of lineItem.items) maxWidth += lineTextItem.calcWidth;
                    id = lineItem.items[maxWidth <= x ? lineItem.items.length - 1 : 0].id;
                    break;
                }
            }
        }
        for (const findTextItem of this._textItems) {
            if (findTextItem.id !== id) continue;
            textItem = findTextItem;
        }
        return textItem;
    }

    private _getPositionTextItems(column: ActaParagraphColumnElement, x: number, y: number, width?: number, height?: number) {
        const textItems: ITextItem[] = [];
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
        for (const textItem of this._textItems) {
            if (idList.indexOf(textItem.id) < 0) continue;
            textItems.push(textItem);
        }
        return textItems;
    }

    private _generateTextItems() {
        this._textItems = [];
        this._textNodeList = [];
        if (this._textStore == null) return false;
        return this._convertTextStoreToTextItem(
            this._textStore,
            ActaTextStyleManager.getInstance().get(this._defaultTextStyleName || '') || new ActaTextStyle()
        );
    }

    private _updateTextItems() {
        if (this._textStore == null) {
            this._textItems = [];
            this._textNodeList = [];
            return false;
        }
        return this._convertTextStoreToTextItem(
            this._textStore,
            ActaTextStyleManager.getInstance().get(this._defaultTextStyleName || '') || new ActaTextStyle(),
            true
        );
    }

    private _splitTextItemsByNodeID(id: string, indexOfNode?: number) {
        let preList: ITextItem[] | undefined;
        let postList: ITextItem[] | undefined;
        let s = -1, e = -1;

        if (indexOfNode === undefined) {
            const tmpNodeIDList: string[] = [];
            for (const tmpTextItem of this._textItems) tmpNodeIDList.push(tmpTextItem.textNode.id);

            s = tmpNodeIDList.indexOf(id);
            e = tmpNodeIDList.lastIndexOf(id);
        } else {
            for (let i = 0; i < this._textItems.length; i++) {
                const tmpTextItem =this._textItems[i];
                if (tmpTextItem.textNode.id !== id || tmpTextItem.indexOfNode !== indexOfNode) continue;
                if (s < 0) s = i;
                e = i;
            }
        }
        if (s > -1) {
            preList = this._textItems.slice(undefined, s);
            postList = this._textItems.slice(e + 1);
        }
        return [preList, postList];
    }

    private _convertTextStoreToTextItem(textNode: ActaTextStore, parentTextStyle: ActaTextStyle, modifyOnly: boolean = false): boolean {
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

        let preList: ITextItem[] | undefined;
        let postList: ITextItem[] | undefined;
        if (modifyOnly && textNode.modified && !textNode.partModified) {
            [preList, postList] = this._splitTextItemsByNodeID(textNode.id);
            if (preList === undefined || postList === undefined) return false;
            this._textItems = preList;
        }
        for (let indexOfNode = 0; indexOfNode < textNode.length; indexOfNode++) {
            let childModifyOnly = modifyOnly;
            if (modifyOnly && textNode.modified) {
                if (!textNode.partModified) {
                    childModifyOnly = false;
                } else if (textNode.isModified(indexOfNode)) {
                    [preList, postList] = this._splitTextItemsByNodeID(textNode.id, indexOfNode);
                    if (preList === undefined || postList === undefined) {
                        textNode.modified = true;
                        return this._convertTextStoreToTextItem(textNode, parentTextStyle, true);
                    }
                    this._textItems = preList;
                }
            }
            if (textNode.value[indexOfNode] instanceof ActaTextStore) {
                if (!this._convertTextStoreToTextItem(textNode.value[indexOfNode], textStyle, childModifyOnly)) return false;
                if (indexOfNode >= textNode.length - 1) {
                    // 노드 업데이트를 위해 노드 마지막부분을 마킹
                    this._textItems.push({
                        id: uuidv4(),
                        type: TextItemType.END_OF_NODE,
                        calcWidth: 0,
                        width: 0,
                        lineItem: null,
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
                        this._textItems.push({
                            id: uuidv4(),
                            type: TextItemType.NEWLINE,
                            calcWidth: 0,
                            width: 0,
                            height: ActaParagraph.getCharHeight(textStyle.font.font, textStyle.fontSize),
                            lineItem: null,
                            textNode, textStyle, indexOfNode, indexOfText, char
                        });
                    } else if (char === ' ') {
                        this._textItems.push({
                            id: uuidv4(),
                            type: TextItemType.SPACE,
                            path: document.createElementNS('http://www.w3.org/2000/svg', 'path'),
                            calcWidth: textStyle.fontSize / 3,
                            width: textStyle.fontSize / 3,
                            height: ActaParagraph.getCharHeight(textStyle.font.font, textStyle.fontSize),
                            lineItem: null,
                            textNode, textStyle, indexOfNode, indexOfText, char
                        });
                    } else {
                        const glyphData = ActaParagraph.getCharPath(textStyle.font.font, char, textStyle.fontSize);
                        this._textItems.push({
                            id: uuidv4(),
                            type: TextItemType.PATH,
                            path: glyphData.path,
                            drawOffsetX: glyphData.offsetX,
                            drawOffsetY: glyphData.offsetY,
                            calcWidth: glyphData.width,
                            width: glyphData.width,
                            height: glyphData.height,
                            lineItem: null,
                            textNode, textStyle, indexOfNode, indexOfText, char
                        });
                    }
                }
            }
            if (modifyOnly && textNode.modified && textNode.partModified && textNode.isModified(indexOfNode) && postList !== undefined) {
                this._textItems = this._textItems.concat(postList);
                preList = undefined;
                postList = undefined;
            }
        }
        if (modifyOnly && textNode.modified && !textNode.partModified && postList !== undefined) {
            this._textItems = this._textItems.concat(postList);
        }
        if (this._textNodeList.indexOf(textNode.id) < 0) {
            this._textNodeList.push(textNode.id);
        }
        textNode.modified = false;

        return true;
    }

    private _computeTextItemSize(): void {
        let lineItem: ITextLineItem | null = null;
        let columnIdx = 0;
        let indent = true;

        this._overflow = false;

        for (const column of this.columns) {
            $(column.svg).attr({
                width: ($(column).innerWidth() || 0),
                height: ($(column).innerHeight() || 0)
            });
            column.textLineItems = [];
        }
        for (const textItem of this._textItems) {
            if (textItem.type === TextItemType.END_OF_NODE) continue;
            if (textItem.textNode.modified) {
                // 수정된 노드라면 업데이트
                if (!this._updateTextItems()) this._generateTextItems();
                return this._computeTextItemSize();
            } else if (this._textNodeList.indexOf(textItem.textNode.id) < 0) {
                // 삭제된 노드라면... 노드 제거
                const [preList, postList] = this._splitTextItemsByNodeID(textItem.textNode.id);
                if (preList === undefined || postList === undefined) {
                    this._generateTextItems();
                } else {
                    this._textItems = [];
                    this._textItems.concat(preList).concat(postList);
                }
                return this._computeTextItemSize();
            }
            textItem.calcWidth = textItem.width * (textItem.textStyle.xscale || 1);
            if (textItem.calcWidth > 0) textItem.calcWidth += textItem.textStyle.letterSpacing || 0;
            while (1) {
                if (!lineItem) {
                    const column = this.columns[columnIdx];
                    if (!column) break;
                    lineItem = {
                        indexOfColumn: columnIdx,
                        indexOfLine: column.textLineItems.length,
                        limitWidth: $(column.svg).width() || 0,
                        maxHeight: 0,
                        maxLeading: 0,
                        indent: indent ? textItem.textStyle.indent || 0 : 0,
                        items: [],
                        textAlign: TextAlign.JUSTIFY
                    };
                    indent = false;

                    column.textLineItems.push(lineItem);
                    if (textItem.type === TextItemType.SPACE) textItem.calcWidth = 0;
                } else {
                    let itemcnt = 0;
                    let filledWidth = lineItem.indent;
                    $.each(lineItem.items, (j, item: ITextItem) => {
                        if (item.calcWidth > 0) {
                            filledWidth += item.calcWidth;
                            itemcnt++;
                        }
                    });
                    if (filledWidth + textItem.calcWidth > lineItem.limitWidth) {
                        itemcnt = lineItem.items.length;
                        if (itemcnt > 0) {
                            const firstItem = lineItem.items[0];
                            if (firstItem.type === TextItemType.SPACE) {
                                filledWidth -= firstItem.calcWidth;
                                itemcnt--;
                                firstItem.calcWidth = 0;
                            }
                        }
                        if (itemcnt > 1) {
                            const lastItem = lineItem.items[lineItem.items.length - 1];
                            if (lastItem.type === TextItemType.SPACE) {
                                filledWidth -= lastItem.calcWidth;
                                itemcnt--;
                                lastItem.calcWidth = 0;
                            }
                        }
                        if (lineItem.textAlign === TextAlign.JUSTIFY) {
                            const diffWidth = (lineItem.limitWidth - filledWidth) / itemcnt;
                            $.each(lineItem.items, (j, item) => {
                                if (item.calcWidth > 0) item.calcWidth += diffWidth;
                            });
                        } else if (lineItem.textAlign === TextAlign.RIGHT) {
                            lineItem.indent += lineItem.limitWidth - filledWidth;
                        } else if (lineItem.textAlign === TextAlign.CENTER) {
                            lineItem.indent += (lineItem.limitWidth - filledWidth) / 2;
                        }
                        lineItem = null;
                        continue;
                    }
                }
                break;
            }
            if (lineItem == null) continue;

            lineItem.maxHeight = Math.max(textItem.height || 0, lineItem.maxHeight);
            lineItem.maxLeading = Math.max((textItem.height || 0) * ((textItem.textStyle.lineHeight || 1) - 1), lineItem.maxLeading);
            lineItem.textAlign = Math.max(textItem.textStyle.textAlign || TextAlign.JUSTIFY, lineItem.textAlign);
            lineItem.items.push(textItem);
            textItem.lineItem = lineItem;
            if (textItem.type === TextItemType.NEWLINE) {
                indent = true;
                lineItem = null;
            } else {
                let column = this.columns[columnIdx];
                let filledHeight = 0;
                if (!column) {
                    this._overflow = true;
                    break;
                }

                const lineItems: ITextLineItem[] = column.textLineItems;
                for (let j = 0; j < lineItems.length; j++) {
                    const line = lineItems[j];
                    filledHeight += line.maxHeight;
                    if (j < lineItems.length - 1) filledHeight += line.maxLeading;
                }
                if (filledHeight > ($(column.svg).height() || 0)) {
                    lineItem = lineItems.pop() || null;
                    column.textLineItems = lineItems;

                    column = this.columns[++columnIdx];
                    if (!column) {
                        this._overflow = true;
                        break;
                    }
                    if (lineItem != null) {
                        lineItem.indexOfColumn = columnIdx;
                        lineItem.indexOfLine = 0;
                        column.textLineItems.push(lineItem)
                    }
                }
            }
        }
        let lastItemNewline = false;
        if (this.lastTextItem !== null) {
            if (this.lastTextItem.type === TextItemType.NEWLINE) lastItemNewline = true;
        }
        if (this._textItems.length < 1 || lastItemNewline) {
            let column: ActaParagraphColumnElement | undefined;
            let textStyle: ActaTextStyle | undefined;
            let indexOfColumn = 0;
            if (lastItemNewline && this.lastTextItem !== null) {
                textStyle = this.lastTextItem.textStyle;
                indexOfColumn = this.lastTextItem.lineItem ? this.lastTextItem.lineItem.indexOfColumn : 0;
            }
            textStyle = ActaTextStyleManager.getInstance().get(this._defaultTextStyleName || '');
            if (!textStyle || !textStyle.font || !textStyle.fontSize) return;

            const textHeight = ActaParagraph.getCharHeight(textStyle.font.font, textStyle.fontSize)
            const leading = (textHeight || 0) * ((textStyle.lineHeight || 1) - 1);

            column = this.columns[indexOfColumn];
            column.textLineItems.push({
                indexOfColumn: 0,
                indexOfLine: column.textLineItems.length - 1,
                limitWidth: $(column.svg).width() || 0,
                maxHeight: textHeight,
                maxLeading: leading,
                indent: textStyle.indent || 0,
                items: [],
                textAlign: textStyle.textAlign || TextAlign.JUSTIFY
            })
        }
    }

    private get textItemMap() {
        const map: { [id: string] : ITextItem } = {};
        for (const textItem of this._textItems) {
            map[textItem.id] = textItem;
        }
        return map;
    }

    private _drawText(redraw: boolean = false) {
        if (!redraw) {
            $(this._element.svg).empty();
        } else {
            const map = this.textItemMap;
            $(this._element.svg).find('*').each((i, child) => {
                const id = $(child).attr('data-id') || '';
                const textItem = map[id];
                if (textItem && textItem.path && child.tagName.toLowerCase() === 'path') {
                    const textItemColumn = textItem.lineItem ? textItem.lineItem.indexOfColumn : -1;
                    const pathColumn = $(child).attr('data-column') || '-1';
                    if (textItemColumn.toString() === pathColumn.toString()) return;
                }
                child.remove();
            });
        }
        for (const column of this.columns) {
            const lineItems: ITextLineItem[] = column.textLineItems;
            const paths: SVGPathElement[] = [];
            const lines: SVGLineElement[] = [];
            let offsetY = 0;

            for (const lineItem of lineItems) {
                let offsetX = lineItem.indent;
                let leading = 0;

                lineItem.offsetY = offsetY;
                for (const textItem of lineItem.items) {
                    if (textItem.lineItem === null) textItem.lineItem = lineItem;
                    if ([TextItemType.NEWLINE, TextItemType.END_OF_NODE].indexOf(textItem.type) < 0) {
                        let transform = 'translate(';
                        transform += `${(textItem.drawOffsetX || 0) + ((textItem.textStyle.letterSpacing || 0) / 2) + offsetX}px`;
                        transform += ', ';
                        transform += `${(textItem.drawOffsetY || 0) + offsetY - lineItem.maxHeight + ((lineItem.maxHeight - (textItem.height || 0)) * 2)}px`;
                        transform += ')';
                        transform += ` scaleX(${textItem.textStyle.xscale})`;
                        leading = Math.max(leading, (textItem.textStyle.fontSize || 10) * ((textItem.textStyle.lineHeight || 1) - 1));
                        const attr = {
                            'data-id': textItem.id,
                            'data-column': textItem.lineItem.indexOfColumn,
                            'data-line': textItem.lineItem.indexOfLine,
                            'data-textnode': textItem.textNode.id,
                            'data-index-of-node': textItem.indexOfNode,
                            'data-index-of-text': textItem.indexOfText
                        };
                        const attrText = Object.assign(clone(attr), {
                            'data-x': offsetX,
                            'data-y': offsetY,
                            'data-width': textItem.calcWidth,
                            'data-height': lineItem.maxHeight,
                            'data-leading': lineItem.maxLeading
                        });
                        const attrStyle = Object.assign(clone(attr), {
                            'x1': (textItem.drawOffsetX || 0) + ((textItem.textStyle.letterSpacing || 0) / 2) + offsetX,
                            'x2': (textItem.drawOffsetX || 0) + ((textItem.textStyle.letterSpacing || 0) / 2) + offsetX + textItem.calcWidth,
                            'stroke': textItem.textStyle.color,
                            'stroke-width': 1,
                            'stroke-linecap': 'butt'
                        });
                        if (textItem.path !== undefined) {
                            const oldX = $(textItem.path).attr('data-x');
                            const oldY = $(textItem.path).attr('data-y');
                            if (oldX !== (offsetX).toString() || oldY !== (offsetY).toString()) {
                                $(textItem.path).attr(
                                    Object.assign(attrText, { 'fill': textItem.textStyle.color || '#000000'})
                                ).css('transform', transform);
                                if (!textItem.path.parentElement) paths.push(textItem.path);
                            }
                        } else {
                            const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
                            $(path).attr(attrText).css('transform', transform);
                            paths.push(path);
                        }
                        if (textItem.textStyle !== undefined) {
                            if (textItem.textStyle.strikeline) {
                                const strikeline = document.createElementNS('http://www.w3.org/2000/svg', 'line');
                                $(strikeline).attr(Object.assign(attrStyle, {
                                    'y1': (textItem.drawOffsetY || 0) + offsetY - (lineItem.maxHeight / 3),
                                    'y2': (textItem.drawOffsetY || 0) + offsetY - (lineItem.maxHeight / 3),
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
                offsetY += lineItem.maxHeight;
                offsetY += lineItem.maxLeading;
            }
            $(column.svg).append(paths);
            $(column.svg).append(lines);
        }
        if (this._overflow) {
            this._element.classList.add('overflow');
        } else {
            this._element.classList.remove('overflow');
        }
    }

    private _redraw() {
        this._computeTextItemSize();
        this._drawText(true);
    }

    constructor(defaultTextStyleName: string | null, columnCount: number = 1, innerMargin: string | number = 0, columnWidths: string[] | number[] = []) {
        this._element = document.createElement('x-paragraph') as ActaParagraphElement;
        this._columnCount = 1;
        this._innerMargin = 0;
        this._textStore = null;
        this._defaultTextStyleName = defaultTextStyleName;

        this._editable = true;
        this._selectionStartItem = null;
        this._cursorMode = CursorMode.NONE;
        this._cursor = null;
        this._inputChar = '';
        this._overflow = false;

        this.columnCount = columnCount;
        for (let i = 0; i < columnCount; i++) {
            if (columnWidths[i]) this.columnWidth(i, columnWidths[i]);
        }
        this.innerMargin = innerMargin;

        this._textItems = [];
        this._textNodeList = [];

        $(this._element).on('resize', e => {
            this._redraw();
            return false;
        });
        $(this._element).on('keydown', (e) => e.originalEvent ? this._onKeyPress(e.originalEvent) : {});
        $(this._element).on('mousedown', 'x-paragraph-col', (e) => {
            if (!this._editable) return false;
            const eventElement = this._getPositionTextItem(e.currentTarget, e.offsetX, e.offsetY);
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
            const eventElement = this._getPositionTextItem(e.currentTarget, e.offsetX, e.offsetY);
            if (this._selectionStartItem != null) {
                this._setCursor(eventElement, e.offsetX);
                this._redrawCursor();
            }
            return false;
        });
        $(this._element).on('mouseup', 'x-paragraph-col', (e) => {
            if (!this._editable) return false;
            const eventElement = this._getPositionTextItem(e.currentTarget, e.offsetX, e.offsetY);
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
            this._element.classList.add('focus');
            this._redrawCursor();
            return false;
        });
        $(this._element).on('blur', (e) => {
            this._element.classList.remove('focus');
            $(this._element.svg).find('.cursor').remove();
            this._selectionStartItem = null;
            return false;
        });
    }

    columnWidth(idx: number, val: string | number) {
        if (arguments.length > 1) {
            this.columns[idx].setAttribute('width', (val || 0).toString());
            $(this._element).trigger('resize');
        } else {
            return this.columns[idx].getAttribute('width') || false;
        }
    }

    update() {
        this._generateTextItems();
        this._computeTextItemSize();
        this._drawText();
    }

    set text(text: string) {
        this._textStore = ActaTextConverter.textobject(text);
        this._cursor = null;
        this.update();
    }

    set columnCount(count) {
        this._initElement();

        this._columnCount = count || 1;
        for (let i = 0; i < this._columnCount; i++) {
            const column = document.createElement('x-paragraph-col') as ActaParagraphColumnElement;
            this._element.appendChild(column);
            column.textLineItems = [];

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