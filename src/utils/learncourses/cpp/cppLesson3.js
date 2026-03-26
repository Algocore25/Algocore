export const cppLesson3 = {
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
};