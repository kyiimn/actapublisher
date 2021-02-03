import ActaFont from './font';
import opentype from 'opentype.js';

export default class ActaFontManager {
    private static _instance: ActaFontManager;
    static getInstance() {
        if (!ActaFontManager._instance) ActaFontManager._instance = new ActaFontManager();
        return ActaFontManager._instance;
    }

    static get in() {
        return ActaFontManager.getInstance();
    }

    private _list: ActaFont[];

    private constructor() {
        this._list = [];
    }

    async add(url: string, fontAlias?: string): Promise<number> {
        for (let i = 0; i < this._list.length; i++) {
            if (this._list[i].url === url) return new Promise((resolve: any) => {
                resolve(i);
            });
        }
        return new Promise((resolve: any, reject: any) => {
            opentype.load(url, (err, font) => {
                if (font !== undefined && !err) {
                    resolve(this._list.push(new ActaFont(url, font, fontAlias)) - 1);
                } else {
                    resolve(-1);
                }
            });
        });
    }

    get(idx: number | string) {
        if (typeof idx === 'number') {
            return this._list[idx];
        } else {
            for (const font of this._list) {
                if (font.familyEN !== idx &&
                    font.familyKO !== idx &&
                    font.fullnameEN !== idx &&
                    font.fullnameKO !== idx &&
                    font.name !== idx
                ) continue;
                return font;
            }
        }
        return false;
    }

    clear() {
        for (let i = 0; i < this._list.length; i++) {
            delete this._list[i];
        }
        this._list = [];
    }

    get list() { return this._list; }
    get length() { return this.list.length; }
};