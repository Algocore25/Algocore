export const cLesson11 = {
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
};