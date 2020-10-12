import { v4 as uuidv4 } from 'uuid';

export class ActaElement extends HTMLElement {
    protected _id: string;

    constructor() {
        super();
        this._id = uuidv4();
    }
    get id() { return this._id; }
}