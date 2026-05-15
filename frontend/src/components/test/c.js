function myTag(strings, ...values) {
  console.log(strings); // Array of string segments
  console.log(values); // Array of interpolated values
  //   return "Custom output";
  console.log("strings", strings);
  return strings.reduce((result, string, i) => {
    console.log("string", string);
    console.log("aaa", result + string + (values[i] || ""));
    return result + string + (values[i] || "");
  }, "");
}

const item = "laptop";
const price = 999;

// Note the lack of parentheses
console.log(myTag`The ${item} costs $${price}.`);
