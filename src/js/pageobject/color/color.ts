export default class ActaColor {
    private _id: number;
    private _name: string;
    private _colorType: string;
    private _code: string;
    private _rgbCode: string;

    constructor(data: {
        id: number, name: string, colorType: string, code: string, rgbCode: string
    }) {
        this._id = data.id;
        this._name = data.name;
        this._colorType = data.colorType;
        this._code = data.code;
        this._rgbCode = data.rgbCode;
    }
    get id() { return this._id; }
    get name() { return this._name; }
    get colorType() { return this._colorType; }
    get code() { return this._code; }
    get rgbCode() { return this._rgbCode; }
};