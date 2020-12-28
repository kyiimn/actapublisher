import { v4 as uuidv4 } from 'uuid';

export abstract class IActaElement extends HTMLElement {
    protected _id: string;

    constructor() {
        super();
        this._id = uuidv4();
    }
    get id() { return this._id; }
}