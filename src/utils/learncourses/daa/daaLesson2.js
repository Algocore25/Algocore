export const daaLesson2 = {
  id: 2,
  title: 'Asymptotic Notations',
  description: 'Learn about Big O, Omega, and Theta notations.',
  difficulty: 'Intermediate',
  duration: '20 mins',
  content: `
## Asymptotic Notations
To mathematically bound the behavior of an algorithm, we use asymptotic notations.

### 1. Big O Notation (O)
Represents the **upper bound** of an algorithm's runtime. It describes the worst-case scenario.
- Example: Linear search is O(n), because in the worst case, we check every element.

### 2. Omega Notation (Ω)
Represents the **lower bound** of an algorithm. It describes the best-case scenario.
- Example: The best case for Linear Search is Ω(1) (the first element is the target).

### 3. Theta Notation (Θ)
Represents the **tight bound**. Used when the worst-case and best-case time complexities are asymptotically the same.

### Common Complexities (Fastest to Slowest):
1. **O(1)** - Constant Time
2. **O(log N)** - Logarithmic Time
3. **O(N)** - Linear Time
4. **O(N log N)** - Linearithmic Time
5. **O(N²)** - Quadratic Time
6. **O(2^N)** - Exponential Time
7. **O(N!)** - Factorial Time
`
};
