export const python = {
    id: 'python',
    name: 'Python Programming',
    description: 'Master Python for programming and data science',
    longDescription: 'A comprehensive introduction to Python programming. Learn from fundamentals through advanced concepts, covering everything needed to build real-world applications.',
    icon: '🐍',
    color: 'from-blue-400 to-cyan-500',
    students: 62150,
    rating: 4.9,
    reviews: 1520,
    difficulty: 'Beginner',
    hours: 28,
    prerequisites: [
        'No prior programming experience required',
        'Computer with Python installed',
        'Text editor or IDE (VS Code, PyCharm, etc.)'
    ],
    learningObjectives: [
        'Understand Python fundamentals and syntax',
        'Master variables, data types, and control flow',
        'Write functions and work with modules',
        'Handle files, exceptions, and debugging',
        'Use libraries like NumPy for data manipulation',
        'Build practical applications and projects'
    ],
    keyTopics: [
        'Variables & Data Types',
        'Control Flow',
        'Functions & Scope',
        'Object-Oriented Programming',
        'File Handling',
        'Libraries & Modules',
        'Error Handling',
        'Data Structures'
    ],
    lessons: [
        {
            id: 1,
            title: 'Python Fundamentals & Setup',
            description: 'Introduction, setup, variables, data types, and control flow',
            difficulty: 'Beginner',
            duration: '10 mins',
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

# Loop with Else:
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
};
