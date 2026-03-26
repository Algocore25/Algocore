export const pythonLesson3 = {
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
};