import message from '../ui/message';
import tbbuilder from '../ui/toolbar';

class ActaToolbarText {
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
        this._toolbar.classList.add('text');

        this._toolbar.appendChild(tbbuilder.combobox({
            attr: { action: 'text-style' }, change: this._onEventSourcing,
            items: [], width: '10em'
        }));
        this._toolbar.appendChild(tbbuilder.combobox({
            attr: { action: 'text-font' }, change: this._onEventSourcing,
            items: [], width: '9em'
        }));
        this._toolbar.appendChild(tbbuilder.inputNumber({
            attr: { action: 'text-size' }, change: this._onEventSourcing,
            label: message.TOOLBAR.TEXT_SIZE,
            width: '3.6em', step: .01, min: 0
        }));
        this._toolbar.appendChild(tbbuilder.separater());
        this._toolbar.appendChild(tbbuilder.inputNumber({
            attr: { action: 'xscale' }, change: this._onEventSourcing,
            label: message.TOOLBAR.TEXT_XSCALE, suffix: '%',
            width: '3.6em', min: 0
        }));
        this._toolbar.appendChild(tbbuilder.inputNumber({
            attr: { action: 'letter-spacing' }, change: this._onEventSourcing,
            label: message.TOOLBAR.TEXT_LETTERSPACING,
            width: '3em', step: .01
        }));
        this._toolbar.appendChild(tbbuilder.inputNumber({
            attr: { action: 'line-height' }, change: this._onEventSourcing,
            label: message.TOOLBAR.TEXT_LINEHEIGHT, suffix: '%',
            width: '3.6em', min: 0
        }));
        this._toolbar.appendChild(tbbuilder.separater());
        this._toolbar.appendChild(tbbuilder.iconButton({
            attr: { action: 'align-left' }, click: this._onEventSourcing,
            icon: 'format_align_left', icontype: 'material',
            name: message.TOOLBAR.TEXT_ALIGN_LEFT
        }));
        this._toolbar.appendChild(tbbuilder.iconButton({
            attr: { action: 'align-center' }, click: this._onEventSourcing,
            icon: 'format_align_center', icontype: 'material',
            name: message.TOOLBAR.TEXT_ALIGN_CENTER
        }));
        this._toolbar.appendChild(tbbuilder.iconButton({
            attr: { action: 'align-right' }, click: this._onEventSourcing,
            icon: 'format_align_right', icontype: 'material',
            name: message.TOOLBAR.TEXT_ALIGN_RIGHT
        }));
        this._toolbar.appendChild(tbbuilder.iconButton({
            attr: { action: 'align_justify' }, click: this._onEventSourcing,
            icon: 'format_align_justify', icontype: 'material',
            name: message.TOOLBAR.TEXT_ALIGN_JUSTIFY
        }));
        this._toolbar.appendChild(tbbuilder.separater());
        this._toolbar.appendChild(tbbuilder.iconButton({
            attr: { action: 'valign-top' }, click: this._onEventSourcing,
            icon: 'vertical_align_top', icontype: 'material',
            name: message.TOOLBAR.TEXT_VALIGN_TOP
        }));
        this._toolbar.appendChild(tbbuilder.iconButton({
            attr: { action: 'valign-middle' }, click: this._onEventSourcing,
            icon: 'vertical_align_center', icontype: 'material',
            name: message.TOOLBAR.TEXT_VALIGN_MIDDLE
        }));
        this._toolbar.appendChild(tbbuilder.iconButton({
            attr: { action: 'valign-bottom' }, click: this._onEventSourcing,
            icon: 'vertical_align_bottom', icontype: 'material',
            name: message.TOOLBAR.TEXT_VALIGN_BOTTOM
        }));
        this._toolbar.appendChild(tbbuilder.iconButton({
            attr: { action: 'valign-justify' }, click: this._onEventSourcing,
            icon: 'vertical_distribute', icontype: 'material',
            name: message.TOOLBAR.TEXT_VALIGN_MIDDLE
        }));
    }
    get el() { return this._toolbar; }
}
export default ActaToolbarText;