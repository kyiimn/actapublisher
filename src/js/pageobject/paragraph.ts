import IActaFrame from './interface/frame';
import IActaFrameOverlapArea from './interface/frame-overlap-area';
import IActaPreflightProfile from './interface/preflight-profile';
import ActaClipboard from '../util/clipboard';
import ActaParagraphColumn from './paragraph-col';
import ActaParagraphMargin from './paragraph-margin';
import ActaTextStore from './text/textstore';
import ActaTextNode from './text/textnode';
import ActaTextAttributeAbsolute from './textstyle/textattribute-absolute';
import ActaTextAttribute from './textstyle/textattribute';
import ActaTextRow from './text/textrow';
import ActaTextChar from './text/textchar';
import textstylemgr from './textstyle/textstylemgr';
import { CharType } from './text/textchar';

import { Subject, fromEvent, Subscription } from 'rxjs';
import { distinctUntilChanged, debounceTime, filter, map } from 'rxjs/operators';

import Hangul from 'hangul-js';
import SelectHanja from './hanja';
import U from '../util/units';

import "../../css/pageobject/paragraph.scss";

type EVENT_TYPE = 'changecursor' | 'changeeditable' | 'repaint' | 'cursorrepaint';

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
    BACKSPACE = 8, TAB = 9, ENTER = 13, SHIFT = 16, CONTROL = 17, ALT = 18, HANGUL = 21, HANJA = 25, ESCAPE = 27, SPACE = 32, END = 35, HOME = 36, LEFT = 37, UP = 38, RIGHT = 39, DOWN = 40, INSERT = 45, DELETE = 46
};

enum CursorMode {
    NONE, EDIT, INPUT, SELECTION, SELECTIONSTART
};

enum InputMethod {
    EN, KO
};

export enum ParagraphVerticalAlign {
    TOP = 0, MIDDLE, BOTTOM, JUSTIFY
}

class ActaParagraphOverflow extends IActaPreflightProfile {
    constructor(target: ActaParagraph, detailMessage?: string) {
        super();

        this._targetFrame = target;
        this._detailMessage = detailMessage || "";
    }
    get message() {
        return "Content Overflow";
    }
}

// tslint:disable-next-line: max-classes-per-file
class ActaParagraphEmpty extends IActaPreflightProfile {
    constructor(target: ActaParagraph, detailMessage?: string) {
        super();

        this._targetFrame = target;
        this._detailMessage = detailMessage || "";
    }
    get message() {
        return "Content Empty";
    }
}

// tslint:disable-next-line: max-classes-per-file
export default class ActaParagraph extends IActaFrame {
    private _subscriptionChangeCursor?: Subscription;
    private _subscriptionChangeEditable?: Subscription;

    private _columnCount: number;
    private _cursor: number | null;
    private _cursorMode: CursorMode;
    private _defaultTextStyle: string;
    private _readonly: boolean;
    private _editable: boolean;
    private _inputChar: string;
    private _innerMargin: string | number;
    private _overflow: boolean;
    private _selectionStart: number | null;
    private _textStore: ActaTextStore;

    private _cursorTextAttribute?: ActaTextAttribute;

    private _EVENT_PARAGRAPH$: Subject<{ type: EVENT_TYPE, value?: any }>;
    private _CURSOR_MOVE$: Subject<number>;

    private static _INPUT_METHOD:InputMethod = InputMethod.EN;
    private static _CHNAGE_INPUT_METHOD$: Subject<InputMethod> = new Subject();

    private static TOGGLE_INPUT_METHOD() {
        ActaParagraph._INPUT_METHOD = ActaParagraph._INPUT_METHOD === InputMethod.KO ? InputMethod.EN : InputMethod.KO;
        ActaParagraph._CHNAGE_INPUT_METHOD$.next(ActaParagraph._INPUT_METHOD);
    }

    private static get INPUT_METHOD() {
        return ActaParagraph._INPUT_METHOD;
    }

    private static GET_CHAR(e: KeyboardEvent) {
        let retChar: string | undefined;
        if (KEYCODE_CHAR_MAP[e.key]) retChar = (ActaParagraph.INPUT_METHOD === InputMethod.KO) ? KEYCODE_CHAR_MAP[e.key][1] : KEYCODE_CHAR_MAP[e.key][0];
        if (retChar === undefined && KEYCODE_SPECIALCHAR_MAP[e.key]) retChar = KEYCODE_SPECIALCHAR_MAP[e.key];
        return retChar;
    }

    private static GET_CHAR_TYPE(e: KeyboardEvent) {
        if (KEYCODE_CHAR_MAP[e.key]) return InputCharType.TEXT;
        else if (KEYCODE_SPECIALCHAR_MAP[e.key]) return InputCharType.SPECIAL;
        return InputCharType.NONE;
    }

    private _onKeyPressInputHangulChar() {
        if (!this.cursor) return;

        const textChar = this.textChars[this.cursor - 1];
        if (!textChar) return;

        let hangulText = Hangul.a(this._inputChar.split(''));
        if (hangulText.length > 1) {
            textChar.char = hangulText.substr(0, 1);
            textChar.textNode.insert(textChar.indexOfNode + 1, hangulText.substr(1));
            this.cursor += hangulText.length - 1;
            hangulText = hangulText.substr(hangulText.length - 1);
        } else if (hangulText.length < 1) {
            textChar.remove();
        } else {
            textChar.char = hangulText;
        }
        this._inputChar = Hangul.d(hangulText).join('');
    }

    private _onKeyPressInputChar(e: KeyboardEvent) {
        const char = ActaParagraph.GET_CHAR(e);
        let inputChar;

        if ([CursorMode.EDIT, CursorMode.SELECTION, CursorMode.INPUT].indexOf(this._cursorMode) < 0) return;
        if (this.cursor === null) { this._cursorMode = CursorMode.NONE; return; }
        if (char === undefined) { this._cursorMode = CursorMode.EDIT; return; }

        if (this._cursorMode === CursorMode.SELECTION) {
            const selectionTextChars = this._getSelectedTextChars();
            this.cursor = this.textChars.indexOf(selectionTextChars[0]);
            this._removeTextChars(selectionTextChars);
            this._cursorMode = CursorMode.EDIT;
        }
        let textNode: ActaTextNode | null = null;
        let insertPos: number = 0;
        if (this.cursor > this.textChars.length - 1) {
            if (this.lastTextChar !== null) {
                textNode = this.lastTextChar.textNode;
            } else {
                textNode = this._textStore;
            }
            if (!textNode) return;
            insertPos = textNode.length;
        } else {
            const textChar = this._getTextCharAtCursor(true);
            if (!textChar) { this._cursorMode = CursorMode.EDIT; return; }
            insertPos = textChar.indexOfNode + 1;
            textNode = textChar.textNode;
        }
        if (ActaParagraph.INPUT_METHOD === InputMethod.KO && ActaParagraph.GET_CHAR_TYPE(e) === InputCharType.TEXT) {
            if (this._cursorMode === CursorMode.INPUT) {
                this._cursorMode = CursorMode.EDIT;
                this._inputChar += char;
                this._onKeyPressInputHangulChar();
            } else {
                this._inputChar = char;
                if (this._cursorTextAttribute) {
                    inputChar = new ActaTextNode();
                    inputChar.modifiedTextAttribute.merge(this._cursorTextAttribute);
                    inputChar.insert(0, this._inputChar);
                    this._cursorTextAttribute = undefined;
                } else {
                    inputChar = this._inputChar;
                }
                this.cursor++;
                textNode.insert(insertPos, inputChar);
            }
            if (this._inputChar !== '') this._cursorMode = CursorMode.INPUT;
        } else {
            if (this._cursorTextAttribute) {
                inputChar = new ActaTextNode();
                inputChar.modifiedTextAttribute.merge(this._cursorTextAttribute);
                inputChar.insert(0, char);
                this._cursorTextAttribute = undefined;
            } else {
                inputChar = char;
            }
            textNode.insert(insertPos, inputChar);
            this._inputChar = '';
            this._cursorMode = CursorMode.EDIT;
            this.cursor++;
        }
        this._EMIT_REPAINT();

        return false;
    }

    private _insertText(text: string) {
        let textNode: ActaTextNode | null = null;
        let indexOfNode: number = 0;

        if (this.cursor === null) return false;
        if (this.cursor > this.textChars.length - 1) {
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
        this.cursor += text.length;

        return true;
    }

    private _onKeyPress(e: KeyboardEvent) {
        if (this.cursor === null) return;

        // 컨트롤, 시프트, 알트키는 무시
        if ([Keycode.CONTROL, Keycode.SHIFT, Keycode.ALT].indexOf(e.keyCode) > -1) return;

        // 이스케이프는 편집모드에서 탈출
        if ([Keycode.ESCAPE].indexOf(e.keyCode) > -1) {
            this.editable = false;
            this.cursor = null;
            this._cursorMode = CursorMode.NONE;
            this._EMIT_CURSOR_REPAINT();
            return false;
        }

        // 커서 이동
        if ([Keycode.HOME, Keycode.END, Keycode.UP, Keycode.DOWN, Keycode.LEFT, Keycode.RIGHT].indexOf(e.keyCode) > -1) {
            // Shift키를 누르고 커서이동시 셀럭션모드
            if (e.shiftKey) {
                if (this._cursorMode !== CursorMode.SELECTION) this.selectionStart = this.cursor;
                this._cursorMode = CursorMode.SELECTION;
            } else {
                this._cursorMode = CursorMode.EDIT;
            }
            if ([Keycode.HOME, Keycode.END].indexOf(e.keyCode) > -1) {
                if (this.cursor > this.textChars.length - 1) this.cursor--;
                const textRow = this._getTextRowAtCursor();
                if (textRow && textRow.length > 0) {
                    this.cursor = this.textChars.indexOf((e.keyCode === Keycode.HOME) ? textRow.firstTextChar : textRow.lastTextChar);
                    if (this.cursor === this.textChars.length - 1 && this.textChars[this.cursor].type !== CharType.RETURN) this.cursor++;
                    this._EMIT_CURSOR_REPAINT();
                }
                return false;
            } else if ([Keycode.UP, Keycode.DOWN].indexOf(e.keyCode) > -1) {
                const nearTextRow = (e.keyCode === Keycode.UP) ? this._getUpsideTextRowAtCursor() : this._getDownsideTextRowAtCursor();
                if (nearTextRow !== null) {
                    const nearestItem = this._getNearestVisableTextChar(this._getTextCharAtCursor(), nearTextRow.items);
                    if (nearestItem) {
                        this.cursor = this.textChars.indexOf(nearestItem);
                        this._EMIT_CURSOR_REPAINT();
                        return false;
                    }
                }
                this._cursorMode = CursorMode.EDIT;
                return false;
            } else if ([Keycode.LEFT, Keycode.RIGHT].indexOf(e.keyCode) > -1) {
                this.cursor = (e.keyCode === Keycode.LEFT) ? Math.max(this.cursor - 1, 0) : Math.min(this.cursor + 1, this.textChars.length);
                this._EMIT_CURSOR_REPAINT();
                return false;
            }
        } else if ([Keycode.BACKSPACE, Keycode.DELETE].indexOf(e.keyCode) > -1) {
            if (this._cursorMode === CursorMode.SELECTION) {
                const selTextChars = this._getSelectedTextChars();
                if (selTextChars.length > 0) {
                    this.cursor = this.textChars.indexOf(selTextChars[0]);
                    this._removeTextChars(selTextChars);
                } else return false;
            } else {
                if (e.keyCode === Keycode.BACKSPACE) {
                    if (ActaParagraph.INPUT_METHOD === InputMethod.KO && this._cursorMode === CursorMode.INPUT && this._inputChar !== '') {
                        this._inputChar = this._inputChar.substr(0, this._inputChar.length - 1);
                        this._onKeyPressInputHangulChar();
                        if (this._inputChar === '') {
                            this.cursor--;
                            this._cursorMode = CursorMode.EDIT;
                        }
                        this._EMIT_REPAINT();
                        return false;
                    }
                    if (this.cursor === 0) return false;
                    this.cursor--;
                }
                if (this.textChars[this.cursor]) this._removeTextChars([this.textChars[this.cursor]]);
            }
            this._cursorMode = CursorMode.EDIT;
            this._EMIT_CURSOR_REPAINT();
            return false;
        } else if (e.keyCode === Keycode.HANGUL || (e.ctrlKey || e.shiftKey) && e.keyCode === Keycode.SPACE) {
            ActaParagraph.TOGGLE_INPUT_METHOD();
            this._cursorMode = CursorMode.EDIT;
            this._EMIT_CURSOR_REPAINT();
            return false;
        } else if (e.keyCode === Keycode.HANJA) {
            const textChar = this.textChars[this.cursor - 1];
            if (textChar) {
                this.selectionStart = this.cursor - 1;
                this._cursorMode = CursorMode.SELECTION;
                this._EMIT_CURSOR_REPAINT();

                const textCharPos = this._getBoundingClientRect(textChar);
                SelectHanja(textChar, textCharPos.x, textCharPos.y + textCharPos.height).subscribe({
                    next: data => {
                        if (!data.hanjaChar) return;
                        textChar.char = data.hanjaChar;
                        this._EMIT_REPAINT();
                    },
                    complete: () => {
                        this.focus({ preventScroll: true });

                        this._cursorMode = CursorMode.EDIT;
                        this._EMIT_CURSOR_REPAINT();
                    }
                });
            } else {
                this._cursorMode = CursorMode.EDIT;
                this._EMIT_CURSOR_REPAINT();
            }
            return false;
        } else if ((e.ctrlKey && e.key.toLowerCase() === 'c') || (e.ctrlKey && e.keyCode === Keycode.INSERT)) {
            const selTextChars = this._getSelectedTextChars();
            let selText = '';
            if (selTextChars.length < 1) return false;
            for (const textChar of selTextChars) selText += textChar.char || '';
            ActaClipboard.in.write(selText);
            return false;
        } else if (e.ctrlKey && e.key.toLowerCase() === 'x') {
            const selTextChars = this._getSelectedTextChars();
            let selText = '';
            if (selTextChars.length < 1) return false;
            this.cursor = this.textChars.indexOf(selTextChars[0]);
            this._cursorMode = CursorMode.EDIT;

            for (const textChar of selTextChars) selText += textChar.char || '';
            this._removeTextChars(selTextChars);
            this._EMIT_REPAINT();
            ActaClipboard.in.write(selText);
            return false;
        } else if ((e.ctrlKey && e.key.toLowerCase() === 'v') || (e.shiftKey && e.keyCode === Keycode.INSERT)) {
            const selTextChars = this._getSelectedTextChars();
            if (selTextChars.length > 0) {
                this.cursor = this.textChars.indexOf(selTextChars[0]);
                this._removeTextChars(selTextChars);
            };
            this._EMIT_REPAINT();

            ActaClipboard.in.read().then(v => {
                if (!v) return;
                if (this.cursor === null || typeof(v) !== 'string') return;
                this._insertText(v);
                this._EMIT_REPAINT();
            });
            return false;
        } else if (e.ctrlKey && e.key.toLowerCase() === 'a') {
            if (this.textChars.length < 1) return false;
            const textChars = this.textChars;
            for (let i = 0; i < textChars.length && textChars[i].isVisable; i++) {
                this.cursor = i + 1;
            }
            this.selectionStart = 0;
            this._cursorMode = CursorMode.SELECTION;
            this._EMIT_CURSOR_REPAINT();
            return false;
        }
        return (!e.ctrlKey && !e.altKey) ? this._onKeyPressInputChar(e) : undefined;
    }

    private _toTextNodes(textChars: ActaTextChar[]) {
        const retTextNodes: ActaTextNode[] = [];
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
                retTextNodes.push(textNode);
            } else {
                const newNode = new ActaTextNode();
                textNode.replace(orgTextChars, newNode);
                newNode.push(str);
                retTextNodes.push(newNode);
            }
            if (textChars.indexOf(startChar) === 0) break;
        }
        return retTextNodes.reverse();
    }

    private _setTextStyle(textChars: ActaTextChar[], textStyle: string) {
        if (!textstylemgr.get(textStyle)) return;
        const textNodes = this._toTextNodes(textChars);
        for (const textNode of textNodes) {
            textNode.textStyle = textStyle;
            textNode.modifiedTextAttribute = new ActaTextAttribute();
            for (const textChar of textNode.value) {
                if (textChar instanceof ActaTextChar) textChar.modified = true;
            }
        }
    }

    private _setTextAttribute(targetTextChars: ActaTextChar[], textAttr: ActaTextAttribute) {
        if (targetTextChars.length < 1) return;

        const textNodes = this._toTextNodes(targetTextChars);
        for (const textNode of textNodes) {
            textNode.modifiedTextAttribute.merge(textAttr);
        }
    }

    private _setTextAlign(targetTextChars: ActaTextChar[], textAttr: ActaTextAttribute) {
        const breakType = [CharType.RETURN];
        const modifyTextChars: ActaTextChar[] = [];
        let startPos: number = -1;
        let endPos: number = -1;

        if (targetTextChars.length < 1 || textAttr.textAlign === null) return;

        const textChars = this.textChars;
        for (let i = textChars.indexOf(targetTextChars[0]); i >= 0; i--) {
            if (breakType.indexOf(textChars[i].type) > -1) break;
            startPos = i;
        }
        for (let i = textChars.indexOf(targetTextChars[targetTextChars.length - 1]); i < textChars.length; i++) {
            endPos = i + 1;
            if (breakType.indexOf(textChars[i].type) > -1) break;
        }
        if (startPos < 0 || endPos < 0) return;
        for (let i = startPos; i < endPos; i++) {
            modifyTextChars.push(textChars[i]);
        }
        const textAttrAlign = new ActaTextAttribute();
        textAttrAlign.textAlign = textAttr.textAlign;

        this._setTextAttribute(modifyTextChars, textAttrAlign);
    }

    private _removeTextChars(textChars: ActaTextChar[]) {
        for (const textChar of textChars) {
            if (textChar) textChar.remove();
        }
        this._EMIT_REPAINT();
    }

    private _getNearestVisableTextChar(currChar: ActaTextChar | null, targetChars: ActaTextChar[] | null = null) {
        if (!currChar) return null;
        if (targetChars === null) {
            if (!currChar.isVisable) {
                if (!currChar.textRow) return null;
                let tmpIdx = currChar.textRow.indexOf(currChar);
                if (tmpIdx < 0) return null;
                else {
                    do {
                        if (--tmpIdx < 1) break;
                        if (!currChar.textRow.get(tmpIdx).isVisable) continue;
                    } while (false);
                }
                currChar = currChar.textRow.get(Math.max(tmpIdx, 0));
            }
            return currChar;
        } else {
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
    }

    private _getTextCharAtCursor(frontOfCursor: boolean = false) {
        if (this.cursor === null) return null;
        const textChars = this.textChars;
        return textChars[Math.min(Math.max(this.cursor - (frontOfCursor ? 1 : 0), 0), textChars.length - 1)];
    }

    private _getTextRowAtCursor(frontOfCursor: boolean = false) {
        const textChar = this._getTextCharAtCursor(frontOfCursor);
        return (textChar) ? (textChar.textRow || null) : null;
    }

    private _getUpsideTextRowAtCursor(frontOfCursor: boolean = false) {
        const currTextRow = this._getTextRowAtCursor(frontOfCursor);
        if (!currTextRow) return null;

        const textChars = this.textChars;
        const firstTextCharIdx = textChars.indexOf(currTextRow.firstTextChar);
        if (firstTextCharIdx === 0) return null;

        return textChars[firstTextCharIdx - 1].textRow;
    }

    private _getDownsideTextRowAtCursor(frontOfCursor: boolean = false) {
        const currTextRow = this._getTextRowAtCursor(frontOfCursor);
        if (!currTextRow) return null;

        const textChars = this.textChars;
        const lastTextCharIdx = textChars.indexOf(currTextRow.lastTextChar);
        if (lastTextCharIdx === textChars.length - 1) return null;

        return textChars[lastTextCharIdx + 1].textRow;
    }

    private _setCursor(textChar: ActaTextChar | undefined, x?: number, ignoreEvent: boolean = false) {
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
        if (ignoreEvent) {
            this._cursor = position;
        } else {
            this.cursor = position;
        }
        return this.cursor;
    };

    private _getSelectedTextChars() {
        const textChars: ActaTextChar[] = [];
        if ([CursorMode.SELECTIONSTART, CursorMode.SELECTION].indexOf(this._cursorMode) > -1) {
            if (this.selectionStart !== null && this.cursor !== null) {
                let startpos = this.selectionStart;
                let endpos = this.cursor;

                if (startpos > endpos) [startpos, endpos] = [endpos, startpos];
                endpos--;

                for (let i = startpos; i <= endpos; i++) {
                    textChars.push(this.textChars[Math.min(i, this.textChars.length - 1)]);
                }
            }
        }
        return textChars;
    }

    private _hideCursor() {
        for (const svg of this.canvas) {
            for (const cursor of svg.querySelectorAll('.cursor')) {
                svg.removeChild(cursor);
            }
        }
    }

    private _repaintCursor() {
        this._hideCursor();
        if (this.cursor === null) return;

        if ([CursorMode.SELECTIONSTART, CursorMode.SELECTION].indexOf(this._cursorMode) > -1 && this.cursor !== this.selectionStart) {
            let currColumn: ActaParagraphColumn | undefined;
            let currLine = -1, startx = 0;
            let selBlock;

            const selTextChars = this._getSelectedTextChars();
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
        } else if (ActaParagraph.INPUT_METHOD !== InputMethod.EN && this._cursorMode === CursorMode.INPUT && this._inputChar !== '') {
            const textChar = this._getNearestVisableTextChar(this.textChars[this.cursor - 1]);
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

            if (this.cursor > this.textChars.length - 1) {
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
        let retTextChar: ActaTextChar | undefined;

        for (const textChar of this.textChars) {
            if (!textChar.isVisable || textChar.x < 0) continue;
            if (!textChar.textRow) continue;
            if (textChar.textRow.column !== column) continue;

            const itemX1 = textChar.x;
            const itemX2 = textChar.x + textChar.calcWidth;
            const itemY1 = textChar.y;
            const itemY2 = textChar.y + textChar.textRow.maxHeight + textChar.textRow.maxLeading;
            if (itemX1 <= x && itemX2 >= x && itemY1 <= y && itemY2 >= y) {
                retTextChar = textChar;
                break;
            }
        }

        if (!retTextChar) {
            const textRows: ActaTextRow[] = column.textRows;
            for (const textRow of textRows) {
                if (textRow.offsetTop === undefined) continue;

                const itemY1 = textRow.offsetTop;
                const itemY2 = textRow.offsetTop + textRow.maxHeight + textRow.maxLeading;
                if (itemY1 < y && itemY2 > y) {
                    let maxWidth = 0;
                    for (const textChars of textRow.items) maxWidth += textChars.calcWidth;
                    retTextChar = maxWidth <= x ? textRow.lastTextChar : textRow.firstTextChar;
                    break;
                }
            }
        }
        return retTextChar;
    }

    private _computeTextCharPosition() {
        let colIdx = 0;

        this.columns.forEach(col => col.clear());
        this._overflow = false;

        for (const textChar of this.textChars) {
            if (this._overflow) { textChar.textRow = null; continue; }

            while (1) {
                const col = this.columns[colIdx];
                if (!col) break;

                const lastRow = col.lastRow;
                if (lastRow) this.computeTextRowPaddingSize(lastRow, textChar);

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
            let textAttr: ActaTextAttributeAbsolute | undefined;
            let indexOfColumn = 0;
            if (lastCharIsNewline && this.lastTextChar !== null) {
                textAttr = this.lastTextChar.textAttribute;
                indexOfColumn = this.lastTextChar.textRow ? this.lastTextChar.indexOfColumn : 0;
            }
            textAttr = textstylemgr.get(this.defaultTextStyle);
            if (!textAttr || !textAttr.font || !textAttr.fontSize) return;

            const dummyRow = new ActaTextRow(this.columns[indexOfColumn], U.px(textAttr.indent) || 0);
            this.computeTextRowPaddingSize(dummyRow);
        }
    }

    private _drawTextChars() {
        this.columns.forEach(col => col.update());
    }

    private _getBoundingClientRect(textChar: ActaTextChar) {
        if (!textChar.textRow) return { x: 0, y: 0, width: 0, height: 0 };

        const clientRect = textChar.textRow.column.getScaledBoundingClientRect();
        return {
            x: textChar.x + clientRect.left,
            y: textChar.y + clientRect.top,
            width: textChar.calcWidth,
            height: textChar.height
        };
    }

    private _repaint() {
        this._computeTextCharPosition();
        this._drawTextChars();
        this._EMIT_CURSOR_REPAINT(true);
    }

    private _EMIT_REPAINT() {
        this._EVENT_PARAGRAPH$.next({ type: 'repaint' });
    }

    private _EMIT_CURSOR_REPAINT(force: boolean = false) {
        const textChars = this.textChars;
        const state = {
            cursorMode: this._cursorMode,
            cursorIndex: this.cursor,
            cursorCharID: (this.cursor && this.cursor < textChars.length) ? textChars[this.cursor].id : null,
            selectionStartIndex: this.selectionStart,
            selectionStartCharID: (this.selectionStart !== null && this.selectionStart < textChars.length) ? textChars[this.selectionStart].id : null,
            timestamp: force ? (new Date()).getTime() : 0
        };
        this._EVENT_PARAGRAPH$.next({ type: 'cursorrepaint', value: JSON.stringify(state) });
    }

    private _getOverlapAreaWithOtherFrames(textRow: ActaTextRow, height?: number) {
        const x1 = U.px(this.x) + textRow.column.offsetLeft;
        const y1 = U.px(this.y) + textRow.offsetTop;
        const x2 = x1 + textRow.columnWidth;
        const y2 = y1 + Math.max((height ? height : 0), textRow.maxHeight);

        const overlapAreas: IActaFrameOverlapArea[] = [];
        for (const frame of this.overlapFrames) {
            if (this.order >= frame.order) continue;
            const area = frame.computeOverlapArea(x1, y1, x2, y2);
            if (area) overlapAreas.push(area);
        }
        if (overlapAreas.length < 1) return null;

        let overlapX1 = overlapAreas[0].x[0];
        let overlapX2 = overlapAreas[0].x[1];

        for (const overlapArea of overlapAreas) {
            overlapX1 = Math.min(overlapArea.x[0], overlapX1);
            overlapX2 = Math.max(overlapArea.x[1], overlapX2);
        }
        return [overlapX1, overlapX2];
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

    private get cursor() {
        return this._cursor;
    }

    private set cursor(pos) {
        if (pos !== null && this._cursor !== pos) this._cursorTextAttribute = undefined;
        this._cursor = pos;
        if (pos !== null) this._CURSOR_MOVE$.next(pos);
    }

    private set selectionStart(pos) {
        if (pos !== null && this._selectionStart !== pos) this._cursorTextAttribute = undefined;
        this._selectionStart = pos;
        if (pos !== null) this._CURSOR_MOVE$.next(pos);
    }

    private get selectionStart() {
        return this._selectionStart;
    }

    private set editable(value) {
        this._editable = value;
        if (this._editable) {
            this.classList.add('editable');
            this._EVENT_PARAGRAPH$.next({ type: 'changeeditable', value: true });
        } else {
            this.classList.remove('editable');
            this._EVENT_PARAGRAPH$.next({ type: 'changeeditable', value: false });
        }
    }

    private get editable() {
        return this._editable;
    }

    protected _onOverlap() {
        this._EMIT_REPAINT();
    }

    protected _onFocus() {
        this._EMIT_CURSOR_REPAINT();
    }

    protected _onBlur() {
        this.selectionStart = null;
        this.cursor = null;
        this.editable = false;
        this._hideCursor();
    }

    constructor(
        x: string | number, y: string | number, width: string | number, height: string | number,
        defaultTextStyle: string, columnCount: number = 1, innerMargin: string | number = 0, columnWidths: string[] | number[] = []
    ) {
        super(x, y, width, height);

        this._EVENT_PARAGRAPH$ = new Subject();
        this._EVENT_PARAGRAPH$.pipe(filter(v => v.type === 'repaint'), debounceTime(.005)).subscribe(() => this._repaint());
        this._EVENT_PARAGRAPH$.pipe(filter(v => v.type === 'cursorrepaint' && v.value), map(v => v.value as string), distinctUntilChanged()).subscribe(() => this._repaintCursor());

        this._CURSOR_MOVE$ = new Subject();
        this._CURSOR_MOVE$.pipe(
            filter(pos => [CursorMode.INPUT, CursorMode.NONE].indexOf(this._cursorMode) < 0 && this.isFocused && this.editable),
            distinctUntilChanged()
        ).subscribe(pos => this._EVENT_PARAGRAPH$.next({ type: 'changecursor', value: pos }));

        this._columnCount = 1;
        this._innerMargin = 0;
        this._textStore = new ActaTextStore();

        if (!textstylemgr.get(defaultTextStyle)) throw new Error(`Invalid TextStyle Name. "${defaultTextStyle}"`);
        this._defaultTextStyle = defaultTextStyle;

        this._readonly = false;
        this._editable = false;
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

        this.value = '';

        this.onChangeSize = _ => this._EMIT_REPAINT();

        fromEvent<KeyboardEvent>(this, 'keydown').pipe(filter(e => {
            if (this.mode !== 'NONE') return false;
            if (!this.editable) return false;
            return true;
        })).subscribe(e => {
            if (this._onKeyPress(e) !== false) return;
            e.preventDefault();
            e.stopPropagation();
        });

        fromEvent<MouseEvent>(this, 'dblclick').pipe(filter(e => {
            if (this.mode !== 'NONE' || this.readonly || this.editable) return false;
            return true;
        })).subscribe(e => {
            const textChar = this._getTextCharAtPosition(e.target as ActaParagraphColumn, e.offsetX, e.offsetY);
            this._cursorMode = CursorMode.EDIT;
            this.editable = true;
            this._setCursor(textChar, e.offsetX);
            this._EMIT_CURSOR_REPAINT();
            this.focus({ preventScroll: true });

            e.preventDefault();
            e.stopPropagation();
        });

        let waitTripleClickTimer: boolean = false;
        fromEvent<MouseEvent>(this, 'mousedown').pipe(filter(e => {
            if (this.mode !== 'NONE') return false;
            if (!this.editable) {
                if (!this.readonly) this.focus({ preventScroll: true });
                return false;
            }
            if (!(e.target instanceof ActaParagraphColumn)) return false;
            if (document.activeElement !== this) {
                if (!this.readonly) this.focus({ preventScroll: true });
                return false;
            }
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
                    this.selectionStart = i;
                }
                for (let i = textChars.indexOf(evtTextChar); i < textChars.length; i++) {
                    if (breakType.indexOf(textChars[i].type) > -1) break;
                    this.cursor = i + 1;
                }
                this._cursorMode = CursorMode.SELECTION;
                this._EMIT_CURSOR_REPAINT();
            } else {
                const textChar = this._getTextCharAtPosition(e.target as ActaParagraphColumn, e.offsetX, e.offsetY);
                this._cursorMode = CursorMode.SELECTIONSTART;
                this.cursor = null;
                this.selectionStart = this._setCursor(textChar, e.offsetX, true);
                this._EMIT_CURSOR_REPAINT();
            }
            this.focus({ preventScroll: true });

            e.preventDefault();
            e.stopPropagation();
        });

        fromEvent<MouseEvent>(this, 'mousemove').pipe(filter(e => {
            if (this.mode !== 'NONE' || !this.editable || this.readonly) return false;
            if (this._cursorMode !== CursorMode.SELECTIONSTART) return false;
            if (!(e.target instanceof ActaParagraphColumn)) return false;
            if (e.buttons !== 1) return false;
            return true;
        })).subscribe(e => {
            const textChar = this._getTextCharAtPosition(e.target as ActaParagraphColumn, e.offsetX, e.offsetY);
            if (this.selectionStart != null) {
                this._setCursor(textChar, e.offsetX);
                this._EMIT_CURSOR_REPAINT();
            }
            e.preventDefault();
            e.stopPropagation();
        });

        fromEvent<MouseEvent>(this, 'mouseup').pipe(filter(e => {
            if (this.mode !== 'NONE' || !this.editable || this.readonly) return false;
            if (this._cursorMode !== CursorMode.SELECTIONSTART) return false;
            if (!(e.target instanceof ActaParagraphColumn)) return false;
            return true;
        })).subscribe(e => {
            const textChar = this._getTextCharAtPosition(e.target as ActaParagraphColumn, e.offsetX, e.offsetY);
            if (this.selectionStart != null) {
                this._setCursor(textChar, e.offsetX);
                this._EMIT_CURSOR_REPAINT();
            }
            if (this.cursor === null) {
                this._cursorMode = CursorMode.NONE;
                return false;
            } else if (this.cursor !== this.selectionStart && this.selectionStart) {
                this._cursorMode = CursorMode.SELECTION;
            } else {
                this._cursorMode = CursorMode.EDIT;
            }
            e.preventDefault();
            e.stopPropagation();
        });
    }

    columnWidth(idx: number, val: string | number) {
        if (arguments.length > 1) {
            this.columns[idx].setAttribute('width', (val || 0).toString());
            this._EMIT_CHANGE_SIZE();
        } else {
            return this.columns[idx].getAttribute('width') || false;
        }
    }

    computeTextRowPaddingSize(textRow: ActaTextRow, textChar?: ActaTextChar) {
        const defaultTextStyle = textstylemgr.get(this.defaultTextStyle);
        const textHeight = textChar ? textChar.height : U.px(defaultTextStyle.textHeight);
        const broken = this._getOverlapAreaWithOtherFrames(textRow, textHeight);
        if (broken) {
            if (broken[0] <= 0) {
                textRow.paddingLeft = broken[1];
            } else if (broken[1] >= textRow.columnWidth) {
                textRow.paddingRight = textRow.columnWidth - broken[0];
            } else {
                const upsideRow = textRow.indexOfLine > 0 ? textRow.column.textRows[textRow.indexOfLine - 1] : null;
                if (upsideRow && upsideRow.fragment) {
                    textRow.paddingLeft = broken[1];
                } else {
                    textRow.fragment = true;
                    textRow.paddingRight = textRow.columnWidth - broken[0];
                }
            }
        }
    }

    setTextStyleAtCursor(textStyle: string) {
        const selTextChars = this._getSelectedTextChars();
        this._setTextStyle(selTextChars, textStyle);
        this._EMIT_REPAINT();
    }

    getTextStyleAtCursor(frontOfCursor: boolean = false) {
        const textNodes: ActaTextNode[] = [];
        let retTextStyle: string;

        if (this._cursorMode === CursorMode.EDIT || this.cursor === this.selectionStart) {
            const cursorTextChar = this._getTextCharAtCursor(frontOfCursor);
            if (cursorTextChar) textNodes.push(cursorTextChar.textNode);
        } else {
            const selTextChars = this._getSelectedTextChars();
            if (selTextChars.length < 1) {
                const cursorTextChar = this._getTextCharAtCursor(frontOfCursor);
                if (cursorTextChar) textNodes.push(cursorTextChar.textNode);
            } else {
                for (const textChar of selTextChars) {
                    if (textNodes.indexOf(textChar.textNode) < 0) textNodes.push(textChar.textNode);
                }
            }
        }
        if (textNodes.length < 1) return this._defaultTextStyle;

        retTextStyle = textNodes[0].textStyle || this._defaultTextStyle;
        for (const textNode of textNodes) {
            if (retTextStyle !== (textNode.textStyle || this._defaultTextStyle)) retTextStyle = '';
        }
        return retTextStyle;
    }

    setTextAttributeAtCursor(textAttr: ActaTextAttribute, frontOfCursor: boolean = false) {
        if (this._cursorMode === CursorMode.EDIT || this.cursor === this.selectionStart) {
            if (textAttr.textAlign !== null) {
                const cursorTextChar = this._getTextCharAtCursor(frontOfCursor);
                if (cursorTextChar) this._setTextAlign([cursorTextChar], textAttr);
                this._cursorTextAttribute = textAttr;
            }
        } else {
            this._setTextAttribute(this._getSelectedTextChars(), textAttr);
            if (textAttr.textAlign !== null) {
                this._setTextAlign(this._getSelectedTextChars(), textAttr);
            }
        }
        this._EMIT_REPAINT();
    }

    getTextAttributeAtCursor(frontOfCursor: boolean = false) {
        const returnTextAttr = new ActaTextAttribute();
        const textNodes: ActaTextNode[] = [];

        if (this._cursorMode === CursorMode.EDIT || this.cursor === this.selectionStart) {
            const cursorTextChar = this._getTextCharAtCursor(frontOfCursor);
            if (cursorTextChar) textNodes.push(cursorTextChar.textNode);
        } else {
            const selTextChars = this._getSelectedTextChars();
            if (selTextChars.length < 1) {
                const cursorTextChar = this._getTextCharAtCursor(frontOfCursor);
                if (cursorTextChar) textNodes.push(cursorTextChar.textNode);
            } else {
                for (const textChar of selTextChars) {
                    if (textNodes.indexOf(textChar.textNode) < 0) textNodes.push(textChar.textNode);
                }
            }
        }
        if (textNodes.length < 1) {
            const defaultTextStyle = textstylemgr.get(this.defaultTextStyle);
            returnTextAttr.copy(defaultTextStyle);
            return returnTextAttr;
        }
        returnTextAttr.copy(textNodes[0].textAttribute);
        for (const textNode of textNodes) {
            const textAttr = textNode.textAttribute;
            if (returnTextAttr.font !== textAttr.font) returnTextAttr.font = null;
            if (returnTextAttr.fontSize !== textAttr.fontSize) returnTextAttr.fontSize = null;
            if (returnTextAttr.xscale !== textAttr.xscale) returnTextAttr.xscale = null;
            if (returnTextAttr.letterSpacing !== textAttr.letterSpacing) returnTextAttr.letterSpacing = null;
            if (returnTextAttr.lineHeight !== textAttr.lineHeight) returnTextAttr.lineHeight = null;
            if (returnTextAttr.textAlign !== textAttr.textAlign) returnTextAttr.textAlign = null;
            if (returnTextAttr.underline !== textAttr.underline) returnTextAttr.underline = null;
            if (returnTextAttr.strikeline !== textAttr.strikeline) returnTextAttr.strikeline = null;
            if (returnTextAttr.indent !== textAttr.indent) returnTextAttr.indent = null;
            if (returnTextAttr.colorId !== textAttr.colorId) returnTextAttr.colorId = null;
        }
        if (this._cursorTextAttribute) returnTextAttr.merge(this._cursorTextAttribute);

        return returnTextAttr;
    }

    preflight() {
        this._preflightProfiles = [];
        if (this._overflow) {
            this._preflightProfiles.push(new ActaParagraphOverflow(this));
        } else if (this.value === '') {
            this._preflightProfiles.push(new ActaParagraphEmpty(this));
        }
    }

    switchEditable(val: boolean) {
        if (!this.readonly && val) {
            this.cursor = 0;
            this._cursorMode = CursorMode.EDIT;
            this.editable = true;
            this._EMIT_CURSOR_REPAINT();
        } else {
            this.cursor = null;
            this._cursorMode = CursorMode.NONE;
            this.editable = false;
            this._hideCursor();
        }
        this.focus({ preventScroll: true });
    }

    set value(text: string) {
        if (this._textStore) this._textStore.remove();
        this._textStore = ActaTextStore.import(this.defaultTextStyle, text);
        this.cursor = null;
        this._EMIT_REPAINT();
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
        this._EMIT_CHANGE_SIZE();
    }

    set innerMargin(innerMargin) {
        this._innerMargin = innerMargin;
        for (const margin of this.querySelectorAll('x-paragraph-margin')) {
            margin.setAttribute('width', innerMargin.toString());
        }
        this._EMIT_CHANGE_SIZE();
    }

    set defaultTextStyle(styleName: string) {
        this._defaultTextStyle = styleName;
        if (this._textStore) this._textStore.textStyle = styleName;
    }

    set readonly(val: boolean) {
        this._readonly = val;
    }

    set onChangeCursor(handler: ((paragraph: ActaParagraph, pos: number) => void) | null) {
        if (this._subscriptionChangeCursor) this._subscriptionChangeCursor.unsubscribe();
        if (handler) {
            this._subscriptionChangeCursor = this._EVENT_PARAGRAPH$.pipe(
                filter(v => v.type === 'changecursor'),
                map(v => v.value as number)
            ).subscribe(pos => handler(this, pos));
        } else {
            this._subscriptionChangeCursor = undefined;
        }
    }

    set onChangeEditable(handler: ((paragraph: ActaParagraph, editable: boolean) => void) | null) {
        if (this._subscriptionChangeEditable) this._subscriptionChangeEditable.unsubscribe();
        if (handler) {
            this._subscriptionChangeEditable = this._EVENT_PARAGRAPH$.pipe(
                filter(v => v.type === 'changeeditable')
            ).subscribe(_ => handler(this, this.isEditable));
        } else {
            this._subscriptionChangeEditable = undefined;
        }
    }

    get columnCount() { return this._columnCount; }
    get innerMargin() { return this._innerMargin; }
    get value() { return this._textStore ? this._textStore.markupText : ''; }
    get defaultTextStyle() { return this._defaultTextStyle; }
    get readonly() { return this._readonly; }
    get isEditable() { return this.editable; }

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