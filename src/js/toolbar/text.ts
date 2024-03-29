import IActaToolbar from './toolbar';

import fontmgr from '../pageobject/font/fontmgr';
import textstylemgr from '../pageobject/textstyle/textstylemgr';
import message from '../ui/message';
import formbuilder, { ActaUIFormInputItem, ActaUIFormButtonItem } from '../ui/form';
import accountInfo from '../info/account';
import U from '../util/units';

import { TextAlign } from '../pageobject/textstyle/textattribute-absolute';
import { IActaEditorTextAttribute } from '../editor/editor';
import { merge, Subject } from 'rxjs';
import { map } from 'rxjs/operators';

type CHANGE_ATTR = 'textstyle' | 'font' | 'fontsize' | 'indent' | 'xscale' | 'letterspacing' | 'lineheight' | 'underline' | 'strikeline' | 'align';

class ActaToolbarText extends IActaToolbar {
    private _itemTextStyle!: ActaUIFormInputItem;
    private _itemFont!: ActaUIFormInputItem;
    private _itemFontSize!: ActaUIFormInputItem;
    private _itemIndent!: ActaUIFormInputItem;
    private _itemXScale!: ActaUIFormInputItem;
    private _itemLetterSpacing!: ActaUIFormInputItem;
    private _itemLineHeight!: ActaUIFormInputItem;
    private _itemUnderline!: ActaUIFormButtonItem;
    private _itemStrikeline!: ActaUIFormButtonItem;
    private _itemAlignLeft!: ActaUIFormButtonItem;
    private _itemAlignCenter!: ActaUIFormButtonItem;
    private _itemAlignRight!: ActaUIFormButtonItem;
    private _itemAlignJustify!: ActaUIFormButtonItem;

    private _CHANGE$!: Subject<{ attr: CHANGE_ATTR; value: IActaEditorTextAttribute; }>;

    protected _initToolbar() {
        this._CHANGE$ = new Subject();

        this.el.classList.add('text');

        this._itemTextStyle = formbuilder.combobox({ items: [], width: '10em' });
        this._itemFont = formbuilder.combobox({ items: [], width: '7em' });
        this._itemFontSize = formbuilder.inputNumber({ label: message.TOOLBAR.TEXT_SIZE, width: '4.2em', step: .01, min: 0 });
        this._itemIndent = formbuilder.inputNumber({ label: message.TOOLBAR.TEXT_INDENT, width: '4.2em', step: .01, min: 0 });
        this._itemXScale = formbuilder.inputNumber({ label: message.TOOLBAR.TEXT_XSCALE, suffix: '%', width: '4.2em', min: 0 });
        this._itemLetterSpacing = formbuilder.inputNumber({ label: message.TOOLBAR.TEXT_LETTERSPACING, width: '4em', step: .01 });
        this._itemLineHeight = formbuilder.inputNumber({ label: message.TOOLBAR.TEXT_LINEHEIGHT, suffix: '%', width: '4.2em', min: 0 });
        this._itemUnderline = formbuilder.iconButton({ icon: 'format_underlined', icontype: 'material', label: message.TOOLBAR.TEXT_UNDERLINE });
        this._itemStrikeline = formbuilder.iconButton({ icon: 'format_strikethrough', icontype: 'material', label: message.TOOLBAR.TEXT_STRIKELINE });
        this._itemAlignLeft = formbuilder.iconButton({ icon: 'format_align_left', icontype: 'material', label: message.TOOLBAR.TEXT_ALIGN_LEFT });
        this._itemAlignCenter = formbuilder.iconButton({ icon: 'format_align_center', icontype: 'material', label: message.TOOLBAR.TEXT_ALIGN_CENTER });
        this._itemAlignRight = formbuilder.iconButton({ icon: 'format_align_right', icontype: 'material', label: message.TOOLBAR.TEXT_ALIGN_RIGHT });
        this._itemAlignJustify = formbuilder.iconButton({ icon: 'format_align_justify', icontype: 'material', label: message.TOOLBAR.TEXT_ALIGN_JUSTIFY });

        this._itemAlignLeft.value = true;

        this.el.appendChild(this._itemTextStyle.el);
        this.el.appendChild(this._itemFont.el);
        this.el.appendChild(this._itemFontSize.el);
        this.el.appendChild(formbuilder.separater);
        this.el.appendChild(this._itemIndent.el);
        this.el.appendChild(this._itemXScale.el);
        this.el.appendChild(this._itemLetterSpacing.el);
        this.el.appendChild(this._itemLineHeight.el);
        this.el.appendChild(formbuilder.separater);
        this.el.appendChild(this._itemUnderline.el);
        this.el.appendChild(this._itemStrikeline.el);
        this.el.appendChild(formbuilder.separater);
        this.el.appendChild(this._itemAlignLeft.el);
        this.el.appendChild(this._itemAlignCenter.el);
        this.el.appendChild(this._itemAlignRight.el);
        this.el.appendChild(this._itemAlignJustify.el);
    }

    protected _initEvent() {
        fontmgr.observable.subscribe(list => {
            this._itemFont.input.innerHTML = '';
            for (const font of list) {
                const option = document.createElement('option');
                option.value = font.name;
                option.innerHTML = font.name;
                this._itemFont.input.append(option);
            }
        });

        textstylemgr.observable.subscribe(list => {
            const oldValue = this._itemTextStyle.value;
            this._itemTextStyle.input.innerHTML = '';
            for (const name of Object.keys(list)) {
                const option = document.createElement('option');
                option.value = name;
                option.innerHTML = name;
                this._itemTextStyle.input.append(option);
            }
            if (this._itemTextStyle.value !== oldValue && oldValue === '') {
                this._changeTextStyle(this._itemTextStyle.value);
            }
        });

        this._itemTextStyle.observable.subscribe((data: { value: string; }) => {
            this._changeTextStyle(data.value);
            this._changeValues('textstyle');
        });
        this._itemUnderline.observable.subscribe((_: any) => {
            this._itemUnderline.value = !this._itemUnderline.value;
            this._changeValues('underline');
        });
        this._itemStrikeline.observable.subscribe((_: any) => {
            this._itemStrikeline.value = !this._itemStrikeline.value;
            this._changeValues('strikeline');
        });
        merge<CHANGE_ATTR>(
            this._itemFont.observable.pipe(map(_ => 'font')),
            this._itemFontSize.observable.pipe(map(_ => 'fontsize')),
            this._itemIndent.observable.pipe(map(_ => 'indent')),
            this._itemXScale.observable.pipe(map(_ => 'xscale')),
            this._itemLetterSpacing.observable.pipe(map(_ => 'letterspacing')),
            this._itemLineHeight.observable.pipe(map(_ => 'lineheight'))
        ).subscribe(type => {
            this._changeValues(type);
        });
        merge(
            this._itemAlignJustify.observable.pipe(map(_ => TextAlign.JUSTIFY)), this._itemAlignLeft.observable.pipe(map(_ => TextAlign.LEFT)),
            this._itemAlignCenter.observable.pipe(map(_ => TextAlign.CENTER)), this._itemAlignRight.observable.pipe(map(_ => TextAlign.RIGHT))
        ).subscribe(align => {
            this._itemAlignJustify.value = align === TextAlign.JUSTIFY ? true : false;
            this._itemAlignLeft.value = align === TextAlign.LEFT ? true : false;
            this._itemAlignCenter.value = align === TextAlign.CENTER ? true : false;
            this._itemAlignRight.value = align === TextAlign.RIGHT ? true : false;
            this._changeValues('align');
        });
    }

    private _changeTextStyle(name: string) {
        const textstyle = textstylemgr.get(name);
        if (!textstyle) return;

        const unit = accountInfo.textUnitType;

        this._itemFont.value = textstyle.fontName;
        this._itemFontSize.value = U.convert(unit, textstyle.fontSize).toFixed(2);
        this._itemIndent.value = U.convert(unit, textstyle.indent).toFixed(2);
        this._itemXScale.value = (textstyle.xscale * 100).toString();
        this._itemLetterSpacing.value = U.convert(unit, textstyle.letterSpacing).toFixed(2);
        this._itemLineHeight.value = (textstyle.lineHeight * 100).toString();
        this._itemUnderline.value = textstyle.underline;
        this._itemStrikeline.value = textstyle.strikeline;
        this._itemAlignJustify.value = textstyle.textAlign === TextAlign.JUSTIFY ? true : false;
        this._itemAlignLeft.value = textstyle.textAlign === TextAlign.LEFT ? true : false;
        this._itemAlignCenter.value = textstyle.textAlign === TextAlign.CENTER ? true : false;
        this._itemAlignRight.value = textstyle.textAlign === TextAlign.RIGHT ? true : false;
    }

    private _changeValues(attr: CHANGE_ATTR) {
        if (this.data) this._CHANGE$.next({ attr, value: this.data });
    }

    enable() {
        this._itemTextStyle.disabled = false;
        this._itemFont.disabled = false;
        this._itemFontSize.disabled = false;
        this._itemIndent.disabled = false;
        this._itemXScale.disabled = false;
        this._itemLetterSpacing.disabled = false;
        this._itemLineHeight.disabled = false;
        this._itemUnderline.disabled = false;
        this._itemStrikeline.disabled = false;
        this._itemAlignLeft.disabled = false;
        this._itemAlignCenter.disabled = false;
        this._itemAlignRight.disabled = false;
        this._itemAlignJustify.disabled = false;

        this.disabled = false;
    }

    disable() {
        this._itemTextStyle.disabled = true;
        this._itemFont.disabled = true;
        this._itemFontSize.disabled = true;
        this._itemIndent.disabled = true;
        this._itemXScale.disabled = true;
        this._itemLetterSpacing.disabled = true;
        this._itemLineHeight.disabled = true;
        this._itemUnderline.disabled = true;
        this._itemStrikeline.disabled = true;
        this._itemAlignLeft.disabled = true;
        this._itemAlignCenter.disabled = true;
        this._itemAlignRight.disabled = true;
        this._itemAlignJustify.disabled = true;

        this.disabled = true;
    }

    set data(data: IActaEditorTextAttribute | null) {
        const unit = accountInfo.textUnitType;

        if (data) {
            if (data.textStyle !== undefined) {
                this._itemTextStyle.value = data.textStyle;
                this._changeTextStyle(data.textStyle);
            }
            this._itemFont.value = data.fontName === undefined ? '' : data.fontName;
            this._itemFontSize.value = data.fontSize === undefined ? '' : U.convert(unit, data.fontSize).toFixed(2);
            this._itemIndent.value = data.indent === undefined ? '' : U.convert(unit, data.indent).toFixed(2);
            this._itemXScale.value = data.xscale === undefined ? '' : (data.xscale * 100).toString();
            this._itemLetterSpacing.value = data.letterSpacing === undefined ? '' : U.convert(unit, data.letterSpacing).toFixed(2);
            this._itemLineHeight.value = data.lineHeight === undefined ? '' : (data.lineHeight * 100).toString();
            if (data.underline !== undefined) this._itemUnderline.value = data.underline;
            if (data.strikeline !== undefined) this._itemStrikeline.value = data.strikeline;
            this._itemAlignJustify.value = data.textAlign === TextAlign.JUSTIFY ? true : false;
            this._itemAlignLeft.value = data.textAlign === TextAlign.LEFT ? true : false;
            this._itemAlignCenter.value = data.textAlign === TextAlign.CENTER ? true : false;
            this._itemAlignRight.value = data.textAlign === TextAlign.RIGHT ? true : false;
            this.enable();
        } else {
            this._itemTextStyle.value = '';
            this._itemFont.value = '';
            this._itemFontSize.value = '';
            this._itemIndent.value = '';
            this._itemXScale.value = '';
            this._itemLetterSpacing.value = '';
            this._itemLineHeight.value = '';
            this._itemUnderline.value = false;
            this._itemStrikeline.value = false;
            this._itemAlignJustify.value = false;
            this._itemAlignLeft.value = false;
            this._itemAlignCenter.value = false;
            this._itemAlignRight.value = false;
            this.disable();
        }
    }

    get data() {
        const data: IActaEditorTextAttribute = {};
        const unit = accountInfo.textUnitType;

        data.textStyle = this._itemTextStyle.value !== '' ? this._itemTextStyle.value : undefined;
        data.fontName = this._itemFont.value !== '' ? this._itemFont.value : undefined;
        data.fontSize = this._itemFontSize.value !== '' ? U.pt(this._itemFontSize.value, unit) : undefined;
        data.indent = this._itemIndent.value !== '' ? U.pt(this._itemIndent.value, unit) : undefined;
        data.xscale = this._itemXScale.value !== '' ? parseFloat(this._itemXScale.value) / 100 : undefined;
        data.letterSpacing = this._itemLetterSpacing.value !== '' ? U.pt(this._itemLetterSpacing.value, unit) : undefined;
        data.lineHeight = this._itemLineHeight.value !== '' ? parseFloat(this._itemLineHeight.value) / 100 : undefined;
        data.underline = this._itemUnderline.value;
        data.strikeline = this._itemStrikeline.value;

        if (this._itemAlignJustify.value) data.textAlign = TextAlign.JUSTIFY;
        if (this._itemAlignLeft.value) data.textAlign = TextAlign.LEFT;
        if (this._itemAlignCenter.value) data.textAlign = TextAlign.CENTER;
        if (this._itemAlignRight.value) data.textAlign = TextAlign.RIGHT;

        return data;
    }

    get observable() { return this._CHANGE$; }
}
export default ActaToolbarText;