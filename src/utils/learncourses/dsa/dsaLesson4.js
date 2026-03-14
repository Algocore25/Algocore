export const dsaLesson4 = {
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
};