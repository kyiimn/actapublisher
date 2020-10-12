import { ActaTextChar } from './textchar';
import { ActaTextStyleManager } from './textstylemgr';
import { ActaTextStyle, ActaTextStyleInherit } from './textstyle';
import { v4 as uuidv4 } from 'uuid';
import { Subscription } from 'rxjs';

export class ActaTextNode {
    private _id: string;
    private _tagname: string;
    private _value: (ActaTextChar | ActaTextNode)[];
    private _parentNode: ActaTextNode | null;

    private _defaultTextStyle: ActaTextStyle | null;
    private _defaultTextStyle$: Subscription | null;
    private _customTextStyle: ActaTextStyleInherit;

    constructor(tagname: string = 'x-style') {
        this._id = uuidv4();
        this._tagname = tagname.toLowerCase();
        this._value = [];
        this._parentNode = null;

        this._defaultTextStyle = null;
        this._defaultTextStyle$ = null;

        this._customTextStyle = new ActaTextStyleInherit();
        this._customTextStyle.subscribe((attr: string) => this.changeTextStyle(attr));
    }

    changeTextStyle(attr?: string) {
        for (const val of this._value) {
            val.changeTextStyle(attr);
        }
    }

    push(val: string | ActaTextNode) {
        const arrVal: (ActaTextChar | ActaTextNode)[] = [];
        if (val instanceof ActaTextNode) {
            val.parentNode = this;
            arrVal.push(val);
        } else {
            for (const s of val) {
                arrVal.push(new ActaTextChar(s, this));
            }
        }
        for (const oval of arrVal) {
            this._value.push(oval);
        }
    }

    remove(idx?: number | ActaTextChar) {
        let rVals: (ActaTextChar | ActaTextNode)[];
        if (idx !== undefined) {
            if (idx instanceof ActaTextChar) idx = idx.indexOfNode;

            rVals = [this._value[idx]];
            this._value.splice(idx, 1);
        } else {
            rVals = this._value;
            this._value = [];
        }
        for (const rVal of rVals) {
            rVal.remove();
        }
    }

    insert(idx: ActaTextChar | number, val: string | ActaTextNode) {
        const arrVal: (ActaTextChar | ActaTextNode)[] = [];
        if (idx instanceof ActaTextChar) idx = this._value.indexOf(idx);
        if (idx < 0) return;

        if (val instanceof ActaTextNode) {
            val.parentNode = this;
            arrVal.push(val);
        } else {
            for (const s of val) {
                arrVal.push(new ActaTextChar(s, this));
            }
        }
        for (let i = 0; i < arrVal.length; i++) {
            this._value.splice(idx + i, 0, arrVal[i]);
        }
    }

    replace(idx: (ActaTextChar | ActaTextNode)[] | number, val: string | ActaTextNode) {
        if (typeof(idx) === 'object') {
            let firstIdx = -1;
            for (const target of idx) {
                if (this._value.indexOf(target) > firstIdx && firstIdx !== -1) continue;
                firstIdx = this._value.indexOf(target);
            }
            if (firstIdx < 0) return;

            for (const target of idx) {
                if (target instanceof ActaTextNode) {
                    if (target.parentNode === this) target.remove();
                } else {
                    if (target.textNode === this) target.remove();
                }
            }
            this.insert(firstIdx, val);
        } else if (typeof(val) === 'string') {
            this.remove(idx);
            this.insert(idx, val);
        } else {
            if (this._value[idx] instanceof ActaTextNode) {
                const oldNode = this._value[idx] as ActaTextNode;
                if (oldNode.id === val.id) return;
            }
            val.parentNode = this;
            this._value[idx].remove();
            this._value[idx] = val;
        }
    }

    toString() {
        let str = '';
        for (const val of this.value) {
            str += val.toString();
        }
        return str;
    }

    toArray() {
        let returnArray: ActaTextChar[] = [];
        for (const val of this._value) {
            if (val instanceof ActaTextChar) {
                returnArray.push(val);
            } else {
                returnArray = returnArray.concat(val.toArray());
            }
        }
        return returnArray;
    }

    set defaultTextStyle(textStyle: ActaTextStyle | null) {
        if (textStyle && this._defaultTextStyle) {
            if (textStyle.name === this._defaultTextStyle.name) return;
        } else if (!textStyle && !this._defaultTextStyle) return;

        if (this._defaultTextStyle$) this._defaultTextStyle$.unsubscribe();
        this._defaultTextStyle = textStyle;
        if (this._defaultTextStyle) {
            this._defaultTextStyle$ = this._defaultTextStyle.subscribe((attr: string) => this.changeTextStyle(attr));
        } else {
            this._defaultTextStyle$ = null;
        }
        this.changeTextStyle();
    }

    set defaultTextStyleName(styleName: string | null) {
        if (!styleName) {
            this.defaultTextStyle = null;
            return;
        }
        this.defaultTextStyle = ActaTextStyleManager.in.get(styleName);
    }

    set customTextStyle(style: ActaTextStyleInherit) {
        if (this._customTextStyle !== style) {
            this._customTextStyle.copy(style);
        }
    }

    set parentNode(node: ActaTextNode | null) { this._parentNode = node; }
    get parentNode() { return this._parentNode; }

    set value(values: (ActaTextChar | ActaTextNode)[]) {
        for (const val of values) {
            if (val instanceof ActaTextNode) val.parentNode = this;
        }
        this._value = values;
    }
    get tagName() { return this._tagname; }
    get id() { return this._id; }
    get defaultTextStyle() { return this._defaultTextStyle; }
    get customTextStyle() { return this._customTextStyle; }
    get value() { return this._value; }
    get length() { return this.value.length; }

    get textStyle() {
        const returnTextStyle = new ActaTextStyle((this.defaultTextStyle ? this.defaultTextStyle.fontName : '') || '');
        if (this.parentNode) returnTextStyle.merge(this.parentNode.textStyle);
        if (this.defaultTextStyle) returnTextStyle.merge(this.defaultTextStyle);
        returnTextStyle.merge(this.customTextStyle);
        return returnTextStyle;
    }

    get markupText() {
        let returnValue = '';
        for (const item of this.value) {
            returnValue += item.markupText;
        }
        const styleText = this.customTextStyle.toString();
        if (this.defaultTextStyleName || styleText !== '') {
            let tag = `<${this.tagName}`;
            if (this.defaultTextStyleName) tag += ` name="${this.defaultTextStyleName}"`;
            if (styleText !== '') tag += ` ${styleText}`;
            tag += '>';
            returnValue = `${tag}${returnValue}</${this.tagName}>`;
        }
        return returnValue;
    }
};