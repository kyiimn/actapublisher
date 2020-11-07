import { ActaGalley } from './galley';
import { ActaClipboard } from '../clipboard';
import { ActaParagraphColumn } from './paragraph-col';
import { ActaParagraphMargin } from './paragraph-margin';
import { ActaTextStyleManager } from './text/textstylemgr';
import { ActaTextStore } from './text/textstore';
import { ActaTextNode } from './text/textnode';
import { ActaTextStyle, ActaTextStyleInherit, TextAlign } from './text/textstyle';
import { ActaTextRow } from './text/textrow';
import { ActaTextChar, CharType } from './text/textchar';

import { Subject, fromEvent } from 'rxjs';
import { distinctUntilChanged, debounceTime, filter } from 'rxjs/operators';

import Hangul from 'hangul-js';
import SelectHanja from './hanja';

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

enum InputCharType {
    TEXT, SPECIAL, NONE
};

enum Keycode {
    BACKSPACE = 8, TAB = 9, ENTER = 13, SHIFT = 16, CONTROL = 17, ALT = 18, HANGUL = 21, HANJA = 25, SPACE = 32, END = 35, HOME = 36, LEFT = 37, UP = 38, RIGHT = 39, DOWN = 40, INSERT = 45, DELETE = 46
};

enum CursorMode {
    NONE, EDIT, INPUT, SELECTION, SELECTIONSTART
};

enum InputMethod {
    EN, KO
};

export class ActaParagraph extends ActaGalley {
    private _columnCount: number;
    private _innerMargin: string | number;
    private _textStore: ActaTextStore;
    private _defaultTextStyleName: string | null;
    private _selectionStart: number | null;
    private _cursorMode: CursorMode;
    private _cursor: number | null;
    private _editable: boolean;
    private _inputChar: string;
    private _overflow: boolean;

    private _update$: Subject<undefined>;
    private _redrawCursor$: Subject<string>;

    private static _inputMethod:InputMethod = InputMethod.EN;
    private static _inputMethod$: Subject<InputMethod> = new Subject();

    private static toggleInputMethod() {
        ActaParagraph._inputMethod = ActaParagraph._inputMethod === InputMethod.KO ? InputMethod.EN : InputMethod.KO;
        ActaParagraph._inputMethod$.next(ActaParagraph._inputMethod);
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
        if (KEYCODE_CHAR_MAP[e.key]) return InputCharType.TEXT;
        else if (KEYCODE_SPECIALCHAR_MAP[e.key]) return InputCharType.SPECIAL;
        return InputCharType.NONE;
    }

    private _updateInputHangulChar() {
        if (!this._cursor) return;

        const textChar = this.textChars[this._cursor - 1];
        if (!textChar) return;

        let hangulText = Hangul.a(this._inputChar.split(''));
        if (hangulText.length > 1) {
            textChar.char = hangulText.substr(0, 1);
            textChar.textNode.insert(textChar.indexOfNode + 1, hangulText.substr(1));
            this._cursor += hangulText.length - 1;
            hangulText = hangulText.substr(hangulText.length - 1);
        } else if (hangulText.length < 1) {
            textChar.remove();
        } else {
            textChar.char = hangulText;
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
        let textNode: ActaTextNode | null = null;
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
            const textChar = this._getTextCharAtCursor();
            if (!textChar) { this._cursorMode = CursorMode.EDIT; return; }
            insertPos = textChar.indexOfNode;
            textNode = textChar.textNode;
        }
        if (ActaParagraph.inputMethod === InputMethod.KO && ActaParagraph.isCharType(e) === InputCharType.TEXT) {
            if (this._cursorMode === CursorMode.INPUT) {
                this._cursorMode = CursorMode.EDIT;
                this._inputChar += char;
                this._updateInputHangulChar();
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
        this._emitUpdate();

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
            const textChar = this._getTextCharAtCursor();
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
                if (this._cursorMode !== CursorMode.SELECTION) this._selectionStart = this._cursor;
                this._cursorMode = CursorMode.SELECTION;
            } else {
                this._cursorMode = CursorMode.EDIT;
            }
            if ([Keycode.HOME, Keycode.END].indexOf(e.keyCode) > -1) {
                if (this._cursor > this.textChars.length - 1) this._cursor--;
                const textRow = this._getTextRowAtCursor();
                if (textRow && textRow.length > 0) {
                    this._cursor = this.textChars.indexOf((e.keyCode === Keycode.HOME) ? textRow.firstTextChar : textRow.lastTextChar);
                    if (this._cursor === this.textChars.length - 1 && this.textChars[this._cursor].type !== CharType.RETURN) this._cursor++;
                    this._emitRedrawCursor();
                }
                return false;
            } else if ([Keycode.UP, Keycode.DOWN].indexOf(e.keyCode) > -1) {
                const nearTextRow = (e.keyCode === Keycode.UP) ? this._getPrevTextRowAtCursor() : this._getCursorNextTextRow();
                if (nearTextRow !== null) {
                    const nearestItem = this._getNearestLineTextChar(this._getTextCharAtCursor(), nearTextRow.items);
                    if (nearestItem) {
                        this._cursor = this.textChars.indexOf(nearestItem);
                        this._emitRedrawCursor();
                        return false;
                    }
                }
                this._cursorMode = CursorMode.EDIT;
                return false;
            } else if ([Keycode.LEFT, Keycode.RIGHT].indexOf(e.keyCode) > -1) {
                this._cursor = (e.keyCode === Keycode.LEFT) ? Math.max(this._cursor - 1, 0) : Math.min(this._cursor + 1, this.textChars.length);
                this._emitRedrawCursor();
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
                        this._updateInputHangulChar();
                        if (this._inputChar === '') {
                            this._cursor--;
                            this._cursorMode = CursorMode.EDIT;
                        }
                        this._emitUpdate();
                        return false;
                    }
                    if (this._cursor === 0) return false;
                    this._cursor--;
                }
                this._removeTextChars([this.textChars[this._cursor]]);
            }
            this._cursorMode = CursorMode.EDIT;
            this._emitRedrawCursor();
            return false;
        } else if (e.keyCode === Keycode.HANGUL) {
            ActaParagraph.toggleInputMethod();
            this._cursorMode = CursorMode.EDIT;
            this._emitRedrawCursor();
            return false;
        } else if (e.keyCode === Keycode.HANJA) {
            const textChar = this.textChars[this._cursor - 1];
            if (textChar) {
                this._selectionStart = this._cursor - 1;
                this._cursorMode = CursorMode.SELECTION;
                this._emitRedrawCursor();

                const textCharPos = this._getBoundingClientRect(textChar);
                SelectHanja(textChar, textCharPos.x, textCharPos.y + textCharPos.height).subscribe({
                    next: data => {
                        if (!data.hanjaChar) return;
                        textChar.char = data.hanjaChar;
                        this._emitUpdate();
                    },
                    complete: () => {
                        this.focus({ preventScroll: true });

                        this._cursorMode = CursorMode.EDIT;
                        this._emitRedrawCursor();
                    }
                });
            } else {
                this._cursorMode = CursorMode.EDIT;
                this._emitRedrawCursor();
            }
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
            this._cursorMode = CursorMode.EDIT;

            for (const textChar of selTextChars) selText += textChar.char || '';
            this._removeTextChars(selTextChars);
            this._emitUpdate();
            ActaClipboard.in.write(selText);
            return false;
        } else if ((e.ctrlKey && e.key.toLowerCase() === 'v') || (e.shiftKey && e.keyCode === Keycode.INSERT)) {
            const selTextChars = this._getSelectionTextChars();
            if (selTextChars.length > 0) {
                this._cursor = this.textChars.indexOf(selTextChars[0]);
                this._removeTextChars(selTextChars);
            };
            this._emitUpdate();

            ActaClipboard.in.read().then(v => {
                if (!v) return;
                if (this._cursor === null || typeof(v) !== 'string') return;
                this._insertText(v);
                this._emitUpdate();
            });
            return false;
        } else if (e.ctrlKey && e.key.toLowerCase() === 'a') {
            if (this.textChars.length < 1) return false;
            const textChars = this.textChars;
            for (let i = 0; i < textChars.length && textChars[i].isVisable; i++) {
                this._cursor = i + 1;
            }
            this._selectionStart = 0;
            this._cursorMode = CursorMode.SELECTION;
            this._emitRedrawCursor();
            return false;
        } else if (e.altKey && e.key === 'd') {
            const aa = new ActaTextStyleInherit();
            aa.fontSize = 15;
            this.applyCursorTextStyle(aa);
            return false;
        } else if (e.altKey && e.key === 'c') {
            this.applyCursorDefinedTextStyle('본문2');
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
        if (!ActaTextStyleManager.in.get(textStyleName)) return;
        const textNodes = this._getTextCharBlocks(textChars);
        for (const textNode of textNodes) {
            textNode.defaultTextStyleName = textStyleName;
            textNode.modifiedTextStyle = new ActaTextStyleInherit();
            for (const textChar of textNode.value) {
                if (textChar instanceof ActaTextChar) textChar.modified = true;
            }
        }
    }

    private _applyTextStyle(textChars: ActaTextChar[], textStyle: ActaTextStyleInherit) {
        const textNodes = this._getTextCharBlocks(textChars);
        for (const textNode of textNodes) {
            textNode.modifiedTextStyle.merge(textStyle);
        }
    }

    private _removeTextChars(textChars: ActaTextChar[]) {
        for (const textChar of textChars) textChar.remove();
        this._emitUpdate();
    }

    private _getNearestVisableTextChar(textChar: ActaTextChar | null) {
        if (!textChar) return null;
        if (!textChar.isVisable) {
            if (!textChar.textRow) return null;
            let tmpIdx = textChar.textRow.indexOf(textChar);
            if (tmpIdx < 0) return null;
            else {
                do {
                    if (--tmpIdx < 1) break;
                    if (!textChar.textRow.get(tmpIdx).isVisable) continue;
                } while (false);
            }
            textChar = textChar.textRow.get(Math.max(tmpIdx, 0));
        }
        return textChar;
    }

    private _getNearestLineTextChar(currChar: ActaTextChar | null, targetChars: ActaTextChar[]) {
        if (!currChar) return null;

        let curOffsetX = 0;
        if (!currChar.isVisable) {
            const tmpChar = this._getNearestVisableTextChar(currChar);
            if (tmpChar) curOffsetX = tmpChar.x + tmpChar.width;
        } else {
            curOffsetX = currChar.x;
        }
        const distance: number[] = [];
        let prevOffsetX = 0;

        for (const targetChar of targetChars) {
            if (targetChar.isVisable) {
                prevOffsetX = Math.max(targetChar.x, prevOffsetX);
            }
            distance.push(Math.abs(prevOffsetX - curOffsetX));
        }
        return targetChars[distance.indexOf(Math.min(...distance))];
    }

    private _getTextCharAtCursor() {
        if (this._cursor === null) return null;
        return this.textChars[this._cursor];
    }

    private _getTextRowAtCursor() {
        if (this._cursor === null) return null;
        const textChar = this.textChars[this._cursor];
        return (textChar) ? (textChar.textRow || null) : null;
    }

    private _getPrevTextRowAtCursor() {
        const currTextRow = this._getTextRowAtCursor();
        if (!currTextRow) return null;

        const firstTextCharIdx = this.textChars.indexOf(currTextRow.firstTextChar);
        if (firstTextCharIdx === 0)  return null;

        return this.textChars[firstTextCharIdx - 1].textRow;
    }

    private _getCursorNextTextRow() {
        const currTextRow = this._getTextRowAtCursor();
        if (!currTextRow) return null;

        const lastTextCharIdx = this.textChars.indexOf(currTextRow.lastTextChar);
        if (lastTextCharIdx === this.textChars.length - 1)  return null;

        return this.textChars[lastTextCharIdx + 1].textRow;
    }

    private _setCursor(textChar: ActaTextChar | undefined, x?: number) {
        let position = 0;
        if (textChar) {
            position = this.textChars.indexOf(textChar);
            if (textChar.textRow === null) return null;
            if (x !== undefined && textChar.isVisable) {
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
        if ([CursorMode.SELECTIONSTART, CursorMode.SELECTION].indexOf(this._cursorMode) > -1) {
            if (this._selectionStart !== null && this._cursor !== null) {
                let startpos = this._selectionStart;
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

    private _removeCursor() {
        for (const svg of this.canvas) {
            for (const cursor of svg.querySelectorAll('.cursor')) {
                svg.removeChild(cursor);
            }
        }
    }

    private _redrawCursor() {
        this._removeCursor();
        if (this._cursor === null) return;

        if ([CursorMode.SELECTIONSTART, CursorMode.SELECTION].indexOf(this._cursorMode) > -1 && this._cursor !== this._selectionStart) {
            let currColumn: ActaParagraphColumn | undefined;
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

                    currColumn.canvas.appendChild(selBlock);
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

            column.canvas.appendChild(selBlock);
        } else {
            let currColumn: ActaParagraphColumn | undefined;
            let textChar: ActaTextChar | null;
            let textRow: ActaTextRow | null;
            let x, y, height;

            if (this._cursor > this.textChars.length - 1) {
                let lastCharIsNewline = false;
                if (this.textChars.length > 0) {
                    if (this.lastTextChar && this.lastTextChar.type === CharType.RETURN) lastCharIsNewline = true;
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
                    y = textRow.offsetTop || 0;
                    height = textRow.maxHeight;
                } else {
                    textChar = this._getNearestVisableTextChar(this.lastTextChar);
                    textRow = textChar ? textChar.textRow : null;
                    if (!textChar || !textRow) return;

                    currColumn = this.columns[textRow.indexOfColumn];
                    x = textChar.isVisable ? textChar.x + textChar.calcWidth : textRow.indent;
                    y = textChar.isVisable ? textChar.y : textRow.offsetTop;
                    height = textChar.isVisable ? textChar.height : textRow.maxHeight;
                }
            } else {
                textChar = this._getTextCharAtCursor();
                textRow = textChar ? textChar.textRow : null;
                if (!textChar || !textRow) return;

                currColumn = this.columns[textRow.indexOfColumn];
                if (textChar.type !== CharType.RETURN) {
                    x = textChar.isVisable ? textChar.x :textRow.indent;
                    y = textChar.isVisable ? textChar.y : textRow.offsetTop;
                    height = textRow.maxHeight;
                } else {
                    textChar = this._getNearestVisableTextChar(textChar);
                    x = (textChar && textChar.isVisable) ? textChar.x + textChar.calcWidth : textRow.indent;
                    y = (textChar && textChar.isVisable) ? textChar.y : textRow.offsetTop;
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

            currColumn.canvas.appendChild(cursor);
        }
    }

    private _getTextCharAtPosition(column: ActaParagraphColumn, x: number, y: number) {
        let textChar: ActaTextChar | undefined;

        for (const fTextChar of this.textChars) {
            if (!fTextChar.isVisable || fTextChar.x < 0) continue;
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
                if (textRow.offsetTop === undefined) continue;

                const itemY1 = textRow.offsetTop;
                const itemY2 = textRow.offsetTop + textRow.maxHeight + textRow.maxLeading;
                if (itemY1 < y && itemY2 > y) {
                    let maxWidth = 0;
                    for (const textChars of textRow.items) maxWidth += textChars.calcWidth;
                    textChar = maxWidth <= x ? textRow.lastTextChar : textRow.firstTextChar;
                    break;
                }
            }
        }
        return textChar;
    }

    private _getTextCharsAtArea(column: ActaParagraphColumn, x: number, y: number, width: number = 1, height: number = 1) {
        const textChars: ActaTextChar[] = [];
        const x2 = x + width;
        const y2 = y + height;

        for (const fTextChar of this.textChars) {
            if (!fTextChar.isVisable || fTextChar.x < 0) continue;
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

    private _computeDrawPointOfTextChars() {
        let colIdx = 0;

        this.columns.forEach(col => col.clear());
        this._overflow = false;

        for (const textChar of this.textChars) {
            if (this._overflow) { textChar.textRow = null; continue; }

            while (1) {
                const col = this.columns[colIdx];
                if (!col) break;

                const lastRow = col.lastRow;
                if (lastRow) this.computeDrawableAreaOfTextRow(lastRow, textChar);

                if (col.push(textChar)) break;
                if (!this.columns[++colIdx]) {
                    this._overflow = true;
                    textChar.textRow = null;
                }
            }
        }
        let lastCharIsNewline = false;
        if (this.lastTextChar !== null) {
            if (this.lastTextChar.type === CharType.RETURN) lastCharIsNewline = true;
        }
        if (this.textChars.length < 1 || lastCharIsNewline) {
            let textStyle: ActaTextStyle | undefined;
            let indexOfColumn = 0;
            if (lastCharIsNewline && this.lastTextChar !== null) {
                textStyle = this.lastTextChar.textStyle;
                indexOfColumn = this.lastTextChar.textRow ? this.lastTextChar.indexOfColumn : 0;
            }
            textStyle = this.defaultTextStyle;
            if (!textStyle || !textStyle.font || !textStyle.fontSize) return;

            const dummyRow = new ActaTextRow(this.columns[indexOfColumn], textStyle.indent || 0);
            this.computeDrawableAreaOfTextRow(dummyRow);
        }
    }

    private _drawTextChars() {
        this.columns.forEach(col => col.update());

        if (this._overflow) {
            this.classList.add('overflow');
        } else {
            this.classList.remove('overflow');
        }
    }

    private _getBoundingClientRect(textChar: ActaTextChar) {
        if (!textChar.textRow) return { x: 0, y: 0, width: 0, height: 0 };

        const clientRect = textChar.textRow.column.getBoundingClientRect();
        return {
            x: textChar.x + clientRect.left,
            y: textChar.y + clientRect.top,
            width: textChar.calcWidth,
            height: textChar.height
        };
    }

    private _update() {
        this._computeDrawPointOfTextChars();
        this._drawTextChars();
        this._emitRedrawCursor(true);
    }

    private _emitUpdate() {
        this._update$.next();
    }

    private _emitRedrawCursor(force: boolean = false) {
        const textChars = this.textChars;
        const state = {
            cursorMode: this._cursorMode,
            cursorIndex: this._cursor,
            cursorCharID: (this._cursor && this._cursor < textChars.length) ? textChars[this._cursor].id : null,
            selectionStartIndex: this._selectionStart,
            selectionStartCharID: (this._selectionStart && this._selectionStart < textChars.length) ? textChars[this._selectionStart].id : null,
            timestamp: force ? (new Date()).getTime() : 0
        };
        this._redrawCursor$.next(JSON.stringify(state));
    }

    private _checkBrokenLineArea(textRow: ActaTextRow, height?: number) {
        const x1 = textRow.column.offsetLeft;
        const y1 = textRow.offsetTop;
        const x2 = x1 + textRow.columnWidth;
        const y2 = y1 + Math.max((height ? height : 0), textRow.maxHeight);

        const collisionArea = super._checkCollisionArea(x1, y1, x2, y2);
        if (collisionArea.length < 1) return null;

        let brokenX1 = collisionArea[0][0];
        let brokenX2 = collisionArea[0][2];

        for (const broken of collisionArea) {
            brokenX1 = Math.min(broken[0], brokenX1);
            brokenX2 = Math.max(broken[2], brokenX2);
        }
        return [brokenX1, brokenX2];
    }

    private get columns(): ActaParagraphColumn[] {
        return Array.prototype.slice.call(
            this.querySelectorAll<ActaParagraphColumn>('x-paragraph-col')
        );
    }

    private get canvas() {
        const canvas: SVGElement[] = [];
        this.querySelectorAll<ActaParagraphColumn>('x-paragraph-col').forEach(col => canvas.push(col.canvas));
        return canvas;
    }

    protected _collision() {
        this._emitUpdate();
    }

    constructor(
        x: string | number, y: string | number, width: string | number, height: string | number,
        defaultTextStyleName: string | null, columnCount: number = 1, innerMargin: string | number = 0, columnWidths: string[] | number[] = []
    ) {
        super(x, y, width, height);

        this._redrawCursor$ = new Subject();
        this._redrawCursor$.pipe(distinctUntilChanged()).subscribe(() => this._redrawCursor());

        this._update$ = new Subject();
        this._update$.pipe(debounceTime(.005)).subscribe(() => this._update());

        this._columnCount = 1;
        this._innerMargin = 0;
        this._textStore = new ActaTextStore();
        this._defaultTextStyleName = defaultTextStyleName;

        this._editable = true;
        this._selectionStart = null;
        this._cursorMode = CursorMode.NONE;
        this._cursor = null;
        this._inputChar = '';
        this._overflow = false;

        this.columnCount = columnCount;
        for (let i = 0; i < columnCount; i++) {
            if (columnWidths[i]) this.columnWidth(i, columnWidths[i]);
        }
        this.innerMargin = innerMargin;

        this.text = '';

        this._changeSize$.subscribe(_ => {
            this._emitUpdate();
        });
        fromEvent<KeyboardEvent>(this, 'keydown').subscribe(e => {
            if (this._onKeyPress(e) !== false) return;
            e.preventDefault();
            e.stopPropagation();
        });

        let waitTripleClickTimer: boolean = false;
        fromEvent<MouseEvent>(this, 'mousedown').pipe(filter(e => {
            if (!this._editable) return false;
            if (!(e.target instanceof ActaParagraphColumn)) return false;
            return true;
        })).subscribe(e => {
            if ((e && e.detail === 2) || waitTripleClickTimer) {
                let breakType;
                if (waitTripleClickTimer) {
                    waitTripleClickTimer = false;
                    breakType = [CharType.RETURN];
                } else {
                    waitTripleClickTimer = true;
                    setTimeout(() => { waitTripleClickTimer = false; }, 200);
                    breakType = [CharType.RETURN, CharType.SPACE];
                }
                const evtTextChar = this._getTextCharAtPosition(e.target as ActaParagraphColumn, e.offsetX, e.offsetY);
                if (!evtTextChar || evtTextChar.type !== CharType.CHAR) return;

                const textChars = this.textChars;
                for (let i = textChars.indexOf(evtTextChar); i >= 0; i--) {
                    if (breakType.indexOf(textChars[i].type) > -1) break;
                    this._selectionStart = i;
                }
                for (let i = this.textChars.indexOf(evtTextChar); i < this.textChars.length; i++) {
                    if (breakType.indexOf(textChars[i].type) > -1) break;
                    this._cursor = i + 1;
                }
                this._cursorMode = CursorMode.SELECTION;
                this._emitRedrawCursor();
            } else {
                const textChar = this._getTextCharAtPosition(e.target as ActaParagraphColumn, e.offsetX, e.offsetY);
                this._cursorMode = CursorMode.SELECTIONSTART;
                this._cursor = null;
                this._selectionStart = this._setCursor(textChar, e.offsetX);
                this._emitRedrawCursor();
            }
            this.focus({ preventScroll: true });

            e.preventDefault();
            e.stopPropagation();
        });

        fromEvent<MouseEvent>(this, 'mousemove').pipe(filter(e => {
            if (!this._editable) return false;
            if (this._cursorMode !== CursorMode.SELECTIONSTART) return false;
            if (!(e.target instanceof ActaParagraphColumn)) return false;
            if (e.buttons !== 1) return false;
            return true;
        })).subscribe(e => {
            const textChar = this._getTextCharAtPosition(e.target as ActaParagraphColumn, e.offsetX, e.offsetY);
            if (this._selectionStart != null) {
                this._setCursor(textChar, e.offsetX);
                this._emitRedrawCursor();
            }
            e.preventDefault();
            e.stopPropagation();
        });

        fromEvent<MouseEvent>(this, 'mouseup').pipe(filter(e => {
            if (!this._editable) return false;
            if (this._cursorMode !== CursorMode.SELECTIONSTART) return false;
            if (!(e.target instanceof ActaParagraphColumn)) return false;
            return true;
        })).subscribe(e => {
            const textChar = this._getTextCharAtPosition(e.target as ActaParagraphColumn, e.offsetX, e.offsetY);
            if (this._selectionStart != null) {
                this._setCursor(textChar, e.offsetX);
                this._emitRedrawCursor();
            }
            if (this._cursor === null) {
                this._cursorMode = CursorMode.NONE;
                return false;
            } else if (this._cursor !== this._selectionStart && this._selectionStart) {
                this._cursorMode = CursorMode.SELECTION;
            } else {
                this._cursorMode = CursorMode.EDIT;
            }
            e.preventDefault();
            e.stopPropagation();
        });
    }

    protected _focus() {
        this._emitRedrawCursor();
    }

    protected _blur() {
        this._selectionStart = null;
        this._removeCursor();
    }

    columnWidth(idx: number, val: string | number) {
        if (arguments.length > 1) {
            this.columns[idx].setAttribute('width', (val || 0).toString());
            this._emitChangeSize();
        } else {
            return this.columns[idx].getAttribute('width') || false;
        }
    }

    applyCursorDefinedTextStyle(textStyleName: string) {
        const selTextChars = this._getSelectionTextChars();
        this._applyDefinedTextStyle(selTextChars, textStyleName);
        this._emitUpdate();
    }

    applyCursorTextStyle(textStyle: ActaTextStyleInherit) {
        const selTextChars = this._getSelectionTextChars();
        this._applyTextStyle(selTextChars, textStyle);
        this._emitUpdate();
    }

    computeDrawableAreaOfTextRow(textRow: ActaTextRow, textChar?: ActaTextChar) {
        const textHeight = textChar ? textChar.height : this.defaultTextStyle.textHeight;
        const broken = this._checkBrokenLineArea(textRow, textHeight);
        if (broken) {
            if (broken[0] <= 0) {
                textRow.paddingLeft = broken[1];
            } else if (broken[1] >= textRow.columnWidth) {
                textRow.paddingRight = textRow.columnWidth - broken[0];
            } else {
                const upperRow = textRow.indexOfLine > 0 ? textRow.column.textRows[textRow.indexOfLine - 1] : null;
                if (upperRow && upperRow.fragment) {
                    textRow.paddingLeft = broken[1];
                } else {
                    textRow.fragment = true;
                    textRow.paddingRight = textRow.columnWidth - broken[0];
                }
            }
        }
    }

    getCursorTextStyleIntersection() {
        const returnTextStyle = new ActaTextStyleInherit();

        let selTextChars = this._getSelectionTextChars();
        if (selTextChars.length < 1) {
            const cursorTextChar = this._getTextCharAtCursor();
            if (cursorTextChar) selTextChars = [cursorTextChar];
        }
        const textNodes = this._getTextCharBlocks(selTextChars);
        if (textNodes.length < 1) {
            returnTextStyle.copy(this.defaultTextStyle);
            return returnTextStyle;
        }
        returnTextStyle.copy(textNodes[0].textStyle);
        for (const textNode of textNodes) {
            const textStyle = textNode.textStyle;
            if (returnTextStyle.font !== textStyle.font) returnTextStyle.font = null;
            if (returnTextStyle.fontSize !== textStyle.fontSize) returnTextStyle.fontSize = null;
            if (returnTextStyle.xscale !== textStyle.xscale) returnTextStyle.xscale = null;
            if (returnTextStyle.letterSpacing !== textStyle.letterSpacing) returnTextStyle.letterSpacing = null;
            if (returnTextStyle.lineHeight !== textStyle.lineHeight) returnTextStyle.lineHeight = null;
            if (returnTextStyle.textAlign !== textStyle.textAlign) returnTextStyle.textAlign = null;
            if (returnTextStyle.underline !== textStyle.underline) returnTextStyle.underline = null;
            if (returnTextStyle.strikeline !== textStyle.strikeline) returnTextStyle.strikeline = null;
            if (returnTextStyle.indent !== textStyle.indent) returnTextStyle.indent = null;
            if (returnTextStyle.color !== textStyle.color) returnTextStyle.color = null;
        }
        return returnTextStyle;
    }

    set text(text: string) {
        if (this._textStore) this._textStore.remove();
        this._textStore = ActaTextStore.import(this.defaultTextStyleName, text);
        this._cursor = null;
        this._emitUpdate();
    }

    set columnCount(count: number) {
        this.innerHTML = '';
        this._columnCount = count || 1;
        for (let i = 0; i < this._columnCount; i++) {
            const column = new ActaParagraphColumn();
            this.appendChild(column);
            column.clear();

            if (i + 1 >= this._columnCount) continue;

            const margin = new ActaParagraphMargin();
            margin.setAttribute('width', this.innerMargin.toString());
            this.appendChild(margin);
        }
        this._emitChangeSize();
    }

    set innerMargin(innerMargin) {
        this._innerMargin = innerMargin;
        for (const margin of this.querySelectorAll('x-paragraph-margin')) {
            margin.setAttribute('width', innerMargin.toString());
        }
        this._emitChangeSize();
    }
    set defaultTextStyleName(styleName: string) {
        this._defaultTextStyleName = styleName;
        if (this._textStore) this._textStore.defaultTextStyleName = styleName;
    }
    set editable(val: boolean) { this._editable = val; }

    get columnCount() { return this._columnCount; }
    get innerMargin() { return this._innerMargin; }
    get text() { return this._textStore ? this._textStore.markupText : ''; }
    get defaultTextStyleName() { return this._defaultTextStyleName || ''; }
    get defaultTextStyle() { return ActaTextStyleManager.in.get(this.defaultTextStyleName); }
    get editable() { return this._editable; }

    get textChars() {
        return this._textStore ? this._textStore.toArray() : [];
    }

    get firstTextChar() {
        const textChars = this.textChars;
        return textChars.length > 0 ? textChars[0] : null;
    }

    get lastTextChar() {
        const textChars = this.textChars;
        return textChars.length > 0 ? textChars[textChars.length - 1] : null;
    }

    get firstRow() {
        let textRow = null;
        this.columns.forEach(col => textRow = col.firstRow);
        return textRow;
    }

    get lastRow() {
        let textRow = null;
        for (let i = this.columns.length; i > 0; i--) {
            textRow = this.columns[i - 1].lastRow;
            if (textRow) break;
        }
        return textRow;
    }

    get visableFirstTextChar() {
        let textChar = null;
        this.columns.some(col => textChar = col.firstTextChar);
        return textChar;
    }

    get visableLastTextChar() {
        let textChar = null;
        for (let i = this.columns.length; i > 0; i--) {
            textChar = this.columns[i - 1].lastTextChar;
            if (textChar) break;
        }
        return textChar;
    }

    get type() { return 'PARAGRAPH'; }
};
customElements.define('x-paragraph', ActaParagraph);