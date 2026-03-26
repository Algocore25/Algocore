export const cLesson2 = {
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
};