export default (() => {
    const features = {
        clipboard: false
    };
    if (navigator.clipboard) {
        if (navigator.clipboard.readText && navigator.clipboard.writeText) features.clipboard = true;
    }
    return features;
})();