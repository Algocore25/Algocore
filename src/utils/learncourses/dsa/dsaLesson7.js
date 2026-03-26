export const dsaLesson7 = {
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
};