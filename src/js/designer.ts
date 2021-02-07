import ToolbarPODraw from './toolbar/pageobject-draw';
import ToolbarPOControl from './toolbar/pageobject-control';
import ToolbarText from './toolbar/text';
import Editor from './editor/editor';
import Layout from './ui/layout';

import accountInfo from './info/account';
import codeInfo from './info/code';
import fontInfo from './info/font';
import message from './ui/message';
import tbbuilder from './ui/toolbar';

import '@fortawesome/fontawesome-free/js/all.js';

class Designer {
    private _toolbarPODraw: ToolbarPODraw;
    private _toolbarPOCtrl: ToolbarPOControl;
    private _toolbarText: ToolbarText;

    private _editor: Editor;

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

        this._editor = new Editor();

        this._headerMenuItemNew = tbbuilder.appButton({ label: message.MENUITEM.DESIGNER_NEW, icon: 'file', icontype: 'far' });
        this._headerMenuItemOpen = tbbuilder.appButton({ label: message.MENUITEM.DESIGNER_OPEN, icon: 'folder-open' });
        this._headerMenuItemSave = tbbuilder.appButton({ label: message.MENUITEM.DESIGNER_SAVE, icon: 'save' });
        this._headerMenuItemSaveAs = tbbuilder.appButton({ label: message.MENUITEM.DESIGNER_SAVEAS, icon: 'save', icontype: 'far' });
        this._headerMenuItemLogout = tbbuilder.appButton({ label: message.MENUITEM.DESIGNER_LOGOUT, icon: 'walking' });

        this._layout = Layout.getInstance();
    }

    private _initToolbar() {
        this._layout.toolbar.appendChild(this._toolbarPODraw.el);
        this._layout.topbar.appendChild(this._toolbarPOCtrl.el);
        this._layout.topbar.appendChild(this._toolbarText.el);
    }

    private _initMenubar() {
        this._layout.headerMenubar.appendChild(this._headerMenuItemNew.el);
        this._layout.headerMenubar.appendChild(tbbuilder.separater().el);
        this._layout.headerMenubar.appendChild(this._headerMenuItemOpen.el);
        this._layout.headerMenubar.appendChild(tbbuilder.separater().el);
        this._layout.headerMenubar.appendChild(this._headerMenuItemSave.el);
        this._layout.headerMenubar.appendChild(this._headerMenuItemSaveAs.el);
        this._layout.headerMenubar.appendChild(tbbuilder.separater().el);
        this._layout.headerMenubar.appendChild(this._headerMenuItemLogout.el);
    }

    async run() {
        this._layout.title = 'DESIGNER';

        if (!await accountInfo.loadData()) {
            alert('로그인되지 않았습니다.');
            return;
        }
        if (!await codeInfo.loadData()) return false;
        if (!await fontInfo.loadData()) return false;

        this._initMenubar();
        this._initToolbar();
    }
}
(new Designer()).run();