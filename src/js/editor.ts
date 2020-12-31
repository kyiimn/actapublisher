import { ActaPage } from './editor/page';
import { ActaGuide } from './editor/guide';
import { ActaParagraph } from './editor/paragraph';
import { ActaImage, ImageFitType, ImageOverlapMethod } from './editor/image';
import { ActaFontManager } from './editor/fontmgr';
import { ActaTextStyleManager } from './editor/text/textstylemgr';
import { ActaTextStyle, TextAlign } from './editor/text/textstyle';
import U from './editor/units';

import '../css/element.scss';

const main = async () => {
    await ActaFontManager.in.add('fonts/jabml.ttf');
    await ActaFontManager.in.add('fonts/jahgl.ttf');

    let s;
    s = new ActaTextStyle('중앙신문명조');
    s.fontSize = U.px('9pt');
    ActaTextStyleManager.in.add('본문1', s);

    s = new ActaTextStyle('중앙세고딕');
    s.fontSize = U.px('9pt');
    s.letterSpacing = 1;
    s.color = '#ff0000';
    ActaTextStyleManager.in.add('본문2', s);

    s = new ActaTextStyle('중앙신문명조');
    s.fontSize = U.px('9pt');
    s.indent = 8;
    ActaTextStyleManager.in.add('본문3', s);

    const page = new ActaPage('25cm', '30cm');
    page.paddingTop = '0.5cm';
    page.paddingBottom = '0.5cm';
    page.paddingLeft = '0.5cm';
    page.paddingRight = '0.5cm';
    document.body.appendChild(page);

    const guide = new ActaGuide(5, '2mm');
    page.guide = guide;

    const para = new ActaParagraph('5mm', '5mm', '143.25mm', '142mm', '본문3', 3, '2mm');
    page.appendChild(para);

    const para2 = new ActaParagraph('130mm', '130mm', '143.25mm', '142mm', '본문3', 3, '2mm');
    page.appendChild(para2);

    const para3 = new ActaImage('80mm', '20mm', '40mm', '40mm');// , '본문3', 2, '2mm');
    page.appendChild(para3);

    para3.src = 'test/bigsur.eps';
    para3.fitType = ImageFitType.FIT_FRAME;
    para3.overlapMethod = ImageOverlapMethod.SHAPE;
    para3.margin = 10;

    const para5 = new ActaImage('90mm', '25mm', '40mm', '40mm');// , '본문3', 2, '2mm');
    page.appendChild(para5);

    para5.src = 'test/bigsur.eps';
    para5.fitType = ImageFitType.FIT_FRAME;
    para5.overlapMethod = ImageOverlapMethod.SHAPE;
    para5.margin = 10;

    const para4 = new ActaParagraph('60mm', '60mm', '20mm', '40mm', '본문3', 1, '2mm');
    page.appendChild(para4);

    const submitButton = document.querySelector('button#submit');
    const textarea = document.querySelector('textarea');
    if (submitButton) submitButton.addEventListener('click', _ => {
        let tt = textarea ? textarea.value : '';
        tt = tt.substring(0, tt.length);
        para.value = tt;
    });
    const getButton = document.querySelector('button#get');
    if (getButton) getButton.addEventListener('click', _ => {
        if (textarea) textarea.value = para.value;
    });
    const chColButton = document.querySelector('button#column');
    if (chColButton) chColButton.addEventListener('click', _ => {
        para.columnCount = 2;
    });
};
main();