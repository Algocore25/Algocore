export const javaLesson4 = {
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
};