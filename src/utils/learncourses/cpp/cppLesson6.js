export const cppLesson6 = {
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
};