export const pythonLesson1 = {
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
};