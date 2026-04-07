function quickSort(arr: number[]): number[] {
  if (arr.length <= 1) return arr;

  const pivot = arr[Math.floor(arr.length / 2)];
  const left = arr.filter((x) => x < pivot);
  const right = arr.filter((x) => x > pivot);
  const middle = arr.filter((x) => x === pivot);

  console.log("left!", left);
  console.log("middle!", middle);

  return [...quickSort(left), ...middle, ...quickSort(right)];
}

console.log(quickSort([3, 6, 8, 10, 1, 2, 1, 13, 7])); // [1, 1, 2, 3, 6, 7, 8, 10, 13]
