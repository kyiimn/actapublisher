import fontmgr from '../pageobject/font/fontmgr';
import textstylemgr from '../pageobject/textstyle/textstylemgr';
import message from '../ui/message';
import tbbuilder from '../ui/toolbar';
import accountInfo from '../info/account';
import U from '../util/units';

import { TextAlign } from '../pageobject/textstyle/textstyle';
import { merge, Subject } from 'rxjs';
import { map } from 'rxjs/operators';

class ActaToolbarText {
    private _toolbar: HTMLUListElement;
    private _itemTextStyle;
    private _itemTextFont;
    private _itemTextSize;
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

    private _CHANGE$: Subject<ActaToolbarText>;

    constructor() {
        this._CHANGE$ = new Subject();

        this._toolbar = document.createElement('ul');
        this._toolbar.classList.add('toolbar');
        this._toolbar.classList.add('text');

        this._itemTextStyle = tbbuilder.combobox({ items: [], width: '10em' });
        this._itemTextFont = tbbuilder.combobox({ items: [], width: '7em' });
        this._itemTextSize = tbbuilder.inputNumber({ label: message.TOOLBAR.TEXT_SIZE, width: '4.2em', step: .01, min: 0 });
        this._itemIndent = tbbuilder.inputNumber({ label: message.TOOLBAR.TEXT_INDENT, width: '4.2em', step: .01, min: 0 });
        this._itemXScale = tbbuilder.inputNumber({ label: message.TOOLBAR.TEXT_XSCALE, suffix: '%', width: '4.2em', min: 0 });
        this._itemLetterSpacing = tbbuilder.inputNumber({ label: message.TOOLBAR.TEXT_LETTERSPACING, width: '4em', step: .01 });
        this._itemLineHeight = tbbuilder.inputNumber({ label: message.TOOLBAR.TEXT_LINEHEIGHT, suffix: '%', width: '4.2em', min: 0 });
        this._itemUnderline = tbbuilder.iconButton({ icon: 'format_underlined', icontype: 'material', label: message.TOOLBAR.TEXT_UNDERLINE });
        this._itemStrikeline = tbbuilder.iconButton({ icon: 'format_strikethrough', icontype: 'material', label: message.TOOLBAR.TEXT_STRIKELINE });
        this._itemAlignLeft = tbbuilder.iconButton({ icon: 'format_align_left', icontype: 'material', label: message.TOOLBAR.TEXT_ALIGN_LEFT });
        this._itemAlignCenter = tbbuilder.iconButton({ icon: 'format_align_center', icontype: 'material', label: message.TOOLBAR.TEXT_ALIGN_CENTER });
        this._itemAlignRight = tbbuilder.iconButton({ icon: 'format_align_right', icontype: 'material', label: message.TOOLBAR.TEXT_ALIGN_RIGHT });
        this._itemAlignJustify = tbbuilder.iconButton({ icon: 'format_align_justify', icontype: 'material', label: message.TOOLBAR.TEXT_ALIGN_JUSTIFY });
        this._itemVAlignTop = tbbuilder.iconButton({ icon: 'vertical_align_top', icontype: 'material', label: message.TOOLBAR.TEXT_VALIGN_TOP });
        this._itemVAlignMiddle = tbbuilder.iconButton({ icon: 'vertical_align_center', icontype: 'material', label: message.TOOLBAR.TEXT_VALIGN_MIDDLE });
        this._itemVAlignBottom = tbbuilder.iconButton({ icon: 'vertical_align_bottom', icontype: 'material', label: message.TOOLBAR.TEXT_VALIGN_BOTTOM });
        this._itemVAlignJustify = tbbuilder.iconButton({ icon: 'vertical_distribute', icontype: 'material', label: message.TOOLBAR.TEXT_VALIGN_JUSTIFY });

        this._itemAlignLeft.value = true;
        this._itemVAlignTop.value = true;

        this._toolbar.appendChild(this._itemTextStyle.el);
        this._toolbar.appendChild(this._itemTextFont.el);
        this._toolbar.appendChild(this._itemTextSize.el);
        this._toolbar.appendChild(tbbuilder.separater().el);
        this._toolbar.appendChild(this._itemIndent.el);
        this._toolbar.appendChild(this._itemXScale.el);
        this._toolbar.appendChild(this._itemLetterSpacing.el);
        this._toolbar.appendChild(this._itemLineHeight.el);
        this._toolbar.appendChild(tbbuilder.separater().el);
        this._toolbar.appendChild(this._itemUnderline.el);
        this._toolbar.appendChild(this._itemStrikeline.el);
        this._toolbar.appendChild(tbbuilder.separater().el);
        this._toolbar.appendChild(this._itemAlignLeft.el);
        this._toolbar.appendChild(this._itemAlignCenter.el);
        this._toolbar.appendChild(this._itemAlignRight.el);
        this._toolbar.appendChild(this._itemAlignJustify.el);
        this._toolbar.appendChild(tbbuilder.separater().el);
        this._toolbar.appendChild(this._itemVAlignTop.el);
        this._toolbar.appendChild(this._itemVAlignMiddle.el);
        this._toolbar.appendChild(this._itemVAlignBottom.el);
        this._toolbar.appendChild(this._itemVAlignJustify.el);

        fontmgr.observable.subscribe(list => {
            const oldValue = this._itemTextFont.value;
            this._itemTextFont.input.innerHTML = '';
            for (const font of list) {
                const option = document.createElement('option');
                option.value = font.name;
                option.innerHTML = font.name;
                this._itemTextFont.input.append(option);
            }
            if (this._itemTextFont.value !== oldValue) this._changeValues();
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
            if (this._itemTextStyle.value !== oldValue) this._changeTextStyle(this._itemTextStyle.value);
        });

        this._itemTextStyle.observable.subscribe(data => this._changeTextStyle(data.value));
        this._itemUnderline.observable.subscribe(_ => {
            this._itemUnderline.value = !this._itemUnderline.value;
            this._changeValues();
        });
        this._itemStrikeline.observable.subscribe(_ => {
            this._itemStrikeline.value = !this._itemStrikeline.value;
            this._changeValues();
        });
        merge(
            this._itemTextFont.observable, this._itemTextSize.observable, this._itemIndent.observable, this._itemXScale.observable,
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
            this._itemVAlignTop.observable.pipe(map(_ => TextAlign.JUSTIFY)), this._itemVAlignMiddle.observable.pipe(map(_ => TextAlign.LEFT)),
            this._itemVAlignBottom.observable.pipe(map(_ => TextAlign.CENTER)), this._itemVAlignJustify.observable.pipe(map(_ => TextAlign.RIGHT))
        ).subscribe(align => {
            this._itemVAlignTop.value = align === TextAlign.JUSTIFY ? true : false;
            this._itemVAlignMiddle.value = align === TextAlign.LEFT ? true : false;
            this._itemVAlignBottom.value = align === TextAlign.CENTER ? true : false;
            this._itemVAlignJustify.value = align === TextAlign.RIGHT ? true : false;
            this._changeValues();
        });
    }

    private _changeTextStyle(name: string) {
        const textstyle = textstylemgr.get(name);
        if (!textstyle) return;

        const unit = accountInfo.prefTextUnitType;

        this._itemTextFont.value = textstyle.fontName;
        this._itemTextSize.value = U.convert(unit, textstyle.fontSize).toFixed(2);
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
        this._changeValues();
    }

    private _changeValues() {
        this._CHANGE$.next(this);
    }

    get el() { return this._toolbar; }
}
export default ActaToolbarText;