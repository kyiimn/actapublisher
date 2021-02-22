import fontmgr from '../pageobject/font/fontmgr';
import textstylemgr from '../pageobject/textstyle/textstylemgr';
import message from '../ui/message';
import formbuilder from '../ui/form';
import accountInfo from '../info/account';
import U from '../util/units';

import { TextAlign } from '../pageobject/textstyle/textstyle';
import { ParagraphVAlign} from '../pageobject/paragraph';
import { IActaEditorTextAttribute } from '../editor/editor';
import { merge, Subject } from 'rxjs';
import { map } from 'rxjs/operators';

class ActaToolbarText {
    private _toolbar: HTMLUListElement;
    private _itemTextStyle;
    private _itemFont;
    private _itemFontSize;
    private _itemIndent;
    private _itemXScale;
    private _itemLetterSpacing;
    private _itemLineHeight;
    private _itemUnderline;
    private _itemStrikeline;
    private _itemAlignLeft;
    private _itemAlignCenter;
    private _itemAlignRight;
    private _itemAlignJustify;
    private _itemVAlignTop;
    private _itemVAlignMiddle;
    private _itemVAlignBottom;
    private _itemVAlignJustify;

    private _disabled: boolean;

    private _CHANGE$: Subject<IActaEditorTextAttribute>;

    constructor() {
        this._CHANGE$ = new Subject();

        this._disabled = false;

        this._toolbar = document.createElement('ul');
        this._toolbar.classList.add('toolbar');
        this._toolbar.classList.add('text');

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
        this._itemVAlignTop = formbuilder.iconButton({ icon: 'vertical_align_top', icontype: 'material', label: message.TOOLBAR.TEXT_VALIGN_TOP });
        this._itemVAlignMiddle = formbuilder.iconButton({ icon: 'vertical_align_center', icontype: 'material', label: message.TOOLBAR.TEXT_VALIGN_MIDDLE });
        this._itemVAlignBottom = formbuilder.iconButton({ icon: 'vertical_align_bottom', icontype: 'material', label: message.TOOLBAR.TEXT_VALIGN_BOTTOM });
        this._itemVAlignJustify = formbuilder.iconButton({ icon: 'vertical_distribute', icontype: 'material', label: message.TOOLBAR.TEXT_VALIGN_JUSTIFY });

        this._itemAlignLeft.value = true;
        this._itemVAlignTop.value = true;

        this._toolbar.appendChild(this._itemTextStyle.el);
        this._toolbar.appendChild(this._itemFont.el);
        this._toolbar.appendChild(this._itemFontSize.el);
        this._toolbar.appendChild(formbuilder.separater);
        this._toolbar.appendChild(this._itemIndent.el);
        this._toolbar.appendChild(this._itemXScale.el);
        this._toolbar.appendChild(this._itemLetterSpacing.el);
        this._toolbar.appendChild(this._itemLineHeight.el);
        this._toolbar.appendChild(formbuilder.separater);
        this._toolbar.appendChild(this._itemUnderline.el);
        this._toolbar.appendChild(this._itemStrikeline.el);
        this._toolbar.appendChild(formbuilder.separater);
        this._toolbar.appendChild(this._itemAlignLeft.el);
        this._toolbar.appendChild(this._itemAlignCenter.el);
        this._toolbar.appendChild(this._itemAlignRight.el);
        this._toolbar.appendChild(this._itemAlignJustify.el);
        this._toolbar.appendChild(formbuilder.separater);
        this._toolbar.appendChild(this._itemVAlignTop.el);
        this._toolbar.appendChild(this._itemVAlignMiddle.el);
        this._toolbar.appendChild(this._itemVAlignBottom.el);
        this._toolbar.appendChild(this._itemVAlignJustify.el);

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

        this._itemTextStyle.observable.subscribe(data => {
            this._changeTextStyle(data.value);
            this._changeValues();
        });
        this._itemUnderline.observable.subscribe(_ => {
            this._itemUnderline.value = !this._itemUnderline.value;
            this._changeValues();
        });
        this._itemStrikeline.observable.subscribe(_ => {
            this._itemStrikeline.value = !this._itemStrikeline.value;
            this._changeValues();
        });
        merge(
            this._itemFont.observable, this._itemFontSize.observable, this._itemIndent.observable, this._itemXScale.observable,
            this._itemLetterSpacing.observable, this._itemLineHeight.observable
        ).subscribe(_ => {
            this._changeValues();
        });
        merge(
            this._itemAlignJustify.observable.pipe(map(_ => TextAlign.JUSTIFY)), this._itemAlignLeft.observable.pipe(map(_ => TextAlign.LEFT)),
            this._itemAlignCenter.observable.pipe(map(_ => TextAlign.CENTER)), this._itemAlignRight.observable.pipe(map(_ => TextAlign.RIGHT))
        ).subscribe(align => {
            this._itemAlignJustify.value = align === TextAlign.JUSTIFY ? true : false;
            this._itemAlignLeft.value = align === TextAlign.LEFT ? true : false;
            this._itemAlignCenter.value = align === TextAlign.CENTER ? true : false;
            this._itemAlignRight.value = align === TextAlign.RIGHT ? true : false;
            this._changeValues();
        });
        merge(
            this._itemVAlignTop.observable.pipe(map(_ => ParagraphVAlign.TOP)), this._itemVAlignMiddle.observable.pipe(map(_ => ParagraphVAlign.MIDDLE)),
            this._itemVAlignBottom.observable.pipe(map(_ => ParagraphVAlign.BOTTOM)), this._itemVAlignJustify.observable.pipe(map(_ => ParagraphVAlign.JUSTIFY))
        ).subscribe(align => {
            this._itemVAlignTop.value = align === ParagraphVAlign.TOP ? true : false;
            this._itemVAlignMiddle.value = align === ParagraphVAlign.MIDDLE ? true : false;
            this._itemVAlignBottom.value = align === ParagraphVAlign.BOTTOM ? true : false;
            this._itemVAlignJustify.value = align === ParagraphVAlign.JUSTIFY ? true : false;
            this._changeValues();
        });
    }

    private _changeTextStyle(name: string) {
        const textstyle = textstylemgr.get(name);
        if (!textstyle) return;

        const unit = accountInfo.prefTextUnitType;

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

    private _changeValues() {
        this._CHANGE$.next(this.data);
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
        this._itemVAlignTop.disabled = false;
        this._itemVAlignMiddle.disabled = false;
        this._itemVAlignBottom.disabled = false;
        this._itemVAlignJustify.disabled = false;

        this._disabled = false;
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
        this._itemVAlignTop.disabled = true;
        this._itemVAlignMiddle.disabled = true;
        this._itemVAlignBottom.disabled = true;
        this._itemVAlignJustify.disabled = true;

        this._disabled = true;
    }

    set data(data: IActaEditorTextAttribute) {
        const unit = accountInfo.prefTextUnitType;

        if (data.textStyleName !== undefined) {
            this._itemTextStyle.value = data.textStyleName;
            this._changeTextStyle(data.textStyleName);
        }
        if (data.fontName !== undefined) this._itemFont.value = data.fontName;
        if (data.fontSize !== undefined) this._itemFontSize.value = U.convert(unit, data.fontSize).toFixed(2);
        if (data.indent !== undefined) this._itemIndent.value = U.convert(unit, data.indent).toFixed(2);
        if (data.xscale !== undefined) this._itemXScale.value = (data.xscale * 100).toString();
        if (data.letterSpacing !== undefined) this._itemLetterSpacing.value = U.convert(unit, data.letterSpacing).toFixed(2);
        if (data.lineHeight !== undefined) this._itemLineHeight.value = (data.lineHeight * 100).toString();
        if (data.underline !== undefined) this._itemUnderline.value = data.underline;
        if (data.strikeline !== undefined) this._itemStrikeline.value = data.strikeline;
        if (data.textAlign !== undefined) {
            this._itemAlignJustify.value = data.textAlign === TextAlign.JUSTIFY ? true : false;
            this._itemAlignLeft.value = data.textAlign === TextAlign.LEFT ? true : false;
            this._itemAlignCenter.value = data.textAlign === TextAlign.CENTER ? true : false;
            this._itemAlignRight.value = data.textAlign === TextAlign.RIGHT ? true : false;
        }
        if (data.textVAlign !== undefined) {
            this._itemVAlignTop.value = data.textVAlign === ParagraphVAlign.TOP ? true : false;
            this._itemVAlignMiddle.value = data.textVAlign === ParagraphVAlign.MIDDLE ? true : false;
            this._itemVAlignBottom.value = data.textVAlign === ParagraphVAlign.BOTTOM ? true : false;
            this._itemVAlignJustify.value = data.textVAlign === ParagraphVAlign.JUSTIFY ? true : false;
        }
    }

    get data() {
        const data: IActaEditorTextAttribute = {};
        const unit = accountInfo.prefTextUnitType;

        data.textStyleName = this._itemTextStyle.value;
        data.fontName = this._itemFont.value;
        data.fontSize = U.px(this._itemFontSize.value, unit);
        data.indent = U.px(this._itemIndent.value, unit);
        data.xscale = parseFloat(this._itemXScale.value) / 100;
        data.letterSpacing = U.px(this._itemLetterSpacing.value, unit);
        data.lineHeight = parseFloat(this._itemLineHeight.value) / 100;
        data.underline = this._itemUnderline.value;
        data.strikeline = this._itemStrikeline.value;

        if (this._itemAlignJustify.value) data.textAlign = TextAlign.JUSTIFY;
        if (this._itemAlignLeft.value) data.textAlign = TextAlign.LEFT;
        if (this._itemAlignCenter.value) data.textAlign = TextAlign.CENTER;
        if (this._itemAlignRight.value) data.textAlign = TextAlign.RIGHT;

        if (this._itemVAlignTop.value) data.textVAlign = ParagraphVAlign.TOP;
        if (this._itemVAlignMiddle.value) data.textVAlign = ParagraphVAlign.MIDDLE;
        if (this._itemVAlignBottom.value) data.textVAlign = ParagraphVAlign.BOTTOM;
        if (this._itemVAlignJustify.value) data.textVAlign = ParagraphVAlign.JUSTIFY;

        return data;
    }

    get observable() { return this._CHANGE$; }
    get disabled() { return this._disabled; }
    get el() { return this._toolbar; }
}
export default ActaToolbarText;