function insertionSort(arr: number[]): number[] {
  for (let i = 1; i < arr.length; i++) {
    const key = arr[i]!;
    let j = i - 1;

    while (j >= 0 && arr[j]! > key) {
      arr[j + 1] = arr[j]!;
      j--;
    }
    arr[j + 1] = key;
  }
  return arr;
}

//console.log(insertionSort([12, 11, 13, 5, 6])); // [5, 6, 11, 12, 13]

function insertionSort2(arr: number[]) {
  const newArr = [...arr];
  for (let i = 0; i < newArr.length; i++) {
    while (newArr[i - 1] !== undefined && newArr[i - 1]! > newArr[i]!) {
      const replaceTemp = newArr[i - 1]!;
      newArr[i - 1] = newArr[i]!;
      newArr[i] = replaceTemp;
    }
  }

  return newArr;
}

console.log("222", insertionSort([12, 42, 3, 19, 111, 4, 11, 13, 5, 6])); // [5, 6, 11, 12, 13]
