export const cLesson8 = {
  id: 8,
  title: 'Functions & Recursion',
  description: 'Writing modular code and thinking recursively.',
  content: `
## Functions in C

In C, you must declare a function's **return type**, **name**, and **parameter types** explicitly.

### Function Syntax:
<COMPILER>
#include <stdio.h>

// Function Declaration (Prototype)
int add(int a, int b);
void greet(char *name);

int main() {
    int result = add(5, 3);
    printf("Sum: %d\\n", result);
    
    greet("Alice");
    return 0;
}

// Function Definition
int add(int a, int b) {
    return a + b;
}

void greet(char *name) {
    printf("Hello, %s!\\n", name);
}
</COMPILER>

### Pass by Value vs. Pass by Pointer:
<COMPILER>
#include <stdio.h>

void doubleByValue(int n) {
    n = n * 2;  // Does NOT change original
}

void doubleByPointer(int *n) {
    *n = *n * 2;  // DOES change original
}

int main() {
    int x = 5;
    
    doubleByValue(x);
    printf("After doubleByValue: x = %d\\n", x);  // Still 5
    
    doubleByPointer(&x);
    printf("After doubleByPointer: x = %d\\n", x);  // Now 10
    
    return 0;
}
</COMPILER>

### Recursion:
<COMPILER>
#include <stdio.h>

// Factorial: n! = n * (n-1) * ... * 1
long factorial(int n) {
    if (n <= 1) return 1;
    return n * factorial(n - 1);
}

// Fibonacci: fib(n) = fib(n-1) + fib(n-2)
int fibonacci(int n) {
    if (n <= 1) return n;
    return fibonacci(n - 1) + fibonacci(n - 2);
}

int main() {
    printf("5! = %ld\\n", factorial(5));      // 120
    printf("fib(7) = %d\\n", fibonacci(7));   // 13
    
    return 0;
}
</COMPILER>
`
};