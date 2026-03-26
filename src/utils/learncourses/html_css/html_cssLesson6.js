export const html_cssLesson6 = {
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
};