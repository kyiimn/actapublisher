import message from '../ui/message';

import { combobox, iconButton, inputNumber, separater } from '../ui/toolbar';

class ActaToolbarText {
    private _toolbar: HTMLUListElement;

    private _onClick(e: MouseEvent) {
        const target = e.target as HTMLLIElement | null;
        const action = target ? target.getAttribute('data-action') : '';
        e.stopPropagation();
    }

    private _onChange(e: Event) {
        const target = e.target as HTMLLIElement | null;
        const action = target ? target.getAttribute('data-action') : '';
        e.stopPropagation();
    }

    constructor() {
        this._toolbar = document.createElement('ul');
        this._toolbar.appendChild(combobox({ attr: { action: 'text-style' }, items: [], width: '10em', change: this._onChange }));
        this._toolbar.appendChild(combobox({ attr: { action: 'text-font' }, items: [], width: '9em', change: this._onChange }));
        this._toolbar.appendChild(inputNumber({ attr: { action: 'text-size' }, label: message.TOOLBAR.TEXT_SIZE, width: '3.6em', step: .01, min: 0, change: this._onChange }));
        this._toolbar.appendChild(separater());
        this._toolbar.appendChild(inputNumber({ attr: { action: 'xscale' }, label: message.TOOLBAR.TEXT_XSCALE, suffix: '%', width: '3.6em', min: 0, change: this._onChange }));
        this._toolbar.appendChild(inputNumber({ attr: { action: 'letter-spacing' }, label: message.TOOLBAR.TEXT_LETTERSPACING, width: '3em', step: .01, change: this._onChange }));
        this._toolbar.appendChild(inputNumber({ attr: { action: 'line-height' }, label: message.TOOLBAR.TEXT_LINEHEIGHT, suffix: '%', width: '3.6em', min: 0, change: this._onChange }));
        this._toolbar.appendChild(separater());
        this._toolbar.appendChild(iconButton({ attr: { action: 'align-left' }, icon: 'format_align_left', icontype: 'material', name: message.TOOLBAR.TEXT_ALIGN_LEFT, click: this._onClick }));
        this._toolbar.appendChild(iconButton({ attr: { action: 'align-center' }, icon: 'format_align_center', icontype: 'material', name: message.TOOLBAR.TEXT_ALIGN_CENTER, click: this._onClick }));
        this._toolbar.appendChild(iconButton({ attr: { action: 'align-right' }, icon: 'format_align_right', icontype: 'material', name: message.TOOLBAR.TEXT_ALIGN_RIGHT, click: this._onClick }));
        this._toolbar.appendChild(iconButton({ attr: { action: 'align_justify' }, icon: 'format_align_justify', icontype: 'material', name: message.TOOLBAR.TEXT_ALIGN_JUSTIFY, click: this._onClick }));
        this._toolbar.appendChild(separater());
        this._toolbar.appendChild(iconButton({ attr: { action: 'valign-top' }, icon: 'vertical_align_top', icontype: 'material', name: message.TOOLBAR.TEXT_VALIGN_TOP, click: this._onClick }));
        this._toolbar.appendChild(iconButton({ attr: { action: 'valign-middle' }, icon: 'vertical_align_center', icontype: 'material', name: message.TOOLBAR.TEXT_VALIGN_MIDDLE, click: this._onClick }));
        this._toolbar.appendChild(iconButton({ attr: { action: 'valign-bottom' }, icon: 'vertical_align_bottom', icontype: 'material', name: message.TOOLBAR.TEXT_VALIGN_BOTTOM, click: this._onClick }));
        this._toolbar.appendChild(iconButton({ attr: { action: 'valign-justify' }, icon: 'vertical_distribute', icontype: 'material', name: message.TOOLBAR.TEXT_VALIGN_MIDDLE, click: this._onClick }));
    }
    get el() { return this._toolbar; }
}
export default ActaToolbarText;