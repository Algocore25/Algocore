export const javascript = {
    id: 'javascript',
    name: 'JavaScript for Web Development',
    description: 'Build interactive web apps with the language of the internet',
    longDescription: 'Learn JavaScript from fundamentals through advanced concepts including ES6+, async programming, and DOM manipulation for full-stack web development.',
    icon: '🌐',
    color: 'from-yellow-400 to-orange-400',
    students: 78940,
    rating: 4.9,
    reviews: 2100,
    difficulty: 'Beginner',
    hours: 28,
    prerequisites: [
        'Basic HTML and CSS knowledge',
        'Understanding of variables and functions',
        'A modern web browser and text editor'
    ],
    learningObjectives: [
        'Master JavaScript syntax and semantics',
        'Understand the DOM and event handling',
        'Learn async programming (promises, async/await)',
        'Work with modern ES6+ features',
        'Manage application state effectively',
        'Integrate with APIs and handle HTTP requests'
    ],
    keyTopics: [
        'Variables & Data Types',
        'Functions & Scope',
        'DOM Manipulation',
        'Event Handling',
        'Promises & Async/Await',
        'ES6+ Features',
        'Higher-Order Functions',
        'Error Handling'
    ],
    lessons: [
        {
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
        },
        {
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
        },
        {
            id: 3,
            title: 'DOM Manipulation',
            description: 'Interacting with HTML elements from JavaScript.',
            content: `
## The Document Object Model (DOM)

The DOM is JavaScript's live representation of your entire HTML page as a tree of objects. With it, you can read, modify, add, or delete any HTML element, attribute, or content.

### Selecting Elements:
\`\`\`javascript
// By ID
const header = document.getElementById("main-header");

// By CSS Selector (most flexible!)
const btn = document.querySelector(".submit-btn");

// Select ALL matching elements
const allItems = document.querySelectorAll(".list-item");
\`\`\`

### Manipulating Content & Styles:
\`\`\`javascript
const el = document.querySelector("#message");

el.textContent = "Updated text!"; // Change plain text
el.innerHTML = "<strong>Bold</strong> and normal"; // Change HTML inside

// Style manipulation
el.style.color = "red";
el.style.fontSize = "20px";

// Add/remove CSS classes (better practice than iinline styles)
el.classList.add("highlighted");
el.classList.remove("hidden");
el.classList.toggle("active");
\`\`\`

### Event Listeners:
\`\`\`javascript
const btn = document.querySelector("#myButton");

btn.addEventListener("click", function(event) {
    console.log("Button was clicked!");
    console.log("Element clicked:", event.target);
});

// Common events: 'click', 'keydown', 'mouseover', 'submit', 'change'
document.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
        console.log("Enter was pressed!");
    }
});
\`\`\`

### Creating & Appending Elements:
\`\`\`javascript
const newItem = document.createElement("li");
newItem.textContent = "A brand new item";
newItem.classList.add("list-item");

const list = document.querySelector("#my-list");
list.appendChild(newItem); // Add to the end of the list
\`\`\`
`
        },
        {
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
        },
        {
            id: 5,
            title: 'Promises & Async/Await',
            description: 'Handling asynchronous operations like API calls.',
            content: `
## Asynchronous JavaScript

JavaScript is single-threaded, but can perform async tasks (like fetching data) without blocking the main thread.

### Callbacks (The Old Way):
\`\`\`javascript
// Nested callbacks lead to "Callback Hell"!
fetchUser(id, function(user) {
    fetchPosts(user.id, function(posts) {
        fetchComments(posts[0].id, function(comments) {
            console.log(comments); // 3 levels deep!
        });
    });
});
\`\`\`

### Promises (The Modern Way):
A Promise represents a value that may be available now, in the future, or never.
\`\`\`javascript
fetch("https://api.example.com/users/1")
    .then(response => response.json())
    .then(data => console.log(data.name))
    .catch(error => console.error("Something went wrong:", error));
\`\`\`

### Async/Await (The Best Way):
Async/Await is syntactic sugar over promises — it makes async code look and feel synchronous!
\`\`\`javascript
async function getUser(id) {
    try {
        const response = await fetch("https://api.example.com/users/" + id);
        const user = await response.json();
        console.log(user.name);
    } catch (error) {
        console.error("Failed to fetch:", error);
    }
}

getUser(1);
\`\`\`
- \`async\` marks a function as asynchronous (it always returns a Promise).
- \`await\` pauses execution *inside* that function until the Promise resolves.
`
        }
    ]
};
