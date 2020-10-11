import { ActaParagraphElement } from './element/paragraph-el';
import { ActaParagraphColumnElement } from './element/paragraph-col-el';
import { ActaParagraphMarginElement } from './element/paragraph-margin-el';

customElements.define('x-paragraph-col', ActaParagraphColumnElement);
customElements.define('x-paragraph', ActaParagraphElement);
customElements.define('x-paragraph-margin', ActaParagraphMarginElement);