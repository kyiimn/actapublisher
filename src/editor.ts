import { ActaPage } from './editor/page';
import { ActaGuide } from './editor/guide';
import { ActaGalley } from './editor/galley';
import { ActaParagraph } from './editor/paragraph';
import { ActaFontManager } from './editor/fontmgr';
import { ActaTextStyleManager } from './editor/textstylemgr';
import { ActaTextStyle, TextAlign } from './editor/textstyle';

import './editor/element';
import '../css/element.scss';

const main = async () => {
    const page = new ActaPage('25cm', '30cm');
    page.padding = '0.5cm';

    const guide = new ActaGuide(5, '2mm');
    const galley = new ActaGalley('5mm', '5mm', '143.25mm', '142mm');
    const para = new ActaParagraph('본문3', 3, '2mm')
    page.el.appendChild(guide.el);
    page.el.appendChild(galley.el);
    document.body.appendChild(page.el);

    galley.el.appendChild(para.el);
    galley.padding = '0mm';

    await ActaFontManager.getInstance().add('fonts/jabml.ttf');
    await ActaFontManager.getInstance().add('fonts/jahgl.ttf');

    let s;
    s = new ActaTextStyle('중앙신문명조');
    s.fontSize = 12;
    ActaTextStyleManager.getInstance().add('본문1', s);

    s = new ActaTextStyle('중앙세고딕');
    s.fontSize = 12;
    s.letterSpacing = 1;
    s.color = '#ff0000';
    ActaTextStyleManager.getInstance().add('본문2', s);

    s = new ActaTextStyle('중앙신문명조');
    s.fontSize = 12;
    s.indent = 8;
    ActaTextStyleManager.getInstance().add('본문3', s);

    const submitButton = document.querySelector('button#submit');
    const textarea = document.querySelector('textarea');
    if (submitButton) submitButton.addEventListener('click', _ => {
        let tt = textarea ? textarea.value : '';
        tt = tt.substring(0, tt.length);
        para.text = tt;
    });
    const getButton = document.querySelector('button#get');
    if (getButton) getButton.addEventListener('click', _ => {
        if (textarea) textarea.value = para.text;
    });
};
main();