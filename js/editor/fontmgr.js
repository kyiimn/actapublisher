class ActaFontManager {
    static getInstance() {
        if (!ActaFontManager._instance) ActaFontManager._instance = new ActaFontManager();
        return ActaFontManager._instance;
    }

    constructor() {
        this._list = [];
    }

    async add(url) {
        for (let i = 0; i < this._list.length; i++) {
            if (this._list[i].url == url) return new Promise((resolve, reject) => {
                resolve(i);
            });
        }
        return new Promise((resolve, reject) => {
            opentype.load(url, (err, font) => {
                if (!err) {
                    resolve(this._list.push(new ActaFont(url, font)) - 1);
                } else {
                    reject(err);
                }
            });
        });
    }

    get(idx) {
        if (typeof idx == 'number') {
            return this._list[idx];
        } else {
            for (let i = 0; i < this._list.length; i++) {
                if (this._list[i].familyEN != idx &&
                    this._list[i].familyKO != idx &&
                    this._list[i].fullnameEN != idx &&
                    this._list[i].fullnameKO != idx
                ) continue;
                return this._list[i];
            }
        }
        return false;
    }

    get list() { return this._list; }
    get length() { return this.list.length; }
};

class ActaFont {
    constructor(url, font) {
        this._url = url;
        this._font = font;
        this._fontFamilyEN = font.names.fontFamily.en;
        this._fontSubfamilyEN = font.names.fontSubfamily.en;
        this._fontFamilyKO = font.names.fontFamily.ko || font.names.fontFamily.en;
        this._fontSubfamilyKO = font.names.fontSubfamily.ko || font.names.fontSubfamily.en;
        this._fontFullnameEN = $.trim(`${this._fontFamilyEN} ${this._fontSubfamilyEN}`);
        this._fontFullnameKO = $.trim(`${this._fontFamilyKO} ${this._fontSubfamilyKO}`);
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
};