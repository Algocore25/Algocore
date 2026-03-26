export const cLesson9 = {
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
};