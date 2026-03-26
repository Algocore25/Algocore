export const dsaLesson8 = {
  id: 8,
  title: 'Sorting Algorithms',
  description: 'Bubble Sort, Merge Sort, Quick Sort, and more.',
  content: `
## Sorting Algorithms

Sorting is fundamental to CS. Different algorithms have different time complexities, and choosing the right one matters!

### Merge Sort (O(n log n) — Divide & Conquer):
<COMPILER>
def merge_sort(arr):
    if len(arr) <= 1:
        return arr
    
    mid = len(arr) // 2
    left = merge_sort(arr[:mid])
    right = merge_sort(arr[mid:])
    
    return merge(left, right)

def merge(left, right):
    result = []
    i = j = 0
    while i < len(left) and j < len(right):
        if left[i] <= right[j]:
            result.append(left[i])
            i += 1
        else:
            result.append(right[j])
            j += 1
    
    result.extend(left[i:])
    result.extend(right[j:])
    return result

arr = [38, 27, 43, 3, 9, 82, 10]
print("Sorted:", merge_sort(arr))  # [3, 9, 10, 27, 38, 43, 82]
</COMPILER>

### Quick Sort (O(n log n) average — Partition):
<COMPILER>
def quick_sort(arr):
    if len(arr) <= 1:
        return arr
    
    pivot = arr[len(arr) // 2]
    left = [x for x in arr if x < pivot]
    middle = [x for x in arr if x == pivot]
    right = [x for x in arr if x > pivot]
    
    return quick_sort(left) + middle + quick_sort(right)

arr = [38, 27, 43, 3, 9, 82, 10]
print("Sorted:", quick_sort(arr))  # [3, 9, 10, 27, 38, 43, 82]
</COMPILER>

### Bubble Sort (O(n²) — Simple):
<COMPILER>
def bubble_sort(arr):
    n = len(arr)
    for i in range(n):
        swapped = False
        for j in range(0, n - i - 1):
            if arr[j] > arr[j + 1]:
                arr[j], arr[j + 1] = arr[j + 1], arr[j]
                swapped = True
        if not swapped:
            break
    return arr

arr = [38, 27, 43, 3, 9]
print("Sorted:", bubble_sort(arr))  # [3, 9, 27, 38, 43]
</COMPILER>

### Comparison of Sorting Algorithms:

| Algorithm | Best | Average | Worst | Space | Stable |
|---|---|---|---|---|---|
| Bubble Sort | O(n) | O(n²) | O(n²) | O(1) | Yes |
| Merge Sort | O(n log n) | O(n log n) | O(n log n) | O(n) | Yes |
| Quick Sort | O(n log n) | O(n log n) | O(n²) | O(log n) | No |
| Heap Sort | O(n log n) | O(n log n) | O(n log n) | O(1) | No |
`
};