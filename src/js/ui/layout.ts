import '../../css/ui.scss';

class ActaUILayout {
    private static _instance: ActaUILayout;

    private _header: HTMLElement;
    private _topbar: HTMLElement;
    private _statusbar: HTMLElement;
    private _toolbar: HTMLElement;
    private _body: HTMLElement;
    private _propertyPanel: HTMLElement;

    private _title: string;
    private _status: string;

    static getInstance() {
        if (!ActaUILayout._instance) ActaUILayout._instance = new ActaUILayout();
        return ActaUILayout._instance;
    }

    private _initHeader() {
        this._header.appendChild(document.createElement('h1'));
        this._header.appendChild(document.createElement('ul'));
    }

    private _initStatusbar() {
        this._statusbar.appendChild(document.createElement('h5'));
        this._statusbar.appendChild(document.createElement('ul'));
    }

    private constructor() {
        this._header = document.createElement('header');
        this._statusbar = document.createElement('footer');
        this._topbar = document.createElement('nav');
        this._body = document.createElement('section');
        this._toolbar = document.createElement('div');
        this._propertyPanel = document.createElement('div');

        this._title = '';
        this._status = '';

        this._header.classList.add('ui-layout-header');
        this._topbar.classList.add('ui-layout-topbar');
        this._body.classList.add('ui-layout-body');
        this._statusbar.classList.add('ui-layout-statusbar');

        this._toolbar.classList.add('ui-layout-toolbar');
        this._propertyPanel.classList.add('ui-layout-property');

        document.body.appendChild(this._header);
        document.body.appendChild(this._topbar);
        document.body.appendChild(this._body);
        document.body.appendChild(this._statusbar);

        this._body.appendChild(this._toolbar);
        this._body.appendChild(this._propertyPanel);

        this._initHeader();
        this._initStatusbar();
    }

    get topbar() { return this._topbar; }
    get body() { return this._body; }
    get toolbar() { return this._toolbar; }
    get propertyPanel() { return this._propertyPanel; }

    get title() { return this._title; }
    get status() { return this._status; }

    get headerFunction() { return this._header.getElementsByTagName('ul')[0]; }

    set title(title: string) {
        this._title = title;
        document.title = title;
        this._header.getElementsByTagName('h1')[0].innerHTML = `ACTA PUBLISHER ${title}`;
    }

    set status(status: string) {
        this._status = status;
        this._statusbar.getElementsByTagName('h5')[0].innerHTML = status;
    }
}

export default ActaUILayout.getInstance();