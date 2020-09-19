import { ActaTextNode } from './textnode';
import { Stack } from '../utils';

export class ActaTextConverter {
    static textobject(text: string) {
        const node = new Stack();
        let currentnode = new ActaTextNode();
        let str = '';

        for (let i = 0; i < text.length; i++) {
            let char = text[i];
            if (char === '<') {
                const endpos = text.indexOf('>', i);
                if (endpos > -1) {
                    const tagstr = text.substr(i + 1, endpos - i - 1);
                    i += tagstr.length + 1;
                    char = '';
                    if (tagstr[0] === '/') {
                        const tagname = tagstr.substr(1).toLowerCase();
                        let beforenode;
                        if (str.length > 0) { currentnode.add(str); str = ''; }
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
                            if (str.length > 0) { currentnode.add(str); str = ''; }
                            const newnode = new ActaTextNode(tagname);
                            const textStyle = newnode.customTextStyle;

                            currentnode.add(newnode);
                            node.push(currentnode);

                            for (let j = 1; j < t.length; j++) {
                                const tt = t[j].split('=');
                                const val = (tt[1][0] === '"') ? tt[1].substr(1, Math.max(tt[1].length - 2, 0)) : tt[1];
                                if (val === '') continue;
                                switch (tt[0]) {
                                    case 'name': newnode.defaultTextStyleName = val; break;
                                    default: break;
                                }
                            }
                            newnode.customTextStyle = textStyle;
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
                currentnode.add(str); str = '';
            }
        }
        if (str.length > 0) { currentnode.add(str); str = ''; }

        return currentnode || node.first();
    }
};