const flat = function (arr, n) {
  const resultArr = [];

  const flatten = (arr2, resultArr, depth) => {
    return arr2.reduce((acc, item) => {
      if (Array.isArray(item) && depth < n) {
        flatten(item, acc, depth + 1);
      } else {
        acc.push(item);
      }

      return acc;
    }, resultArr);
  };

  return flatten(arr, resultArr, n);
};

console.log(flat([1, [2, [3, [4, 5]]]], 2)); // [1, 2, 3, [4, 5]]
