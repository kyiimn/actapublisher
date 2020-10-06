import { v4 as uuidv4 } from 'uuid';

export class ActaElementInstance {
    protected _id: string;
    protected constructor() {
        this._id = uuidv4();
    }
    get id() { return this._id; }
};