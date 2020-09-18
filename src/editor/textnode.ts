import { ActaTextStyle } from './textstyle';
import { v4 as uuidv4 } from 'uuid';
import { ActaTextStyleManager } from './textstylemgr';

export class ActaTextNode {
    private _id: string;
    private _tagname: string;
    private _defaultTextStyleName: string | null;
    private _customTextStyle: ActaTextStyle;
    private _value: any[];
    private _modified: boolean;

    constructor(tagname: string = '') {
        this._id = uuidv4();
        this._tagname = tagname.toLowerCase();
        this._defaultTextStyleName = null;
        this._customTextStyle = new ActaTextStyle(true);
        this._value = [];
        this._modified = true;
    }

    add(val: any) {
        this._value.push(val);
        this.modified = true;
    }

    remove(idx?: number) {
        if (idx !== undefined) {
            this._value.splice(idx, 1);
        } else {
            this._value = [];
        }
        this.modified = true;
    }

    edit(idx: number, val: any) {
        this._value[idx] = val;
        this.modified = true;
    }

    appliedTextStyle(parentTextStyle: ActaTextStyle) {
        const textStyle = new ActaTextStyle(true);
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

    set defaultTextStyleName(styleName: string | null) {
        this._defaultTextStyleName = styleName;
        this.modified = true;
    }

    set customTextStyle(style: ActaTextStyle) {
        this._customTextStyle = style;
        this.modified = true;
    }

    set value(values: any[]) { this._value = values; }
    set modified(val) { this._modified = val; }

    get tagName() { return this._tagname; }
    get id() { return this._id; }
    get defaultTextStyleName() { return this._defaultTextStyleName; }
    get customTextStyle() { return this._customTextStyle; }
    get modified() { return this._modified; }
    get value() { return this._value; }
    get length() { return this.value.length; }
};