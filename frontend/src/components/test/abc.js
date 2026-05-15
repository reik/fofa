const original = { name: "MDN" };
original.itself = original;

// Clone it
const clone = structuredClone(original);
console.log(clone);

const deepNestedObject = {
  name: "MDN",
  nested: {
    name: {
      first: "MDN",
      last: "Web Docs",
    },
    address: {
      city: "City",
      country: "Country",
    },
  },
};

const deepClone = structuredClone(deepNestedObject);
console.log(deepClone);

const shallwO = Object.assign({}, deepNestedObject);

deepNestedObject.nested.name.first = "Changed Name";

console.log(shallwO);
