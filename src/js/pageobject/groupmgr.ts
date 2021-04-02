import IActaFrame from './interface/frame';
import ActaPage from './page';

export type ActaGroup = number;
export class ActaGroupManager {
    private static _instances: { [pageKey: string]: ActaGroupManager };
    static getInstance(page: ActaPage) {
        if (!ActaGroupManager._instances[page.id]) ActaGroupManager._instances[page.id] = new ActaGroupManager();
        return ActaGroupManager._instances[page.id];
    }
    static in(page: ActaPage) {
        return ActaGroupManager.getInstance(page);
    }

    private _list: string[];
    private _member: { [group: string]: string[] };

    private constructor() {
        this._list = [];
        this._member = {};
    }

    add(frame: IActaFrame) {
    }
}