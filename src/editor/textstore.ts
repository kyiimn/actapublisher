import { ActaTextStyleManager } from './textstylemgr';
import { ActaTextStyle, ActaTextStyleInherit } from './textstyle';
import { v4 as uuidv4 } from 'uuid';

export class ActaTextStore {
    private _id: string;
    private _tagname: string;
    private _defaultTextStyleName: string | null;
    private _customTextStyle: ActaTextStyle;
    private _value: (string | ActaTextNode)[];
    private _modified: boolean | number[];

    constructor(tagname: string = '') {
        this._id = uuidv4();
        this._tagname = tagname.toLowerCase();
        this._defaultTextStyleName = null;
        this._customTextStyle = new ActaTextStyleInherit();
        this._value = [];
        this._modified = true;
    }

    push(val: string | ActaTextNode) {
        this.modified = this._value.push(val);
    }

    remove(idx?: number) {
        if (idx !== undefined) {
            this._value.splice(idx, 1);
        } else {
            this._value = [];
        }
        this.modified = true;
    }

    insert(idx: number, val: string | ActaTextNode) {
        this._value.splice(idx, 0, val);
        this.modified = true;
    }

    replace(idx: number, val: string | ActaTextNode) {
        if (typeof(val) === 'string') {
            if (typeof(this._value[idx]) === 'string') {
                if (this._value[idx] === val) return;
            } else {
                this.modified = true;
            }
        } else {
            if (this._value[idx] instanceof ActaTextNode) {
                const oldNode = this._value[idx] as ActaTextNode;
                if (oldNode.id === val.id) return;
            } else {
                this.modified = true;
            }
        }
        this._value[idx] = val;
        this.modified = idx;
    }

    appliedTextStyle(parentTextStyle: ActaTextStyle) {
        const textStyle = new ActaTextStyleInherit();
        let defaultTextStyle = ActaTextStyleManager.getInstance().get(this.defaultTextStyleName || '');
        if (!defaultTextStyle) defaultTextStyle = textStyle;

        textStyle.font = this.customTextStyle.font || defaultTextStyle.font || parentTextStyle.font;
        textStyle.fontSize = this.customTextStyle.fontSize || defaultTextStyle.fontSize || parentTextStyle.fontSize;
        textStyle.xscale = this.customTextStyle.xscale || defaultTextStyle.xscale || parentTextStyle.xscale;
        textStyle.letterSpacing = this.customTextStyle.letterSpacing || defaultTextStyle.letterSpacing || parentTextStyle.letterSpacing;
        textStyle.lineHeight = this.customTextStyle.lineHeight || defaultTextStyle.lineHeight || parentTextStyle.lineHeight;
        textStyle.textAlign = this.customTextStyle.textAlign || defaultTextStyle.textAlign || parentTextStyle.textAlign;
        textStyle.underline = this.customTextStyle.underline || defaultTextStyle.underline || parentTextStyle.underline;
        textStyle.strikeline = this.customTextStyle.strikeline || defaultTextStyle.strikeline || parentTextStyle.strikeline;
        textStyle.indent = this.customTextStyle.indent || defaultTextStyle.indent || parentTextStyle.indent;
        textStyle.color = this.customTextStyle.color || defaultTextStyle.color || parentTextStyle.color;

        return textStyle;
    }

    isModified(idx: number) {
        if (typeof(this._modified) === 'object') {
            if (typeof(this.value[idx]) !== 'string') return false;
            return this._modified.indexOf(idx) < 0 ? false : true;
        } if (this._modified === true) {
            return true;
        }
        return false;
    }

    toString() {
        let str = '';
        for (const val of this.value) {
            str += val.toString();
        }
        return str;
    }

    set defaultTextStyleName(styleName: string | null) {
        this._defaultTextStyleName = styleName;
        this.modified = true;
    }

    set customTextStyle(style: ActaTextStyle) {
        this._customTextStyle = style;
        this.modified = true;
    }

    set modified(val: number[] | number | boolean) {
        if (typeof(val) === 'boolean') {
            this._modified = val;
        } else if (typeof(val) === 'object') {
            if (this._modified === false) {
                this._modified = val;
            } else if (typeof(this._modified) === 'object') {
                this._modified = this._modified.concat(val);
            }
        } else {
            if (this._modified === false) {
                this._modified = [val];
            } else if (typeof(this._modified) === 'object') {
                this._modified.push(val);
            }
        }
    }
    set value(values: any[]) {
        this._value = values;
        this.modified = true;
    }
    get tagName() { return this._tagname; }
    get id() { return this._id; }
    get defaultTextStyleName() { return this._defaultTextStyleName; }
    get customTextStyle() { return this._customTextStyle; }
    get modified() { return this._modified === false ? false : true; }
    get partModified() { return typeof(this._modified) === 'object' ? true : false; }
    get value() { return this._value; }
    get length() { return this.value.length; }
};

// tslint:disable-next-line: max-classes-per-file
export class ActaTextNode extends ActaTextStore {};