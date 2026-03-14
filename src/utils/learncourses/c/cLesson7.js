export const cLesson7 = {
  id: 7,
  title: 'Loops: for, while, do-while',
  description: 'Iterating with different loop constructs.',
  content: `
## Loop Constructs

### for Loop:
<COMPILER>
#include <stdio.h>

int main() {
    // Basic for loop
    printf("Counting 0 to 4:\\n");
    for (int i = 0; i < 5; i++) {
        printf("%d ", i);
    }
    printf("\\n");
    
    // Nested loops
    printf("\\n2x2 Grid:\\n");
    for (int i = 0; i < 2; i++) {
        for (int j = 0; j < 2; j++) {
            printf("(%d,%d) ", i, j);
        }
        printf("\\n");
    }
    
    return 0;
}
</COMPILER>

### while and do-while Loops:
<COMPILER>
#include <stdio.h>

int main() {
    // while loop
    int count = 0;
    printf("while loop:\\n");
    while (count < 3) {
        printf("count = %d\\n", count);
        count++;
    }
    
    // do-while (always executes at least once)
    printf("\\ndo-while loop:\\n");
    int x = 0;
    do {
        printf("x = %d\\n", x);
        x++;
    } while (x < 3);
    
    return 0;
}
</COMPILER>

### Loop Control: break and continue:
<COMPILER>
#include <stdio.h>

int main() {
    // break — exits loop early
    printf("Loop with break:\\n");
    for (int i = 0; i < 10; i++) {
        if (i == 5) {
            printf("Breaking at i = 5\\n");
            break;
        }
        printf("i = %d\\n", i);
    }
    
    // continue — skip to next iteration
    printf("\\nLoop with continue:\\n");
    for (int i = 0; i < 5; i++) {
        if (i == 2) {
            printf("Skipping i = 2\\n");
            continue;
        }
        printf("i = %d\\n", i);
    }
    
    return 0;
}
</COMPILER>
`
};