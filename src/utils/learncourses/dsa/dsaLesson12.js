export const dsaLesson12 = {
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
};