import ActaTextNode from './textnode';
import { TextAlign } from '../textstyle/textattribute-absolute';
import Stack from '../../util/stack';
import U from '../../util/units';

export default class ActaTextStore extends ActaTextNode {
    static import(textStyle: string, markupText: string) {
        const node = new Stack();
        const rootnode = new ActaTextStore();
        let currentnode: ActaTextStore | ActaTextNode = rootnode;
        let str = '';

        currentnode.textStyle = textStyle;

        for (let i = 0; i < markupText.length; i++) {
            let char = markupText[i];
            if (char === '<') {
                const endpos = markupText.indexOf('>', i);
                if (endpos > -1) {
                    const tagstr = markupText.substr(i + 1, endpos - i - 1);
                    i += tagstr.length + 1;
                    char = '';
                    if (tagstr[0] === '/') {
                        const tagname = tagstr.substr(1).toLowerCase();
                        let beforenode;
                        if (str.length > 0) { currentnode.push(str); str = ''; }
                        do {
                            beforenode = currentnode;
                            currentnode = node.pop();
                            if (!currentnode) {
                                currentnode = beforenode;
                                break;
                            }
                        } while (beforenode.tagName !== tagname && node.length >= 0);
                    } else {
                        const t = tagstr.split(' ');
                        const tagname = t[0].toLowerCase();
                        if (tagname === 'x-style') {
                            if (str.length > 0) { currentnode.push(str); str = ''; }
                            const newnode = new ActaTextNode(tagname);
                            const textAttr = newnode.modifiedTextAttribute;

                            currentnode.push(newnode);
                            node.push(currentnode);

                            for (let j = 1; j < t.length; j++) {
                                const tt = t[j].split('=');
                                let val = (tt[1][0] === '"' || tt[1][0] === '\'') ? tt[1].substr(1, Math.max(tt[1].length - 2, 0)) : tt[1];
                                if (val === '') continue;
                                val = val.toLowerCase();
                                switch (tt[0].toLowerCase()) {
                                    case 'name': newnode.textStyle = val; break;
                                    case 'color-id': textAttr.colorId = !isNaN(parseInt(val, 10)) ? parseInt(val, 10) : null; break;
                                    case 'underline': textAttr.underline = val === 'yes' ? true : false; break;
                                    case 'strikeline': textAttr.strikeline = val === 'yes' ? true : false; break;
                                    case 'xscale': textAttr.xscale = !isNaN(parseFloat(val)) ? parseFloat(val) : null; break;
                                    case 'line-height': textAttr.lineHeight = !isNaN(parseFloat(val)) ? parseFloat(val) : null; break;
                                    case 'letter-spacing': textAttr.letterSpacing = U.pt(val); break;
                                    case 'indent': textAttr.indent = U.pt(val); break;
                                    case 'font-size': textAttr.fontSize = U.pt(val); break;
                                    case 'font-name': textAttr.fontName = val; break;
                                    case 'text-align':
                                        textAttr.textAlign =
                                            (val === 'center' ? TextAlign.CENTER :
                                            (val === 'left' ? TextAlign.LEFT :
                                            (val === 'right' ? TextAlign.RIGHT :
                                            (val === 'justify' ? TextAlign.JUSTIFY : null
                                        ))));
                                        break;
                                    default: break;
                                }
                            }
                            newnode.modifiedTextAttribute = textAttr;
                            currentnode = newnode;
                        } else {
                            switch (tagname) {
                                case 'br': char = "\n"; break;
                                default: break;
                            }
                        }
                    }
                }
            } else {
                switch (char) {
                    case "\r": char = ''; break;
                    case "\n": char = ' '; break;
                    default: break;
                }
            }
            str += char;
            if (str.length > 0 && char === '\n') {
                currentnode.push(str); str = '';
            }
        }
        if (currentnode.length < 0 || str.length > 0) { currentnode.push(str); str = ''; }

        return rootnode;
    }

    get markupText() {
        let returnValue = '';
        for (const item of this.value) {
            returnValue += item.markupText;
        }
        const styleText = this.modifiedTextAttribute.toString();
        if (styleText !== '') returnValue = `<${this.tagName} ${styleText}>${returnValue}</${this.tagName}>`;

        return returnValue;
    }

    get text() {
        return this.toString();
    }
};