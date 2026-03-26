export const cLesson4 = {
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
};