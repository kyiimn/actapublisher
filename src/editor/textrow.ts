import { ActaTextChar } from './textchar';
import { TextAlign } from './textstyle';

export class ActaTextRow {
    private _indexOfColumn: number;
    private _indexOfLine: number;
    private _limitWidth: number;
    private _maxHeight: number;
    private _maxLeading: number;
    private _textAlign: TextAlign;
    private _indent: number;
    private _items: ActaTextChar[];
    private _offsetY: number;
};
