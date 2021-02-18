import ToolbarPODraw from './toolbar/pageobject-draw';
import ToolbarPOControl from './toolbar/pageobject-control';
import ToolbarText from './toolbar/text';
import Editor from './editor/editor';
import Layout from './ui/layout';

import NewTemplate from './designer/dialog/newtemplate';

import accountInfo from './info/account';
import codeInfo from './info/code';
import fontInfo from './info/font';
import message from './ui/message';
import formbuilder from './ui/form';
import uialert from './ui/alert';
import waitbar from './ui/waitbar';

import { merge } from 'rxjs';
import { map } from 'rxjs/operators';

import '@fortawesome/fontawesome-free/js/all.js';

class Designer {
    private _toolbarPODraw: ToolbarPODraw;
    private _toolbarPOCtrl: ToolbarPOControl;
    private _toolbarText: ToolbarText;

    private _editors: Editor[];

    private _layout: Layout;

    private _headerMenuItemNew;
    private _headerMenuItemOpen;
    private _headerMenuItemSave;
    private _headerMenuItemSaveAs;
    private _headerMenuItemLogout;

    constructor() {
        this._toolbarPODraw = new ToolbarPODraw();
        this._toolbarPOCtrl = new ToolbarPOControl();
        this._toolbarText = new ToolbarText();

        this._editors = [];

        this._headerMenuItemNew = formbuilder.appButton({ label: message.MENUITEM.DESIGNER_NEW, icon: 'file', icontype: 'far' });
        this._headerMenuItemOpen = formbuilder.appButton({ label: message.MENUITEM.DESIGNER_OPEN, icon: 'folder-open' });
        this._headerMenuItemSave = formbuilder.appButton({ label: message.MENUITEM.DESIGNER_SAVE, icon: 'save' });
        this._headerMenuItemSaveAs = formbuilder.appButton({ label: message.MENUITEM.DESIGNER_SAVEAS, icon: 'save', icontype: 'far' });
        this._headerMenuItemLogout = formbuilder.appButton({ label: message.MENUITEM.DESIGNER_LOGOUT, icon: 'walking' });

        merge(
            this._headerMenuItemNew.observable.pipe(map(_ => 'new')),
            this._headerMenuItemOpen.observable.pipe(map(_ => 'open')),
            this._headerMenuItemSave.observable.pipe(map(_ => 'save')),
            this._headerMenuItemSaveAs.observable.pipe(map(_ => 'saveas')),
            this._headerMenuItemLogout.observable.pipe(map(_ => 'logout'))
        ).subscribe(action => {
            switch (action) {
                case 'new': NewTemplate.show(); break;
                case 'open': break;
                case 'save': break;
                case 'saveas': break;
                case 'logout': break;
                default: break;
            }
        });
        this._layout = Layout.getInstance();
    }

    private _initToolbar() {
        this._layout.toolbar.appendChild(this._toolbarPODraw.el);
        this._layout.topbar.appendChild(this._toolbarPOCtrl.el);
        this._layout.topbar.appendChild(this._toolbarText.el);
    }

    private _initMenubar() {
        this._layout.headerMenubar.appendChild(this._headerMenuItemNew.el);
        this._layout.headerMenubar.appendChild(formbuilder.separater);
        this._layout.headerMenubar.appendChild(this._headerMenuItemOpen.el);
        this._layout.headerMenubar.appendChild(formbuilder.separater);
        this._layout.headerMenubar.appendChild(this._headerMenuItemSave.el);
        this._layout.headerMenubar.appendChild(this._headerMenuItemSaveAs.el);
        this._layout.headerMenubar.appendChild(formbuilder.separater);
        this._layout.headerMenubar.appendChild(this._headerMenuItemLogout.el);
    }

    async run() {
        const w = waitbar.show();

        try {
            this._layout.title = 'DESIGNER';
            if (!await accountInfo.loadData()) {
                uialert.show(message.DESIGNER.NOT_LOGGED_IN).then(_ => {
                    document.location.href = 'logout';
                });
                return;
            }
            if (!await codeInfo.loadData()) return;
            if (!await fontInfo.loadData()) return;

            this._initMenubar();
            this._initToolbar();
        } finally {
            w.close();
        }
    }
}
(new Designer()).run();