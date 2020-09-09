class ActaFontManager {
    static getInstance() {
        if (!ActaFontManager._instance) ActaFontManager._instance = new ActaFontManager();
        return ActaFontManager._instance;
    }

    constructor() {
        this._fontList = [];
    }

    async add(url) {
        for (let i = 0; i < this._fontList.length; i++) {
            if (this._fontList[i].url == url) return new Promise((resolve, reject) => {
                resolve(i);
            });
        }
        return new Promise((resolve, reject) => {
            opentype.load(url, (err, font) => {
                if (!err) {
                    let info = {
                        url: url,
                        font: font,
                        fontFamilyEN: font.names.fontFamily.en,
                        fontSubfamilyEN: font.names.fontSubfamily.en,
                        fontFamilyKO: font.names.fontFamily.ko,
                        fontSubfamilyKO: font.names.fontSubfamily.ko,
                        fontFullnameEN: $.trim(`${font.names.fontFamily.en} ${font.names.fontSubfamily.en}`),
                        fontFullnameKO: $.trim(`${font.names.fontFamily.ko} ${font.names.fontSubfamily.ko}`)
                    };
                    info.fontFamily = info.fontFamilyKO || info.fontFamilyEN;
                    info.fontSubfamily = info.fontSubfamilyKO || info.fontSubfamilyEN;
                    info.fontFullname = info.fontFullnameKO || info.fontFullnameEN;

                    resolve(this._fontList.push(info) - 1);
                } else reject(err);
            });
        });
    }

    info(idx) {
        if (typeof idx == 'number') {
            return this._fontList[idx];
        } else {
            for (let i = 0; i < this._fontList.length; i++) {
                if (this._fontList[i].fontFamilyEN != idx &&
                    this._fontList[i].fontFamilyKO != idx &&
                    this._fontList[i].fontFullnameEN != idx &&
                    this._fontList[i].fontFullnameKO != idx
                ) continue;
                return this._fontList[i];
            }
        }
        return false;
    }

    font(idx) {
        let info = this.info(idx);
        if (info === false) return false;
        return info.font;
    }

    get list() { return this._fontList; }
    get length() { return this.list.length; }
}