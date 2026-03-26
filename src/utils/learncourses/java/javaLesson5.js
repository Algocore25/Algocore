export const javaLesson5 = {
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
};