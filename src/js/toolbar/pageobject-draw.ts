import message from '../ui/message';
import formbuilder from '../ui/form';
import { EditorTool } from '../editor/editor';
import { merge, Subject } from 'rxjs';
import { map } from 'rxjs/operators';

class ActaToolbarPageObjectDraw {
    private _toolbar: HTMLUListElement;
    private _itemSelect;
    private _itemFrameEditMode;
    private _itemFrameMoveMode;
    private _itemTextMode;
    private _itemEmptyFrame;
    private _itemTitleFrame;
    private _itemTextFrame;
    private _itemImageFrame;
    private _itemLine;

    private _disabled: boolean;

    private _SELECT$: Subject<EditorTool>;

    constructor() {
        this._SELECT$ = new Subject();

        this._disabled = false;

        this._toolbar = document.createElement('ul');
        this._toolbar.classList.add('toolbar');
        this._toolbar.classList.add('pageobject-draw');

        this._itemSelect = formbuilder.iconButton({ attr: { action: 'select' }, icon: 'mouse-pointer', label: message.TOOLBAR.PAGEOBJECT_DRAW_SELECT });
        this._itemFrameEditMode = formbuilder.iconButton({ attr: { action: 'frame-mode' }, icon: 'draw-polygon', icontype: 'fas', label: message.TOOLBAR.PAGEOBJECT_DRAW_FRAME_EDITMODE });
        this._itemFrameMoveMode = formbuilder.iconButton({ attr: { action: 'move-mode' }, icon: 'hand-paper', icontype: 'far', label: message.TOOLBAR.PAGEOBJECT_DRAW_FRAME_MOVEMODE });
        this._itemTextMode = formbuilder.iconButton({ attr: { action: 'text-mode' }, icon: 'title', icontype: 'material', label: message.TOOLBAR.PAGEOBJECT_DRAW_TEXTMODE });
        this._itemEmptyFrame = formbuilder.iconButton({ attr: { action: 'empty-frame' }, icon: 'square', icontype: 'far', label: message.TOOLBAR.PAGEOBJECT_DRAW_EMPTYFRAME });
        this._itemTitleFrame = formbuilder.iconButton({ attr: { action: 'title-frame' }, icon: 'tumblr-square', icontype: 'fab', label: message.TOOLBAR.PAGEOBJECT_DRAW_TITLEFRAME });
        this._itemTextFrame = formbuilder.iconButton({ attr: { action: 'text-frame' }, icon: 'pen-square', label: message.TOOLBAR.PAGEOBJECT_DRAW_TEXTFRAME });
        this._itemImageFrame = formbuilder.iconButton({ attr: { action: 'image-frame' }, icon: 'image', label: message.TOOLBAR.PAGEOBJECT_DRAW_IMAGEFRAME });
        this._itemLine = formbuilder.iconButton({ attr: { action: 'line' }, icon: 'slash', label: message.TOOLBAR.PAGEOBJECT_DRAW_LINE });

        this._itemSelect.value = true;

        this._toolbar.appendChild(this._itemSelect.el);
        this._toolbar.appendChild(formbuilder.separater);
        this._toolbar.appendChild(this._itemFrameEditMode.el);
        this._toolbar.appendChild(this._itemFrameMoveMode.el);
        this._toolbar.appendChild(this._itemTextMode.el);
        this._toolbar.appendChild(formbuilder.separater);
        this._toolbar.appendChild(this._itemEmptyFrame.el);
        this._toolbar.appendChild(this._itemTitleFrame.el);
        this._toolbar.appendChild(this._itemTextFrame.el);
        this._toolbar.appendChild(this._itemImageFrame.el);
        this._toolbar.appendChild(formbuilder.separater);
        this._toolbar.appendChild(this._itemLine.el);

        merge(
            this._itemSelect.observable.pipe(map(_ => this._itemSelect)),
            this._itemFrameEditMode.observable.pipe(map(_ => this._itemFrameEditMode)),
            this._itemFrameMoveMode.observable.pipe(map(_ => this._itemFrameMoveMode)),
            this._itemTextMode.observable.pipe(map(_ => this._itemTextMode)),
            this._itemEmptyFrame.observable.pipe(map(_ => this._itemEmptyFrame)),
            this._itemTitleFrame.observable.pipe(map(_ => this._itemTitleFrame)),
            this._itemTextFrame.observable.pipe(map(_ => this._itemTextFrame)),
            this._itemImageFrame.observable.pipe(map(_ => this._itemImageFrame)),
            this._itemLine.observable.pipe(map(_ => this._itemLine))
        ).subscribe(item => {
            this._itemSelect.value = this._itemSelect === item ? true : false;
            this._itemFrameEditMode.value = this._itemFrameEditMode === item ? true : false;
            this._itemFrameMoveMode.value = this._itemFrameMoveMode === item ? true : false;
            this._itemTextMode.value = this._itemTextMode === item ? true : false;
            this._itemEmptyFrame.value = this._itemEmptyFrame === item ? true : false;
            this._itemTitleFrame.value = this._itemTitleFrame === item ? true : false;
            this._itemTextFrame.value = this._itemTextFrame === item ? true : false;
            this._itemImageFrame.value = this._itemImageFrame === item ? true : false;
            this._itemLine.value = this._itemLine === item ? true : false;
            this._changeValues();
        });
    }

    private _changeValues() {
        this._SELECT$.next(this.value);
    }

    enable() {
        this._itemSelect.disabled = false;
        this._itemFrameEditMode.disabled = false;
        this._itemFrameMoveMode.disabled = false;
        this._itemTextMode.disabled = false;
        this._itemEmptyFrame.disabled = false;
        this._itemTitleFrame.disabled = false;
        this._itemTextFrame.disabled = false;
        this._itemImageFrame.disabled = false;
        this._itemLine.disabled = false;

        this._disabled = false;
    }

    disable() {
        this._itemSelect.disabled = true;
        this._itemFrameEditMode.disabled = true;
        this._itemFrameMoveMode.disabled = true;
        this._itemTextMode.disabled = true;
        this._itemEmptyFrame.disabled = true;
        this._itemTitleFrame.disabled = true;
        this._itemTextFrame.disabled = true;
        this._itemImageFrame.disabled = true;
        this._itemLine.disabled = true;

        this._disabled = true;
    }

    get value() {
        let value = EditorTool.SELECT;
        if (this._itemSelect.value) value = EditorTool.SELECT;
        else if (this._itemFrameEditMode.value) value = EditorTool.FRAME_EDIT_MODE;
        else if (this._itemFrameMoveMode.value) value = EditorTool.FRAME_MOVE_MODE;
        else if (this._itemTextMode.value) value = EditorTool.TEXT_MODE;
        else if (this._itemEmptyFrame.value) value = EditorTool.DRAW_EMPTY_FRAME;
        else if (this._itemTitleFrame.value) value = EditorTool.DRAW_TITLE_FRAME;
        else if (this._itemTextFrame.value) value = EditorTool.DRAW_TEXT_FRAME;
        else if (this._itemImageFrame.value) value = EditorTool.DRAW_IMAGE_FRAME;
        else if (this._itemLine.value) value = EditorTool.DRAW_LINE;
        return value;
    }
    get observable() { return this._SELECT$; }
    get disabled() { return this._disabled; }
    get el() { return this._toolbar; }
}
export default ActaToolbarPageObjectDraw;