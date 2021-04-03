import querystring from 'querystring';

type APIParameter = {
    [key: string] : any
};

type AjaxMethod = 'GET' | 'POST' | 'DELETE' | 'PUT';

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

    private constructor() {
        this._protocol = process.env.API_SERVER_PROTOCOL || 'http';
        this._server = process.env.API_SERVER || 'localhost';
        this._port = parseInt(process.env.API_SERVER_PORT || '3000', 10);
        this._timeout = parseInt(process.env.API_TIMEOUT || '30000', 10);
        this._version = process.env.API_VERSION || 'v1';
    }

    private get _url() {
        return `${this._protocol}://${this._server}:${this._port}/${this._version}`;
    }

    private get _xhr() {
        return (XMLHttpRequest) ? new XMLHttpRequest() : new ActiveXObject("Microsoft.XMLHTTP");
    }

    private async _request(method: AjaxMethod, path: string, parameter?: APIParameter, headers?: APIParameter) {
        const params = querystring.stringify(parameter);
        const xhr = this._xhr;
        let url;

        if ((method === 'GET' || method === 'DELETE') && params) {
            url = `${this._url}${(path[0] !== '/') ? '/' : ''}${path}?${params}`;
        } else {
            url = `${this._url}${(path[0] !== '/') ? '/' : ''}${path}`;
        }
        xhr.open(method, url, true);
        xhr.withCredentials = true;
        xhr.timeout = this._timeout;
        if (headers) {
            for (const key in headers) {
                if (headers[key]) xhr.setRequestHeader(key, headers[key]);
            }
        }
        if ((method === 'POST' || method === 'PUT') && params) {
            xhr.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
        }

        return new Promise((resolve, reject) => {
            xhr.onload = () => {
                let resultData = false;
                try { resultData = JSON.parse(xhr.response); }
                catch (e) { resultData = false; }
                resolve(resultData);
            };
            xhr.onabort = () => { resolve(false); };
            xhr.onerror = () => { resolve(false); };

            if (method === 'POST' || 'AjaxMethod.PUT') {
                xhr.send(params);
            } else {
                xhr.send();
            }
        });
    }

    async get(path: string, parameter?: APIParameter, headers?: APIParameter) {
        return this._request('GET', path, parameter, headers);
    }

    async post(path: string, parameter?: APIParameter, headers?: APIParameter) {
        return this._request('POST', path, parameter, headers);
    }

    async put(path: string, parameter?: APIParameter, headers?: APIParameter) {
        return this._request('PUT', path, parameter, headers);
    }

    async delete(path: string, parameter?: APIParameter, headers?: APIParameter) {
        return this._request('DELETE', path, parameter, headers);
    }

    file(data: {
        id: string | number,
        fileStorageId: number,
        fileExtension: string
    }) {
        let path;
        if (typeof(data.id) === 'string') {
            path = `${data.id.substr(0, 4)}/${data.id.substr(4, 2)}/${data.id.substr(6, 2)}/${data.id}`;
        } else {
            path = data.id.toString();
        }
        return `${this._protocol}://${this._server}:${this._port}/data/${data.fileStorageId}/${path}.${data.fileExtension}`;
    }
}
export default ActaAPI.in;