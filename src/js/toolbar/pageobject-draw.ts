import message from '../ui/message';
import { iconButton, separater } from '../ui/toolbar';

class ActaToolbarPageObjectDraw {
    private _toolbar: HTMLUListElement;
    private _onClick?: (action: string, ev: Event) => any;

    private _onEventSourcing(e: Event) {
        const target = e.target as HTMLElement | undefined;
        const action = target ? target.getAttribute('data-action') : undefined;
        if (!action || !target) return false;

        switch (e.type) {
            case 'click':
                if (this._onClick) this._onClick(action, e);
                break;
            default:
                break;
        }
        e.stopPropagation();
    }

    set onClick(callback: (action: string, ev: Event) => any) { this._onClick = callback; }

    constructor() {
        this._toolbar = document.createElement('ul');
        this._toolbar.classList.add('toolbar');
        this._toolbar.classList.add('pageobject-draw');

        this._toolbar.appendChild(iconButton({
            attr: { action: 'select' }, click: this._onEventSourcing,
            icon: 'mouse-pointer',
            name: message.TOOLBAR.PAGEOBJECT_DRAW_SELECT
        }));
        this._toolbar.appendChild(separater());
        this._toolbar.appendChild(iconButton({
            attr: { action: 'frame-mode' }, click: this._onEventSourcing,
            icon: 'draw-polygon', icontype: 'fas',
            name: message.TOOLBAR.PAGEOBJECT_DRAW_FRAME_EDITMODE
        }));
        this._toolbar.appendChild(iconButton({
            attr: { action: 'move-mode' }, click: this._onEventSourcing,
            icon: 'hand-paper', icontype: 'far',
            name: message.TOOLBAR.PAGEOBJECT_DRAW_FRAME_MOVEMODE
        }));
        this._toolbar.appendChild(iconButton({
            attr: { action: 'text-mode' }, click: this._onEventSourcing,
            icon: 'edit',
            name: message.TOOLBAR.PAGEOBJECT_DRAW_TEXTMODE
        }));
        this._toolbar.appendChild(iconButton({
            attr: { action: 'zoom' }, click: this._onEventSourcing,
            icon: 'search',
            name: message.TOOLBAR.PAGEOBJECT_DRAW_ZOOM
        }));
        this._toolbar.appendChild(separater());
        this._toolbar.appendChild(iconButton({
            attr: { action: 'empty-frame' }, click: this._onEventSourcing,
            icon: 'square', icontype: 'far',
            name: message.TOOLBAR.PAGEOBJECT_DRAW_EMPTYFRAME
        }));
        this._toolbar.appendChild(iconButton({
            attr: { action: 'title-frame' }, click: this._onEventSourcing,
            icon: 'tumblr-square', icontype: 'fab',
            name: message.TOOLBAR.PAGEOBJECT_DRAW_TITLEFRAME
        }));
        this._toolbar.appendChild(iconButton({
            attr: { action: 'text-frame' }, click: this._onEventSourcing,
            icon: 'pen-square',
            name: message.TOOLBAR.PAGEOBJECT_DRAW_TEXTFRAME
        }));
        this._toolbar.appendChild(iconButton({
            attr: { action: 'image-frame' }, click: this._onEventSourcing,
            icon: 'image',
            name: message.TOOLBAR.PAGEOBJECT_DRAW_IMAGEFRAME
        }));
        this._toolbar.appendChild(separater());
        this._toolbar.appendChild(iconButton({
            attr: { action: 'line' }, click: this._onEventSourcing,
            icon: 'slash',
            name: message.TOOLBAR.PAGEOBJECT_DRAW_LINE
        }));
    }
    get el() { return this._toolbar; }
}
export default ActaToolbarPageObjectDraw;