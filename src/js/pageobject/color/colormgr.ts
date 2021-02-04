import ActaColor from './color';

class ActaColorManager {
    private static _instance: ActaColorManager;
    static getInstance() {
        if (!ActaColorManager._instance) ActaColorManager._instance = new ActaColorManager();
        return ActaColorManager._instance;
    }

    static get in() {
        return ActaColorManager.getInstance();
    }

    private _list: ActaColor[];

    private constructor() {
        this._list = [];
    }

    add(data: {
        id: number, name: string, colorType: string, code: string, rgbCode: string
    }) {
        this._list.push(new ActaColor(data));

    }

    get(name: number | string) {
        if (typeof name === 'number') {
            for (const color of this._list) {
                if (color.id === name) return color;
            }
        } else {
            for (const color of this._list) {
                if (color.name === name) return color;
            }
        }
        return false;
    }

    getRGBCode(name: number | string) {
        let retColor;
        if (typeof name === 'number') {
            for (const color of this._list) {
                if (color.id !== name) continue;
                retColor = color;
                break;
            }
        } else {
            for (const color of this._list) {
                if (color.name !== name) continue;
                retColor = color;
                break;
            }
        }
        return retColor ? retColor.rgbCode : '#000000';
    }

    clear() {
        for (let i = 0; i < this._list.length; i++) {
            delete this._list[i];
        }
        this._list = [];
    }

    list(colorType?: string) {
        const retList: ActaColor[] = [];
        for (const color of this._list) {
            if (colorType && color.colorType !== colorType) continue;
            retList.push(color);
        }
        return retList;
    }

    length(colorType?: string) {
        return this.list(colorType).length;
    }
};
export default ActaColorManager.in;