var ff;
$(document).ready(e => {
    $('<x-page>').attr({
        width: '25cm',
        height: '30cm',
        padding: '0.5cm'
    }).appendTo('body');
    $('<x-guide>').append(
        $('<x-guide-col>')
    ).append(
        $('<x-guide-col>')
    ).append(
        $('<x-guide-col>')
    ).append(
        $('<x-guide-col>')
    ).append(
        $('<x-guide-col>')
    ).appendTo('x-page');

    $('<x-galley>').append(
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
    }).appendTo('x-page');


    opentype.load('fonts/jabml.ttf', (err, font) => {
        ff = font;
        $('button').click(aa);
    });
});

function aa() {
    var tt = $('textarea').val();
    tt = tt.substring(0, tt.length);
    console.log((new Date()).getTime());
    drawtext($('x-galley'), ff, tt, 12, '#000000');
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
    target.find('> x-paragraph-col > canvas').each((i, el) => {
        let paraCol = $(el).parent();
        el.width = paraCol.innerWidth();
        el.height = paraCol.innerHeight();
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
            let glyphData = getTextGlyph(font, text[i], size, color);
            if (glyphData.canvas) {
                charData.type = 'CANVAS';
                charData.data = glyphData.canvas;
            } else if (glyphData.svg) {
                charData.type = 'SVG';
                charData.data = glyphData.svg;
            } else if (glyphData.glyph) {
                charData.type = 'GLYPH';
                charData.data = glyphData.glyph;
                charData.drawOffsetX = glyphData.offsetX;
                charData.drawOffsetY = glyphData.offsetY;
            } else {
                continue;
            }
            charData.char = text[i];
            charData.size = size;
            charData.width = glyphData.width;
            charData.height = glyphData.height;
            charData.orgWidth = charData.width;
        }
        while (1) {
            if (!line) {
                let para = $(target.find('x-paragraph-col').get(pos)).find('canvas');
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
            let para = $(target.find('x-paragraph-col').get(pos)).find('canvas');
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
        let canvas = $(target.find('x-paragraph-col').get(i)).find('canvas').get(0);
        let buf = new OffscreenCanvas(canvas.width, canvas.height);
        let bufCtx = buf.getContext('2d');
        let offsetY = 0;
        bufCtx.clearRect(0, 0, buf.width, buf.height);
        $.each(para, (j, line) => {
            let offsetX = 0;
            $.each(line.items, (k, item) => {
                if (item.type == 'CANVAS') {
                    bufCtx.drawImage(item.data,
                        0, 0, item.data.width, item.data.height,
                        offsetX, offsetY + (line.maxHeight - item.height), item.data.width, item.data.height
                    );
                } else if (item.type == 'SVG') {
                    let img = new Image();
                    let url = URL.createObjectURL(
                        new Blob([item.data], {type: 'image/svg+xml'})
                    );
                    img.offsetX = offsetX;
                    img.offsetY = offsetY + (line.maxHeight - item.height);
                    $(img).on('load', function () {
                        canvas.getContext('2d').drawImage(this,
                            0, 0, this.width, this.height,
                            this.offsetX, this.offsetY, this.width, this.height
                        );
                        URL.revokeObjectURL(url);
                    });
                    img.src = url;
                }
                offsetX += item.width;
            });
            offsetY += line.maxHeight;
        });
        canvas.getContext('2d').drawImage(buf, 0, 0);
    });
}

function getTextGlyph(font, char, size, color) {
    var options = { kerning: true, hinting: true, features: { liga: true, rlig: true } };
    var glyph = font.charToGlyph(char);
    var unitsPerSize = font.unitsPerEm / size;
	var charWidth = glyph.advanceWidth / unitsPerSize;
	var charHeight = (font.tables.os2.usWinAscent + font.tables.os2.usWinDescent) / unitsPerSize;
	var yMin = font.tables.head.yMin / unitsPerSize;
	var path = font.getPath(char, 0, charHeight + yMin, size);

    /*var offCanvas = new OffscreenCanvas(charWidth, charHeight);
    //font.draw(offCanvas.getContext('2d'), char, 0, charHeight + yMin, size, options);
    //glyph.draw(offCanvas.getContext('2d'), 0, charHeight + yMin, size);
    path.draw(offCanvas.getContext('2d'));

    var svg = $('<svg xmlns="http://www.w3.org/2000/svg"></svg>').attr({
        'width': charWidth,
        'height': charHeight
    }).html(path.toSVG(4)).get(0).outerHTML;
*/
    return {
        glyph: glyph,
        offsetX: 0,
        offsetY: charHeight + yMin,
        //svg: svg,
        //canvas: offCanvas,
        width: charWidth,
        height: charHeight
    };
}