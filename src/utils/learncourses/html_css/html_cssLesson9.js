export const html_cssLesson9 = {
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
};