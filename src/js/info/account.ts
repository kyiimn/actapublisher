import api from '../util/api';

interface IActaAccountUser {
    id: number,
    mediaId: number,
    deptId: number,
    loginId: string,
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
        if (!result) return;

        this._logined = true;
        this._loginMediaId = result.data.mediaId;
        this._loginDept = result.data.dept;
        this._loginUser = result.data.user;

    }
}
export default ActaAccountInfo.in;