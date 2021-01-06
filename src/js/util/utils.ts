export class Stack {
    private _store: any[];
    constructor() { this._store = []; }
    first() { return this._store[0]; }
    last() { return this._store[this._store.length - 1]; }
    push(item: any) { this._store.push(item); }
    pop() { return this._store.pop(); }
    get length() { return this._store.length; }
};

export function clone(obj: any) {
    return JSON.parse(JSON.stringify(obj));
};

export function supportedFeatures() {
    const features = {
        clipboard: false
    };
    if (navigator.clipboard) {
        if (navigator.clipboard.readText && navigator.clipboard.writeText) features.clipboard = true;
    }
    return features;
};