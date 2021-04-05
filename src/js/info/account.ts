import api from '../util/api';
import U from '../util/units';

const __DEFAULT_ACCOUNT_INFO_FRAME_UNIT_TYPE = 'MM';
const __DEFAULT_ACCOUNT_INFO_TEXT_UNIT_TYPE = 'POINT';
const __DEFAULT_ACCOUNT_INFO_DPI = 96;

type AccountUser = {
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

type AccountDept = {
    id: number,
    mediaId: number,
    mediaName: string,
    name: string,
    sort: number,
    invalidFlag: boolean,
    group: boolean,
    groupMemberList?: number[]
}

type AccountPreference = {
    textUnitType: string,
    frameUnitType: string,
    defaultBodyTextStyleId: number,
    defaultBodyTextStyleName: string,
    defaultTitleTextStyleId: number,
    defaultTitleTextStyleName: string,
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

    private _user: AccountUser[];
    private _dept: AccountDept[];

    private _loginMediaId?: number;
    private _loginDept?: AccountDept;
    private _loginUser?: AccountUser;
    private _preference?: AccountPreference;

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
        U.DPI = this.dpi;

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
    get frameUnitType() { return this._preference ? this._preference.frameUnitType : __DEFAULT_ACCOUNT_INFO_FRAME_UNIT_TYPE; }
    get textUnitType() { return this._preference ? this._preference.textUnitType : __DEFAULT_ACCOUNT_INFO_TEXT_UNIT_TYPE; }
    get defaultBodyTextStyle() { return this._preference ? this._preference.defaultBodyTextStyleName : ''; }
    get defaultTitleTextStyle() { return this._preference ? this._preference.defaultTitleTextStyleName : ''; }
    get dpi() { return this._preference ? this._preference.dpi : __DEFAULT_ACCOUNT_INFO_DPI; }
    get options() { return this._preference ? this._preference.options : {}; }

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