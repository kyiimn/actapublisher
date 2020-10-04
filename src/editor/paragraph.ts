import { ActaParagraphElement } from './element/paragraph-el';
import { ActaParagraphColumnElement } from './element/paragraph-col-el';
import { ActaParagraphMarginElement } from './element/paragraph-margin-el';

import { ActaTextStyleManager } from './textstylemgr';
import { ActaTextConverter } from './textconverter';
import { ActaTextNode, ActaTextStore } from './textnode';
import { ActaTextStyle, ActaTextStyleInherit, TextAlign } from './textstyle';

import { ActaClipboard } from '../clipboard';

import { ActaTextRow } from './textrow';
import { ActaTextChar, TextCharType } from './textchar';

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
    BACKSPACE = 8, TAB = 9, ENTER = 13, SHIFT = 16, CONTROL = 17, ALT = 18, HANGUL = 21, HANJA = 25, SPACE = 32, END = 35, HOME = 36, LEFT = 37, UP = 38, RIGHT = 39, DOWN = 40, INSERT = 45, DELETE = 46
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

    private _initElement() {
        this._element.innerHTML = '';
    }

    private get textChars() {
        return this._textStore ? this._textStore.toArray() : [];
    }

    private _updateInputMethodChar() {
        if (!this._cursor) return;

        const textChar = this.textChars[this._cursor - 1];
        if (!textChar) return;

        let hangulText = Hangul.a(this._inputChar.split(''));
        textChar.textNode.replace(textChar.indexOfNode, hangulText);

        if (hangulText.length > 1) {
            this._cursor += hangulText.length - 1;
            hangulText = hangulText.substr(hangulText.length - 1);
        }
        this._inputChar = Hangul.d(hangulText).join('');
    }

    private _onCharKeyPress(e: KeyboardEvent) {
        const char = ActaParagraph.getChar(e);

        if ([CursorMode.EDIT, CursorMode.SELECTION, CursorMode.INPUT].indexOf(this._cursorMode) < 0) return;
        if (this._cursor === null) { this._cursorMode = CursorMode.NONE; return; }
        if (char === undefined) { this._cursorMode = CursorMode.EDIT; return; }

        if (this._cursorMode === CursorMode.SELECTION) {
            const selectionTextChars = this._getSelectionTextChars();
            this._cursor = this.textChars.indexOf(selectionTextChars[0]);
            this._removeTextChars(selectionTextChars);
            this._cursorMode = CursorMode.EDIT;
        }
        let textNode: ActaTextStore | null = null;
        let insertPos: number = 0;
        if (this._cursor > this.textChars.length - 1) {
            if (this.lastTextChar !== null) {
                textNode = this.lastTextChar.textNode;
            } else {
                textNode = this._textStore;
            }
            if (!textNode) return;
            insertPos = textNode.length;
        } else {
            const textChar = this._getCursorTextChar();
            if (!textChar) { this._cursorMode = CursorMode.EDIT; return; }
            insertPos = textChar.indexOfNode;
            textNode = textChar.textNode;
        }
        if (ActaParagraph.inputMethod === InputMethod.KO && ActaParagraph.isCharType(e) === CharType.TEXT) {
            if (this._cursorMode === CursorMode.INPUT) {
                this._cursorMode = CursorMode.EDIT;
                this._inputChar += char;
                this._updateInputMethodChar();
            } else {
                this._inputChar = char;
                this._cursor++;
                textNode.insert(insertPos, this._inputChar);
            }
            if (this._inputChar !== '') this._cursorMode = CursorMode.INPUT;
        } else {
            textNode.insert(insertPos, char);
            this._inputChar = '';
            this._cursorMode = CursorMode.EDIT;
            this._cursor++;
        }
        this._update();
        this._redrawCursor();

        return false;
    }

    private _insertText(text: string) {
        let textNode: ActaTextNode | null = null;
        let indexOfNode: number = 0;

        if (this._cursor === null) return false;
        if (this._cursor > this.textChars.length - 1) {
            if (this.lastTextChar !== null) {
                textNode = this.lastTextChar.textNode;
                if (!textNode) return false;
                indexOfNode = this.lastTextChar.indexOfNode + 1;
            } else {
                textNode = this._textStore;
                if (!textNode) return false;
                indexOfNode = textNode.length;
            }
        } else {
            const textChar = this._getCursorTextChar();
            if (!textChar) return false;
            textNode = textChar.textNode;
            if (!textNode) return false;
            indexOfNode = textChar.indexOfNode;
        }
        textNode.insert(indexOfNode, text);
        this._cursor += text.length;

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
                if (this._cursor > this.textChars.length - 1) this._cursor--;
                const textRow = this._getCursorTextRow();
                if (textRow && textRow.items.length > 0) {
                    this._cursor = this.textChars.indexOf((e.keyCode === Keycode.HOME) ? textRow.items[0] : textRow.items[textRow.items.length - 1]);
                    if (this._cursor === this.textChars.length - 1 && this.textChars[this._cursor].type !== TextCharType.NEWLINE) this._cursor++;
                    this._redrawCursor();
                }
                return false;
            } else if ([Keycode.UP, Keycode.DOWN].indexOf(e.keyCode) > -1) {
                const nearTextRow = (e.keyCode === Keycode.UP) ? this._getCursorPrevTextRow() : this._getCursorNextTextRow();
                if (nearTextRow !== null) {
                    const nearestItem = this._getNearestLineTextChar(this._getCursorTextChar(), nearTextRow.items);
                    if (nearestItem) {
                        this._cursor = this.textChars.indexOf(nearestItem);
                        this._redrawCursor();
                        return false;
                    }
                }
                this._cursorMode = CursorMode.EDIT;
                return false;
            } else if ([Keycode.LEFT, Keycode.RIGHT].indexOf(e.keyCode) > -1) {
                this._cursor = (e.keyCode === Keycode.LEFT) ? Math.max(this._cursor - 1, 0) : Math.min(this._cursor + 1, this.textChars.length);
                this._redrawCursor();
                return false;
            }
        } else if ([Keycode.BACKSPACE, Keycode.DELETE].indexOf(e.keyCode) > -1) {
            if (this._cursorMode === CursorMode.SELECTION) {
                const selTextChars = this._getSelectionTextChars();
                if (selTextChars.length > 0) {
                    this._cursor = this.textChars.indexOf(selTextChars[0]);
                    this._removeTextChars(selTextChars);
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
                this._removeTextChars([this.textChars[this._cursor]]);
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
            const selTextChars = this._getSelectionTextChars();
            let selText = '';
            if (selTextChars.length < 1) return false;
            for (const textChar of selTextChars) selText += textChar.char || '';
            ActaClipboard.in.write(selText);
            return false;
        } else if (e.ctrlKey && e.key.toLowerCase() === 'x') {
            const selTextChars = this._getSelectionTextChars();
            let selText = '';
            if (selTextChars.length < 1) return false;
            this._cursor = this.textChars.indexOf(selTextChars[0]);
            for (const textChar of selTextChars) selText += textChar.char || '';
            this._removeTextChars(selTextChars);
            this._update();
            this._redrawCursor();
            ActaClipboard.in.write(selText);
            return false;
        } else if ((e.ctrlKey && e.key.toLowerCase() === 'v') || (e.shiftKey && e.keyCode === Keycode.INSERT)) {
            const selTextChars = this._getSelectionTextChars();
            if (selTextChars.length > 0) {
                this._cursor = this.textChars.indexOf(selTextChars[0]);
                this._removeTextChars(selTextChars);
            };
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
            const selTextChars = this._getSelectionTextChars();
            if (selTextChars.length > 0) {
                const aa = new ActaTextStyleInherit();
                aa.fontSize = 15;
                this._applyTextStyle(selTextChars, aa);//'본문2');
            }
            return false;
        } else if (e.altKey && e.key === 'c') {
            const selTextChars = this._getSelectionTextChars();
            if (selTextChars.length > 0) {
                const aa = new ActaTextStyleInherit();
                this._applyDefinedTextStyle(selTextChars, '본문2');
            }
            return false;
        }
        return (!e.ctrlKey && !e.altKey) ? this._onCharKeyPress(e) : undefined;
    }

    private _getTextCharBlocks(textChars: ActaTextChar[]) {
        const returnTextBlocks: ActaTextNode[] = [];
        for (let i = textChars.length; i > 0; i--) {
            const endChar = textChars[i - 1];
            const textNode = endChar.textNode;
            let startChar = endChar;
            let str = '';

            for (let j = i; j > 0; j--) {
                if (textChars[j - 1].textNode !== textNode) {
                    i = j + 1;
                    break;
                }
                startChar = textChars[j - 1];
            }
            const orgTextChars = [];
            for (let j = textChars.indexOf(startChar); j < textChars.indexOf(endChar) + 1; j++) {
                orgTextChars.push(textChars[j]);
                str += textChars[j].toString();
            }
            if (startChar.indexOfNode === 0 && endChar.indexOfNode === textNode.length - 1) {
                returnTextBlocks.push(textNode);
            } else {
                const newNode = new ActaTextNode();
                textNode.replace(orgTextChars, newNode);
                newNode.push(str);
                returnTextBlocks.push(newNode);
            }
            if (textChars.indexOf(startChar) === 0) break;
        }
        return returnTextBlocks.reverse();
    }

    private _applyDefinedTextStyle(textChars: ActaTextChar[], textStyleName: string) {
        if (!ActaTextStyleManager.getInstance().get(textStyleName)) return;
        const textNodes = this._getTextCharBlocks(textChars);
        for (const textNode of textNodes) {
            textNode.defaultTextStyleName = textStyleName;
            textNode.customTextStyle = new ActaTextStyleInherit();
        }
        this._update();
        this._redrawCursor();
    }

    private _applyTextStyle(textChars: ActaTextChar[], textStyle: ActaTextStyleInherit) {
        const textNodes = this._getTextCharBlocks(textChars);
        for (const textNode of textNodes) {
            textNode.customTextStyle.merge(textStyle);
        }
        this._update();
        this._redrawCursor();
    }

    private _removeTextChars(textChars: ActaTextChar[]) {
        for (const textChar of textChars) textChar.remove();
        this._update();
    }

    private get columns() {
        const nodeList = this._element.querySelectorAll<ActaParagraphColumnElement>('x-paragraph-col');
        const ret = [];
        for (let i = 0; i < nodeList.length; i++) {
            ret.push(nodeList.item(i));
        }
        return ret
    }

    private _getNearestVisableTextChar(textChar: ActaTextChar | null) {
        if (!textChar) return null;
        if (!textChar.visable) {
            if (!textChar.textRow) return null;
            let tmpIdx = textChar.textRow.items.indexOf(textChar);
            if (tmpIdx < 0) return null;
            else {
                do {
                    if (--tmpIdx < 1) break;
                    if (!textChar.textRow.items[tmpIdx].visable) continue;
                } while (false);
            }
            textChar = textChar.textRow.items[Math.max(tmpIdx, 0)];
        }
        return textChar;
    }

    private _getNearestLineTextChar(currChar: ActaTextChar | null, targetChars: ActaTextChar[]) {
        if (!currChar) return null;

        let curOffsetX = 0;
        if (!currChar.visable) {
            const tmpChar = this._getNearestVisableTextChar(currChar);
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

    private _getCursorTextChar() {
        if (this._cursor === null) return null;
        return this.textChars[this._cursor];
    }

    private _getCursorTextRow() {
        if (this._cursor === null) return null;
        const textChar = this.textChars[this._cursor];
        return (textChar) ? (textChar.textRow || null) : null;
    }

    private _getCursorPrevTextRow() {
        const currTextRow = this._getCursorTextRow();
        if (!currTextRow) return null;

        const firstTextCharOfLine = currTextRow.items[0];
        const firstTextCharIdx = this.textChars.indexOf(firstTextCharOfLine);
        if (firstTextCharIdx === 0)  return null;

        return this.textChars[firstTextCharIdx - 1].textRow;
    }

    private _getCursorNextTextRow() {
        const currTextRow = this._getCursorTextRow();
        if (!currTextRow) return null;

        const lastTextCharOfLine = currTextRow.items[currTextRow.items.length - 1];
        const lastTextCharIdx = this.textChars.indexOf(lastTextCharOfLine);
        if (lastTextCharIdx === this.textChars.length - 1)  return null;

        return this.textChars[lastTextCharIdx + 1].textRow;
    }

    private _setCursor(textChar: ActaTextChar | undefined, x?: number) {
        let position = 0;
        if (textChar) {
            position = this.textChars.indexOf(textChar);
            if (textChar.textRow === null) return null;
            if (x !== undefined && textChar.visable) {
                if (textChar.calcWidth > 0) {
                    const offsetX = x - textChar.x;
                    if (textChar.calcWidth / 2 < offsetX) position++;
                }
            }
        } else {
            position = this.textChars.length;
        }
        this._cursor = position;

        return this._cursor;
    };

    private _getSelectionTextChars() {
        const textChars: ActaTextChar[] = [];
        if (this._cursorMode === CursorMode.SELECTION) {
            if (this._selectionStartChar !== null && this._cursor !== null) {
                let startpos = this._selectionStartChar;
                let endpos = this._cursor;

                if (startpos > endpos) [startpos, endpos] = [endpos, startpos];
                endpos--;

                for (let i = startpos; i <= endpos; i++) {
                    textChars.push(this.textChars[Math.min(i, this.textChars.length - 1)]);
                }
            }
        }
        return textChars;
    }

    private get lastTextChar() {
        return this.textChars.length > 0 ? this.textChars[this.textChars.length - 1] : null;
    }

    private _redrawCursor() {
        $(this._element.svg).find('.cursor').remove();
        if (this._cursor === null) return;

        if (this._cursorMode === CursorMode.SELECTION && this._cursor !== this._selectionStartChar) {
            let currColumn: ActaParagraphColumnElement | undefined;
            let currLine = -1, startx = 0;
            let selBlock;

            const selTextChars = this._getSelectionTextChars();
            for (const textChar of selTextChars) {
                if (!textChar.textRow) continue;
                if (textChar.x < 0) continue;

                const column = textChar.textRow.column;
                if (!column) continue;

                if (currColumn !== column || currLine !== textChar.indexOfLine || selBlock === undefined) {
                    currColumn = column;
                    currLine = textChar.indexOfLine;
                    startx = textChar.x;
                    selBlock = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
                    selBlock.setAttribute('x', startx.toString());
                    selBlock.setAttribute('y', textChar.y.toString());
                    selBlock.setAttribute('width', textChar.calcWidth.toString());
                    selBlock.setAttribute('height', textChar.textRow.maxHeight.toString());
                    selBlock.setAttribute('data-start-id', selTextChars[0].id);
                    selBlock.setAttribute('data-end-id', selTextChars[selTextChars.length - 1].id);

                    selBlock.style.fill = '#5555ff';
                    selBlock.style.fillOpacity = '0.4';
                    selBlock.style.stroke = '#0000ff';
                    selBlock.classList.add('cursor');

                    currColumn.svg.appendChild(selBlock);
                } else {
                    const endx = textChar.x + textChar.calcWidth;
                    selBlock.setAttribute('width', (endx - startx).toString());
                }
            }
        } else if (ActaParagraph.inputMethod !== InputMethod.EN && this._cursorMode === CursorMode.INPUT && this._inputChar !== '') {
            const textChar = this._getNearestVisableTextChar(this.textChars[this._cursor - 1]);
            if (!textChar || !textChar.textRow) return;

            const column = textChar.textRow.column;
            if (!column) return;

            if (textChar.x < 0) return;

            const selBlock = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
            selBlock.setAttribute('x', textChar.x.toString());
            selBlock.setAttribute('y', textChar.y.toString());
            selBlock.setAttribute('width', textChar.calcWidth.toString());
            selBlock.setAttribute('height', textChar.textRow.maxHeight.toString());
            selBlock.setAttribute('data-start-id', textChar.id);
            selBlock.setAttribute('data-end-id', textChar.id);

            selBlock.style.fill = '#5555ff';
            selBlock.style.fillOpacity = '0.4';
            selBlock.style.stroke = '#0000ff';
            selBlock.classList.add('cursor');

            column.svg.appendChild(selBlock);
        } else {
            let currColumn: ActaParagraphColumnElement | undefined;
            let textChar: ActaTextChar | null;
            let textRow: ActaTextRow | null;
            let x, y, height;

            if (this._cursor > this.textChars.length - 1) {
                let lastCharIsNewline = false;
                if (this.textChars.length > 0) {
                    if (this.lastTextChar && this.lastTextChar.type === TextCharType.NEWLINE) lastCharIsNewline = true;
                }
                if (lastCharIsNewline || this.textChars.length < 1) {
                    currColumn = this.columns[0];
                    if (lastCharIsNewline) {
                        textChar = this._getNearestVisableTextChar(this.lastTextChar);
                        textRow = textChar ? textChar.textRow : null;
                        if (!textChar || !textRow) return;
                        currColumn = textRow.column;
                    }
                    const textRows: ActaTextRow[] = currColumn.textRows;
                    textRow = textRows[Math.max(textRows.length - 1, 0)];
                    if (!textRow) return;

                    x = textRow.indent;
                    y = textRow.offsetY || 0;
                    height = textRow.maxHeight;
                } else {
                    textChar = this._getNearestVisableTextChar(this.lastTextChar);
                    textRow = textChar ? textChar.textRow : null;
                    if (!textChar || !textRow) return;

                    currColumn = this.columns[textRow.indexOfColumn];
                    x = textChar.visable ? textChar.x + textChar.calcWidth : textRow.indent;
                    y = textChar.visable ? textChar.y : textRow.offsetY;
                    height = textChar.visable ? textChar.height : textRow.maxHeight;
                }
            } else {
                textChar = this._getCursorTextChar();
                textRow = textChar ? textChar.textRow : null;
                if (!textChar || !textRow) return;

                currColumn = this.columns[textRow.indexOfColumn];
                if (textChar.type !== TextCharType.NEWLINE) {
                    x = textChar.visable ? textChar.x :textRow.indent;
                    y = textChar.visable ? textChar.y : textRow.offsetY;
                    height = textRow.maxHeight;
                } else {
                    textChar = this._getNearestVisableTextChar(textChar);
                    x = (textChar && textChar.visable) ? textChar.x + textChar.calcWidth : textRow.indent;
                    y = (textChar && textChar.visable) ? textChar.y : textRow.offsetY;
                    height = textRow.maxHeight;
                }
            }
            const cursor = document.createElementNS('http://www.w3.org/2000/svg', 'line');
            cursor.setAttribute('x1', x.toString());
            cursor.setAttribute('x2', x.toString());
            cursor.setAttribute('y1', (y - 1).toString());
            cursor.setAttribute('y2', (y + height + 1).toString());

            cursor.style.stroke = '#0000ff';
            cursor.style.strokeWidth = '1';
            cursor.classList.add('cursor');

            currColumn.svg.appendChild(cursor);
        }
    }

    private _getPositionTextChar(column: ActaParagraphColumnElement, x: number, y: number) {
        let textChar: ActaTextChar | undefined;

        for (const fTextChar of this.textChars) {
            if (!fTextChar.visable || fTextChar.x < 0) continue;
            if (!fTextChar.textRow) continue;
            if (fTextChar.textRow.column !== column) continue;

            const itemX1 = fTextChar.x;
            const itemX2 = fTextChar.x + fTextChar.calcWidth;
            const itemY1 = fTextChar.y;
            const itemY2 = fTextChar.y + fTextChar.height + fTextChar.textRow.maxLeading;
            if (itemX1 <= x && itemX2 >= x && itemY1 <= y && itemY2 >= y) {
                textChar = fTextChar;
                break;
            }
        }

        if (!textChar) {
            const textRows: ActaTextRow[] = column.textRows;
            for (const textRow of textRows) {
                if (textRow.offsetY === undefined) continue;

                const itemY1 = textRow.offsetY;
                const itemY2 = textRow.offsetY + textRow.maxHeight + textRow.maxLeading;
                if (itemY1 < y && itemY2 > y) {
                    let maxWidth = 0;
                    for (const textChars of textRow.items) maxWidth += textChars.calcWidth;
                    textChar = textRow.items[maxWidth <= x ? textRow.items.length - 1 : 0];
                    break;
                }
            }
        }
        return textChar;
    }

    private _getPositionTextChars(column: ActaParagraphColumnElement, x: number, y: number, width: number = 1, height: number = 1) {
        const textChars: ActaTextChar[] = [];
        const x2 = x + width;
        const y2 = y + height;

        for (const fTextChar of this.textChars) {
            if (!fTextChar.visable || fTextChar.x < 0) continue;
            if (!fTextChar.textRow) continue;
            if (fTextChar.textRow.column !== column) continue;

            const itemX1 = fTextChar.x;
            const itemX2 = fTextChar.x + fTextChar.calcWidth;
            const itemY1 = fTextChar.y;
            const itemY2 = fTextChar.y + fTextChar.height + fTextChar.textRow.maxLeading;
            if (itemX1 < x2 && itemX2 > x && itemY1 < y2 && itemY2 > y) textChars.push(fTextChar);
        }
        return textChars;
    }

    private _computePositionTextChars(): void {
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
        for (const textChar of this.textChars) {
            if (this._overflow) { textChar.textRow = null; continue; }

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
                        if (textRow) {
                            for (const otextChar of textRow.items) otextChar.textRow = null;
                        }
                        this._overflow = true;
                        continue;
                    }
                    if (textRow != null) textRow.column = column;
                }
            }
        }
        let lastCharIsNewline = false;
        if (this.lastTextChar !== null) {
            if (this.lastTextChar.type === TextCharType.NEWLINE) lastCharIsNewline = true;
        }
        if (this.textChars.length < 1 || lastCharIsNewline) {
            let column: ActaParagraphColumnElement | undefined;
            let textStyle: ActaTextStyle | undefined;
            let indexOfColumn = 0;
            if (lastCharIsNewline && this.lastTextChar !== null) {
                textStyle = this.lastTextChar.textStyle;
                indexOfColumn = this.lastTextChar.textRow ? this.lastTextChar.indexOfColumn : 0;
            }
            textStyle = ActaTextStyleManager.getInstance().get(this._defaultTextStyleName || '');
            if (!textStyle || !textStyle.font || !textStyle.fontSize) return;

            const textHeight = textStyle.textHeight;
            const leading = (textHeight || 0) * ((textStyle.lineHeight || 1) - 1);

            column = this.columns[indexOfColumn];
            const newTextRow = new ActaTextRow(column, textStyle.indent || 0);
            newTextRow.maxHeight = textHeight;
            newTextRow.maxLeading = leading;
            newTextRow.textAlign = textStyle.textAlign || TextAlign.JUSTIFY;
        }
    }

    private _drawTextChars(redraw: boolean = false) {
        for (const column of this.columns) {
            const textRows: ActaTextRow[] = column.textRows;
            let offsetY = 0;

            for (const textRow of textRows) {
                let offsetX = textRow.indent;
                textRow.offsetY = offsetY;
                for (const textChar of textRow.items) {
                    if (textChar.textRow === null) textChar.textRow = textRow;
                    if ([TextCharType.NEWLINE].indexOf(textChar.type) < 0) {
                        textChar.update(offsetX, offsetY);
                    }
                    offsetX += textChar.calcWidth;
                }
                offsetY += textRow.maxHeight;
                offsetY += textRow.maxLeading;
            }
        }
        if (this._overflow) {
            this._element.classList.add('overflow');
        } else {
            this._element.classList.remove('overflow');
        }
    }

    private _update() {
        this._computePositionTextChars();
        this._drawTextChars(true);
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

        this._textNodeList = [];

        this.columnCount = columnCount;
        for (let i = 0; i < columnCount; i++) {
            if (columnWidths[i]) this.columnWidth(i, columnWidths[i]);
        }
        this.innerMargin = innerMargin;

        $(this._element).on('resize', e => {
            this._update();
            return false;
        });
        $(this._element).on('keydown', (e) => e.originalEvent ? this._onKeyPress(e.originalEvent) : {});
        $(this._element).on('mousedown', 'x-paragraph-col', (e) => {
            if (!this._editable) return false;
            const eventElement = this._getPositionTextChar(e.currentTarget, e.offsetX, e.offsetY);
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
            const eventElement = this._getPositionTextChar(e.currentTarget, e.offsetX, e.offsetY);
            if (this._selectionStartChar != null) {
                this._setCursor(eventElement, e.offsetX);
                this._redrawCursor();
            }
            return false;
        });
        $(this._element).on('mouseup', 'x-paragraph-col', (e) => {
            if (!this._editable) return false;
            const eventElement = this._getPositionTextChar(e.currentTarget, e.offsetX, e.offsetY);
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
        this._computePositionTextChars();
        this._drawTextChars();
    }

    set text(text: string) {
        if (this._textStore) this._textStore.remove();
        this._textStore = ActaTextConverter.textobject(this.defaultTextStyleName, text);
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