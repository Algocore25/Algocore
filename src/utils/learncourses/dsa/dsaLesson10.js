export const dsaLesson10 = {
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
};