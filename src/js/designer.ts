import ToolbarPODraw from './toolbar/pageobject-draw';
import ToolbarPOControl from './toolbar/pageobject-control';
import ToolbarPOTransform from './toolbar/pageobject-transform';
import ToolbarText from './toolbar/text';
import ToolbarDocStatus from './toolbar/document-status';
import Editor from './editor/editor';

import NewTemplate from './designer/dialog/newtemplate';

import layout from './ui/layout';
import accountInfo from './info/account';
import codeInfo from './info/code';
import fontInfo from './info/font';
import message from './ui/message';
import formbuilder from './ui/form';
import uialert from './ui/alert';
import waitbar from './ui/waitbar';

import IActaFrame, { IActaFrameAttribute } from './pageobject/interface/frame';
import U from './util/units';

import { fromEvent, merge } from 'rxjs';
import { filter, map } from 'rxjs/operators';

import '@fortawesome/fontawesome-free/js/all.js';

class Designer {
    private static _instance: Designer;

    private _toolbarPODraw;
    private _toolbarPOControl;
    private _toolbarPOTransform;
    private _toolbarText;
    private _toolbarDocStatus;

    private _layout;

    private _headerMenuItemNew;
    private _headerMenuItemOpen;
    private _headerMenuItemSave;
    private _headerMenuItemSaveAs;
    private _headerMenuItemLogout;

    private constructor() {
        this._toolbarPODraw = new ToolbarPODraw();
        this._toolbarPOControl = new ToolbarPOControl();
        this._toolbarPOTransform = new ToolbarPOTransform();
        this._toolbarText = new ToolbarText();
        this._toolbarDocStatus = new ToolbarDocStatus();

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
                case 'new':
                    NewTemplate.show().then(id => {
                        if (!id) return;

                        const pageSize = codeInfo.findPageSize(id);
                        if (!pageSize) return;
                        layout.add(new Editor(pageSize));
                    });
                    break;
                case 'open': break;
                case 'save': break;
                case 'saveas': break;
                case 'logout': break;
                default: break;
            }
        });
        this._layout = layout;
    }

    private _initToolbar() {
        this._layout.toolbar.appendChild(this._toolbarPODraw.el);
        this._layout.topbar.appendChild(this._toolbarPOControl.el);
        this._layout.topbar.appendChild(this._toolbarPOTransform.el);
        this._layout.topbar.appendChild(this._toolbarText.el);
        this._layout.documentStatusbar.appendChild(this._toolbarDocStatus.el);

        this._toolbarPODraw.disable();
        this._toolbarPOControl.disable();
        this._toolbarPOTransform.disable();
        this._toolbarText.disable();
        this._toolbarDocStatus.disable();

        this._toolbarPODraw.observable.subscribe(tool => {
            const editor = this._layout.active;
            if (editor) editor.tool = tool;
        });

        this._toolbarPOControl.observable.subscribe(ctrl => {
            const editor = this._layout.active;
            if (editor) editor.processPageObjectControl(ctrl.action, ctrl.step);
        });

        this._toolbarPOTransform.observable.subscribe(ctrl => {
            const editor = this._layout.active;
            // if (editor) editor.processPageObjectControl(ctrl.action, ctrl.value);
        });

        this._toolbarText.observable.subscribe(val => {
            const editor = this._layout.active;
            if (editor) editor.setTextAttribute(val[0], val[1]);
        });

        this._toolbarDocStatus.observable.subscribe(data => {
            if (data.action === 'scale') {
                const editor = this._layout.active;
                if (editor) editor.scale = (data.value as number) / 100;
            }
        });
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

    private _initEvent() {
        this._layout.observable.subscribe(data => {
            if (data.action === 'active') {
                if (data.value) {
                    const editor = data.value as Editor;
                    this._toolbarPODraw.enable();
                    this._toolbarPOControl.enable();
                    this._toolbarPOTransform.enable();
                    this._toolbarText.enable();
                    this._toolbarDocStatus.enable();

                    this._toolbarDocStatus.data = {
                        scale: Math.round(editor.scale * 100)
                    };
                    editor.tool = this._toolbarPODraw.value;
                } else {
                    this._toolbarPODraw.disable();
                    this._toolbarPOControl.disable();
                    this._toolbarPOTransform.disable();
                    this._toolbarText.disable();
                    this._toolbarDocStatus.disable();
                }
            } else if (data.action === 'add') {
                const editor = this._layout.active;
                if (!editor) return;
                editor.observable.subscribe(rdata => this.initEditorEvent(editor, rdata.action, rdata.value));
                editor.scale = parseFloat(((this._layout.documents.clientHeight - 48) / editor.el.clientHeight).toFixed(2));
                this._toolbarDocStatus.data = {
                    scale: Math.round(editor.scale * 100)
                };
            } else if (data.action === 'remove') {
                const editor = this._layout.active;
                if (!editor) return;
                editor.observable.unsubscribe();
            }
        });

        fromEvent<KeyboardEvent>(document.body, 'keydown').pipe(filter(e => {
            const activeEditor = this._layout.active;
            if (!activeEditor) return false;

            const activeEl = document.activeElement;
            if (activeEl && ['input', 'select', 'button'].indexOf(activeEl.nodeName.toLowerCase()) > -1) return false;

            return true;
        })).subscribe(e => {
            const activeEditor = this._layout.active as Editor;
            if (activeEditor.onKeydown(e) === false) return;
            if (this._toolbarPODraw.onKeydown(e) === false) return;
        });
    }

    static getInstance() {
        if (!Designer._instance) Designer._instance = new Designer();
        return Designer._instance;
    }

    initEditorEvent(editor: Editor, action: string, value: any) {
        const isActive = this._layout.active === editor;
        if (action === 'scale' && isActive) {
            this._toolbarDocStatus.data = {
                scale: Math.round(value * 100)
            };
        } else if (action === 'append') {
            // implement
        } else if (action === 'changetool') {
            this._toolbarPODraw.value = value;
        } else if (action === 'textstyle') {
            this._toolbarText.data = value;
        } else if (action === 'selectframe') {
            const frames = value as IActaFrame[];
            if (frames.length < 1) {
                this._toolbarPOTransform.value = null;
            } else {
                let attr: IActaFrameAttribute = frames[0].frameAttribute;
                for (const frame of value) {
                    const fattr = frame.frameAttribute;
                    if (U.pt(attr.width) !== U.pt(fattr.width)) attr.width = undefined;
                    if (U.pt(attr.height) !== U.pt(fattr.height)) attr.height = undefined;
                    if (U.pt(attr.paddingLeft) !== U.pt(fattr.paddingLeft)) attr.paddingLeft = undefined;
                    if (U.pt(attr.paddingTop) !== U.pt(fattr.paddingTop)) attr.paddingTop = undefined;
                    if (U.pt(attr.paddingBottom) !== U.pt(fattr.paddingBottom)) attr.paddingBottom = undefined;
                    if (U.pt(attr.paddingRight) !== U.pt(fattr.paddingRight)) attr.paddingRight = undefined;
                    if (U.pt(attr.borderLeft) !== U.pt(fattr.borderLeft)) attr.borderLeft = undefined;
                    if (U.pt(attr.borderTop) !== U.pt(fattr.borderTop)) attr.borderTop = undefined;
                    if (U.pt(attr.borderBottom) !== U.pt(fattr.borderBottom)) attr.borderBottom = undefined;
                    if (U.pt(attr.borderRight) !== U.pt(fattr.borderRight)) attr.borderRight = undefined;
                    if (U.pt(attr.overlapMethod) !== U.pt(fattr.overlapMethod)) attr.overlapMethod = undefined;
                }
                this._toolbarPOTransform.value = attr;
            }
        }
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
            this._initEvent();
        } finally {
            w.close();
        }
    }
}
Designer.getInstance().run();