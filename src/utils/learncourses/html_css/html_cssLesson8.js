export const html_cssLesson8 = {
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
};