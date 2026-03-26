export const javascriptLesson4 = {
  id: 4,
  title: 'Arrays & Objects (ES6+)',
  description: 'Mastering destructuring, spread, and array methods.',
  content: `
## Working With Arrays and Objects

Modern JavaScript (ES6 and later) brought a lot of powerful tools to manipulate arrays and objects cleanly.

### Array Methods (The Big 3):
\`\`\`javascript
const numbers = [1, 2, 3, 4, 5];

// .map(): Transforms each element, returns a NEW array
const doubled = numbers.map(n => n * 2);
console.log(doubled); // [2, 4, 6, 8, 10]

// .filter(): Returns a NEW array with only elements that pass the test
const evens = numbers.filter(n => n % 2 === 0);
console.log(evens); // [2, 4]

// .reduce(): Accumulates all elements into a single value
const total = numbers.reduce((acc, n) => acc + n, 0);
console.log(total); // 15
\`\`\`

### Destructuring:
\`\`\`javascript
// Array Destructuring
const [first, second, ...rest] = [10, 20, 30, 40];
console.log(first); // 10
console.log(rest);  // [30, 40]

// Object Destructuring
const user = { name: "Alice", age: 28, city: "NY" };
const { name, age } = user;
console.log(name, age); // Alice 28
\`\`\`

### Spread & Rest Operator:
\`\`\`javascript
// Spread: Expand an array or object
const arr1 = [1, 2, 3];
const arr2 = [4, 5, 6];
const combined = [...arr1, ...arr2]; // [1, 2, 3, 4, 5, 6]

const defaults = { theme: "dark", lang: "en" };
const userPrefs = { ...defaults, lang: "fr" }; // Overrides lang
// { theme: "dark", lang: "fr" }
\`\`\`
`
};