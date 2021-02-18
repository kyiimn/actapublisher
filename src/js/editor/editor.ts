export default class ActaEditor {
    private _element: HTMLElement;

    constructor() {
        this._element = document.createElement('div');
        this._element.classList.add('editor');
    }
    get el() { return this._element; }
}