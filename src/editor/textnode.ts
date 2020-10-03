import { ActaTextChar } from './textchar';
import { ActaTextStyleManager } from './textstylemgr';
import { ActaTextStyle, ActaTextStyleInherit } from './textstyle';
import { v4 as uuidv4 } from 'uuid';

export class ActaTextNode {
    private _id: string;
    private _tagname: string;
    private _defaultTextStyleName: string | null;
    private _customTextStyle: ActaTextStyleInherit;
    private _value: (ActaTextChar | ActaTextNode)[];
    private _modified: boolean | number[];
    private _parentNode: ActaTextNode | null;

    constructor(tagname: string = '') {
        this._id = uuidv4();
        this._tagname = tagname.toLowerCase();
        this._defaultTextStyleName = null;
        this._customTextStyle = new ActaTextStyleInherit();
        this._value = [];
        this._modified = true;
        this._parentNode = null;

        this._customTextStyle.onChanged = attr => this.changeTextStyle(attr);
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
        for (const oval of arrVal) this.modified = this._value.push(oval);
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
        for (const rVal of rVals) rVal.remove();

        this.modified = true;
    }

    insert(idx: number, val: string | ActaTextNode) {
        const arrVal: (ActaTextChar | ActaTextNode)[] = [];
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
        this.modified = true;
    }

    replace(idx: number, val: string | ActaTextNode) {
        if (typeof(val) === 'string') {
            this.remove(idx);
            this.insert(idx, val);
            this.modified = true;
        } else {
            if (this._value[idx] instanceof ActaTextNode) {
                const oldNode = this._value[idx] as ActaTextNode;
                if (oldNode.id === val.id) return;
            } else {
                this.modified = true;
            }
            val.parentNode = this;
            this._value[idx].remove();
            this._value[idx] = val;
        }
        this.modified = idx;
    }

    isModified(idx: number) {
        if (typeof(this._modified) === 'object') {
            if (this.value[idx] instanceof ActaTextNode) return false;
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

    set defaultTextStyleName(styleName: string | null) {
        if (this._defaultTextStyleName !== styleName) {
            this._defaultTextStyleName = styleName;
            this.modified = true;
            this.changeTextStyle();
        }
    }

    set customTextStyle(style: ActaTextStyleInherit) {
        if (this._customTextStyle !== style) {
            this._customTextStyle = style;
            this.modified = true;
            this.changeTextStyle();
        }
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
    set parentNode(node: ActaTextNode | null) { this._parentNode = node; }
    get parentNode() { return this._parentNode; }

    set value(values: (ActaTextChar | ActaTextNode)[]) {
        for (const val of values) {
            if (val instanceof ActaTextNode) val.parentNode = this;
        }
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

    get textStyle() {
        const defaultTextStyle = ActaTextStyleManager.getInstance().get(this.defaultTextStyleName || '');
        const returnTextStyle = new ActaTextStyle(defaultTextStyle.fontName);

        if (this.parentNode) returnTextStyle.merge(this.parentNode.textStyle);
        if (defaultTextStyle) returnTextStyle.merge(defaultTextStyle);
        returnTextStyle.merge(this.customTextStyle);

        return returnTextStyle;
    }
};

// tslint:disable-next-line: max-classes-per-file
export class ActaTextStore extends ActaTextNode {};