export const pythonLesson2 = {
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
};