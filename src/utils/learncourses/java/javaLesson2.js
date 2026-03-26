export const javaLesson2 = {
  id: 2,
  title: 'Variables & Data Types',
  description: 'Understanding primitive types, operators, and memory in Java.',
  content: `
## Variables & Data Types in Java

In Java, every variable has a type that dictates how much memory it uses and what kind of values it can hold. Java is strongly typed!

### Primitive Data Types:
Java has 8 primitive data types divided into four categories:

1. **Integer Types**:
   - \`byte\`: 1 byte (8 bits) | Range: -128 to 127
   - \`short\`: 2 bytes | Range: -32,768 to 32,767
   - \`int\`: 4 bytes | (Default for whole numbers)
   - \`long\`: 8 bytes | Requires 'L' suffix
2. **Floating-point Types**:
   - \`float\`: 4 bytes | Requires 'f' suffix
   - \`double\`: 8 bytes | (Default for decimals)
3. **Character Type**:
   - \`char\`: 2 bytes | Stores a single Unicode character
4. **Boolean Type**:
   - \`boolean\`: size not precisely defined | \`true\` or \`false\`

### Practice with Data Types:

<COMPILER>
public class DataTypeDemo {
    public static void main(String[] args) {
        // Integer types
        byte b = 100;
        short s = 1000;
        int age = 25;
        long population = 7800000000L;
        
        // Floating-point types
        float height = 5.9f;
        double pi = 3.14159;
        
        // Character and Boolean
        char grade = 'A';
        boolean isStudent = true;
        
        // Print values
        System.out.println("Age: " + age);
        System.out.println("Height: " + height);
        System.out.println("Grade: " + grade);
        System.out.println("Is Student: " + isStudent);
    }
}
</COMPILER>

### Non-Primitive Types (Reference Types):
These include Classes, Interfaces, and Arrays.
\`\`\`java
String message = "Hello Java";
int[] numbers = {1, 2, 3, 4, 5};
\`\`\`

### Type Casting:
- **Widening (Implicit)**: Smaller type to larger type (e.g., \`int\` -> \`long\`). Happens automatically.
- **Narrowing (Explicit)**: Larger type to smaller type (e.g., \`double\` -> \`int\`). Requires explicit casting.

\`\`\`java
// Widening
int x = 10;
double y = x; // y is 10.0

// Narrowing
double a = 9.78;
int b = (int) a; // b is 9 (loses the fractional part)
\`\`\`

### Operators in Java:
- **Arithmetic**: \`+\`, \`-\`, \`*\`, \`/\`, \`%\`
- **Relational**: \`==\`, \`!=\`, \`>\`, \`<\`, \`>=\`, \`<=\`
- **Logical**: \`&&\` (AND), \`||\` (OR), \`!\` (NOT)
- **Increment/Decrement**: \`++\`, \`--\`
`
};