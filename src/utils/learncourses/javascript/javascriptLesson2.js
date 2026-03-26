export const javascriptLesson2 = {
  id: 2,
  title: 'Functions & Scope',
  description: 'Arrow functions, closures, and variable scope.',
  content: `
## Functions in JavaScript

Functions are first-class citizens in JavaScript — they can be stored in variables, passed as arguments, and returned from other functions.

### Function Declaration vs. Expression:
\`\`\`javascript
// Declaration (hoisted — can be called before its definition)
function greet(name) {
    return "Hello, " + name + "!";
}

// Expression (not hoisted)
const greet2 = function(name) {
    return "Hi, " + name + "!";
};

// Arrow Function (ES6+) — concise and lexically binds 'this'
const greet3 = (name) => "Hey, " + name + "!";
const square = x => x * x; // Parentheses optional for single param
\`\`\`

### Default Parameters & Rest:
\`\`\`javascript
function introduce(name = "Guest", age = 0) {
    console.log(name + " is " + age + " years old.");
}
introduce("Alice", 25); // Alice is 25 years old.
introduce();            // Guest is 0 years old.

// Rest params: capture remaining args into an array
function sum(...numbers) {
    return numbers.reduce((acc, n) => acc + n, 0);
}
console.log(sum(1, 2, 3, 4)); // 10
\`\`\`

### Closures
A closure is when a function remembers the variables from its outer scope even after the outer function has returned.
\`\`\`javascript
function makeCounter() {
    let count = 0;
    return function() {
        count++;
        return count;
    };
}

const counter = makeCounter();
console.log(counter()); // 1
console.log(counter()); // 2
console.log(counter()); // 3 — 'count' is preserved!
\`\`\`
`
};