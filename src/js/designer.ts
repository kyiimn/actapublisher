import PageObjectToolbar from './toolbar/pageobject';

import layout from './ui/layout';
import message from './ui/message';

import { appButton, separater } from './ui/toolbar';

import '@fortawesome/fontawesome-free/js/all.js';

layout.title = 'DESIGNER';
layout.headerFunction.appendChild(
    appButton({
        name: message.MENUITEM_DESIGNER_NEW_TEMPLATE,
        icon: 'file',
        icontype: 'far',
        click: (e) => { /* */ }
    })
);
layout.headerFunction.appendChild(
    appButton({
        name: '불러오기',
        icon: 'folder-open',
        click: (e) => { /* */ }
    })
);
layout.headerFunction.appendChild(separater());

layout.headerFunction.appendChild(
    appButton({
        name: '불러오기',
        click: (e) => { /* */ }
    })
);

const toolbar = new PageObjectToolbar();
layout.toolbar.appendChild(
    toolbar.el
);