/**
 * @param {Function} fn
 * @return {Object}
 */
Array.prototype.groupBy = function (fn) {
  return this.reduce((acc, e) => {
    const key = fn(e);
    (acc[key] ??= []).push(e);
    return acc;
  }, {});
};

/**
 * [1,2,3].groupBy(String) // {"1":[1],"2":[2],"3":[3]}
 */
console.log(Number.isNaN("Hello"));
