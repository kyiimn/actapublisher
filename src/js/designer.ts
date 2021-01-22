import ToolbarPODraw from './toolbar/pageobject-draw';
import ToolbarText from './toolbar/text';

import api from './util/api';
import layout from './ui/layout';
import message from './ui/message';

import { appButton, separater } from './ui/toolbar';

import '@fortawesome/fontawesome-free/js/all.js';

layout.title = 'DESIGNER';
layout.headerFunction.appendChild(
    appButton({
        name: message.MENUITEM.DESIGNER_NEW_TEMPLATE,
        icon: 'file',
        icontype: 'far',
        click: (e) => { /* */ }
    })
);
layout.headerFunction.appendChild(
    appButton({
        name: message.MENUITEM.DESIGNER_OPEN_TEMPLATE,
        icon: 'folder-open',
        click: (e) => { /* */ }
    })
);
layout.headerFunction.appendChild(separater());

layout.headerFunction.appendChild(
    appButton({
        name: message.MENUITEM.DESIGNER_OPEN_TEMPLATE,
        click: (e) => { /* */ }
    })
);

const tbPODraw = new ToolbarPODraw();
layout.toolbar.appendChild(tbPODraw.el);

const tbText = new ToolbarText();
layout.topbar.appendChild(tbText.el);

api.post('/aa', {
    'uuu': 'yyy',
    'ppo': 'ggg'
});