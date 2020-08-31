opentype.load('../fonts/jabml.ttf', (err, font) => {
    let text = "으랏차!";
    let ctx = document.getElementsByTagName("canvas")[0].getContext("2d");
    let options = {
        kerning: true,
        hinting: true,
        features: {
            liga: true,
            rlig: true
        }
    };
    let snapPath = font.getPath(text, 0, 150, 150, options);
    snapPath.draw(ctx);

    //font.draw(ctx, text, 0, 200, 150, options);
});