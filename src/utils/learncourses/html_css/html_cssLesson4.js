export const html_cssLesson4 = {
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
};