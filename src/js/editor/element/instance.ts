import { v4 as uuidv4 } from 'uuid';

export abstract class ActaElementInstance {
    protected _id: string;

    protected constructor() {
        this._id = uuidv4();
    }

    appendChild(child: ActaElementInstance | HTMLElement): ActaElementInstance {
        this.el.appendChild(child instanceof HTMLElement ? child : child.el);
        return this;
    };

    get id() { return this._id; }

    abstract get el(): HTMLElement;
};

// tslint:disable-next-line: max-classes-per-file
export class ActaElement extends HTMLElement {
    protected _id: string;

    constructor() {
        super();
        this._id = uuidv4();
    }
    get id() { return this._id; }
}