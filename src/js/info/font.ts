import ActaFontManager from '../pageobject/font/fontmgr';
import ActaFont from '../pageobject/font/font';
import api from '../util/api';

export interface IActaFont {
    id: number,
    mediaId: number,
    mediaName?: string,
    name: string,
    fileStorageId: number,
    fileExtension: string,
    fileSize: number,
    sort: number
};

export interface IActaTextStyle {
    id: number,
    mediaId: number,
    mediaName?: string,
    name: string,
    sort: number,
    fontId: number,
    fontName?: string,
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
        ActaFontManager.in.clear();
        const fontidset: { [id: number]: ActaFont } = {};
        const result: any = await api.get('/info/code/font');
        if (result) {
            for (const font of result.data) {
                const url = api.url(`${font.fileStorageId}/${font.id}`);
                fontidset[font.id] = await ActaFontManager.in.add(url);
            }
        }
    }
}
export default ActaFontInfo.in;