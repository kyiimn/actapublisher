class ActaUILayout {
    private static _instance: ActaUILayout;

    private _header: HTMLElement;
    private _topbar: HTMLElement;
    private _statusbar: HTMLElement;
    private _toolbar: HTMLElement;
    private _body: HTMLElement;
    private _propertyPanel: HTMLElement;

    private _title: string;

    static getInstance() {
        if (!ActaUILayout._instance) ActaUILayout._instance = new ActaUILayout();
        return ActaUILayout._instance;
    }

    private constructor() {
        this._header = document.createElement('header');
        this._statusbar = document.createElement('footer');
        this._topbar = document.createElement('nav');
        this._body = document.createElement('section');
        this._toolbar = document.createElement('div');
        this._propertyPanel = document.createElement('div');

        this._title = '';

        document.body.appendChild(this.header);
        document.body.appendChild(this.topbar);
        document.body.appendChild(this.toolbar);
        document.body.appendChild(this.body);
        document.body.appendChild(this.propertyPanel);
        document.body.appendChild(this.statusbar);
    }
    get header() { return this._header; }
    get statusbar() { return this._statusbar; }
    get topbar() { return this._topbar; }
    get body() { return this._body; }
    get toolbar() { return this._toolbar; }
    get propertyPanel() { return this._propertyPanel; }
    get title() { return this._title; }

    set title(title: string) {
        this._title = title;
        document.title = title;
    }
}
export default ActaUILayout.getInstance();