import { ActaPageElement } from './element/page-el';
import { ActaGuideElement } from './element/guide-el';
import { ActaGuideColumnElement, ActaGuideMarginElement } from './element/guide-col-el';
import { ActaGalleyElement } from './element/galley-el';
import { ActaParagraphElement } from './element/paragraph-el';
import { ActaParagraphColumnElement } from './element/paragraph-col-el';
import { ActaParagraphMarginElement } from './element/paragraph-margin-el';

customElements.define('x-page', ActaPageElement);
customElements.define('x-guide-col', ActaGuideColumnElement);
customElements.define('x-guide-margin', ActaGuideMarginElement);
customElements.define('x-guide', ActaGuideElement);
customElements.define('x-galley', ActaGalleyElement);
customElements.define('x-paragraph-col', ActaParagraphColumnElement);
customElements.define('x-paragraph', ActaParagraphElement);
customElements.define('x-paragraph-margin', ActaParagraphMarginElement);