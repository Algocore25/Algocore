export const javascriptLesson3 = {
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
};