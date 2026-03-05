export const java = {
    id: 'java',
    name: 'Java Programming',
    description: 'Learn Java programming from basics to advanced concepts',
    longDescription: 'Master Java programming with comprehensive coverage of OOP principles, data structures, and real-world application development.',
    icon: '☕',
    color: 'from-orange-400 to-red-500',
    students: 45230,
    rating: 4.8,
    reviews: 1250,
    difficulty: 'Beginner',
    hours: 18,
    prerequisites: [
        'Basic computer literacy',
        'Understanding of variables and basic logic',
        'Java Development Kit (JDK) installed'
    ],
    learningObjectives: [
        'Understand Java fundamentals and how JVM works',
        'Master Object-Oriented Programming (OOP) concepts',
        'Work with classes, inheritance, and polymorphism',
        'Handle exceptions and debug effectively',
        'Use collections and advanced data structures',
        'Build multi-threaded applications'
    ],
    keyTopics: [
        'Variables & Data Types',
        'Object-Oriented Programming',
        'Inheritance & Polymorphism',
        'Exception Handling',
        'Collections Framework',
        'String Handling',
        'Threading',
        'File I/O'
    ],
    lessons: [
        {
            id: 1,
            title: 'Basics & Setup',
            description: 'Introduction to Java and environment setup',
            difficulty: 'Beginner',
            duration: '8 mins',
            content: `
## What is Java?

Java is a high-level, object-oriented programming language known for its "write once, run anywhere" (WORA) philosophy. It's one of the most popular programming languages used for building web applications, mobile apps, and enterprise software.

### Key Features of Java:
- **Platform Independent**: Java code runs on any platform that has JVM installed (Java Virtual Machine).
- **Object-Oriented**: Everything in Java is an object (except primitive types).
- **Simple and Familiar**: Java syntax is largely based on C and C++.
- **Robust**: Strong memory management, automatic garbage collection, and robust exception handling.
- **Secure**: Features like the Bytecode Verifier, Security Manager, and No Explicit Pointers make Java highly secure.
- **Multithreaded**: Supports concurrent programming out of the box.

### Java Architecture (JVM, JRE, JDK):
Getting an understanding of Java requires knowing these three parts:
1. **JDK (Java Development Kit)**: Contains JRE + Development Tools (like \`javac\` compiler). You need this to write and run Java programs.
2. **JRE (Java Runtime Environment)**: Contains JVM + Standard Class Libraries. You need this just to *run* Java programs.
3. **JVM (Java Virtual Machine)**: The abstract machine that executes Java Bytecode.

### Setting Up Java:
1. **Download JDK**: Visit oracle.com or use OpenJDK to download the Java Development Kit.
2. **Install JDK**: Follow platform-specific installation instructions.
3. **Set Environment Variables**: Set \`JAVA_HOME\` to the JDK directory and add \`%JAVA_HOME%\\bin\` to your OS \`PATH\` variable.
4. **Verify Installation**: Open a command prompt/terminal and run \`java -version\` and \`javac -version\`.

### Your First Java Program:
\`\`\`java
public class HelloWorld {
    // The main method is the entry point of your program
    public static void main(String[] args) {
        System.out.println("Hello, World!");
    }
}
\`\`\`

### Compilation and Execution:
- To compile: \`javac HelloWorld.java\` (This creates \`HelloWorld.class\` containing bytecode).
- To run: \`java HelloWorld\` (JVM executes the bytecode).

**Try it yourself in the compiler below!**

<COMPILER>
public class HelloWorld {
    public static void main(String[] args) {
        System.out.println("Hello, World!");
        System.out.println("Welcome to Java!");
    }
}
</COMPILER>
`
        },
        {
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
        },
        {
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
        },
        {
            id: 4,
            title: 'OOPs Part 1: Classes & Objects',
            description: 'Object-Oriented Programming foundations.',
            content: `
## Object-Oriented Programming (OOP) Part 1

OOP is a programming paradigm that uses objects and classes to structure code. Java is a strongly Object-Oriented language.

### What is a Class and an Object?
- **Class**: A blueprint or template. It defines the state (variables) and behaviors (methods) that its objects will have.
- **Object**: A real-world instance of a Class. It occupies memory.

<COMPILER>
public class Car {
    // Attributes (State)
    String color;
    String model;
    int year;
    
    // Method (Behavior)
    public void drive() {
        System.out.println("The " + color + " " + model + " is driving!");
    }
    
    public void honk() {
        System.out.println("Beep! Beep!");
    }
}

class CarDemo {
    public static void main(String[] args) {
        // Creating an Object using the 'new' keyword
        Car myCar = new Car();
        myCar.color = "Red";
        myCar.model = "Tesla";
        myCar.year = 2024;
        
        myCar.drive();  // Output: The Red Tesla is driving!
        myCar.honk();   // Output: Beep! Beep!
    }
}
</COMPILER>

### Constructors:
A constructor is a special method used to initialize objects. It has the same name as the class and no return type.
\`\`\`java
public class Student {
    String name;
    int age;
    
    // Parameterized Constructor
    public Student(String name, int age) {
        this.name = name;
        this.age = age;
    }
}

// Usage:
Student s1 = new Student("Alice", 20);
\`\`\`

### The Four Pillars of OOP:
Java enforces 4 core principles:
1. **Encapsulation**: Bundling data and methods while hiding internal details
2. **Inheritance**: Creating new classes based on existing classes
3. **Polymorphism**: Objects can take multiple forms
4. **Abstraction**: Showing essential features while hiding implementation

### 1. Encapsulation
Bundling data (variables) and methods together, while hiding internal details and enforcing controlled access.

<COMPILER>
public class BankAccount {
    // Private variable - Hidden from outside
    private double balance = 0;
    
    // Public getter
    public double getBalance() {
        return balance;
    }
    
    // Public methods - Controlled access
    public void deposit(double amount) {
        if (amount > 0) {
            balance += amount;
            System.out.println("Deposited: $" + amount);
        }
    }
    
    public void withdraw(double amount) {
        if (amount > 0 && amount <= balance) {
            balance -= amount;
            System.out.println("Withdrew: $" + amount);
        } else {
            System.out.println("Invalid withdrawal!");
        }
    }
}

class BankDemo {
    public static void main(String[] args) {
        BankAccount account = new BankAccount();
        account.deposit(1000);
        account.withdraw(500);
        System.out.println("Balance: $" + account.getBalance());
    }
}
</COMPILER>
`
        },
        {
            id: 5,
            title: 'OOPs Part 2: Inheritance & Polymorphism',
            description: 'Inheritance, Polymorphism, and Method Overriding.',
            content: `
## Object-Oriented Programming (OOP) Part 2

Let's dive deeper into inheritance and polymorphism.

### 2. Inheritance
Creating new classes based on existing classes, promoting code reusability. The \`extends\` keyword is used.

<COMPILER>
public class Animal {
    String name;
    
    public Animal(String name) {
        this.name = name;
    }
    
    public void eat() {
        System.out.println(name + " is eating...");
    }
    
    public void sleep() {
        System.out.println(name + " is sleeping...");
    }
}

public class Dog extends Animal {
    public Dog(String name) {
        super(name);  // Call parent constructor
    }
    
    public void bark() {
        System.out.println(name + " says: Woof!");
    }
}

class AnimalDemo {
    public static void main(String[] args) {
        Dog myDog = new Dog("Buddy");
        myDog.eat();     // Inherited method
        myDog.sleep();   // Inherited method
        myDog.bark();    // Own method
    }
}
</COMPILER>

### 3. Polymorphism
"Poly" means many, "morph" means forms. Objects can take multiple forms.
There are two types:
- **Compile-time Polymorphism (Method Overloading)**: Same method name, different parameters.
- **Runtime Polymorphism (Method Overriding)**: Subclass provides a specific implementation of a class provided by its superclass.

#### Method Overloading:
\`\`\`java
public class Calculator {
    public int add(int a, int b) { 
        return a + b; 
    }
    
    public double add(double a, double b) { 
        return a + b; 
    }
    
    public int add(int a, int b, int c) { 
        return a + b + c; 
    }
}
\`\`\`

#### Method Overriding:

<COMPILER>
class Animal {
    public void sound() {
        System.out.println("Some generic sound...");
    }
}

class Cat extends Animal {
    @Override
    public void sound() {
        System.out.println("Meow! Meow!");
    }
}

class Dog extends Animal {
    @Override
    public void sound() {
        System.out.println("Woof! Woof!");
    }
}

class PolymorphismDemo {
    public static void main(String[] args) {
        Animal cat = new Cat();
        Animal dog = new Dog();
        
        cat.sound();  // Outputs: Meow! Meow!
        dog.sound();  // Outputs: Woof! Woof!
    }
}
</COMPILER>
`
        },
        {
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
        },
        {
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
        },
        {
            id: 8,
            title: 'Abstraction & Interfaces',
            description: 'Diving deep into loose coupling and abstraction contracts.',
            content: `
## Deep Dive into Abstraction
## Deep Dive into Abstraction

Abstraction lets you focus on what the object does instead of how it does it. 

### Abstract Classes
An abstract class cannot be instantiated using the \`new\` keyword. It can contain both abstract methods (without body) and concrete methods (with body).

<COMPILER>
abstract class Vehicle {
    // Abstract method - must be implemented by subclasses
    abstract void startEngine();
    
    // Concrete method
    void stopEngine() {
        System.out.println("Engine stopped.");
    }
}

class Car extends Vehicle {
    @Override
    void startEngine() {
        System.out.println("Car engine started!");
    }
    
    public static void main(String[] args) {
        // Vehicle v = new Vehicle(); // ERROR: Cannot instantiate abstract class
        
        Car car = new Car();
        car.startEngine();
        car.stopEngine();
    }
}
</COMPILER>

### Interfaces
Interfaces form a contract for external capabilities. Unlike abstract classes, a class can implement **multiple interfaces**! From Java 8+, interfaces can also have \`default\` and \`static\` methods.

<COMPILER>
interface Flyable {
    void fly();
}

interface Swimmable {
    void swim();
}

class Duck implements Flyable, Swimmable {
    public void fly() {
        System.out.println("Duck is flying!");
    }
    
    public void swim() {
        System.out.println("Duck is swimming!");
    }
    
    public static void main(String[] args) {
        Duck duck = new Duck();
        duck.fly();
        duck.swim();
    }
}
</COMPILER>
`
        },
        {
            id: 9,
            title: 'Multithreading & Concurrency',
            description: 'Running multiple processes at exactly the same time.',
            content: `
## Multithreading in Java

Multithreading allows concurrent execution of two or more parts of a program for maximum utilization of CPU.

### 1. Extending the Thread class
\`\`\`java
class MyThread extends Thread {
    public void run() {
        System.out.println("Thread is running!");
    }
}

public class Main {
    public static void main(String[] args) {
        MyThread t1 = new MyThread();
        t1.start(); // Invokes the run() method on a separate call stack!
    }
}
\`\`\`

### 2. Implementing the Runnable Interface
Most preferred way because Java doesn't support multiple inheritance of classes, meaning you can implement Runnable and still extend another core class!

<COMPILER>
class Counter extends Thread {
    private String name;
    
    public Counter(String name) {
        this.name = name;
    }
    
    public void run() {
        for (int i = 1; i <= 3; i++) {
            System.out.println(name + " - " + i);
            try {
                Thread.sleep(500); // Sleep for 500ms
            } catch (InterruptedException e) {
                e.printStackTrace();
            }
        }
    }
}

class ThreadDemo {
    public static void main(String[] args) {
        Counter t1 = new Counter("Thread-1");
        Counter t2 = new Counter("Thread-2");
        
        t1.start();
        t2.start();
    }
}
</COMPILER>

### The \`synchronized\` Keyword
When threads share resources, they can corrupt data. Synchronization restricts resource access strictly to one thread at a time.
\`\`\`java
class Counter {
    private int count = 0;
    
    // Only one thread can execute this method at a time
    public synchronized void increment() {
        count++;
    }
}
\`\`\`
`
        },
        {
            id: 10,
            title: 'File I/O & Streams',
            description: 'Reading from and writing to local files.',
            content: `
## File I/O in Java

Java uses Streams to handle I/O operations smoothly. A stream is a logical sequence of data.

### Writing to a File
\`\`\`java
import java.io.FileWriter;
import java.io.IOException;

public class WriteDemo {
    public static void main(String[] args) {
        // try-with-resources statement automatically closes resources!
        try (FileWriter writer = new FileWriter("output.txt")) {
            writer.write("Hello File System\\n");
            writer.write("Java handles this so easily!");
        } catch (IOException e) {
            e.printStackTrace();
        }
    }
}
\`\`\`

### Reading from a File
\`\`\`java
import java.io.File;
import java.io.FileNotFoundException;
import java.util.Scanner;

public class ReadDemo {
    public static void main(String[] args) {
        try {
            File file = new File("output.txt");
            Scanner reader = new Scanner(file);
            
            while (reader.hasNextLine()) {
                String data = reader.nextLine();
                System.out.println(data);
            }
            reader.close();
            
        } catch (FileNotFoundException e) {
            System.out.println("File could not be located.");
        }
    }
}
\`\`\`

### Java NIO (New I/O)
NIO introduced a simpler way to manage small files using the \`Files\` and \`Paths\` classes.
\`\`\`java
import java.nio.file.Files;
import java.nio.file.Paths;

// Read all lines at once into memory
List<String> lines = Files.readAllLines(Paths.get("output.txt"));
\`\`\`
`
        },
        {
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
        },
        {
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
        }
    ]
};
