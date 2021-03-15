import IActaTextAttribute from '../interface/textattribute';
import ActaTextAttributeAbsolute from './textattribute-absolute';

export default class ActaTextAttribute extends IActaTextAttribute {
    merge(textAttr: IActaTextAttribute) {
        super.merge(textAttr);
    }

    copy(textAttr: IActaTextAttribute) {
        super.copy(textAttr);
    }
};