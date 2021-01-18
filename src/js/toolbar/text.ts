import { combobox, inputNumber, separater } from '../ui/toolbar';

class ActaToolbarText {
    private _toolbar: HTMLUListElement;

    private _onClick(e: MouseEvent) {
        const target = e.target as HTMLLIElement | null;
        const action = target ? target.getAttribute('data-action') : '';
        e.stopPropagation();
    }

    private _onChange(e: UIEvent) {
        const target = e.target as HTMLLIElement | null;
        const action = target ? target.getAttribute('data-action') : '';
        e.stopPropagation();
    }

    constructor() {
        this._toolbar = document.createElement('ul');
        this._toolbar.appendChild(combobox({ attr: { action: 'text-style' }, items: [], change: this._onChange }));
        this._toolbar.appendChild(combobox({ attr: { action: 'text-font' }, items: [], change: this._onChange }));
        this._toolbar.appendChild(inputNumber({ attr: { action: 'text-size' }, label: '크기', change: this._onChange }));
        this._toolbar.appendChild(separater());
        this._toolbar.appendChild(inputNumber({ attr: { action: 'xscale' }, label: '장평', change: this._onChange }));
        this._toolbar.appendChild(inputNumber({ attr: { action: 'letter-spacing' }, label: '자간', change: this._onChange }));
        this._toolbar.appendChild(inputNumber({ attr: { action: 'line-height' }, label: '행간', change: this._onChange }));
        this._toolbar.appendChild(separater());
    }
    get el() { return this._toolbar; }
}
export default ActaToolbarText;