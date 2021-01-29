import api from '../util/api';

interface IActaAccountUser {
    id: number,
    mediaId: number,
    mediaName: string,
    deptId: number,
    deptName: string,
    loginName: string,
    name: string,
    email?: string,
    byline?: string,
    use: boolean,
    level: number,
    rule: number,
    originalData?: any
}

interface IActaAccountDept {
    id: number,
    mediaId: number,
    mediaName: string,
    name: string,
    sort: number,
    invalidFlag: boolean,
    group: boolean,
    groupMemberList?: number[]
}

class ActaAccountInfo {
    private static _instance: ActaAccountInfo;

    static getInstance() {
        if (!ActaAccountInfo._instance) ActaAccountInfo._instance = new ActaAccountInfo();
        return ActaAccountInfo._instance;
    }
    static get in() { return ActaAccountInfo.getInstance(); }

    private _user: IActaAccountUser[];
    private _dept: IActaAccountDept[];

    private _loginMediaId?: number;
    private _loginDept?: IActaAccountDept;
    private _loginUser?: IActaAccountUser;

    private _logined: boolean;

    private constructor() {
        this._user = [];
        this._dept = [];
        this._logined = false;
    }

    async loadData() {
        let result: any = await api.get('/login');
        if (!result) return;
        if (!result.data.logined) return;

        this._logined = true;
        this._loginMediaId = result.data.mediaId;
        this._loginDept = result.data.dept;
        this._loginUser = result.data.user;

        result = await api.get('/info/account/dept');
        if (result) {
            for (const dept of result.data) {
                this._dept.push(dept);
            }
        }

        result = await api.get('/info/account/user');
        if (result) {
            for (const user of result.data) {
                this._user.push(user);
            }
        }
    }
}
export default ActaAccountInfo.in;