import supportedFeatures from './features';

enum ClipboardDataType {
    NONE, TEXT, OBJECT
};

export default class ActaClipboard {
    private static _instance: ActaClipboard;

    static getInstance() {
        if (!ActaClipboard._instance) ActaClipboard._instance = new ActaClipboard();
        return ActaClipboard._instance;
    }

    static get in() {
        return ActaClipboard.getInstance();
    }

    private _enableSystemClipboard: boolean;
    private _data: any;
    private _dataType: ClipboardDataType;
    private _dataPairText: string;

    private constructor() {
        this._enableSystemClipboard = supportedFeatures.clipboard;

        this._data = undefined;
        this._dataType = ClipboardDataType.NONE;
        this._dataPairText = '';
    }

    write(data: any) {
        if (!data) {
            this._dataType = ClipboardDataType.NONE;
            this._dataPairText = '';
            this._data = undefined;
            if (this.enableSystemClipboard) navigator.clipboard.writeText('');
        } else {
            this._data = data;
            if (typeof(this._data) === 'string') {
                this._dataType = ClipboardDataType.TEXT;
            } else {
                this._dataType = ClipboardDataType.OBJECT;
            }
            if (this._enableSystemClipboard) {
                const text = data.toString();
                this._dataPairText = text;
                navigator.clipboard.writeText(text);
            }
        }
        return data;
    }

    async read() {
        return new Promise((resolve, reject) => {
            if (this.enableSystemClipboard) {
                navigator.clipboard.readText().then(v => {
                    if (this._dataPairText === v.toString()) {
                        resolve(this._dataType !== ClipboardDataType.TEXT ? this._data : v);
                    } else {
                        resolve(v);
                    }
                });
            } else {
                resolve(this._data);
            }
        });
    }

    get enableSystemClipboard() { return this._enableSystemClipboard; }
};