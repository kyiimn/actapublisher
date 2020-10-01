import { ActaParagraphElement } from './element/paragraph-el';
import { ActaParagraphColumnElement } from './element/paragraph-col-el';
import { ActaParagraphMarginElement } from './element/paragraph-margin-el';

import { ActaTextStyleManager } from './textstylemgr';
import { ActaTextConverter } from './textconverter';
import { ActaTextNode, ActaTextStore } from './textstore';
import { ActaTextStyle, ActaTextStyleInherit, TextAlign } from './textstyle';

import { ActaClipboard } from '../clipboard';

import { ActaTextRow } from './textrow';
import { ActaTextChar, TextCharType } from './textchar';

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
    private _textChars: ActaTextChar[];
    private _textNodeList: string[];
    private _selectionStartChar: number | null;
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

        const textChar = this._textChars[this._cursor - 1];
        if (!textChar) return;

        let hangulText = Hangul.a(this._inputChar.split(''));
        let textValue = textChar.textNode.value[textChar.indexOfNode];
        textValue = `${textValue.substr(0, textChar.indexOfText)}${hangulText}${textValue.substr(textChar.indexOfText + 1)}`;
        textChar.textNode.replace(textChar.indexOfNode, textValue);

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
            this._cursor = this._textChars.indexOf(selectionTextItems[0]);
            this._removeTextItems(selectionTextItems);
            this._cursorMode = CursorMode.EDIT;
        }
        let textNode: ActaTextStore | null = null;
        let indexOfNode: number = 0;
        let indexOfText: number = 0;
        if (this._cursor > this._textChars.length - 1) {
            if (this.lastTextChar !== null) {
                indexOfNode = this.lastTextChar.indexOfNode;
                indexOfText = this.lastTextChar.indexOfText + 1;
                textNode = this.lastTextChar.textNode;
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
        if (needGenerateTextData) this._resetTextData();

        this._update();
        this._redrawCursor();

        return false;
    }

    private _insertText(text: string) {
        let textNode: ActaTextStore | null = null;
        let indexOfNode: number = 0;
        let indexOfText: number = 0;

        if (this._cursor === null) return false;
        if (this._cursor > this._textChars.length - 1) {
            if (this.lastTextChar !== null) {
                indexOfNode = this.lastTextChar.indexOfNode;
                indexOfText = this.lastTextChar.indexOfText + 1;
                textNode = this.lastTextChar.textNode;
                if (!textNode) return false;
            } else {
                textNode = this._textStore;
                if (!textNode) return false;
                if (textNode.length < 1) textNode.push('');
                this._resetTextData();
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
                if (this._cursorMode !== CursorMode.SELECTION) this._selectionStartChar = this._cursor;
                this._cursorMode = CursorMode.SELECTION;
            } else {
                this._cursorMode = CursorMode.EDIT;
            }
            if ([Keycode.HOME, Keycode.END].indexOf(e.keyCode) > -1) {
                if (this._cursor > this._textChars.length - 1) this._cursor--;
                const lineItem = this._getCursorLineItem();
                if (lineItem && lineItem.items.length > 0) {
                    this._cursor = this._textChars.indexOf((e.keyCode === Keycode.HOME) ? lineItem.items[0] : lineItem.items[lineItem.items.length - 1]);
                    if (this._cursor === this._textChars.length - 1 && this._textChars[this._cursor].type !== TextCharType.NEWLINE) this._cursor++;
                    this._redrawCursor();
                }
                return false;
            } else if ([Keycode.UP, Keycode.DOWN].indexOf(e.keyCode) > -1) {
                const nearLineItem = (e.keyCode === Keycode.UP) ? this._getCursorPrevLineItem() : this._getCursorNextLineItem();
                if (nearLineItem !== null) {
                    const nearestItem = this._getNearestLineTextItem(this._getCursorTextItem(), nearLineItem.items);
                    if (nearestItem) {
                        this._cursor = this._textChars.indexOf(nearestItem);
                        this._redrawCursor();
                        return false;
                    }
                }
                this._cursorMode = CursorMode.EDIT;
                return false;
            } else if ([Keycode.LEFT, Keycode.RIGHT].indexOf(e.keyCode) > -1) {
                this._cursor = (e.keyCode === Keycode.LEFT) ? Math.max(this._cursor - 1, 0) : Math.min(this._cursor + 1, this._textChars.length);
                this._redrawCursor();
                return false;
            }
        } else if ([Keycode.BACKSPACE, Keycode.DELETE].indexOf(e.keyCode) > -1) {
            if (this._cursorMode === CursorMode.SELECTION) {
                const selTextItems = this._getSelectionTextItems();
                if (selTextItems.length > 0) {
                    this._cursor = this._textChars.indexOf(selTextItems[0]);
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
                        this._update();
                        this._redrawCursor();
                        return false;
                    }
                    if (this._cursor === 0) return false;
                    this._cursor--;
                }
                this._removeTextItems([this._textChars[this._cursor]]);
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
            this._cursor = this._textChars.indexOf(selTextItems[0]);
            for (const textItem of selTextItems) selText += textItem.char || '';
            this._removeTextItems(selTextItems);
            this._update();
            this._redrawCursor();
            ActaClipboard.in.write(selText);
            return false;
        } else if ((e.ctrlKey && e.key.toLowerCase() === 'v') || (e.shiftKey && e.keyCode === Keycode.INSERT)) {
            const selTextItems = this._getSelectionTextItems();
            if (selTextItems.length > 0) {
                this._cursor = this._textChars.indexOf(selTextItems[0]);
                this._removeTextItems(selTextItems);
            } else return false;
            this._update();
            this._redrawCursor();

            ActaClipboard.in.read().then(v => {
                if (!v) return;
                if (this._cursor === null || typeof(v) !== 'string') return;
                this._insertText(v);
                this._update();
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

    private _applyDefinedTextStyle(textChars: ActaTextChar[], textStyleName: string | null) {
        if (textChars.length < 1) return;

        if (textChars[0].textNode === textChars[textChars.length - 1].textNode &&
            textChars[0].indexOfNode === 0 && textChars[0].indexOfText === 0 &&
            textChars[textChars.length - 1].indexOfNode === (textChars[textChars.length - 1].textNode.length - 1) &&
            textChars[textChars.length - 1].indexOfText === (textChars[textChars.length - 1].textNode.value[textChars[textChars.length - 1].indexOfNode].length - 1)
        ) {
            // 노드 전체를 선택했을 경우...
            const textNode = textChars[0].textNode;
            const oldValue = textNode.value;
            const newValue = [];
            for (const value of oldValue) newValue.push(value.toString());
            textNode.value = newValue;
            textNode.customTextStyle = new ActaTextStyleInherit();
        } else {
            for (let i = 0; i < textChars.length; i++) {
                const currChar = textChars[i];
                const textNode = currChar.textNode;
                let endItem = currChar, str = '';

                for (let j = textChars.length - 1; j > i; j--) {
                    if (textChars[j].textNode !== textNode) continue;
                    endItem = textChars[j];
                    i = j;
                    break;
                }
                const oldValue = textNode.value;
                const newValue = [];
                for (let j = 0; j < oldValue.length; j++) {
                    if (j < currChar.indexOfNode || j > endItem.indexOfNode) {
                        newValue.push(oldValue[j]);
                    } else if (j === currChar.indexOfNode) {
                        newValue.push(oldValue[j].substr(0, currChar.indexOfText));
                        if (currChar.indexOfNode === endItem.indexOfNode) {
                            newValue.push(oldValue[j].substr(endItem.indexOfText + 1));
                            str = oldValue[j].substr(currChar.indexOfText, endItem.indexOfText - currChar.indexOfText + 1);
                        } else {
                            str += oldValue[j].substr(currChar.indexOfText);
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
                    newValue.splice(currChar.indexOfNode + 1, 0, newNode);
                }
                textNode.value = newValue;
            }
        }
        this._update();
        this._redrawCursor();
    }

    private _applyTextStyle(textChars: ActaTextChar[], textStyle: ActaTextStyleInherit) {
        if (textChars.length < 1) return;
        for (let i = textChars.length; i > 0; i--) {
            const endChar = textChars[i - 1];
            const textNode = endChar.textNode;
            const oldValue = textNode.value;
            const newValue = [];
            let startChar = endChar;

            for (let j = i - 1; j >= 0; j--) {
                if (textChars[j].textNode !== textNode) {
                    i = j - 1;
                    break;
                }
                startChar = textChars[j];
            }
            for (let j = 0; j < startChar.indexOfNode; j++) newValue.push(oldValue[j]);

            const startIndexOfNode = startChar.indexOfNode;
            const endIndexOfNode = endChar.indexOfNode;
            const preValue = oldValue[startIndexOfNode].substr(0, startChar.indexOfText);
            const postValue = oldValue[endIndexOfNode].substr(endChar.indexOfText + 1);
            let str = '';
            if (preValue !== '') newValue.push(preValue);

            const newNode = new ActaTextNode();
            newNode.customTextStyle = textStyle;
            if (startIndexOfNode === endIndexOfNode) {
                str = oldValue[startIndexOfNode].substr(startChar.indexOfText, endChar.indexOfText - startChar.indexOfText + 1);
            } else {
                str = oldValue[startIndexOfNode].substr(startChar.indexOfText);
                for (let j = startIndexOfNode + 1; j <= endIndexOfNode; j++) {
                    str += oldValue[j];
                }
                str += oldValue[endIndexOfNode].substr(0, endChar.indexOfText + 1);
            }
            const splitedStr = str.split('\n');
            for (let j = 0; j < splitedStr.length; j++) {
                newNode.push(splitedStr[j] + ((j !== splitedStr.length - 1) ? '\n' : ''));
            }
            newValue.push(newNode);
            if (postValue !== '') newValue.push(postValue);
            for (let j = endChar.indexOfNode + 1; j < oldValue.length; j++) newValue.push(oldValue[j]);

            textNode.value = newValue;
        }
        this._update();
        this._redrawCursor();
    }

    private _removeTextItems(textChars: ActaTextChar[]) {
        let removedCnt = 0;
        textChars.reverse();
        for (const textChar of textChars) {
            if (!textChar) continue;

            const textNode = textChar.textNode;
            if (textChar.type === TextCharType.END_OF_NODE) continue;
            let textValue = textNode.value[textChar.indexOfNode];
            textValue = `${textValue.substr(0, textChar.indexOfText)}${textValue.substr(textChar.indexOfText + 1)}`;
            textNode.replace(textChar.indexOfNode, textValue);
            removedCnt++;
        }
        if (removedCnt > 0) this._update();
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

    private _getSVGPath(id: string | undefined, column?: SVGElement | number) {
        const svg = (column === undefined) ? this._getColumnSVG() : (typeof(column) === 'number' ? this._getColumnSVG(column) : $(column));
        if (!svg || svg.length < 1) return $<SVGPathElement>('n');
        return svg.find(`path[data-id="${id || ''}"]`) as unknown as JQuery<SVGPathElement>;
    }

    private _getNearestVisableTextItem(textChar: ActaTextChar | null) {
        if (!textChar) return null;

        const path = this._getSVGPath(textChar.id);
        if (path.length < 1) {
            if (!textChar.textRow) return null;
            let tmpIdx = textChar.textRow.items.indexOf(textChar);
            if (tmpIdx < 0) return null;
            else {
                do {
                    if (--tmpIdx < 1) break;
                    const tmpChar = this._getSVGPath(textChar.textRow.items[tmpIdx].id);
                    if (tmpChar.length < 1) continue;
                } while (false);
            }
            textChar = textChar.textRow.items[Math.max(tmpIdx, 0)];
        }
        return textChar || null;
    }

    private _getNearestLineTextItem(currChar: ActaTextChar | null, targetChars: ActaTextChar[]) {
        if (!currChar) return null;

        let curOffsetX = 0;
        if (!currChar.visable) {
            const tmpChar = this._getNearestVisableTextItem(currChar);
            if (tmpChar) curOffsetX = tmpChar.x + tmpChar.width;
        } else {
            curOffsetX = currChar.x;
        }
        const distance: number[] = [];
        let prevOffsetX = 0;

        for (const targetChar of targetChars) {
            if (targetChar.visable) {
                prevOffsetX = Math.max(targetChar.x, prevOffsetX);
            }
            distance.push(Math.abs(prevOffsetX - curOffsetX));
        }
        return targetChars[distance.indexOf(Math.min(...distance))];
    }

    private _getCursorTextItem() {
        if (this._cursor === null) return null;
        return this._textChars[this._cursor];
    }

    private _getCursorLineItem() {
        if (this._cursor === null) return null;
        const textChar = this._textChars[this._cursor];
        return (textChar) ? (textChar.textRow || null) : null;
    }

    private _getCursorPrevLineItem() {
        const currTextRow = this._getCursorLineItem();
        if (!currTextRow) return null;

        const firstTextCharOfLine = currTextRow.items[0];
        const firstTextCharIdx = this._textChars.indexOf(firstTextCharOfLine);
        if (firstTextCharIdx === 0)  return null;

        return this._textChars[firstTextCharIdx - 1].textRow;
    }

    private _getCursorNextLineItem() {
        const currTextRow = this._getCursorLineItem();
        if (!currTextRow) return null;

        const lastTextCharOfLine = currTextRow.items[currTextRow.items.length - 1];
        const lastTextCharIdx = this._textChars.indexOf(lastTextCharOfLine);
        if (lastTextCharIdx === this._textChars.length - 1)  return null;

        return this._textChars[lastTextCharIdx + 1].textRow;
    }

    private _setCursor(textChar: ActaTextChar | undefined, x?: number) {
        let position = 0;
        if (textChar) {
            position = this._textChars.indexOf(textChar);
            if (textChar.textRow === null) return null;
            if (x !== undefined && textChar.visable) {
                const pathX = textChar.x;
                const pathWidth = textChar.calcWidth;
                if (pathWidth > 0) {
                    const offsetX = x - pathX;
                    if (pathWidth / 2 < offsetX) position++;
                }
            }
        } else {
            position = this._textChars.length;
        }
        this._cursor = position;

        return this._cursor;
    };

    private _getSelectionTextItems() {
        const textChars: ActaTextChar[] = [];
        if (this._cursorMode === CursorMode.SELECTION) {
            if (this._selectionStartChar !== null && this._cursor !== null) {
                let startpos = this._selectionStartChar;
                let endpos = this._cursor;

                if (startpos > endpos) [startpos, endpos] = [endpos, startpos];
                endpos--;

                for (let i = startpos; i <= endpos; i++) {
                    textChars.push(this._textChars[Math.min(i, this._textChars.length - 1)]);
                }
            }
        }
        return textChars;
    }

    private get lastTextChar() {
        return this._textChars.length > 0 ? this._textChars[this._textChars.length - 1] : null;
    }

    private _redrawCursor() {
        $(this._element.svg).find('.cursor').remove();
        if (this._cursor === null) return;

        if (this._cursorMode === CursorMode.SELECTION && this._cursor !== this._selectionStartChar) {
            let currentColumn: ActaParagraphColumnElement | undefined;
            let currentLine = -1, startx = 0, selection;

            const selectionTextChars = this._getSelectionTextItems();
            for (const selectTextChar of selectionTextChars) {
                if (!selectTextChar.textRow) continue;

                const path = this._getSVGPath(selectTextChar.id);
                if (path.length < 1) continue;

                const column = this.columns[selectTextChar.indexOfColumn];
                if (!column) continue;

                if (currentColumn !== column || currentLine !== selectTextChar.indexOfLine || selection === undefined) {
                    currentColumn = column;
                    currentLine = selectTextChar.indexOfLine;
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
                        'data-start-id': selectionTextChars[0].id,
                        'data-end-id': selectionTextChars[selectionTextChars.length - 1].id
                    }).addClass('cursor');
                    $(currentColumn.svg).append(selection);
                } else {
                    const endx = parseFloat($(path).attr('data-x') || '0') + parseFloat($(path).attr('data-width') || '0');
                    $(selection).attr('width', endx - startx);
                }
            }
        } else if (ActaParagraph.inputMethod !== InputMethod.EN && this._cursorMode === CursorMode.INPUT && this._inputChar !== '') {
            const textChar = this._getNearestVisableTextItem(this._textChars[this._cursor - 1]);
            if (!textChar || !textChar.textRow) return;

            const column = this.columns[textChar.indexOfColumn];
            if (!column) return;

            const path = this._getSVGPath(textChar.id);
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
                'data-start-id': textChar.id,
                'data-end-id': textChar.id
            }).addClass('cursor');
            $(column.svg).append(selection);
        } else {
            let currColumn: ActaParagraphColumnElement | undefined;
            let textChar: ActaTextChar | null;
            let textRow: ActaTextRow | null;
            let x, y, height;

            if (this._cursor > this._textChars.length - 1) {
                let lastCharIsNewline = false;
                if (this._textChars.length > 0) {
                    if (this.lastTextChar && this.lastTextChar.type === TextCharType.NEWLINE) lastCharIsNewline = true;
                }
                if (lastCharIsNewline || this._textChars.length < 1) {
                    let indexOfColumn = 0;
                    if (lastCharIsNewline) {
                        textChar = this._getNearestVisableTextItem(this.lastTextChar);
                        textRow = textChar ? textChar.textRow : null;
                        if (!textChar || !textRow) return;
                        indexOfColumn = textRow.indexOfColumn;
                    }
                    currColumn = this.columns[indexOfColumn];
                    const textRows: ActaTextRow[] = currColumn.textRows;
                    textRow = textRows[Math.max(textRows.length - 1, 0)];
                    if (!textRow) return;

                    x = textRow.indent;
                    y = textRow.offsetY || 0;
                    height = textRow.maxHeight;
                } else {
                    textChar = this._getNearestVisableTextItem(this.lastTextChar);
                    textRow = textChar ? textChar.textRow : null;
                    if (!textChar || !textRow) return;

                    currColumn = this.columns[textRow.indexOfColumn];
                    x = textChar.visable ? textChar.x + textChar.calcWidth : textRow.indent;
                    y = textChar.visable ? textChar.y : textRow.offsetY;
                    height = textChar.visable ? textChar.height : textRow.maxHeight;
                }
            } else {
                textChar = this._getCursorTextItem();
                textRow = textChar ? textChar.textRow : null;
                if (!textChar || !textRow) return;

                currColumn = this.columns[textRow.indexOfColumn];
                if (textChar.type !== TextCharType.NEWLINE) {
                    x = textChar.visable ? textChar.x :textRow.indent;
                    y = textChar.visable ? textChar.y : textRow.offsetY;
                    height = textChar.visable ? textChar.height : textRow.maxHeight;
                } else {
                    textChar = this._getNearestVisableTextItem(textChar);
                    x = (textChar && textChar.visable) ? textChar.x + textChar.calcWidth : textRow.indent;
                    y = (textChar && textChar.visable) ? textChar.y : textRow.offsetY;
                    height = (textChar && textChar.visable) ? textChar.height : textRow.maxHeight;
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
            $(currColumn.svg).append(cursor);
        }
    }

    private _getPositionTextItem(column: ActaParagraphColumnElement, x: number, y: number) {
        let textItem: ActaTextChar | undefined;
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
            const textRows: ActaTextRow[] = column.textRows;
            for (const textRow of textRows) {
                if (textRow.offsetY === undefined) continue;

                const itemY1 = textRow.offsetY;
                const itemY2 = textRow.offsetY + textRow.maxHeight + textRow.maxLeading;
                if (itemY1 < y && itemY2 > y) {
                    let maxWidth = 0;
                    for (const textChars of textRow.items) maxWidth += textChars.calcWidth;
                    id = textRow.items[maxWidth <= x ? textRow.items.length - 1 : 0].id;
                    break;
                }
            }
        }
        for (const findTextChar of this._textChars) {
            if (findTextChar.id !== id) continue;
            textItem = findTextChar;
        }
        return textItem;
    }

    private _getPositionTextItems(column: ActaParagraphColumnElement, x: number, y: number, width?: number, height?: number) {
        const textChars: ActaTextChar[] = [];
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
        for (const textChar of this._textChars) {
            if (idList.indexOf(textChar.id) < 0) continue;
            textChars.push(textChar);
        }
        return textChars;
    }

    private _resetTextData() {
        this._textChars = [];
        this._textNodeList = [];
        if (this._textStore == null) return false;
        return this._convertTextStoreToTextItem(
            this._textStore,
            ActaTextStyleManager.getInstance().get(this._defaultTextStyleName || '') || new ActaTextStyle()
        );
    }

    private _updateTextData() {
        if (this._textStore == null) {
            this._textChars = [];
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
        let preList: ActaTextChar[] | undefined;
        let postList: ActaTextChar[] | undefined;
        let s = -1, e = -1;

        if (indexOfNode === undefined) {
            const tmpNodeIDList: string[] = [];
            for (const tmpTextChar of this._textChars) tmpNodeIDList.push(tmpTextChar.textNode.id);

            s = tmpNodeIDList.indexOf(id);
            e = tmpNodeIDList.lastIndexOf(id);
        } else {
            for (let i = 0; i < this._textChars.length; i++) {
                const tmpTextItem =this._textChars[i];
                if (tmpTextItem.textNode.id !== id || tmpTextItem.indexOfNode !== indexOfNode) continue;
                if (s < 0) s = i;
                e = i;
            }
        }
        if (s > -1) {
            preList = this._textChars.slice(undefined, s);
            postList = this._textChars.slice(e + 1);
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

        let preList: ActaTextChar[] | undefined;
        let postList: ActaTextChar[] | undefined;
        if (modifyOnly && textNode.modified && !textNode.partModified) {
            [preList, postList] = this._splitTextItemsByNodeID(textNode.id);
            if (preList === undefined || postList === undefined) return false;
            this._textChars = preList;
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
                    this._textChars = preList;
                }
            }
            if (textNode.value[indexOfNode] instanceof ActaTextStore) {
                if (!this._convertTextStoreToTextItem(textNode.value[indexOfNode], textStyle, childModifyOnly)) return false;
                if (indexOfNode >= textNode.length - 1) {
                    // 노드 업데이트를 위해 노드 마지막부분을 마킹
                    this._textChars.push(new ActaTextChar('', textStyle, textNode, indexOfNode));
                }
            } else {
                if (modifyOnly && !textNode.isModified(indexOfNode)) continue;

                const textvalue = textNode.value[indexOfNode].toString();
                for (let indexOfText = 0; indexOfText < textvalue.length; indexOfText++) {
                    const char = textvalue[indexOfText];
                    this._textChars.push(new ActaTextChar(char, textStyle, textNode, indexOfNode, indexOfText));
                }
            }
            if (modifyOnly && textNode.modified && textNode.partModified && textNode.isModified(indexOfNode) && postList !== undefined) {
                this._textChars = this._textChars.concat(postList);
                preList = undefined;
                postList = undefined;
            }
        }
        if (modifyOnly && textNode.modified && !textNode.partModified && postList !== undefined) {
            this._textChars = this._textChars.concat(postList);
        }
        if (this._textNodeList.indexOf(textNode.id) < 0) {
            this._textNodeList.push(textNode.id);
        }
        textNode.modified = false;

        return true;
    }

    private _positioningTextItems(): void {
        let textRow: ActaTextRow | null = null;
        let columnIdx = 0;
        let indent = true;

        this._overflow = false;

        for (const column of this.columns) {
            $(column.svg).attr({
                width: ($(column).innerWidth() || 0),
                height: ($(column).innerHeight() || 0)
            });
            column.textRows = [];
        }
        for (const textChar of this._textChars) {
            if (textChar.type === TextCharType.END_OF_NODE) continue;
            if (textChar.textNode.modified) {
                // 수정된 노드라면 업데이트
                if (!this._updateTextData()) this._resetTextData();
                return this._positioningTextItems();
            } else if (this._textNodeList.indexOf(textChar.textNode.id) < 0) {
                // 삭제된 노드라면... 노드 제거
                const [preList, postList] = this._splitTextItemsByNodeID(textChar.textNode.id);
                if (preList === undefined || postList === undefined) {
                    this._resetTextData();
                } else {
                    this._textChars = [];
                    this._textChars.concat(preList).concat(postList);
                }
                return this._positioningTextItems();
            }
            textChar.calcWidth = textChar.width * (textChar.textStyle.xscale || 1);
            if (textChar.calcWidth > 0) textChar.calcWidth += textChar.textStyle.letterSpacing || 0;
            while (1) {
                if (!textRow) {
                    const column = this.columns[columnIdx];
                    if (!column) break;

                    textRow = new ActaTextRow(column, indent ? textChar.textStyle.indent || 0 : 0);
                    indent = false;

                    if (textChar.type === TextCharType.SPACE) textChar.calcWidth = 0;
                } else {
                    let itemcnt = 0;
                    let filledWidth = textRow.indent;
                    $.each(textRow.items, (j, item: ActaTextChar) => {
                        if (item.calcWidth > 0) {
                            filledWidth += item.calcWidth;
                            itemcnt++;
                        }
                    });
                    if (filledWidth + textChar.calcWidth > textRow.limitWidth) {
                        itemcnt = textRow.items.length;
                        if (itemcnt > 0) {
                            const firstItem = textRow.items[0];
                            if (firstItem.type === TextCharType.SPACE) {
                                filledWidth -= firstItem.calcWidth;
                                itemcnt--;
                                firstItem.calcWidth = 0;
                            }
                        }
                        if (itemcnt > 1) {
                            const lastItem = textRow.items[textRow.items.length - 1];
                            if (lastItem.type === TextCharType.SPACE) {
                                filledWidth -= lastItem.calcWidth;
                                itemcnt--;
                                lastItem.calcWidth = 0;
                            }
                        }
                        if (textRow.textAlign === TextAlign.JUSTIFY) {
                            const diffWidth = (textRow.limitWidth - filledWidth) / itemcnt;
                            $.each(textRow.items, (j, item) => {
                                if (item.calcWidth > 0) item.calcWidth += diffWidth;
                            });
                        } else if (textRow.textAlign === TextAlign.RIGHT) {
                            textRow.indent += textRow.limitWidth - filledWidth;
                        } else if (textRow.textAlign === TextAlign.CENTER) {
                            textRow.indent += (textRow.limitWidth - filledWidth) / 2;
                        }
                        textRow = null;
                        continue;
                    }
                }
                break;
            }
            if (textRow == null) continue;

            textRow.maxHeight = Math.max(textChar.height || 0, textRow.maxHeight);
            textRow.maxLeading = Math.max((textChar.height || 0) * ((textChar.textStyle.lineHeight || 1) - 1), textRow.maxLeading);
            textRow.textAlign = Math.max(textChar.textStyle.textAlign || TextAlign.JUSTIFY, textRow.textAlign);
            textRow.items.push(textChar);

            textChar.textRow = textRow;
            if (textChar.type === TextCharType.NEWLINE) {
                indent = true;
                textRow = null;
            } else {
                let column = this.columns[columnIdx];
                let filledHeight = 0;
                if (!column) {
                    this._overflow = true;
                    break;
                }

                const textRows: ActaTextRow[] = column.textRows;
                for (let j = 0; j < textRows.length; j++) {
                    const row = textRows[j];
                    filledHeight += row.maxHeight;
                    if (j < textRows.length - 1) filledHeight += row.maxLeading;
                }
                if (filledHeight > ($(column.svg).height() || 0)) {
                    textRow = textRows.pop() || null;
                    column.textRows = textRows;

                    column = this.columns[++columnIdx];
                    if (!column) {
                        this._overflow = true;
                        break;
                    }
                    if (textRow != null) textRow.column = column;
                }
            }
        }
        let lastCharIsNewline = false;
        if (this.lastTextChar !== null) {
            if (this.lastTextChar.type === TextCharType.NEWLINE) lastCharIsNewline = true;
        }
        if (this._textChars.length < 1 || lastCharIsNewline) {
            let column: ActaParagraphColumnElement | undefined;
            let textStyle: ActaTextStyle | undefined;
            let indexOfColumn = 0;
            if (lastCharIsNewline && this.lastTextChar !== null) {
                textStyle = this.lastTextChar.textStyle;
                indexOfColumn = this.lastTextChar.textRow ? this.lastTextChar.indexOfColumn : 0;
            }
            textStyle = ActaTextStyleManager.getInstance().get(this._defaultTextStyleName || '');
            if (!textStyle || !textStyle.font || !textStyle.fontSize) return;

            const textHeight = ActaParagraph.getCharHeight(textStyle.font.font, textStyle.fontSize)
            const leading = (textHeight || 0) * ((textStyle.lineHeight || 1) - 1);

            column = this.columns[indexOfColumn];
            const newTextRow = new ActaTextRow(column, textStyle.indent || 0);
            newTextRow.maxHeight = textHeight;
            newTextRow.maxLeading = leading;
            newTextRow.textAlign = textStyle.textAlign || TextAlign.JUSTIFY;
        }
    }

    private get textItemMap() {
        const map: { [id: string] : ActaTextChar } = {};
        for (const textChar of this._textChars) {
            map[textChar.id] = textChar;
        }
        return map;
    }

    private _drawTextItems(redraw: boolean = false) {
        if (!redraw) {
            $(this._element.svg).empty();
        } else {
            const map = this.textItemMap;
            $(this._element.svg).find('*').each((i, child) => {
                const id = $(child).attr('data-id') || '';
                const textItem = map[id];
                if (textItem && child.tagName.toLowerCase() === 'path') {
                    const textItemColumn = textItem.indexOfColumn;
                    const pathColumn = $(child).attr('data-column') || '-1';
                    if (textItemColumn.toString() === pathColumn.toString()) return;
                }
                child.remove();
            });
        }
        for (const column of this.columns) {
            const textRows: ActaTextRow[] = column.textRows;
            const paths: SVGPathElement[] = [];
            const lines: SVGLineElement[] = [];
            let offsetY = 0;

            for (const textRow of textRows) {
                let offsetX = textRow.indent;
                textRow.offsetY = offsetY;
                for (const textChar of textRow.items) {
                    if (textChar.textRow === null) textChar.textRow = textRow;
                    if ([TextCharType.NEWLINE, TextCharType.END_OF_NODE].indexOf(textChar.type) < 0) {
                        let transform = 'translate(';
                        transform += `${(textChar.drawOffsetX || 0) + ((textChar.textStyle.letterSpacing || 0) / 2) + offsetX}px`;
                        transform += ', ';
                        transform += `${(textChar.drawOffsetY || 0) + offsetY - textRow.maxHeight + ((textRow.maxHeight - (textChar.height || 0)) * 2)}px`;
                        transform += ')';
                        transform += ` scaleX(${textChar.textStyle.xscale})`;
                        const attrStyle = {
                            'data-id': textChar.id,
                            'data-column': textChar.indexOfColumn,
                            'data-line': textChar.indexOfLine,
                            'data-textnode': textChar.textNode.id,
                            'data-index-of-node': textChar.indexOfNode,
                            'data-index-of-text': textChar.indexOfText,
                            'x1': (textChar.drawOffsetX || 0) + ((textChar.textStyle.letterSpacing || 0) / 2) + offsetX,
                            'x2': (textChar.drawOffsetX || 0) + ((textChar.textStyle.letterSpacing || 0) / 2) + offsetX + textChar.calcWidth,
                            'stroke': textChar.textStyle.color,
                            'stroke-width': 1,
                            'stroke-linecap': 'butt'
                        };
                        textChar.update(offsetX, offsetY);

                        if (textChar.textStyle !== undefined) {
                            if (textChar.textStyle.strikeline) {
                                const strikeline = document.createElementNS('http://www.w3.org/2000/svg', 'line');
                                $(strikeline).attr(Object.assign(attrStyle, {
                                    'y1': (textChar.drawOffsetY || 0) + offsetY - (textRow.maxHeight / 3),
                                    'y2': (textChar.drawOffsetY || 0) + offsetY - (textRow.maxHeight / 3),
                                }));
                                lines.push(strikeline);
                            }
                            if (textChar.textStyle.underline) {
                                const underline = document.createElementNS('http://www.w3.org/2000/svg', 'line');
                                $(underline).attr(Object.assign(attrStyle, {
                                    'y1': (textChar.drawOffsetY || 0) + offsetY,
                                    'y2': (textChar.drawOffsetY || 0) + offsetY,
                                }));
                                lines.push(underline);
                            }
                        }
                    }
                    offsetX += textChar.calcWidth;
                }
                offsetY += textRow.maxHeight;
                offsetY += textRow.maxLeading;
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

    private _update() {
        this._positioningTextItems();
        this._drawTextItems(true);
    }

    constructor(defaultTextStyleName: string | null, columnCount: number = 1, innerMargin: string | number = 0, columnWidths: string[] | number[] = []) {
        this._element = document.createElement('x-paragraph') as ActaParagraphElement;
        this._columnCount = 1;
        this._innerMargin = 0;
        this._textStore = null;
        this._defaultTextStyleName = defaultTextStyleName;

        this._editable = true;
        this._selectionStartChar = null;
        this._cursorMode = CursorMode.NONE;
        this._cursor = null;
        this._inputChar = '';
        this._overflow = false;

        this.columnCount = columnCount;
        for (let i = 0; i < columnCount; i++) {
            if (columnWidths[i]) this.columnWidth(i, columnWidths[i]);
        }
        this.innerMargin = innerMargin;

        this._textChars = [];
        this._textNodeList = [];

        $(this._element).on('resize', e => {
            this._update();
            return false;
        });
        $(this._element).on('keydown', (e) => e.originalEvent ? this._onKeyPress(e.originalEvent) : {});
        $(this._element).on('mousedown', 'x-paragraph-col', (e) => {
            if (!this._editable) return false;
            const eventElement = this._getPositionTextItem(e.currentTarget, e.offsetX, e.offsetY);
            this._cursorMode = CursorMode.SELECTION;
            this._cursor = null;
            this._selectionStartChar = this._setCursor(eventElement, e.offsetX);
            this._redrawCursor();

            this._element.focus();

            return false;
        });
        $(this._element).on('mousemove', 'x-paragraph-col', (e) => {
            const ev = e.originalEvent as MouseEvent;
            if (!this._editable) return false;
            if (this._cursorMode !== CursorMode.SELECTION || ev.buttons !== 1) return false;
            const eventElement = this._getPositionTextItem(e.currentTarget, e.offsetX, e.offsetY);
            if (this._selectionStartChar != null) {
                this._setCursor(eventElement, e.offsetX);
                this._redrawCursor();
            }
            return false;
        });
        $(this._element).on('mouseup', 'x-paragraph-col', (e) => {
            if (!this._editable) return false;
            const eventElement = this._getPositionTextItem(e.currentTarget, e.offsetX, e.offsetY);
            if (this._selectionStartChar != null) {
                this._setCursor(eventElement, e.offsetX);
                this._redrawCursor();
            }
            if (this._cursor === null) {
                this._cursorMode = CursorMode.NONE;
                return false;
            } else if (this._cursor === this._selectionStartChar || !this._selectionStartChar) {
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
            this._selectionStartChar = null;
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

    reset() {
        this._resetTextData();
        this._positioningTextItems();
        this._drawTextItems();
    }

    set text(text: string) {
        this._textStore = ActaTextConverter.textobject(text);
        this._cursor = null;
        this.reset();
    }

    set columnCount(count) {
        this._initElement();

        this._columnCount = count || 1;
        for (let i = 0; i < this._columnCount; i++) {
            const column = document.createElement('x-paragraph-col') as ActaParagraphColumnElement;
            this._element.appendChild(column);
            column.textRows = [];

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