var ff;
$(document).ready(e => {
    var page = new ActaPage('25cm', '30cm');
    page.padding = '0.5cm';

    var guide = new ActaGuide(5, '2mm');
    var galley = new ActaGalley('5mm', '5mm', '143.7mm', '140mm');
    $(page.el).append(guide.el);
    $(page.el).append(galley.el);
    $(page.el).appendTo('body');

    $(galley.el).append(
        $('<x-paragraph-col>')
    ).append(
        $('<x-paragraph-col>')
    ).append(
        $('<x-paragraph-col>')
    ).attr({
        'x': '0.5cm',
        'y': '0.5cm',
        'width': '14.37cm',
        'height': '14cm'
    });
    opentype.load('fonts/jabml.ttf', (err, font) => {
        ff = font;
        $('button').click(aa);
    });
});

function aa() {
    var tt = $('textarea').val();
    tt = tt.substring(0, tt.length);
    console.log((new Date()).getTime());
    drawtext($('x-galley'), ff, tt, 12, '#ff0000');
    console.log((new Date()).getTime());
}

function cmyk2rgb(c, m, y, k) {
    c = (c / 100);
    m = (m / 100);
    y = (y / 100);
    k = (k / 100);
    
    c = c * (1 - k) + k;
    m = m * (1 - k) + k;
    y = y * (1 - k) + k;

    return {
        r: Math.round(255 * (1 - c)),
        r: Math.round(255 * (1 - m)),
        r: Math.round(255 * (1 - y))
    };
}

var textdata;
function drawtext(target, font, text, size, color) {
    var line = false;
    var pos = 0;

    textdata = [];
    target.find('> x-paragraph-col > .canvas').each((i, el) => {
        let paraCol = $(el).parent();
        $(el).attr({
            'width': paraCol.innerWidth(),
            'height': paraCol.innerHeight()
        });
        textdata[i] = [];
    });
    for (let i = 0; i < text.length; i++) {
        let charData = {};
        if (text[i] == "\n") {
            charData.char = "\n";
            charData.size = size;
            charData.type = 'NEWLINE';
        } else if (text[i] == ' ') {
            charData.char = ' ';
            charData.size = size;
            charData.type = 'SPACE';
            charData.width = size / 3;
            charData.orgWidth = charData.width;
        } else {
            let glyphData = getTextPath(font, text[i], size);
            charData.type = 'PATH';
            charData.char = text[i];
            charData.color = color;
            charData.path = glyphData.path;
            charData.drawOffsetX = glyphData.offsetX;
            charData.drawOffsetY = glyphData.offsetY;
            charData.width = glyphData.width;
            charData.height = glyphData.height;
            charData.orgWidth = charData.width;
        }
        while (1) {
            if (!line) {
                let para = $(target.find('x-paragraph-col').get(pos)).find('.canvas');
                if (!para) break;
                line = {
                    maxWidth: para.width(),
                    maxHeight: 0,
                    items: []
                };
                textdata[pos].push(line);
                if (charData.type == 'SPACE') charData.width = 0;
            } else {
                let charWidthSum = 0;
                $.each(line.items, (j, item) => charWidthSum += item.width);
                if (charWidthSum + charData.orgWidth > line.maxWidth) {

                    let charCnt = line.items.length;
                    if (charCnt > 0) {
                        let lastChar = line.items[line.items.length - 1];
                        if (lastChar.type == 'SPACE') {
                            charWidthSum -= lastChar.width;
                            charCnt--;
                            lastChar.width = 0;
                        }
                    }
                    let addWidth = (line.maxWidth - charWidthSum) / charCnt;
                    $.each(line.items, (j, item) => {
                        if (j > charCnt - 1) return;
                        item.width += addWidth;
                    });
                    line = false;
                    continue;
                }
            }
            break;
        }
        line.maxHeight = Math.max(charData.height || 0, line.maxHeight);
        line.items.push(charData);
        if (charData.type == 'NEWLINE') {
            line = false;
        } else {
            let para = $(target.find('x-paragraph-col').get(pos)).find('.canvas');
            let lineHeightSum = 0;
            if (!para) break;
            $.each(textdata[pos], (j, pline) => lineHeightSum += pline.maxHeight);
            if (lineHeightSum > para.height()) {
                line = textdata[pos++].pop();
                if (!textdata[pos]) break;
                textdata[pos].push(line);
            }
        }
    }
    $(target).attr('data-text', text);

    $.each(textdata, (i, para) => {
        let canvas = $(target.find('x-paragraph-col').get(i)).find('.canvas').get(0);
        let offsetY = 0;
        let paths = [];
        $(canvas).empty();
        $.each(para, (j, line) => {
            let offsetX = 0;
            $.each(line.items, (k, item) => {
                if (item.type == 'PATH') {
                    paths.push(
                        item.path.attr('fill', item.color).css('transform', 'translate(' + (item.drawOffsetX + offsetX) + 'px, ' + (item.drawOffsetY + offsetY - line.maxHeight) + 'px)')
                    );
                }
                offsetX += item.width;
            });
            offsetY += line.maxHeight;
        });
        $(canvas).append(paths);
    });
}

function getTextPath(font, char, size) {
    var glyph = font.charToGlyph(char);
    var unitsPerSize = font.unitsPerEm / size;
	var charWidth = glyph.advanceWidth / unitsPerSize;
	var charHeight = (font.tables.os2.usWinAscent + font.tables.os2.usWinDescent) / unitsPerSize;
    var yMin = font.tables.head.yMin / unitsPerSize;
    var path = glyph.getPath(0, charHeight, size);

    return {
        path: $(document.createElementNS('http://www.w3.org/2000/svg', 'path')).attr('d', $(path.toSVG(4)).attr('d')),
        offsetX: 0,
        offsetY: charHeight + yMin,
        width: charWidth,
        height: charHeight
    };
}