export default class Stack {
    private _store: any[];
    constructor() { this._store = []; }
    first() { return this._store[0]; }
    last() { return this._store[this._store.length - 1]; }
    push(item: any) { this._store.push(item); }
    pop() { return this._store.pop(); }
    get length() { return this._store.length; }
};