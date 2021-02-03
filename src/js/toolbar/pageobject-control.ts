import message from '../ui/message';
import tbbuilder from '../ui/toolbar';

class ActaToolbarPageObjectControl {
    private _toolbar: HTMLUListElement;
    private _onClick?: (action: string, ev: Event) => any;
    private _onChange?: (action: string, value: string, ev: Event) => any;

    private _onEventSourcing(e: Event) {
        const target = e.target as HTMLElement | undefined;
        const action = target ? target.getAttribute('data-action') : undefined;
        if (!action || !target) return false;

        switch (e.type) {
            case 'click':
                if (this._onClick) this._onClick(action, e);
                break;
            case 'change':
                if (this._onChange) this._onChange(action, (target as HTMLInputElement).value, e);
                break;
            default:
                break;
        }
        e.stopPropagation();
    }

    set onClick(callback: (action: string, ev: Event) => any) { this._onClick = callback; }
    set onChange(callback: (action: string, value: string, ev: Event) => any) { this.onChange = callback; }

    constructor() {
        this._toolbar = document.createElement('ul');
        this._toolbar.classList.add('toolbar');
        this._toolbar.classList.add('pageobject-control');

        this._toolbar.appendChild(tbbuilder.iconButton({
            attr: { action: 'flip-to-back' }, click: this._onEventSourcing,
            icon: 'flip_to_back', icontype: 'material',
            name: message.TOOLBAR.PAGEOBJECT_CONTROL_FLIP_TO_BACK
        }));
        this._toolbar.appendChild(tbbuilder.iconButton({
            attr: { action: 'flip-to-front' }, click: this._onEventSourcing,
            icon: 'flip_to_front', icontype: 'material',
            name: message.TOOLBAR.PAGEOBJECT_CONTROL_FLIP_TO_FRONT
        }));
        this._toolbar.appendChild(tbbuilder.separater());
        this._toolbar.appendChild(tbbuilder.iconButton({
            attr: { action: 'align-center' }, click: this._onEventSourcing,
            icon: 'align_horizontal_center', icontype: 'material',
            name: message.TOOLBAR.PAGEOBJECT_CONTROL_ALIGN_CENTER
        }));
        this._toolbar.appendChild(tbbuilder.iconButton({
            attr: { action: 'align-left' }, click: this._onEventSourcing,
            icon: 'align_horizontal_left', icontype: 'material',
            name: message.TOOLBAR.PAGEOBJECT_CONTROL_ALIGN_LEFT
        }));
        this._toolbar.appendChild(tbbuilder.iconButton({
            attr: { action: 'align-right' }, click: this._onEventSourcing,
            icon: 'align_horizontal_right', icontype: 'material',
            name: message.TOOLBAR.PAGEOBJECT_CONTROL_ALIGN_RIGHT
        }));
        this._toolbar.appendChild(tbbuilder.separater());
        this._toolbar.appendChild(tbbuilder.iconButton({
            attr: { action: 'valign-middle' }, click: this._onEventSourcing,
            icon: 'align_vertical_center', icontype: 'material',
            name: message.TOOLBAR.PAGEOBJECT_CONTROL_VALIGN_MIDDLE
        }));
        this._toolbar.appendChild(tbbuilder.iconButton({
            attr: { action: 'valign-top' }, click: this._onEventSourcing,
            icon: 'align_vertical_top', icontype: 'material',
            name: message.TOOLBAR.PAGEOBJECT_CONTROL_VALIGN_TOP
        }));
        this._toolbar.appendChild(tbbuilder.iconButton({
            attr: { action: 'valign-bottom' }, click: this._onEventSourcing,
            icon: 'align_vertical_bottom', icontype: 'material',
            name: message.TOOLBAR.PAGEOBJECT_CONTROL_VALIGN_BOTTOM
        }));
        this._toolbar.appendChild(tbbuilder.separater());
        this._toolbar.appendChild(tbbuilder.iconButton({
            attr: { action: 'move-left' }, click: this._onEventSourcing,
            icon: 'arrow_back', icontype: 'material',
            name: message.TOOLBAR.PAGEOBJECT_CONTROL_MOVE_LEFT
        }));
        this._toolbar.appendChild(tbbuilder.iconButton({
            attr: { action: 'move-up' }, click: this._onEventSourcing,
            icon: 'arrow_upward', icontype: 'material',
            name: message.TOOLBAR.PAGEOBJECT_CONTROL_MOVE_UP
        }));
        this._toolbar.appendChild(tbbuilder.iconButton({
            attr: { action: 'move-down' }, click: this._onEventSourcing,
            icon: 'arrow_downward', icontype: 'material',
            name: message.TOOLBAR.PAGEOBJECT_CONTROL_MOVE_DOWM
        }));
        this._toolbar.appendChild(tbbuilder.iconButton({
            attr: { action: 'move-right' }, click: this._onEventSourcing,
            icon: 'arrow_forward', icontype: 'material',
            name: message.TOOLBAR.PAGEOBJECT_CONTROL_MOVE_RIGHT
        }));
        this._toolbar.appendChild(tbbuilder.inputNumber({
            attr: { action: 'move-unit' }, change: this._onEventSourcing,
            label: message.TOOLBAR.PAGEOBJECT_CONTROL_MOVE_STEP,
            width: '3.6em', step: .01, min: 0
        }));
        this._toolbar.appendChild(tbbuilder.separater());
        this._toolbar.appendChild(tbbuilder.iconButton({
            attr: { action: 'move-leftup' }, click: this._onEventSourcing,
            icon: 'north_west', icontype: 'material',
            name: message.TOOLBAR.PAGEOBJECT_CONTROL_MOVE_LEFTUP
        }));
        this._toolbar.appendChild(tbbuilder.iconButton({
            attr: { action: 'move-rightup' }, click: this._onEventSourcing,
            icon: 'north_east', icontype: 'material',
            name: message.TOOLBAR.PAGEOBJECT_CONTROL_MOVE_RIGHTUP
        }));
        this._toolbar.appendChild(tbbuilder.iconButton({
            attr: { action: 'move-leftdown' }, click: this._onEventSourcing,
            icon: 'south_west', icontype: 'material',
            name: message.TOOLBAR.PAGEOBJECT_CONTROL_MOVE_LEFTDOWN
        }));
        this._toolbar.appendChild(tbbuilder.iconButton({
            attr: { action: 'move-rightdown' }, click: this._onEventSourcing,
            icon: 'south_east', icontype: 'material',
            name: message.TOOLBAR.PAGEOBJECT_CONTROL_MOVE_RIGHTDOWN
        }));
        this._toolbar.appendChild(tbbuilder.inputNumber({
            attr: { action: 'move-munit' }, change: this._onEventSourcing,
            label: message.TOOLBAR.PAGEOBJECT_CONTROL_MOVE_STEP,
            width: '3.6em', step: .01, min: 0
        }));
        this._toolbar.appendChild(tbbuilder.separater());
        this._toolbar.appendChild(tbbuilder.iconButton({
            attr: { action: 'rotate-left' }, click: this._onEventSourcing,
            icon: 'rotate_left', icontype: 'material',
            name: message.TOOLBAR.PAGEOBJECT_CONTROL_ROTATE_LEFT
        }));
        this._toolbar.appendChild(tbbuilder.iconButton({
            attr: { action: 'rotate-right' }, click: this._onEventSourcing,
            icon: 'rotate_right', icontype: 'material',
            name: message.TOOLBAR.PAGEOBJECT_CONTROL_ROTATE_RIGHT
        }));
        this._toolbar.appendChild(tbbuilder.inputNumber({
            attr: { action: 'rotate-munit' }, change: this._onEventSourcing,
            label: message.TOOLBAR.PAGEOBJECT_CONTROL_ROTATE_STEP, suffix: '˚',
            width: '3.6em', step: .1, min: 0
        }));
        this._toolbar.appendChild(tbbuilder.separater());
        this._toolbar.appendChild(tbbuilder.iconButton({
            attr: { action: 'remove' }, click: this._onEventSourcing,
            icon: 'delete', icontype: 'material',
            name: message.TOOLBAR.PAGEOBJECT_CONTROL_REMOVE
        }));
    }
    get el() { return this._toolbar; }
}
export default ActaToolbarPageObjectControl;