import { ActaTextStyleManager } from './textstylemgr';
import { ActaTextConverter } from './textconverter';
import { ActaTextNode } from './textnode';
import { ActaTextStyle, TextAlign } from './textstyle';
import { v4 as uuidv4 } from 'uuid';
import opentype from 'opentype.js';
import $ from 'jquery';

interface IDrawableTextItem {
    id: string;
    textNode: ActaTextNode,
    textStyle: ActaTextStyle;
    indexOfNode: number;
    indexOfText: number;
    char: string;
    type: DrawableTextItemType;
    calcWidth: number;
    width: number;

    path?: SVGPathElement;
    drawOffsetX?: number;
    drawOffsetY?: number;
    height?: number;
};

interface IDrawableLineData {
    limitWidth: number;
    maxHeight: number;
    maxLeading: number;
    textAlign: TextAlign;
    indent: number;
    items: IDrawableTextItem[];
};

interface ICursorPosition {
    column: HTMLElement;
    line: number;
    position: number;
}

enum CursorMode {
    NONE, EDIT, INPUT, SELECTION
};

enum DrawableTextItemType {
    NEWLINE, SPACE, PATH
};

export class ActaParagraph {
    private _element: HTMLElement;
    private _columnCount: number;
    private _innerMargin: string | number;
    private _textObject: ActaTextNode | null;
    private _defaultTextStyleName: string | null;
    private _drawableTextData: IDrawableTextItem[];
    private _selectionStartItem: IDrawableTextItem | null;
    private _cursorMode: CursorMode;
    private _cursorPosition: ICursorPosition | null;
    private _editable: boolean;

    private _getTextPath(font: opentype.Font, char: string, size: number) {
        const glyph = font.charToGlyph(char);
        const unitsPerSize = font.unitsPerEm / size;
        const charWidth = glyph.advanceWidth / unitsPerSize;
        const charHeight = (font.tables.os2.usWinAscent + font.tables.os2.usWinDescent) / unitsPerSize;
        const yMin = font.tables.head.yMin / unitsPerSize;
        const path = glyph.getPath(0, charHeight, size);
        const pathData = path.toPathData(8);

        const el = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        el.setAttribute('d', pathData);

        return {
            path: el,
            offsetX: 0,
            offsetY: charHeight + yMin,
            width: charWidth,
            height: charHeight
        };
    }

    constructor(defaultTextStyleName: string | null, columnCount: number = 1, innerMargin: string | number = 0, columnWidths: string[] | number[] = []) {
        this._element = document.createElement('x-paragraph');
        this._columnCount = 1;
        this._innerMargin = 0;
        this._textObject = null;
        this._defaultTextStyleName = defaultTextStyleName;

        this._editable = true;
        this._selectionStartItem = null;
        this._cursorMode = CursorMode.NONE;
        this._cursorPosition = null;

        this.columnCount = columnCount;
        for (let i = 0; i < columnCount; i++) {
            if (columnWidths[i]) this.columnWidth(i, columnWidths[i]);
        }
        this.innerMargin = innerMargin;

        this._drawableTextData = [];

        $(this._element).on('resize', e => {
            this.computeDrawableTextSize();
            this.drawText();
            return false;
        });
        $(this._element).on('mousedown', 'x-paragraph-col', (e) => {
            if (!this._editable) return false;
            const eventElement = this.getTextDataByPosition(e.currentTarget, e.offsetX, e.offsetY);
            if (eventElement.length > 0) {
                this._selectionStartItem = eventElement[0];
                this._cursorMode = CursorMode.SELECTION;
                this._cursorPosition = null;
                this.setCursor(this._selectionStartItem, e.offsetX);
            }
            $(this._element).addClass('focus').trigger('focus');
            return false;
        });
        $(this._element).on('mousemove', 'x-paragraph-col', (e) => {
            if (!this._editable) return false;
            if (this._cursorMode !== CursorMode.SELECTION) return false;
            const eventElement = this.getTextDataByPosition(e.currentTarget, e.offsetX, e.offsetY);
            if (eventElement.length > 0 && this._selectionStartItem != null) this.setSelection(this._selectionStartItem, eventElement[0]);
            return false;
        });
        $(this._element).on('mouseup', 'x-paragraph-col', (e) => {
            if (!this._editable) return false;
            if (this._cursorMode !== CursorMode.SELECTION) {
                const eventElement = this.getTextDataByPosition(e.currentTarget, e.offsetX, e.offsetY);
                if (eventElement.length > 0 && this._selectionStartItem != null) this.setSelection(this._selectionStartItem, eventElement[0]);
            }
            this._cursorMode = CursorMode.EDIT;
            return false;
        });
    }

    blur() {
        $(this._element).removeClass('focus').find('svg rect.cursor').remove();
        $(this._element).trigger('blur');
        this._cursorMode = CursorMode.NONE;
        this._selectionStartItem = null;
    }

    setCursor(item: IDrawableTextItem, x?: number) {
        const path = $(this._element).find(`svg path[data-id="${item.id}"]`);
        if (path.length < 1) return;

        const line = parseInt($(path).attr('data-line') || '', 10);
        this._cursorPosition = {
            column: $(path).parent().parent().get(0),
            position: 0,
            line
        };
    }

    setSelection(startItem: IDrawableTextItem, endItem: IDrawableTextItem) {
        let startpos = this._drawableTextData.indexOf(startItem);
        let endpos = this._drawableTextData.indexOf(endItem);

        let currentColumn: HTMLElement | undefined;
        let currentLine = -1;
        let selection;
        let startx = 0;

        if (startpos > endpos) {
            const t = startpos;
            startpos = endpos;
            endpos = t;
        }
        $(this._element).find('svg rect.cursor').remove();

        for (let i = startpos; i <= endpos; i++) {
            const path = $(this._element).find(`svg path[data-id="${this._drawableTextData[i].id}"]`);
            if (path.length < 1) continue;

            const line = parseInt($(path).attr('data-line') || '', 10);
            if (isNaN(line)) continue;
            if (currentColumn !== $(path).parent().parent().get(0) || currentLine !== line || selection === undefined) {
                currentColumn = $(path).parent().parent().get(0);
                currentLine = line;
                startx = parseInt($(path).attr('data-x') || '0', 10);
                selection = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
                $(selection).attr({
                    'x': startx,
                    'y': $(path).attr('data-y') || 0,
                    'width': parseInt($(path).attr('data-width') || '0', 10),
                    'height': parseInt($(path).attr('data-height') || '0', 10),
                    'fill': '#5555ff',
                    'fill-opacity': 0.4,
                    'stroke': '#0000ff',
                    'data-start-id': this._drawableTextData[startpos].id,
                    'data-end-id': this._drawableTextData[startpos].id
                }).addClass('cursor');
                $(currentColumn).find('svg').append(selection);
            } else {
                const endx = parseInt($(path).attr('data-x') || '0', 10) + parseInt($(path).attr('data-width') || '0', 10);
                $(selection).attr('width', endx - startx);
            }
        }
    }

    getTextDataByPosition(canvas: HTMLElement, x: number, y: number, width?: number, height?: number) {
        const textData: IDrawableTextItem[] = [];
        const idList: string[] = [];

        if (width === undefined) width = 1;
        if (height === undefined) height = 1;

        const x2 = x + width;
        const y2 = y + height;

        $(canvas).find('path').each((i: number, path: SVGPathElement) => {
            const itemX1 = parseFloat($(path).attr('data-x') || '');
            const itemX2 = parseFloat($(path).attr('data-x') || '') + parseFloat($(path).attr('data-width') || '');
            const itemY1 = parseFloat($(path).attr('data-y') || '');
            const itemY2 = parseFloat($(path).attr('data-y') || '') + parseFloat($(path).attr('data-height') || '') + parseFloat($(path).attr('data-leading') || '');
            const id = $(path).attr('data-id');

            if (isNaN(itemX1) || isNaN(itemX2) || isNaN(itemY1) || isNaN(itemY2) || id === undefined) return;
            if (itemX1 < x2 && itemX2 > x && itemY1 < y2 && itemY2 > y) idList.push(id);
        });
        for (const textItem of this._drawableTextData) {
            if (idList.indexOf(textItem.id) < 0) continue;
            textData.push(textItem);
        }
        return textData;
    }

    columnWidth(idx: number, val: string | number) {
        if (arguments.length > 1) {
            $(this._element).find('x-paragraph-col').get(idx).setAttribute('width', (val || 0).toString());
            $(this._element).trigger('resize');
        } else {
            return $(this._element).find('x-paragraph-col').get(idx).getAttribute('width') || false;
        }
    }

    generateDrawableTextData() {
        this._drawableTextData = [];
        if (this._textObject == null) return false;
        return this.convertTextNodeToData(
            this._textObject,
            ActaTextStyleManager.getInstance().get(this._defaultTextStyleName || '') || new ActaTextStyle()
        );
    }

    convertTextNodeToData(textNode: ActaTextNode, parentTextStyle: ActaTextStyle) {
        const textStyle = textNode.appliedTextStyle(parentTextStyle);
        if (textStyle.font == null ||
            textStyle.fontSize == null ||
            textStyle.xscale == null ||
            textStyle.letterSpacing == null ||
            textStyle.lineHeight == null ||
            textStyle.textAlign == null ||
            textStyle.underline == null ||
            textStyle.strikeline == null ||
            textStyle.indent == null ||
            textStyle.color == null
        ) return false;

        for (let indexOfNode = 0; indexOfNode < textNode.length; indexOfNode++) {
            if (textNode.value[indexOfNode] instanceof ActaTextNode) {
                if (!this.convertTextNodeToData(textNode.value[indexOfNode], textStyle)) return false;
            } else {
                const textvalue = textNode.value[indexOfNode].toString();
                for (let indexOfText = 0; indexOfText < textvalue.length; indexOfText++) {
                    const char = textvalue[indexOfText];
                    if (char === "\n") {
                        this._drawableTextData.push({
                            textNode, textStyle, indexOfNode, indexOfText, char,
                            id: uuidv4(),
                            type: DrawableTextItemType.NEWLINE,
                            calcWidth: 0,
                            width: 0
                        });
                    } else if (char === ' ') {
                        this._drawableTextData.push({
                            textNode, textStyle, indexOfNode, indexOfText, char,
                            id: uuidv4(),
                            type: DrawableTextItemType.SPACE,
                            calcWidth: textStyle.fontSize / 3,
                            width: textStyle.fontSize / 3
                        });
                    } else {
                        const glyphData = this._getTextPath(textStyle.font.font, char, textStyle.fontSize);
                        this._drawableTextData.push({
                            textNode, textStyle, indexOfNode, indexOfText, char,
                            id: uuidv4(),
                            type: DrawableTextItemType.PATH,
                            path: glyphData.path,
                            drawOffsetX: glyphData.offsetX,
                            drawOffsetY: glyphData.offsetY,
                            calcWidth: glyphData.width,
                            width: glyphData.width,
                            height: glyphData.height
                        });
                    }
                }
            }
        }
        return true;
    }

    computeDrawableTextSize() {
        const canvasList: HTMLElement[] = [];
        let canvasPos = 0;
        let lineData: IDrawableLineData | null = null;
        let indent = true;

        $(this._element).find('x-paragraph-col > svg').each((i, canvas) => {
            $(canvas).attr({
                width: ($(canvas).parent().innerWidth() || 0),
                height: ($(canvas).parent().innerHeight() || 0)
            }).data('drawableTextData', []);
            canvasList.push(canvas);
        });
        for (const textItem of this._drawableTextData) {
            textItem.calcWidth = textItem.width * (textItem.textStyle.xscale || 1);
            if (textItem.calcWidth > 0) textItem.calcWidth += textItem.textStyle.letterSpacing || 0;
            while (1) {
                if (!lineData) {
                    const canvas = canvasList[canvasPos];
                    if (!canvas) break;
                    lineData = {
                        limitWidth: $(canvas).width() || 0,
                        maxHeight: 0,
                        maxLeading: 0,
                        indent: indent ? textItem.textStyle.indent || 0 : 0,
                        items: [],
                        textAlign: TextAlign.JUSTIFY
                    };
                    indent = false;

                    $(canvas).data('drawableTextData').push(lineData);
                    if (textItem.type === DrawableTextItemType.SPACE) textItem.calcWidth = 0;
                } else {
                    let itemcnt = 0;
                    let filledWidth = lineData.indent;
                    $.each(lineData.items, (j, item: IDrawableTextItem) => {
                        if (item.calcWidth > 0) {
                            filledWidth += item.calcWidth;
                            itemcnt++;
                        }
                    });
                    if (filledWidth + textItem.calcWidth > lineData.limitWidth) {
                        itemcnt = lineData.items.length;
                        if (itemcnt > 0) {
                            const firstItem = lineData.items[0];
                            if (firstItem.type === DrawableTextItemType.SPACE) {
                                filledWidth -= firstItem.calcWidth;
                                itemcnt--;
                                firstItem.calcWidth = 0;
                            }
                        }
                        if (itemcnt > 1) {
                            const lastItem = lineData.items[lineData.items.length - 1];
                            if (lastItem.type === DrawableTextItemType.SPACE) {
                                filledWidth -= lastItem.calcWidth;
                                itemcnt--;
                                lastItem.calcWidth = 0;
                            }
                        }
                        if (lineData.textAlign === TextAlign.JUSTIFY) {
                            const diffWidth = (lineData.limitWidth - filledWidth) / itemcnt;
                            $.each(lineData.items, (j, item) => {
                                if (item.calcWidth > 0) item.calcWidth += diffWidth;
                            });
                        } else if (lineData.textAlign === TextAlign.RIGHT) {
                            lineData.indent += lineData.limitWidth - filledWidth;
                        } else if (lineData.textAlign === TextAlign.CENTER) {
                            lineData.indent += (lineData.limitWidth - filledWidth) / 2;
                        }
                        lineData = null;
                        continue;
                    }
                }
                break;
            }
            if (lineData == null) continue;

            lineData.maxHeight = Math.max(textItem.height || 0, lineData.maxHeight);
            lineData.maxLeading = Math.max((textItem.height || 0) * ((textItem.textStyle.lineHeight || 1) - 1), lineData.maxLeading);
            lineData.textAlign = Math.max(textItem.textStyle.textAlign || TextAlign.JUSTIFY, lineData.textAlign);
            lineData.items.push(textItem);
            if (textItem.type === DrawableTextItemType.NEWLINE) {
                indent = true;
                lineData = null;
            } else {
                let canvas = canvasList[canvasPos];
                let filledHeight = 0;
                if (!canvas) break;

                const drawableTextData: IDrawableLineData[] = $(canvas).data('drawableTextData');
                for (let i = 0; i < drawableTextData.length; i++) {
                    const line = drawableTextData[i];
                    filledHeight += line.maxHeight;
                    if (i < drawableTextData.length - 1) filledHeight += line.maxLeading;
                }
                if (filledHeight > ($(canvas).height() || 0)) {
                    lineData = drawableTextData.pop() || null;
                    $(canvas).data('drawableTextData', drawableTextData);

                    canvas = canvasList[++canvasPos];
                    if (!canvas) break;

                    $(canvas).data('drawableTextData').push(lineData)
                }
            }
        }
    }

    drawText() {
        $(this._element).find('x-paragraph-col > svg').each((i, canvas) => {
            const textData: IDrawableLineData[] = $(canvas).data('drawableTextData');
            const paths: SVGPathElement[] = [];
            const lines: SVGLineElement[] = [];
            let offsetY = 0;

            $(canvas).empty();
            for (let i = 0; i < textData.length; i++) {
                const lineData = textData[i];
                let offsetX = lineData.indent;
                let leading = 0;
                for (const item of lineData.items) {
                    if (item.type === DrawableTextItemType.PATH && item.path !== undefined && item.textStyle !== undefined) {
                        let transform = `translate(${(item.drawOffsetX || 0) + ((item.textStyle.letterSpacing || 0) / 2) + offsetX}px, ${(item.drawOffsetY || 0) + offsetY - lineData.maxHeight + ((lineData.maxHeight - (item.height || 0)) * 2)}px)`;
                        transform += ` scaleX(${item.textStyle.xscale})`;
                        leading = Math.max(leading, (item.textStyle.fontSize || 10) * ((item.textStyle.lineHeight || 1) - 1));
                        $(item.path).attr({
                            'data-id': item.id,
                            'data-line': i + 1,
                            'data-textnode': item.textNode.uuid,
                            'data-index-of-node': item.indexOfNode,
                            'data-index-of-text': item.indexOfText,
                            'data-x': offsetX,
                            'data-y': offsetY,
                            'data-width': item.calcWidth,
                            'data-height': lineData.maxHeight,
                            'data-leading': lineData.maxLeading,
                            'fill': item.textStyle.color || '#000000'
                        }).css('transform', transform);

                        if (item.textStyle.strikeline) {
                            const strikeline = document.createElementNS('http://www.w3.org/2000/svg', 'line');
                            $(strikeline).attr({
                                'data-id': item.id,
                                'data-textnode': item.textNode.uuid,
                                'data-index-of-node': item.indexOfNode,
                                'data-index-of-text': item.indexOfText,
                                'x1': (item.drawOffsetX || 0) + ((item.textStyle.letterSpacing || 0) / 2) + offsetX,
                                'x2': (item.drawOffsetX || 0) + ((item.textStyle.letterSpacing || 0) / 2) + offsetX + item.calcWidth,
                                'y1': (item.drawOffsetY || 0) + offsetY - (lineData.maxHeight / 3),
                                'y2': (item.drawOffsetY || 0) + offsetY - (lineData.maxHeight / 3),
                                'stroke': item.textStyle.color,
                                'stroke-width': 1,
                                'stroke-linecap': 'butt'
                            });
                            lines.push(strikeline);
                        }
                        if (item.textStyle.underline) {
                            const underline = document.createElementNS('http://www.w3.org/2000/svg', 'line');
                            $(underline).attr({
                                'data-id': item.id,
                                'data-textnode': item.textNode.uuid,
                                'data-index-of-node': item.indexOfNode,
                                'data-index-of-text': item.indexOfText,
                                'x1': (item.drawOffsetX || 0) + ((item.textStyle.letterSpacing || 0) / 2) + offsetX,
                                'x2': (item.drawOffsetX || 0) + ((item.textStyle.letterSpacing || 0) / 2) + offsetX + item.calcWidth,
                                'y1': (item.drawOffsetY || 0) + offsetY,
                                'y2': (item.drawOffsetY || 0) + offsetY,
                                'stroke': item.textStyle.color,
                                'stroke-width': 1,
                                'stroke-linecap': 'butt'
                            });
                            lines.push(underline);
                        }
                        paths.push(item.path);
                    }
                    offsetX += item.calcWidth;
                }
                offsetY += lineData.maxHeight;
                offsetY += lineData.maxLeading;
            }
            $(canvas).append(paths);
            $(canvas).append(lines);
        });
    }

    redraw() {
        this.generateDrawableTextData();
        this.computeDrawableTextSize();
        this.drawText();
    }

    set text(text: string) {
        this._textObject = ActaTextConverter.textobject(text);
        this.redraw();
    }

    set columnCount(count) {
        this._element.innerHTML = '';
        this._columnCount = count || 1;
        for (let i = 0; i < this._columnCount; i++) {
            this._element.appendChild(document.createElement('x-paragraph-col'));
            if (i + 1 >= this._columnCount) continue;
            const margin = document.createElement('x-paragraph-margin');
            $(margin).attr('width', this.innerMargin);
            this._element.appendChild(margin);
        }
        $(this._element).trigger('resize');
    }

    set innerMargin(innerMargin) {
        this._innerMargin = innerMargin;
        $(this._element).find('x-paragraph-margin').attr('width', innerMargin);
        $(this._element).trigger('resize');
    }
    set defaultTextStyleName(styleName: string) { this._defaultTextStyleName = styleName; }
    set editable(val: boolean) { this._editable = val; }

    get columnCount() { return this._columnCount; }
    get innerMargin() { return this._innerMargin; }
    get text() { return ''; }
    get defaultTextStyleName() { return this._defaultTextStyleName || ''; }
    get editable() { return this._editable; }

    get el() { return this._element; }
};