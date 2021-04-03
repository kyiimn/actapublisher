import IActaFrame from './interface/frame';
import ActaPage from './page';
import U from '../util/units';

import { v4 as uuidv4 } from 'uuid';

export type GroupID = string;

type GroupData = {
    name?: string,
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

    private _isValidPageID(pageid: string) {
        return this._datas[pageid] ? true : false;
    }

    private _getPageID(page: ActaPage | string) {
        return page instanceof ActaPage ? page.id : page;
    }

    private _isValidGroupID(pageid: string, group: GroupID | undefined) {
        if (!group) return false;

        const idx = this._datas[pageid].groupList.indexOf(group);
        return idx < 0 ? false : true;
    }

    add(page: ActaPage | string, frames: IActaFrame[] | IActaFrame, group?: GroupID) {
        const pageid = this._getPageID(page);
        if (!this._isValidPageID(pageid)) this._datas[pageid] = {
            groupList: [], member: {}
        };
        if (!this._isValidGroupID(pageid, group)) {
            group = uuidv4();
            this._datas[pageid].groupList.push(group);
            this._datas[pageid].member[group] = [];
        }
        for (const frame of (frames instanceof IActaFrame ? [frames] : frames)) {
            this.remove(pageid, frame);
            if (group) this._datas[pageid].member[group].push(frame);
        }
        return group;
    }

    remove(page: ActaPage | string, frames: IActaFrame[] | IActaFrame) {
        const pageid = this._getPageID(page);
        if (!this._isValidPageID(pageid)) return;

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
        const pageid = this._getPageID(page);
        if (!this._isValidPageID(pageid)) return;

        const idx = this._datas[pageid].groupList.indexOf(group);
        if (idx > -1) this._datas[pageid].groupList.splice(idx, 1);

        delete this._datas[pageid].member[group];
    }

    groupHas(page: ActaPage | string, frames: IActaFrame[] | IActaFrame) {
        const retGroup: GroupID[] = [];
        const pageid = this._getPageID(page);
        if (!this._isValidPageID(pageid)) return null;

        for (const group of this._datas[pageid].groupList) {
            for (const frame of (frames instanceof IActaFrame ? [frames] : frames)) {
                const idx = this._datas[pageid].member[group].indexOf(frame);
                if (retGroup.indexOf(group) > -1) break;
                if (idx < 0) continue;
                retGroup.push(group);
            }
        }
        return retGroup.length === 1 ? retGroup[0] : null;
    }

    setGroupName(page: ActaPage | string, group: GroupID, name: string) {
        const pageid = this._getPageID(page);
        if (!this._isValidPageID(pageid)) return;
        if (!this._isValidGroupID(pageid, group)) return;

        if (name) this._datas[pageid].name = name;
        else delete this._datas[pageid].name;
    }

    getGroupName(page: ActaPage | string, group: GroupID) {
        const pageid = this._getPageID(page);
        if (!this._isValidPageID(pageid)) return null;
        if (!this._isValidGroupID(pageid, group)) return null;

        return this._datas[pageid].name || null;
    }

    getMember(page: ActaPage | string, frameOrGroup: IActaFrame | GroupID) {
        const pageid = this._getPageID(page);
        if (!this._isValidPageID(pageid)) return null;

        const group = frameOrGroup instanceof IActaFrame ? this.groupHas(pageid, frameOrGroup) : frameOrGroup;
        if (!group) return null;
        if (!this._datas[pageid].member[group]) return null;

        return this._datas[pageid].member[group];
    }

    getBoundingClientRect(page: ActaPage | string, group: GroupID) {
        const pageid = this._getPageID(page);
        if (!this._isValidPageID(pageid)) return null;
        if (!this._isValidGroupID(pageid, group)) return null;

        let minX = Number.MAX_SAFE_INTEGER, minY = Number.MAX_SAFE_INTEGER;
        let maxX = 0, maxY = 0;

        for (const frame of this._datas[pageid].member[group]) {
            minX = Math.min(minX, U.px(frame.x));
            minY = Math.min(minY, U.px(frame.y));
            maxX = Math.max(maxX, U.px(frame.x) + U.px(frame.width));
            maxY = Math.max(maxY, U.px(frame.y) + U.px(frame.height));
        }
        return new DOMRect(minX, minY, maxX - minX, maxY - minY);
    }
};
export default ActaGroupManager.in;