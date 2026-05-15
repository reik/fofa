/**
 * Demonstrates variable hoisting and scope behavior in JavaScript using `var`.
 *
 * Note: The loop starts at `i = 0`, but `items` is an object with keys starting at `1`.
 * Therefore, `items[0]` is `undefined`, and the first valid value is retrieved at `i = 1`.
 *
 * Since `var` is function-scoped (not block-scoped), both `i` and `li` are accessible
 * outside the `for` loop after it completes.
 *
 * After the loop ends:
 * - `i` will be `5` (the value that caused the loop condition `i < 5` to fail)
 * - `li` will be `undefined` because `items[4]` does not exist in the object
 *   (object keys are `1` through `5`, and the loop iterates `0` through `4`)
 *
 * @example
 * // Output inside loop:
 * // 0, undefined:0
 * // 1, a:1
 * // 2, b:2
 * // 3, c:3
 * // 4, d:4
 *
 * // Output outside loop:
 * // i 5
 * // li undefined
 */
// var items = { 1: "a", 2: "b", 3: "c", 4: "d", 5: "e" };
// for (var i = 0; i < 5; i++) {
//   console.log(i);
//   var li = items[i];

//   console.log(li + ":" + i);
// }

// console.log("i", i);
// console.log("li", li);

for (var j = 0; j < 5; j++) {
  console.log(j);
}
console.log("jjj", j);
