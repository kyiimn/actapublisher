import IActaFrame from './frame';

export default abstract class IActaPreflightProfile {
    protected _detailMessage: string | null = null;
    protected _targetFrame: IActaFrame | null = null;

    get detailMessage() {
        return this._detailMessage;
    }
    get targetFrame() {
        return this._targetFrame;
    }
    abstract get message(): string;
};
