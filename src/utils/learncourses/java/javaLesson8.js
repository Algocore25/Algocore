export const javaLesson8 = {
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
};