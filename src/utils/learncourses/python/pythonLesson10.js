export const pythonLesson10 = {
  id: 10,
  title: 'Advanced Topics & Performance',
  description: 'Multiprocessing, asyncio, optimization, and best practices.',
  content: `
## Multiprocessing vs Multithreading

Processing multiple tasks simultaneously.

### Threading (Shared Memory):
<COMPILER>
import threading
import time

def download_file(filename):
    for i in range(3):
        print(f"Downloading {filename}... {i+1}/3")
        time.sleep(1)

# Create threads
t1 = threading.Thread(target=download_file, args=("file1.txt",))
t2 = threading.Thread(target=download_file, args=("file2.txt",))

# Start threads (run concurrently)
t1.start()
t2.start()

# Wait for threads to finish
t1.join()
t2.join()

print("All downloads complete!")
</COMPILER>

### Multiprocessing (Separate Memory):
<COMPILER>
from multiprocessing import Process
import os

def worker(name):
    print(f"Worker {name} (PID: {os.getpid()}) starting")

# Create processes
p1 = Process(target=worker, args=("Process-1",))
p2 = Process(target=worker, args=("Process-2",))

# Start processes
p1.start()
p2.start()

# Wait for completion
p1.join()
p2.join()

print("All processes complete!")
</COMPILER>

### Async Programming (asyncio):
<COMPILER>
import asyncio

async def download(url, delay):
    print(f"Starting download from {url}")
    await asyncio.sleep(delay)  # Simulate download time
    print(f"Completed download from {url}")
    return f"Data from {url}"

async def main():
    # Run multiple async functions concurrently
    results = await asyncio.gather(
        download("http://site1.com", 2),
        download("http://site2.com", 1),
        download("http://site3.com", 3)
    )
    print("Results:", results)

asyncio.run(main())
</COMPILER>

## Performance Optimization

### Timing Code:
<COMPILER>
import time

# Using time module
start = time.time()
# Your code here
time.sleep(0.5)
end = time.time()
print(f"Execution time: {end - start:.4f} seconds")

# Using timeit (for small code snippets)
import timeit

# Method 1: List creation
method1_time = timeit.timeit('[i**2 for i in range(1000)]', number=10000)

# Method 2: Map
method2_time = timeit.timeit('list(map(lambda x: x**2, range(1000)))', number=10000)

print(f"List comprehension: {method1_time:.4f}s")
print(f"Map: {method2_time:.4f}s")
</COMPILER>

### Memory Profiling:
<COMPILER>
import sys

def memory_usage():
    # Check memory usage
    x = [i for i in range(10000)]
    print(f"List size: {sys.getsizeof(x)} bytes")
    
    # Generator uses less memory
    y = (i for i in range(10000))
    print(f"Generator size: {sys.getsizeof(y)} bytes")

memory_usage()
</COMPILER>
`
};