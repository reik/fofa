class Pet {
  constructor(name) {
    this.name = name;
  }

  speak() {
    console.log(`${this.name} makes a noise.`);
  }

  moreSpeak = () => {
    console.log(`${this.name} makes a more noise.`);
  };

  moreSpeak2 = function () {
    console.log(`${this.name} makes a more noise.`);
  };
}

var name = "Tom";

const cat = new Pet("Kitty");
cat.speak();
cat.moreSpeak();
cat.moreSpeak2();
