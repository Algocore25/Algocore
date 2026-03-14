export const html_cssLesson12 = {
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
};