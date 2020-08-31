var ff;
$(document).ready(e => {
    $('<x-article>').attr({
        width: '25cm',
        height: '30cm',
        padding: '0.5cm'
    }).appendTo('body');
    $('<x-col-area>').append(
        $('<x-col>')
    ).append(
        $('<x-col>')
    ).append(
        $('<x-col>')
    ).append(
        $('<x-col>')
    ).append(
        $('<x-col>')
    ).appendTo('x-article');

    $('<x-para>').append(
        $('<x-para-text>')
    ).append(
        $('<x-para-text>')
    ).append(
        $('<x-para-text>')
    ).attr({
        'x': '0.5cm',
        'y': '0.5cm',
        'width': '14.37cm',
        'height': '14cm'
    }).appendTo('x-article');


    opentype.load('fonts/jabml.ttf', (err, font) => {
        ff = font;
        $('button').click(aa);
    });
});

function aa() {
    var tt = $('textarea').val();
    tt = tt.substring(0, tt.length);
    console.log((new Date()).getTime());
    drawtext($('x-para'), ff, tt, 12, '#000000');
    console.log((new Date()).getTime());
}

function cmyk2rgb(c, m, y, k){
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

function drawtext(target, font, text, size, color) {
    var line = false;
    var pos = 0;
    target.find('x-para-text').empty();
    for (let i = 0; i < text.length; i++) {
        let char = $('<x-char>');
        if (text[i] == "\n") {
            char.addClass('newline').attr('data-char', ':NEWLINE');
        } else if (text[i] == ' ') {
            char.addClass('space').attr('data-char', ':SPACE').css('width', size / 3);
        } else {
            let svgdata = textToSVG(font, text[i], size, color);
            char.attr('data-char', svgdata.char).css({
                'font-size': svgdata.fontsize,
                'width': svgdata.width,
                'height': svgdata.height
            }).append(svgdata.svg);
        }
        while (1) {
            if (!line) {
                let para = target.find('x-para-text').get(pos);
                if (!para) break;
                line = $('<x-para-text-line>').appendTo(para);
                if (char.hasClass('space')) char.css('width', 0);
            } else {
                let charWidthSum = 0;
                line.find('> x-char').each(
                    (j, el) => charWidthSum += $(el).outerWidth(true)
                );
                if (charWidthSum + char.outerWidth() > line.innerWidth()) {
                    let lastChar = line.find('x-char').last();
                    let charCnt = line.find('x-char').length;
                    if (lastChar.hasClass('space')) {
                        charWidthSum -= lastChar.outerWidth(true);
                        charCnt--;
                        lastChar.css('width', 0);
                    }
                    let inWidth = (line.innerWidth() - charWidthSum) / charCnt;
                    line.find('x-char').each((j, el) => {
                        if (j > charCnt - 1) return;
                        $(el).width($(el).width() + Math.ceil(inWidth));
                    });
                    line = false;
                    continue;
                }
            }
            break;
        }
        char.appendTo(line);
        if (char.hasClass('newline')) {
            line = false;
        } else {
            let para = target.find('x-para-text').get(pos);
            let lineHeightSum = 0;
            if (!para) break;
            $(para).find('> x-para-text-line').each(
                (j, el) => lineHeightSum += $(el).outerHeight(true)
            );
            if (lineHeightSum > $(para).innerHeight()) {
                para = target.find('x-para-text').get(++pos);
                if (!para) {
                    line.remove();
                    break;
                }
                line.appendTo(para);
            }
        }
    }
    $(target).attr('data-text', text);
}

function textToSVG(font, char, size, color) {
    var options = { kerning: true, hinting: true, features: { liga: true, rlig: true } };
	var unitsPerEm = font.unitsPerEm;
	var unitHeight = font.tables.os2.usWinAscent + font.tables.os2.usWinDescent;
	var charHeight = unitHeight / (unitsPerEm / size);
	var xMin = font.tables.head.xMin / (unitsPerEm / size);
	var yMin = font.tables.head.yMin / (unitsPerEm / size);
	var path = font.getPath(char, xMin, size + yMin, size, options);
    //path.fill = "transparent";
    //path.stroke = "red";

    var bbox = path.getBoundingBox();
    var svg = $('<svg xmlns="http://www.w3.org/2000/svg"></svg>').attr({
        'width': bbox.x2,
        'height': bbox.y2
    }).html(path.toSVG(4)).get(0);

    return {
        fontsize: size,
        svg: svg,
        char: char,
        width: bbox.x2,
        height: charHeight//bbox.y2
    };
}