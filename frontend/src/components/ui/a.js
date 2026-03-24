/**
 * @param {Array} arr1
 * @param {Array} arr2
 * @return {Array}
 */
var join = function (arr1, arr2) {
  const arr1Indexes = arr1.map((a) => a.id);
  const arr2Indexes = arr2.map((a) => a.id);
  console.log("arr1Indexes!", arr1Indexes);

  // const startIndex = arr1Indexes[0] < arr2Indexes[0] ? arr1Indexes[0] : arr2Indexes[0]
  // const endIndex = arr1Indexes[arr1Indexes.length -1] > arr2Indexes[arr2Indexes.length-1] ? arr1Indexes[arr1Indexes.length -1 ] : arr2Indexes[arr2Indexes.length -1 ];

  const mergedIds = [...new Set([...arr1Indexes, ...arr2Indexes])].sort();

  console.log("mergedIds!", mergedIds);

  const mergedArr = [];
  mergedIds.forEach((i) => {
    const objOf1 = arr1.find((a) => a.id === i);
    const objOf2 = arr2.find((a) => a.id === i);

    const obj =
      objOf1 && objOf2
        ? { ...objOf1, ...objOf2 }
        : objOf2
          ? objOf2
          : objOf1
            ? objOf1
            : null;

    if (obj) mergedArr.push(obj);
  });

  return mergedArr;
};

var join2 = function (arr1, arr2) {
  const map = new Map();

  for (const item of [...arr1, ...arr2]) {
    map.set(item.id, { ...map.get(item.id), ...item });
  }

  return [...map.values()].sort((a, b) => a.id - b.id);
};

const setE = new Set([
  { id: 1, name: "a", company: { name: "Company A", phone: "123-456-7890" } },
  { id: 2, name: "b" },
]);

setE.add({
  id: 1,
  name: "a",
  company: { name: "Company A", phone: "123-456-7890" },
});

console.log("setE.values()", setE.values());
