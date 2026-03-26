export const cLesson5 = {
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
};