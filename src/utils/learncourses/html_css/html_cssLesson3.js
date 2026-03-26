export const html_cssLesson3 = {
  id: 3,
  title: 'Flexbox Layout',
  description: 'Building flexible one-dimensional layouts with ease.',
  content: `
## CSS Flexbox

Flexbox is a layout model that makes it incredibly easy to align and distribute space among items in a container, even when their size is unknown.

### Enabling Flexbox:
\`\`\`css
.container {
    display: flex;    /* Makes this a flex container */
}
\`\`\`

### Main Axis Alignment (justify-content):
Controls alignment along the **main axis** (horizontal by default).
\`\`\`css
.container {
    display: flex;
    justify-content: flex-start;    /* Default: items at start */
    justify-content: flex-end;      /* Items at end */
    justify-content: center;        /* Items centered */
    justify-content: space-between; /* Even space BETWEEN items */
    justify-content: space-around;  /* Even space AROUND items */
}
\`\`\`

### Cross Axis Alignment (align-items):
Controls alignment along the **cross axis** (vertical by default).
\`\`\`css
.container {
    display: flex;
    align-items: stretch;     /* Default: fill height */
    align-items: center;      /* Vertical center */
    align-items: flex-start;  /* Align to top */
    align-items: flex-end;    /* Align to bottom */
}
\`\`\`

### Flex Direction & Wrap:
\`\`\`css
.container {
    display: flex;
    flex-direction: row;         /* Default: horizontal */
    flex-direction: column;      /* Vertical layout */
    
    flex-wrap: nowrap;  /* Default: single line */
    flex-wrap: wrap;    /* Wrap to next line when needed */
}

/* Child item sizing */
.item {
    flex: 1; /* Each item takes equal space */
}
\`\`\`
`
};