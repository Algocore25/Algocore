export const cppLesson4 = {
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
};