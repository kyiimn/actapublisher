import api from '../util/api';

interface IActaCodeClass {
    class: number,
    code: string,
    name: string,
    mediaId?: number,
    sort?: number,
    use: boolean
};

interface IActaCodeMedia {
    id: number,
    name: string,
    type: string
};

interface IActaCodeLocal {
    id: number,
    code: string,
    name: string,
    mediaId: number,
    sort: number,
    use: boolean
};

interface IActaCodeEdition {
    id: number,
    edition: number,
    name: string,
    mediaId: number,
    use: boolean
};

interface IActaCodeSection {
    id: number,
    code: string,
    name: string,
    mediaId: number,
    use: boolean
};

interface IActaCodeAdverSize {
    id: number,
    name: string,
    mediaId: number,
    use: boolean
};

interface IActaCodeAdverLocal {
    id: number,
    code: string,
    name: string,
    mediaId: number,
    sort: number,
    use: boolean
};

interface IActaCodeColor {
    id: number,
    name: string
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
    page: number,
    editionId: number
};

interface IActaCodePageSize {
    id: number,
    name: string,
    paperType: string,
    paperWidth: number,
    paperHeight: number,
    paperDirection: string,
    linespacingSize: number,
    linespacingUnit: string,
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

interface IActaCodeFont {
    id: number,
    mediaId: number,
    name: string,
    fileStorageId: number,
    fileExtension: string,
    fileSize: number,
    sort: number
};

interface IActaCodeTextStyle {
    id: number,
    mediaId: number,
    name: string,
    sort: number,
    fontId: number,
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

class ActaCodeInfo {
    private static _instance: ActaCodeInfo;

    static getInstance() {
        if (!ActaCodeInfo._instance) ActaCodeInfo._instance = new ActaCodeInfo();
        return ActaCodeInfo._instance;
    }
    static get in() { return ActaCodeInfo.getInstance(); }

    private _codeTable: IActaCodeClass[];
    private _media: IActaCodeMedia[];
    private _local: IActaCodeLocal[];
    private _edition: IActaCodeEdition[];
    private _section: IActaCodeSection[];
    private _adverSize: IActaCodeAdverSize[];
    private _adverLocal: IActaCodeAdverLocal[];
    private _color: IActaCodeColor[];
    private _printType: IActaCodePrintType[];
    private _closingTime: IActaCodeClosingTime[];
    private _pageSize: IActaCodePageSize[];
    private _font: IActaCodeFont[];
    private _textStyle: IActaCodeTextStyle[];

    private constructor() {
        this._codeTable = [];
        this._media = [];
        this._local = [];
        this._edition = [];
        this._section = [];
        this._adverSize = [];
        this._adverLocal = [];
        this._color = [];
        this._printType = [];
        this._closingTime = [];
        this._pageSize = [];
        this._font = [];
        this._textStyle = [];
    }

    async loadData() {
        return new Promise((resolve, reject) => {
            api.get('/info/code/codeclass').then(response => {
                console.log(response);
            });
        });
    }
}
export default ActaCodeInfo.in;