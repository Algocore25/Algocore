export const html_css = {
    id: 'html_css',
    name: 'HTML & CSS Fundamentals',
    description: 'Build and style modern web pages from scratch',
    longDescription: 'Comprehensive guide to HTML5 and modern CSS3 covering semantic markup, responsive design, and professional web styling techniques.',
    icon: '🎨',
    color: 'from-pink-400 to-rose-500',
    students: 91200,
    rating: 4.7,
    reviews: 2400,
    difficulty: 'Beginner',
    hours: 11,
    prerequisites: [
        'Basic computer literacy',
        'Understanding of web browsers',
        'A text editor (VS Code, Sublime, etc.)'
    ],
    learningObjectives: [
        'Master semantic HTML5 markup',
        'Create responsive and flexible layouts with CSS',
        'Understand CSS Grid and Flexbox',
        'Implement modern design patterns',
        'Optimize websites for performance',
        'Build accessible and SEO-friendly pages'
    ],
    keyTopics: [
        'HTML5 Semantic Elements',
        'Forms & Validation',
        'CSS Selectors & Specificity',
        'Box Model',
        'Flexbox Layout',
        'Grid Layout',
        'Responsive Design',
        'Animations & Transitions'
    ],
    lessons: [
        {
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
        },
        {
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
        },
        {
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
        },
        {
            id: 4,
            title: 'HTML Forms & Inputs',
            description: 'Collecting user data with forms, inputs, and validation.',
            content: `
## HTML Forms

Forms are how web pages collect information from users — from login screens to search bars to checkout pages.

### Basic Form Structure:
\`\`\`html
<form action="/submit" method="POST">
    <!-- Text input -->
    <label for="username">Username:</label>
    <input type="text" id="username" name="username" placeholder="Enter username" required>
    
    <!-- Password input -->
    <label for="password">Password:</label>
    <input type="password" id="password" name="password" required>
    
    <!-- Submit button -->
    <button type="submit">Login</button>
</form>
\`\`\`

### All Common Input Types:
\`\`\`html
<!-- Text -->
<input type="text" placeholder="Your name">

<!-- Email (validates @ format automatically!) -->
<input type="email" placeholder="you@example.com">

<!-- Number with min/max -->
<input type="number" min="0" max="100" step="5">

<!-- Date picker -->
<input type="date">

<!-- Checkbox (multi-select) -->
<input type="checkbox" id="terms" name="terms">
<label for="terms">I agree to the Terms</label>

<!-- Radio buttons (single select from group) -->
<input type="radio" id="male" name="gender" value="male">
<label for="male">Male</label>
<input type="radio" id="female" name="gender" value="female">
<label for="female">Female</label>

<!-- Dropdown / Select -->
<select name="city">
    <option value="">-- Select City --</option>
    <option value="delhi">New Delhi</option>
    <option value="mumbai">Mumbai</option>
</select>

<!-- Multi-line text -->
<textarea name="message" rows="5" cols="40" placeholder="Your message..."></textarea>

<!-- File upload -->
<input type="file" accept=".jpg, .png">

<!-- Range slider -->
<input type="range" min="0" max="100" value="50">
\`\`\`

### Form Validation Attributes:
\`\`\`html
<!-- required: field cannot be empty -->
<input type="text" required>

<!-- minlength / maxlength -->
<input type="text" minlength="3" maxlength="15">

<!-- pattern: custom regex -->
<input type="text" pattern="[A-Za-z]+" title="Letters only">

<!-- min / max for numbers and dates -->
<input type="number" min="18" max="99">
\`\`\`
`
        },
        {
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
        },
        {
            id: 6,
            title: 'Responsive Design & Media Queries',
            description: 'Building websites that adapt to any screen size.',
            content: `
## Responsive Web Design

Responsive design ensures your website looks great on all devices — from a tiny phone to a large 4K monitor.

### The Viewport Meta Tag (Required!):
Always add this to every HTML page. Without it, mobile browsers zoom out to show the desktop version.
\`\`\`html
<meta name="viewport" content="width=device-width, initial-scale=1.0">
\`\`\`

### CSS Media Queries:
Media queries apply CSS rules only when certain conditions (like screen width) are met.
\`\`\`css
/* Base styles (for mobile first!) */
.container {
    padding: 16px;
    font-size: 14px;
}

/* Tablet: screens ≥ 768px */
@media (min-width: 768px) {
    .container {
        padding: 24px;
        font-size: 16px;
    }
}

/* Desktop: screens ≥ 1024px */
@media (min-width: 1024px) {
    .container {
        max-width: 1200px;
        margin: 0 auto;
        padding: 32px;
    }
}

/* Landscape orientation */
@media (orientation: landscape) {
    .hero { height: 60vh; }
}

/* High-resolution displays (Retina) */
@media (-webkit-min-device-pixel-ratio: 2) {
    .logo { background-image: url('logo@2x.png'); }
}
\`\`\`

### Common Breakpoints (Industry Standard):
| Breakpoint | Min Width | Device |
|---|---|---|
| Mobile (default) | 0px | Phones |
| sm | 640px | Large phones |
| md | 768px | Tablets |
| lg | 1024px | Laptops |
| xl | 1280px | Desktops |
| 2xl | 1536px | Large monitors |

### Responsive Grid with Auto-Fill:
\`\`\`css
.card-grid {
    display: grid;
    /* Automatically creates as many columns as fit, min 280px each */
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
    gap: 24px;
}
\`\`\`

### Fluid Typography with \`clamp()\`:
\`\`\`css
/* Font size: min 1rem, scales with viewport, max 2rem */
h1 {
    font-size: clamp(1rem, 3vw, 2rem);
}
\`\`\`
`
        },
        {
            id: 7,
            title: 'CSS Animations & Transitions',
            description: 'Bringing web pages to life with motion and effects.',
            content: `
## CSS Animations & Transitions

Animations make websites feel modern, alive, and polished. CSS gives you two tools: **transitions** (simple A → B) and **animations** (keyframe-based).

### CSS Transitions (Simple State Changes):
Transitions smoothly animate changes triggered by events like hover.
\`\`\`css
.button {
    background: #3b82f6;
    color: white;
    padding: 12px 24px;
    border-radius: 8px;
    border: none;
    
    /* Define what and how to transition */
    transition: background 0.3s ease, transform 0.2s ease;
}

.button:hover {
    background: #1d4ed8;    /* New color — smoothly animated! */
    transform: translateY(-2px);  /* Lifts up */
}

.button:active {
    transform: scale(0.97);  /* Press effect */
}
\`\`\`

### Transition Timing Functions:
\`\`\`css
transition: all 0.3s linear;         /* Constant speed */
transition: all 0.3s ease;           /* Smooth (default) */
transition: all 0.3s ease-in;        /* Starts slow */
transition: all 0.3s ease-out;       /* Ends slow */
transition: all 0.3s ease-in-out;    /* Starts & ends slow */
transition: all 0.4s cubic-bezier(0.68, -0.55, 0.265, 1.55); /* Bounce! */
\`\`\`

### CSS Keyframe Animations:
For more complex, multi-step animations, use \`@keyframes\`.
\`\`\`css
/* Define the animation */
@keyframes fadeInUp {
    from {
        opacity: 0;
        transform: translateY(30px);
    }
    to {
        opacity: 1;
        transform: translateY(0);
    }
}

/* Apply the animation */
.hero-text {
    animation: fadeInUp 0.8s ease-out forwards;
}

/* Multi-step animation */
@keyframes pulse {
    0%   { transform: scale(1); }
    50%  { transform: scale(1.05); }
    100% { transform: scale(1); }
}

.badge {
    animation: pulse 2s ease-in-out infinite;
}
\`\`\`

### Animation Properties:
\`\`\`css
.element {
    animation-name: fadeInUp;
    animation-duration: 0.8s;
    animation-timing-function: ease-out;
    animation-delay: 0.2s;        /* Wait before starting */
    animation-iteration-count: 1; /* or 'infinite' */
    animation-fill-mode: forwards; /* Keep final state */
    
    /* Shorthand */
    animation: fadeInUp 0.8s ease-out 0.2s 1 forwards;
}
\`\`\`
`
        },
        {
            id: 8,
            title: 'CSS Variables & Custom Properties',
            description: 'Building scalable design systems with CSS custom properties.',
            content: `
## CSS Custom Properties (Variables)

CSS Variables (officially called Custom Properties) let you define reusable values in one place and reference them throughout your stylesheet. They're the backbone of any professional design system.

### Defining and Using Variables:
\`\`\`css
/* Variables are typically defined on the :root pseudo-class
   so they are globally accessible */
:root {
    /* Colors */
    --color-primary: #3b82f6;
    --color-primary-dark: #1d4ed8;
    --color-text: #1f2937;
    --color-text-muted: #6b7280;
    --color-bg: #ffffff;
    --color-bg-secondary: #f9fafb;
    --color-border: #e5e7eb;
    
    /* Spacing */
    --spacing-sm: 8px;
    --spacing-md: 16px;
    --spacing-lg: 24px;
    --spacing-xl: 32px;
    
    /* Typography */
    --font-size-sm: 0.875rem;
    --font-size-base: 1rem;
    --font-size-lg: 1.25rem;
    --font-size-xl: 1.5rem;
    
    /* Shadows */
    --shadow-sm: 0 1px 2px rgba(0,0,0,0.05);
    --shadow-md: 0 4px 6px rgba(0,0,0,0.07);
    --shadow-lg: 0 10px 25px rgba(0,0,0,0.1);
    
    /* Border Radius */
    --radius-sm: 4px;
    --radius-md: 8px;
    --radius-lg: 16px;
    --radius-full: 9999px;
}

/* Use the variable with var() */
.button {
    background: var(--color-primary);
    color: white;
    padding: var(--spacing-sm) var(--spacing-md);
    border-radius: var(--radius-md);
    box-shadow: var(--shadow-md);
    font-size: var(--font-size-base);
}

.button:hover {
    background: var(--color-primary-dark);
}
\`\`\`

### Dark Mode with CSS Variables:
\`\`\`css
:root {
    --bg: #ffffff;
    --text: #1f2937;
    --card-bg: #f9fafb;
}

/* Override variables for dark mode */
[data-theme="dark"],
@media (prefers-color-scheme: dark) {
    :root {
        --bg: #0f172a;
        --text: #e2e8f0;
        --card-bg: #1e293b;
    }
}

body {
    background: var(--bg);
    color: var(--text);
    transition: background 0.3s, color 0.3s;
}

.card {
    background: var(--card-bg);
}
\`\`\`
`
        },
        {
            id: 9,
            title: 'Semantic HTML & Accessibility',
            description: 'Writing meaningful HTML that helps users and search engines.',
            content: `
## Semantic HTML & Web Accessibility

Semantic HTML uses elements that clearly describe their purpose — not just their appearance. This helps screen readers, SEO crawlers, and other developers understand your page structure.

### Semantic vs Non-Semantic:
\`\`\`html
<!-- ❌ Non-Semantic (using div for everything) -->
<div class="header">
    <div class="nav">
        <div class="nav-link">Home</div>
    </div>
</div>
<div class="main">
    <div class="article">
        <div class="article-heading">Title</div>
    </div>
</div>

<!-- ✅ Semantic (descriptive tags) -->
<header>
    <nav>
        <a href="/">Home</a>
    </nav>
</header>
<main>
    <article>
        <h1>Title</h1>
    </article>
</main>
\`\`\`

### Key Semantic Elements:
\`\`\`html
<header>    <!-- Site/section header, logo, and nav -->
<nav>       <!-- Navigation links -->
<main>      <!-- Primary content of the page (only one per page) -->
<article>   <!-- Self-contained content (a blog post, a news story) -->
<section>   <!-- Generic section with a heading -->
<aside>     <!-- Sidebar or supplementary content -->
<footer>    <!-- Site/section footer, copyright, links -->
<figure>    <!-- Images, diagrams, charts with optional caption -->
<figcaption><!-- Caption for a <figure> -->
<time datetime="2024-01-15">January 15, 2024</time>
<address>   <!-- Contact information -->
<mark>      <!-- Highlighted text -->
<abbr title="HyperText Markup Language">HTML</abbr>
\`\`\`

### Accessibility (A11y) Best Practices:

**1. Alt Text for Images:**
\`\`\`html
<!-- ✅ Descriptive alt text -->
<img src="dog.jpg" alt="A golden retriever playing fetch in a park">

<!-- For decorative images, use empty alt so screen readers skip it -->
<img src="pattern.svg" alt="">
\`\`\`

**2. ARIA Attributes:**
\`\`\`html
<!-- role: describes the element's purpose when semantic HTML isn't enough -->
<div role="button" tabindex="0" onclick="submit()">Submit</div>

<!-- aria-label: label for screen readers -->
<button aria-label="Close dialog">✕</button>

<!-- aria-expanded: for toggles like menus -->
<button aria-expanded="false" aria-controls="dropdown-menu">
    Menu
</button>

<!-- aria-live: announces dynamic changes to screen readers -->
<div aria-live="polite" id="status-message"></div>
\`\`\`

**3. Keyboard Navigation:**
\`\`\`css
/* Never remove focus outline — keyboard users need it! */
:focus-visible {
    outline: 3px solid #3b82f6;
    outline-offset: 2px;
}
\`\`\`
`
        },
        {
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
        },
        {
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
        },
        {
            id: 12,
            title: 'Building a Complete Web Page',
            description: 'Bringing everything together to build a modern professional page.',
            content: `
## Putting It All Together

Let's build a complete, modern web page structure using all the concepts covered in this course.

### Full Page Structure:
\`\`\`html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="description" content="Algocore - Learn Programming Fast">
    <title>Algocore | Learn Programming</title>
    <link rel="stylesheet" href="styles.css">
</head>
<body>
    <!-- Sticky Navigation -->
    <header>
        <nav class="navbar">
            <a href="/" class="logo">Algocore</a>
            <ul class="nav-links">
                <li><a href="#courses">Courses</a></li>
                <li><a href="#about">About</a></li>
                <li><a href="/login" class="btn">Login</a></li>
            </ul>
        </nav>
    </header>

    <!-- Hero Section -->
    <main>
        <section class="hero">
            <h1>Learn Programming Fast</h1>
            <p>Master Java, Python, C++, and more with hands-on exercises.</p>
            <a href="#courses" class="btn btn-primary">Start Learning →</a>
        </section>

        <!-- Courses Grid -->
        <section id="courses">
            <h2>Popular Courses</h2>
            <div class="courses-grid">
                <article class="course-card">
                    <h3>Java</h3>
                    <p>Learn Java from basics to OOP.</p>
                    <a href="/learn/java">Start Course</a>
                </article>
                <!-- More cards... -->
            </div>
        </section>
    </main>

    <footer>
        <p>&copy; 2024 Algocore. All rights reserved.</p>
    </footer>
</body>
</html>
\`\`\`

### Complete CSS for the Page:
\`\`\`css
/* ===== CSS Variables (Design System) ===== */
:root {
    --primary: #3b82f6;
    --primary-dark: #1d4ed8;
    --text: #1f2937;
    --text-muted: #6b7280;
    --bg: #ffffff;
    --bg-gray: #f9fafb;
    --border: #e5e7eb;
    --radius: 12px;
    --shadow: 0 4px 16px rgba(0,0,0,0.08);
    --transition: all 0.25s ease;
}

/* ===== Reset ===== */
*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
body { font-family: 'Inter', sans-serif; color: var(--text); background: var(--bg); line-height: 1.6; }
a { text-decoration: none; color: inherit; }

/* ===== Navbar ===== */
.navbar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 16px 32px;
    position: sticky;
    top: 0;
    background: rgba(255,255,255,0.9);
    backdrop-filter: blur(12px);
    border-bottom: 1px solid var(--border);
    z-index: 100;
}

.logo { font-size: 1.5rem; font-weight: 800; color: var(--primary); }

.nav-links { display: flex; list-style: none; gap: 32px; align-items: center; }
.nav-links a { color: var(--text-muted); font-weight: 500; transition: var(--transition); }
.nav-links a:hover { color: var(--primary); }

/* ===== Hero ===== */
.hero {
    text-align: center;
    padding: 100px 24px;
    background: linear-gradient(135deg, #eff6ff, #f0fdf4);
}

.hero h1 { font-size: clamp(2rem, 5vw, 4rem); font-weight: 900; margin-bottom: 16px; }
.hero p  { font-size: 1.25rem; color: var(--text-muted); margin-bottom: 32px; }

/* ===== Buttons ===== */
.btn {
    display: inline-block;
    padding: 12px 24px;
    border-radius: 8px;
    font-weight: 600;
    transition: var(--transition);
}

.btn-primary {
    background: var(--primary);
    color: white;
}

.btn-primary:hover {
    background: var(--primary-dark);
    transform: translateY(-2px);
    box-shadow: 0 8px 20px rgba(59,130,246,0.3);
}

/* ===== Courses Grid ===== */
.courses-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
    gap: 24px;
    padding: 24px;
    max-width: 1200px;
    margin: 0 auto;
}

.course-card {
    background: white;
    border: 1px solid var(--border);
    border-radius: var(--radius);
    padding: 24px;
    box-shadow: var(--shadow);
    transition: var(--transition);
}

.course-card:hover {
    transform: translateY(-4px);
    box-shadow: 0 12px 30px rgba(0,0,0,0.12);
}

/* ===== Responsive ===== */
@media (max-width: 768px) {
    .navbar { padding: 12px 16px; }
    .nav-links { gap: 16px; }
    .hero { padding: 60px 16px; }
}
\`\`\`
`
        }
    ]
};
