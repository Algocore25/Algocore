export const javaLesson7 = {
  id: 7,
  title: 'Collections Framework',
  description: 'Lists, Sets, Maps, and Generics',
  content: `
## Collections and Generics in Java

Collections are structures that store and manage groups of objects. Generics provide type safety, ensuring you don't stick a \`Dog\` object into a \`Cat\` collection.

### Collections Framework Interface Hierarchy:
- **Iterable** -> **Collection** -> (List, Set, Queue)
- **Map** is a separate branch but part of the framework.

### 1. List Interface (Ordered, Allows Duplicates)
Most commonly used lists: \`ArrayList\` (fast random access), \`LinkedList\` (fast insertions/deletions).

<COMPILER>
import java.util.ArrayList;
import java.util.List;

public class ListDemo {
    public static void main(String[] args) {
        List<String> fruits = new ArrayList<>();
        fruits.add("Apple");
        fruits.add("Banana");
        fruits.add("Orange");
        fruits.add("Apple");  // Duplicates allowed
        
        System.out.println("Fruits: " + fruits);
        System.out.println("Size: " + fruits.size());
        System.out.println("First fruit: " + fruits.get(0));
        
        fruits.remove("Banana");
        System.out.println("After removal: " + fruits);
    }
}
</COMPILER>

### 2. Set Interface (Unordered, No Duplicates)
Commonly used: \`HashSet\` (fastest), \`TreeSet\` (sorted).

\`\`\`java
Set<String> set = new HashSet<>();
set.add("Apple");
set.add("Banana");
set.add("Apple"); // Gets ignored silently

System.out.println(set.size()); // 2
\`\`\`

### 3. Map (Key-Value Pairs, No Duplicate Keys)
Commonly used: \`HashMap\` (fast key lookups), \`TreeMap\` (sorted by keys).

<COMPILER>
import java.util.HashMap;
import java.util.Map;

public class MapDemo {
    public static void main(String[] args) {
        Map<String, Integer> ages = new HashMap<>();
        ages.put("John", 25);
        ages.put("Jane", 23);
        ages.put("Bob", 30);
        
        System.out.println("Ages: " + ages);
        System.out.println("John's age: " + ages.get("John"));
        
        // Iterating over a Map
        for (Map.Entry<String, Integer> entry : ages.entrySet()) {
            System.out.println(entry.getKey() + ": " + entry.getValue());
        }
    }
}
</COMPILER>

### Generics
Generics allow you to create reusable code that works with different data types safely!
\`\`\`java
// Generic Class
public class Box<T> {
    private T content;
    
    public void add(T item) { content = item; }
    public T get() { return content; }
}

// Usage
Box<String> stringBox = new Box<>();
stringBox.add("Hello");

Box<Integer> intBox = new Box<>();
intBox.add(42);
\`\`\`
`
};