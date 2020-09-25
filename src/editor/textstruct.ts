import { ActaTextStore, ActaTextNode } from './textstore';
import { ActaTextStyle, TextAlign } from './textstyle';

export interface ITextItem {
    id: string;
    textNode: ActaTextNode;
    textStyle: ActaTextStyle;
    indexOfNode: number;
    indexOfText: number;
    lineItem: ITextLineItem | null;
    char: string;
    type: TextItemType;
    calcWidth: number;
    width: number;

    path?: SVGPathElement;
    drawOffsetX?: number;
    drawOffsetY?: number;
    height?: number;
};

export interface ITextLineItem {
    indexOfColumn: number;
    indexOfLine: number;
    limitWidth: number;
    maxHeight: number;
    maxLeading: number;
    textAlign: TextAlign;
    indent: number;
    items: ITextItem[];
    offsetY?: number;
};

export enum TextItemType {
    NEWLINE, SPACE, PATH, END_OF_NODE
};
