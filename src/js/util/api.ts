import querystring from 'querystring';
import { v4 as uuidv4 } from 'uuid';

interface IActaAPIParameter {
    [key: string] : any
};

enum AjaxMethod {
    GET = 'GET',
    POST = 'POST',
    DELETE = 'DELETE',
    PUT = 'PUT'
};

class ActaAPI {
    private static _instance: ActaAPI;

    static getInstance() {
        if (!ActaAPI._instance) ActaAPI._instance = new ActaAPI();
        return ActaAPI._instance;
    }
    static get in() { return ActaAPI.getInstance(); }

    private _protocol: string;
    private _server: string;
    private _port: number;
    private _timeout: number;
    private _version: string;

    private _sessionId?: string;
    private _clientId?: string;

    private constructor() {
        this._protocol = process.env.API_SERVER_PROTOCOL || 'http';
        this._server = process.env.API_SERVER || 'localhost';
        this._port = parseInt(process.env.API_SERVER_PORT || '3000', 10);
        this._timeout = parseInt(process.env.API_TIMEOUT || '30000', 10);
        this._version = process.env.API_VERSION || 'v1';

        this._clientId = window.localStorage.getItem('acta.api.client_id') || undefined;
        this._sessionId = window.sessionStorage.getItem('acta.api.session_id') || undefined;
    }

    private get _host() {
        return `${this._protocol}://${this._server}:${this._port}/${this._version}`;
    }

    private get _xhr() {
        return (XMLHttpRequest) ? new XMLHttpRequest() : new ActiveXObject("Microsoft.XMLHTTP");
    }

    private async _request(method: AjaxMethod, path: string, parameter?: IActaAPIParameter, headers?: IActaAPIParameter) {
        const params = querystring.stringify(parameter);
        const xhr = this._xhr;
        let url;

        if ((method === AjaxMethod.GET || method === AjaxMethod.DELETE) && params) {
            url = `${this._host}${(path[0] !== '/') ? '/' : ''}${path}?${params}`;
        } else {
            url = `${this._host}${(path[0] !== '/') ? '/' : ''}${path}`;
        }
        xhr.open(method, url, true);
        xhr.timeout = this._timeout;
        if (headers) {
            for (const key in headers) {
                if (headers[key]) xhr.setRequestHeader(key, headers[key]);
            }
        }
        if ((method === AjaxMethod.POST || method === AjaxMethod.PUT) && params) {
            xhr.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
        }
        xhr.setRequestHeader("ActaApi-ClientID", this.clientId);
        xhr.setRequestHeader("ActaApi-SessionID", this.sessionId);

        return new Promise((resolve, reject) => {
            xhr.onload = () => {
                let resultData = false;
                try { resultData = JSON.parse(xhr.response); }
                catch (e) { resultData = false; }
                resolve(resultData);
            };
            xhr.onabort = () => { resolve(false); };
            xhr.onerror = () => { resolve(false); };

            if (method === AjaxMethod.POST || method === AjaxMethod.PUT) {
                xhr.send(params);
            } else {
                xhr.send();
            }
        });
    }

    get clientId() {
        if (!this._clientId) {
            this._clientId = uuidv4();
            window.localStorage.setItem('acta.api.client_id', this._clientId);
        }
        return this._clientId;
    }

    get sessionId() {
        if (!this._sessionId) {
            this._sessionId = uuidv4();
            window.sessionStorage.setItem('acta.api.session_id', this._sessionId);
        }
        return this._sessionId;
    }

    async get(path: string, parameter?: IActaAPIParameter, headers?: IActaAPIParameter) {
        return this._request(AjaxMethod.GET, path, parameter, headers);
    }

    async post(path: string, parameter?: IActaAPIParameter, headers?: IActaAPIParameter) {
        return this._request(AjaxMethod.POST, path, parameter, headers);
    }

    async put(path: string, parameter?: IActaAPIParameter, headers?: IActaAPIParameter) {
        return this._request(AjaxMethod.PUT, path, parameter, headers);
    }

    async delete(path: string, parameter?: IActaAPIParameter, headers?: IActaAPIParameter) {
        return this._request(AjaxMethod.DELETE, path, parameter, headers);
    }

    url(path: string) {
        return `${this._host}${(path[0] !== '/') ? '/' : ''}${path}`;
    }
}
export default ActaAPI.in;