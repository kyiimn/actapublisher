import { ActaTextStyle } from './textstyle';

interface IActaTextStyleList {
    [styleName: string] : ActaTextStyle
};

export class ActaTextStyleManager {
    private static _instance: ActaTextStyleManager;
    static getInstance() {
        if (!ActaTextStyleManager._instance) ActaTextStyleManager._instance = new ActaTextStyleManager();
        return ActaTextStyleManager._instance;
    }

    static get in() {
        return ActaTextStyleManager.getInstance();
    }

    private _list: IActaTextStyleList;
    private constructor() { this._list = {}; }

    add(name: string, style: ActaTextStyle) { this._list[name] = style; }
    remove(name: string) { delete this._list[name]; }
    get(name: string) { return this._list[name]; }

    get list() { return this._list; }
    get length() { return Object.keys(this.list).length; }
};