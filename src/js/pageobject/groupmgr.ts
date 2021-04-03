import IActaFrame from './interface/frame';
import ActaPage from './page';
import { v4 as uuidv4 } from 'uuid';

export type GroupID = string;

type GroupData = {
    groupList: GroupID[],
    member: { [group: string]: IActaFrame[] }
};

class ActaGroupManager {
    private static _instance: ActaGroupManager;
    static getInstance() {
        if (!ActaGroupManager._instance) ActaGroupManager._instance = new ActaGroupManager();
        return ActaGroupManager._instance;
    }
    static get in() {
        return ActaGroupManager.getInstance();
    }

    private _datas: { [page: string]: GroupData };
    private constructor() {
        this._datas = {};
    }

    add(page: ActaPage | string, frames: IActaFrame[] | IActaFrame, group?: GroupID) {
        const pageid = page instanceof ActaPage ? page.id : page;
        if (!this._datas[pageid]) this._datas[pageid] = {
            groupList: [], member: {}
        };
        if (!group || this._datas[pageid].groupList.indexOf(group) < 0) {
            group = uuidv4();
            this._datas[pageid].groupList.push(group);
            this._datas[pageid].member[group] = [];
        }
        for (const frame of (frames instanceof IActaFrame ? [frames] : frames)) {
            this.remove(pageid, frame);
            this._datas[pageid].member[group].push(frame);
        }
        return group;
    }

    remove(page: ActaPage | string, frames: IActaFrame[] | IActaFrame) {
        const pageid = page instanceof ActaPage ? page.id : page;
        if (!this._datas[pageid]) return;

        for (const group of this._datas[pageid].groupList) {
            for (const frame of (frames instanceof IActaFrame ? [frames] : frames)) {
                const idx = this._datas[pageid].member[group].indexOf(frame);
                if (idx > -1) this._datas[pageid].member[group].splice(idx, 1);
            }
            if (this._datas[pageid].member[group].length < 1) this.removeGroup(pageid, group);
        }
        if (this._datas[pageid].groupList.length < 1) delete this._datas[pageid];
    }

    removeGroup(page: ActaPage | string, group: GroupID) {
        const pageid = page instanceof ActaPage ? page.id : page;
        if (!this._datas[pageid]) return;

        const idx = this._datas[pageid].groupList.indexOf(group);
        if (idx > -1) this._datas[pageid].groupList.splice(idx, 1);

        delete this._datas[pageid].member[group];
    }

    groupHas(page: ActaPage | string, frames: IActaFrame[] | IActaFrame) {
        const retGroup: GroupID[] = [];
        const pageid = page instanceof ActaPage ? page.id : page;
        if (!this._datas[pageid]) return retGroup;

        for (const group of this._datas[pageid].groupList) {
            for (const frame of (frames instanceof IActaFrame ? [frames] : frames)) {
                const idx = this._datas[pageid].member[group].indexOf(frame);
                if (retGroup.indexOf(group) > -1) break;
                if (idx < 0) continue;
                retGroup.push(group);
            }
        }
        return retGroup;
    }
};
export default ActaGroupManager.in;