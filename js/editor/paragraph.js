class ActaParagraph {
    constructor(columnCount, innerMargin, columnWidths) {
        this._element = document.createElement('x-paragraph');

        columnWidths = columnWidths || [];

        this.columnCount = columnCount;
        for (let i = 0; i < columnCount; i++) {
            if (columnWidths[i]) this.columnWidth(i, columnWidths[i]);
        }
        this.innerMargin = innerMargin;

        this._SVGPath = [];
        
        $(this._element).on('resize', e => {
            this.calcDrawableTextSize();
            this.drawText();
            return false;
        });
    }

    columnWidth(idx, val) {
        if (arguments.length > 1) {
            $(this._element).find('x-paragraph-col').get(idx).setAttribute('width', val || 0);
            $(this._element).trigger('resize');
        } else {
            return $(this._element).find('x-paragraph-col').get(idx).getAttribute('width') || false;
        }
    }

    convertTextSVGPath() {
        let style = ActaTextStyleManager.getInstance().get('본문1');
        let size = style.fontSize;
        let font = style.font;
        this._SVGPath = [];
        for (let i = 0; i < (this._text.length || 0); i++) {
            let charData = {
                index: i,
                char: this._text[i],
                color: '#000000',
                size: size
            };
            if (this._text[i] == "\n") {
                charData.type = 'NEWLINE';
                charData.width = 0;
            } else if (this._text[i] == ' ') {
                charData.type = 'SPACE';
                charData.width = size / 3;
            } else {
                let glyphData = getTextPath(font.font, this._text[i], size);
                charData.type = 'PATH';
                charData.path = glyphData.path;
                charData.drawOffsetX = glyphData.offsetX;
                charData.drawOffsetY = glyphData.offsetY;
                charData.width = glyphData.width;
                charData.height = glyphData.height;
            }
            this._SVGPath.push(charData);
        }
    }

    calcDrawableTextSize() {
        let canvasList = [];
        let canvasPos = 0;
        let lineData = false;
        $(this._element).find('x-paragraph-col > svg').each((i, canvas) => {
            canvas.setAttribute('width', $(canvas).parent().innerWidth());
            canvas.setAttribute('height', $(canvas).parent().innerHeight());
            canvas.drawableTextData = [];
            canvasList.push(canvas);
        });
        for (let i = 0; i < (this._SVGPath.length || 0); i++) {
            let svgPath = this._SVGPath[i];
            svgPath.calcWidth = svgPath.width;
            while (1) {
                if (!lineData) {
                    let canvas = canvasList[canvasPos];
                    if (!canvas) break;
                    lineData = {
                        limitWidth: $(canvas).width(),
                        maxHeight: 0,
                        items: []
                    };
                    canvas.drawableTextData.push(lineData);
                    if (svgPath.type == 'SPACE') svgPath.calcWidth = 0;
                } else {
                    let itemcnt = 0;
                    let filledWidth = 0;
                    $.each(lineData.items, (j, item) => {
                        if (item.calcWidth > 0) {
                            filledWidth += item.calcWidth;
                            itemcnt++;
                        }
                    });
                    if (filledWidth + svgPath.width > lineData.limitWidth) {
                        let itemcnt = lineData.items.length;
                        if (itemcnt > 0) {
                            let lastItem = lineData.items[itemcnt - 1];
                            if (lastItem.type == 'SPACE') {
                                filledWidth -= lastItem.width;
                                itemcnt--;
                                lastItem.calcWidth = 0;
                            }
                        }
                        let diffWidth = (lineData.limitWidth - filledWidth) / itemcnt;
                        $.each(lineData.items, (j, item) => {
                            if (item.calcWidth > 0) item.calcWidth += diffWidth;
                        });
                        lineData = false;
                        continue;
                    }
                }
                break;
            }
            lineData.maxHeight = Math.max(svgPath.height || 0, lineData.maxHeight);
            lineData.items.push(svgPath);
            if (svgPath.type == 'NEWLINE') {
                lineData = false;
            } else {
                let canvas = canvasList[canvasPos];
                let filledHeight = 0;
                if (!canvas) break;
                $.each(canvas.drawableTextData, (j, line) => filledHeight += line.maxHeight);
                if (filledHeight > $(canvas).height()) {
                    lineData = canvas.drawableTextData.pop();
                    canvas = canvasList[++canvasPos];
                    if (!canvas) break;
                    canvas.drawableTextData.push(lineData); 
                }
            }
        }
    }

    drawText() {
        $(this._element).find('x-paragraph-col > svg').each((i, canvas) => {
            let textData = canvas.drawableTextData || [];
            let offsetY = 0;
            let paths = [];

            $(canvas).empty();
            $.each(textData, (i, lineData) => {
                let offsetX = 0;
                $.each(lineData.items, (j, item) => {
                    if (item.type == 'PATH') {
                        paths.push(
                            item.path.attr({
                                'data-index': item.index,
                                'data-x': item.drawOffsetX + offsetX,
                                'data-y': item.drawOffsetY + offsetY - lineData.maxHeight,
                                'data-width': item.calcWidth,
                                'data-height': lineData.maxHeight,
                                'fill': item.color
                            }).css({
                                'transform': `translate(${item.drawOffsetX + offsetX}px, ${item.drawOffsetY + offsetY - lineData.maxHeight}px)`
                            })
                        );
                    }
                    offsetX += item.calcWidth;
                });
                offsetY += lineData.maxHeight;
            });
            $(canvas).append(paths);
        });
    }

    set text(text) {
        this._text = text;

        this.convertTextSVGPath();
        this.calcDrawableTextSize();
        this.drawText();
    }

    set columnCount(count) {
        this._element.innerHTML = '';
        this._columnCount = count || 1;
        for (let i = 0; i < this._columnCount; i++) {
            this._element.appendChild(document.createElement('x-paragraph-col'));
            if (i + 1 >= this._columnCount) continue;
            let margin = document.createElement('x-paragraph-margin');
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

    get columnCount() { return this._columnCount; }
    get innerMargin() { return this._innerMargin; }
    get text() { return this._text; }

    get el() { return this._element; }

};