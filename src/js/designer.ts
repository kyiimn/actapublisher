import Toolbar from './toolbar/editor';

import layout from './ui/layout';

import '@fortawesome/fontawesome-free/js/all.js';

layout.title = 'DESIGNER';
layout.headerFunction.appendChild(
    layout.generateFunctionButton({
        name: '불러오기',
        icon: 'folder-open',
        click: (e) => { /* */ }
    })
);
layout.headerFunction.appendChild(
    layout.generateSeparater()
);
layout.headerFunction.appendChild(
    layout.generateFunctionButton({
        name: '불러오기',
        click: (e) => { /* */ }
    })
);

const toolbar = new Toolbar();
layout.toolbar.appendChild(
    toolbar.el
);