export const cLesson1 = {
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
};