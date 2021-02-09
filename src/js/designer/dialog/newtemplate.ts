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
                    name: code.name,
                    value: code.id.toString()
                });
            }
        }

        this._itemPageSize = formbuilder.combobox({ label: message.DESIGNER.PAGE_SIZE, items: pageSizes });
        this._itemPageSize.observable.subscribe(data => this._showInfo(parseInt(data.value, 10)));

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
        form.appendChild(formbuilder.separater);
        form.appendChild(this._itemPaperType.el);
        form.appendChild(this._itemLinespacingSize.el);
        form.appendChild(formbuilder.separater);
        form.appendChild(this._itemColumnInsideMargin.el);
        form.appendChild(this._itemColumnOutsideMargin.el);
        form.appendChild(this._itemColumnCount.el);
        form.appendChild(this._itemColumnSize.el);
        form.appendChild(this._itemColumnSpacing.el);
        form.appendChild(this._itemColumnOther.el);
        form.appendChild(this._itemColumnTotalSize.el);
        form.appendChild(this._itemColumnInfo.el);
        form.appendChild(formbuilder.separater);
        form.appendChild(this._itemLineTopMargin.el);
        form.appendChild(this._itemLineBottomMargin.el);
        form.appendChild(this._itemLineHeight.el);
        form.appendChild(this._itemLineCount.el);
        form.appendChild(this._itemLineSpacing.el);
        form.appendChild(this._itemLineOther.el);
        form.appendChild(this._itemLineTotalSize.el);
        form.appendChild(this._itemLineInfo.el);
    }
    /*
    paper_type	용지구분	varchar	8	N	공통코드 (10)
    paper_width	용지가로	float		N	mm
    paper_height	용지세로	float		N	mm
    paper_direction	가로세로구분	varchar	8	N	공통코드 (11)
    linespacing_size	배수크기	float		N	
    linespacing_unit	배수단위	varchar	8	N	공통코드 (12)
    linespacing_ratio	배수비율	float		N	
    col_margin_inside	단 안쪽여백	float		N	mm
    col_margin_outside	단 바깥쪽여백	float		N	mm
    col_count	단수	int		N	
    col_size	단폭	float		N	mm
    col_spacing	단간격	float		N	mm
    col_other	보정값	float		N	mm
    col_total_size	단전체크기	float		N	mm
    line_margin_top	행 위쪽여백	float		N	mm
    line_margin_bottom	행 아래쪽여백	float		N	mm
    line_height	행높이	float		N	mm
    line_count	행수	int		N	
    line_spacing	행간격	float		N	mm
    line_other	보정값	float		N	mm
    line_total_size	행전체크기	float		N	mm
    */
    protected _initButtons(buttonsEl: HTMLElement): void {
        this._openButton = document.createElement('button');
        this._openButton.innerHTML = message.UI.OPEN;

        this._closeButton = document.createElement('button');
        this._closeButton.innerHTML = message.UI.CLOSE;

        buttonsEl.append(this._openButton);
        buttonsEl.append(this._closeButton);
    }

    private _showInfo(id: number) {
        alert(id);
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