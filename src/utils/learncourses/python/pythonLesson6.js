export const pythonLesson6 = {
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
};