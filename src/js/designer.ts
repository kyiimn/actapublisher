import ToolbarPODraw from './toolbar/pageobject-draw';
import ToolbarPOControl from './toolbar/pageobject-control';
import ToolbarText from './toolbar/text';
import Layout from './ui/layout';

import accountInfo from './info/account';
import codeInfo from './info/code';
import fontInfo from './info/font';
import message from './ui/message';
import tbbuilder from './ui/toolbar';

import U from './util/units';

import '@fortawesome/fontawesome-free/js/all.js';

class Designer {
    private _tbPODraw: ToolbarPODraw;
    private _tbPOCtrl: ToolbarPOControl;
    private _tbText: ToolbarText;

    private _layout: Layout;

    constructor() {
        this._tbPODraw = new ToolbarPODraw();
        this._tbPOCtrl = new ToolbarPOControl();
        this._tbText = new ToolbarText();

        this._layout = Layout.getInstance();
    }

    private _initToolbar() {
        this._layout.toolbar.appendChild(this._tbPODraw.el);
        this._layout.topbar.appendChild(this._tbPOCtrl.el);
        this._layout.topbar.appendChild(this._tbText.el);
    }

    private _initMenubar() {
        this._layout.headerMenubar.appendChild(tbbuilder.appButton({ name: message.MENUITEM.DESIGNER_NEW, icon: 'file', icontype: 'far', click: (e) => { /* */ } }));
        this._layout.headerMenubar.appendChild(tbbuilder.separater());
        this._layout.headerMenubar.appendChild(tbbuilder.appButton({ name: message.MENUITEM.DESIGNER_OPEN, icon: 'folder-open', click: (e) => { /* */ } }));
        this._layout.headerMenubar.appendChild(tbbuilder.separater());
        this._layout.headerMenubar.appendChild(tbbuilder.appButton({ name: message.MENUITEM.DESIGNER_SAVE, icon: 'save', click: (e) => { /* */ } }));
        this._layout.headerMenubar.appendChild(tbbuilder.appButton({ name: message.MENUITEM.DESIGNER_SAVEAS, icon: 'save', icontype: 'far', click: (e) => { /* */ } }));
        this._layout.headerMenubar.appendChild(tbbuilder.separater());
        this._layout.headerMenubar.appendChild(tbbuilder.appButton({ name: message.MENUITEM.DESIGNER_LOGOUT, icon: 'walking', click: (e) => { /* */ } }));
    }

    async run() {
        this._layout.title = 'DESIGNER';

        await accountInfo.loadData();
        if (!accountInfo.isLogined) {
            alert('로그인되지 않았습니다.');
            return;
        }
        U.DPI = accountInfo.prefDPI;

        await codeInfo.loadData();
        await fontInfo.loadData();

        this._initMenubar();
        this._initToolbar();
    }
}
(new Designer()).run();