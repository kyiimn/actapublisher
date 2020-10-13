import { ActaPage } from './editor/page';
import { ActaGuide } from './editor/guide';
import { ActaGalley } from './editor/galley';
import { ActaParagraph } from './editor/paragraph';
import { ActaFontManager } from './editor/fontmgr';
import { ActaTextStyleManager } from './editor/textstylemgr';
import { ActaTextStyle, TextAlign } from './editor/textstyle';

import '../css/element.scss';

const main = async () => {
    await ActaFontManager.in.add('fonts/jabml.ttf');
    await ActaFontManager.in.add('fonts/jahgl.ttf');

    let s;
    s = new ActaTextStyle('중앙신문명조');
    s.fontSize = 12;
    ActaTextStyleManager.in.add('본문1', s);

    s = new ActaTextStyle('중앙세고딕');
    s.fontSize = 12;
    s.letterSpacing = 1;
    s.color = '#ff0000';
    ActaTextStyleManager.in.add('본문2', s);

    s = new ActaTextStyle('중앙신문명조');
    s.fontSize = 12;
    s.indent = 8;
    ActaTextStyleManager.in.add('본문3', s);

    const page = new ActaPage('25cm', '30cm');
    page.paddingTop = '0.5cm';
    page.paddingBottom = '0.5cm';
    page.paddingLeft = '0.5cm';
    page.paddingRight = '0.5cm';
    document.body.appendChild(page);

    const guide = new ActaGuide(5, '2mm');
    page.appendChild(guide);

    const galley = new ActaGalley('5mm', '5mm', '143.25mm', '142mm');
    const para = new ActaParagraph('본문3', 3, '2mm')
    galley.appendChild(para);

    page.appendChild(galley);


    const galley2 = new ActaGalley('130mm', '130mm', '143.25mm', '142mm');
    const para2 = new ActaParagraph('본문3', 3, '2mm')
    galley2.appendChild(para2);

    page.appendChild(galley2);


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