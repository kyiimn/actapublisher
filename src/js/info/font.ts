import ActaFontManager from '../pageobject/font/fontmgr';
import ActaTextStyle from '../pageobject/textstyle/textstyle';
import ActaTextStyleManager from '../pageobject/textstyle/textstylemgr';
import api from '../util/api';
import U from '../util/units';

export interface IActaFont {
    id: number,
    mediaId: number,
    mediaName: string,
    name: string,
    fileStorageId: number,
    fileExtension: string,
    fileSize: number,
    sort: number
};

export interface IActaTextStyle {
    id: number,
    mediaId: number,
    mediaName: string,
    name: string,
    sort: number,
    fontId: number,
    fontName: string,
    fontSize: number,
    color: string,
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
        if (!result) {
            return;
        }
        ActaFontManager.in.clear();
        for (const code of result.data) {
            const font: IActaFont = code;
            const url = api.file(font);
            await ActaFontManager.in.add(url, font.name);
        }

        result = await api.get('/info/code/textstyle');
        if (!result) {
            return;
        }
        ActaTextStyleManager.in.clear();
        for (const code of result.data) {
            const textstyle: IActaTextStyle = code;
            if (!ActaFontManager.in.get(textstyle.fontName)) continue;

            const t = new ActaTextStyle(textstyle.fontName);
            t.fontSize = U.px(textstyle.fontSize + 'mm');
            t.xscale = textstyle.xscale;
            t.letterSpacing = U.px(textstyle.letterSpacing + 'mm');
            t.lineHeight = textstyle.lineHeight;
            t.textAlign = textstyle.textAlign;
            t.underline = textstyle.underline;
            t.strikeline = textstyle.strikeline;
            t.indent = U.px(textstyle.indent + 'mm');
            t.color = '#000000';

            ActaTextStyleManager.in.add(textstyle.name, t);
        }
    }
}
export default ActaFontInfo.in;