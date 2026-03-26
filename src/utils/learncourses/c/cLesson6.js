export const cLesson6 = {
  id: 6,
  title: 'Control Flow: Conditionals',
  description: 'if, else if, else, switch statements, and control logic.',
  content: `
## Control Flow: Conditionals

### if, else if, else Statements:
<COMPILER>
#include <stdio.h>

int main() {
    int score = 85;
    
    if (score >= 90) {
        printf("Grade: A\\n");
    } else if (score >= 80) {
        printf("Grade: B\\n");
    } else if (score >= 70) {
        printf("Grade: C\\n");
    } else {
        printf("Grade: F\\n");
    }
    
    return 0;
}
</COMPILER>

### Switch Statement:
<COMPILER>
#include <stdio.h>

int main() {
    int day = 3;
    
    switch (day) {
        case 1:
            printf("Monday\\n");
            break;
        case 2:
            printf("Tuesday\\n");
            break;
        case 3:
            printf("Wednesday\\n");
            break;
        case 4:
            printf("Thursday\\n");
            break;
        case 5:
            printf("Friday\\n");
            break;
        default:
            printf("Weekend\\n");
    }
    
    return 0;
}
</COMPILER>

### Nested Conditionals:
<COMPILER>
#include <stdio.h>

int main() {
    int age = 20;
    int has_license = 1;  // 1 = true, 0 = false
    
    if (age >= 18) {
        if (has_license) {
            printf("You can drive!\\n");
        } else {
            printf("Get a license first.\\n");
        }
    } else {
        printf("Too young to drive.\\n");
    }
    
    return 0;
}
</COMPILER>
`
};