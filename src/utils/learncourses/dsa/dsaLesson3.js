export const dsaLesson3 = {
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
};