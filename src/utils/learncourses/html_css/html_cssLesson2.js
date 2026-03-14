export const html_cssLesson2 = {
  id: 2,
  title: 'CSS Selectors & Properties',
  description: 'Styling HTML elements with colors, fonts, and spacing.',
  content: `
## CSS: Making the Web Beautiful

CSS (Cascading Style Sheets) adds visual styling to the HTML structure.

### Connecting CSS to HTML:
\`\`\`html
<!-- Method 1: External stylesheet (Best practice!) -->
<link rel="stylesheet" href="styles.css">

<!-- Method 2: Internal style block -->
<style>
  h1 { color: red; }
</style>

<!-- Method 3: Inline styles (Avoid — hard to maintain) -->
<p style="color: blue; font-size: 18px;">Inline styled paragraph</p>
\`\`\`

### CSS Selectors:
\`\`\`css
/* Element selector */
p { color: gray; }

/* Class selector */
.card { background: white; border-radius: 8px; }

/* ID selector (unique per page) */
#main-header { font-size: 2rem; }

/* Descendant selector */
.card p { margin-bottom: 10px; }

/* Pseudo-class (apply style on state) */
a:hover { color: blue; text-decoration: underline; }
button:disabled { opacity: 0.5; cursor: not-allowed; }
\`\`\`

### The Box Model:
Every HTML element is a rectangular box with: Content, Padding, Border, and Margin.
\`\`\`css
.box {
    /* Content */
    width: 200px;
    height: 100px;
    
    /* Padding: space inside the border */
    padding: 16px;
    
    /* Border */
    border: 2px solid #333;
    border-radius: 8px;
    
    /* Margin: space outside the border */
    margin: 20px auto; /* auto = center horizontally */
}
\`\`\`
`
};