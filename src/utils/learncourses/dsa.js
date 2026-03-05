export const dsa = {
    id: 'dsa',
    name: 'Data Structures & Algorithms',
    description: 'Master Data Structures & Algorithms for coding interviews',
    longDescription: 'A comprehensive course on fundamental data structures and algorithms. Learn how to analyze algorithm efficiency, implement essential data structures, and solve complex problems using optimal approaches.',
    icon: '🧩',
    color: 'from-violet-500 to-purple-600',
    students: 52000,
    rating: 4.8,
    reviews: 1680,
    difficulty: 'Intermediate',
    hours: 30,
    prerequisites: [
        'Basic programming knowledge (loops, functions, arrays)',
        'Understanding of variables and data types',
        'Comfort with basic algorithms'
    ],
    learningObjectives: [
        'Understand time and space complexity analysis using Big O notation',
        'Master essential data structures (arrays, linked lists, stacks, queues, trees, graphs)',
        'Learn and implement classic algorithms (sorting, searching, dynamic programming)',
        'Develop problem-solving strategies for coding interviews',
        'Optimize solutions for performance and scalability'
    ],
    keyTopics: [
        'Complexity Analysis',
        'Arrays & Hashing',
        'Linked Lists',
        'Stacks & Queues',
        'Trees & Graphs',
        'Sorting & Searching',
        'Dynamic Programming',
        'Recursion & Backtracking'
    ],
    lessons: [
        {
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
        },
        {
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
        },
        {
            id: 3,
            title: 'Linked Lists',
            description: 'Building and traversing singly and doubly linked lists.',
            content: `
## Linked Lists

A Linked List is a linear data structure where elements (nodes) are stored in separate memory locations, each node holding a value and a pointer to the next node.

### Node & LinkedList Setup:
<COMPILER>
class Node:
    def __init__(self, val):
        self.val = val
        self.next = None

class LinkedList:
    def __init__(self):
        self.head = None

    def append(self, val):
        new_node = Node(val)
        if not self.head:
            self.head = new_node
            return
        current = self.head
        while current.next:  # Traverse to the tail
            current = current.next
        current.next = new_node

    def display(self):
        result = []
        current = self.head
        while current:
            result.append(str(current.val))
            current = current.next
        return " -> ".join(result)

ll = LinkedList()
ll.append(1)
ll.append(2)
ll.append(3)
print(ll.display())  # 1 -> 2 -> 3
</COMPILER>

### Reversing a Linked List (Interview Classic!):
<COMPILER>
class Node:
    def __init__(self, val):
        self.val = val
        self.next = None

def reverse_list(head):
    prev = None
    current = head
    while current:
        next_node = current.next  # Save next
        current.next = prev       # Reverse pointer
        prev = current            # Move prev forward
        current = next_node       # Move current forward
    return prev  # prev is now the new head

def display(head):
    result = []
    while head:
        result.append(str(head.val))
        head = head.next
    return " -> ".join(result)

# Create list: 1 -> 2 -> 3
head = Node(1)
head.next = Node(2)
head.next.next = Node(3)
print("Original:", display(head))
head = reverse_list(head)
print("Reversed:", display(head))
</COMPILER>

### Detect a Cycle (Floyd's Algorithm):
<COMPILER>
class Node:
    def __init__(self, val):
        self.val = val
        self.next = None

def has_cycle(head):
    slow = head
    fast = head
    while fast and fast.next:
        slow = slow.next       # Moves 1 step
        fast = fast.next.next  # Moves 2 steps
        if slow == fast:       # They meet only if there's a cycle
            return True
    return False

# Create list: 1 -> 2 -> 3 -> 2 (cycle)
head = Node(1)
node2 = Node(2)
node3 = Node(3)
head.next = node2
node2.next = node3
node3.next = node2  # Create cycle

print("Has cycle:", has_cycle(head))  # True
</COMPILER>
`
        },
        {
            id: 4,
            title: 'Stacks & Queues',
            description: 'LIFO and FIFO structures and their applications.',
            content: `
## Stacks & Queues

### Stacks (LIFO — Last In, First Out)
Like a stack of plates — you can only add/remove from the top. Used for undo operations, parsing expressions, and backtracking (DFS).

<COMPILER>
stack = []

# Push (add to top)
stack.append(1)
stack.append(2)
stack.append(3)
print("Stack after pushes:", stack)

# Pop (remove from top)
top = stack.pop()  # 3
print("Popped:", top)
print("Stack after pop:", stack)

# Peek (look at top without removing)
print("Peek:", stack[-1])  # 2
</COMPILER>

### Application: Valid Parentheses Problem
<COMPILER>
def is_valid(s):
    stack = []
    mapping = {')': '(', '}': '{', ']': '['}
    for char in s:
        if char in mapping:
            top = stack.pop() if stack else '#'
            if mapping[char] != top:
                return False
        else:
            stack.append(char)
    return not stack

print(is_valid("()[]{}"))  # True
print(is_valid("([)]"))    # False
print(is_valid("{[]}"))    # True
</COMPILER>

### Queues (FIFO — First In, First Out)
Like a checkout line — first to arrive, first to leave. Used in BFS graph traversal and scheduling.
<COMPILER>
from collections import deque  # Deque is optimized for O(1) popleft!

queue = deque()

# Enqueue (add to back)
queue.append("A")
queue.append("B")
queue.append("C")
print("Queue after enqueues:", list(queue))

# Dequeue (remove from front)
front = queue.popleft()  # "A"
print("Dequeued:", front)
print("Queue after dequeue:", list(queue))
</COMPILER>
`
        },
        {
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
        },
        {
            id: 6,
            title: 'Trees & Binary Search Trees',
            description: 'Hierarchical data structures and BST operations.',
            content: `
## Trees & Binary Search Trees

### Tree Basics
A **Tree** is a hierarchical data structure with a root node and child nodes forming a parent-child relationship. A **Binary Search Tree (BST)** is a special tree where left child < parent < right child.

### TreeNode Definition:
<COMPILER>
class TreeNode:
    def __init__(self, val=0):
        self.val = val
        self.left = None
        self.right = None

# Create a simple tree:
#       1
#      / \\
#     2   3
root = TreeNode(1)
root.left = TreeNode(2)
root.right = TreeNode(3)

print("Root:", root.val)
print("Left child:", root.left.val)
print("Right child:", root.right.val)
</COMPILER>

### Inorder Traversal (Left-Root-Right):
<COMPILER>
class TreeNode:
    def __init__(self, val=0):
        self.val = val
        self.left = None
        self.right = None

def inorder(root):
    result = []
    if root:
        result += inorder(root.left)
        result.append(root.val)
        result += inorder(root.right)
    return result

# Create BST:
#       2
#      / \\
#     1   3
root = TreeNode(2)
root.left = TreeNode(1)
root.right = TreeNode(3)

print("Inorder traversal:", inorder(root))  # [1, 2, 3]
</COMPILER>

### Search in BST:
<COMPILER>
class TreeNode:
    def __init__(self, val=0):
        self.val = val
        self.left = None
        self.right = None

def search_bst(root, val):
    if not root:
        return False
    if root.val == val:
        return True
    elif val < root.val:
        return search_bst(root.left, val)
    else:
        return search_bst(root.right, val)

# Create BST:
root = TreeNode(4)
root.left = TreeNode(2)
root.right = TreeNode(6)
root.left.left = TreeNode(1)
root.left.right = TreeNode(3)

print("Search 3:", search_bst(root, 3))  # True
print("Search 5:", search_bst(root, 5))  # False
</COMPILER>

### Level Order Traversal (BFS):
<COMPILER>
from collections import deque

class TreeNode:
    def __init__(self, val=0):
        self.val = val
        self.left = None
        self.right = None

def level_order(root):
    if not root:
        return []
    
    result = []
    queue = deque([root])
    
    while queue:
        node = queue.popleft()
        result.append(node.val)
        
        if node.left:
            queue.append(node.left)
        if node.right:
            queue.append(node.right)
    
    return result

# Create tree:
root = TreeNode(1)
root.left = TreeNode(2)
root.right = TreeNode(3)
root.left.left = TreeNode(4)

print("Level order:", level_order(root))  # [1, 2, 3, 4]
</COMPILER>
`
        },
        {
            id: 7,
            title: 'Graphs & Graph Traversal',
            description: 'DFS, BFS, connectivity, and shortest paths.',
            content: `
## Graphs & Graph Traversal

A **Graph** is a collection of nodes (vertices) connected by edges. Graphs can be directed or undirected, weighted or unweighted.

### Graph Representation:
<COMPILER>
# Adjacency List representation
graph = {
    1: [2, 3],
    2: [1, 4],
    3: [1, 5],
    4: [2],
    5: [3]
}

print("Neighbors of 1:", graph[1])  # [2, 3]
print("Neighbors of 4:", graph[4])  # [2]
</COMPILER>

### Depth-First Search (DFS):
<COMPILER>
def dfs(graph, start, visited=None):
    if visited is None:
        visited = set()
    
    visited.add(start)
    print(f"Visiting: {start}", end=" ")
    
    for neighbor in graph.get(start, []):
        if neighbor not in visited:
            dfs(graph, neighbor, visited)
    
    return visited

graph = {
    1: [2, 3],
    2: [1, 4],
    3: [1, 5],
    4: [2],
    5: [3]
}

print("DFS from 1:")
dfs(graph, 1)
print()
</COMPILER>

### Breadth-First Search (BFS):
<COMPILER>
from collections import deque

def bfs(graph, start):
    visited = set([start])
    queue = deque([start])
    result = []
    
    while queue:
        node = queue.popleft()
        result.append(node)
        print(f"Visiting: {node}", end=" ")
        
        for neighbor in graph.get(node, []):
            if neighbor not in visited:
                visited.add(neighbor)
                queue.append(neighbor)
    
    return result

graph = {
    1: [2, 3],
    2: [1, 4],
    3: [1, 5],
    4: [2],
    5: [3]
}

print("BFS from 1:")
bfs(graph, 1)
print()
</COMPILER>

### Shortest Path in Unweighted Graph (BFS):
<COMPILER>
from collections import deque

def shortest_path(graph, start, end):
    visited = {start}
    queue = deque([(start, [start])])
    
    while queue:
        node, path = queue.popleft()
        
        if node == end:
            return path
        
        for neighbor in graph.get(node, []):
            if neighbor not in visited:
                visited.add(neighbor)
                queue.append((neighbor, path + [neighbor]))
    
    return []

graph = {
    1: [2, 3],
    2: [1, 4],
    3: [1, 5],
    4: [2, 5],
    5: [3, 4]
}

print("Shortest path from 1 to 5:", shortest_path(graph, 1, 5))
</COMPILER>
`
        },
        {
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
        },
        {
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
        },
        {
            id: 10,
            title: 'Heaps & Priority Queues',
            description: 'Min/Max heaps and their real-world applications.',
            content: `
## Heaps & Priority Queues

A **Heap** is a complete binary tree where every parent is smaller (min-heap) or larger (max-heap) than its children. Heaps enable efficient insertion and removal in O(log n).

### Min Heap Operations:
<COMPILER>
import heapq

min_heap = []

# Insert elements
heapq.heappush(min_heap, 10)
heapq.heappush(min_heap, 5)
heapq.heappush(min_heap, 20)
heapq.heappush(min_heap, 3)

print("Min heap:", min_heap)

# Extract minimum
min_element = heapq.heappop(min_heap)
print("Extracted:", min_element)  # 3

print("Remaining:", min_heap)
</COMPILER>

### Heapify - Convert List to Heap:
<COMPILER>
import heapq

arr = [10, 5, 20, 3, 15]
heapq.heapify(arr)  # Converts to min-heap in-place

print("After heapify:", arr)

# Extract all elements in sorted order
while arr:
    print(heapq.heappop(arr), end=" ")
print()
</COMPILER>

### Find K Largest Elements:
<COMPILER>
import heapq

def find_k_largest(arr, k):
    return heapq.nlargest(k, arr)

arr = [38, 27, 43, 3, 9, 82, 10]
k = 3
print(f"3 largest elements: {find_k_largest(arr, k)}")  # [82, 43, 38]
</COMPILER>

### Max Heap (Python uses negative values):
<COMPILER>
import heapq

max_heap = []

# Insert with negative values for max-heap behavior
heapq.heappush(max_heap, -10)
heapq.heappush(max_heap, -30)
heapq.heappush(max_heap, -5)
heapq.heappush(max_heap, -20)

print("Max heap (as negatives):", max_heap)

# Extract maximum
max_element = -heapq.heappop(max_heap)
print("Extracted max:", max_element)  # 30
</COMPILER>

### Median of Stream Using Two Heaps:
<COMPILER>
import heapq

class MedianFinder:
    def __init__(self):
        self.small = []  # Max heap (negate values)
        self.large = []  # Min heap

    def addNum(self, num):
        heapq.heappush(self.small, -num)
        
        if self.small and self.large and (-self.small[0] > self.large[0]):
            val = -heapq.heappop(self.small)
            heapq.heappush(self.large, val)
        
        if len(self.small) > len(self.large) + 1:
            val = -heapq.heappop(self.small)
            heapq.heappush(self.large, val)
        
        if len(self.large) > len(self.small):
            val = heapq.heappop(self.large)
            heapq.heappush(self.small, -val)

    def findMedian(self):
        if len(self.small) > len(self.large):
            return float(-self.small[0])
        return (-self.small[0] + self.large[0]) / 2.0

mf = MedianFinder()
for num in [1, 2, 3, 4, 5]:
    mf.addNum(num)
    print(f"Median: {mf.findMedian()}")
</COMPILER>
`
        },
        {
            id: 11,
            title: 'String Algorithms & Pattern Matching',
            description: 'KMP, Rabin-Karp, substring matching, and more.',
            content: `
## String Algorithms

String problems are very common in interviews. Master these patterns!

### Longest Common Substring:
<COMPILER>
def longest_common_substring(s1, s2):
    m, n = len(s1), len(s2)
    dp = [[0] * (n + 1) for _ in range(m + 1)]
    max_len = 0
    
    for i in range(1, m + 1):
        for j in range(1, n + 1):
            if s1[i - 1] == s2[j - 1]:
                dp[i][j] = dp[i - 1][j - 1] + 1
                max_len = max(max_len, dp[i][j])
    
    return max_len

s1 = "abcdef"
s2 = "fbdefe"
print(f"LCS length: {longest_common_substring(s1, s2)}")  # 3
</COMPILER>

### Palindrome Check:
<COMPILER>
def is_palindrome(s):
    cleaned = ''.join(c.lower() for c in s if c.isalnum())
    return cleaned == cleaned[::-1]

test_strings = [
    "A man, a plan, a canal: Panama",
    "racecar",
    "hello"
]

for s in test_strings:
    print(f'"{s}" is palindrome: {is_palindrome(s)}')
</COMPILER>

### Anagram Check:
<COMPILER>
def is_anagram(s1, s2):
    return sorted(s1) == sorted(s2)

# Alternative using character count
def is_anagram_count(s1, s2):
    from collections import Counter
    return Counter(s1) == Counter(s2)

print(is_anagram("listen", "silent"))     # True
print(is_anagram("hello", "world"))       # False
print(is_anagram_count("abc", "cab"))     # True
</COMPILER>

### Longest Substring Without Repeating Characters:
<COMPILER>
def longest_substring_no_repeat(s):
    char_index = {}
    max_len = 0
    start = 0
    
    for i, char in enumerate(s):
        if char in char_index and char_index[char] >= start:
            start = char_index[char] + 1
        
        max_len = max(max_len, i - start + 1)
        char_index[char] = i
    
    return max_len

strings = ["abcabcbb", "au", "dvdf", "pwwkew"]
for s in strings:
    print(f"'{s}' -> {longest_substring_no_repeat(s)}")
</COMPILER>

### Word Break Problem:
<COMPILER>
def word_break(s, word_dict):
    dp = [False] * (len(s) + 1)
    dp[0] = True
    
    for i in range(1, len(s) + 1):
        for j in range(i):
            if dp[j] and s[j:i] in word_dict:
                dp[i] = True
                break
    
    return dp[len(s)]

s = "catsandcatsdog"
word_dict = {"cat", "cats", "and", "sand", "dog"}
print(word_break(s, word_dict))  # True

s2 = "catsandog"
print(word_break(s2, word_dict))  # False
</COMPILER>
`
        },
        {
            id: 12,
            title: 'Advanced DSA Topics',
            description: 'Tries, Union-Find, Segment Trees, and more advanced concepts.',
            content: `
## Advanced Data Structures

### Trie (Prefix Tree):
<COMPILER>
class TrieNode:
    def __init__(self):
        self.children = {}
        self.is_end = False

class Trie:
    def __init__(self):
        self.root = TrieNode()
    
    def insert(self, word):
        node = self.root
        for char in word:
            if char not in node.children:
                node.children[char] = TrieNode()
            node = node.children[char]
        node.is_end = True
    
    def search(self, word):
        node = self.root
        for char in word:
            if char not in node.children:
                return False
            node = node.children[char]
        return node.is_end
    
    def starts_with(self, prefix):
        node = self.root
        for char in prefix:
            if char not in node.children:
                return False
            node = node.children[char]
        return True

trie = Trie()
trie.insert("apple")
trie.insert("app")
print("search('apple'):", trie.search("apple"))      # True
print("search('app'):", trie.search("app"))          # True
print("starts_with('ap'):", trie.starts_with("ap"))  # True
print("search('appl'):", trie.search("appl"))        # False
</COMPILER>

### Union-Find (Disjoint Set Union):
<COMPILER>
class UnionFind:
    def __init__(self, n):
        self.parent = list(range(n))
        self.rank = [0] * n
    
    def find(self, x):
        if self.parent[x] != x:
            self.parent[x] = self.find(self.parent[x])  # Path compression
        return self.parent[x]
    
    def union(self, x, y):
        root_x = self.find(x)
        root_y = self.find(y)
        
        if root_x == root_y:
            return False
        
        # Union by rank
        if self.rank[root_x] < self.rank[root_y]:
            self.parent[root_x] = root_y
        elif self.rank[root_x] > self.rank[root_y]:
            self.parent[root_y] = root_x
        else:
            self.parent[root_y] = root_x
            self.rank[root_x] += 1
        
        return True
    
    def is_connected(self, x, y):
        return self.find(x) == self.find(y)

uf = UnionFind(6)
uf.union(0, 1)
uf.union(1, 2)
uf.union(3, 4)

print("0 and 2 connected:", uf.is_connected(0, 2))  # True
print("0 and 3 connected:", uf.is_connected(0, 3))  # False

uf.union(2, 3)
print("After union(2,3), 0 and 3 connected:", uf.is_connected(0, 3))  # True
</COMPILER>

### Segment Tree - Range Sum Query:
<COMPILER>
class SegmentTree:
    def __init__(self, arr):
        self.n = len(arr)
        self.tree = [0] * (4 * self.n)
        self.build(arr, 0, 0, self.n - 1)
    
    def build(self, arr, node, start, end):
        if start == end:
            self.tree[node] = arr[start]
        else:
            mid = (start + end) // 2
            self.build(arr, 2 * node + 1, start, mid)
            self.build(arr, 2 * node + 2, mid + 1, end)
            self.tree[node] = self.tree[2 * node + 1] + self.tree[2 * node + 2]
    
    def query(self, node, start, end, l, r):
        if r < start or end < l:
            return 0
        if l <= start and end <= r:
            return self.tree[node]
        
        mid = (start + end) // 2
        left_sum = self.query(2 * node + 1, start, mid, l, r)
        right_sum = self.query(2 * node + 2, mid + 1, end, l, r)
        return left_sum + right_sum
    
    def range_sum(self, l, r):
        return self.query(0, 0, self.n - 1, l, r)

arr = [1, 3, 5, 7, 9, 11]
st = SegmentTree(arr)
print("Sum [0, 2]:", st.range_sum(0, 2))  # 1 + 3 + 5 = 9
print("Sum [1, 4]:", st.range_sum(1, 4))  # 3 + 5 + 7 + 9 = 24
</COMPILER>
`
        }
    ]
};
