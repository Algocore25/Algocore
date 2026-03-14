export const pythonLesson7 = {
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
};