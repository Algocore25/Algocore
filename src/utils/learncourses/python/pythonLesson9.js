export const pythonLesson9 = {
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
};