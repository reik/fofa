console.log("aaa", JSON.stringify(new Date()));

console.log("structuredClone(new Date())", structuredClone(new Date()));

let x = 10;
x /= 3;
console.log(x);

new Promise((resolve) => {
  setTimeout(() => {
    resolve("done");
  }, 1000);
})
  .then((res) => {
    console.log(res);
  })
  .finally(() => {
    console.log("finally");
  });
