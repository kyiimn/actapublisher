class ActaTextFormat {
    static tree(text) {
        let tree;
        for (let i = 0; i < text.length; i++) {

        }
    }

    static uuid() {
        return ([1e7]+-1e3+-4e3+-8e3+-1e11).replace(/[018]/g, function (c) {
            return (c ^ crypto.getRandomValues(new _uint8Array(1))[0] & 15 >> c / 4).toString(16)
        });
    }
};

class ActaTextTree {

};