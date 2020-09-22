import { supportedFeatures } from './utils';

export enum ClipboardDataType {
    NONE, TEXT, OBJECT
};

export class ActaClipboard {
    private static _instance: ActaClipboard;
    static getInstance() {
        if (!ActaClipboard._instance) ActaClipboard._instance = new ActaClipboard();
        return ActaClipboard._instance;
    }

    private _supportedSystem: boolean;

    private _data: any;
    private _dataType: ClipboardDataType;
    private _dataPairText: string | undefined;

    private constructor() {
        this._supportedSystem = supportedFeatures().clipboard;

        this._data = undefined;
        this._dataType = ClipboardDataType.NONE;
        this._dataPairText = undefined;
    }

    write(data: any) {
        this._data = data;
        if (!this._data) {
            this._dataType = ClipboardDataType.NONE;
        } else if (typeof(this._data) === 'string') {
            this._dataType = ClipboardDataType.TEXT;
        } else {
            this._dataType = ClipboardDataType.OBJECT;
        }
        if (this._supportedSystem) {
            const text = 
        }
        this._data =
    }

    async read() {
        const text = 
    }
};