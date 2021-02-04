import colormgr from '../pageobject/color/colormgr';
import api from '../util/api';

interface IActaCodeClass {
    class: number,
    code: string,
    name: string,
    mediaId?: number,
    mediaName?: string,
    sort?: number,
    use: boolean
};

interface IActaCodeMedia {
    id: number,
    name: string,
    type: string,
    typeName: string
};

interface IActaCodeLocal {
    id: number,
    code: string,
    name: string,
    mediaId: number,
    mediaName: string,
    sort: number,
    use: boolean
};

interface IActaCodeEdition {
    id: number,
    edition: number,
    name: string,
    mediaId: number,
    mediaName: string,
    use: boolean
};

interface IActaCodeSection {
    id: number,
    code: string,
    name: string,
    mediaId: number,
    mediaName: string,
    use: boolean
};

interface IActaCodeAdverSize {
    id: number,
    name: string,
    mediaId: number,
    mediaName: string,
    use: boolean
};

interface IActaCodeAdverLocal {
    id: number,
    code: string,
    name: string,
    mediaId: number,
    mediaName: string,
    sort: number,
    use: boolean
};

interface IActaCodeColor {
    id: number,
    code: string,
    name: string,
    mediaId: number,
    mediaName: string,
    colorType: string,
    colorTypeName: string,
    rgbCode: string,
    sort: number
};

interface IActaCodePrintType {
    id: number,
    name: string
};

interface IActaCodeClosingTime {
    id: number,
    closingDate?: string,
    closingTime: string,
    mediaId: number,
    mediaName: string,
    page: number,
    editionId: number,
    editionName: string
};

interface IActaCodePageSize {
    id: number,
    name: string,
    paperType: string,
    paperTypeName: string,
    paperWidth: number,
    paperHeight: number,
    paperDirection: string,
    paperDirectionName: string,
    linespacingSize: number,
    linespacingUnit: string,
    linespacingUnitName: string,
    linespacingRatio: number,
    columnMarginInside: number,
    columnMarginOutside: number,
    columnCount: number,
    columnSize: number,
    columnSpacing: number,
    columnOther: number,
    columnTotalSize: number,
    lineMarginTop: number,
    lineMarginBottom: number,
    lineHeight: number,
    lineCount: number,
    lineSpacing: number,
    lineOther: number,
    lineTotalSize: number
};

class ActaCodeInfo {
    private static _instance: ActaCodeInfo;

    static getInstance() {
        if (!ActaCodeInfo._instance) ActaCodeInfo._instance = new ActaCodeInfo();
        return ActaCodeInfo._instance;
    }
    static get in() { return ActaCodeInfo.getInstance(); }

    private _codeClass: IActaCodeClass[];
    private _media: IActaCodeMedia[];
    private _local: IActaCodeLocal[];
    private _edition: IActaCodeEdition[];
    private _section: IActaCodeSection[];
    private _adverSize: IActaCodeAdverSize[];
    private _adverLocal: IActaCodeAdverLocal[];
    private _printType: IActaCodePrintType[];
    private _closingTime: IActaCodeClosingTime[];
    private _pageSize: IActaCodePageSize[];

    private constructor() {
        this._codeClass = [];
        this._media = [];
        this._local = [];
        this._edition = [];
        this._section = [];
        this._adverSize = [];
        this._adverLocal = [];
        this._printType = [];
        this._closingTime = [];
        this._pageSize = [];
    }

    async loadData() {
        let result: any;
        result = await api.get('/info/code/codeclass');
        if (result) {
            for (const code of result.data) this._codeClass.push(code);
        }

        result = await api.get('/info/code/media');
        if (result) {
            for (const code of result.data) this._media.push(code);
        }

        result = await api.get('/info/code/local');
        if (result) {
            for (const code of result.data) this._local.push(code);
        }

        result = await api.get('/info/code/edition');
        if (result) {
            for (const code of result.data) this._edition.push(code);
        }

        result = await api.get('/info/code/section');
        if (result) {
            for (const code of result.data) this._section.push(code);
        }

        result = await api.get('/info/code/adversize');
        if (result) {
            for (const code of result.data) this._adverSize.push(code);
        }

        result = await api.get('/info/code/adverlocal');
        if (result) {
            for (const code of result.data) this._adverLocal.push(code);
        }

        result = await api.get('/info/code/color');
        if (result) {
            for (const code of result.data as IActaCodeColor[]) colormgr.add(code);
        }

        result = await api.get('/info/code/printtype');
        if (result) {
            for (const code of result.data) this._printType.push(code);
        }

        result = await api.get('/info/code/closingtime');
        if (result) {
            for (const code of result.data) this._closingTime.push(code);
        }

        result = await api.get('/info/code/pagesize');
        if (result) {
            for (const code of result.data) this._pageSize.push(code);
        }
    }
    get codeClass() { return this._codeClass; }
    get media() { return this._media; }
    get local() { return this._local; }
    get edition() { return this._edition; }
    get section() { return this._section; }
    get adverSize() { return this._adverSize; }
    get adverLocal() { return this._adverLocal; }
    get printType() { return this._printType; }
    get closingTime() { return this._closingTime; }
    get pageSize() { return this._pageSize; }
}
export default ActaCodeInfo.in;