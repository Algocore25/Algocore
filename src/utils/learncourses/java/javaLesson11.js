export const javaLesson11 = {
  id: 11,
  title: 'String Handling & Regular Expressions',
  description: 'Mastering strings, immutability, and pattern matching',
  content: `
## String Handling in Java

Strings are immutable objects in Java, meaning once created, they cannot be changed.

### String Creation and Methods

<COMPILER>
public class StringDemo {
    public static void main(String[] args) {
        String str1 = "Hello";
        String str2 = "World";
        String str3 = new String("Java");
        
        // String concatenation
        String result = str1 + " " + str2;
        System.out.println(result);  // Hello World
        
        // Important String methods
        System.out.println("Length: " + result.length());
        System.out.println("Uppercase: " + result.toUpperCase());
        System.out.println("Lowercase: " + result.toLowerCase());
        System.out.println("Contains 'World': " + result.contains("World"));
        System.out.println("Starts with 'Hello': " + result.startsWith("Hello"));
        
        // Substring
        String sub = result.substring(0, 5);
        System.out.println("Substring: " + sub);  // Hello
        
        // Split
        String[] words = result.split(" ");
        System.out.println("First word: " + words[0]);
        System.out.println("Second word: " + words[1]);
    }
}
</COMPILER>

### StringBuilder vs String
When you need to perform many string modifications, use \`StringBuilder\` (mutable) instead of \`String\` (immutable) for better performance.

\`\`\`java
// SLOW - Creates multiple String objects
String s = "Java";
s += " is";
s += " awesome";

// FAST - Uses a single StringBuilder object
StringBuilder sb = new StringBuilder("Java");
sb.append(" is");
sb.append(" awesome");
String result = sb.toString();
\`\`\`

### Regular Expressions (Regex)
Regex is used for pattern matching and text validation.

<COMPILER>
import java.util.regex.Matcher;
import java.util.regex.Pattern;

public class RegexDemo {
    public static void main(String[] args) {
        String text = "Email: john@example.com, jane@test.org";
        
        // Email pattern
        String emailPattern = "[a-zA-Z0-9]+@[a-zA-Z0-9]+\\\\.[a-zA-Z]{2,}";
        Pattern pattern = Pattern.compile(emailPattern);
        Matcher matcher = pattern.matcher(text);
        
        System.out.println("Emails found:");
        while (matcher.find()) {
            System.out.println("  - " + matcher.group());
        }
        
        // Check if string matches pattern
        String phone = "123-456-7890";
        if (phone.matches("\\\\d{3}-\\\\d{3}-\\\\d{4}")) {
            System.out.println("Valid phone number!");
        }
    }
}
</COMPILER>
`
};