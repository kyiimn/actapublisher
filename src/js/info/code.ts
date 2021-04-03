import colormgr from '../pageobject/color/colormgr';
import api from '../util/api';

export type CodeClass = {
    class: number,
    code: string,
    name: string,
    mediaId?: number,
    mediaName?: string,
    sort?: number,
    use: boolean
};

export type CodeMedia = {
    id: number,
    name: string,
    type: string,
    typeName: string
};

export type CodeLabel = {
    id: number,
    code: string,
    name: string,
    mediaId: number,
    mediaName: string,
    sort: number,
    use: boolean
};

export type CodeEditon = {
    id: number,
    edition: number,
    name: string,
    mediaId: number,
    mediaName: string,
    use: boolean
};

export type CodeSection = {
    id: number,
    code: string,
    name: string,
    mediaId: number,
    mediaName: string,
    use: boolean
};

export type CodeAdverSize = {
    id: number,
    name: string,
    mediaId: number,
    mediaName: string,
    use: boolean
};

export type CodeAdverLocal = {
    id: number,
    code: string,
    name: string,
    mediaId: number,
    mediaName: string,
    sort: number,
    use: boolean
};

export type CodeColor = {
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

export type CodePrintType = {
    id: number,
    name: string
};

export type CodeClosingTime = {
    id: number,
    closingDate?: string,
    closingTime: string,
    mediaId: number,
    mediaName: string,
    page: number,
    editionId: number,
    editionName: string
};

export type CodePageSize = {
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

    private _codeClass: CodeClass[];
    private _media: CodeMedia[];
    private _local: CodeLabel[];
    private _edition: CodeEditon[];
    private _section: CodeSection[];
    private _adverSize: CodeAdverSize[];
    private _adverLocal: CodeAdverLocal[];
    private _printType: CodePrintType[];
    private _closingTime: CodeClosingTime[];
    private _pageSize: CodePageSize[];

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
        if (!result) return false;
        for (const code of result.data) this._codeClass.push(code);

        result = await api.get('/info/code/media');
        if (!result) return false;
        for (const code of result.data) this._media.push(code);

        result = await api.get('/info/code/local');
        if (!result) return false;
        for (const code of result.data) this._local.push(code);

        result = await api.get('/info/code/edition');
        if (!result) return false;
        for (const code of result.data) this._edition.push(code);

        result = await api.get('/info/code/section');
        if (!result) return false;
        for (const code of result.data) this._section.push(code);

        result = await api.get('/info/code/adversize');
        if (!result) return false;
        for (const code of result.data) this._adverSize.push(code);

        result = await api.get('/info/code/adverlocal');
        if (!result) return false;
        for (const code of result.data) this._adverLocal.push(code);

        result = await api.get('/info/code/color');
        if (!result) return false;
        for (const code of result.data as CodeColor[]) colormgr.add(code);

        result = await api.get('/info/code/printtype');
        if (!result) return false;
        for (const code of result.data) this._printType.push(code);

        result = await api.get('/info/code/closingtime');
        if (!result) return false;
        for (const code of result.data) this._closingTime.push(code);

        result = await api.get('/info/code/pagesize');
        if (!result) return false;
        for (const code of result.data) this._pageSize.push(code);

        return true;
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

    findCodeClass(cls: number, code: string): CodeClass | null {
        let ret = null;
        for (const cc of this.codeClass) {
            if (cc.class !== cls || cc.code !== code) continue;
            ret = cc;
            break;
        }
        return ret;
    }

    findMedia(id: number): CodeMedia | null {
        let ret = null;
        for (const code of this.media) {
            if (code.id !== id) continue;
            ret = code;
            break;
        }
        return ret;
    }

    findLocal(id: number): CodeLabel | null {
        let ret = null;
        for (const code of this.local) {
            if (code.id !== id) continue;
            ret = code;
            break;
        }
        return ret;
    }

    findEdition(id: number): CodeEditon | null {
        let ret = null;
        for (const code of this.edition) {
            if (code.id !== id) continue;
            ret = code;
            break;
        }
        return ret;
    }

    findSection(id: number): CodeSection | null {
        let ret = null;
        for (const code of this.section) {
            if (code.id !== id) continue;
            ret = code;
            break;
        }
        return ret;
    }

    findAdverSize(id: number): CodeAdverSize | null {
        let ret = null;
        for (const code of this.adverSize) {
            if (code.id !== id) continue;
            ret = code;
            break;
        }
        return ret;
    }

    findAdverLocal(id: number): CodeAdverLocal | null {
        let ret = null;
        for (const code of this.adverLocal) {
            if (code.id !== id) continue;
            ret = code;
            break;
        }
        return ret;
    }

    findPrintType(id: number): CodePrintType | null {
        let ret = null;
        for (const code of this.printType) {
            if (code.id !== id) continue;
            ret = code;
            break;
        }
        return ret;
    }

    findClosingTime(id: number): CodeClosingTime | null {
        let ret = null;
        for (const code of this.closingTime) {
            if (code.id !== id) continue;
            ret = code;
            break;
        }
        return ret;
    }

    findPageSize(id: number): CodePageSize | null {
        let ret = null;
        for (const code of this.pageSize) {
            if (code.id !== id) continue;
            ret = code;
            break;
        }
        return ret;
    }
}
export default ActaCodeInfo.in;