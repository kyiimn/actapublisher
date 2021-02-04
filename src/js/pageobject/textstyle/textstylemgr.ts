import ActaTextStyle from './textstyle';

interface IActaTextStyleList {
    [styleName: string] : ActaTextStyle
};

class ActaTextStyleManager {
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

    add(name: string, style: ActaTextStyle) {
        style.name = name;
        this._list[name] = style;
    }
    remove(name: string) { delete this._list[name]; }
    get(name: string) { return this._list[name]; }
    clear() { this._list = {}; }

    get list() { return this._list; }
    get length() { return Object.keys(this.list).length; }
};
export default ActaTextStyleManager.in;