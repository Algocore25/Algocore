export const dsaLesson6 = {
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
};