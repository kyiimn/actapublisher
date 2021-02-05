import ActaTextStyle from './textstyle';
import { Subject } from 'rxjs';

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
    private _CHANGE$: Subject<IActaTextStyleList>;

    private constructor() {
        this._list = {};
        this._CHANGE$ = new Subject();
    }

    add(name: string, style: ActaTextStyle) {
        style.name = name;
        this._list[name] = style;
        this._CHANGE$.next(this._list);
    }
    remove(name: string) {
        delete this._list[name];
        this._CHANGE$.next(this._list);
    }
    clear() {
        this._list = {};
        this._CHANGE$.next(this._list);
    }
    get(name: string) { return this._list[name]; }

    get list() { return this._list; }
    get length() { return Object.keys(this.list).length; }
    get observable() { return this._CHANGE$; }
};
export default ActaTextStyleManager.in;