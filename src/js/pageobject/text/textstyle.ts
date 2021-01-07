import ActaFont from '../font';
import ActaTextStylePrivate from './textstyle-private';
import ActaTextStyleInherit from './textstyle-inherit';

export enum TextAlign {
    JUSTIFY = 0, LEFT, RIGHT, CENTER
}

export default class ActaTextStyle extends ActaTextStylePrivate {
    private _name?: string;

    constructor(fontName: string) {
        super();

        this.fontName = fontName;
        this.fontSize = 10;
        this.xscale = 1;
        this.letterSpacing = 0;
        this.lineHeight = 1.2;
        this.textAlign = TextAlign.JUSTIFY;
        this.underline = false;
        this.strikeline = false;
        this.indent = 0;
        this.color = '#000000';
    }

    merge(textStyle: ActaTextStyle | ActaTextStyleInherit) {
        super.merge(textStyle);
    }

    copy(textStyle: ActaTextStyle) {
        super.copy(textStyle);
    }

    set name(name: string) { this._name = name; }
    set font(font: ActaFont) { super.font = font; }
    set fontName(fontName: string) { super.fontName = fontName; }
    set fontSize(size: number) { super.fontSize = size; }
    set xscale(scale: number) { super.xscale = scale; }
    set letterSpacing(linespacing: number) { super.letterSpacing = linespacing; }
    set lineHeight(lineheight: number) { super.lineHeight = lineheight; }
    set textAlign(align: TextAlign) { super.textAlign = align; }
    set underline(underline: boolean) { super.underline = underline; }
    set strikeline(strikeline: boolean) { super.strikeline = strikeline; }
    set indent(indent: number) { super.indent = indent; }
    set color(color: string) { super.color = color; }

    get name() { return this._name || ''; }
    get font() { return super.font as ActaFont; }
    get fontName() { return super.fontName; }
    get fontSize() { return super.fontSize as number; }
    get xscale() { return super.xscale as number; }
    get letterSpacing() { return super.letterSpacing as number; }
    get lineHeight() { return super.lineHeight as number; }
    get textAlign() { return super.textAlign as TextAlign; }
    get underline() { return super.underline as boolean; }
    get strikeline() { return super.strikeline as boolean; }
    get indent() { return super.indent as number; }
    get color() { return super.color as string; }
};