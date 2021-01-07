import ActaTextStylePrivate from './textstyle-private';
import ActaTextStyle from './textstyle';

export default class ActaTextStyleInherit extends ActaTextStylePrivate {
    merge(textStyle: ActaTextStyle | ActaTextStyleInherit) {
        super.merge(textStyle);
    }

    copy(textStyle: ActaTextStyle | ActaTextStyleInherit) {
        super.copy(textStyle);
    }
};