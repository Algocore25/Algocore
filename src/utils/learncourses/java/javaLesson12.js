export const javaLesson12 = {
  id: 12,
  title: 'Testing & Best Practices',
  description: 'Unit testing with JUnit and Java best practices',
  content: `
## Testing and Best Practices in Java

### Unit Testing with JUnit
JUnit is the standard testing framework for Java applications.

\`\`\`java
import org.junit.Test;
import static org.junit.Assert.*;

public class CalculatorTest {
    @Test
    public void testAddition() {
        Calculator calc = new Calculator();
        assertEquals(4, calc.add(2, 2));
    }
    
    @Test
    public void testSubtraction() {
        Calculator calc = new Calculator();
        assertEquals(0, calc.subtract(2, 2));
    }
    
    @Test
    public void testDivisionByZero() {
        Calculator calc = new Calculator();
        assertThrows(ArithmeticException.class, () -> calc.divide(10, 0));
    }
}
\`\`\`

### Java Best Practices:

#### 1. Naming Conventions
- **Classes**: PascalCase (e.g., \`MyClass\`)
- **Methods**: camelCase (e.g., \`myMethod\`)
- **Constants**: UPPER_SNAKE_CASE (e.g., \`MAX_SIZE\`)

#### 2. Object-Oriented Principles
- Keep classes small and focused (Single Responsibility Principle)
- Favor composition over inheritance
- Use interfaces to define contracts
- Avoid magic numbers (use named constants)

#### 3. Code Style Guide

<COMPILER>
public class BestPracticesExample {
    // Constants - Always uppercase
    private static final int MAX_ATTEMPTS = 3;
    private static final String APP_NAME = "MyApp";
    
    // Instance variables - describe what they hold
    private String username;
    private int userAge;
    
    // Constructor - Initialize all variables
    public BestPracticesExample(String username, int userAge) {
        this.username = username;
        this.userAge = userAge;
    }
    
    // Methods - Do one thing well
    public boolean isValidAge() {
        return userAge >= 18 && userAge <= 100;
    }
    
    // Proper error handling
    public void processData(String data) throws IllegalArgumentException {
        if (data == null || data.isEmpty()) {
            throw new IllegalArgumentException("Data cannot be null or empty");
        }
        System.out.println("Processing: " + data);
    }
    
    public static void main(String[] args) {
        BestPracticesExample example = new BestPracticesExample("John", 25);
        System.out.println("Valid age: " + example.isValidAge());
    }
}
</COMPILER>

#### 4. Documentation
Always document your code with Javadoc comments:
\`\`\`java
/**
 * Calculates the sum of two numbers.
 * 
 * @param a first number
 * @param b second number
 * @return the sum of a and b
 */
public int add(int a, int b) {
    return a + b;
}
\`\`\`

#### 5. Memory and Performance
- Close resources in  \`finally\` or use try-with-resources
- Avoid creating unnecessary objects
- Use StringBuilder for string concatenation in loops
- Remove unused imports and variables
`
};