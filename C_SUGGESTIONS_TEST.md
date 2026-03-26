# C Language Suggestions Test

## Test Code for C Suggestions

```c
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

int main() {
    // Local variables to test
    int number = 42;
    char *message = "Hello World";
    double pi = 3.14159;
    int array[10];
    FILE *file;
    
    // Test local variable suggestions
    printf("Number: %d\n", number);
    printf("Message: %s\n", message);
    printf("Pi: %f\n", pi);
    
    // Test function suggestions
    file = fopen("test.txt", "w");
    if (file != NULL) {
        fprintf(file, "%s", message);
        fclose(file);
    }
    
    // Test memory function suggestions
    char *buffer = (char*)malloc(100);
    if (buffer != NULL) {
        memset(buffer, 0, 100);
        strcpy(buffer, message);
        printf("Buffer: %s\n", buffer);
        free(buffer);
    }
    
    return 0;
}

// Test function with parameters
void process_data(int data, char *text) {
    // Parameters should appear in suggestions
    printf("Processing: %d, %s\n", data, text);
}

// Test struct definition
typedef struct {
    int id;
    char name[50];
    double score;
} Student;

void test_struct() {
    Student student;
    student.id = 1;
    strcpy(student.name, "John Doe");
    student.score = 95.5;
    
    // Struct member suggestions
    printf("Student: %d, %s, %f\n", student.id, student.name, student.score);
}
```

## Expected Suggestions

### Keywords
- auto, break, case, char, const, continue, default, do
- double, else, enum, extern, float, for, goto, if
- int, long, register, return, short, signed, sizeof, static
- struct, switch, typedef, union, unsigned, void, volatile, while
- true, false, NULL

### Snippets
- #include <stdio.h>, #include <stdlib.h>, etc.
- main() function skeleton
- for, while, if-else loops
- struct, typedef definitions
- printf, scanf, malloc, free

### Functions
- printf, scanf, fprintf, fscanf, sprintf, sscanf
- malloc, calloc, realloc, free
- memcpy, memset, memmove, memcmp
- strlen, strcpy, strncpy, strcat, strncat, strcmp, strncmp
- strchr, strstr, atoi, atof, atol
- abs, labs, fabs, sqrt, pow, sin, cos, tan
- rand, srand, time, clock
- fopen, fclose, fread, fwrite, fseek, ftell

### Local Variables
When typing in the function, you should see:
- `number`, `message`, `pi`, `array`, `file` (in main)
- `data`, `text` (in process_data)
- `student` (in test_struct)

## Testing Steps

1. Open the code editor with C language
2. Paste the test code above
3. Try typing:
   - `pri` → should suggest `printf`
   - `num` → should suggest `number` (local variable)
   - `mes` → should suggest `message` (local variable)
   - `inc` → should suggest `#include <...>`
   - `for` → should suggest for loop snippet
   - `struct` → should suggest struct snippet

## Expected Behavior

✅ C-specific keywords appear
✅ C standard library functions appear
✅ Local variables appear in suggestions
✅ Code snippets work for C patterns
✅ Function parameters are detected
✅ Struct members are accessible after dot operator
