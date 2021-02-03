import opentype from 'opentype.js';

export default class ActaFont {
    private _url: string;
    private _font: opentype.Font;
    private _fontAlias?: string;
    private _fontFamilyEN: string;
    private _fontFamilyKO: string;
    private _fontSubfamilyEN: string;
    private _fontSubfamilyKO: string;
    private _fontFullnameEN: string;
    private _fontFullnameKO: string;

    constructor(url: string, font: opentype.Font, fontAlias?: string) {
        this._url = url;
        this._font = font;
        this._fontAlias = fontAlias;
        this._fontFamilyEN = font.names.fontFamily.en;
        this._fontSubfamilyEN = font.names.fontSubfamily.en;
        this._fontFamilyKO = font.names.fontFamily.ko || font.names.fontFamily.en;
        this._fontSubfamilyKO = font.names.fontSubfamily.ko || font.names.fontSubfamily.en;
        this._fontFullnameEN = `${this._fontFamilyEN} ${this._fontSubfamilyEN}`.trim();
        this._fontFullnameKO = `${this._fontFamilyKO} ${this._fontSubfamilyKO}`.trim();
    }
    get url() { return this._url; }
    get font() { return this._font; }
    get familyEN() { return this._fontFamilyEN; }
    get subfamilyEN() { return this._fontSubfamilyEN; }
    get familyKO() { return this._fontFamilyKO; }
    get subfamilyKO() { return this._fontSubfamilyKO; }
    get fullnameEN() { return this._fontFullnameEN; }
    get fullnameKO() { return this._fontFullnameKO; }
    get family() { return this.familyKO || this.familyEN; }
    get subfamily() { return this.subfamilyKO || this.subfamilyEN; }
    get fullname() { return this.fullnameKO || this.fullnameEN; }
    get name() { return this._fontAlias || this.fullname; }
};