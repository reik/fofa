/**
 * Merges two sorted arrays into one sorted array.
 */
// function merge<T>(left: T[], right: T[]): T[] {
//   const result: T[] = [];
//   let leftIndex = 0;
//   let rightIndex = 0;

//   // Compare elements from both arrays and push the smaller one to result
//   while (leftIndex < left.length && rightIndex < right.length) {
//     if (left[leftIndex] < right[rightIndex]) {
//       result.push(left[leftIndex]);
//       leftIndex++;
//     } else {
//       result.push(right[rightIndex]);
//       rightIndex++;
//     }
//   }

//   console.log("left", left);
//   console.log("leftIndex", leftIndex);
//   console.log("right", right);
//   console.log("rightIndex!", rightIndex);

//   // Concatenate any remaining elements from either array
//   return result.concat(left.slice(leftIndex)).concat(right.slice(rightIndex));
// }

/**
 * Main Merge Sort function.
 */
export function mergeSort<T>(array: T[]): T[] {
  // Base case: arrays with 0 or 1 element are already sorted
  if (array.length <= 1) {
    return array;
  }

  // Split the array into two halves
  const middle = Math.floor(array.length / 2);
  const left = array.slice(0, middle);
  const right = array.slice(middle);

  // Recursively sort and merge
  return merge3(mergeSort(left), mergeSort(right));
}

function merge3<T>(leftArr: T[], rightArr: T[]): T[] {
  let leftIndex = 0;
  let rightIndex = 0;

  const result: T[] = [];
  
  while (leftIndex < leftArr.length && rightIndex < rightArr.length) {
    if (leftArr[leftIndex]! === rightArr[rightIndex]!) {
      result.push(leftArr[leftIndex]!);
      result.push(rightArr[rightIndex]!);
      leftIndex++;
      rightIndex++;
    } else if (leftArr[leftIndex]! < rightArr[rightIndex]!) {
      result.push(leftArr[leftIndex]!);
      leftIndex++;
    } else {
      result.push(rightArr[rightIndex]!);
      rightIndex++;
    }
  }

  console.log("leftArr", leftArr);
  console.log("leftIndex", leftIndex);
  console.log("result", result);

  return result.concat(leftArr.slice(leftIndex)).concat(rightArr.slice(rightIndex));
}


// Example usage:
const unsorted = [34, 7, 23, 32, 5, 62];
const sorted = mergeSort(unsorted);
console.log(sorted); // [5, 7, 23, 32, 34, 62]
