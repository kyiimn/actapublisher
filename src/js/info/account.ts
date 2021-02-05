import api from '../util/api';
import U from '../util/units';

const __DEFAULT_ACCOUNT_INFO_FRAME_UNIT_TYPE = 'MM';
const __DEFAULT_ACCOUNT_INFO_TEXT_UNIT_TYPE = 'POINT';
const __DEFAULT_ACCOUNT_INFO_DPI = 96;

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

interface IActaAccountPreference {
    textUnitType: string,
    frameUnitType: string,
    dpi: number,
    options: {
        [key: string]: boolean | number | string
    }
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
    private _preference?: IActaAccountPreference;

    private _logined: boolean;

    private constructor() {
        this._user = [];
        this._dept = [];
        this._logined = false;
    }

    async loadData() {
        let result: any = await api.get('/login');
        if (!result) return false;
        if (!result.data.logined) return false;

        this._loginMediaId = result.data.mediaId;
        this._loginDept = result.data.dept;
        this._loginUser = result.data.user;

        this._preference = result.data.preference;
        U.DPI = this.prefDPI;

        result = await api.get('/info/account/dept');
        if (!result) return false;
        for (const dept of result.data) {
            this._dept.push(dept);
        }

        result = await api.get('/info/account/user');
        if (!result) return false;
        for (const user of result.data) {
            this._user.push(user);
        }
        this._logined = true;

        return true;
    }
    get prefFrameUnitType() { return this._preference ? this._preference.frameUnitType : __DEFAULT_ACCOUNT_INFO_FRAME_UNIT_TYPE; }
    get prefTextUnitType() { return this._preference ? this._preference.textUnitType : __DEFAULT_ACCOUNT_INFO_TEXT_UNIT_TYPE; }
    get prefDPI() { return this._preference ? this._preference.dpi : __DEFAULT_ACCOUNT_INFO_DPI; }
    get prefOptions() { return this._preference ? this._preference.options : {}; }

    get isLogined() { return this._logined; }
    get loginMediaId() { return this._loginMediaId || 0; }
    get loginDeptId() { return this._loginDept ? this._loginDept.id : 0; }
    get loginDeptName() { return this._loginDept ? this._loginDept.name : ''; }
    get loginUserId() { return this._loginUser ? this._loginUser.id : 0; }
    get loginUserName() { return this._loginUser ? this._loginUser.name : ''; }
    get loginName() { return this._loginUser ? this._loginUser.loginName : ''; }

    get dept() { return this._dept; }
    get user() { return this._user; }
}
export default ActaAccountInfo.in;