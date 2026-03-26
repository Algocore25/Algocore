export const cLesson3 = {
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
};