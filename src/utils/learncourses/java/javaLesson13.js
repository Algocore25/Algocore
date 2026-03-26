export const javaLesson13 = {
  id: 13,
  title: 'Best Practices & Common Pitfalls',
  description: 'Learn how to write clean, efficient, and professional code.',
  difficulty: 'Intermediate',
  duration: '15 mins',
  content: `
## Best Practices in JAVA

Writing code is easy, but writing **maintainable, efficient, and clean** code is a skill that separates junior developers from seniors. Here are some of the most critical best practices.

### 1. Meaningful Naming Conventions
- Avoid single-letter variables (except for loop counters).
- Use descriptive names: \`calculateTotalPrice()\` is better than \`calc()\`.
- Follow the standard casing conventions for this language (e.g., camelCase, snake_case).

### 2. Don't Repeat Yourself (DRY)
- If you find yourself copying and pasting the same chunk of code more than twice, extract it into a function or a shared utility.
- DRY reduces the chance of bugs when logic needs to be updated.

### 3. Keep Functions Small and Focused
- A function should do **one thing** and do it well (Single Responsibility Principle).
- If a function is longer than 50 lines, consider breaking it down into smaller helper functions.

### 4. Error Handling
- Never assume the "happy path" will always happen.
- Validate inputs, handle null/undefined gracefully, and use try-catch/error-checking blocks where appropriate.

## Common Pitfalls to Avoid
1. **Premature Optimization**: Don't try to make your code lightning fast before you know it works. "Make it work, make it right, make it fast."
2. **Hardcoding Values**: Avoid "magic numbers" in your code. Extract them as named constants.
3. **Ignoring Edge Cases**: Always test with empty arrays, null values, negative numbers, and extremely large inputs.
`
};
