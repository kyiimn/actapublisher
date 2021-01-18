import { iconButton, separater } from '../ui/toolbar';

class ActaToolbarPageObject {
    private _toolbar: HTMLUListElement;

    private _onClick(e: MouseEvent) {
        const target = e.target as HTMLLIElement | null;
        const action = target ? target.getAttribute('data-action') : '';
        e.stopPropagation();
    }

    constructor() {
        this._toolbar = document.createElement('ul');
        this._toolbar.appendChild(iconButton({ icon: 'mouse-pointer', name: '선택', attr: { action: 'select' }, click: this._onClick }));
        this._toolbar.appendChild(separater());
        this._toolbar.appendChild(iconButton({ icon: 'draw-polygon', icontype: 'fas', name: '프레임 수정모드', attr: { action: 'frame-mode' }, click: this._onClick }));
        this._toolbar.appendChild(iconButton({ icon: 'hand-paper', icontype: 'far', name: '프레임 이동모드', attr: { action: 'move-mode' }, click: this._onClick }));
        this._toolbar.appendChild(iconButton({ icon: 'edit', name: '텍스트모드', attr: { action: 'text-mode' }, click: this._onClick }));
        this._toolbar.appendChild(iconButton({ icon: 'search', name: '확대', attr: { action: 'zoom' }, click: this._onClick }));
        this._toolbar.appendChild(separater());
        this._toolbar.appendChild(iconButton({ icon: 'square', icontype: 'far', name: '빈프레임', attr: { action: 'empty-frame' }, click: this._onClick }));
        this._toolbar.appendChild(iconButton({ icon: 'tumblr-square', icontype: 'fab', name: '제목프레임', attr: { action: 'title-frame' }, click: this._onClick }));
        this._toolbar.appendChild(iconButton({ icon: 'pen-square', name: '텍스트프레임', attr: { action: 'text-frame' }, click: this._onClick }));
        this._toolbar.appendChild(iconButton({ icon: 'image', name: '이미지프레임', attr: { action: 'image-frame' }, click: this._onClick }));
        this._toolbar.appendChild(separater());
        this._toolbar.appendChild(iconButton({ icon: 'slash', name: '선', attr: { action: 'line' }, click: this._onClick }));
    }
    get el() { return this._toolbar; }
}
export default ActaToolbarPageObject;