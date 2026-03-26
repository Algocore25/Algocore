export const javaLesson3 = {
  id: 3,
  title: 'Control Flow (Loops & Conditionals)',
  description: 'Controlling execution flow with if-statements and loops.',
  content: `
## Control Flow in Java

Control flow statements dictate the order in which code logic executes in your programs.

### 1. Conditional Statements
These execute blocks of code based on a condition (a boolean expression).

#### If-Else Blocks:

<COMPILER>
public class GradeChecker {
    public static void main(String[] args) {
        int score = 85;
        
        if (score >= 90) {
            System.out.println("Grade: A");
        } else if (score >= 80) {
            System.out.println("Grade: B");
        } else if (score >= 70) {
            System.out.println("Grade: C");
        } else {
            System.out.println("Grade: F");
        }
    }
}
</COMPILER>

#### Switch Statement:
A cleaner alternative to multiple \`else if\` statements, operating typically on simple data types like \`int\`, \`char\`, or \`String\`.
\`\`\`java
int day = 3;
switch (day) {
    case 1:
        System.out.println("Monday");
        break;
    case 2:
        System.out.println("Tuesday");
        break;
    case 3:
        System.out.println("Wednesday");
        break;
    default:
        System.out.println("Other day");
}
\`\`\`

### 2. Looping Constructs
Loops execute a block of code repeatedly.

#### The 'For' Loop:
Best used when you know exactly how many times you want to iterate.

<COMPILER>
public class ForLoopDemo {
    public static void main(String[] args) {
        // Simple for loop
        System.out.println("Numbers from 1 to 5:");
        for (int i = 1; i <= 5; i++) {
            System.out.print(i + " ");
        }
        
        System.out.println("\\n\\nMultiplication Table of 5:");
        for (int i = 1; i <= 10; i++) {
            System.out.println("5 x " + i + " = " + (5 * i));
        }
    }
}
</COMPILER>

#### The 'While' Loop:
Executes the block as long as the condition evaluates to true.
\`\`\`java
int i = 0;
while (i < 5) {
    System.out.println(i);
    i++;
}
\`\`\`

#### The 'Do-While' Loop:
Similar to a while loop, but it guarantees that the code block is executed at least once (since condition is evaluated at the end).
\`\`\`java
int j = 0;
do {
    System.out.println("Will run once!");
    j++;
} while (j < 0);
\`\`\`

### 3. Jump Statements
- \`break\`: Exits the loop completely.
- \`continue\`: Skips the current iteration and forces the loop to proceed to the next iteration.
`
};