export const dsaLesson9 = {
  id: 9,
  title: 'Dynamic Programming Basics',
  description: 'Overlapping subproblems, memoization, and tabulation.',
  content: `
## Dynamic Programming

Dynamic Programming solves problems by breaking them into overlapping subproblems and storing results to avoid recomputation.

### Fibonacci Sequence - The Classic DP Problem:
<COMPILER>
# Naive Recursive (Very Slow! O(2^n))
def fib_naive(n):
    if n <= 1:
        return n
    return fib_naive(n - 1) + fib_naive(n - 2)

# Memoization (O(n))
def fib_memo(n, memo=None):
    if memo is None:
        memo = {}
    if n in memo:
        return memo[n]
    if n <= 1:
        return n
    memo[n] = fib_memo(n - 1, memo) + fib_memo(n - 2, memo)
    return memo[n]

print("Fib(5) Memo:", fib_memo(5))   # 5
print("Fib(10) Memo:", fib_memo(10)) # 55
</COMPILER>

### Tabulation Approach (Bottom-Up):
<COMPILER>
def fib_tab(n):
    if n <= 1:
        return n
    
    dp = [0] * (n + 1)
    dp[1] = 1
    
    for i in range(2, n + 1):
        dp[i] = dp[i - 1] + dp[i - 2]
    
    return dp[n]

print("Fib(6) Tab:", fib_tab(6))    # 8
print("Fib(7) Tab:", fib_tab(7))    # 13
</COMPILER>

### Climbing Stairs Problem:
<COMPILER>
# You can climb 1 or 2 steps at a time. How many ways to reach n steps?
def climb_stairs(n):
    if n <= 2:
        return n
    
    dp = [0] * (n + 1)
    dp[1] = 1
    dp[2] = 2
    
    for i in range(3, n + 1):
        dp[i] = dp[i - 1] + dp[i - 2]
    
    return dp[n]

print("Ways to climb 3 steps:", climb_stairs(3))   # 3
print("Ways to climb 4 steps:", climb_stairs(4))   # 5
print("Ways to climb 5 steps:", climb_stairs(5))   # 8
</COMPILER>

### Maximum Subarray Sum (Kadane's Algorithm):
<COMPILER>
def max_subarray_sum(arr):
    max_sum = current_sum = arr[0]
    
    for i in range(1, len(arr)):
        current_sum = max(arr[i], current_sum + arr[i])
        max_sum = max(max_sum, current_sum)
    
    return max_sum

arr = [-2, 1, -3, 4, -1, 2, 1, -5, 4]
print("Max subarray sum:", max_subarray_sum(arr))  # 6 (subarray [4, -1, 2, 1])
</COMPILER>
`
};