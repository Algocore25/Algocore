export const javaLesson6 = {
  id: 6,
  title: 'Exception Handling',
  description: 'Managing runtime errors in Java',
  content: `
## Exception Handling in Java

An exception is an unwanted or unexpected event occurring during the execution of a program (at runtime) that disrupts the normal flow of instructions.

### The Exception Hierarchy
All exception and error types are subclasses of class \`Throwable\`.
1. **Error**: Severe problems the application shouldn't try to catch (e.g., \`OutOfMemoryError\`).
2. **Exception**: Conditions that a reasonable application might try to catch.
   - **Checked Exceptions**: Checked at compile-time (e.g., \`IOException\`).
   - **Unchecked Exceptions (Runtime Exceptions)**: Checked at runtime (e.g., \`NullPointerException\`, \`ArithmeticException\`).

### \`try-catch-finally\` block:

<COMPILER>
public class ExceptionDemo {
    public static void main(String[] args) {
        try {
            // Monitor this block for exceptions
            int[] numbers = {1, 2, 3};
            System.out.println("Array length: " + numbers.length);
            System.out.println(numbers[5]);  // ArrayIndexOutOfBoundsException!
        } catch (ArrayIndexOutOfBoundsException e) {
            // Handle the exception
            System.out.println("Error: Index out of bounds!");
        } finally {
            // This block ALWAYS executes, regardless of exception
            System.out.println("Cleanup completed...");
        }
    }
}
</COMPILER>

### \`throw\` vs \`throws\`
- **\`throw\`**: Used to explicitly throw an exception from within a method.
- **\`throws\`**: Used in a method signature to declare that the method *might* throw an exception (leaving the caller to handle it).

\`\`\`java
public class AgeValidator {
    // 'throws' indicates potential failure
    public static void validateAge(int age) throws Exception {
        if (age < 18) {
            // 'throw' physically throws the error object
            throw new Exception("Age must be at least 18");
        }
        System.out.println("Access granted.");
    }
    
    public static void main(String[] args) {
        try {
            validateAge(15);
        } catch (Exception e) {
            System.out.println(e.getMessage());
        }
    }
}
\`\`\`
`
};