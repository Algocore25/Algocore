export const html_cssLesson1 = {
  id: 1,
  title: 'HTML Fundamentals',
  description: 'Tags, attributes, and the structure of the web.',
  difficulty: 'Beginner',
  duration: '6 mins',
  content: `
## HTML: The Skeleton of the Web

HTML (HyperText Markup Language) is the structure and content layer of every web page. It uses **tags** to define different types of content.

### Anatomy of an HTML Page:
\`\`\`html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>My First Webpage</title>
</head>
<body>
    <h1>Welcome to My Site</h1>
    <p>This is my first webpage!</p>
</body>
</html>
\`\`\`

### Headings, Paragraphs & Text:
\`\`\`html
<h1>Main Heading (Biggest)</h1>
<h2>Sub-heading</h2>
<h3>Smaller Sub-heading</h3>
<p>This is a paragraph of text.</p>
<p>This has <strong>bold</strong> and <em>italic</em> text.</p>
\`\`\`

### Links and Images:
\`\`\`html
<!-- Anchor tag for links -->
<a href="https://www.google.com" target="_blank">Go to Google</a>

<!-- Image tag (self-closing!) -->
<img src="photo.jpg" alt="A descriptive text for screen readers" width="400">
\`\`\`

### Lists:
\`\`\`html
<!-- Unordered (bullet) list -->
<ul>
    <li>Apples</li>
    <li>Bananas</li>
</ul>

<!-- Ordered (numbered) list -->
<ol>
    <li>Wake up</li>
    <li>Code something cool</li>
    <li>Share it with the world</li>
</ol>
\`\`\`
`
};