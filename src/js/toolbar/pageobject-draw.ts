import message from '../ui/message';
import tbbuilder from '../ui/toolbar';
import { merge, Subject } from 'rxjs';
import { map } from 'rxjs/operators';

class ActaToolbarPageObjectDraw {
    private _toolbar: HTMLUListElement;
    private _itemSelect;
    private _itemFrameEditMode;
    private _itemFrameMoveMode;
    private _itemTextMode;
    private _itemZoom;
    private _itemEmptyFrame;
    private _itemTitleFrame;
    private _itemTextFrame;
    private _itemImageFrame;
    private _itemLine;

    private _SELECT$: Subject<string>;

    constructor() {
        this._SELECT$ = new Subject();

        this._toolbar = document.createElement('ul');
        this._toolbar.classList.add('toolbar');
        this._toolbar.classList.add('pageobject-draw');

        this._itemSelect = tbbuilder.iconButton({ attr: { action: 'select' }, icon: 'mouse-pointer', label: message.TOOLBAR.PAGEOBJECT_DRAW_SELECT });
        this._itemFrameEditMode = tbbuilder.iconButton({ attr: { action: 'frame-mode' }, icon: 'draw-polygon', icontype: 'fas', label: message.TOOLBAR.PAGEOBJECT_DRAW_FRAME_EDITMODE });
        this._itemFrameMoveMode = tbbuilder.iconButton({ attr: { action: 'move-mode' }, icon: 'hand-paper', icontype: 'far', label: message.TOOLBAR.PAGEOBJECT_DRAW_FRAME_MOVEMODE });
        this._itemTextMode = tbbuilder.iconButton({ attr: { action: 'text-mode' }, icon: 'edit', label: message.TOOLBAR.PAGEOBJECT_DRAW_TEXTMODE });
        this._itemZoom = tbbuilder.iconButton({ attr: { action: 'zoom' }, icon: 'search', label: message.TOOLBAR.PAGEOBJECT_DRAW_ZOOM });
        this._itemEmptyFrame = tbbuilder.iconButton({ attr: { action: 'empty-frame' }, icon: 'square', icontype: 'far', label: message.TOOLBAR.PAGEOBJECT_DRAW_EMPTYFRAME });
        this._itemTitleFrame = tbbuilder.iconButton({ attr: { action: 'title-frame' }, icon: 'tumblr-square', icontype: 'fab', label: message.TOOLBAR.PAGEOBJECT_DRAW_TITLEFRAME });
        this._itemTextFrame = tbbuilder.iconButton({ attr: { action: 'text-frame' }, icon: 'pen-square', label: message.TOOLBAR.PAGEOBJECT_DRAW_TEXTFRAME });
        this._itemImageFrame = tbbuilder.iconButton({ attr: { action: 'image-frame' }, icon: 'image', label: message.TOOLBAR.PAGEOBJECT_DRAW_IMAGEFRAME });
        this._itemLine = tbbuilder.iconButton({ attr: { action: 'line' }, icon: 'slash', label: message.TOOLBAR.PAGEOBJECT_DRAW_LINE });

        this._itemSelect.value = true;

        this._toolbar.appendChild(this._itemSelect.el);
        this._toolbar.appendChild(tbbuilder.separater().el);
        this._toolbar.appendChild(this._itemFrameEditMode.el);
        this._toolbar.appendChild(this._itemFrameMoveMode.el);
        this._toolbar.appendChild(this._itemTextMode.el);
        this._toolbar.appendChild(this._itemZoom.el);
        this._toolbar.appendChild(tbbuilder.separater().el);
        this._toolbar.appendChild(this._itemEmptyFrame.el);
        this._toolbar.appendChild(this._itemTitleFrame.el);
        this._toolbar.appendChild(this._itemTextFrame.el);
        this._toolbar.appendChild(this._itemImageFrame.el);
        this._toolbar.appendChild(tbbuilder.separater().el);
        this._toolbar.appendChild(this._itemLine.el);

        merge(
            this._itemSelect.observable.pipe(map(_ => this._itemSelect)),
            this._itemFrameEditMode.observable.pipe(map(_ => this._itemFrameEditMode)),
            this._itemFrameMoveMode.observable.pipe(map(_ => this._itemFrameMoveMode)),
            this._itemTextMode.observable.pipe(map(_ => this._itemTextMode)),
            this._itemZoom.observable.pipe(map(_ => this._itemZoom)),
            this._itemEmptyFrame.observable.pipe(map(_ => this._itemEmptyFrame)),
            this._itemTitleFrame.observable.pipe(map(_ => this._itemTitleFrame)),
            this._itemTextFrame.observable.pipe(map(_ => this._itemTextFrame)),
            this._itemImageFrame.observable.pipe(map(_ => this._itemImageFrame)),
            this._itemLine.observable.pipe(map(_ => this._itemLine))
        ).subscribe(item => {
            this._itemSelect.value = this._itemSelect === item ? true : false;
            this._itemFrameEditMode.value = this._itemFrameEditMode === item ? true : false;
            this._itemFrameMoveMode.value = this._itemFrameMoveMode === item ? true : false;
            this._itemZoom.value = this._itemZoom === item ? true : false;
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
        let value = '';
        if (this._itemSelect.value) value = 'select';
        else if (this._itemFrameEditMode.value) value = 'frame-edit-mode';
        else if (this._itemFrameMoveMode.value) value = 'frame-move-mode';
        else if (this._itemTextMode.value) value = 'text-mode';
        else if (this._itemZoom.value) value = 'zoom-mode';
        else if (this._itemEmptyFrame.value) value = 'empty-frame';
        else if (this._itemTitleFrame.value) value = 'title-frame';
        else if (this._itemTextFrame.value) value = 'text-frame';
        else if (this._itemImageFrame.value) value = 'image-frame';
        else if (this._itemLine.value) value = 'line';

        this._SELECT$.next(value);
    }

    get el() { return this._toolbar; }
}
export default ActaToolbarPageObjectDraw;