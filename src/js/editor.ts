import ActaPage from './pageobject/page';
import ActaGuide from './pageobject/guide';
import ActaParagraph from './pageobject/paragraph';
import ActaImage from './pageobject/image';
import { ImageFitType } from './pageobject/image';
import { FrameOverlapMethod } from './pageobject/interface/frame';
import fontmgr from './pageobject/font/fontmgr';
import colormgr from './pageobject/color/colormgr';
import textstylemgr from './pageobject/textstyle/textstylemgr';
import ActaTextAttributeAbsolute from './pageobject/textstyle/textattribute-absolute';
import U from './util/units';

import '../css/pageobject.scss';

const main = async () => {
    await fontmgr.add('fonts/jabml.ttf');
    await fontmgr.add('fonts/jahgl.ttf');

    colormgr.add({id: 1, name: 'red', colorType: 'RGB', code: '#ff0000', rgbCode: '#ff0000' });

    let s;
    s = new ActaTextAttributeAbsolute('중앙신문명조');
    s.fontSize = U.px('9pt');
    textstylemgr.add('본문1', s);

    s = new ActaTextAttributeAbsolute('중앙세고딕');
    s.fontSize = U.px('9pt');
    s.letterSpacing = 1;
    s.colorId = 1;
    textstylemgr.add('본문2', s);

    s = new ActaTextAttributeAbsolute('중앙신문명조');
    s.fontSize = U.px('9pt');
    s.indent = 8;
    textstylemgr.add('본문3', s);

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
    para3.overlapMethod = FrameOverlapMethod.SHAPE;
    para3.margin = 10;

    const para5 = new ActaImage('90mm', '25mm', '40mm', '40mm');// , '본문3', 2, '2mm');
    page.appendChild(para5);

    para5.src = 'test/bigsur.eps';
    para5.fitType = ImageFitType.FIT_FRAME;
    para5.overlapMethod = FrameOverlapMethod.SHAPE;
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