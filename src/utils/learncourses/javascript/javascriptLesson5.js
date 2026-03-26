export const javascriptLesson5 = {
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
};