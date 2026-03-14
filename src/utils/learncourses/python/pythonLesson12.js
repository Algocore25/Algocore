export const pythonLesson12 = {
  id: 12,
  title: 'Real-World Interview Questions',
  description: 'Commonly asked interview questions and how to tackle them effectively.',
  difficulty: 'Advanced',
  duration: '20 mins',
  content: `
## Acing the Interview

Interviews test not only your knowledge of syntax but your problem-solving abilities and how well you can communicate your thought process.

### Top Questions

#### 1. "Explain how memory management/variable scoping works in this language."
**How to answer:** Focus on the difference between Stack and Heap memory (if applicable), or differences between global, local, and block scope. Mention garbage collection or manual memory management mechanisms.

#### 2. "How would you optimize a slow-performing function?"
**How to answer:** Mention profiling tools first. You don't guess what's slow; you measure. Then discuss looking at Time Complexity (Big O) of loops, reducing redundant network calls, or adding caching/memoization.

#### 3. "What's the difference between passing by value and passing by reference?"
**How to answer:** Give a concrete example. Explain that passing by value creates a copy, so modifying it inside a function doesn't affect the original. Passing by reference (or pointer) means modifying it *will* mutation the original data structure.

### Practical Advice for Whiteboard/Live Coding:
1. **Clarify the Requirements:** Before writing a single line of code, repeat the question back and ask about edge cases (e.g., "Can the array be empty?", "Are there negative numbers?").
2. **Think Out Loud:** A silent candidate is hard to evaluate. Explain what you're thinking, even if you are stuck.
3. **Start with Brute Force:** It's better to have a slow, working solution than an incomplete, highly-optimized one. Get it working, then optimize.
`
};
