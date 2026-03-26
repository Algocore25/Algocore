export const dsaLesson2 = {
  id: 2,
  title: 'Arrays & Hashing',
  description: 'Solving problems with arrays and hash maps efficiently.',
  content: `
## Arrays & Hash Maps

Arrays and Hash Maps (Dictionaries) are the most frequently used data structures in coding interviews.

### Two Sum Problem (Classic Interview Question!)
Given an array, find two numbers that add up to a target.

<COMPILER>
# Brute Force: O(n²) — check every pair
def two_sum_brute(nums, target):
    for i in range(len(nums)):
        for j in range(i + 1, len(nums)):
            if nums[i] + nums[j] == target:
                return [i, j]
    return []

nums = [2, 7, 11, 15]
target = 9
print(two_sum_brute(nums, target))  # [0, 1]
</COMPILER>

### Optimal Solution with Hash Map:
<COMPILER>
# Optimal: O(n) — use a hash map to store complements
def two_sum(nums, target):
    seen = {}  # value -> index
    for i, num in enumerate(nums):
        complement = target - num
        if complement in seen:
            return [seen[complement], i]
        seen[num] = i
    return []

nums = [2, 7, 11, 15]
target = 9
print(two_sum(nums, target))  # [0, 1]
</COMPILER>

### Sliding Window Technique:
<COMPILER>
# Find max sum of subarray of size k
def max_subarray_sum(arr, k):
    window_sum = sum(arr[:k])
    max_sum = window_sum
    
    for i in range(k, len(arr)):
        window_sum += arr[i] - arr[i - k]  # Add new, remove old
        max_sum = max(max_sum, window_sum)
    
    return max_sum

arr = [1, 4, 2, 10, 2, 3, 1, 0, 20]
k = 4
print(max_subarray_sum(arr, k))  # 24
</COMPILER>

### Two Pointers:
<COMPILER>
def has_pair_with_sum(arr, target):
    arr.sort()
    left, right = 0, len(arr) - 1
    while left < right:
        current = arr[left] + arr[right]
        if current == target:
            return True
        elif current < target:
            left += 1
        else:
            right -= 1
    return False

arr = [2, 5, 8, 12, 16, 23]
target = 18
print(has_pair_with_sum(arr, target))  # True (5 + 13? No, 2 + 16)
</COMPILER>
`
};