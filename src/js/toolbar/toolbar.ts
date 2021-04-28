import formbuilder from '../ui/form';

export default abstract class IActaToolbar {
    private _toolbar: HTMLUListElement;
    private _disabled: boolean;

    constructor() {
        this._disabled = false;
        this._toolbar = document.createElement('ul');
        this._toolbar.classList.add('toolbar');

        this._initToolbar();
        this._initEvent();
    }

    mergeTo(toolbar: IActaToolbar) {
        const children = [... this._toolbar.childNodes];
        toolbar.el.appendChild(formbuilder.separater);
        for (const el of children) {
            toolbar.el.appendChild(el);
        }
    }
    get el() { return this._toolbar; }

    protected set disabled(val: boolean) { this._disabled = val; }
    protected get disabled() { return this._disabled; }

    protected abstract _initToolbar(): void;
    protected abstract _initEvent(): void;
    abstract enable(): void;
    abstract disable(): void;
}