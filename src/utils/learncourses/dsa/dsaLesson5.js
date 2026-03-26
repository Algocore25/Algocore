export const dsaLesson5 = {
  id: 5,
  title: 'Binary Search',
  description: 'The O(log n) search strategy for sorted data.',
  content: `
## Binary Search

Binary Search is one of the most efficient algorithms in computer science. By splitting the search space in half repeatedly, it finds the target in O(log n) time.

### Basic Implementation:
<COMPILER>
def binary_search(arr, target):
    left, right = 0, len(arr) - 1
    
    while left <= right:
        mid = (left + right) // 2  # Integer midpoint
        
        if arr[mid] == target:
            return mid          # Found!
        elif arr[mid] < target:
            left = mid + 1      # Search right half
        else:
            right = mid - 1     # Search left half
    
    return -1  # Not found

arr = [2, 5, 8, 12, 16, 23, 38, 56, 72, 91]
print(binary_search(arr, 23))  # 5 (index)
print(binary_search(arr, 50))  # -1 (not present)
print(binary_search(arr, 8))   # 2
</COMPILER>

### Finding First and Last Position:
<COMPILER>
def find_first(arr, target):
    left, right = 0, len(arr) - 1
    result = -1
    while left <= right:
        mid = (left + right) // 2
        if arr[mid] == target:
            result = mid
            right = mid - 1  # Keep searching LEFT for earlier occurrences
        elif arr[mid] < target:
            left = mid + 1
        else:
            right = mid - 1
    return result

arr = [5, 7, 7, 8, 8, 10]
target = 8
print("First position of", target, ":", find_first(arr, target))  # 3
</COMPILER>

### Square Root (Binary Search Pattern):
<COMPILER>
def sqrt_floor(n):
    if n < 2: return n
    left, right = 1, n // 2
    while left <= right:
        mid = (left + right) // 2
        if mid * mid == n:
            return mid
        elif mid * mid < n:
            left = mid + 1
        else:
            right = mid - 1
    return right  # Floor of sqrt

print("Square root of 16:", sqrt_floor(16))  # 4
print("Square root of 15:", sqrt_floor(15))  # 3
print("Square root of 2:", sqrt_floor(2))    # 1
</COMPILER>
`
};