export const pythonLesson4 = {
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
};