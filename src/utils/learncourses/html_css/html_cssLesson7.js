export const html_cssLesson7 = {
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
};