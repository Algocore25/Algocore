export const dsaLesson1 = {
  id: 1,
  title: 'Time & Space Complexity',
  description: 'Big O notation and analyzing algorithm efficiency.',
  difficulty: 'Beginner',
  duration: '12 mins',
  content: `
## Complexity Analysis & Big O Notation

Before writing efficient code, you need to be able to *measure* its efficiency. Big O notation describes how the runtime or memory usage of an algorithm grows as the input size (n) grows.

### Common Complexities (Best to Worst):

| Notation | Name | Example |
|---|---|---|
| O(1) | Constant | Array index access |
| O(log n) | Logarithmic | Binary Search |
| O(n) | Linear | Loop through array |
| O(n log n) | Linearithmic | Merge Sort |
| O(n²) | Quadratic | Nested loops |
| O(2ⁿ) | Exponential | Recursive Fibonacci |

### O(1) — Constant Time:
<COMPILER>
def get_first(arr):
    return arr[0]  # Always 1 operation regardless of list size

arr = [10, 20, 30, 40, 50]
print(get_first(arr))  # 10
</COMPILER>

### O(n) — Linear Time:
<COMPILER>
def find_max(arr):
    max_val = arr[0]
    for num in arr:       # Loop runs n times
        if num > max_val:
            max_val = num
    return max_val

arr = [5, 12, 3, 45, 2, 19]
print(find_max(arr))  # 45
</COMPILER>

### O(n²) — Quadratic Time:
<COMPILER>
def has_duplicates(arr):
    for i in range(len(arr)):
        for j in range(i + 1, len(arr)):  # Nested loop!
            if arr[i] == arr[j]:
                return True
    return False

arr1 = [1, 2, 3, 4, 5]
arr2 = [1, 2, 3, 2, 5]
print(has_duplicates(arr1))  # False
print(has_duplicates(arr2))  # True
</COMPILER>

### Space Complexity
Space complexity measures how much extra memory the algorithm uses.
<COMPILER>
# O(1) space — no extra memory used proportional to n
def double_in_place(arr):
    for i in range(len(arr)):
        arr[i] *= 2
    return arr

# O(n) space — creates a new array of size n
def double_copy(arr):
    return [x * 2 for x in arr]

arr = [1, 2, 3]
result1 = double_copy(arr)
print(result1)  # [2, 4, 6]
</COMPILER>
`
};