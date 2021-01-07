import { v4 as uuidv4 } from 'uuid';

export default abstract class IActaElement extends HTMLElement {
    protected _id: string;

    constructor() {
        super();
        this._id = uuidv4();
    }
    set id(id: string) { this._id = id; }
    get id() { return this._id; }
}