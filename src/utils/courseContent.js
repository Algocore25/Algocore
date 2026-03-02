export const courseContent = {
    java: {
        id: 'java',
        name: 'Java',
        description: 'Learn Java programming from basics to advanced concepts',
        icon: '☕',
        color: 'from-orange-400 to-red-500',
        students: 45230,
        rating: 4.8,
        reviews: 1250,
        difficulty: 'Beginner',
        hours: 18,
        lessons: [
            {
                id: 1,
                title: 'Basics & Setup',
                description: 'Introduction to Java and environment setup',
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
    },
    python: {
        id: 'python',
        name: 'Python',
        description: 'Master Python for programming and data science',
        icon: '🐍',
        color: 'from-blue-400 to-cyan-500',
        students: 62150,
        rating: 4.9,
        reviews: 1520,
        difficulty: 'Beginner',
        hours: 28,
        lessons: [
            {
                id: 1,
                title: 'Python Fundamentals & Setup',
                description: 'Introduction, setup, variables, data types, and control flow',
                content: `
## Introduction to Python

Python is a versatile, high-level, interpreted programming language known for its readability and ease of use. Created by Guido van Rossum in 1991, Python has become one of the most popular programming languages for web development, data science, artificial intelligence, and automation.

### Why Python?
- **Beginner-Friendly**: Clean, readable syntax that resembles natural English.
- **Powerful Libraries**: NumPy, Pandas, TensorFlow, Django, Flask, etc. enable rapid development.
- **Interpreted Language**: No compilation needed; write and run directly.
- **Dynamically Typed**: No need to declare variable types explicitly.
- **Community**: Massive community with tons of resources and third-party libraries.
- **Versatile**: Used in web dev, ML, data analysis, automation, scripting, and more.

### Setting Up Python

**Installation Steps:**
1. Visit python.org and download the latest stable Python version.
2. During installation, **IMPORTANT**: Check "Add Python to PATH".
3. Verify installation by opening Command Prompt/Terminal and typing: \`python --version\`
4. Install a code editor (VSCode, PyCharm, or even Jupyter Notebook).

### Your First Python Program

\`\`\`python
# This is a comment
print("Hello, Python!")  # Output: Hello, Python!

# Python uses indentation (whitespace) to define blocks
if True:
    print("This is indented")
\`\`\`

## Variables and Data Types

In Python, variables are dynamically typed - you don't need to declare their type.

### Built-in Data Types:

**1. Strings (text)**
\`\`\`python
name = "Alice"
message = 'Hello'
multiline = """This is
a multiline
string"""

# String operations
greeting = "Hello, " + name
print(greeting.upper())  # HELLO, ALICE
print(len(name))         # 5
print(name[0])           # 'A'
\`\`\`

**2. Numbers (Integers and Floats)**
\`\`\`python
# Integers
age = 25
count = -100

# Floats
height = 5.9
temperature = -0.5

# Operations
result = 10 + 5
area = 3.14 * 5 ** 2  # exponentiation
\`\`\`

**3. Booleans**
\`\`\`python
is_active = True
is_deleted = False

# Comparisons return booleans
x = 10
print(x > 5)      # True
print(x == 10)    # True
print(x != 10)    # False
\`\`\`

### Type Conversion:

\`\`\`python
# Convert between types
num_str = "123"
num_int = int(num_str)           # 123
num_float = float(num_str)       # 123.0
back_to_str = str(num_int)       # "123"

# Check type
print(type("hello"))              # <class 'str'>
print(isinstance(num_int, int))   # True
\`\`\`

## Control Flow: If-Elif-Else

Control flow statements allow you to execute different code blocks based on conditions.

\`\`\`python
age = 20

if age < 13:
    print("Child")
elif age < 18:
    print("Teenager")
elif age < 65:
    print("Adult")
else:
    print("Senior")

# Conditional (Ternary) Operator
status = "Adult" if age >= 18 else "Minor"
\`\`\`

## Loops

Loops allow you to execute code repeatedly.

**For Loops:**
\`\`\`python
# Iterating using range
for i in range(5):  # 0, 1, 2, 3, 4
    print(i)

# Iterating through a list
colors = ["Red", "Green", "Blue"]
for color in colors:
    print(color)

# Using enumerate to get index and value
for index, color in enumerate(colors):
    print(f"{index}: {color}")
\`\`\`

**While Loops:**
\`\`\`python
count = 0
while count < 3:
    print(count)
    count += 1  # Important: Increment to avoid infinite loop!

# Break and Continue
n = 0
while n < 10:
    if n == 5:
        break  # Exit loop
    if n == 2:
        n += 1
        continue  # Skip to next iteration
    print(n)
    n += 1
\`\`\`

**Loop with Else:**
\`\`\`python
for i in range(5):
    if i == 10:
        break
else:
    print("Loop completed without break")  # This will execute
\`\`\`
`
            },
            {
                id: 2,
                title: 'Data Structures: Lists, Tuples, Dicts & Sets',
                description: 'Master Python collections: lists, tuples, dictionaries, and sets',
                content: `
## Python Collections

Python offers four main collection types, each with unique characteristics. Understanding them is critical for writing efficient Python code.

### 1. Lists - Ordered and Mutable

Lists are the most versatile collection. They're mutable (can be changed) and allow duplicates.

\`\`\`python
# Creating lists
fruits = ["Apple", "Banana", "Cherry"]
numbers = [1, 2, 3, 4, 5]
mixed = [1, "Hello", 3.14, True]

# Accessing elements (0-indexed)
print(fruits[0])      # Apple
print(fruits[-1])     # Cherry (last element)

# Slicing
print(fruits[0:2])    # ['Apple', 'Banana']
print(fruits[:2])     # ['Apple', 'Banana']
print(fruits[1:])     # ['Banana', 'Cherry']
print(fruits[::2])    # ['Apple', 'Cherry'] (every 2nd)

# Modifying
fruits[0] = "Orange"
fruits.append("Mango")
fruits.extend(["Grapes", "Kiwi"])
fruits.insert(1, "Blueberry")
fruits.remove("Banana")
removed = fruits.pop()  # Remove and return last item

# Other methods
print(len(fruits))         # Length
print("Apple" in fruits)   # Check membership
print(fruits.index("Apple"))  # Find index
fruits.sort()              # Sort in place
fruits.reverse()           # Reverse in place

# List Comprehension (POWERFUL!)
squares = [x**2 for x in range(10)]          # [0, 1, 4, 9, 16, 25...]
evens = [x for x in range(10) if x % 2 == 0]  # [0, 2, 4, 6, 8]
\`\`\`

### 2. Tuples - Ordered and Immutable

Tuples are like lists, but **cannot be modified after creation**. Great for protecting data!

\`\`\`python
# Creating tuples
coordinates = (10, 20)
person = ("Alice", 30, "Engineer")

# Accessing (same as lists)
print(coordinates[0])    # 10
print(person[-1])        # Engineer

# Immutability - This will cause an error!
# coordinates[0] = 15  # TypeError!

# But you can create new tuples
new_coords = (15, 25)

# Tuple Unpacking
x, y = coordinates
name, age, job = person

# Return multiple values
def get_user():
    return ("Bob", 25, "Developer")

name, age, job = get_user()

# Tuples with single element (comma is important!)
single = (1,)       # This is a tuple
not_tuple = (1)     # This is just an integer!

# Tuple methods
print(len(coordinates))        # 2
print(coordinates.count(10))   # 1
print(coordinates.index(20))   # 1
\`\`\`

### 3. Dictionaries - Key-Value Pairs

Dictionaries store data as key-value pairs and are unordered (though they maintain insertion order in Python 3.7+).

\`\`\`python
# Creating dictionaries
person = {
    "name": "Charlie",
    "age": 28,
    "city": "New York",
    "hobbies": ["Reading", "Gaming"]
}

# Accessing values using keys
print(person["name"])           # Charlie
print(person.get("age"))        # 28
print(person.get("email", "N/A"))  # N/A (default if not found)

# Modifying
person["age"] = 29
person["email"] = "charlie@example.com"

# Removing
del person["hobbies"]
removed = person.pop("email")

# Checking existence
if "name" in person:
    print("Name exists")

# Iteration
for key, value in person.items():
    print(f"{key}: {value}")

for key in person:  # iterating keys
    print(key)

# Dictionary methods
print(person.keys())           # ['name', 'age', 'city']
print(person.values())         # ['Charlie', 29, 'New York']
print(len(person))             # Number of items

# Dictionary Comprehension
squares_dict = {x: x**2 for x in range(5)}
# {0: 0, 1: 1, 2: 4, 3: 9, 4: 16}
\`\`\`

### 4. Sets - Unique and Unordered

Sets are collections of **unique** items. Perfect for removing duplicates and performing mathematical operations.

\`\`\`python
# Creating sets
ids = {1, 2, 3, 4, 5}
numbers = {1, 1, 2, 2, 3, 3}  # {1, 2, 3} - duplicates removed!

# Empty set (be careful!)
empty = set()          # Correct way
empty = {}             # This is an empty dict, not set!

# Adding and removing
ids.add(6)
ids.remove(1)          # Error if not found
ids.discard(1)         # No error if not found

# Set Operations
A = {1, 2, 3, 4}
B = {3, 4, 5, 6}

print(A.union(B))           # {1, 2, 3, 4, 5, 6}
print(A.intersection(B))    # {3, 4}
print(A.difference(B))      # {1, 2}
print(A.symmetric_difference(B))  # {1, 2, 5, 6}

# Membership
print(1 in A)               # True
print(len(A))               # 4

# Remove duplicates from list
my_list = [1, 1, 2, 2, 3, 3]
unique = list(set(my_list))  # [1, 2, 3]
\`\`\`

## Summary Table:

| Type | Ordered | Mutable | Allows Duplicates | Use Case |
|------|---------|---------|-------------------|----------|
| List | Yes | Yes | Yes | General purpose collections |
| Tuple | Yes | No | Yes | Fixed data, function returns |
| Dict | Yes* | Yes | No (keys) | Key-value relationships |
| Set | No | Yes | No | Unique items, math operations |
`
            },
            {
                id: 3,
                title: 'Functions, OOP & Classes',
                description: 'Master functions, classes, inheritance, and object-oriented programming',
                content: `
## Functions

Functions are reusable blocks of code that perform specific tasks.

### Defining and Calling Functions:

\`\`\`python
# Simple function
def greet(name):
    """This is a docstring explaining what the function does."""
    return f"Hello, {name}!"

result = greet("Alice")
print(result)  # Hello, Alice!

# Function with multiple parameters
def add(a, b):
    return a + b

print(add(5, 3))  # 8

# Function with default parameters
def greet_with_age(name, age=18):
    return f"{name} is {age} years old"

print(greet_with_age("Bob"))           # Bob is 18 years old
print(greet_with_age("Bob", 25))       # Bob is 25 years old
\`\`\`

### Variable-Length Arguments:

\`\`\`python
# *args - variable number of positional arguments (as tuple)
def sum_all(*numbers):
    total = 0
    for num in numbers:
        total += num
    return total

print(sum_all(1, 2, 3, 4, 5))  # 15

# **kwargs - variable number of keyword arguments (as dictionary)
def print_info(**info):
    for key, value in info.items():
        print(f"{key}: {value}")

print_info(name="Alice", age=30, city="NYC")
# name: Alice
# age: 30
# city: NYC

# Combined usage
def full_function(a, b, *args, **kwargs):
    print(f"a={a}, b={b}")
    print(f"args={args}")
    print(f"kwargs={kwargs}")
\`\`\`

### Lambda Functions:

\`\`\`python
# Lambda: Anonymous function for simple operations
square = lambda x: x ** 2
print(square(5))  # 25

# Commonly used with map, filter, sorted
numbers = [1, 2, 3, 4, 5]

# Map: Apply function to each element
squared = list(map(lambda x: x**2, numbers))
# [1, 4, 9, 16, 25]

# Filter: Keep elements where function returns True
evens = list(filter(lambda x: x % 2 == 0, numbers))
# [2, 4]

# Sorted with key
students = [("Alice", 85), ("Bob", 75), ("Charlie", 90)]
sorted_by_score = sorted(students, key=lambda x: x[1], reverse=True)
# [("Charlie", 90), ("Alice", 85), ("Bob", 75)]
\`\`\`

## Object-Oriented Programming (OOP)

OOP allows organizing code into objects with properties and methods.

### Classes and Objects:

\`\`\`python
class Car:
    # Class variable (shared by all instances)
    total_cars = 0
    
    # Constructor (__init__ is called when object is created)
    def __init__(self, brand, model, year):
        # Instance variables (unique to each object)
        self.brand = brand
        self.model = model
        self.year = year
        Car.total_cars += 1
    
    # Instance method
    def start(self):
        return f"{self.brand} {self.model} started!"
    
    def get_age(self):
        return 2024 - self.year
    
    # Class method
    @classmethod
    def get_total_cars(cls):
        return cls.total_cars

# Creating objects (instances)
car1 = Car("Toyota", "Camry", 2020)
car2 = Car("Honda", "Civic", 2021)

print(car1.start())           # Toyota Camry started!
print(car1.get_age())         # 4
print(Car.get_total_cars())   # 2
\`\`\`

### Inheritance:

\`\`\`python
# Parent class
class Animal:
    def __init__(self, name):
        self.name = name
    
    def speak(self):
        return f"{self.name} makes a sound"
    
    def move(self):
        return f"{self.name} is moving"

# Child class (inherits from Animal)
class Dog(Animal):
    def __init__(self, name, breed):
        super().__init__(name)  # Call parent constructor
        self.breed = breed
    
    # Override parent method
    def speak(self):
        return f"{self.name} barks!"

dog = Dog("Rex", "Labrador")
print(dog.speak())           # Rex barks!
print(dog.move())            # Rex is moving
\`\`\`

### Dunder Methods (Magic Methods):

\`\`\`python
class Vector:
    def __init__(self, x, y):
        self.x = x
        self.y = y
    
    # String representation
    def __str__(self):
        return f"Vector({self.x}, {self.y})"
    
    # Developer representation
    def __repr__(self):
        return f"Vector(x={self.x}, y={self.y})"
    
    # Addition operator
    def __add__(self, other):
        return Vector(self.x + other.x, self.y + other.y)
    
    # Length (for len())
    def __len__(self):
        return int((self.x**2 + self.y**2)**0.5)
    
    # Equality
    def __eq__(self, other):
        return self.x == other.x and self.y == other.y

v1 = Vector(3, 4)
v2 = Vector(1, 2)

print(str(v1))           # Vector(3, 4)
print(v1 + v2)           # Vector(4, 6)
print(len(v1))           # 5
print(v1 == Vector(3, 4))  # True
\`\`\`
`
            },
            {
                id: 4,
                title: 'Exception Handling & File Operations',
                description: 'Master error handling, try-except blocks, and file I/O operations',
                content: `
## Exception Handling

Exceptions are errors that occur during program execution. Proper exception handling prevents crashes.

### Try-Except Blocks:

\`\`\`python
# Basic try-except
try:
    result = 10 / 0  # This will raise ZeroDivisionError
except ZeroDivisionError:
    print("Cannot divide by zero!")

# Multiple exceptions
try:
    age = int(input("Enter age: "))  # Might raise ValueError
    result = 100 / age               # Might raise ZeroDivisionError
except ValueError:
    print("Age must be a number!")
except ZeroDivisionError:
    print("Age cannot be zero!")

# General exception (catches all)
try:
    # risky code
    pass
except Exception as e:
    print(f"An error occurred: {e}")

# Catching specific error
try:
    my_list = [1, 2, 3]
    print(my_list[10])  # ValueError
except IndexError as e:
    print(f"Index out of range: {e}")
\`\`\`

### Finally Block:

\`\`\`python
try:
    file = open("data.txt")
    content = file.read()
except FileNotFoundError:
    print("File not found!")
finally:
    # This ALWAYS runs, with or without exception
    if file:
        file.close()
    print("Cleanup completed!")
\`\`\`

### Raising Exceptions:

\`\`\`python
def validate_age(age):
    if age < 0:
        raise ValueError("Age cannot be negative!")
    if age < 18:
        raise ValueError("Must be 18 or older!")
    return True

try:
    validate_age(-5)
except ValueError as e:
    print(f"Validation error: {e}")
\`\`\`

## File Operations

### Reading Files:

\`\`\`python
# Method 1: Using with statement (RECOMMENDED)
try:
    with open("students.txt", "r") as file:
        content = file.read()  # Read entire file
        print(content)
except FileNotFoundError:
    print("File not found!")

# Method 2: Reading line by line
with open("students.txt", "r") as file:
    for line in file:
        print(line.strip())  # strip() removes newline

# Method 3: Read as list of lines
with open("students.txt", "r") as file:
    lines = file.readlines()  # ['Alice\\n', 'Bob\\n', 'Charlie\\n']
\`\`\`

### Writing Files:

\`\`\`python
# Writing to a file
with open("output.txt", "w") as file:  # 'w' overwrites file
    file.write("Hello, World!\\n")
    file.write("Python File I/O\\n")

# Appending to a file
with open("output.txt", "a") as file:  # 'a' appends to file
    file.write("Another line\\n")

# Writing multiple lines
data = ["Alice\\n", "Bob\\n", "Charlie\\n"]
with open("output.txt", "w") as file:
    file.writelines(data)
\`\`\`

### Working with CSV Files:

\`\`\`python
import csv

# Reading CSV
with open("students.csv", "r") as file:
    reader = csv.reader(file)
    for row in reader:
        print(row)  # row is a list

# Reading CSV as dictionaries
with open("students.csv", "r") as file:
    reader = csv.DictReader(file)
    for row in reader:
        print(row[\"name\"], row[\"age\"])

# Writing CSV
data = [
    ["Name", "Age", "City"],
    ["Alice", "25", "NYC"],
    ["Bob", "30", "LA"]
]

with open("students.csv", "w", newline="") as file:
    writer = csv.writer(file)
    writer.writerows(data)
\`\`\`

### JSON Files:

\`\`\`python
import json

# Reading JSON
with open("data.json", "r") as file:
    data = json.load(file)  # Converts JSON to Python dict
    print(data["name"])

# Writing JSON
student = {
    "name": "Alice",
    "age": 25,
    "courses": ["Python", "Web Dev"]
}

with open("student.json", "w") as file:
    json.dump(student, file, indent=4)  # indent for pretty printing

# JSON strings
json_string = json.dumps(student)       # Python object to JSON string
parsed = json.loads(json_string)        # JSON string to Python object
\`\`\`

## Common File Modes:

| Mode | Purpose |
|------|---------|
| 'r' | Read (default) |
| 'w' | Write (overwrites) |
| 'a' | Append |
| 'x' | Create (fails if exists) |
| 'b' | Binary mode (rb, wb, etc.) |
`
            },
            {
                id: 5,
                title: 'Modules, Packages & Popular Libraries',
                description: 'Import modules, create packages, and use NumPy, Pandas, Requests',
                content: `
## Modules and Packages

A module is a Python file containing code. A package is a directory containing modules.

### Built-in Modules:

\`\`\`python
# Math operations
import math
print(math.sqrt(16))     # 4.0
print(math.pi)           # 3.141592653589793

# Random numbers
import random
print(random.randint(1, 10))  # Random int between 1-10
print(random.choice([1, 2, 3, 4, 5]))  # Random element

# Date and Time
from datetime import datetime, timedelta
now = datetime.now()
tomorrow = now + timedelta(days=1)
print(now.strftime("%Y-%m-%d %H:%M:%S"))

# Working with strings
import string
print(string.ascii_letters)     # 'abcdefghijklmnopqrstuvwxyzABC...'
print(string.digits)            # '0123456789'
\`\`\`

### Importing Different Ways:

\`\`\`python
# Import entire module
import math
result = math.sqrt(9)

# Import specific items
from math import sqrt, pi
result = sqrt(9)

# Import with alias
import numpy as np
arr = np.array([1, 2, 3])

# Import everything (not recommended!)
from math import *
result = sqrt(9)  # 'sqrt' is directly available
\`\`\`

### Creating Your Own Module:

\`\`\`python
# calculator.py
def add(a, b):
    return a + b

def subtract(a, b):
    return a - b

PI = 3.14159

# main.py
import calculator
print(calculator.add(5, 3))
\`\`\`

## Popular Libraries

### NumPy (Numerical Python):

\`\`\`python
import numpy as np

# Create arrays
arr = np.array([1, 2, 3, 4, 5])
matrix = np.array([[1, 2, 3], [4, 5, 6]])

# Operations
print(arr.mean())   # Average
print(arr.sum())    # Sum
print(arr.shape)    # (5,)
print(matrix.shape) # (2, 3)

# Indexing and slicing
print(arr[0])       # 1
print(arr[1:3])     # [2, 3]

# Mathematical operations
print(arr * 2)      # [2, 4, 6, 8, 10]
print(arr ** 2)     # [1, 4, 9, 16, 25]
\`\`\`

### Pandas (Data Analysis):

\`\`\`python
import pandas as pd

# Create DataFrame
data = {
    "Name": ["Alice", "Bob", "Charlie"],
    "Age": [25, 30, 35],
    "City": ["NYC", "LA", "Chicago"]
}
df = pd.DataFrame(data)

print(df)
print(df["Name"])     # Get column
print(df.loc[0])      # Get row by index
print(df[df["Age"] > 25])  # Filter rows

# Reading CSV
df = pd.read_csv("data.csv")

# Basic operations
print(df.describe())  # Statistical summary
print(df.head())      # First 5 rows
print(df.tail())      # Last 5 rows
\`\`\`

### Requests (HTTP Library):

\`\`\`python
import requests

# GET request
response = requests.get("https://api.example.com/users")
print(response.status_code)  # 200
print(response.json())       # Parse JSON response
print(response.text)         # Raw text

# POST request
data = {"name": "Alice", "age": 25}
response = requests.post("https://api.example.com/users", json=data)

# Headers
headers = {"User-Agent": "MyApp/1.0"}
response = requests.get("https://api.example.com", headers=headers)
\`\`\`

### Regular Expressions (Regex):

\`\`\`python
import re

text = "Email: alice@example.com, bob@test.org"

# Find all emails
emails = re.findall(r"[\\w.-]+@[\\w.-]+\\.\\w+", text)
print(emails)  # ['alice@example.com', 'bob@test.org']

# Match
if re.match(r"\\d{3}-\\d{3}-\\d{4}", "123-456-7890"):
    print("Valid phone number")

# Replace
text = re.sub(r"\\d+", "X", "abc123def456")
print(text)  # abcXdefX

# Split
words = re.split(r"\\s+", "Hello   world  python")
print(words)  # ['Hello', 'world', 'python']
\`\`\`

## Installation & Virtual Environments:

\`\`\`bash
# pip: Python package manager
pip install numpy
pip install pandas requests

# List installed packages
pip list

# Virtual Environment (isolate dependencies)
python -m venv myenv

# Activate (Windows)
myenv\\Scripts\\activate

# Activate (Mac/Linux)
source myenv/bin/activate

# Freeze dependencies
pip freeze > requirements.txt

# Install from file
pip install -r requirements.txt
\`\`\`
`
            },
            {
                id: 6,
                title: 'Decorators & Generators',
                description: 'Advanced function concepts: decorators and generator functions.',
                content: `
## Decorators

A decorator is a function that modifies another function or class. Decorators are a powerful way to "wrap" a function.

### Simple Decorators:
<COMPILER>
def simple_decorator(func):
    def wrapper():
        print("Before function call")
        func()
        print("After function call")
    return wrapper

@simple_decorator
def greet():
    print("Hello!")

greet()
# Output:
# Before function call
# Hello!
# After function call
</COMPILER>

### Decorators with Arguments:
<COMPILER>
def repeat_decorator(times):
    def decorator(func):
        def wrapper(*args, **kwargs):
            for _ in range(times):
                result = func(*args, **kwargs)
            return result
        return wrapper
    return decorator

@repeat_decorator(3)
def say_hello():
    print("Hello!")

say_hello()
# Output: Hello! Hello! Hello!
</COMPILER>

### Using functools.wraps:
<COMPILER>
from functools import wraps

def my_decorator(func):
    @wraps(func)
    def wrapper(*args, **kwargs):
        """Wrapper docstring"""
        print(f"Calling {func.__name__}")
        return func(*args, **kwargs)
    return wrapper

@my_decorator
def add(a, b):
    """Add two numbers"""
    return a + b

print(add(3, 5))  # 8
print(add.__name__)  # 'add' (preserved by @wraps)
</COMPILER>

## Generators

A generator is a function that returns values one at a time instead of storing all in memory.

### Generator Functions:
<COMPILER>
def count_up_to(n):
    count = 1
    while count <= n:
        yield count
    count += 1

# Using the generator
for num in count_up_to(3):
    print(num)
# Output: 1, 2, 3

# Get values manually
gen = count_up_to(3)
print(next(gen))  # 1
print(next(gen))  # 2
print(next(gen))  # 3
</COMPILER>

### Generator Expressions:
<COMPILER>
# List comprehension (stores all in memory)
squares_list = [x**2 for x in range(5)]

# Generator expression (lazy evaluation)
squares_gen = (x**2 for x in range(5))

# Process one at a time
for square in squares_gen:
    print(square)
# Output: 0, 1, 4, 9, 16

# Advantage: Memory efficient for large datasets
def infinite_count():
    n = 1
    while True:
        yield n
        n += 1

counter = infinite_count()
print(next(counter))  # 1
print(next(counter))  # 2
print(next(counter))  # 3
</COMPILER>
`
            },
            {
                id: 7,
                title: 'Data Science with NumPy & Pandas',
                description: 'Working with arrays, data frames, and numerical computing.',
                content: `
## NumPy - Numerical Computing

NumPy provides fast operations on arrays and numerical data.

### NumPy Arrays:
<COMPILER>
import numpy as np

# Create arrays
arr = np.array([1, 2, 3, 4, 5])
zeros = np.zeros(5)  # [0. 0. 0. 0. 0.]
ones = np.ones((2, 3))  # 2x3 matrix of ones
range_arr = np.arange(0, 10, 2)  # [0, 2, 4, 6, 8]
linspace = np.linspace(0, 1, 5)  # 5 evenly spaced values

# Array operations
print(arr * 2)  # [2, 4, 6, 8, 10]
print(arr + arr)  # [2, 4, 6, 8, 10]
print(np.sum(arr))  # 15
print(np.mean(arr))  # 3.0
print(np.std(arr))  # Standard deviation
</COMPILER>

### 2D Arrays (Matrices):
<COMPILER>
import numpy as np

# Create 2D array
matrix = np.array([[1, 2, 3],
                   [4, 5, 6],
                   [7, 8, 9]])

print(matrix.shape)  # (3, 3)
print(matrix[0, 0])  # 1 (first element)
print(matrix[1, :])  # [4, 5, 6] (second row)
print(matrix[:, 0])  # [1, 4, 7] (first column)

# Matrix operations
print(np.dot(matrix, matrix))  # Matrix multiplication
print(matrix.T)  # Transpose
print(np.linalg.inv(matrix))  # Inverse
</COMPILER>

## Pandas - Data Analysis

Pandas provides powerful data structures for data analysis.

### DataFrames:
<COMPILER>
import pandas as pd

# Create DataFrame from dictionary
data = {
    'Name': ['Alice', 'Bob', 'Charlie'],
    'Age': [25, 30, 35],
    'Salary': [50000, 60000, 70000]
}

df = pd.DataFrame(data)
print(df)
print(df.head())  # First 5 rows
print(df.info())  # Info about columns
print(df.describe())  # Statistics
</COMPILER>

### Data Manipulation:
<COMPILER>
import pandas as pd

data = {
    'Name': ['Alice', 'Bob', 'Charlie', 'Diana'],
    'Age': [25, 30, 35, 28],
    'Salary': [50000, 60000, 70000, 55000]
}

df = pd.DataFrame(data)

# Filtering
high_earners = df[df['Salary'] > 55000]
print(high_earners)

# Selection
print(df['Name'])  # Get column
print(df.loc[0])   # Get row by index
print(df.iloc[1])  # Get row by position

# Sorting
sorted_df = df.sort_values('Age', ascending=False)

# Grouping
grouped = df.groupby('Age').mean()
</COMPILER>
`
            },
            {
                id: 8,
                title: 'Web Scraping & APIs',
                description: 'Fetching data from websites and working with REST APIs.',
                content: `
## Web Scraping

Web scraping extracts data from websites.

### BeautifulSoup:
<COMPILER>
from bs4 import BeautifulSoup
import requests

# Fetch website
url = 'https://example.com'
response = requests.get(url)
html = response.text

# Parse HTML
soup = BeautifulSoup(html, 'html.parser')

# Find elements
title = soup.find('title')
print(title.text)

# Find all (returns list)
links = soup.find_all('a')
for link in links:
    print(link.get('href'))

# Select by class
cards = soup.select('.card')

# Select by ID
header = soup.select_one('#header')
</COMPILER>

## APIs and JSON

Working with REST APIs and JSON data.

### Making API Requests:
<COMPILER>
import requests
import json

# GET request
response = requests.get('https://api.example.com/users')
status = response.status_code  # 200, 404, etc.
data = response.json()  # Parse JSON

# POST request
payload = {
    'name': 'Alice',
    'email': 'alice@example.com'
}
response = requests.post('https://api.example.com/users', json=payload)

# Headers
headers = {"User-Agent": "MyApp/1.0"}
response = requests.get("https://api.example.com", headers=headers)

print(response.status_code)
print(response.json())
</COMPILER>

### Working with JSON:
<COMPILER>
import json

# Dictionary to JSON string
data = {'name': 'Alice', 'age': 30}
json_str = json.dumps(data)
print(json_str)  # '{"name": "Alice", "age": 30}'

# JSON string to dictionary
json_data = '{"name": "Bob", "age": 25}'
parsed = json.loads(json_data)
print(parsed['name'])  # 'Bob'

# Read/write JSON files
with open('data.json', 'w') as f:
    json.dump(data, f)

with open('data.json', 'r') as f:
    loaded_data = json.load(f)
</COMPILER>
`
            },
            {
                id: 9,
                title: 'Testing & Debugging',
                description: 'Unit testing, debugging techniques, and best practices.',
                content: `
## Unit Testing

Testing ensures your code works correctly.

### pytest Framework:
<COMPILER>
# test_calculator.py
def add(a, b):
    return a + b

def subtract(a, b):
    return a - b

# Test functions (pytest automatically finds them)
def test_add():
    assert add(2, 3) == 5
    assert add(-1, 1) == 0

def test_subtract():
    assert subtract(5, 3) == 2
    assert subtract(0, 5) == -5

def test_edge_cases():
    assert add(0, 0) == 0
    assert subtract(0, 0) == 0
</COMPILER>

### Debugging:

<COMPILER>
# Using print statements
def buggy_function(numbers):
    total = 0
    for num in numbers:
        print(f"Adding {num}, total is {total}")
        total += num
    return total

result = buggy_function([1, 2, 3])
print(f"Final: {result}")

# Using assertions for debugging
def divide(a, b):
    assert b != 0, "Divisor cannot be zero!"
    return a / b

print(divide(10, 2))  # Works fine
try:
    print(divide(10, 0))  # Raises AssertionError
except AssertionError as e:
    print(f"Error: {e}")
</COMPILER>

### pdb - Python Debugger:
<COMPILER>
import pdb

def problematic_code():
    x = 10
    y = 20
    pdb.set_trace()  # Execution pauses here
    z = x + y
    return z

# When pdb pauses, you can:
# - Type 'n' to go to next line
# - Type 's' to step into function
# - Type 'c' to continue execution
# - Type 'l' to list code
# - Type 'p variable' to print variable value

result = problematic_code()
print(result)
</COMPILER>
`
            },
            {
                id: 10,
                title: 'Advanced Topics & Performance',
                description: 'Multiprocessing, asyncio, optimization, and best practices.',
                content: `
## Multiprocessing vs Multithreading

Processing multiple tasks simultaneously.

### Threading (Shared Memory):
<COMPILER>
import threading
import time

def download_file(filename):
    for i in range(3):
        print(f"Downloading {filename}... {i+1}/3")
        time.sleep(1)

# Create threads
t1 = threading.Thread(target=download_file, args=("file1.txt",))
t2 = threading.Thread(target=download_file, args=("file2.txt",))

# Start threads (run concurrently)
t1.start()
t2.start()

# Wait for threads to finish
t1.join()
t2.join()

print("All downloads complete!")
</COMPILER>

### Multiprocessing (Separate Memory):
<COMPILER>
from multiprocessing import Process
import os

def worker(name):
    print(f"Worker {name} (PID: {os.getpid()}) starting")

# Create processes
p1 = Process(target=worker, args=("Process-1",))
p2 = Process(target=worker, args=("Process-2",))

# Start processes
p1.start()
p2.start()

# Wait for completion
p1.join()
p2.join()

print("All processes complete!")
</COMPILER>

### Async Programming (asyncio):
<COMPILER>
import asyncio

async def download(url, delay):
    print(f"Starting download from {url}")
    await asyncio.sleep(delay)  # Simulate download time
    print(f"Completed download from {url}")
    return f"Data from {url}"

async def main():
    # Run multiple async functions concurrently
    results = await asyncio.gather(
        download("http://site1.com", 2),
        download("http://site2.com", 1),
        download("http://site3.com", 3)
    )
    print("Results:", results)

asyncio.run(main())
</COMPILER>

## Performance Optimization

### Timing Code:
<COMPILER>
import time

# Using time module
start = time.time()
# Your code here
time.sleep(0.5)
end = time.time()
print(f"Execution time: {end - start:.4f} seconds")

# Using timeit (for small code snippets)
import timeit

# Method 1: List creation
method1_time = timeit.timeit('[i**2 for i in range(1000)]', number=10000)

# Method 2: Map
method2_time = timeit.timeit('list(map(lambda x: x**2, range(1000)))', number=10000)

print(f"List comprehension: {method1_time:.4f}s")
print(f"Map: {method2_time:.4f}s")
</COMPILER>

### Memory Profiling:
<COMPILER>
import sys

def memory_usage():
    # Check memory usage
    x = [i for i in range(10000)]
    print(f"List size: {sys.getsizeof(x)} bytes")
    
    # Generator uses less memory
    y = (i for i in range(10000))
    print(f"Generator size: {sys.getsizeof(y)} bytes")

memory_usage()
</COMPILER>
`
            }
        ]
    },
    sql: {
        id: 'sql',
        name: 'SQL',
        description: 'Master database management with SQL',
        icon: '🗄️',
        color: 'from-green-400 to-emerald-500',
        students: 38720,
        rating: 4.7,
        reviews: 980,
        difficulty: 'Beginner',
        hours: 10,
        lessons: [
            {
                id: 1,
                title: 'SQL Basics & Architecture',
                description: 'Relational Database basics and intro to SQL',
                content: `
## Relational Databases & SQL

SQL stands for **Structured Query Language**. It is the standard language designed to query, maintain, and manipulate Relational Database Management Systems (RDBMS) like MySQL, PostgreSQL, Oracle, and SQL Server.

### What is a Database?
A database is an organized repository of data. In a **Relational Database**, data is stored in **Tables** (Relations), which are comprised of **Columns** (Fields) and **Rows** (Records). 

### Main Categories of SQL Commands:
1. **DDL (Data Definition Language)**: Creates/modifies the database structure (\`CREATE\`, \`ALTER\`, \`DROP\`, \`TRUNCATE\`).
2. **DML (Data Manipulation Language)**: Edits the data itself (\`INSERT\`, \`UPDATE\`, \`DELETE\`).
3. **DQL (Data Query Language)**: Fetches the data (\`SELECT\`).
4. **DCL (Data Control Language)**: Manages permissions (\`GRANT\`, \`REVOKE\`).
5. **TCL (Transaction Control Language)**: Manages transaction states (\`COMMIT\`, \`ROLLBACK\`).

### Table Creation (DDL):
\`\`\`sql
CREATE TABLE Users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50),
    email VARCHAR(100) UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
\`\`\`
`
            },
            {
                id: 2,
                title: 'Querying Data (SELECT)',
                description: 'Fetching and filtering dataset elements.',
                content: `
## Data Query Language (SELECT)

The \`SELECT\` statement is the most used string of SQL commands. It fetches output data from your tables and can transform/filter it on the fly.

### Basic Fetching:
\`\`\`sql
-- Select all columns from the table
SELECT * FROM employees;

-- Select specific columns
SELECT first_name, salary FROM employees;

-- Alias columns (renaming output)
SELECT first_name AS "Name", salary AS "Compensation" FROM employees;
\`\`\`

### Filtering via WHERE:
The \`WHERE\` clause acts as an \`if\` statement for fetching rows.
\`\`\`sql
-- Mathematical operators (=, >, <, >=, <=, <>)
SELECT * FROM employees WHERE salary >= 50000;

-- Logical operators (AND, OR, NOT)
SELECT * FROM employees WHERE department = 'IT' AND salary > 60000;

-- IN (matches any value in a list)
SELECT * FROM employees WHERE department IN ('IT', 'HR', 'Finance');

-- BETWEEN (matches range inclusive)
SELECT * FROM employees WHERE age BETWEEN 25 AND 35;

-- LIKE (regex-lite string matching, % = wildcard string, _ = wildcard char)
SELECT * FROM employees WHERE last_name LIKE 'Smi%'; -- Starts with Smi
\`\`\`

### Sorting and Paginating:
\`\`\`sql
-- Sort ascending (default) or descending
SELECT * FROM employees ORDER BY salary DESC;

-- Sort by multiple columns
SELECT * FROM employees ORDER BY department ASC, salary DESC;

-- Paginate/Limit the returns (great for 'Top 10' queries)
SELECT * FROM employees ORDER BY salary DESC LIMIT 10;
\`\`\`
`
            },
            {
                id: 3,
                title: 'DML (Insert, Update, Delete)',
                description: 'Modifying actual row data in the database.',
                content: `
## Modifying Data (DML)

### INSERT: Adding rows
\`\`\`sql
-- Insert a single row (must list columns if omitting some values)
INSERT INTO students (name, email, age) 
VALUES ('John', 'john@email.com', 22);

-- Insert completely without declaring columns (must exact match schema order)
INSERT INTO students 
VALUES (2, 'Mary', 'mary@email.com', 21);

-- Insert multiple rows safely
INSERT INTO students (name, email, age) 
VALUES 
('Alice', 'alice@g.com', 21),
('Bob', 'bob@g.com', 23);
\`\`\`

### UPDATE: Modifying existing rows
Always use a \`WHERE\` clause on an update, otherwise you update the **entire table**!
\`\`\`sql
-- Update specific records
UPDATE students 
SET age = 25 
WHERE name = 'John';

-- Update multiple columns
UPDATE students 
SET age = 24, city = 'Boston' 
WHERE student_id = 1;
\`\`\`

### DELETE: Removing existing rows
Like \`UPDATE\`, a \`DELETE\` without a \`WHERE\` clause truncates all data!
\`\`\`sql
-- Delete specific records
DELETE FROM students WHERE name = 'John';

-- Delete with condition
DELETE FROM students WHERE age < 18;
\`\`\`
`
            },
            {
                id: 4,
                title: 'Data Aggregation & Grouping',
                description: 'Math operations and group summaries.',
                content: `
## Aggregation & Grouping

Often you don't want to see individual rows, but rather summary statistics of your data.

### Aggregate Functions:
These functions process an entire column's data down into a single returned row.
\`\`\`sql
-- Count total rows
SELECT COUNT(*) FROM employees;

-- Computations
SELECT SUM(salary) AS total_payroll FROM employees;
SELECT AVG(salary) AS avg_salary FROM employees;
SELECT MIN(salary), MAX(salary) FROM employees;
\`\`\`

### GROUP BY Clause:
If you use aggregate functions coupled with a normal column fetch, you **must \`GROUP BY\`** the normal column. This summarizes the aggregate per unique group of the group parameters!

\`\`\`sql
-- Calculate the average salary per department
SELECT department, AVG(salary) 
FROM employees 
GROUP BY department;

-- Calculate number of people hired per year
SELECT EXTRACT(YEAR FROM hire_date) as yr, COUNT(*) 
FROM employees
GROUP BY yr
ORDER BY yr DESC;
\`\`\`

### HAVING Clause:
\`WHERE\` filters rows *before* they are grouped. \`HAVING\` filters the groups *after* they are grouped!
\`\`\`sql
-- Find departments where the average salary is greater than $60,000
SELECT department, AVG(salary)
FROM employees
GROUP BY department
HAVING AVG(salary) > 60000;
\`\`\`
`
            },
            {
                id: 5,
                title: 'JOINS & Relationships',
                description: 'Combining multiple tables into a single output.',
                content: `
## JOINS in SQL

Real databases are normalized (split into many highly-efficient tables). Thus, to read cohesive data, we must JOIN tables back together relying on their mathematical relationships (Foreign Keys).

### Types of JOINs

1. **INNER JOIN (Default JOIN)**: Returns records that have matching values in **both** tables.
   \`\`\`sql
   SELECT Orders.order_id, Customers.name
   FROM Orders
   INNER JOIN Customers ON Orders.customer_id = Customers.id;
   \`\`\`

2. **LEFT JOIN (Left Outer Join)**: Returns all records from the left table, and the matched records from the right table. (Fills with NULL if no match exists on the right).
   \`\`\`sql
   -- Get all users, and any orders they might have placed
   SELECT Users.name, Orders.total
   FROM Users
   LEFT JOIN Orders ON Users.id = Orders.user_id;
   \`\`\`

3. **RIGHT JOIN**: Returns all records from the right table, and matched on the left.
4. **FULL OUTER JOIN**: Returns all records when there is a match in either left or right table.

### Example Multi-Table Query:
Look at how aliases make writing JOINs dramatically cleaner!
\`\`\`sql
SELECT 
    e.first_name, 
    e.last_name, 
    d.department_name, 
    l.city
FROM employees e
JOIN departments d ON e.department_id = d.id
JOIN locations l ON d.location_id = l.id
WHERE e.salary > 50000;
\`\`\`
`
            }
        ]
    },
    cpp: {
        id: 'cpp',
        name: 'C++',
        description: 'High-performance programming with C++',
        icon: '⚡',
        color: 'from-purple-400 to-pink-500',
        students: 31450,
        rating: 4.6,
        reviews: 850,
        difficulty: 'Intermediate',
        hours: 16,
        lessons: [
            {
                id: 1,
                title: 'C++ Architecture & Basics',
                description: 'Getting started with high-performance execution.',
                content: `
## Welcome to C++

C++ is a high-performance, statically typed, compiled programming language. Developed by Bjarne Stroustrup as an extension to C, it provides object-oriented programming (OOP) and generic programming capabilities while operating incredibly close to the hardware.

### Compilation Process
Unlike Python or Java, C++ compiles directly down to native machine code.
1. **Preprocessing**: Resolves \`#include\` and \`#define\` macros.
2. **Compilation**: Converts syntax to Assembly instructions.
3. **Assembly**: Translates Assembly to Machine Code (Object file \`.o\`).
4. **Linking**: Combines various Object files and libraries into the final \`.exe\` or \`.out\` executable.

### Hello World Example
\`\`\`cpp
// Preprocessor directive to include the Standard IO Stream library
#include <iostream>

// Standard namespace wrapper prevents name collisions
using namespace std;

// Execution starts here
int main() {
    // console out (cout) with stream insertion operator (<<)
    cout << "Hello, World!" << endl;
    
    // Return 0 indicates successful execution to the OS
    return 0;
}
\`\`\`

### Data Types
C++ provides extremely granular control over data types and memory footprints:
- **int**: Standard integers (Usually 4 bytes)
- **long long**: Enormous integers (8 bytes)
- **float**: Decimals (4 bytes)
- **double**: High precision decimals (8 bytes)
- **char**: Single characters (1 byte)
- **bool**: Boolean values (1 byte)
\`\`\`cpp
int age = 22;
double pi = 3.14159;
char grade = 'A';
bool is_active = true;
\`\`\`
`
            },
            {
                id: 2,
                title: 'Control Flow',
                description: 'C++ If-statements, Loops, and Structs.',
                content: `
## Control Flow in C++

C++ control structures define the flow of execution in your application. They are practically identical to Java and C.

### Conditionals
\`\`\`cpp
int age = 18;

if (age < 18) {
    cout << "Minor" << endl;
} else if (age == 18) {
    cout << "Just became an adult!" << endl;
} else {
    cout << "Adult" << endl;
}
\`\`\`

### Switch Statements
Extremely fast lookups used alongside \`int\`, \`char\`, and \`enum\`.
\`\`\`cpp
char rank = 'B';
switch(rank) {
    case 'A': cout << "Excellent"; break;
    case 'B': cout << "Good"; break;
    case 'C': cout << "Average"; break;
    default: cout << "Invalid rank";
}
\`\`\`

### Loops
**For Loop:** (Perfect for iteration)
\`\`\`cpp
for(int i = 0; i < 5; i++) {
    cout << i << " ";
}
\`\`\`

**While Loop:** (Perfect for truth-conditions)
\`\`\`cpp
int count = 10;
while(count > 0) {
    cout << count << endl;
    count--;
}
\`\`\`

### Structs (Precursor to objects)
Used to package a group of disparate variables into a single conceptual package.
\`\`\`cpp
struct Person {
    string name;
    int age;
    double height;
};

int main() {
    Person p1;
    p1.name = "Alice";
    p1.age = 22;
    p1.height = 1.70;
}
\`\`\`
`
            },
            {
                id: 3,
                title: 'Pointers & Memory Control',
                description: 'The hardest and most powerful part of C++.',
                content: `
## Pointers & Memory Management

Pointers are what make C/C++ famous (and sometimes feared). A pointer is simply a variable that **stores a memory address** rather than an actual value!

### Understanding Pointers
\`\`\`cpp
int var = 20;

// The '&' operator retrieves the memory address of a variable
int* ptr = &var;

cout << "Value of var: " << var << endl;       // 20
cout << "Memory address: " << ptr << endl;     // e.g. 0x7ffd5a3b9abc

// The '*' (dereference) operator retrieves the value AT the memory address
cout << "Value at ptr: " << *ptr << endl;      // 20

// Changing the dereferenced pointer mutates the original variable!
*ptr = 100;
cout << var << endl; // 100
\`\`\`

### Dynamic Memory Allocation
Instead of variables clearing automatically when their scope dies (Stack memory), you can create them on the Heap which persists across your entire app until explicitly deleted.
\`\`\`cpp
// 'new' allocates memory on the heap and returns a pointer
int* ptr = new int;    
*ptr = 45;

int* arr = new int[10]; // Allocate array of 10 integers

// 'delete' prevents Memory Leaks!
delete ptr;       
delete[] arr;     
\`\`\`

### Pass by Reference vs Value
If you pass variables into functions normally, C++ makes a heavy memory duplicate of them! Pass by reference avoids this memory hit.
\`\`\`cpp
// Passed by Value (Duplicates variable)
void increment(int x) { x++; }

// Passed by Reference (Mutates original using pointer abstractions)
void incrementRef(int& x) { x++; }

int main() {
    int a = 5;
    increment(a); // a is still 5
    incrementRef(a); // a is now 6!
}
\`\`\`
`
            },
            {
                id: 4,
                title: 'C++ Object-Oriented Programming',
                description: 'Implementing classes, constructors, and encapsulation.',
                content: `
## Object-Oriented Programming (OOP) in C++

OOP concepts in C++ closely map to Java but have some key syntax and behavioral differences (e.g. Memory Destruction and Multiple Inheritance).

### Classes & Constructors
\`\`\`cpp
class Student {
private:
    // Only accessible from within the class
    string name;
    int age;

public:
    // Default Constructor
    Student() {
        name = "Unknown";
        age = 0;
    }
    
    // Parameterized Constructor
    Student(string n, int a) {
        name = n;
        age = a;
    }
    
    // Destructor (Called when object leaves scope/dies)
    ~Student() {
        cout << name << " destroyed from memory." << endl;
    }
    
    // Method
    void display() {
        cout << name << ", " << age << " yrs" << endl;
    }
};

int main() {
    Student s1("John", 20); // Created on stack
    s1.display();
    
    Student* s2 = new Student("Bob", 22); // Created on heap
    s2->display(); // We use the '->' arrow operator to call methods from pointers!
    delete s2;     // Triggers Bob's destructor!
}
\`\`\`

### Inheritance
C++ supports Single, Multilevel, and Multiple Inheritance natively! Access inheritance modifiers apply (\`public\`, \`protected\`, \`private\`).
\`\`\`cpp
class Animal {
public:
    void eat() { cout << "Eating..." << endl; }
};

// Dog publicly inherits Animal
class Dog : public Animal {
public:
    void bark() { cout << "Woof!" << endl; }
};

int main() {
    Dog d;
    d.eat(); // Inherited!
    d.bark();
}
\`\`\`

### Polymorphism & Virtual Functions
To allow method overriding to work over pointers properly, base methods must be marked \`virtual\`.
\`\`\`cpp
class Shape {
public:
    virtual void draw() {
        cout << "Drawing generic shape" << endl;
    }
};

class Circle : public Shape {
public:
    // The override keyword confirms we are rewriting the base math
    void draw() override {
        cout << "Drawing perfect circle" << endl;
    }
};

int main() {
    Shape* s = new Circle();
    s->draw(); // Because of 'virtual', this calls Circle's draw!
               // If omitted, it would incorrectly call Shape's draw.
}
\`\`\`
`
            },
            {
                id: 5,
                title: 'Standard Template Library (STL)',
                description: 'Using vectors, maps, and algorithms out of the box.',
                content: `
## The Standard Template Library (STL)

Programming in C++ entirely from scratch is a massive undertaking. The STL provides immensely optimized versions of common data structures and algorithms using Template syntax.

### \`std::vector\` (Dynamic Array)
The bread and butter array type of modern C++.
\`\`\`cpp
#include <vector>
#include <iostream>

using namespace std;

int main() {
    vector<int> numbers;
    
    numbers.push_back(10); // Append
    numbers.push_back(20);
    numbers.push_back(30);
    
    cout << "Size: " << numbers.size() << endl; // 3
    
    // Fast array-iteration accessing
    for (int num : numbers) {
        cout << num << endl;
    }
    
    numbers.pop_back(); // Removes last element
}
\`\`\`

### \`std::map\` and \`std::set\`
\`map\` is a dictionary (Red-Black tree under the hood). \`set\` is an ordered set of unique items.
\`\`\`cpp
#include <map>
#include <string>

map<string, int> ages;
ages["Alice"] = 25;
ages["Bob"] = 30;

cout << "Alice is " << ages["Alice"];

// Iteration requires an iterator
for (auto const& pair : ages) {
    cout << pair.first << ": " << pair.second << endl;
}
\`\`\`

### STL Algorithms
\`<algorithm>\` has dozens of highly-optimized mathematical manipulation options.
\`\`\`cpp
#include <algorithm>
#include <vector>

vector<int> v = {5, 2, 8, 1, 9};

// O(N*logN) Sort!
sort(v.begin(), v.end()); // {1, 2, 5, 8, 9}

// Reverse
reverse(v.begin(), v.end());

// Iterative find
auto it = find(v.begin(), v.end(), 8);

// Pointer arithmetic to get index
if (it != v.end()) {
    cout << "Found 8 at index: " << (it - v.begin());
}
\`\`\`
`
            },
            {
                id: 6,
                title: 'Templates & Generic Programming',
                description: 'Writing type-safe, reusable code with C++ Templates.',
                content: `
## Templates in C++

Templates allow you to write generic code that works with **any data type**. This is the foundation of the Standard Template Library (STL) itself.

### Function Templates
A function template creates a family of functions — one per data type used.

<COMPILER>
#include <iostream>
using namespace std;

// T is a placeholder for any type
template <typename T>
T getMax(T a, T b) {
    return (a > b) ? a : b;
}

// Works with any comparable type!
template <typename T>
void swap(T &a, T &b) {
    T temp = a;
    a = b;
    b = temp;
}

int main() {
    cout << getMax(10, 20) << endl;          // Works with int
    cout << getMax(3.14, 2.71) << endl;      // Works with double
    cout << getMax('A', 'Z') << endl;        // Works with char
    
    int x = 5, y = 10;
    swap(x, y);
    cout << "After swap: x=" << x << " y=" << y << endl;
    
    return 0;
}
</COMPILER>

### Class Templates
You can also templatize entire classes.

<COMPILER>
#include <iostream>
using namespace std;

template <typename T>
class Stack {
private:
    T data[100];
    int top;
    
public:
    Stack() : top(-1) {}
    
    void push(T val) {
        data[++top] = val;
        cout << "Pushed: " << val << endl;
    }
    
    T pop() {
        if (top < 0) {
            cout << "Stack is empty!" << endl;
            return T();
        }
        return data[top--];
    }
    
    bool isEmpty() {
        return top == -1;
    }
};

int main() {
    Stack<int> intStack;
    intStack.push(10);
    intStack.push(20);
    intStack.push(30);
    cout << "Popped: " << intStack.pop() << endl;
    
    Stack<string> strStack;
    strStack.push("Hello");
    strStack.push("World");
    cout << "Popped: " << strStack.pop() << endl;
    
    return 0;
}
</COMPILER>

### Template Specialization
You can provide a specific implementation for a particular data type.
\`\`\`cpp
// Generic template
template <typename T>
void printType(T val) {
    cout << "Generic: " << val << endl;
}

// Specialization for bool
template <>
void printType<bool>(bool val) {
    cout << "Boolean: " << (val ? "true" : "false") << endl;
}
\`\`\`
`
            },
            {
                id: 7,
                title: 'Exception Handling',
                description: 'Writing robust code that handles runtime errors gracefully.',
                content: `
## Exception Handling in C++

Exceptions provide a way to react to exceptional circumstances (like runtime errors) in programs by transferring control to special functions called **handlers**.

### Basic try-catch-throw:

<COMPILER>
#include <iostream>
#include <stdexcept>
using namespace std;

double safeDivide(double a, double b) {
    if (b == 0) {
        throw runtime_error("Division by zero is not allowed!");
    }
    return a / b;
}

int main() {
    try {
        cout << safeDivide(10, 2) << endl;   // Works fine: 5
        cout << safeDivide(10, 0) << endl;   // Throws!
    } catch (const runtime_error& e) {
        cout << "Caught error: " << e.what() << endl;
    }
    
    // Multiple catch blocks
    try {
        int arr[5] = {1, 2, 3, 4, 5};
        throw out_of_range("Array index out of bounds!");
    } catch (const out_of_range& e) {
        cout << "Range Error: " << e.what() << endl;
    } catch (const exception& e) {
        cout << "General Error: " << e.what() << endl;
    } catch (...) {
        cout << "Unknown error occurred!" << endl;
    }
    
    return 0;
}
</COMPILER>

### Custom Exception Classes
You can create your own exception types by inheriting from \`std::exception\`.

<COMPILER>
#include <iostream>
#include <exception>
using namespace std;

// Custom exception class
class InsufficientFundsException : public exception {
private:
    double amount;
public:
    InsufficientFundsException(double a) : amount(a) {}
    
    const char* what() const noexcept override {
        return "Insufficient funds in account!";
    }
    
    double getAmount() { return amount; }
};

class BankAccount {
    double balance;
public:
    BankAccount(double b) : balance(b) {}
    
    void withdraw(double amount) {
        if (amount > balance) {
            throw InsufficientFundsException(amount - balance);
        }
        balance -= amount;
        cout << "Withdrawn $" << amount << ". New balance: $" << balance << endl;
    }
};

int main() {
    BankAccount account(500.0);
    try {
        account.withdraw(200);  // OK
        account.withdraw(400);  // Will throw!
    } catch (const InsufficientFundsException& e) {
        cout << e.what() << endl;
        cout << "You need $" << e.getAmount() << " more." << endl;
    }
    return 0;
}
</COMPILER>
`
            },
            {
                id: 8,
                title: 'File I/O in C++',
                description: 'Reading from and writing to files using fstream.',
                content: `
## File Input/Output in C++

C++ uses the \`fstream\` library to work with files. Three key classes:
- \`ofstream\`: Write to files (Output File Stream)
- \`ifstream\`: Read from files (Input File Stream)
- \`fstream\`: Both read and write

### Writing to a File:
\`\`\`cpp
#include <iostream>
#include <fstream>
#include <string>
using namespace std;

int main() {
    // Open file for writing
    ofstream outFile("students.txt");
    
    if (!outFile.is_open()) {
        cerr << "Error: Cannot open file!" << endl;
        return 1;
    }
    
    // Write data
    outFile << "Alice,22,Computer Science" << endl;
    outFile << "Bob,21,Mathematics" << endl;
    outFile << "Charlie,23,Physics" << endl;
    
    outFile.close();  // Always close!
    cout << "Data written successfully." << endl;
    
    return 0;
}
\`\`\`

### Reading from a File:
\`\`\`cpp
#include <iostream>
#include <fstream>
#include <string>
using namespace std;

int main() {
    ifstream inFile("students.txt");
    
    if (!inFile) {
        cerr << "Error: File not found!" << endl;
        return 1;
    }
    
    string line;
    cout << "=== Student Records ===" << endl;
    while (getline(inFile, line)) {
        cout << line << endl;
    }
    
    inFile.close();
    return 0;
}
\`\`\`

### Reading Structured Data (CSV parsing):
<COMPILER>
#include <iostream>
#include <sstream>
#include <string>
using namespace std;

// Simulate parsing a CSV line
void parseCSVLine(const string& line) {
    stringstream ss(line);
    string token;
    int colNum = 0;
    
    string fields[] = {"Name", "Age", "Department"};
    
    while (getline(ss, token, ',')) {
        cout << fields[colNum++] << ": " << token << endl;
    }
    cout << "---" << endl;
}

int main() {
    string csvData[] = {
        "Alice,22,Computer Science",
        "Bob,21,Mathematics",
        "Charlie,23,Physics"
    };
    
    for (const string& line : csvData) {
        parseCSVLine(line);
    }
    
    return 0;
}
</COMPILER>
`
            },
            {
                id: 9,
                title: 'Lambda & Modern C++ (C++11/14/17)',
                description: 'Functors, lambdas, auto, range-based loops, and more.',
                content: `
## Modern C++ Features

C++11 and later brought major improvements that changed how C++ is written. Many code bases rely heavily on these modern features.

### Lambda Functions
Lambdas are anonymous functions defined inline — perfect for short, one-off use cases.

<COMPILER>
#include <iostream>
#include <vector>
#include <algorithm>
using namespace std;

int main() {
    // Basic lambda: [capture](params) { body }
    auto greet = []() {
        cout << "Hello from Lambda!" << endl;
    };
    greet(); // Call it like a function
    
    // Lambda with parameters
    auto add = [](int a, int b) -> int {
        return a + b;
    };
    cout << "Sum: " << add(5, 3) << endl;
    
    // Lambda capturing variables from outer scope
    int factor = 3;
    auto multiply = [factor](int x) {
        return x * factor;  // Captures 'factor' by value
    };
    cout << "Multiplied: " << multiply(7) << endl;
    
    // Lambda with STL algorithms
    vector<int> nums = {5, 2, 8, 1, 9, 3};
    sort(nums.begin(), nums.end(), [](int a, int b) {
        return a < b;  // Custom comparator!
    });
    
    for (int n : nums) {
        cout << n << " ";
    }
    cout << endl;
    
    return 0;
}
</COMPILER>

### Range-Based For Loops & \`auto\`:
<COMPILER>
#include <iostream>
#include <vector>
#include <map>
#include <string>
using namespace std;

int main() {
    vector<int> numbers = {1, 2, 3, 4, 5};
    
    // Range-based for loop (C++11)
    for (auto num : numbers) {
        cout << num << " ";
    }
    cout << endl;
    
    // With reference (avoids copying large objects)
    map<string, int> scores = {{"Alice", 95}, {"Bob", 87}, {"Charlie", 92}};
    
    for (const auto& [name, score] : scores) { // Structured bindings (C++17)
        cout << name << ": " << score << endl;
    }
    
    // auto with complex types
    auto it = numbers.begin();
    auto [min, max] = make_pair(*min_element(numbers.begin(), numbers.end()),
                                 *max_element(numbers.begin(), numbers.end()));
    cout << "Min: " << min << ", Max: " << max << endl;
    
    return 0;
}
</COMPILER>
`
            },
            {
                id: 10,
                title: 'Smart Pointers & RAII',
                description: 'Memory-safe programming with unique_ptr and shared_ptr.',
                content: `
## Smart Pointers in C++

Raw pointers (\`new\`/\`delete\`) are error-prone — forgetting to \`delete\` causes memory leaks. **Smart pointers** automatically manage memory, following the **RAII** (Resource Acquisition Is Initialization) principle.

### The 3 Types of Smart Pointers:
1. \`unique_ptr\`: Single ownership — only one pointer can point to the object.
2. \`shared_ptr\`: Shared ownership — multiple pointers can share the same object.
3. \`weak_ptr\`: Non-owning reference to a \`shared_ptr\` (breaks circular references).

### unique_ptr (Exclusive Ownership):
<COMPILER>
#include <iostream>
#include <memory>
#include <string>
using namespace std;

class Robot {
    string name;
public:
    Robot(string n) : name(n) {
        cout << name << " activated!" << endl;
    }
    ~Robot() {
        cout << name << " deactivated." << endl;  // Auto-called!
    }
    void beep() { cout << name << ": Beep boop!" << endl; }
};

int main() {
    // No 'new' needed! make_unique handles it
    auto robot1 = make_unique<Robot>("R2D2");
    robot1->beep();
    
    // Transfer ownership (unique_ptr can't be copied!)
    auto robot2 = move(robot1);
    robot2->beep();
    // robot1 is now nullptr!
    
    cout << "robot1 is " << (robot1 ? "valid" : "null") << endl;
    
    // robot2 automatically destroyed at end of scope!
    return 0;
}
</COMPILER>

### shared_ptr (Shared Ownership):
<COMPILER>
#include <iostream>
#include <memory>
using namespace std;

class Database {
public:
    Database() { cout << "Database connected!" << endl; }
    ~Database() { cout << "Database disconnected." << endl; }
    void query() { cout << "Running query..." << endl; }
};

int main() {
    shared_ptr<Database> db1 = make_shared<Database>();
    cout << "Reference count: " << db1.use_count() << endl;  // 1
    
    {
        shared_ptr<Database> db2 = db1;  // Both own it now
        cout << "Reference count: " << db1.use_count() << endl;  // 2
        db2->query();
    }  // db2 goes out of scope, count decreases
    
    cout << "Reference count after inner scope: " << db1.use_count() << endl;  // 1
    // Database destroyed only when ALL shared_ptrs die!
    
    return 0;
}
</COMPILER>
`
            },
            {
                id: 11,
                title: 'Concurrency & Multithreading',
                description: 'Running multiple threads with C++11 thread support.',
                content: `
## Multithreading in C++

C++11 introduced native thread support via \`<thread>\`. Before this, platform-specific APIs (like pthreads on Linux) were required.

### Creating Threads:
\`\`\`cpp
#include <iostream>
#include <thread>
using namespace std;

void printNumbers(int start, int end) {
    for (int i = start; i <= end; i++) {
        cout << "Thread " << start << ": " << i << endl;
    }
}

int main() {
    // Create two threads
    thread t1(printNumbers, 1, 5);
    thread t2(printNumbers, 6, 10);
    
    // Wait for both to complete
    t1.join();
    t2.join();
    
    cout << "All threads finished!" << endl;
    return 0;
}
\`\`\`

### Mutex (Mutual Exclusion) — Preventing Race Conditions:
When multiple threads access shared data, they can corrupt it. A \`mutex\` locks access to a resource exclusively.

<COMPILER>
#include <iostream>
#include <thread>
#include <mutex>
#include <vector>
using namespace std;

mutex mtx;
int sharedCounter = 0;

void incrementCounter(int times) {
    for (int i = 0; i < times; i++) {
        lock_guard<mutex> lock(mtx);  // Auto-locks and auto-unlocks!
        sharedCounter++;
    }
}

int main() {
    const int NUM_THREADS = 4;
    vector<thread> threads;
    
    for (int i = 0; i < NUM_THREADS; i++) {
        threads.emplace_back(incrementCounter, 1000);
    }
    
    for (auto& t : threads) {
        t.join();
    }
    
    cout << "Final counter: " << sharedCounter << endl;  // Should be 4000
    cout << "Expected:      4000" << endl;
    
    return 0;
}
</COMPILER>

### std::future and async:
For tasks that return a value asynchronously.
\`\`\`cpp
#include <future>
#include <iostream>

long long fibonacci(int n) {
    if (n <= 1) return n;
    return fibonacci(n-1) + fibonacci(n-2);
}

int main() {
    // Launch fibonacci(40) in a background thread
    auto result = async(launch::async, fibonacci, 40);
    
    cout << "Computing fibonacci(40) asynchronously..." << endl;
    cout << "Meanwhile, other work happens here!" << endl;
    
    // Block and get the result when needed
    cout << "Result: " << result.get() << endl;
    
    return 0;
}
\`\`\`
`
            },
            {
                id: 12,
                title: 'Advanced Data Structures',
                description: 'Implementing linked lists, trees, and graphs from scratch.',
                content: `
## Implementing Data Structures in C++

Understanding data structures at the implementation level is crucial for technical interviews and systems programming.

### Singly Linked List:
<COMPILER>
#include <iostream>
using namespace std;

struct Node {
    int data;
    Node* next;
    Node(int d) : data(d), next(nullptr) {}
};

class LinkedList {
    Node* head;
public:
    LinkedList() : head(nullptr) {}
    
    ~LinkedList() {
        Node* curr = head;
        while (curr) {
            Node* next = curr->next;
            delete curr;
            curr = next;
        }
    }
    
    void push_front(int val) {
        Node* newNode = new Node(val);
        newNode->next = head;
        head = newNode;
    }
    
    void push_back(int val) {
        Node* newNode = new Node(val);
        if (!head) { head = newNode; return; }
        Node* curr = head;
        while (curr->next) curr = curr->next;
        curr->next = newNode;
    }
    
    void print() {
        Node* curr = head;
        while (curr) {
            cout << curr->data;
            if (curr->next) cout << " -> ";
            curr = curr->next;
        }
        cout << " -> NULL" << endl;
    }
    
    void reverse() {
        Node* prev = nullptr;
        Node* curr = head;
        while (curr) {
            Node* next = curr->next;
            curr->next = prev;
            prev = curr;
            curr = next;
        }
        head = prev;
    }
};

int main() {
    LinkedList list;
    list.push_back(1);
    list.push_back(2);
    list.push_back(3);
    list.push_front(0);
    
    cout << "List: ";
    list.print();
    
    list.reverse();
    cout << "Reversed: ";
    list.print();
    
    return 0;
}
</COMPILER>

### Binary Search Tree:
\`\`\`cpp
struct TreeNode {
    int val;
    TreeNode* left;
    TreeNode* right;
    TreeNode(int v) : val(v), left(nullptr), right(nullptr) {}
};

class BST {
    TreeNode* root;
    
    TreeNode* insert(TreeNode* node, int val) {
        if (!node) return new TreeNode(val);
        if (val < node->val) node->left = insert(node->left, val);
        else if (val > node->val) node->right = insert(node->right, val);
        return node;
    }
    
    void inorder(TreeNode* node) {
        if (!node) return;
        inorder(node->left);
        cout << node->val << " ";
        inorder(node->right);
    }
    
public:
    BST() : root(nullptr) {}
    void insert(int val) { root = insert(root, val); }
    void inorder() { inorder(root); cout << endl; }
};

int main() {
    BST tree;
    for (int v : {5, 3, 7, 1, 4, 6, 8}) {
        tree.insert(v);
    }
    tree.inorder(); // Sorted: 1 3 4 5 6 7 8
}
\`\`\`
`
            }
        ]
    },
    javascript: {
        id: 'javascript',
        name: 'JavaScript',
        description: 'Build interactive web apps with the language of the internet',
        icon: '🌐',
        color: 'from-yellow-400 to-orange-400',
        students: 78940,
        rating: 4.9,
        reviews: 2100,
        difficulty: 'Beginner',
        hours: 28,
        lessons: [
            {
                id: 1,
                title: 'Introduction to JavaScript',
                description: 'What JS is and why it runs everywhere.',
                content: `
## What is JavaScript?

JavaScript (JS) is the only programming language that natively runs inside web browsers. It makes websites interactive - every button click, animation, and live update is powered by JS. Today, with Node.js, JavaScript also runs on servers making it a full-stack language.

### Why JavaScript?
- The only language that runs natively in the browser.
- Used for front-end (UI), back-end (Node.js), mobile (React Native), and desktop (Electron) apps.
- Huge ecosystem — npm has over 2 million packages!

### Your First JavaScript Program:
\`\`\`javascript
// Output to the browser console
console.log("Hello, World!");

// Show alert in the browser
alert("Welcome to JavaScript!");

// Write to the web page
document.write("Hello from JavaScript!");
\`\`\`

### Variables in JavaScript
JavaScript has three ways to declare variables:
- \`var\`: Old way. Function-scoped, avoid it.
- \`let\`: Block-scoped, can be reassigned.
- \`const\`: Block-scoped, cannot be reassigned.

\`\`\`javascript
let name = "Alice";
const PI = 3.14159;

name = "Bob"; // OK - let can be reassigned
// PI = 3;   // Error! const cannot be reassigned
\`\`\`

### Data Types:
JavaScript is dynamically typed — you don't declare types.
\`\`\`javascript
let str = "Hello";          // String
let num = 42;               // Number (integers and floats are the same type!)
let isActive = true;        // Boolean
let nothing = null;         // Null (intentional absence of value)
let notDefined = undefined; // Undefined (variable declared but not assigned)
let list = [1, 2, 3];      // Array
let person = { name: "Bob", age: 25 }; // Object

// Check type
console.log(typeof str); // "string"
\`\`\`
`
            },
            {
                id: 2,
                title: 'Functions & Scope',
                description: 'Arrow functions, closures, and variable scope.',
                content: `
## Functions in JavaScript

Functions are first-class citizens in JavaScript — they can be stored in variables, passed as arguments, and returned from other functions.

### Function Declaration vs. Expression:
\`\`\`javascript
// Declaration (hoisted — can be called before its definition)
function greet(name) {
    return "Hello, " + name + "!";
}

// Expression (not hoisted)
const greet2 = function(name) {
    return "Hi, " + name + "!";
};

// Arrow Function (ES6+) — concise and lexically binds 'this'
const greet3 = (name) => "Hey, " + name + "!";
const square = x => x * x; // Parentheses optional for single param
\`\`\`

### Default Parameters & Rest:
\`\`\`javascript
function introduce(name = "Guest", age = 0) {
    console.log(name + " is " + age + " years old.");
}
introduce("Alice", 25); // Alice is 25 years old.
introduce();            // Guest is 0 years old.

// Rest params: capture remaining args into an array
function sum(...numbers) {
    return numbers.reduce((acc, n) => acc + n, 0);
}
console.log(sum(1, 2, 3, 4)); // 10
\`\`\`

### Closures
A closure is when a function remembers the variables from its outer scope even after the outer function has returned.
\`\`\`javascript
function makeCounter() {
    let count = 0;
    return function() {
        count++;
        return count;
    };
}

const counter = makeCounter();
console.log(counter()); // 1
console.log(counter()); // 2
console.log(counter()); // 3 — 'count' is preserved!
\`\`\`
`
            },
            {
                id: 3,
                title: 'DOM Manipulation',
                description: 'Interacting with HTML elements from JavaScript.',
                content: `
## The Document Object Model (DOM)

The DOM is JavaScript's live representation of your entire HTML page as a tree of objects. With it, you can read, modify, add, or delete any HTML element, attribute, or content.

### Selecting Elements:
\`\`\`javascript
// By ID
const header = document.getElementById("main-header");

// By CSS Selector (most flexible!)
const btn = document.querySelector(".submit-btn");

// Select ALL matching elements
const allItems = document.querySelectorAll(".list-item");
\`\`\`

### Manipulating Content & Styles:
\`\`\`javascript
const el = document.querySelector("#message");

el.textContent = "Updated text!"; // Change plain text
el.innerHTML = "<strong>Bold</strong> and normal"; // Change HTML inside

// Style manipulation
el.style.color = "red";
el.style.fontSize = "20px";

// Add/remove CSS classes (better practice than inline styles)
el.classList.add("highlighted");
el.classList.remove("hidden");
el.classList.toggle("active");
\`\`\`

### Event Listeners:
\`\`\`javascript
const btn = document.querySelector("#myButton");

btn.addEventListener("click", function(event) {
    console.log("Button was clicked!");
    console.log("Element clicked:", event.target);
});

// Common events: 'click', 'keydown', 'mouseover', 'submit', 'change'
document.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
        console.log("Enter was pressed!");
    }
});
\`\`\`

### Creating & Appending Elements:
\`\`\`javascript
const newItem = document.createElement("li");
newItem.textContent = "A brand new item";
newItem.classList.add("list-item");

const list = document.querySelector("#my-list");
list.appendChild(newItem); // Add to the end of the list
\`\`\`
`
            },
            {
                id: 4,
                title: 'Arrays & Objects (ES6+)',
                description: 'Mastering destructuring, spread, and array methods.',
                content: `
## Working With Arrays and Objects

Modern JavaScript (ES6 and later) brought a lot of powerful tools to manipulate arrays and objects cleanly.

### Array Methods (The Big 3):
\`\`\`javascript
const numbers = [1, 2, 3, 4, 5];

// .map(): Transforms each element, returns a NEW array
const doubled = numbers.map(n => n * 2);
console.log(doubled); // [2, 4, 6, 8, 10]

// .filter(): Returns a NEW array with only elements that pass the test
const evens = numbers.filter(n => n % 2 === 0);
console.log(evens); // [2, 4]

// .reduce(): Accumulates all elements into a single value
const total = numbers.reduce((acc, n) => acc + n, 0);
console.log(total); // 15
\`\`\`

### Destructuring:
\`\`\`javascript
// Array Destructuring
const [first, second, ...rest] = [10, 20, 30, 40];
console.log(first); // 10
console.log(rest);  // [30, 40]

// Object Destructuring
const user = { name: "Alice", age: 28, city: "NY" };
const { name, age } = user;
console.log(name, age); // Alice 28
\`\`\`

### Spread & Rest Operator:
\`\`\`javascript
// Spread: Expand an array or object
const arr1 = [1, 2, 3];
const arr2 = [4, 5, 6];
const combined = [...arr1, ...arr2]; // [1, 2, 3, 4, 5, 6]

const defaults = { theme: "dark", lang: "en" };
const userPrefs = { ...defaults, lang: "fr" }; // Overrides lang
// { theme: "dark", lang: "fr" }
\`\`\`
`
            },
            {
                id: 5,
                title: 'Promises & Async/Await',
                description: 'Handling asynchronous operations like API calls.',
                content: `
## Asynchronous JavaScript

JavaScript is single-threaded, but can perform async tasks (like fetching data) without blocking the main thread.

### Callbacks (The Old Way):
\`\`\`javascript
// Nested callbacks lead to "Callback Hell"!
fetchUser(id, function(user) {
    fetchPosts(user.id, function(posts) {
        fetchComments(posts[0].id, function(comments) {
            console.log(comments); // 3 levels deep!
        });
    });
});
\`\`\`

### Promises (The Modern Way):
A Promise represents a value that may be available now, in the future, or never.
\`\`\`javascript
fetch("https://api.example.com/users/1")
    .then(response => response.json())
    .then(data => console.log(data.name))
    .catch(error => console.error("Something went wrong:", error));
\`\`\`

### Async/Await (The Best Way):
Async/Await is syntactic sugar over promises — it makes async code look and feel synchronous!
\`\`\`javascript
async function getUser(id) {
    try {
        const response = await fetch("https://api.example.com/users/" + id);
        const user = await response.json();
        console.log(user.name);
    } catch (error) {
        console.error("Failed to fetch:", error);
    }
}

getUser(1);
\`\`\`
- \`async\` marks a function as asynchronous (it always returns a Promise).
- \`await\` pauses execution *inside* that function until the Promise resolves.
`
            }
        ]
    },
    dsa: {
        id: 'dsa',
        name: 'DSA',
        description: 'Master Data Structures & Algorithms for coding interviews',
        icon: '🧩',
        color: 'from-violet-500 to-purple-600',
        students: 52000,
        rating: 4.8,
        reviews: 1680,
        difficulty: 'Intermediate',
        hours: 30,
        lessons: [
            {
                id: 1,
                title: 'Time & Space Complexity',
                description: 'Big O notation and analyzing algorithm efficiency.',
                content: `
## Complexity Analysis & Big O Notation

Before writing efficient code, you need to be able to *measure* its efficiency. Big O notation describes how the runtime or memory usage of an algorithm grows as the input size (n) grows.

### Common Complexities (Best to Worst):

| Notation | Name | Example |
|---|---|---|
| O(1) | Constant | Array index access |
| O(log n) | Logarithmic | Binary Search |
| O(n) | Linear | Loop through array |
| O(n log n) | Linearithmic | Merge Sort |
| O(n²) | Quadratic | Nested loops |
| O(2ⁿ) | Exponential | Recursive Fibonacci |

### O(1) — Constant Time:
<COMPILER>
def get_first(arr):
    return arr[0]  # Always 1 operation regardless of list size

arr = [10, 20, 30, 40, 50]
print(get_first(arr))  # 10
</COMPILER>

### O(n) — Linear Time:
<COMPILER>
def find_max(arr):
    max_val = arr[0]
    for num in arr:       # Loop runs n times
        if num > max_val:
            max_val = num
    return max_val

arr = [5, 12, 3, 45, 2, 19]
print(find_max(arr))  # 45
</COMPILER>

### O(n²) — Quadratic Time:
<COMPILER>
def has_duplicates(arr):
    for i in range(len(arr)):
        for j in range(i + 1, len(arr)):  # Nested loop!
            if arr[i] == arr[j]:
                return True
    return False

arr1 = [1, 2, 3, 4, 5]
arr2 = [1, 2, 3, 2, 5]
print(has_duplicates(arr1))  # False
print(has_duplicates(arr2))  # True
</COMPILER>

### Space Complexity
Space complexity measures how much extra memory the algorithm uses.
<COMPILER>
# O(1) space — no extra memory used proportional to n
def double_in_place(arr):
    for i in range(len(arr)):
        arr[i] *= 2
    return arr

# O(n) space — creates a new array of size n
def double_copy(arr):
    return [x * 2 for x in arr]

arr = [1, 2, 3]
result1 = double_copy(arr)
print(result1)  # [2, 4, 6]
</COMPILER>
`
            },
            {
                id: 2,
                title: 'Arrays & Hashing',
                description: 'Solving problems with arrays and hash maps efficiently.',
                content: `
## Arrays & Hash Maps

Arrays and Hash Maps (Dictionaries) are the most frequently used data structures in coding interviews.

### Two Sum Problem (Classic Interview Question!)
Given an array, find two numbers that add up to a target.

<COMPILER>
# Brute Force: O(n²) — check every pair
def two_sum_brute(nums, target):
    for i in range(len(nums)):
        for j in range(i + 1, len(nums)):
            if nums[i] + nums[j] == target:
                return [i, j]
    return []

nums = [2, 7, 11, 15]
target = 9
print(two_sum_brute(nums, target))  # [0, 1]
</COMPILER>

### Optimal Solution with Hash Map:
<COMPILER>
# Optimal: O(n) — use a hash map to store complements
def two_sum(nums, target):
    seen = {}  # value -> index
    for i, num in enumerate(nums):
        complement = target - num
        if complement in seen:
            return [seen[complement], i]
        seen[num] = i
    return []

nums = [2, 7, 11, 15]
target = 9
print(two_sum(nums, target))  # [0, 1]
</COMPILER>

### Sliding Window Technique:
<COMPILER>
# Find max sum of subarray of size k
def max_subarray_sum(arr, k):
    window_sum = sum(arr[:k])
    max_sum = window_sum
    
    for i in range(k, len(arr)):
        window_sum += arr[i] - arr[i - k]  # Add new, remove old
        max_sum = max(max_sum, window_sum)
    
    return max_sum

arr = [1, 4, 2, 10, 2, 3, 1, 0, 20]
k = 4
print(max_subarray_sum(arr, k))  # 24
</COMPILER>

### Two Pointers:
<COMPILER>
def has_pair_with_sum(arr, target):
    arr.sort()
    left, right = 0, len(arr) - 1
    while left < right:
        current = arr[left] + arr[right]
        if current == target:
            return True
        elif current < target:
            left += 1
        else:
            right -= 1
    return False

arr = [2, 5, 8, 12, 16, 23]
target = 18
print(has_pair_with_sum(arr, target))  # True (5 + 13? No, 2 + 16)
</COMPILER>
`
            },
            {
                id: 3,
                title: 'Linked Lists',
                description: 'Building and traversing singly and doubly linked lists.',
                content: `
## Linked Lists

A Linked List is a linear data structure where elements (nodes) are stored in separate memory locations, each node holding a value and a pointer to the next node.

### Node & LinkedList Setup:
<COMPILER>
class Node:
    def __init__(self, val):
        self.val = val
        self.next = None

class LinkedList:
    def __init__(self):
        self.head = None

    def append(self, val):
        new_node = Node(val)
        if not self.head:
            self.head = new_node
            return
        current = self.head
        while current.next:  # Traverse to the tail
            current = current.next
        current.next = new_node

    def display(self):
        result = []
        current = self.head
        while current:
            result.append(str(current.val))
            current = current.next
        return " -> ".join(result)

ll = LinkedList()
ll.append(1)
ll.append(2)
ll.append(3)
print(ll.display())  # 1 -> 2 -> 3
</COMPILER>

### Reversing a Linked List (Interview Classic!):
<COMPILER>
class Node:
    def __init__(self, val):
        self.val = val
        self.next = None

def reverse_list(head):
    prev = None
    current = head
    while current:
        next_node = current.next  # Save next
        current.next = prev       # Reverse pointer
        prev = current            # Move prev forward
        current = next_node       # Move current forward
    return prev  # prev is now the new head

def display(head):
    result = []
    while head:
        result.append(str(head.val))
        head = head.next
    return " -> ".join(result)

# Create list: 1 -> 2 -> 3
head = Node(1)
head.next = Node(2)
head.next.next = Node(3)
print("Original:", display(head))
head = reverse_list(head)
print("Reversed:", display(head))
</COMPILER>

### Detect a Cycle (Floyd's Algorithm):
<COMPILER>
class Node:
    def __init__(self, val):
        self.val = val
        self.next = None

def has_cycle(head):
    slow = head
    fast = head
    while fast and fast.next:
        slow = slow.next       # Moves 1 step
        fast = fast.next.next  # Moves 2 steps
        if slow == fast:       # They meet only if there's a cycle
            return True
    return False

# Create list: 1 -> 2 -> 3 -> 2 (cycle)
head = Node(1)
node2 = Node(2)
node3 = Node(3)
head.next = node2
node2.next = node3
node3.next = node2  # Create cycle

print("Has cycle:", has_cycle(head))  # True
</COMPILER>
`
            },
            {
                id: 4,
                title: 'Stacks & Queues',
                description: 'LIFO and FIFO structures and their applications.',
                content: `
## Stacks & Queues

### Stacks (LIFO — Last In, First Out)
Like a stack of plates — you can only add/remove from the top. Used for undo operations, parsing expressions, and backtracking (DFS).

<COMPILER>
stack = []

# Push (add to top)
stack.append(1)
stack.append(2)
stack.append(3)
print("Stack after pushes:", stack)

# Pop (remove from top)
top = stack.pop()  # 3
print("Popped:", top)
print("Stack after pop:", stack)

# Peek (look at top without removing)
print("Peek:", stack[-1])  # 2
</COMPILER>

### Application: Valid Parentheses Problem
<COMPILER>
def is_valid(s):
    stack = []
    mapping = {')': '(', '}': '{', ']': '['}
    for char in s:
        if char in mapping:
            top = stack.pop() if stack else '#'
            if mapping[char] != top:
                return False
        else:
            stack.append(char)
    return not stack

print(is_valid("()[]{}"))  # True
print(is_valid("([)]"))    # False
print(is_valid("{[]}"))    # True
</COMPILER>

### Queues (FIFO — First In, First Out)
Like a checkout line — first to arrive, first to leave. Used in BFS graph traversal and scheduling.
<COMPILER>
from collections import deque  # Deque is optimized for O(1) popleft!

queue = deque()

# Enqueue (add to back)
queue.append("A")
queue.append("B")
queue.append("C")
print("Queue after enqueues:", list(queue))

# Dequeue (remove from front)
front = queue.popleft()  # "A"
print("Dequeued:", front)
print("Queue after dequeue:", list(queue))
</COMPILER>
`
            },
            {
                id: 5,
                title: 'Binary Search',
                description: 'The O(log n) search strategy for sorted data.',
                content: `
## Binary Search

Binary Search is one of the most efficient algorithms in computer science. By splitting the search space in half repeatedly, it finds the target in O(log n) time.

### Basic Implementation:
<COMPILER>
def binary_search(arr, target):
    left, right = 0, len(arr) - 1
    
    while left <= right:
        mid = (left + right) // 2  # Integer midpoint
        
        if arr[mid] == target:
            return mid          # Found!
        elif arr[mid] < target:
            left = mid + 1      # Search right half
        else:
            right = mid - 1     # Search left half
    
    return -1  # Not found

arr = [2, 5, 8, 12, 16, 23, 38, 56, 72, 91]
print(binary_search(arr, 23))  # 5 (index)
print(binary_search(arr, 50))  # -1 (not present)
print(binary_search(arr, 8))   # 2
</COMPILER>

### Finding First and Last Position:
<COMPILER>
def find_first(arr, target):
    left, right = 0, len(arr) - 1
    result = -1
    while left <= right:
        mid = (left + right) // 2
        if arr[mid] == target:
            result = mid
            right = mid - 1  # Keep searching LEFT for earlier occurrences
        elif arr[mid] < target:
            left = mid + 1
        else:
            right = mid - 1
    return result

arr = [5, 7, 7, 8, 8, 10]
target = 8
print("First position of", target, ":", find_first(arr, target))  # 3
</COMPILER>

### Square Root (Binary Search Pattern):
<COMPILER>
def sqrt_floor(n):
    if n < 2: return n
    left, right = 1, n // 2
    while left <= right:
        mid = (left + right) // 2
        if mid * mid == n:
            return mid
        elif mid * mid < n:
            left = mid + 1
        else:
            right = mid - 1
    return right  # Floor of sqrt

print("Square root of 16:", sqrt_floor(16))  # 4
print("Square root of 15:", sqrt_floor(15))  # 3
print("Square root of 2:", sqrt_floor(2))    # 1
</COMPILER>
`
            },
            {
                id: 6,
                title: 'Trees & Binary Search Trees',
                description: 'Hierarchical data structures and BST operations.',
                content: `
## Trees & Binary Search Trees

### Tree Basics
A **Tree** is a hierarchical data structure with a root node and child nodes forming a parent-child relationship. A **Binary Search Tree (BST)** is a special tree where left child < parent < right child.

### TreeNode Definition:
<COMPILER>
class TreeNode:
    def __init__(self, val=0):
        self.val = val
        self.left = None
        self.right = None

# Create a simple tree:
#       1
#      / \\
#     2   3
root = TreeNode(1)
root.left = TreeNode(2)
root.right = TreeNode(3)

print("Root:", root.val)
print("Left child:", root.left.val)
print("Right child:", root.right.val)
</COMPILER>

### Inorder Traversal (Left-Root-Right):
<COMPILER>
class TreeNode:
    def __init__(self, val=0):
        self.val = val
        self.left = None
        self.right = None

def inorder(root):
    result = []
    if root:
        result += inorder(root.left)
        result.append(root.val)
        result += inorder(root.right)
    return result

# Create BST:
#       2
#      / \\
#     1   3
root = TreeNode(2)
root.left = TreeNode(1)
root.right = TreeNode(3)

print("Inorder traversal:", inorder(root))  # [1, 2, 3]
</COMPILER>

### Search in BST:
<COMPILER>
class TreeNode:
    def __init__(self, val=0):
        self.val = val
        self.left = None
        self.right = None

def search_bst(root, val):
    if not root:
        return False
    if root.val == val:
        return True
    elif val < root.val:
        return search_bst(root.left, val)
    else:
        return search_bst(root.right, val)

# Create BST:
root = TreeNode(4)
root.left = TreeNode(2)
root.right = TreeNode(6)
root.left.left = TreeNode(1)
root.left.right = TreeNode(3)

print("Search 3:", search_bst(root, 3))  # True
print("Search 5:", search_bst(root, 5))  # False
</COMPILER>

### Level Order Traversal (BFS):
<COMPILER>
from collections import deque

class TreeNode:
    def __init__(self, val=0):
        self.val = val
        self.left = None
        self.right = None

def level_order(root):
    if not root:
        return []
    
    result = []
    queue = deque([root])
    
    while queue:
        node = queue.popleft()
        result.append(node.val)
        
        if node.left:
            queue.append(node.left)
        if node.right:
            queue.append(node.right)
    
    return result

# Create tree:
root = TreeNode(1)
root.left = TreeNode(2)
root.right = TreeNode(3)
root.left.left = TreeNode(4)

print("Level order:", level_order(root))  # [1, 2, 3, 4]
</COMPILER>
`
            },
            {
                id: 7,
                title: 'Graphs & Graph Traversal',
                description: 'DFS, BFS, connectivity, and shortest paths.',
                content: `
## Graphs & Graph Traversal

A **Graph** is a collection of nodes (vertices) connected by edges. Graphs can be directed or undirected, weighted or unweighted.

### Graph Representation:
<COMPILER>
# Adjacency List representation
graph = {
    1: [2, 3],
    2: [1, 4],
    3: [1, 5],
    4: [2],
    5: [3]
}

print("Neighbors of 1:", graph[1])  # [2, 3]
print("Neighbors of 4:", graph[4])  # [2]
</COMPILER>

### Depth-First Search (DFS):
<COMPILER>
def dfs(graph, start, visited=None):
    if visited is None:
        visited = set()
    
    visited.add(start)
    print(f"Visiting: {start}", end=" ")
    
    for neighbor in graph.get(start, []):
        if neighbor not in visited:
            dfs(graph, neighbor, visited)
    
    return visited

graph = {
    1: [2, 3],
    2: [1, 4],
    3: [1, 5],
    4: [2],
    5: [3]
}

print("DFS from 1:")
dfs(graph, 1)
print()
</COMPILER>

### Breadth-First Search (BFS):
<COMPILER>
from collections import deque

def bfs(graph, start):
    visited = set([start])
    queue = deque([start])
    result = []
    
    while queue:
        node = queue.popleft()
        result.append(node)
        print(f"Visiting: {node}", end=" ")
        
        for neighbor in graph.get(node, []):
            if neighbor not in visited:
                visited.add(neighbor)
                queue.append(neighbor)
    
    return result

graph = {
    1: [2, 3],
    2: [1, 4],
    3: [1, 5],
    4: [2],
    5: [3]
}

print("BFS from 1:")
bfs(graph, 1)
print()
</COMPILER>

### Shortest Path in Unweighted Graph (BFS):
<COMPILER>
from collections import deque

def shortest_path(graph, start, end):
    visited = {start}
    queue = deque([(start, [start])])
    
    while queue:
        node, path = queue.popleft()
        
        if node == end:
            return path
        
        for neighbor in graph.get(node, []):
            if neighbor not in visited:
                visited.add(neighbor)
                queue.append((neighbor, path + [neighbor]))
    
    return []

graph = {
    1: [2, 3],
    2: [1, 4],
    3: [1, 5],
    4: [2, 5],
    5: [3, 4]
}

print("Shortest path from 1 to 5:", shortest_path(graph, 1, 5))
</COMPILER>
`
            },
            {
                id: 8,
                title: 'Sorting Algorithms',
                description: 'Bubble Sort, Merge Sort, Quick Sort, and more.',
                content: `
## Sorting Algorithms

Sorting is fundamental to CS. Different algorithms have different time complexities, and choosing the right one matters!

### Merge Sort (O(n log n) — Divide & Conquer):
<COMPILER>
def merge_sort(arr):
    if len(arr) <= 1:
        return arr
    
    mid = len(arr) // 2
    left = merge_sort(arr[:mid])
    right = merge_sort(arr[mid:])
    
    return merge(left, right)

def merge(left, right):
    result = []
    i = j = 0
    while i < len(left) and j < len(right):
        if left[i] <= right[j]:
            result.append(left[i])
            i += 1
        else:
            result.append(right[j])
            j += 1
    
    result.extend(left[i:])
    result.extend(right[j:])
    return result

arr = [38, 27, 43, 3, 9, 82, 10]
print("Sorted:", merge_sort(arr))  # [3, 9, 10, 27, 38, 43, 82]
</COMPILER>

### Quick Sort (O(n log n) average — Partition):
<COMPILER>
def quick_sort(arr):
    if len(arr) <= 1:
        return arr
    
    pivot = arr[len(arr) // 2]
    left = [x for x in arr if x < pivot]
    middle = [x for x in arr if x == pivot]
    right = [x for x in arr if x > pivot]
    
    return quick_sort(left) + middle + quick_sort(right)

arr = [38, 27, 43, 3, 9, 82, 10]
print("Sorted:", quick_sort(arr))  # [3, 9, 10, 27, 38, 43, 82]
</COMPILER>

### Bubble Sort (O(n²) — Simple):
<COMPILER>
def bubble_sort(arr):
    n = len(arr)
    for i in range(n):
        swapped = False
        for j in range(0, n - i - 1):
            if arr[j] > arr[j + 1]:
                arr[j], arr[j + 1] = arr[j + 1], arr[j]
                swapped = True
        if not swapped:
            break
    return arr

arr = [38, 27, 43, 3, 9]
print("Sorted:", bubble_sort(arr))  # [3, 9, 27, 38, 43]
</COMPILER>

### Comparison of Sorting Algorithms:

| Algorithm | Best | Average | Worst | Space | Stable |
|---|---|---|---|---|---|
| Bubble Sort | O(n) | O(n²) | O(n²) | O(1) | Yes |
| Merge Sort | O(n log n) | O(n log n) | O(n log n) | O(n) | Yes |
| Quick Sort | O(n log n) | O(n log n) | O(n²) | O(log n) | No |
| Heap Sort | O(n log n) | O(n log n) | O(n log n) | O(1) | No |
`
            },
            {
                id: 9,
                title: 'Dynamic Programming Basics',
                description: 'Overlapping subproblems, memoization, and tabulation.',
                content: `
## Dynamic Programming

Dynamic Programming solves problems by breaking them into overlapping subproblems and storing results to avoid recomputation.

### Fibonacci Sequence - The Classic DP Problem:
<COMPILER>
# Naive Recursive (Very Slow! O(2^n))
def fib_naive(n):
    if n <= 1:
        return n
    return fib_naive(n - 1) + fib_naive(n - 2)

# Memoization (O(n))
def fib_memo(n, memo=None):
    if memo is None:
        memo = {}
    if n in memo:
        return memo[n]
    if n <= 1:
        return n
    memo[n] = fib_memo(n - 1, memo) + fib_memo(n - 2, memo)
    return memo[n]

print("Fib(5) Memo:", fib_memo(5))   # 5
print("Fib(10) Memo:", fib_memo(10)) # 55
</COMPILER>

### Tabulation Approach (Bottom-Up):
<COMPILER>
def fib_tab(n):
    if n <= 1:
        return n
    
    dp = [0] * (n + 1)
    dp[1] = 1
    
    for i in range(2, n + 1):
        dp[i] = dp[i - 1] + dp[i - 2]
    
    return dp[n]

print("Fib(6) Tab:", fib_tab(6))    # 8
print("Fib(7) Tab:", fib_tab(7))    # 13
</COMPILER>

### Climbing Stairs Problem:
<COMPILER>
# You can climb 1 or 2 steps at a time. How many ways to reach n steps?
def climb_stairs(n):
    if n <= 2:
        return n
    
    dp = [0] * (n + 1)
    dp[1] = 1
    dp[2] = 2
    
    for i in range(3, n + 1):
        dp[i] = dp[i - 1] + dp[i - 2]
    
    return dp[n]

print("Ways to climb 3 steps:", climb_stairs(3))   # 3
print("Ways to climb 4 steps:", climb_stairs(4))   # 5
print("Ways to climb 5 steps:", climb_stairs(5))   # 8
</COMPILER>

### Maximum Subarray Sum (Kadane's Algorithm):
<COMPILER>
def max_subarray_sum(arr):
    max_sum = current_sum = arr[0]
    
    for i in range(1, len(arr)):
        current_sum = max(arr[i], current_sum + arr[i])
        max_sum = max(max_sum, current_sum)
    
    return max_sum

arr = [-2, 1, -3, 4, -1, 2, 1, -5, 4]
print("Max subarray sum:", max_subarray_sum(arr))  # 6 (subarray [4, -1, 2, 1])
</COMPILER>
`
            },
            {
                id: 10,
                title: 'Heaps & Priority Queues',
                description: 'Min/Max heaps and their real-world applications.',
                content: `
## Heaps & Priority Queues

A **Heap** is a complete binary tree where every parent is smaller (min-heap) or larger (max-heap) than its children. Heaps enable efficient insertion and removal in O(log n).

### Min Heap Operations:
<COMPILER>
import heapq

min_heap = []

# Insert elements
heapq.heappush(min_heap, 10)
heapq.heappush(min_heap, 5)
heapq.heappush(min_heap, 20)
heapq.heappush(min_heap, 3)

print("Min heap:", min_heap)

# Extract minimum
min_element = heapq.heappop(min_heap)
print("Extracted:", min_element)  # 3

print("Remaining:", min_heap)
</COMPILER>

### Heapify - Convert List to Heap:
<COMPILER>
import heapq

arr = [10, 5, 20, 3, 15]
heapq.heapify(arr)  # Converts to min-heap in-place

print("After heapify:", arr)

# Extract all elements in sorted order
while arr:
    print(heapq.heappop(arr), end=" ")
print()
</COMPILER>

### Find K Largest Elements:
<COMPILER>
import heapq

def find_k_largest(arr, k):
    return heapq.nlargest(k, arr)

arr = [38, 27, 43, 3, 9, 82, 10]
k = 3
print(f"3 largest elements: {find_k_largest(arr, k)}")  # [82, 43, 38]
</COMPILER>

### Max Heap (Python uses negative values):
<COMPILER>
import heapq

max_heap = []

# Insert with negative values for max-heap behavior
heapq.heappush(max_heap, -10)
heapq.heappush(max_heap, -30)
heapq.heappush(max_heap, -5)
heapq.heappush(max_heap, -20)

print("Max heap (as negatives):", max_heap)

# Extract maximum
max_element = -heapq.heappop(max_heap)
print("Extracted max:", max_element)  # 30
</COMPILER>

### Median of Stream Using Two Heaps:
<COMPILER>
import heapq

class MedianFinder:
    def __init__(self):
        self.small = []  # Max heap (negate values)
        self.large = []  # Min heap

    def addNum(self, num):
        heapq.heappush(self.small, -num)
        
        if self.small and self.large and (-self.small[0] > self.large[0]):
            val = -heapq.heappop(self.small)
            heapq.heappush(self.large, val)
        
        if len(self.small) > len(self.large) + 1:
            val = -heapq.heappop(self.small)
            heapq.heappush(self.large, val)
        
        if len(self.large) > len(self.small):
            val = heapq.heappop(self.large)
            heapq.heappush(self.small, -val)

    def findMedian(self):
        if len(self.small) > len(self.large):
            return float(-self.small[0])
        return (-self.small[0] + self.large[0]) / 2.0

mf = MedianFinder()
for num in [1, 2, 3, 4, 5]:
    mf.addNum(num)
    print(f"Median: {mf.findMedian()}")
</COMPILER>
`
            },
            {
                id: 11,
                title: 'String Algorithms & Pattern Matching',
                description: 'KMP, Rabin-Karp, substring matching, and more.',
                content: `
## String Algorithms

String problems are very common in interviews. Master these patterns!

### Longest Common Substring:
<COMPILER>
def longest_common_substring(s1, s2):
    m, n = len(s1), len(s2)
    dp = [[0] * (n + 1) for _ in range(m + 1)]
    max_len = 0
    
    for i in range(1, m + 1):
        for j in range(1, n + 1):
            if s1[i - 1] == s2[j - 1]:
                dp[i][j] = dp[i - 1][j - 1] + 1
                max_len = max(max_len, dp[i][j])
    
    return max_len

s1 = "abcdef"
s2 = "fbdefe"
print(f"LCS length: {longest_common_substring(s1, s2)}")  # 3
</COMPILER>

### Palindrome Check:
<COMPILER>
def is_palindrome(s):
    cleaned = ''.join(c.lower() for c in s if c.isalnum())
    return cleaned == cleaned[::-1]

test_strings = [
    "A man, a plan, a canal: Panama",
    "racecar",
    "hello"
]

for s in test_strings:
    print(f'"{s}" is palindrome: {is_palindrome(s)}')
</COMPILER>

### Anagram Check:
<COMPILER>
def is_anagram(s1, s2):
    return sorted(s1) == sorted(s2)

# Alternative using character count
def is_anagram_count(s1, s2):
    from collections import Counter
    return Counter(s1) == Counter(s2)

print(is_anagram("listen", "silent"))     # True
print(is_anagram("hello", "world"))       # False
print(is_anagram_count("abc", "cab"))     # True
</COMPILER>

### Longest Substring Without Repeating Characters:
<COMPILER>
def longest_substring_no_repeat(s):
    char_index = {}
    max_len = 0
    start = 0
    
    for i, char in enumerate(s):
        if char in char_index and char_index[char] >= start:
            start = char_index[char] + 1
        
        max_len = max(max_len, i - start + 1)
        char_index[char] = i
    
    return max_len

strings = ["abcabcbb", "au", "dvdf", "pwwkew"]
for s in strings:
    print(f"'{s}' -> {longest_substring_no_repeat(s)}")
</COMPILER>

### Word Break Problem:
<COMPILER>
def word_break(s, word_dict):
    dp = [False] * (len(s) + 1)
    dp[0] = True
    
    for i in range(1, len(s) + 1):
        for j in range(i):
            if dp[j] and s[j:i] in word_dict:
                dp[i] = True
                break
    
    return dp[len(s)]

s = "catsandcatsdog"
word_dict = {"cat", "cats", "and", "sand", "dog"}
print(word_break(s, word_dict))  # True

s2 = "catsandog"
print(word_break(s2, word_dict))  # False
</COMPILER>
`
            },
            {
                id: 12,
                title: 'Advanced DSA Topics',
                description: 'Tries, Union-Find, Segment Trees, and more advanced concepts.',
                content: `
## Advanced Data Structures

### Trie (Prefix Tree):
<COMPILER>
class TrieNode:
    def __init__(self):
        self.children = {}
        self.is_end = False

class Trie:
    def __init__(self):
        self.root = TrieNode()
    
    def insert(self, word):
        node = self.root
        for char in word:
            if char not in node.children:
                node.children[char] = TrieNode()
            node = node.children[char]
        node.is_end = True
    
    def search(self, word):
        node = self.root
        for char in word:
            if char not in node.children:
                return False
            node = node.children[char]
        return node.is_end
    
    def starts_with(self, prefix):
        node = self.root
        for char in prefix:
            if char not in node.children:
                return False
            node = node.children[char]
        return True

trie = Trie()
trie.insert("apple")
trie.insert("app")
print("search('apple'):", trie.search("apple"))      # True
print("search('app'):", trie.search("app"))          # True
print("starts_with('ap'):", trie.starts_with("ap"))  # True
print("search('appl'):", trie.search("appl"))        # False
</COMPILER>

### Union-Find (Disjoint Set Union):
<COMPILER>
class UnionFind:
    def __init__(self, n):
        self.parent = list(range(n))
        self.rank = [0] * n
    
    def find(self, x):
        if self.parent[x] != x:
            self.parent[x] = self.find(self.parent[x])  # Path compression
        return self.parent[x]
    
    def union(self, x, y):
        root_x = self.find(x)
        root_y = self.find(y)
        
        if root_x == root_y:
            return False
        
        # Union by rank
        if self.rank[root_x] < self.rank[root_y]:
            self.parent[root_x] = root_y
        elif self.rank[root_x] > self.rank[root_y]:
            self.parent[root_y] = root_x
        else:
            self.parent[root_y] = root_x
            self.rank[root_x] += 1
        
        return True
    
    def is_connected(self, x, y):
        return self.find(x) == self.find(y)

uf = UnionFind(6)
uf.union(0, 1)
uf.union(1, 2)
uf.union(3, 4)

print("0 and 2 connected:", uf.is_connected(0, 2))  # True
print("0 and 3 connected:", uf.is_connected(0, 3))  # False

uf.union(2, 3)
print("After union(2,3), 0 and 3 connected:", uf.is_connected(0, 3))  # True
</COMPILER>

### Segment Tree - Range Sum Query:
<COMPILER>
class SegmentTree:
    def __init__(self, arr):
        self.n = len(arr)
        self.tree = [0] * (4 * self.n)
        self.build(arr, 0, 0, self.n - 1)
    
    def build(self, arr, node, start, end):
        if start == end:
            self.tree[node] = arr[start]
        else:
            mid = (start + end) // 2
            self.build(arr, 2 * node + 1, start, mid)
            self.build(arr, 2 * node + 2, mid + 1, end)
            self.tree[node] = self.tree[2 * node + 1] + self.tree[2 * node + 2]
    
    def query(self, node, start, end, l, r):
        if r < start or end < l:
            return 0
        if l <= start and end <= r:
            return self.tree[node]
        
        mid = (start + end) // 2
        left_sum = self.query(2 * node + 1, start, mid, l, r)
        right_sum = self.query(2 * node + 2, mid + 1, end, l, r)
        return left_sum + right_sum
    
    def range_sum(self, l, r):
        return self.query(0, 0, self.n - 1, l, r)

arr = [1, 3, 5, 7, 9, 11]
st = SegmentTree(arr)
print("Sum [0, 2]:", st.range_sum(0, 2))  # 1 + 3 + 5 = 9
print("Sum [1, 4]:", st.range_sum(1, 4))  # 3 + 5 + 7 + 9 = 24
</COMPILER>
`
            }
        ]
    },
    c: {
        id: 'c',
        name: 'C',
        description: 'The foundational systems programming language behind modern OS',
        icon: '⚙️',
        color: 'from-gray-500 to-slate-600',
        students: 28900,
        rating: 4.5,
        reviews: 720,
        difficulty: 'Intermediate',
        hours: 22,
        lessons: [
            {
                id: 1,
                title: 'Introduction to C',
                description: 'Why C is fundamental, setting up, and your first program.',
                content: `
## Introduction to C Programming

C is one of the oldest and most important programming languages ever created (1972, by Dennis Ritchie at Bell Labs). It is the foundation of modern operating systems like **Linux**, **Windows**, and **macOS**. It is also the parent of C++, Java, and many other languages.

### Why Learn C?
- Gives you deep understanding of how computers work at the memory level.
- OS kernels, embedded systems, and game engines are built in C.
- Teaches you rigorous discipline that makes you a better programmer in any language.

### Structure of a C Program:
<COMPILER>
#include <stdio.h>   // Include Standard I/O library header

// Every C program entry point
int main() {
    // printf outputs to the terminal
    printf("Hello, World!\\n");
    
    // Return 0 signals success to the OS
    return 0;
}
</COMPILER>

### Variables and Primitive Types:
<COMPILER>
#include <stdio.h>

int main() {
    int age = 22;
    float height = 5.9;
    double salary = 75000.50;
    char grade = 'A';
    
    printf("Age: %d\\n", age);
    printf("Height: %.1f\\n", height);
    printf("Grade: %c\\n", grade);
    
    return 0;
}
</COMPILER>

### Size of Data Types:
<COMPILER>
#include <stdio.h>

int main() {
    printf("int: %lu bytes\\n", sizeof(int));
    printf("char: %lu bytes\\n", sizeof(char));
    printf("float: %lu bytes\\n", sizeof(float));
    printf("double: %lu bytes\\n", sizeof(double));
    printf("long: %lu bytes\\n", sizeof(long));
    
    return 0;
}
</COMPILER>
`
            },
            {
                id: 2,
                title: 'Data Types & Variables',
                description: 'Understanding primitive types, type casting, and constants.',
                content: `
## Data Types in C

C is a **statically typed** language, meaning you must declare the type of a variable before using it.

### Primitive Data Types:
<COMPILER>
#include <stdio.h>
#include <limits.h>

int main() {
    // Integer types with their ranges
    char c = 'X';           // 1 byte, range -128 to 127
    short s = 32000;        // 2 bytes
    int i = 2147483647;     // 4 bytes (largest int)
    long l = 9223372036854775807L;  // 8 bytes (with L suffix)
    
    // Floating point
    float f = 3.14f;        // 4 bytes (with f suffix)
    double d = 3.14159;     // 8 bytes (default for decimals)
    
    printf("char: %c\\n", c);
    printf("int: %d\\n", i);
    printf("float: %.2f\\n", f);
    printf("double: %.5f\\n", d);
    
    return 0;
}
</COMPILER>

### Type Casting:
<COMPILER>
#include <stdio.h>

int main() {
    // Implicit casting (automatic, may lose data)
    int x = 10;
    double y = x;  // int automatically converted to double
    printf("y = %.1f\\n", y);  // 10.0
    
    // Explicit casting (programmer controls)
    double a = 3.7;
    int b = (int)a;  // Explicit cast, loses decimal part
    printf("b = %d\\n", b);  // 3
    
    // Arithmetic with different types
    int num = 10;
    double result = num / 3.0;  // 3.333... (one operand is double)
    printf("result = %.2f\\n", result);  // 3.33
    
    return 0;
}
</COMPILER>

### Constants and Qualifiers:
<COMPILER>
#include <stdio.h>

int main() {
    // const — value cannot be changed after initialization
    const int MAX_USERS = 100;
    const float PI = 3.14159f;
    
    printf("MAX_USERS = %d\\n", MAX_USERS);
    printf("PI = %.5f\\n", PI);
    
    // Using #define for compile-time constants
    #define BUFFER_SIZE 256
    printf("BUFFER_SIZE = %d\\n", BUFFER_SIZE);
    
    // volatile — compiler should not optimize this variable
    volatile int sensor_reading = 100;
    
    return 0;
}
</COMPILER>
`
            },
            {
                id: 3,
                title: 'Operators & Expressions',
                description: 'Arithmetic, logical, bitwise, and comparison operators.',
                content: `
## Operators in C

### Arithmetic Operators:
<COMPILER>
#include <stdio.h>

int main() {
    int a = 10, b = 3;
    
    printf("a = %d, b = %d\\n", a, b);
    printf("a + b = %d\\n", a + b);    // 13
    printf("a - b = %d\\n", a - b);    // 7
    printf("a * b = %d\\n", a * b);    // 30
    printf("a / b = %d\\n", a / b);    // 3 (integer division)
    printf("a %% b = %d\\n", a % b);   // 1 (modulo)
    
    return 0;
}
</COMPILER>

### Comparison & Logical Operators:
<COMPILER>
#include <stdio.h>

int main() {
    int a = 5, b = 3;
    
    // Comparison (returns 1 for true, 0 for false)
    printf("a > b: %d\\n", a > b);     // 1 (true)
    printf("a == b: %d\\n", a == b);   // 0 (false)
    printf("a != b: %d\\n", a != b);   // 1 (true)
    
    // Logical operators
    printf("a > 3 && b > 2: %d\\n", (a > 3) && (b > 2));  // 1 (AND)
    printf("a > 10 || b > 2: %d\\n", (a > 10) || (b > 2));  // 1 (OR)
    printf("!(a > 10): %d\\n", !(a > 10));  // 1 (NOT)
    
    return 0;
}
</COMPILER>

### Bitwise Operators:
<COMPILER>
#include <stdio.h>

int main() {
    int a = 5;   // 0101 in binary
    int b = 3;   // 0011 in binary
    
    printf("a = %d (binary: 0101)\\n", a);
    printf("b = %d (binary: 0011)\\n", b);
    printf("a & b = %d (AND: 0001)\\n", a & b);     // 1
    printf("a | b = %d (OR: 0111)\\n", a | b);      // 7
    printf("a ^ b = %d (XOR: 0110)\\n", a ^ b);     // 6
    printf("~a = %d (NOT)\\n", ~a);                  // -6
    printf("a << 1 = %d (left shift)\\n", a << 1);  // 10
    printf("a >> 1 = %d (right shift)\\n", a >> 1); // 2
    
    return 0;
}
</COMPILER>

### Increment/Decrement & Ternary:
<COMPILER>
#include <stdio.h>

int main() {
    int x = 5;
    
    printf("x = %d\\n", x);
    printf("x++ = %d, then x = %d\\n", x++, x);  // Post-increment
    
    x = 5;
    printf("++x = %d, then x = %d\\n", ++x, x);  // Pre-increment
    
    // Ternary operator: condition ? true_val : false_val
    int age = 20;
    char *status = (age >= 18) ? "Adult" : "Minor";
    printf("Status: %s\\n", status);
    
    return 0;
}
</COMPILER>
`
            },
            {
                id: 4,
                title: 'Pointers & Memory Management',
                description: 'The core differentiator of C: manual memory management.',
                content: `
## Pointers in C

Pointers are arguably the most powerful—and most feared—feature of C. A pointer is a variable that stores the **memory address** of another variable.

### The Address (&) and Dereference (*) Operators:
<COMPILER>
#include <stdio.h>

int main() {
    int x = 10;
    int *p = &x;  // p stores the address of x
    
    printf("Value of x:   %d\\n", x);      // 10
    printf("Address of x: %p\\n", &x);     // e.g. 0x7ffc...
    printf("Value of p:   %p\\n", p);      // Same address
    printf("*p (deref):   %d\\n", *p);     // 10 — read value at address
    
    *p = 99;  // Change the value AT that address
    printf("x is now: %d\\n", x);           // 99!
    
    return 0;
}
</COMPILER>

### Dynamic Memory Allocation:
<COMPILER>
#include <stdio.h>
#include <stdlib.h>

int main() {
    // Allocate space for 5 integers on the heap
    int *arr = (int*) malloc(5 * sizeof(int));
    
    // Always check if allocation succeeded!
    if (arr == NULL) {
        printf("Memory allocation failed!\\n");
        return 1;
    }
    
    // Use the array
    for (int i = 0; i < 5; i++) {
        arr[i] = i * 10;
        printf("arr[%d] = %d\\n", i, arr[i]);
    }
    
    // ALWAYS free heap memory — no garbage collector in C!
    free(arr);
    arr = NULL;  // Good practice: set to NULL after freeing
    
    return 0;
}
</COMPILER>

### Pointer Arithmetic:
<COMPILER>
#include <stdio.h>

int main() {
    int arr[5] = {10, 20, 30, 40, 50};
    int *p = arr;  // Array name IS already a pointer to first element
    
    printf("*p = %d\\n", *p);       // 10 (first element)
    printf("*(p+1) = %d\\n", *(p+1));  // 20 (second element)
    printf("*(p+4) = %d\\n", *(p+4));  // 50 (fifth element)
    
    // Array indexing is pointer arithmetic!
    printf("p[0] = %d\\n", p[0]);   // 10
    printf("p[2] = %d\\n", p[2]);   // 30
    
    return 0;
}
</COMPILER>
`
            },
            {
                id: 5,
                title: 'Arrays & Strings',
                description: 'Working with arrays and null-terminated character strings.',
                content: `
## Arrays in C

An array is a fixed-size collection of elements of the same type stored in contiguous memory.

### Single and Multi-dimensional Arrays:
<COMPILER>
#include <stdio.h>

int main() {
    // 1D Array
    int numbers[5] = {10, 20, 30, 40, 50};
    
    printf("1D Array access:\\n");
    for (int i = 0; i < 5; i++) {
        printf("numbers[%d] = %d\\n", i, numbers[i]);
    }
    
    // 2D Array
    int matrix[2][3] = {
        {1, 2, 3},
        {4, 5, 6}
    };
    
    printf("\\n2D Array access:\\n");
    printf("matrix[0][1] = %d\\n", matrix[0][1]);  // 2
    printf("matrix[1][2] = %d\\n", matrix[1][2]);  // 6
    
    return 0;
}
</COMPILER>

### Strings (Character Arrays):
<COMPILER>
#include <stdio.h>
#include <string.h>

int main() {
    // Strings are null-terminated character arrays
    char str1[20] = "Hello, World!";
    char str2[] = "C Programming";  // Size auto-calculated
    
    printf("str1: %s\\n", str1);
    printf("str2: %s\\n", str2);
    printf("Length of str1: %lu\\n", strlen(str1));  // 13
    
    // String functions
    char dest[50];
    strcpy(dest, str1);  // Copy str1 to dest
    printf("After copy: %s\\n", dest);
    
    strcat(dest, " ");   // Concatenate
    strcat(dest, str2);
    printf("After concat: %s\\n", dest);
    
    return 0;
}
</COMPILER>

### String Input/Output:
<COMPILER>
#include <stdio.h>

int main() {
    char name[50];
    
    printf("Enter your name: ");
    fgets(name, sizeof(name), stdin);  // Safe way to read strings
    
    // fgets includes the newline, so we often remove it
    size_t len = 0;
    if (name[len = strlen(name) - 1] == '\\n')
        name[len] = '\\0';
    
    printf("Hello, %s!\\n", name);
    
    return 0;
}
</COMPILER>
`
            },
            {
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
            },
            {
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
            },
            {
                id: 8,
                title: 'Functions & Recursion',
                description: 'Writing modular code and thinking recursively.',
                content: `
## Functions in C

In C, you must declare a function's **return type**, **name**, and **parameter types** explicitly.

### Function Syntax:
<COMPILER>
#include <stdio.h>

// Function Declaration (Prototype)
int add(int a, int b);
void greet(char *name);

int main() {
    int result = add(5, 3);
    printf("Sum: %d\\n", result);
    
    greet("Alice");
    return 0;
}

// Function Definition
int add(int a, int b) {
    return a + b;
}

void greet(char *name) {
    printf("Hello, %s!\\n", name);
}
</COMPILER>

### Pass by Value vs. Pass by Pointer:
<COMPILER>
#include <stdio.h>

void doubleByValue(int n) {
    n = n * 2;  // Does NOT change original
}

void doubleByPointer(int *n) {
    *n = *n * 2;  // DOES change original
}

int main() {
    int x = 5;
    
    doubleByValue(x);
    printf("After doubleByValue: x = %d\\n", x);  // Still 5
    
    doubleByPointer(&x);
    printf("After doubleByPointer: x = %d\\n", x);  // Now 10
    
    return 0;
}
</COMPILER>

### Recursion:
<COMPILER>
#include <stdio.h>

// Factorial: n! = n * (n-1) * ... * 1
long factorial(int n) {
    if (n <= 1) return 1;
    return n * factorial(n - 1);
}

// Fibonacci: fib(n) = fib(n-1) + fib(n-2)
int fibonacci(int n) {
    if (n <= 1) return n;
    return fibonacci(n - 1) + fibonacci(n - 2);
}

int main() {
    printf("5! = %ld\\n", factorial(5));      // 120
    printf("fib(7) = %d\\n", fibonacci(7));   // 13
    
    return 0;
}
</COMPILER>
`
            },
            {
                id: 9,
                title: 'Structures & Unions',
                description: 'Creating custom data types with struct and union.',
                content: `
## Structures in C

A struct is a composite data type that groups variables of different types together.

### Defining and Using Structures:
<COMPILER>
#include <stdio.h>
#include <string.h>

// Define a structure
struct Student {
    int id;
    char name[50];
    float gpa;
};

int main() {
    // Create a struct variable
    struct Student student1;
    student1.id = 101;
    strcpy(student1.name, "Alice");
    student1.gpa = 3.9f;
    
    // Access members
    printf("ID: %d\\n", student1.id);
    printf("Name: %s\\n", student1.name);
    printf("GPA: %.2f\\n", student1.gpa);
    
    return 0;
}
</COMPILER>

### Pointers to Structures:
<COMPILER>
#include <stdio.h>
#include <malloc.h>
#include <string.h>

struct Person {
    int age;
    char name[30];
};

int main() {
    // Allocate struct on heap
    struct Person *p = (struct Person*) malloc(sizeof(struct Person));
    
    if (p != NULL) {
        // Access via pointer using -> operator
        p->age = 25;
        strcpy(p->name, "Bob");
        
        printf("Age: %d\\n", p->age);
        printf("Name: %s\\n", p->name);
        
        free(p);
    }
    
    return 0;
}
</COMPILER>

### Unions (Alternative to struct):
<COMPILER>
#include <stdio.h>

// Union shares memory — only one member active at a time
union Data {
    int intVal;
    float floatVal;
    char charVal;
};

int main() {
    union Data data;
    
    printf("Size of union: %lu bytes\\n", sizeof(union Data));  // 4 (size of largest member)
    
    data.intVal = 10;
    printf("intVal: %d\\n", data.intVal);
    
    data.floatVal = 3.14f;  // Overwrites intVal!
    printf("floatVal: %.2f\\n", data.floatVal);
    printf("intVal now: %d\\n", data.intVal);  // Garbage!
    
    return 0;
}
</COMPILER>
`
            },
            {
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
            },
            {
                id: 11,
                title: 'Preprocessor Directives & Macros',
                description: '#define, #ifdef, #include, and conditional compilation.',
                content: `
## Preprocessor Directives

The C preprocessor processes the source code before compilation.

### #define and Macros:
<COMPILER>
#include <stdio.h>

// Object-like macro
#define PI 3.14159f
#define MAX_SIZE 100

// Function-like macro
#define SQUARE(x) ((x) * (x))
#define MIN(a, b) ((a) < (b) ? (a) : (b))

int main() {
    float radius = 5.0f;
    float area = PI * SQUARE(radius);
    printf("Area of circle: %.2f\\n", area);
    
    int x = 10, y = 20;
    printf("MIN(10, 20) = %d\\n", MIN(x, y));  // 10
    
    printf("MAX_SIZE = %d\\n", MAX_SIZE);
    
    return 0;
}
</COMPILER>

### Conditional Compilation (#ifdef, #ifndef):
<COMPILER>
#include <stdio.h>

#define DEBUG
// Uncomment above to toggle debug mode

int main() {
#ifdef DEBUG
    printf("Debug mode is ON\\n");
#else
    printf("Debug mode is OFF\\n");
#endif

#if defined(DEBUG)
    printf("Compiling with DEBUG enabled\\n");
    int x = 42;
    printf("Debug value: %d\\n", x);
#endif
    
    return 0;
}
</COMPILER>

### #include Guard (Header Files):
<COMPILER>
// This would normally be in a header file (myheader.h)
// To show how #ifndef prevents double inclusion

#ifndef MY_HEADER_H
#define MY_HEADER_H

// Function declarations here
void my_function(void);

#endif  // MY_HEADER_H

#include <stdio.h>

void my_function(void) {
    printf("Function from header!\\n");
}

int main() {
    my_function();
    return 0;
}
</COMPILER>
`
            },
            {
                id: 12,
                title: 'Advanced Pointers & Function Pointers',
                description: 'Pointers to pointers, function pointers, and callbacks.',
                content: `
## Advanced Pointer Concepts

### Pointers to Pointers:
<COMPILER>
#include <stdio.h>

int main() {
    int x = 10;
    int *p = &x;      // Pointer to int
    int **pp = &p;    // Pointer to pointer to int
    
    printf("x = %d\\n", x);
    printf("*p = %d\\n", *p);      // 10
    printf("**pp = %d\\n", **pp);  // 10
    
    // Modify x through pp
    **pp = 99;
    printf("x is now: %d\\n", x);  // 99
    
    return 0;
}
</COMPILER>

### Function Pointers:
<COMPILER>
#include <stdio.h>

int add(int a, int b) {
    return a + b;
}

int multiply(int a, int b) {
    return a * b;
}

int main() {
    // Declare function pointer
    int (*operation)(int, int);
    
    // Point to add function
    operation = add;
    printf("add(5, 3) = %d\\n", operation(5, 3));  // 8
    
    // Point to multiply function
    operation = multiply;
    printf("multiply(5, 3) = %d\\n", operation(5, 3));  // 15
    
    return 0;
}
</COMPILER>

### Callbacks Using Function Pointers:
<COMPILER>
#include <stdio.h>

typedef int (*Comparator)(int, int);

int ascending(int a, int b) {
    return a - b;
}

int descending(int a, int b) {
    return b - a;
}

void sort_with_callback(int arr[], int n, Comparator compare) {
    for (int i = 0; i < n - 1; i++) {
        for (int j = 0; j < n - i - 1; j++) {
            if (compare(arr[j], arr[j + 1]) > 0) {
                int temp = arr[j];
                arr[j] = arr[j + 1];
                arr[j + 1] = temp;
            }
        }
    }
}

int main() {
    int arr[] = {5, 2, 8, 1, 9};
    int n = 5;
    
    printf("Original: ");
    for (int i = 0; i < n; i++) printf("%d ", arr[i]);
    printf("\\n");
    
    sort_with_callback(arr, n, ascending);
    printf("Ascending: ");
    for (int i = 0; i < n; i++) printf("%d ", arr[i]);
    printf("\\n");
    
    return 0;
}
</COMPILER>

### Array of Function Pointers:
<COMPILER>
#include <stdio.h>

int add(int a, int b) { return a + b; }
int sub(int a, int b) { return a - b; }
int mul(int a, int b) { return a * b; }

int main() {
    // Array of function pointers
    int (*operations[3])(int, int) = {add, sub, mul};
    
    printf("10 + 5 = %d\\n", operations[0](10, 5));  // add
    printf("10 - 5 = %d\\n", operations[1](10, 5));  // sub
    printf("10 * 5 = %d\\n", operations[2](10, 5));  // mul
    
    return 0;
}
</COMPILER>
`
            }
        ]
    },
    html_css: {
        id: 'html_css',
        name: 'HTML & CSS',
        description: 'Build and style modern web pages from scratch',
        icon: '🎨',
        color: 'from-pink-400 to-rose-500',
        students: 91200,
        rating: 4.7,
        reviews: 2400,
        difficulty: 'Beginner',
        hours: 11,
        lessons: [
            {
                id: 1,
                title: 'HTML Fundamentals',
                description: 'Tags, attributes, and the structure of the web.',
                content: `
## HTML: The Skeleton of the Web

HTML (HyperText Markup Language) is the structure and content layer of every web page. It uses **tags** to define different types of content.

### Anatomy of an HTML Page:
\`\`\`html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>My First Webpage</title>
</head>
<body>
    <h1>Welcome to My Site</h1>
    <p>This is my first webpage!</p>
</body>
</html>
\`\`\`

### Headings, Paragraphs & Text:
\`\`\`html
<h1>Main Heading (Biggest)</h1>
<h2>Sub-heading</h2>
<h3>Smaller Sub-heading</h3>
<p>This is a paragraph of text.</p>
<p>This has <strong>bold</strong> and <em>italic</em> text.</p>
\`\`\`

### Links and Images:
\`\`\`html
<!-- Anchor tag for links -->
<a href="https://www.google.com" target="_blank">Go to Google</a>

<!-- Image tag (self-closing!) -->
<img src="photo.jpg" alt="A descriptive text for screen readers" width="400">
\`\`\`

### Lists:
\`\`\`html
<!-- Unordered (bullet) list -->
<ul>
    <li>Apples</li>
    <li>Bananas</li>
</ul>

<!-- Ordered (numbered) list -->
<ol>
    <li>Wake up</li>
    <li>Code something cool</li>
    <li>Share it with the world</li>
</ol>
\`\`\`
`
            },
            {
                id: 2,
                title: 'CSS Selectors & Properties',
                description: 'Styling HTML elements with colors, fonts, and spacing.',
                content: `
## CSS: Making the Web Beautiful

CSS (Cascading Style Sheets) adds visual styling to the HTML structure.

### Connecting CSS to HTML:
\`\`\`html
<!-- Method 1: External stylesheet (Best practice!) -->
<link rel="stylesheet" href="styles.css">

<!-- Method 2: Internal style block -->
<style>
  h1 { color: red; }
</style>

<!-- Method 3: Inline styles (Avoid — hard to maintain) -->
<p style="color: blue; font-size: 18px;">Inline styled paragraph</p>
\`\`\`

### CSS Selectors:
\`\`\`css
/* Element selector */
p { color: gray; }

/* Class selector */
.card { background: white; border-radius: 8px; }

/* ID selector (unique per page) */
#main-header { font-size: 2rem; }

/* Descendant selector */
.card p { margin-bottom: 10px; }

/* Pseudo-class (apply style on state) */
a:hover { color: blue; text-decoration: underline; }
button:disabled { opacity: 0.5; cursor: not-allowed; }
\`\`\`

### The Box Model:
Every HTML element is a rectangular box with: Content, Padding, Border, and Margin.
\`\`\`css
.box {
    /* Content */
    width: 200px;
    height: 100px;
    
    /* Padding: space inside the border */
    padding: 16px;
    
    /* Border */
    border: 2px solid #333;
    border-radius: 8px;
    
    /* Margin: space outside the border */
    margin: 20px auto; /* auto = center horizontally */
}
\`\`\`
`
            },
            {
                id: 3,
                title: 'Flexbox Layout',
                description: 'Building flexible one-dimensional layouts with ease.',
                content: `
## CSS Flexbox

Flexbox is a layout model that makes it incredibly easy to align and distribute space among items in a container, even when their size is unknown.

### Enabling Flexbox:
\`\`\`css
.container {
    display: flex;    /* Makes this a flex container */
}
\`\`\`

### Main Axis Alignment (justify-content):
Controls alignment along the **main axis** (horizontal by default).
\`\`\`css
.container {
    display: flex;
    justify-content: flex-start;    /* Default: items at start */
    justify-content: flex-end;      /* Items at end */
    justify-content: center;        /* Items centered */
    justify-content: space-between; /* Even space BETWEEN items */
    justify-content: space-around;  /* Even space AROUND items */
}
\`\`\`

### Cross Axis Alignment (align-items):
Controls alignment along the **cross axis** (vertical by default).
\`\`\`css
.container {
    display: flex;
    align-items: stretch;     /* Default: fill height */
    align-items: center;      /* Vertical center */
    align-items: flex-start;  /* Align to top */
    align-items: flex-end;    /* Align to bottom */
}
\`\`\`

### Flex Direction & Wrap:
\`\`\`css
.container {
    display: flex;
    flex-direction: row;         /* Default: horizontal */
    flex-direction: column;      /* Vertical layout */
    
    flex-wrap: nowrap;  /* Default: single line */
    flex-wrap: wrap;    /* Wrap to next line when needed */
}

/* Child item sizing */
.item {
    flex: 1; /* Each item takes equal space */
}
\`\`\`
`
            },
            {
                id: 4,
                title: 'HTML Forms & Inputs',
                description: 'Collecting user data with forms, inputs, and validation.',
                content: `
## HTML Forms

Forms are how web pages collect information from users — from login screens to search bars to checkout pages.

### Basic Form Structure:
\`\`\`html
<form action="/submit" method="POST">
    <!-- Text input -->
    <label for="username">Username:</label>
    <input type="text" id="username" name="username" placeholder="Enter username" required>
    
    <!-- Password input -->
    <label for="password">Password:</label>
    <input type="password" id="password" name="password" required>
    
    <!-- Submit button -->
    <button type="submit">Login</button>
</form>
\`\`\`

### All Common Input Types:
\`\`\`html
<!-- Text -->
<input type="text" placeholder="Your name">

<!-- Email (validates @ format automatically!) -->
<input type="email" placeholder="you@example.com">

<!-- Number with min/max -->
<input type="number" min="0" max="100" step="5">

<!-- Date picker -->
<input type="date">

<!-- Checkbox (multi-select) -->
<input type="checkbox" id="terms" name="terms">
<label for="terms">I agree to the Terms</label>

<!-- Radio buttons (single select from group) -->
<input type="radio" id="male" name="gender" value="male">
<label for="male">Male</label>
<input type="radio" id="female" name="gender" value="female">
<label for="female">Female</label>

<!-- Dropdown / Select -->
<select name="city">
    <option value="">-- Select City --</option>
    <option value="delhi">New Delhi</option>
    <option value="mumbai">Mumbai</option>
</select>

<!-- Multi-line text -->
<textarea name="message" rows="5" cols="40" placeholder="Your message..."></textarea>

<!-- File upload -->
<input type="file" accept=".jpg, .png">

<!-- Range slider -->
<input type="range" min="0" max="100" value="50">
\`\`\`

### Form Validation Attributes:
\`\`\`html
<!-- required: field cannot be empty -->
<input type="text" required>

<!-- minlength / maxlength -->
<input type="text" minlength="3" maxlength="15">

<!-- pattern: custom regex -->
<input type="text" pattern="[A-Za-z]+" title="Letters only">

<!-- min / max for numbers and dates -->
<input type="number" min="18" max="99">
\`\`\`
`
            },
            {
                id: 5,
                title: 'CSS Grid Layout',
                description: 'Building complex two-dimensional page layouts.',
                content: `
## CSS Grid

While Flexbox is great for 1D layouts (a single row or column), CSS Grid is designed for **2D layouts** — both rows AND columns at the same time. It's perfect for building complex page structures.

### Enabling Grid:
\`\`\`css
.container {
    display: grid;
    
    /* Define 3 columns */
    grid-template-columns: 200px 1fr 200px;
    
    /* Define 2 rows */
    grid-template-rows: 80px auto 60px;
    
    /* Gap between cells */
    gap: 20px; /* or row-gap / column-gap separately */
}
\`\`\`

### The \`fr\` Unit (Fraction):
\`fr\` represents a fraction of the available space — the most powerful part of Grid!
\`\`\`css
/* 3 equal columns */
grid-template-columns: 1fr 1fr 1fr;

/* Or shorthand using repeat() */
grid-template-columns: repeat(3, 1fr);

/* Sidebar + main + sidebar layout */
grid-template-columns: 250px 1fr 250px;

/* Auto-fill: fit as many columns as possible */
grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
\`\`\`

### Placing Items on the Grid:
\`\`\`css
.header {
    /* Span the entire first row across all 3 columns */
    grid-column: 1 / 4;   /* from line 1 to line 4 */
    grid-row: 1 / 2;
}

.sidebar {
    grid-column: 1 / 2;
    grid-row: 2 / 3;
}

.main-content {
    grid-column: 2 / 3;
    grid-row: 2 / 3;
}

.footer {
    grid-column: 1 / 4;  /* Full width footer */
    grid-row: 3 / 4;
}
\`\`\`

### Named Grid Areas (Cleanest approach!):
\`\`\`css
.container {
    display: grid;
    grid-template-columns: 200px 1fr;
    grid-template-rows: 80px 1fr 60px;
    grid-template-areas:
        "header  header"
        "sidebar content"
        "footer  footer";
}

.header  { grid-area: header; }
.sidebar { grid-area: sidebar; }
.content { grid-area: content; }
.footer  { grid-area: footer; }
\`\`\`
`
            },
            {
                id: 6,
                title: 'Responsive Design & Media Queries',
                description: 'Building websites that adapt to any screen size.',
                content: `
## Responsive Web Design

Responsive design ensures your website looks great on all devices — from a tiny phone to a large 4K monitor.

### The Viewport Meta Tag (Required!):
Always add this to every HTML page. Without it, mobile browsers zoom out to show the desktop version.
\`\`\`html
<meta name="viewport" content="width=device-width, initial-scale=1.0">
\`\`\`

### CSS Media Queries:
Media queries apply CSS rules only when certain conditions (like screen width) are met.
\`\`\`css
/* Base styles (for mobile first!) */
.container {
    padding: 16px;
    font-size: 14px;
}

/* Tablet: screens ≥ 768px */
@media (min-width: 768px) {
    .container {
        padding: 24px;
        font-size: 16px;
    }
}

/* Desktop: screens ≥ 1024px */
@media (min-width: 1024px) {
    .container {
        max-width: 1200px;
        margin: 0 auto;
        padding: 32px;
    }
}

/* Landscape orientation */
@media (orientation: landscape) {
    .hero { height: 60vh; }
}

/* High-resolution displays (Retina) */
@media (-webkit-min-device-pixel-ratio: 2) {
    .logo { background-image: url('logo@2x.png'); }
}
\`\`\`

### Common Breakpoints (Industry Standard):
| Breakpoint | Min Width | Device |
|---|---|---|
| Mobile (default) | 0px | Phones |
| sm | 640px | Large phones |
| md | 768px | Tablets |
| lg | 1024px | Laptops |
| xl | 1280px | Desktops |
| 2xl | 1536px | Large monitors |

### Responsive Grid with Auto-Fill:
\`\`\`css
.card-grid {
    display: grid;
    /* Automatically creates as many columns as fit, min 280px each */
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
    gap: 24px;
}
\`\`\`

### Fluid Typography with \`clamp()\`:
\`\`\`css
/* Font size: min 1rem, scales with viewport, max 2rem */
h1 {
    font-size: clamp(1rem, 3vw, 2rem);
}
\`\`\`
`
            },
            {
                id: 7,
                title: 'CSS Animations & Transitions',
                description: 'Bringing web pages to life with motion and effects.',
                content: `
## CSS Animations & Transitions

Animations make websites feel modern, alive, and polished. CSS gives you two tools: **transitions** (simple A → B) and **animations** (keyframe-based).

### CSS Transitions (Simple State Changes):
Transitions smoothly animate changes triggered by events like hover.
\`\`\`css
.button {
    background: #3b82f6;
    color: white;
    padding: 12px 24px;
    border-radius: 8px;
    border: none;
    
    /* Define what and how to transition */
    transition: background 0.3s ease, transform 0.2s ease;
}

.button:hover {
    background: #1d4ed8;    /* New color — smoothly animated! */
    transform: translateY(-2px);  /* Lifts up */
}

.button:active {
    transform: scale(0.97);  /* Press effect */
}
\`\`\`

### Transition Timing Functions:
\`\`\`css
transition: all 0.3s linear;         /* Constant speed */
transition: all 0.3s ease;           /* Smooth (default) */
transition: all 0.3s ease-in;        /* Starts slow */
transition: all 0.3s ease-out;       /* Ends slow */
transition: all 0.3s ease-in-out;    /* Starts & ends slow */
transition: all 0.4s cubic-bezier(0.68, -0.55, 0.265, 1.55); /* Bounce! */
\`\`\`

### CSS Keyframe Animations:
For more complex, multi-step animations, use \`@keyframes\`.
\`\`\`css
/* Define the animation */
@keyframes fadeInUp {
    from {
        opacity: 0;
        transform: translateY(30px);
    }
    to {
        opacity: 1;
        transform: translateY(0);
    }
}

/* Apply the animation */
.hero-text {
    animation: fadeInUp 0.8s ease-out forwards;
}

/* Multi-step animation */
@keyframes pulse {
    0%   { transform: scale(1); }
    50%  { transform: scale(1.05); }
    100% { transform: scale(1); }
}

.badge {
    animation: pulse 2s ease-in-out infinite;
}
\`\`\`

### Animation Properties:
\`\`\`css
.element {
    animation-name: fadeInUp;
    animation-duration: 0.8s;
    animation-timing-function: ease-out;
    animation-delay: 0.2s;        /* Wait before starting */
    animation-iteration-count: 1; /* or 'infinite' */
    animation-fill-mode: forwards; /* Keep final state */
    
    /* Shorthand */
    animation: fadeInUp 0.8s ease-out 0.2s 1 forwards;
}
\`\`\`
`
            },
            {
                id: 8,
                title: 'CSS Variables & Custom Properties',
                description: 'Building scalable design systems with CSS custom properties.',
                content: `
## CSS Custom Properties (Variables)

CSS Variables (officially called Custom Properties) let you define reusable values in one place and reference them throughout your stylesheet. They're the backbone of any professional design system.

### Defining and Using Variables:
\`\`\`css
/* Variables are typically defined on the :root pseudo-class
   so they are globally accessible */
:root {
    /* Colors */
    --color-primary: #3b82f6;
    --color-primary-dark: #1d4ed8;
    --color-text: #1f2937;
    --color-text-muted: #6b7280;
    --color-bg: #ffffff;
    --color-bg-secondary: #f9fafb;
    --color-border: #e5e7eb;
    
    /* Spacing */
    --spacing-sm: 8px;
    --spacing-md: 16px;
    --spacing-lg: 24px;
    --spacing-xl: 32px;
    
    /* Typography */
    --font-size-sm: 0.875rem;
    --font-size-base: 1rem;
    --font-size-lg: 1.25rem;
    --font-size-xl: 1.5rem;
    
    /* Shadows */
    --shadow-sm: 0 1px 2px rgba(0,0,0,0.05);
    --shadow-md: 0 4px 6px rgba(0,0,0,0.07);
    --shadow-lg: 0 10px 25px rgba(0,0,0,0.1);
    
    /* Border Radius */
    --radius-sm: 4px;
    --radius-md: 8px;
    --radius-lg: 16px;
    --radius-full: 9999px;
}

/* Use the variable with var() */
.button {
    background: var(--color-primary);
    color: white;
    padding: var(--spacing-sm) var(--spacing-md);
    border-radius: var(--radius-md);
    box-shadow: var(--shadow-md);
    font-size: var(--font-size-base);
}

.button:hover {
    background: var(--color-primary-dark);
}
\`\`\`

### Dark Mode with CSS Variables:
\`\`\`css
:root {
    --bg: #ffffff;
    --text: #1f2937;
    --card-bg: #f9fafb;
}

/* Override variables for dark mode */
[data-theme="dark"],
@media (prefers-color-scheme: dark) {
    :root {
        --bg: #0f172a;
        --text: #e2e8f0;
        --card-bg: #1e293b;
    }
}

body {
    background: var(--bg);
    color: var(--text);
    transition: background 0.3s, color 0.3s;
}

.card {
    background: var(--card-bg);
}
\`\`\`
`
            },
            {
                id: 9,
                title: 'Semantic HTML & Accessibility',
                description: 'Writing meaningful HTML that helps users and search engines.',
                content: `
## Semantic HTML & Web Accessibility

Semantic HTML uses elements that clearly describe their purpose — not just their appearance. This helps screen readers, SEO crawlers, and other developers understand your page structure.

### Semantic vs Non-Semantic:
\`\`\`html
<!-- ❌ Non-Semantic (using div for everything) -->
<div class="header">
    <div class="nav">
        <div class="nav-link">Home</div>
    </div>
</div>
<div class="main">
    <div class="article">
        <div class="article-heading">Title</div>
    </div>
</div>

<!-- ✅ Semantic (descriptive tags) -->
<header>
    <nav>
        <a href="/">Home</a>
    </nav>
</header>
<main>
    <article>
        <h1>Title</h1>
    </article>
</main>
\`\`\`

### Key Semantic Elements:
\`\`\`html
<header>    <!-- Site/section header, logo, and nav -->
<nav>       <!-- Navigation links -->
<main>      <!-- Primary content of the page (only one per page) -->
<article>   <!-- Self-contained content (a blog post, a news story) -->
<section>   <!-- Generic section with a heading -->
<aside>     <!-- Sidebar or supplementary content -->
<footer>    <!-- Site/section footer, copyright, links -->
<figure>    <!-- Images, diagrams, charts with optional caption -->
<figcaption><!-- Caption for a <figure> -->
<time datetime="2024-01-15">January 15, 2024</time>
<address>   <!-- Contact information -->
<mark>      <!-- Highlighted text -->
<abbr title="HyperText Markup Language">HTML</abbr>
\`\`\`

### Accessibility (A11y) Best Practices:

**1. Alt Text for Images:**
\`\`\`html
<!-- ✅ Descriptive alt text -->
<img src="dog.jpg" alt="A golden retriever playing fetch in a park">

<!-- For decorative images, use empty alt so screen readers skip it -->
<img src="pattern.svg" alt="">
\`\`\`

**2. ARIA Attributes:**
\`\`\`html
<!-- role: describes the element's purpose when semantic HTML isn't enough -->
<div role="button" tabindex="0" onclick="submit()">Submit</div>

<!-- aria-label: label for screen readers -->
<button aria-label="Close dialog">✕</button>

<!-- aria-expanded: for toggles like menus -->
<button aria-expanded="false" aria-controls="dropdown-menu">
    Menu
</button>

<!-- aria-live: announces dynamic changes to screen readers -->
<div aria-live="polite" id="status-message"></div>
\`\`\`

**3. Keyboard Navigation:**
\`\`\`css
/* Never remove focus outline — keyboard users need it! */
:focus-visible {
    outline: 3px solid #3b82f6;
    outline-offset: 2px;
}
\`\`\`
`
            },
            {
                id: 10,
                title: 'CSS Pseudo-classes & Pseudo-elements',
                description: 'Targeting special states and adding decorative content.',
                content: `
## Pseudo-classes & Pseudo-elements

### Pseudo-classes (States)
Pseudo-classes target elements in a **specific state** or **position** in the DOM.

\`\`\`css
/* User interaction states */
a:hover    { color: blue; }        /* Mouse over */
a:active   { color: red; }         /* Being clicked */
a:visited  { color: purple; }      /* Already visited */
input:focus { border-color: blue; } /* Has keyboard focus */
button:disabled { opacity: 0.5; }   /* Not interactive */

/* Structural pseudo-classes */
li:first-child     { font-weight: bold; }  /* First li in parent */
li:last-child      { border-bottom: none; }/* Last li in parent */
li:nth-child(2)    { background: #f0f0f0; }/* Exactly 2nd item */
li:nth-child(odd)  { background: #f9f9f9; }/* 1st, 3rd, 5th... */
li:nth-child(even) { background: white; }  /* 2nd, 4th, 6th... */
p:not(.special)    { color: gray; }        /* Every p WITHOUT .special */

/* Form states */
input:valid   { border-color: green; }
input:invalid { border-color: red; }
input:required { border-left: 3px solid blue; }
input:checked + label { font-weight: bold; } /* After a checked checkbox */
\`\`\`

### Pseudo-elements (Virtual Elements)
Pseudo-elements create **virtual elements** — they let you style a part of an element or insert content without adding HTML.

\`\`\`css
/* ::before — insert content BEFORE the element's content */
.button::before {
    content: "→ ";
    color: gold;
}

/* ::after — insert content AFTER the element's content */
.price::after {
    content: " USD";
    font-size: 0.75em;
    color: gray;
}

/* ::first-letter — style just the first letter */
p::first-letter {
    font-size: 2em;
    font-weight: bold;
    float: left;
    color: #3b82f6;
}

/* ::first-line — style just the first line of a block */
p::first-line {
    font-weight: 600;
}

/* ::selection — style text selected by the user */
::selection {
    background: #3b82f6;
    color: white;
}

/* ::placeholder — style input placeholder text */
input::placeholder {
    color: #9ca3af;
    font-style: italic;
}
\`\`\`

### Common Pattern: Custom Checkbox using Pseudo-elements:
\`\`\`css
input[type="checkbox"] {
    display: none; /* Hide the default checkbox */
}

input[type="checkbox"] + label::before {
    content: "";
    display: inline-block;
    width: 18px;
    height: 18px;
    border: 2px solid #d1d5db;
    border-radius: 4px;
    margin-right: 8px;
    vertical-align: middle;
}

input[type="checkbox"]:checked + label::before {
    background: #3b82f6;
    border-color: #3b82f6;
    content: "✓";
    color: white;
    text-align: center;
    line-height: 14px;
    font-size: 12px;
}
\`\`\`
`
            },
            {
                id: 11,
                title: 'CSS Positioning & Z-index',
                description: 'Controlling exactly where elements appear on screen.',
                content: `
## CSS Positioning

The \`position\` property is one of the most powerful—and confusing—CSS properties. It controls how an element is placed in the document flow.

### The 5 Position Values:

**1. \`static\` (Default)**
Normal document flow. Top/left/right/bottom/z-index have no effect.

**2. \`relative\`**
Element stays in normal flow, but you can offset it using top/left/etc. without affecting surrounding elements. Also creates a positioning context for children!
\`\`\`css
.nudged {
    position: relative;
    top: -5px;  /* Moves up 5px from its natural position */
    left: 10px;
}
\`\`\`

**3. \`absolute\`**
Completely removed from normal flow. Positioned relative to the nearest \`relative\`/\`absolute\`/\`fixed\` ancestor.
\`\`\`css
.parent {
    position: relative; /* Makes parent the anchor */
}

.tooltip {
    position: absolute;
    top: 100%;   /* Directly below the parent */
    left: 50%;
    transform: translateX(-50%); /* Center it */
}
\`\`\`

**4. \`fixed\`**
Positioned relative to the **browser viewport**. Stays in place even when scrolling. Perfect for sticky headers, floating buttons.
\`\`\`css
.navbar {
    position: fixed;
    top: 0;
    left: 0;
    right: 0; /* Stretch full width */
    z-index: 1000;
}

.fab-button {
    position: fixed;
    bottom: 24px;
    right: 24px;
}
\`\`\`

**5. \`sticky\`**
A hybrid! Acts like \`relative\` until you scroll past a threshold, then it "sticks" like \`fixed\`.
\`\`\`css
.table-header {
    position: sticky;
    top: 0; /* Sticks when scrolled to the top of the viewport */
    background: white;
    z-index: 10;
}
\`\`\`

### Z-index (Stacking Order):
\`z-index\` controls which element appears on top when elements overlap. **Higher z-index = on top**. Only works on positioned elements (not \`static\`).
\`\`\`css
.backdrop  { z-index: 100; }  /* Modal overlay */
.modal     { z-index: 200; }  /* Above overlay */
.dropdown  { z-index: 300; }  /* Above modal */
.tooltip   { z-index: 400; }  /* Highest */
\`\`\`
`
            },
            {
                id: 12,
                title: 'Building a Complete Web Page',
                description: 'Bringing everything together to build a modern professional page.',
                content: `
## Putting It All Together

Let's build a complete, modern web page structure using all the concepts covered in this course.

### Full Page Structure:
\`\`\`html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="description" content="Algocore - Learn Programming Fast">
    <title>Algocore | Learn Programming</title>
    <link rel="stylesheet" href="styles.css">
</head>
<body>
    <!-- Sticky Navigation -->
    <header>
        <nav class="navbar">
            <a href="/" class="logo">Algocore</a>
            <ul class="nav-links">
                <li><a href="#courses">Courses</a></li>
                <li><a href="#about">About</a></li>
                <li><a href="/login" class="btn">Login</a></li>
            </ul>
        </nav>
    </header>

    <!-- Hero Section -->
    <main>
        <section class="hero">
            <h1>Learn Programming Fast</h1>
            <p>Master Java, Python, C++, and more with hands-on exercises.</p>
            <a href="#courses" class="btn btn-primary">Start Learning →</a>
        </section>

        <!-- Courses Grid -->
        <section id="courses">
            <h2>Popular Courses</h2>
            <div class="courses-grid">
                <article class="course-card">
                    <h3>Java</h3>
                    <p>Learn Java from basics to OOP.</p>
                    <a href="/learn/java">Start Course</a>
                </article>
                <!-- More cards... -->
            </div>
        </section>
    </main>

    <footer>
        <p>&copy; 2024 Algocore. All rights reserved.</p>
    </footer>
</body>
</html>
\`\`\`

### Complete CSS for the Page:
\`\`\`css
/* ===== CSS Variables (Design System) ===== */
:root {
    --primary: #3b82f6;
    --primary-dark: #1d4ed8;
    --text: #1f2937;
    --text-muted: #6b7280;
    --bg: #ffffff;
    --bg-gray: #f9fafb;
    --border: #e5e7eb;
    --radius: 12px;
    --shadow: 0 4px 16px rgba(0,0,0,0.08);
    --transition: all 0.25s ease;
}

/* ===== Reset ===== */
*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
body { font-family: 'Inter', sans-serif; color: var(--text); background: var(--bg); line-height: 1.6; }
a { text-decoration: none; color: inherit; }

/* ===== Navbar ===== */
.navbar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 16px 32px;
    position: sticky;
    top: 0;
    background: rgba(255,255,255,0.9);
    backdrop-filter: blur(12px);
    border-bottom: 1px solid var(--border);
    z-index: 100;
}

.logo { font-size: 1.5rem; font-weight: 800; color: var(--primary); }

.nav-links { display: flex; list-style: none; gap: 32px; align-items: center; }
.nav-links a { color: var(--text-muted); font-weight: 500; transition: var(--transition); }
.nav-links a:hover { color: var(--primary); }

/* ===== Hero ===== */
.hero {
    text-align: center;
    padding: 100px 24px;
    background: linear-gradient(135deg, #eff6ff, #f0fdf4);
}

.hero h1 { font-size: clamp(2rem, 5vw, 4rem); font-weight: 900; margin-bottom: 16px; }
.hero p  { font-size: 1.25rem; color: var(--text-muted); margin-bottom: 32px; }

/* ===== Buttons ===== */
.btn {
    display: inline-block;
    padding: 12px 24px;
    border-radius: 8px;
    font-weight: 600;
    transition: var(--transition);
}

.btn-primary {
    background: var(--primary);
    color: white;
}

.btn-primary:hover {
    background: var(--primary-dark);
    transform: translateY(-2px);
    box-shadow: 0 8px 20px rgba(59,130,246,0.3);
}

/* ===== Courses Grid ===== */
.courses-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
    gap: 24px;
    padding: 24px;
    max-width: 1200px;
    margin: 0 auto;
}

.course-card {
    background: white;
    border: 1px solid var(--border);
    border-radius: var(--radius);
    padding: 24px;
    box-shadow: var(--shadow);
    transition: var(--transition);
}

.course-card:hover {
    transform: translateY(-4px);
    box-shadow: 0 12px 30px rgba(0,0,0,0.12);
}

/* ===== Responsive ===== */
@media (max-width: 768px) {
    .navbar { padding: 12px 16px; }
    .nav-links { gap: 16px; }
    .hero { padding: 60px 16px; }
}
\`\`\`
`
            }
        ]
    }
};


