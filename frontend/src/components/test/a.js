/**
 * @param {Array} arr
 * @param {number} n
 * @return {Array}
 */
var flat = function (arr, n) {
    if (!Array.isArray(arr)) return [];

    const flatten = (items, depth) =>
        items.reduce((acc, item) => {
            if (Array.isArray(item) && depth > 0) {
                acc.push(...flatten(item, depth - 1));
            } else {
                acc.push(item);
            }
            return acc;
        }, []);

    return flatten(arr, n);
};
