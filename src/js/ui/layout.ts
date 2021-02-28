import Editor from '../editor/editor';
import spliter from '../ui/spliter';
import { fromEvent, Subject } from 'rxjs';
import { filter } from 'rxjs/operators';

import '../../css/ui/layout.scss';

class ActaUILayout {
    private static _instance: ActaUILayout;

    private _header: HTMLElement;
    private _top: HTMLElement;
    private _middle: HTMLElement;
    private _bottom: HTMLElement;

    private _toolbar: HTMLElement;
    private _main: HTMLElement;
    private _propertyPanelSpliter: HTMLElement;
    private _propertyPanel: HTMLElement;

    private _documents: HTMLElement;
    private _documentStatusbar: HTMLElement;

    private _title: string;
    private _status: string;

    private _editors: Editor[];
    private _activeEditor?: Editor;

    private _CHANGE$: Subject<{ action: string, value: any }>;

    static getInstance() {
        if (!ActaUILayout._instance) ActaUILayout._instance = new ActaUILayout();
        return ActaUILayout._instance;
    }

    private _initHeader() {
        this._header.appendChild(document.createElement('h1'));
        this._header.appendChild(document.createElement('ul'));
    }

    private _initStatusbar() {
        this._bottom.appendChild(document.createElement('h5'));
        this._bottom.appendChild(document.createElement('ul'));
    }

    private constructor() {
        this._header = document.createElement('header');
        this._top = document.createElement('nav');
        this._middle = document.createElement('section');
        this._bottom = document.createElement('footer');

        this._toolbar = document.createElement('div');
        this._main = document.createElement('section');
        this._propertyPanelSpliter = document.createElement('div');
        this._propertyPanel = document.createElement('div');

        this._documents = document.createElement('article');
        this._documentStatusbar = document.createElement('div');

        this._title = '';
        this._status = '';

        this._header.classList.add('ui-layout-header');
        this._top.classList.add('ui-layout-topbar');
        this._middle.classList.add('ui-layout-middle');
        this._bottom.classList.add('ui-layout-statusbar');

        this._toolbar.classList.add('ui-layout-toolbar');
        this._main.classList.add('ui-layout-main');
        this._propertyPanel.classList.add('ui-layout-property');

        this._documents.classList.add('ui-layout-documents');
        this._documentStatusbar.classList.add('ui-layout-document-statusbar');

        document.body.appendChild(this._header);
        document.body.appendChild(this._top);
        document.body.appendChild(this._middle);
        document.body.appendChild(this._bottom);

        this._middle.appendChild(this._toolbar);
        this._middle.appendChild(this._main);
        this._middle.appendChild(this._propertyPanelSpliter);
        this._middle.appendChild(this._propertyPanel);

        this._main.appendChild(this._documents);
        this._main.appendChild(this._documentStatusbar);

        this._initHeader();
        this._initStatusbar();

        spliter.create({
            spliterEl: this._propertyPanelSpliter,
            targetEl: this._propertyPanel,
            direction: 'col',
            minSize: 320
        });
        this._editors = [];

        this._CHANGE$ = new Subject();

        fromEvent<WheelEvent>(this._middle, 'mousewheel').pipe(filter(e => e.ctrlKey)).subscribe(e => e.preventDefault());
    }

    add(editor: Editor) {
        if (this._editors.indexOf(editor) < 0) {
            this._documents.appendChild(editor.el);
            this._editors.push(editor);
        }
        this.active = editor;
        this._CHANGE$.next({ action: 'add', value: this._activeEditor });
    }

    remove(editor: Editor) {
        const pos = this._editors.indexOf(editor);
        if (pos < 0) return;

        if (this.active === editor) {
            if (this._editors.length === 1) {
                this.active = undefined;
            } else {
                let nextEditor = this._editors[pos + 1];
                if (!nextEditor) nextEditor = this._editors[pos - 1];
                this.active = nextEditor;
            }
        }
        this._editors.splice(pos, 1);

        this._CHANGE$.next({ action: 'remove', value: editor });
    }

    set active(editor: Editor | undefined) {
        if (editor) {
            if (this._editors.indexOf(editor) < 0) editor = undefined;
        }
        for (const e of this._editors) {
            if (e === editor) {
                e.el.classList.add('active');
            } else {
                e.el.classList.remove('active');
            }
        }
        this._activeEditor = editor;

        this._CHANGE$.next({ action: 'active', value: this._activeEditor });
    }
    get active() { return this._activeEditor; }

    get headerMenubar() { return this._header.getElementsByTagName('ul')[0]; }
    get topbar() { return this._top; }
    get toolbar() { return this._toolbar; }
    get documents() { return this._documents; }
    get documentStatusbar() { return this._documentStatusbar; }
    get propertyPanel() { return this._propertyPanel; }

    get title() { return this._title; }
    get status() { return this._status; }

    get editors() {
        const ret = [];
        for (const e of this._editors) ret.push(e);
        return ret;
    }
    get observable() { return this._CHANGE$; }

    set title(title: string) {
        this._title = title;
        document.title = title;
        this._header.getElementsByTagName('h1')[0].innerHTML = `ACTA PUBLISHER ${title}`;
    }

    set status(status: string) {
        this._status = status;
        this._bottom.getElementsByTagName('h5')[0].innerHTML = status;
    }
}
export default ActaUILayout.getInstance();