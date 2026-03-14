export const html_cssLesson10 = {
  id: 10,
  title: 'CSS Pseudo-classes & Pseudo-elements',
  description: 'Targeting special states and adding decorative content.',
  content: `
## Pseudo-classes & Pseudo-elements

### Pseudo-classes (States)
Pseudo-classes target elements in a **specific state** or **position** in the DOM.

\`\`\`css
/* User interaction states */
a:hover    { color: blue; }        /* Mouse over */
a:active   { color: red; }         /* Being clicked */
a:visited  { color: purple; }      /* Already visited */
input:focus { border-color: blue; } /* Has keyboard focus */
button:disabled { opacity: 0.5; }   /* Not interactive */

/* Structural pseudo-classes */
li:first-child     { font-weight: bold; }  /* First li in parent */
li:last-child      { border-bottom: none; }/* Last li in parent */
li:nth-child(2)    { background: #f0f0f0; }/* Exactly 2nd item */
li:nth-child(odd)  { background: #f9f9f9; }/* 1st, 3rd, 5th... */
li:nth-child(even) { background: white; }  /* 2nd, 4th, 6th... */
p:not(.special)    { color: gray; }        /* Every p WITHOUT .special */

/* Form states */
input:valid   { border-color: green; }
input:invalid { border-color: red; }
input:required { border-left: 3px solid blue; }
input:checked + label { font-weight: bold; } /* After a checked checkbox */
\`\`\`

### Pseudo-elements (Virtual Elements)
Pseudo-elements create **virtual elements** — they let you style a part of an element or insert content without adding HTML.

\`\`\`css
/* ::before — insert content BEFORE the element's content */
.button::before {
    content: "→ ";
    color: gold;
}

/* ::after — insert content AFTER the element's content */
.price::after {
    content: " USD";
    font-size: 0.75em;
    color: gray;
}

/* ::first-letter — style just the first letter */
p::first-letter {
    font-size: 2em;
    font-weight: bold;
    float: left;
    color: #3b82f6;
}

/* ::first-line — style just the first line of a block */
p::first-line {
    font-weight: 600;
}

/* ::selection — style text selected by the user */
::selection {
    background: #3b82f6;
    color: white;
}

/* ::placeholder — style iinput placeholder text */
input::placeholder {
    color: #9ca3af;
    font-style: italic;
}
\`\`\`

### Common Pattern: Custom Checkbox using Pseudo-elements:
\`\`\`css
input[type="checkbox"] {
    display: none; /* Hide the default checkbox */
}

input[type="checkbox"] + label::before {
    content: "";
    display: inline-block;
    width: 18px;
    height: 18px;
    border: 2px solid #d1d5db;
    border-radius: 4px;
    margin-right: 8px;
    vertical-align: middle;
}

input[type="checkbox"]:checked + label::before {
    background: #3b82f6;
    border-color: #3b82f6;
    content: "✓";
    color: white;
    text-align: center;
    line-height: 14px;
    font-size: 12px;
}
\`\`\`
`
};