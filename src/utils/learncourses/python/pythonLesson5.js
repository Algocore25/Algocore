export const pythonLesson5 = {
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
};