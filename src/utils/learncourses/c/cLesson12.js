export const cLesson12 = {
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
};