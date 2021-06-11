export default (() => {
    const features = {
        clipboard: false
    };
    if (navigator.clipboard) features.clipboard = true;

    return features;
})();