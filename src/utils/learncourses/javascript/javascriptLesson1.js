export const javascriptLesson1 = {
  id: 1,
  title: 'Introduction to JavaScript',
  description: 'What JS is and why it runs everywhere.',
  difficulty: 'Beginner',
  duration: '7 mins',
  content: `
## What is JavaScript?

JavaScript (JS) is the only programming language that natively runs inside web browsers. It makes websites interactive - every button click, animation, and live update is powered by JS. Today, with Node.js, JavaScript also runs on servers making it a full-stack language.

### Why JavaScript?
- The only language that runs natively in the browser.
- Used for front-end (UI), back-end (Node.js), mobile (React Native), and desktop (Electron) apps.
- Huge ecosystem — npm has over 2 million packages!

### Your First JavaScript Program:
\`\`\`javascript
// Output to the browser console
console.log("Hello, World!");

// Show alert in the browser
alert("Welcome to JavaScript!");

// Write to the web page
document.write("Hello from JavaScript!");
\`\`\`

### Variables in JavaScript
JavaScript has three ways to declare variables:
- \`var\`: Old way. Function-scoped, avoid it.
- \`let\`: Block-scoped, can be reassigned.
- \`const\`: Block-scoped, cannot be reassigned.

\`\`\`javascript
let name = "Alice";
const PI = 3.14159;

name = "Bob"; // OK - let can be reassigned
// PI = 3;   // Error! const cannot be reassigned
\`\`\`

### Data Types:
JavaScript is dynamically typed — you don't declare types.
\`\`\`javascript
let str = "Hello";          // String
let num = 42;               // Number (integers and floats are the same type!)
let isActive = true;        // Boolean
let nothing = null;         // Null (intentional absence of value)
let notDefined = undefined; // Undefined (variable declared but not assigned)
let list = [1, 2, 3];      // Array
let person = { name: "Bob", age: 25 }; // Object

// Check type
console.log(typeof str); // "string"
\`\`\`
`
};