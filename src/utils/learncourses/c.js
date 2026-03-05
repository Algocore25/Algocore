export const c = {
    id: 'c',
    name: 'C Programming',
    description: 'The foundational systems programming language behind modern OS',
    longDescription: 'Foundational course on C programming covering procedural concepts, memory management, and system-level programming for building efficient applications.',
    icon: '⚙️',
    color: 'from-gray-500 to-slate-600',
    students: 28900,
    rating: 4.5,
    reviews: 720,
    difficulty: 'Intermediate',
    hours: 22,
    prerequisites: [
        'Basic computer literacy',
        'Understanding of algorithms and computational thinking',
        'C compiler installed (GCC, MinGW, or similar)'
    ],
    learningObjectives: [
        'Master C fundamentals and syntax',
        'Understand memory and pointers',
        'Work with arrays, strings, and structures',
        'Implement algorithms efficiently',
        'Debug and optimize C programs',
        'Build system-level software'
    ],
    keyTopics: [
        'Variables & Data Types',
        'Control Flow',
        'Functions & Scope',
        'Pointers',
        'Arrays & Strings',
        'Structures & Unions',
        'File I/O',
        'Dynamic Memory'
    ],
    lessons: [
        {
            id: 1,
            title: 'Introduction to C',
            description: 'Why C is fundamental, setting up, and your first program.',
            difficulty: 'Beginner',
            duration: '9 mins',
            content: `
## Introduction to C Programming

C is one of the oldest and most important programming languages ever created (1972, by Dennis Ritchie at Bell Labs). It is the foundation of modern operating systems like **Linux**, **Windows**, and **macOS**. It is also the parent of C++, Java, and many other languages.

### Why Learn C?
- Gives you deep understanding of how computers work at the memory level.
- OS kernels, embedded systems, and game engines are built in C.
- Teaches you rigorous discipline that makes you a better programmer in any language.

### Structure of a C Program:
<COMPILER>
#include <stdio.h>   // Include Standard I/O library header

// Every C program entry point
int main() {
    // printf outputs to the terminal
    printf("Hello, World!\\n");
    
    // Return 0 signals success to the OS
    return 0;
}
</COMPILER>

### Variables and Primitive Types:
<COMPILER>
#include <stdio.h>

int main() {
    int age = 22;
    float height = 5.9;
    double salary = 75000.50;
    char grade = 'A';
    
    printf("Age: %d\\n", age);
    printf("Height: %.1f\\n", height);
    printf("Grade: %c\\n", grade);
    
    return 0;
}
</COMPILER>

### Size of Data Types:
<COMPILER>
#include <stdio.h>

int main() {
    printf("int: %lu bytes\\n", sizeof(int));
    printf("char: %lu bytes\\n", sizeof(char));
    printf("float: %lu bytes\\n", sizeof(float));
    printf("double: %lu bytes\\n", sizeof(double));
    printf("long: %lu bytes\\n", sizeof(long));
    
    return 0;
}
</COMPILER>
`
        },
        {
            id: 2,
            title: 'Data Types & Variables',
            description: 'Understanding primitive types, type casting, and constants.',
            content: `
## Data Types in C

C is a **statically typed** language, meaning you must declare the type of a variable before using it.

### Primitive Data Types:
<COMPILER>
#include <stdio.h>
#include <limits.h>

int main() {
    // Integer types with their ranges
    char c = 'X';           // 1 byte, range -128 to 127
    short s = 32000;        // 2 bytes
    int i = 2147483647;     // 4 bytes (largest int)
    long l = 9223372036854775807L;  // 8 bytes (with L suffix)
    
    // Floating point
    float f = 3.14f;        // 4 bytes (with f suffix)
    double d = 3.14159;     // 8 bytes (default for decimals)
    
    printf("char: %c\\n", c);
    printf("int: %d\\n", i);
    printf("float: %.2f\\n", f);
    printf("double: %.5f\\n", d);
    
    return 0;
}
</COMPILER>

### Type Casting:
<COMPILER>
#include <stdio.h>

int main() {
    // Implicit casting (automatic, may lose data)
    int x = 10;
    double y = x;  // int automatically converted to double
    printf("y = %.1f\\n", y);  // 10.0
    
    // Explicit casting (programmer controls)
    double a = 3.7;
    int b = (int)a;  // Explicit cast, loses decimal part
    printf("b = %d\\n", b);  // 3
    
    // Arithmetic with different types
    int num = 10;
    double result = num / 3.0;  // 3.333... (one operand is double)
    printf("result = %.2f\\n", result);  // 3.33
    
    return 0;
}
</COMPILER>

### Constants and Qualifiers:
<COMPILER>
#include <stdio.h>

int main() {
    // const — value cannot be changed after initialization
    const int MAX_USERS = 100;
    const float PI = 3.14159f;
    
    printf("MAX_USERS = %d\\n", MAX_USERS);
    printf("PI = %.5f\\n", PI);
    
    // Using #define for compile-time constants
    #define BUFFER_SIZE 256
    printf("BUFFER_SIZE = %d\\n", BUFFER_SIZE);
    
    // volatile — compiler should not optimize this variable
    volatile int sensor_reading = 100;
    
    return 0;
}
</COMPILER>
`
        },
        {
            id: 3,
            title: 'Operators & Expressions',
            description: 'Arithmetic, logical, bitwise, and comparison operators.',
            content: `
## Operators in C

### Arithmetic Operators:
<COMPILER>
#include <stdio.h>

int main() {
    int a = 10, b = 3;
    
    printf("a = %d, b = %d\\n", a, b);
    printf("a + b = %d\\n", a + b);    // 13
    printf("a - b = %d\\n", a - b);    // 7
    printf("a * b = %d\\n", a * b);    // 30
    printf("a / b = %d\\n", a / b);    // 3 (integer division)
    printf("a %% b = %d\\n", a % b);   // 1 (modulo)
    
    return 0;
}
</COMPILER>

### Comparison & Logical Operators:
<COMPILER>
#include <stdio.h>

int main() {
    int a = 5, b = 3;
    
    // Comparison (returns 1 for true, 0 for false)
    printf("a > b: %d\\n", a > b);     // 1 (true)
    printf("a == b: %d\\n", a == b);   // 0 (false)
    printf("a != b: %d\\n", a != b);   // 1 (true)
    
    // Logical operators
    printf("a > 3 && b > 2: %d\\n", (a > 3) && (b > 2));  // 1 (AND)
    printf("a > 10 || b > 2: %d\\n", (a > 10) || (b > 2));  // 1 (OR)
    printf("!(a > 10): %d\\n", !(a > 10));  // 1 (NOT)
    
    return 0;
}
</COMPILER>

### Bitwise Operators:
<COMPILER>
#include <stdio.h>

int main() {
    int a = 5;   // 0101 in binary
    int b = 3;   // 0011 in binary
    
    printf("a = %d (binary: 0101)\\n", a);
    printf("b = %d (binary: 0011)\\n", b);
    printf("a & b = %d (AND: 0001)\\n", a & b);     // 1
    printf("a | b = %d (OR: 0111)\\n", a | b);      // 7
    printf("a ^ b = %d (XOR: 0110)\\n", a ^ b);     // 6
    printf("~a = %d (NOT)\\n", ~a);                  // -6
    printf("a << 1 = %d (left shift)\\n", a << 1);  // 10
    printf("a >> 1 = %d (right shift)\\n", a >> 1); // 2
    
    return 0;
}
</COMPILER>

### Increment/Decrement & Ternary:
<COMPILER>
#include <stdio.h>

int main() {
    int x = 5;
    
    printf("x = %d\\n", x);
    printf("x++ = %d, then x = %d\\n", x++, x);  // Post-increment
    
    x = 5;
    printf("++x = %d, then x = %d\\n", ++x, x);  // Pre-increment
    
    // Ternary operator: condition ? true_val : false_val
    int age = 20;
    char *status = (age >= 18) ? "Adult" : "Minor";
    printf("Status: %s\\n", status);
    
    return 0;
}
</COMPILER>
`
        },
        {
            id: 4,
            title: 'Pointers & Memory Management',
            description: 'The core differentiator of C: manual memory management.',
            content: `
## Pointers in C

Pointers are arguably the most powerful—and most feared—feature of C. A pointer is a variable that stores the **memory address** of another variable.

### The Address (&) and Dereference (*) Operators:
<COMPILER>
#include <stdio.h>

int main() {
    int x = 10;
    int *p = &x;  // p stores the address of x
    
    printf("Value of x:   %d\\n", x);      // 10
    printf("Address of x: %p\\n", &x);     // e.g. 0x7ffc...
    printf("Value of p:   %p\\n", p);      // Same address
    printf("*p (deref):   %d\\n", *p);     // 10 — read value at address
    
    *p = 99;  // Change the value AT that address
    printf("x is now: %d\\n", x);           // 99!
    
    return 0;
}
</COMPILER>

### Dynamic Memory Allocation:
<COMPILER>
#include <stdio.h>
#include <stdlib.h>

int main() {
    // Allocate space for 5 integers on the heap
    int *arr = (int*) malloc(5 * sizeof(int));
    
    // Always check if allocation succeeded!
    if (arr == NULL) {
        printf("Memory allocation failed!\\n");
        return 1;
    }
    
    // Use the array
    for (int i = 0; i < 5; i++) {
        arr[i] = i * 10;
        printf("arr[%d] = %d\\n", i, arr[i]);
    }
    
    // ALWAYS free heap memory — no garbage collector in C!
    free(arr);
    arr = NULL;  // Good practice: set to NULL after freeing
    
    return 0;
}
</COMPILER>

### Pointer Arithmetic:
<COMPILER>
#include <stdio.h>

int main() {
    int arr[5] = {10, 20, 30, 40, 50};
    int *p = arr;  // Array name IS already a pointer to first element
    
    printf("*p = %d\\n", *p);       // 10 (first element)
    printf("*(p+1) = %d\\n", *(p+1));  // 20 (second element)
    printf("*(p+4) = %d\\n", *(p+4));  // 50 (fifth element)
    
    // Array indexing is pointer arithmetic!
    printf("p[0] = %d\\n", p[0]);   // 10
    printf("p[2] = %d\\n", p[2]);   // 30
    
    return 0;
}
</COMPILER>
`
        },
        {
            id: 5,
            title: 'Arrays & Strings',
            description: 'Working with arrays and null-terminated character strings.',
            content: `
## Arrays in C

An array is a fixed-size collection of elements of the same type stored in contiguous memory.

### Single and Multi-dimensional Arrays:
<COMPILER>
#include <stdio.h>

int main() {
    // 1D Array
    int numbers[5] = {10, 20, 30, 40, 50};
    
    printf("1D Array access:\\n");
    for (int i = 0; i < 5; i++) {
        printf("numbers[%d] = %d\\n", i, numbers[i]);
    }
    
    // 2D Array
    int matrix[2][3] = {
        {1, 2, 3},
        {4, 5, 6}
    };
    
    printf("\\n2D Array access:\\n");
    printf("matrix[0][1] = %d\\n", matrix[0][1]);  // 2
    printf("matrix[1][2] = %d\\n", matrix[1][2]);  // 6
    
    return 0;
}
</COMPILER>

### Strings (Character Arrays):
<COMPILER>
#include <stdio.h>
#include <string.h>

int main() {
    // Strings are null-terminated character arrays
    char str1[20] = "Hello, World!";
    char str2[] = "C Programming";  // Size auto-calculated
    
    printf("str1: %s\\n", str1);
    printf("str2: %s\\n", str2);
    printf("Length of str1: %lu\\n", strlen(str1));  // 13
    
    // String functions
    char dest[50];
    strcpy(dest, str1);  // Copy str1 to dest
    printf("After copy: %s\\n", dest);
    
    strcat(dest, " ");   // Concatenate
    strcat(dest, str2);
    printf("After concat: %s\\n", dest);
    
    return 0;
}
</COMPILER>

### String Input/Output:
<COMPILER>
#include <stdio.h>

int main() {
    char name[50];
    
    printf("Enter your name: ");
    fgets(name, sizeof(name), stdin);  // Safe way to read strings
    
    // fgets includes the newline, so we often remove it
    size_t len = 0;
    if (name[len = strlen(name) - 1] == '\\n')
        name[len] = '\\0';
    
    printf("Hello, %s!\\n", name);
    
    return 0;
}
</COMPILER>
`
        },
        {
            id: 6,
            title: 'Control Flow: Conditionals',
            description: 'if, else if, else, switch statements, and control logic.',
            content: `
## Control Flow: Conditionals

### if, else if, else Statements:
<COMPILER>
#include <stdio.h>

int main() {
    int score = 85;
    
    if (score >= 90) {
        printf("Grade: A\\n");
    } else if (score >= 80) {
        printf("Grade: B\\n");
    } else if (score >= 70) {
        printf("Grade: C\\n");
    } else {
        printf("Grade: F\\n");
    }
    
    return 0;
}
</COMPILER>

### Switch Statement:
<COMPILER>
#include <stdio.h>

int main() {
    int day = 3;
    
    switch (day) {
        case 1:
            printf("Monday\\n");
            break;
        case 2:
            printf("Tuesday\\n");
            break;
        case 3:
            printf("Wednesday\\n");
            break;
        case 4:
            printf("Thursday\\n");
            break;
        case 5:
            printf("Friday\\n");
            break;
        default:
            printf("Weekend\\n");
    }
    
    return 0;
}
</COMPILER>

### Nested Conditionals:
<COMPILER>
#include <stdio.h>

int main() {
    int age = 20;
    int has_license = 1;  // 1 = true, 0 = false
    
    if (age >= 18) {
        if (has_license) {
            printf("You can drive!\\n");
        } else {
            printf("Get a license first.\\n");
        }
    } else {
        printf("Too young to drive.\\n");
    }
    
    return 0;
}
</COMPILER>
`
        },
        {
            id: 7,
            title: 'Loops: for, while, do-while',
            description: 'Iterating with different loop constructs.',
            content: `
## Loop Constructs

### for Loop:
<COMPILER>
#include <stdio.h>

int main() {
    // Basic for loop
    printf("Counting 0 to 4:\\n");
    for (int i = 0; i < 5; i++) {
        printf("%d ", i);
    }
    printf("\\n");
    
    // Nested loops
    printf("\\n2x2 Grid:\\n");
    for (int i = 0; i < 2; i++) {
        for (int j = 0; j < 2; j++) {
            printf("(%d,%d) ", i, j);
        }
        printf("\\n");
    }
    
    return 0;
}
</COMPILER>

### while and do-while Loops:
<COMPILER>
#include <stdio.h>

int main() {
    // while loop
    int count = 0;
    printf("while loop:\\n");
    while (count < 3) {
        printf("count = %d\\n", count);
        count++;
    }
    
    // do-while (always executes at least once)
    printf("\\ndo-while loop:\\n");
    int x = 0;
    do {
        printf("x = %d\\n", x);
        x++;
    } while (x < 3);
    
    return 0;
}
</COMPILER>

### Loop Control: break and continue:
<COMPILER>
#include <stdio.h>

int main() {
    // break — exits loop early
    printf("Loop with break:\\n");
    for (int i = 0; i < 10; i++) {
        if (i == 5) {
            printf("Breaking at i = 5\\n");
            break;
        }
        printf("i = %d\\n", i);
    }
    
    // continue — skip to next iteration
    printf("\\nLoop with continue:\\n");
    for (int i = 0; i < 5; i++) {
        if (i == 2) {
            printf("Skipping i = 2\\n");
            continue;
        }
        printf("i = %d\\n", i);
    }
    
    return 0;
}
</COMPILER>
`
        },
        {
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
        },
        {
            id: 9,
            title: 'Structures & Unions',
            description: 'Creating custom data types with struct and union.',
            content: `
## Structures in C

A struct is a composite data type that groups variables of different types together.

### Defining and Using Structures:
<COMPILER>
#include <stdio.h>
#include <string.h>

// Define a structure
struct Student {
    int id;
    char name[50];
    float gpa;
};

int main() {
    // Create a struct variable
    struct Student student1;
    student1.id = 101;
    strcpy(student1.name, "Alice");
    student1.gpa = 3.9f;
    
    // Access members
    printf("ID: %d\\n", student1.id);
    printf("Name: %s\\n", student1.name);
    printf("GPA: %.2f\\n", student1.gpa);
    
    return 0;
}
</COMPILER>

### Pointers to Structures:
<COMPILER>
#include <stdio.h>
#include <malloc.h>
#include <string.h>

struct Person {
    int age;
    char name[30];
};

int main() {
    // Allocate struct on heap
    struct Person *p = (struct Person*) malloc(sizeof(struct Person));
    
    if (p != NULL) {
        // Access via pointer using -> operator
        p->age = 25;
        strcpy(p->name, "Bob");
        
        printf("Age: %d\\n", p->age);
        printf("Name: %s\\n", p->name);
        
        free(p);
    }
    
    return 0;
}
</COMPILER>

### Unions (Alternative to struct):
<COMPILER>
#include <stdio.h>

// Union shares memory — only one member active at a time
union Data {
    int intVal;
    float floatVal;
    char charVal;
};

int main() {
    union Data data;
    
    printf("Size of union: %lu bytes\\n", sizeof(union Data));  // 4 (size of largest member)
    
    data.intVal = 10;
    printf("intVal: %d\\n", data.intVal);
    
    data.floatVal = 3.14f;  // Overwrites intVal!
    printf("floatVal: %.2f\\n", data.floatVal);
    printf("intVal now: %d\\n", data.intVal);  // Garbage!
    
    return 0;
}
</COMPILER>
`
        },
        {
            id: 10,
            title: 'File I/O & Streams',
            description: 'Reading and writing files using fopen, fread, fwrite.',
            content: `
## File Input/Output

### Reading and Writing Text Files:
<COMPILER>
#include <stdio.h>

int main() {
    // Writing to a file
    FILE *file = fopen("output.txt", "w");
    
    if (file == NULL) {
        printf("Error opening file!\\n");
        return 1;
    }
    
    fprintf(file, "Hello, World!\\n");
    fprintf(file, "This is line 2\\n");
    fprintf(file, "Goodbye!\\n");
    
    fclose(file);
    printf("File written successfully!\\n");
    
    return 0;
}
</COMPILER>

### Reading from a File:
<COMPILER>
#include <stdio.h>

int main() {
    FILE *file = fopen("output.txt", "r");
    
    if (file == NULL) {
        printf("Error opening file!\\n");
        return 1;
    }
    
    char line[100];
    printf("Reading file:\\n");
    while (fgets(line, sizeof(line), file) != NULL) {
        printf("%s", line);
    }
    
    fclose(file);
    
    return 0;
}
</COMPILER>

### Binary File Operations:
<COMPILER>
#include <stdio.h>
#include <stdlib.h>

struct Record {
    int id;
    char name[50];
};

int main() {
    // Write binary data
    FILE *file = fopen("records.bin", "wb");
    
    struct Record r1 = {1, "Alice"};
    struct Record r2 = {2, "Bob"};
    
    fwrite(&r1, sizeof(struct Record), 1, file);
    fwrite(&r2, sizeof(struct Record), 1, file);
    fclose(file);
    
    // Read binary data
    file = fopen("records.bin", "rb");
    struct Record temp;
    
    printf("Reading records:\\n");
    while (fread(&temp, sizeof(struct Record), 1, file) == 1) {
        printf("ID: %d, Name: %s\\n", temp.id, temp.name);
    }
    
    fclose(file);
    
    return 0;
}
</COMPILER>
`
        },
        {
            id: 11,
            title: 'Preprocessor Directives & Macros',
            description: '#define, #ifdef, #include, and conditional compilation.',
            content: `
## Preprocessor Directives

The C preprocessor processes the source code before compilation.

### #define and Macros:
<COMPILER>
#include <stdio.h>

// Object-like macro
#define PI 3.14159f
#define MAX_SIZE 100

// Function-like macro
#define SQUARE(x) ((x) * (x))
#define MIN(a, b) ((a) < (b) ? (a) : (b))

int main() {
    float radius = 5.0f;
    float area = PI * SQUARE(radius);
    printf("Area of circle: %.2f\\n", area);
    
    int x = 10, y = 20;
    printf("MIN(10, 20) = %d\\n", MIN(x, y));  // 10
    
    printf("MAX_SIZE = %d\\n", MAX_SIZE);
    
    return 0;
}
</COMPILER>

### Conditional Compilation (#ifdef, #ifndef):
<COMPILER>
#include <stdio.h>

#define DEBUG
// Uncomment above to toggle debug mode

int main() {
#ifdef DEBUG
    printf("Debug mode is ON\\n");
#else
    printf("Debug mode is OFF\\n");
#endif

#if defined(DEBUG)
    printf("Compiling with DEBUG enabled\\n");
    int x = 42;
    printf("Debug value: %d\\n", x);
#endif
    
    return 0;
}
</COMPILER>

### #include Guard (Header Files):
<COMPILER>
// This would normally be in a header file (myheader.h)
// To show how #ifndef prevents double inclusion

#ifndef MY_HEADER_H
#define MY_HEADER_H

// Function declarations here
void my_function(void);

#endif  // MY_HEADER_H

#include <stdio.h>

void my_function(void) {
    printf("Function from header!\\n");
}

int main() {
    my_function();
    return 0;
}
</COMPILER>
`
        },
        {
            id: 12,
            title: 'Advanced Pointers & Function Pointers',
            description: 'Pointers to pointers, function pointers, and callbacks.',
            content: `
## Advanced Pointer Concepts

### Pointers to Pointers:
<COMPILER>
#include <stdio.h>

int main() {
    int x = 10;
    int *p = &x;      // Pointer to int
    int **pp = &p;    // Pointer to pointer to int
    
    printf("x = %d\\n", x);
    printf("*p = %d\\n", *p);      // 10
    printf("**pp = %d\\n", **pp);  // 10
    
    // Modify x through pp
    **pp = 99;
    printf("x is now: %d\\n", x);  // 99
    
    return 0;
}
</COMPILER>

### Function Pointers:
<COMPILER>
#include <stdio.h>

int add(int a, int b) {
    return a + b;
}

int multiply(int a, int b) {
    return a * b;
}

int main() {
    // Declare function pointer
    int (*operation)(int, int);
    
    // Point to add function
    operation = add;
    printf("add(5, 3) = %d\\n", operation(5, 3));  // 8
    
    // Point to multiply function
    operation = multiply;
    printf("multiply(5, 3) = %d\\n", operation(5, 3));  // 15
    
    return 0;
}
</COMPILER>

### Callbacks Using Function Pointers:
<COMPILER>
#include <stdio.h>

typedef int (*Comparator)(int, int);

int ascending(int a, int b) {
    return a - b;
}

int descending(int a, int b) {
    return b - a;
}

void sort_with_callback(int arr[], int n, Comparator compare) {
    for (int i = 0; i < n - 1; i++) {
        for (int j = 0; j < n - i - 1; j++) {
            if (compare(arr[j], arr[j + 1]) > 0) {
                int temp = arr[j];
                arr[j] = arr[j + 1];
                arr[j + 1] = temp;
            }
        }
    }
}

int main() {
    int arr[] = {5, 2, 8, 1, 9};
    int n = 5;
    
    printf("Original: ");
    for (int i = 0; i < n; i++) printf("%d ", arr[i]);
    printf("\\n");
    
    sort_with_callback(arr, n, ascending);
    printf("Ascending: ");
    for (int i = 0; i < n; i++) printf("%d ", arr[i]);
    printf("\\n");
    
    return 0;
}
</COMPILER>

### Array of Function Pointers:
<COMPILER>
#include <stdio.h>

int add(int a, int b) { return a + b; }
int sub(int a, int b) { return a - b; }
int mul(int a, int b) { return a * b; }

int main() {
    // Array of function pointers
    int (*operations[3])(int, int) = {add, sub, mul};
    
    printf("10 + 5 = %d\\n", operations[0](10, 5));  // add
    printf("10 - 5 = %d\\n", operations[1](10, 5));  // sub
    printf("10 * 5 = %d\\n", operations[2](10, 5));  // mul
    
    return 0;
}
</COMPILER>
`
        }
    ]
};
