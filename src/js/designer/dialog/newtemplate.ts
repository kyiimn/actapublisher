import IDialog from '../../ui/idialog';
import message from '../../ui/message';
import uialert from '../../ui/alert';

import codeinfo from '../../info/code';
import formbuilder, { ActaUIFormInputItem, ActaUIFormLabelItem } from '../../ui/form';
import { fromEvent } from 'rxjs';

import '../../../css/designer/newtemplate.scss';

export default class ActaNewTemplateDialog extends IDialog {
    private _openButton?: HTMLElement;
    private _closeButton?: HTMLElement;

    private _itemPageSize?: ActaUIFormInputItem;
    private _itemPaperType?: ActaUIFormLabelItem;
    private _itemLinespacingSize?: ActaUIFormLabelItem;
    private _itemColumnInsideMargin?: ActaUIFormLabelItem;
    private _itemColumnOutsideMargin?: ActaUIFormLabelItem;
    private _itemColumnCount?: ActaUIFormLabelItem;
    private _itemColumnSize?: ActaUIFormLabelItem;
    private _itemColumnSpacing?: ActaUIFormLabelItem;
    private _itemColumnOther?: ActaUIFormLabelItem;
    private _itemColumnTotalSize?: ActaUIFormLabelItem;
    private _itemColumnInfo?: ActaUIFormLabelItem;
    private _itemLineTopMargin?: ActaUIFormLabelItem;
    private _itemLineBottomMargin?: ActaUIFormLabelItem;
    private _itemLineHeight?: ActaUIFormLabelItem;
    private _itemLineCount?: ActaUIFormLabelItem;
    private _itemLineSpacing?: ActaUIFormLabelItem;
    private _itemLineOther?: ActaUIFormLabelItem;
    private _itemLineTotalSize?: ActaUIFormLabelItem;
    private _itemLineInfo?: ActaUIFormLabelItem;

    constructor() {
        super('new-template');
    }

    protected _initBody(bodyEl: HTMLElement): void {
        const form = formbuilder.form;
        bodyEl.appendChild(form);

        const pageSizes = [];
        if (codeinfo.pageSize.length < 1) {
            uialert.show(message.DESIGNER.HASNOT_DEFINED_PAGE_SIZE);
        } else {
            for (const code of codeinfo.pageSize) {
                pageSizes.push({
                    name: code.name, value: code.id.toString()
                });
            }
        }
        this._itemPageSize = formbuilder.combobox({ label: message.DESIGNER.PAGE_SIZE, items: pageSizes });
        this._itemPageSize.observable.subscribe(_ => this._updateInfo());

        this._itemPaperType = formbuilder.label({ label: message.DESIGNER.PAPER_TYPE });
        this._itemLinespacingSize = formbuilder.label({ label: message.DESIGNER.LINESPACING_SIZE });
        this._itemColumnInsideMargin = formbuilder.label({ label: message.DESIGNER.COLUMN_INSIDE_MARGIN });
        this._itemColumnOutsideMargin = formbuilder.label({ label: message.DESIGNER.COLUMN_OUTSIDE_MARGIN });
        this._itemColumnCount = formbuilder.label({ label: message.DESIGNER.COLUMN_COUNT });
        this._itemColumnSize = formbuilder.label({ label: message.DESIGNER.COLUMN_SIZE });
        this._itemColumnSpacing = formbuilder.label({ label: message.DESIGNER.COLUMN_SPACING });
        this._itemColumnOther = formbuilder.label({ label: message.DESIGNER.COLUMN_OTHER });
        this._itemColumnTotalSize = formbuilder.label({ label: message.DESIGNER.COLUMN_TOTAL_SIZE });
        this._itemColumnInfo = formbuilder.label({ label: message.DESIGNER.COLUMN_INFO });
        this._itemLineTopMargin = formbuilder.label({ label: message.DESIGNER.LINE_TOP_MARGIN });
        this._itemLineBottomMargin = formbuilder.label({ label: message.DESIGNER.LINE_BOTTOM_MARGIN });
        this._itemLineHeight = formbuilder.label({ label: message.DESIGNER.LINE_HEIGHT });
        this._itemLineCount = formbuilder.label({ label: message.DESIGNER.LINE_COUNT });
        this._itemLineSpacing = formbuilder.label({ label: message.DESIGNER.LINE_SPACING });
        this._itemLineOther = formbuilder.label({ label: message.DESIGNER.LINE_OTHER });
        this._itemLineTotalSize = formbuilder.label({ label: message.DESIGNER.LINE_TOTAL_SIZE });
        this._itemLineInfo = formbuilder.label({ label: message.DESIGNER.LINE_INFO });

        form.appendChild(this._itemPageSize.el);

        const fieldset = formbuilder.fieldset;
        form.appendChild(fieldset);

        fieldset.appendChild(this._itemPaperType.el);
        fieldset.appendChild(this._itemLinespacingSize.el);
        fieldset.appendChild(formbuilder.separater);
        fieldset.appendChild(this._itemColumnInsideMargin.el);
        fieldset.appendChild(this._itemColumnOutsideMargin.el);
        fieldset.appendChild(this._itemColumnCount.el);
        fieldset.appendChild(this._itemColumnSize.el);
        fieldset.appendChild(this._itemColumnSpacing.el);
        fieldset.appendChild(this._itemColumnOther.el);
        fieldset.appendChild(this._itemColumnTotalSize.el);
        fieldset.appendChild(formbuilder.separater);
        fieldset.appendChild(this._itemColumnInfo.el);
        fieldset.appendChild(formbuilder.separater);
        fieldset.appendChild(this._itemLineTopMargin.el);
        fieldset.appendChild(this._itemLineBottomMargin.el);
        fieldset.appendChild(this._itemLineHeight.el);
        fieldset.appendChild(this._itemLineCount.el);
        fieldset.appendChild(this._itemLineSpacing.el);
        fieldset.appendChild(this._itemLineOther.el);
        fieldset.appendChild(this._itemLineTotalSize.el);
        fieldset.appendChild(formbuilder.separater);
        fieldset.appendChild(this._itemLineInfo.el);

        this._updateInfo();
    }

    protected _initButtons(buttonsEl: HTMLElement): void {
        this._openButton = document.createElement('button');
        this._openButton.innerHTML = message.DESIGNER.MAKE;

        this._closeButton = document.createElement('button');
        this._closeButton.innerHTML = message.UI.CLOSE;

        buttonsEl.append(this._openButton);
        buttonsEl.append(this._closeButton);
    }

    private get value() {
        return parseInt(this._itemPageSize?.value || '0', 10);
    }

    private _updateInfo() {
        const id = this.value;
        if (!id) return;

        const pageSize = codeinfo.findPageSize(id);
        if (!pageSize) return;

        if (this._itemPaperType) this._itemPaperType.value = `${pageSize.paperTypeName} (${pageSize.paperWidth} mm x ${pageSize.paperHeight} mm, ${pageSize.paperDirectionName})`;
        if (this._itemLinespacingSize) this._itemLinespacingSize.value = `${pageSize.linespacingSize} ${pageSize.linespacingUnitName} x ${(pageSize.linespacingRatio / 100.0).toFixed(2)} = ${(pageSize.linespacingSize * (pageSize.linespacingRatio / 100.0)).toFixed(2)} ${pageSize.linespacingUnitName}`;

        if (this._itemColumnInsideMargin) this._itemColumnInsideMargin.value = `${pageSize.columnMarginInside} mm`;
        if (this._itemColumnOutsideMargin) this._itemColumnOutsideMargin.value = `${pageSize.columnMarginOutside} mm`;
        if (this._itemColumnCount) this._itemColumnCount.value = `${pageSize.columnCount}`;
        if (this._itemColumnSize) this._itemColumnSize.value = `${pageSize.columnSize} mm`;
        if (this._itemColumnSpacing) this._itemColumnSpacing.value = `${pageSize.columnSpacing} mm`;
        if (this._itemColumnOther) this._itemColumnOther.value = `${pageSize.columnOther} mm`;
        if (this._itemColumnTotalSize) this._itemColumnTotalSize.value = `${pageSize.columnTotalSize} mm`;
        if (this._itemColumnInfo) {
            this._itemColumnInfo.value = `${pageSize.columnMarginInside} mm + ${pageSize.columnMarginOutside} mm + (${pageSize.columnSize} mm x ${pageSize.columnCount}) + (${pageSize.columnSpacing} mm x (${pageSize.columnCount} - 1)) + ${pageSize.columnOther} mm = ${pageSize.columnTotalSize} mm`;
        }

        if (this._itemLineTopMargin) this._itemLineTopMargin.value = `${pageSize.lineMarginTop} mm`;
        if (this._itemLineBottomMargin) this._itemLineBottomMargin.value = `${pageSize.lineMarginBottom} mm`;
        if (this._itemLineHeight) this._itemLineHeight.value = `${pageSize.lineHeight} mm`;
        if (this._itemLineCount) this._itemLineCount.value = `${pageSize.lineCount}`;
        if (this._itemLineSpacing) this._itemLineSpacing.value = `${pageSize.lineSpacing} mm`;
        if (this._itemLineOther) this._itemLineOther.value = `${pageSize.lineOther} mm`;
        if (this._itemLineTotalSize) this._itemLineTotalSize.value = `${pageSize.lineTotalSize} mm`;
        if (this._itemLineInfo) {
            this._itemLineInfo.value = `${pageSize.lineMarginTop} mm + ${pageSize.lineMarginBottom} mm + (${pageSize.lineHeight} mm x ${pageSize.lineCount}) + (${pageSize.lineSpacing} mm x (${pageSize.lineCount} - 1)) + ${pageSize.lineOther} mm = ${pageSize.lineTotalSize} mm`;
        }
    }

    static async show() {
        const dialog = new this();
        dialog.title = message.DESIGNER.NEW_TEMPLATE;
        dialog.modal = true;
        dialog.show();

        return new Promise<number | boolean>((r, _) => {
            fromEvent(dialog._openButton as HTMLButtonElement, 'click').subscribe(_e => {
                r(parseInt(dialog._itemPageSize?.value || '0', 10));
                dialog.close();
            });
            fromEvent(dialog._closeButton as HTMLButtonElement, 'click').subscribe(_e => {
                r(false);
                dialog.close();
            });
        });
    }

}