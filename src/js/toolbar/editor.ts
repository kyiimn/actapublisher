import layout from '../ui/layout';

class ActaToolbarEditor {
    private _toolbar: HTMLUListElement;

    private _onClick(e: MouseEvent) {
        var i = 0;
    }

    constructor() {
        this._toolbar = document.createElement('ul');
        this._toolbar.appendChild(layout.generateToolbarIcon({ icon: 'mouse-pointer', name: '선택', attr: { action: 'select' }, click: e => this._onClick }));
        this._toolbar.appendChild(layout.generateSeparater());
        this._toolbar.appendChild(layout.generateToolbarIcon({ icon: 'draw-polygon', icontype: 'fas', name: '프레임 수정모드', attr: { action: 'frame-mode' }, click: e => this._onClick }));
        this._toolbar.appendChild(layout.generateToolbarIcon({ icon: 'hand-paper', icontype: 'far', name: '프레임 이동모드', attr: { action: 'move-mode' }, click: e => this._onClick }));
        this._toolbar.appendChild(layout.generateToolbarIcon({ icon: 'edit', name: '텍스트모드', attr: { action: 'text-mode' }, click: e => this._onClick }));
        this._toolbar.appendChild(layout.generateToolbarIcon({ icon: 'search', name: '확대', attr: { action: 'zoom' }, click: e => this._onClick }));
        this._toolbar.appendChild(layout.generateSeparater());
        this._toolbar.appendChild(layout.generateToolbarIcon({ icon: 'square', icontype: 'far', name: '빈프레임', attr: { action: 'empty-frame' }, click: e => this._onClick }));
        this._toolbar.appendChild(layout.generateToolbarIcon({ icon: 'tumblr-square', icontype: 'fab', name: '제목프레임', attr: { action: 'title-frame' }, click: e => this._onClick }));
        this._toolbar.appendChild(layout.generateToolbarIcon({ icon: 'pen-square', name: '텍스트프레임', attr: { action: 'text-frame' }, click: e => this._onClick }));
        this._toolbar.appendChild(layout.generateToolbarIcon({ icon: 'image', name: '이미지프레임', attr: { action: 'image-frame' }, click: e => this._onClick }));
        this._toolbar.appendChild(layout.generateSeparater());
        this._toolbar.appendChild(layout.generateToolbarIcon({ icon: 'slash', name: '선', attr: { action: 'line' }, click: e => this._onClick }));
        this._toolbar.addEventListener('click', e => this._onClick);
    }
    get el() { return this._toolbar; }
}

export default ActaToolbarEditor;