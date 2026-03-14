export const cppLesson11 = {
  id: 11,
  title: 'Concurrency & Multithreading',
  description: 'Running multiple threads with C++11 thread support.',
  content: `
## Multithreading in C++

C++11 introduced native thread support via \`<thread>\`. Before this, platform-specific APIs (like pthreads on Linux) were required.

### Creating Threads:
\`\`\`cpp
#include <iostream>
#include <thread>
using namespace std;

void printNumbers(int start, int end) {
    for (int i = start; i <= end; i++) {
        cout << "Thread " << start << ": " << i << endl;
    }
}

int main() {
    // Create two threads
    thread t1(printNumbers, 1, 5);
    thread t2(printNumbers, 6, 10);
    
    // Wait for both to complete
    t1.join();
    t2.join();
    
    cout << "All threads finished!" << endl;
    return 0;
}
\`\`\`

### Mutex (Mutual Exclusion) — Preventing Race Conditions:
When multiple threads access shared data, they can corrupt it. A \`mutex\` locks access to a resource exclusively.

<COMPILER>
#include <iostream>
#include <thread>
#include <mutex>
#include <vector>
using namespace std;

mutex mtx;
int sharedCounter = 0;

void incrementCounter(int times) {
    for (int i = 0; i < times; i++) {
        lock_guard<mutex> lock(mtx);  // Auto-locks and auto-unlocks!
        sharedCounter++;
    }
}

int main() {
    const int NUM_THREADS = 4;
    vector<thread> threads;
    
    for (int i = 0; i < NUM_THREADS; i++) {
        threads.emplace_back(incrementCounter, 1000);
    }
    
    for (auto& t : threads) {
        t.join();
    }
    
    cout << "Final counter: " << sharedCounter << endl;  // Should be 4000
    cout << "Expected:      4000" << endl;
    
    return 0;
}
</COMPILER>

### std::future and async:
For tasks that return a value asynchronously.
\`\`\`cpp
#include <future>
#include <iostream>

long long fibonacci(int n) {
    if (n <= 1) return n;
    return fibonacci(n-1) + fibonacci(n-2);
}

int main() {
    // Launch fibonacci(40) in a background thread
    auto result = async(launch::async, fibonacci, 40);
    
    cout << "Computing fibonacci(40) asynchronously..." << endl;
    cout << "Meanwhile, other work happens here!" << endl;
    
    // Block and get the result when needed
    cout << "Result: " << result.get() << endl;
    
    return 0;
}
\`\`\`
`
};