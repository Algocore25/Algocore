export const html_cssLesson11 = {
  id: 11,
  title: 'CSS Positioning & Z-index',
  description: 'Controlling exactly where elements appear on screen.',
  content: `
## CSS Positioning

The \`position\` property is one of the most powerful—and confusing—CSS properties. It controls how an element is placed in the document flow.

### The 5 Position Values:

**1. \`static\` (Default)**
Normal document flow. Top/left/right/bottom/z-index have no effect.

**2. \`relative\`**
Element stays in normal flow, but you can offset it using top/left/etc. without affecting surrounding elements. Also creates a positioning context for children!
\`\`\`css
.nudged {
    position: relative;
    top: -5px;  /* Moves up 5px from its natural position */
    left: 10px;
}
\`\`\`

**3. \`absolute\`**
Completely removed from normal flow. Positioned relative to the nearest \`relative\`/\`absolute\`/\`fixed\` ancestor.
\`\`\`css
.parent {
    position: relative; /* Makes parent the anchor */
}

.tooltip {
    position: absolute;
    top: 100%;   /* Directly below the parent */
    left: 50%;
    transform: translateX(-50%); /* Center it */
}
\`\`\`

**4. \`fixed\`**
Positioned relative to the **browser viewport**. Stays in place even when scrolling. Perfect for sticky headers, floating buttons.
\`\`\`css
.navbar {
    position: fixed;
    top: 0;
    left: 0;
    right: 0; /* Stretch full width */
    z-index: 1000;
}

.fab-button {
    position: fixed;
    bottom: 24px;
    right: 24px;
}
\`\`\`

**5. \`sticky\`**
A hybrid! Acts like \`relative\` until you scroll past a threshold, then it "sticks" like \`fixed\`.
\`\`\`css
.table-header {
    position: sticky;
    top: 0; /* Sticks when scrolled to the top of the viewport */
    background: white;
    z-index: 10;
}
\`\`\`

### Z-index (Stacking Order):
\`z-index\` controls which element appears on top when elements overlap. **Higher z-index = on top**. Only works on positioned elements (not \`static\`).
\`\`\`css
.backdrop  { z-index: 100; }  /* Modal overlay */
.modal     { z-index: 200; }  /* Above overlay */
.dropdown  { z-index: 300; }  /* Above modal */
.tooltip   { z-index: 400; }  /* Highest */
\`\`\`
`
};