import IActaToolbar from './toolbar';

import message from '../ui/message';
import formbuilder, { ActaUIFormButtonItem } from '../ui/form';
import { EditorTool } from '../editor/editor';

import { merge, Subject } from 'rxjs';
import { map } from 'rxjs/operators';

class ActaToolbarPageObjectDraw extends IActaToolbar {
    private _itemSelect!: ActaUIFormButtonItem;
    private _itemFrameEditMode!: ActaUIFormButtonItem;
    private _itemFrameMoveMode!: ActaUIFormButtonItem;
    private _itemTextMode!: ActaUIFormButtonItem;
    private _itemEmptyFrame!: ActaUIFormButtonItem;
    private _itemTitleFrame!: ActaUIFormButtonItem;
    private _itemTextFrame!: ActaUIFormButtonItem;
    private _itemImageFrame!: ActaUIFormButtonItem;
    private _itemLine!: ActaUIFormButtonItem;

    private _CHANGE$!: Subject<EditorTool>;

    protected _initToolbar() {
        this._CHANGE$ = new Subject();

        this.el.classList.add('pageobject-draw');

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

        this.el.appendChild(this._itemSelect.el);
        this.el.appendChild(formbuilder.separater);
        this.el.appendChild(this._itemFrameEditMode.el);
        this.el.appendChild(this._itemFrameMoveMode.el);
        this.el.appendChild(this._itemTextMode.el);
        this.el.appendChild(formbuilder.separater);
        this.el.appendChild(this._itemEmptyFrame.el);
        this.el.appendChild(this._itemTitleFrame.el);
        this.el.appendChild(this._itemTextFrame.el);
        this.el.appendChild(this._itemImageFrame.el);
        this.el.appendChild(formbuilder.separater);
        this.el.appendChild(this._itemLine.el);
    }

    protected _initEvent() {
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
        this._CHANGE$.next(this.value);
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

        this.disabled = false;
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

        this.disabled = true;
    }

    onKeydown(e: KeyboardEvent) {
        if (!e.altKey) return true;

        switch (e.key.toUpperCase()) {
            case 'S': this.value = EditorTool.SELECT; break;
            case 'E': this.value = EditorTool.FRAME_EDIT_MODE; break;
            case 'Q': this.value = EditorTool.FRAME_MOVE_MODE; break;
            case 'W': this.value = EditorTool.TEXT_MODE; break;
            case 'B': this.value = EditorTool.DRAW_EMPTY_FRAME; break;
            case 'T': this.value = EditorTool.DRAW_TITLE_FRAME; break;
            case 'X': this.value = EditorTool.DRAW_TEXT_FRAME; break;
            case 'I': this.value = EditorTool.DRAW_IMAGE_FRAME; break;
            case 'L': this.value = EditorTool.DRAW_LINE; break;
            default: return true;
        }
        e.preventDefault();
        e.stopPropagation();

        return false;
    }

    set value(value: EditorTool) {
        this._itemSelect.value = value === EditorTool.SELECT ? true : false;
        this._itemFrameEditMode.value = value === EditorTool.FRAME_EDIT_MODE ? true : false;
        this._itemFrameMoveMode.value = value === EditorTool.FRAME_MOVE_MODE ? true : false;
        this._itemTextMode.value = value === EditorTool.TEXT_MODE ? true : false;
        this._itemEmptyFrame.value = value === EditorTool.DRAW_EMPTY_FRAME ? true : false;
        this._itemTitleFrame.value = value === EditorTool.DRAW_TITLE_FRAME ? true : false;
        this._itemTextFrame.value = value === EditorTool.DRAW_TEXT_FRAME ? true : false;
        this._itemImageFrame.value = value === EditorTool.DRAW_IMAGE_FRAME ? true : false;
        this._itemLine.value = value === EditorTool.DRAW_LINE ? true : false;
        this._changeValues();
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
    get observable() { return this._CHANGE$; }
}
export default ActaToolbarPageObjectDraw;