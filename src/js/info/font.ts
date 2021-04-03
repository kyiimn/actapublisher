import ActaTextAttributeAbsolute from '../pageobject/textstyle/textattribute-absolute';
import fontmgr from '../pageobject/font/fontmgr';
import textstylemgr from '../pageobject/textstyle/textstylemgr';
import api from '../util/api';
import U from '../util/units';

export type Font = {
    id: number,
    mediaId: number,
    mediaName: string,
    name: string,
    fileStorageId: number,
    fileExtension: string,
    fileSize: number,
    sort: number
};

export type TextAttriubte = {
    id: number,
    mediaId: number,
    mediaName: string,
    name: string,
    sort: number,
    fontId: number,
    fontName: string,
    fontSize: number,
    colorId: number,
    xscale: number,
    letterSpacing: number,
    lineHeight: number,
    textAlign: number,
    underline: boolean,
    strikeline: boolean,
    indent: number
};

class ActaFontInfo {
    private static _instance: ActaFontInfo;

    static getInstance() {
        if (!ActaFontInfo._instance) ActaFontInfo._instance = new ActaFontInfo();
        return ActaFontInfo._instance;
    }
    static get in() { return ActaFontInfo.getInstance(); }
    async loadData() {
        let result: any = await api.get('/info/code/font');
        if (!result) return false;

        fontmgr.clear();
        for (const code of result.data) {
            const font: Font = code;
            const url = api.file(font);
            await fontmgr.add(url, font.name);
        }

        result = await api.get('/info/code/textstyle');
        if (!result) return false;

        textstylemgr.clear();
        for (const code of result.data) {
            const textstyle: TextAttriubte = code;
            if (!fontmgr.get(textstyle.fontName)) continue;

            const t = new ActaTextAttributeAbsolute(textstyle.fontName);
            t.fontSize = U.pt(textstyle.fontSize, U.MM);
            t.xscale = textstyle.xscale;
            t.letterSpacing = U.pt(textstyle.letterSpacing, U.MM);
            t.lineHeight = textstyle.lineHeight;
            t.textAlign = textstyle.textAlign;
            t.underline = textstyle.underline;
            t.strikeline = textstyle.strikeline;
            t.indent = U.pt(textstyle.indent, U.MM);
            t.colorId = textstyle.colorId;

            textstylemgr.add(textstyle.name, t);
        }
        return true;
    }
}
export default ActaFontInfo.in;