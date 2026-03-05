export const cpp = {
    id: 'cpp',
    name: 'C++ Programming',
    description: 'High-performance programming with C++',
    longDescription: 'Advanced programming course covering C++ fundamentals, OOP, memory management, and system-level optimization for competitive programming.',
    icon: '⚡',
    color: 'from-purple-400 to-pink-500',
    students: 31450,
    rating: 4.6,
    reviews: 850,
    difficulty: 'Intermediate',
    hours: 16,
    prerequisites: [
        'Understanding of C programming basics',
        'Knowledge of variables, loops, and functions',
        'C++ compiler installed (GCC, Clang, or MSVC)'
    ],
    learningObjectives: [
        'Master C++ syntax and fundamentals',
        'Understand memory management and pointers',
        'Learn Object-Oriented Programming in C++',
        'Implement templates and generic programming',
        'Optimize code for performance',
        'Work with STL (Standard Template Library)'
    ],
    keyTopics: [
        'Pointers & References',
        'Object-Oriented Programming',
        'Operator Overloading',
        'STL Containers',
        'Memory Management',
        'Inheritance & Polymorphism',
        'Templates & Generics',
        'Exception Handling'
    ],
    lessons: [
        {
            id: 1,
            title: 'C++ Architecture & Basics',
            description: 'Getting started with high-performance execution.',
            difficulty: 'Beginner',
            duration: '9 mins',
            content: `
## Welcome to C++

C++ is a high-performance, statically typed, compiled programming language. Developed by Bjarne Stroustrup as an extension to C, it provides object-oriented programming (OOP) and generic programming capabilities while operating incredibly close to the hardware.

### Compilation Process
Unlike Python or Java, C++ compiles directly down to native machine code.
1. **Preprocessing**: Resolves \`#include\` and \`#define\` macros.
2. **Compilation**: Converts syntax to Assembly instructions.
3. **Assembly**: Translates Assembly to Machine Code (Object file \`.o\`).
4. **Linking**: Combines various Object files and libraries into the final \`.exe\` or \`.out\` executable.

### Hello World Example
\`\`\`cpp
// Preprocessor directive to include the Standard IO Stream library
#include <iostream>

// Standard namespace wrapper prevents name collisions
using namespace std;

// Execution starts here
int main() {
    // console out (cout) with stream insertion operator (<<)
    cout << "Hello, World!" << endl;
    
    // Return 0 indicates successful execution to the OS
    return 0;
}
\`\`\`

### Data Types
C++ provides extremely granular control over data types and memory footprints:
- **int**: Standard integers (Usually 4 bytes)
- **long long**: Enormous integers (8 bytes)
- **float**: Decimals (4 bytes)
- **double**: High precision decimals (8 bytes)
- **char**: Single characters (1 byte)
- **bool**: Boolean values (1 byte)
\`\`\`cpp
int age = 22;
double pi = 3.14159;
char grade = 'A';
bool is_active = true;
\`\`\`
`
        },
        {
            id: 2,
            title: 'Control Flow',
            description: 'C++ If-statements, Loops, and Structs.',
            content: `
## Control Flow in C++

C++ control structures define the flow of execution in your application. They are practically identical to Java and C.

### Conditionals
\`\`\`cpp
int age = 18;

if (age < 18) {
    cout << "Minor" << endl;
} else if (age == 18) {
    cout << "Just became an adult!" << endl;
} else {
    cout << "Adult" << endl;
}
\`\`\`

### Switch Statements
Extremely fast lookups used alongside \`int\`, \`char\`, and \`enum\`.
\`\`\`cpp
char rank = 'B';
switch(rank) {
    case 'A': cout << "Excellent"; break;
    case 'B': cout << "Good"; break;
    case 'C': cout << "Average"; break;
    default: cout << "Invalid rank";
}
\`\`\`

### Loops
**For Loop:** (Perfect for iteration)
\`\`\`cpp
for(int i = 0; i < 5; i++) {
    cout << i << " ";
}
\`\`\`

**While Loop:** (Perfect for truth-conditions)
\`\`\`cpp
int count = 10;
while(count > 0) {
    cout << count << endl;
    count--;
}
\`\`\`

### Structs (Precursor to objects)
Used to package a group of disparate variables into a single conceptual package.
\`\`\`cpp
struct Person {
    string name;
    int age;
    double height;
};

int main() {
    Person p1;
    p1.name = "Alice";
    p1.age = 22;
    p1.height = 1.70;
}
\`\`\`
`
        },
        {
            id: 3,
            title: 'Pointers & Memory Control',
            description: 'The hardest and most powerful part of C++.',
            content: `
## Pointers & Memory Management

Pointers are what make C/C++ famous (and sometimes feared). A pointer is simply a variable that **stores a memory address** rather than an actual value!

### Understanding Pointers
\`\`\`cpp
int var = 20;

// The '&' operator retrieves the memory address of a variable
int* ptr = &var;

cout << "Value of var: " << var << endl;       // 20
cout << "Memory address: " << ptr << endl;     // e.g. 0x7ffd5a3b9abc

// The '*' (dereference) operator retrieves the value AT the memory address
cout << "Value at ptr: " << *ptr << endl;      // 20

// Changing the dereferenced pointer mutates the original variable!
*ptr = 100;
cout << var << endl; // 100
\`\`\`

### Dynamic Memory Allocation
Instead of variables clearing automatically when their scope dies (Stack memory), you can create them on the Heap which persists across your entire app until explicitly deleted.
\`\`\`cpp
// 'new' allocates memory on the heap and returns a pointer
int* ptr = new int;    
*ptr = 45;

int* arr = new int[10]; // Allocate array of 10 integers

// 'delete' prevents Memory Leaks!
delete ptr;       
delete[] arr;     
\`\`\`

### Pass by Reference vs Value
If you pass variables into functions normally, C++ makes a heavy memory duplicate of them! Pass by reference avoids this memory hit.
\`\`\`cpp
// Passed by Value (Duplicates variable)
void increment(int x) { x++; }

// Passed by Reference (Mutates original using pointer abstractions)
void incrementRef(int& x) { x++; }

int main() {
    int a = 5;
    increment(a); // a is still 5
    incrementRef(a); // a is now 6!
}
\`\`\`
`
        },
        {
            id: 4,
            title: 'C++ Object-Oriented Programming',
            description: 'Implementing classes, constructors, and encapsulation.',
            content: `
## Object-Oriented Programming (OOP) in C++

OOP concepts in C++ closely map to Java but have some key syntax and behavioral differences (e.g. Memory Destruction and Multiple Inheritance).

### Classes & Constructors
\`\`\`cpp
class Student {
private:
    // Only accessible from within the class
    string name;
    int age;

public:
    // Default Constructor
    Student() {
        name = "Unknown";
        age = 0;
    }
    
    // Parameterized Constructor
    Student(string n, int a) {
        name = n;
        age = a;
    }
    
    // Destructor (Called when object leaves scope/dies)
    ~Student() {
        cout << name << " destroyed from memory." << endl;
    }
    
    // Method
    void display() {
        cout << name << ", " << age << " yrs" << endl;
    }
};

int main() {
    Student s1("John", 20); // Created on stack
    s1.display();
    
    Student* s2 = new Student("Bob", 22); // Created on heap
    s2->display(); // We use the '->' arrow operator to call methods from pointers!
    delete s2;     // Triggers Bob's destructor!
}
\`\`\`

### Inheritance
C++ supports Single, Multilevel, and Multiple Inheritance natively! Access inheritance modifiers apply (\`public\`, \`protected\`, \`private\`).
\`\`\`cpp
class Animal {
public:
    void eat() { cout << "Eating..." << endl; }
};

// Dog publicly inherits Animal
class Dog : public Animal {
public:
    void bark() { cout << "Woof!" << endl; }
};

int main() {
    Dog d;
    d.eat(); // Inherited!
    d.bark();
}
\`\`\`

### Polymorphism & Virtual Functions
To allow method overriding to work over pointers properly, base methods must be marked \`virtual\`.
\`\`\`cpp
class Shape {
public:
    virtual void draw() {
        cout << "Drawing generic shape" << endl;
    }
};

class Circle : public Shape {
public:
    // The override keyword confirms we are rewriting the base math
    void draw() override {
        cout << "Drawing perfect circle" << endl;
    }
};

int main() {
    Shape* s = new Circle();
    s->draw(); // Because of 'virtual', this calls Circle's draw!
               // If omitted, it would incorrectly call Shape's draw.
}
\`\`\`
`
        },
        {
            id: 5,
            title: 'Standard Template Library (STL)',
            description: 'Using vectors, maps, and algorithms out of the box.',
            content: `
## The Standard Template Library (STL)

Programming in C++ entirely from scratch is a massive undertaking. The STL provides immensely optimized versions of common data structures and algorithms using Template syntax.

### \`std::vector\` (Dynamic Array)
The bread and butter array type of modern C++.
\`\`\`cpp
#include <vector>
#include <iostream>

using namespace std;

int main() {
    vector<int> numbers;
    
    numbers.push_back(10); // Append
    numbers.push_back(20);
    numbers.push_back(30);
    
    cout << "Size: " << numbers.size() << endl; // 3
    
    // Fast array-iteration accessing
    for (int num : numbers) {
        cout << num << endl;
    }
    
    numbers.pop_back(); // Removes last element
}
\`\`\`

### \`std::map\` and \`std::set\`
\`map\` is a dictionary (Red-Black tree under the hood). \`set\` is an ordered set of unique items.
\`\`\`cpp
#include <map>
#include <string>

map<string, int> ages;
ages["Alice"] = 25;
ages["Bob"] = 30;

cout << "Alice is " << ages["Alice"];

// Iteration requires an iterator
for (auto const& pair : ages) {
    cout << pair.first << ": " << pair.second << endl;
}
\`\`\`

### STL Algorithms
The \`<algorithm>\` header has dozens of highly-optimized mathematical manipulation options.
\`\`\`cpp
#include <algorithm>
#include <vector>

vector<int> v = {5, 2, 8, 1, 9};

// O(N*logN) Sort!
sort(v.begin(), v.end()); // {1, 2, 5, 8, 9}

// Reverse
reverse(v.begin(), v.end());

// Iterative find
auto it = find(v.begin(), v.end(), 8);

// Pointer arithmetic to get index
if (it != v.end()) {
    cout << "Found 8 at index: " << (it - v.begin());
}
\`\`\`
`
        },
        {
            id: 6,
            title: 'Templates & Generic Programming',
            description: 'Writing type-safe, reusable code with C++ Templates.',
            content: `
## Templates in C++

Templates allow you to write generic code that works with **any data type**. This is the foundation of the Standard Template Library (STL) itself.

### Function Templates
A function template creates a family of functions — one per data type used.

<COMPILER>
#include <iostream>
using namespace std;

// T is a placeholder for any type
template <typename T>
T getMax(T a, T b) {
    return (a > b) ? a : b;
}

// Works with any comparable type!
template <typename T>
void swap(T &a, T &b) {
    T temp = a;
    a = b;
    b = temp;
}

int main() {
    cout << getMax(10, 20) << endl;          // Works with int
    cout << getMax(3.14, 2.71) << endl;      // Works with double
    cout << getMax('A', 'Z') << endl;        // Works with char
    
    int x = 5, y = 10;
    swap(x, y);
    cout << "After swap: x=" << x << " y=" << y << endl;
    
    return 0;
}
</COMPILER>

### Class Templates
You can also templatize entire classes.

<COMPILER>
#include <iostream>
using namespace std;

template <typename T>
class Stack {
private:
    T data[100];
    int top;
    
public:
    Stack() : top(-1) {}
    
    void push(T val) {
        data[++top] = val;
        cout << "Pushed: " << val << endl;
    }
    
    T pop() {
        if (top < 0) {
            cout << "Stack is empty!" << endl;
            return T();
        }
        return data[top--];
    }
    
    bool isEmpty() {
        return top == -1;
    }
};

int main() {
    Stack<int> intStack;
    intStack.push(10);
    intStack.push(20);
    intStack.push(30);
    cout << "Popped: " << intStack.pop() << endl;
    
    Stack<string> strStack;
    strStack.push("Hello");
    strStack.push("World");
    cout << "Popped: " << strStack.pop() << endl;
    
    return 0;
}
</COMPILER>

### Template Specialization
You can provide a specific implementation for a particular data type.
\`\`\`cpp
// Generic template
template <typename T>
void printType(T val) {
    cout << "Generic: " << val << endl;
}

// Specialization for bool
template <>
void printType<bool>(bool val) {
    cout << "Boolean: " << (val ? "true" : "false") << endl;
}
\`\`\`
`
        },
        {
            id: 7,
            title: 'Exception Handling',
            description: 'Writing robust code that handles runtime errors gracefully.',
            content: `
## Exception Handling in C++

Exceptions provide a way to react to exceptional circumstances (like runtime errors) in programs by transferring control to special functions called **handlers**.

### Basic try-catch-throw:

<COMPILER>
#include <iostream>
#include <stdexcept>
using namespace std;

double safeDivide(double a, double b) {
    if (b == 0) {
        throw runtime_error("Division by zero is not allowed!");
    }
    return a / b;
}

int main() {
    try {
        cout << safeDivide(10, 2) << endl;   // Works fine: 5
        cout << safeDivide(10, 0) << endl;   // Throws!
    } catch (const runtime_error& e) {
        cout << "Caught error: " << e.what() << endl;
    }
    
    // Multiple catch blocks
    try {
        int arr[5] = {1, 2, 3, 4, 5};
        throw out_of_range("Array index out of bounds!");
    } catch (const out_of_range& e) {
        cout << "Range Error: " << e.what() << endl;
    } catch (const exception& e) {
        cout << "General Error: " << e.what() << endl;
    } catch (...) {
        cout << "Unknown error occurred!" << endl;
    }
    
    return 0;
}
</COMPILER>

### Custom Exception Classes
You can create your own exception types by inheriting from \`std::exception\`.

<COMPILER>
#include <iostream>
#include <exception>
using namespace std;

// Custom exception class
class InsufficientFundsException : public exception {
private:
    double amount;
public:
    InsufficientFundsException(double a) : amount(a) {}
    
    const char* what() const noexcept override {
        return "Insufficient funds in account!";
    }
    
    double getAmount() { return amount; }
};

class BankAccount {
    double balance;
public:
    BankAccount(double b) : balance(b) {}
    
    void withdraw(double amount) {
        if (amount > balance) {
            throw InsufficientFundsException(amount - balance);
        }
        balance -= amount;
        cout << "Withdrawn $" << amount << ". New balance: $" << balance << endl;
    }
};

int main() {
    BankAccount account(500.0);
    try {
        account.withdraw(200);  // OK
        account.withdraw(400);  // Will throw!
    } catch (const InsufficientFundsException& e) {
        cout << e.what() << endl;
        cout << "You need $" << e.getAmount() << " more." << endl;
    }
    return 0;
}
</COMPILER>
`
        },
        {
            id: 8,
            title: 'File I/O in C++',
            description: 'Reading from and writing to files using fstream.',
            content: `
## File Input/Output in C++

C++ uses the \`fstream\` library to work with files. Three key classes:
- \`ofstream\`: Write to files (Output File Stream)
- \`ifstream\`: Read from files (Input File Stream)
- \`fstream\`: Both read and write

### Writing to a File:
\`\`\`cpp
#include <iostream>
#include <fstream>
#include <string>
using namespace std;

int main() {
    // Open file for writing
    ofstream outFile("students.txt");
    
    if (!outFile.is_open()) {
        cerr << "Error: Cannot open file!" << endl;
        return 1;
    }
    
    // Write data
    outFile << "Alice,22,Computer Science" << endl;
    outFile << "Bob,21,Mathematics" << endl;
    outFile << "Charlie,23,Physics" << endl;
    
    outFile.close();  // Always close!
    cout << "Data written successfully." << endl;
    
    return 0;
}
\`\`\`

### Reading from a File:
\`\`\`cpp
#include <iostream>
#include <fstream>
#include <string>
using namespace std;

int main() {
    ifstream inFile("students.txt");
    
    if (!inFile) {
        cerr << "Error: File not found!" << endl;
        return 1;
    }
    
    string line;
    cout << "=== Student Records ===" << endl;
    while (getline(inFile, line)) {
        cout << line << endl;
    }
    
    inFile.close();
    return 0;
}
\`\`\`

### Reading Structured Data (CSV parsing):
<COMPILER>
#include <iostream>
#include <sstream>
#include <string>
using namespace std;

// Simulate parsing a CSV line
void parseCSVLine(const string& line) {
    stringstream ss(line);
    string token;
    int colNum = 0;
    
    string fields[] = {"Name", "Age", "Department"};
    
    while (getline(ss, token, ',')) {
        cout << fields[colNum++] << ": " << token << endl;
    }
    cout << "---" << endl;
}

int main() {
    string csvData[] = {
        "Alice,22,Computer Science",
        "Bob,21,Mathematics",
        "Charlie,23,Physics"
    };
    
    for (const string& line : csvData) {
        parseCSVLine(line);
    }
    
    return 0;
}
</COMPILER>
`
        },
        {
            id: 9,
            title: 'Lambda & Modern C++ (C++11/14/17)',
            description: 'Functors, lambdas, auto, range-based loops, and more.',
            content: `
## Modern C++ Features

C++11 and later brought major improvements that changed how C++ is written. Many code bases rely heavily on these modern features.

### Lambda Functions
Lambdas are anonymous functions defined inline — perfect for short, one-off use cases.

<COMPILER>
#include <iostream>
#include <vector>
#include <algorithm>
using namespace std;

int main() {
    // Basic lambda: [capture](params) { body }
    auto greet = []() {
        cout << "Hello from Lambda!" << endl;
    };
    greet(); // Call it like a function
    
    // Lambda with parameters
    auto add = [](int a, int b) -> int {
        return a + b;
    };
    cout << "Sum: " << add(5, 3) << endl;
    
    // Lambda capturing variables from outer scope
    int factor = 3;
    auto multiply = [factor](int x) {
        return x * factor;  // Captures 'factor' by value
    };
    cout << "Multiplied: " << multiply(7) << endl;
    
    // Lambda with STL algorithms
    vector<int> nums = {5, 2, 8, 1, 9, 3};
    sort(nums.begin(), nums.end(), [](int a, int b) {
        return a < b;  // Custom comparator!
    });
    
    for (int n : nums) {
        cout << n << " ";
    }
    cout << endl;
    
    return 0;
}
</COMPILER>

### Range-Based For Loops & \`auto\`:
<COMPILER>
#include <iostream>
#include <vector>
#include <map>
#include <string>
using namespace std;

int main() {
    vector<int> numbers = {1, 2, 3, 4, 5};
    
    // Range-based for loop (C++11)
    for (auto num : numbers) {
        cout << num << " ";
    }
    cout << endl;
    
    // With reference (avoids copying large objects)
    map<string, int> scores = {{"Alice", 95}, {"Bob", 87}, {"Charlie", 92}};
    
    for (const auto& [name, score] : scores) { // Structured bindings (C++17)
        cout << name << ": " << score << endl;
    }
    
    // auto with complex types
    auto it = numbers.begin();
    auto [min, max] = make_pair(*min_element(numbers.begin(), numbers.end()),
                                 *max_element(numbers.begin(), numbers.end()));
    cout << "Min: " << min << ", Max: " << max << endl;
    
    return 0;
}
</COMPILER>
`
        },
        {
            id: 10,
            title: 'Smart Pointers & RAII',
            description: 'Memory-safe programming with unique_ptr and shared_ptr.',
            content: `
## Smart Pointers in C++

Raw pointers (\`new\`/\`delete\`) are error-prone — forgetting to \`delete\` causes memory leaks. **Smart pointers** automatically manage memory, following the **RAII** (Resource Acquisition Is Initialization) principle.

### The 3 Types of Smart Pointers:
1. \`unique_ptr\`: Single ownership — only one pointer can point to the object.
2. \`shared_ptr\`: Shared ownership — multiple pointers can share the same object.
3. \`weak_ptr\`: Non-owning reference to a \`shared_ptr\` (breaks circular references).

### unique_ptr (Exclusive Ownership):
<COMPILER>
#include <iostream>
#include <memory>
#include <string>
using namespace std;

class Robot {
    string name;
public:
    Robot(string n) : name(n) {
        cout << name << " activated!" << endl;
    }
    ~Robot() {
        cout << name << " deactivated." << endl;  // Auto-called!
    }
    void beep() { cout << name << ": Beep boop!" << endl; }
};

int main() {
    // No 'new' needed! make_unique handles it
    auto robot1 = make_unique<Robot>("R2D2");
    robot1->beep();
    
    // Transfer ownership (unique_ptr can't be copied!)
    auto robot2 = move(robot1);
    robot2->beep();
    // robot1 is now nullptr!
    
    cout << "robot1 is " << (robot1 ? "valid" : "null") << endl;
    
    // robot2 automatically destroyed at end of scope!
    return 0;
}
</COMPILER>

### shared_ptr (Shared Ownership):
<COMPILER>
#include <iostream>
#include <memory>
using namespace std;

class Database {
public:
    Database() { cout << "Database connected!" << endl; }
    ~Database() { cout << "Database disconnected." << endl; }
    void query() { cout << "Running query..." << endl; }
};

int main() {
    shared_ptr<Database> db1 = make_shared<Database>();
    cout << "Reference count: " << db1.use_count() << endl;  // 1
    
    {
        shared_ptr<Database> db2 = db1;  // Both own it now
        cout << "Reference count: " << db1.use_count() << endl;  // 2
        db2->query();
    }  // db2 goes out of scope, count decreases
    
    cout << "Reference count after inner scope: " << db1.use_count() << endl;  // 1
    // Database destroyed only when ALL shared_ptrs die!
    
    return 0;
}
</COMPILER>
`
        },
        {
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
        },
        {
            id: 12,
            title: 'Advanced Data Structures',
            description: 'Implementing linked lists, trees, and graphs from scratch.',
            content: `
## Implementing Data Structures in C++

Understanding data structures at the implementation level is crucial for technical interviews and systems programming.

### Singly Linked List:
<COMPILER>
#include <iostream>
using namespace std;

struct Node {
    int data;
    Node* next;
    Node(int d) : data(d), next(nullptr) {}
};

class LinkedList {
    Node* head;
public:
    LinkedList() : head(nullptr) {}
    
    ~LinkedList() {
        Node* curr = head;
        while (curr) {
            Node* next = curr->next;
            delete curr;
            curr = next;
        }
    }
    
    void push_front(int val) {
        Node* newNode = new Node(val);
        newNode->next = head;
        head = newNode;
    }
    
    void push_back(int val) {
        Node* newNode = new Node(val);
        if (!head) { head = newNode; return; }
        Node* curr = head;
        while (curr->next) curr = curr->next;
        curr->next = newNode;
    }
    
    void print() {
        Node* curr = head;
        while (curr) {
            cout << curr->data;
            if (curr->next) cout << " -> ";
            curr = curr->next;
        }
        cout << " -> NULL" << endl;
    }
    
    void reverse() {
        Node* prev = nullptr;
        Node* curr = head;
        while (curr) {
            Node* next = curr->next;
            curr->next = prev;
            prev = curr;
            curr = next;
        }
        head = prev;
    }
};

int main() {
    LinkedList list;
    list.push_back(1);
    list.push_back(2);
    list.push_back(3);
    list.push_front(0);
    
    cout << "List: ";
    list.print();
    
    list.reverse();
    cout << "Reversed: ";
    list.print();
    
    return 0;
}
</COMPILER>

### Binary Search Tree:
\`\`\`cpp
struct TreeNode {
    int val;
    TreeNode* left;
    TreeNode* right;
    TreeNode(int v) : val(v), left(nullptr), right(nullptr) {}
};

class BST {
    TreeNode* root;
    
    TreeNode* insert(TreeNode* node, int val) {
        if (!node) return new TreeNode(val);
        if (val < node->val) node->left = insert(node->left, val);
        else if (val > node->val) node->right = insert(node->right, val);
        return node;
    }
    
    void inorder(TreeNode* node) {
        if (!node) return;
        inorder(node->left);
        cout << node->val << " ";
        inorder(node->right);
    }
    
public:
    BST() : root(nullptr) {}
    void insert(int val) { root = insert(root, val); }
    void inorder() { inorder(root); cout << endl; }
};

int main() {
    BST tree;
    for (int v : {5, 3, 7, 1, 4, 6, 8}) {
        tree.insert(v);
    }
    tree.inorder(); // Sorted: 1 3 4 5 6 7 8
}
\`\`\`
`
        }
    ]
};
