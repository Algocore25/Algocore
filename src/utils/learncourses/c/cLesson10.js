export const cLesson10 = {
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
};