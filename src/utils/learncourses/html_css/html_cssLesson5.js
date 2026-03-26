export const html_cssLesson5 = {
  id: 5,
  title: 'CSS Grid Layout',
  description: 'Building complex two-dimensional page layouts.',
  content: `
## CSS Grid

While Flexbox is great for 1D layouts (a single row or column), CSS Grid is designed for **2D layouts** — both rows AND columns at the same time. It's perfect for building complex page structures.

### Enabling Grid:
\`\`\`css
.container {
    display: grid;
    
    /* Define 3 columns */
    grid-template-columns: 200px 1fr 200px;
    
    /* Define 2 rows */
    grid-template-rows: 80px auto 60px;
    
    /* Gap between cells */
    gap: 20px; /* or row-gap / column-gap separately */
}
\`\`\`

### The \`fr\` Unit (Fraction):
\`fr\` represents a fraction of the available space — the most powerful part of Grid!
\`\`\`css
/* 3 equal columns */
grid-template-columns: 1fr 1fr 1fr;

/* Or shorthand using repeat() */
grid-template-columns: repeat(3, 1fr);

/* Sidebar + main + sidebar layout */
grid-template-columns: 250px 1fr 250px;

/* Auto-fill: fit as many columns as possible */
grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
\`\`\`

### Placing Items on the Grid:
\`\`\`css
.header {
    /* Span the entire first row across all 3 columns */
    grid-column: 1 / 4;   /* from line 1 to line 4 */
    grid-row: 1 / 2;
}

.sidebar {
    grid-column: 1 / 2;
    grid-row: 2 / 3;
}

.main-content {
    grid-column: 2 / 3;
    grid-row: 2 / 3;
}

.footer {
    grid-column: 1 / 4;  /* Full width footer */
    grid-row: 3 / 4;
}
\`\`\`

### Named Grid Areas (Cleanest approach!):
\`\`\`css
.container {
    display: grid;
    grid-template-columns: 200px 1fr;
    grid-template-rows: 80px 1fr 60px;
    grid-template-areas:
        "header  header"
        "sidebar content"
        "footer  footer";
}

.header  { grid-area: header; }
.sidebar { grid-area: sidebar; }
.content { grid-area: content; }
.footer  { grid-area: footer; }
\`\`\`
`
};