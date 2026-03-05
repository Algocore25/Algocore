export const sql = {
    id: 'sql',
    name: 'SQL & Database Design',
    description: 'Master database management with SQL',
    longDescription: 'Comprehensive course on SQL fundamentals, query optimization, database design principles, and practical data manipulation techniques.',
    icon: '🗄️',
    color: 'from-green-400 to-emerald-500',
    students: 38720,
    rating: 4.7,
    reviews: 980,
    difficulty: 'Beginner',
    hours: 10,
    prerequisites: [
        'Basic computer literacy and database concepts',
        'Understanding of tables, rows, and columns',
        'SQL environment setup (MySQL, PostgreSQL, or SQLite)'
    ],
    learningObjectives: [
        'Master SQL SELECT queries and filtering',
        'Learn JOINs and complex data retrieval',
        'Create and manipulate tables effectively',
        'Understand database design and normalization',
        'Optimize queries for performance',
        'Work with transactions and constraints'
    ],
    keyTopics: [
        'SELECT Queries',
        'WHERE & Filtering',
        'JOINs',
        'Aggregation & GROUP BY',
        'Subqueries',
        'Database Design',
        'Normalization',
        'Indexes & Performance'
    ],
    lessons: [
        {
            id: 1,
            title: 'SQL Basics & Architecture',
            description: 'Relational Database basics and intro to SQL',
            difficulty: 'Beginner',
            duration: '11 mins',
            content: `
## Relational Databases & SQL

SQL stands for **Structured Query Language**. It is the standard language designed to query, maintain, and manipulate Relational Database Management Systems (RDBMS) like MySQL, PostgreSQL, Oracle, and SQL Server.

### What is a Database?
A database is an organized repository of data. In a **Relational Database**, data is stored in **Tables** (Relations), which are comprised of **Columns** (Fields) and **Rows** (Records). 

### Main Categories of SQL Commands:
1. **DDL (Data Definition Language)**: Creates/modifies the database structure (\`CREATE\`, \`ALTER\`, \`DROP\`, \`TRUNCATE\`).
2. **DML (Data Manipulation Language)**: Edits the data itself (\`INSERT\`, \`UPDATE\`, \`DELETE\`).
3. **DQL (Data Query Language)**: Fetches the data (\`SELECT\`).
4. **DCL (Data Control Language)**: Manages permissions (\`GRANT\`, \`REVOKE\`).
5. **TCL (Transaction Control Language)**: Manages transaction states (\`COMMIT\`, \`ROLLBACK\`).

### Table Creation (DDL):
\`\`\`sql
CREATE TABLE Users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50),
    email VARCHAR(100) UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
\`\`\`
`
        },
        {
            id: 2,
            title: 'Querying Data (SELECT)',
            description: 'Fetching and filtering dataset elements.',
            content: `
## Data Query Language (SELECT)

The \`SELECT\` statement is the most used string of SQL commands. It fetches output data from your tables and can transform/filter it on the fly.

### Basic Fetching:
\`\`\`sql
-- Select all columns from the table
SELECT * FROM employees;

-- Select specific columns
SELECT first_name, salary FROM employees;

-- Alias columns (renaming output)
SELECT first_name AS "Name", salary AS "Compensation" FROM employees;
\`\`\`

### Filtering via WHERE:
The \`WHERE\` clause acts as an \`if\` statement for fetching rows.
\`\`\`sql
-- Mathematical operators (=, >, <, >=, <=, <>)
SELECT * FROM employees WHERE salary >= 50000;

-- Logical operators (AND, OR, NOT)
SELECT * FROM employees WHERE department = 'IT' AND salary > 60000;

-- IN (matches any value in a list)
SELECT * FROM employees WHERE department IN ('IT', 'HR', 'Finance');

-- BETWEEN (matches range inclusive)
SELECT * FROM employees WHERE age BETWEEN 25 AND 35;

-- LIKE (regex-lite string matching, % = wildcard string, _ = wildcard char)
SELECT * FROM employees WHERE last_name LIKE 'Smi%'; -- Starts with Smi
\`\`\`

### Sorting and Paginating:
\`\`\`sql
-- Sort ascending (default) or descending
SELECT * FROM employees ORDER BY salary DESC;

-- Sort by multiple columns
SELECT * FROM employees ORDER BY department ASC, salary DESC;

-- Paginate/Limit the returns (great for 'Top 10' queries)
SELECT * FROM employees ORDER BY salary DESC LIMIT 10;
\`\`\`
`
        },
        {
            id: 3,
            title: 'DML (Insert, Update, Delete)',
            description: 'Modifying actual row data in the database.',
            content: `
## Modifying Data (DML)

### INSERT: Adding rows
\`\`\`sql
-- Insert a single row (must list columns if omitting some values)
INSERT INTO students (name, email, age) 
VALUES ('John', 'john@email.com', 22);

-- Insert completely without declaring columns (must exact match schema order)
INSERT INTO students 
VALUES (2, 'Mary', 'mary@email.com', 21);

-- Insert multiple rows safely
INSERT INTO students (name, email, age) 
VALUES 
('Alice', 'alice@g.com', 21),
('Bob', 'bob@g.com', 23);
\`\`\`

### UPDATE: Modifying existing rows
Always use a \`WHERE\` clause on an update, otherwise you update the **entire table**!
\`\`\`sql
-- Update specific records
UPDATE students 
SET age = 25 
WHERE name = 'John';

-- Update multiple columns
UPDATE students 
SET age = 24, city = 'Boston' 
WHERE student_id = 1;
\`\`\`

### DELETE: Removing existing rows
Like \`UPDATE\`, a \`DELETE\` without a \`WHERE\` clause truncates all data!
\`\`\`sql
-- Delete specific records
DELETE FROM students WHERE name = 'John';

-- Delete with condition
DELETE FROM students WHERE age < 18;
\`\`\`
`
        },
        {
            id: 4,
            title: 'Data Aggregation & Grouping',
            description: 'Math operations and group summaries.',
            content: `
## Aggregation & Grouping

Often you don't want to see individual rows, but rather summary statistics of your data.

### Aggregate Functions:
These functions process an entire column's data down into a single returned row.
\`\`\`sql
-- Count total rows
SELECT COUNT(*) FROM employees;

-- Computations
SELECT SUM(salary) AS total_payroll FROM employees;
SELECT AVG(salary) AS avg_salary FROM employees;
SELECT MIN(salary), MAX(salary) FROM employees;
\`\`\`

### GROUP BY Clause:
If you use aggregate functions coupled with a normal column fetch, you **must \`GROUP BY\`** the normal column. This summarizes the aggregate per unique group of the group parameters!

\`\`\`sql
-- Calculate the average salary per department
SELECT department, AVG(salary) 
FROM employees 
GROUP BY department;

-- Calculate number of people hired per year
SELECT EXTRACT(YEAR FROM hire_date) as yr, COUNT(*) 
FROM employees
GROUP BY yr
ORDER BY yr DESC;
\`\`\`

### HAVING Clause:
\`WHERE\` filters rows *before* they are grouped. \`HAVING\` filters the groups *after* they are grouped!
\`\`\`sql
-- Find departments where the average salary is greater than $60,000
SELECT department, AVG(salary)
FROM employees
GROUP BY department
HAVING AVG(salary) > 60000;
\`\`\`
`
        },
        {
            id: 5,
            title: 'JOINS & Relationships',
            description: 'Combining multiple tables into a single output.',
            content: `
## JOINS in SQL

Real databases are normalized (split into many highly-efficient tables). Thus, to read cohesive data, we must JOIN tables back together relying on their mathematical relationships (Foreign Keys).

### Types of JOINs

1. **INNER JOIN (Default JOIN)**: Returns records that have matching values in **both** tables.
   \`\`\`sql
   SELECT Orders.order_id, Customers.name
   FROM Orders
   INNER JOIN Customers ON Orders.customer_id = Customers.id;
   \`\`\`

2. **LEFT JOIN (Left Outer Join)**: Returns all records from the left table, and the matched records from the right table. (Fills with NULL if no match exists on the right).
   \`\`\`sql
   -- Get all users, and any orders they might have placed
   SELECT Users.name, Orders.total
   FROM Users
   LEFT JOIN Orders ON Users.id = Orders.user_id;
   \`\`\`

3. **RIGHT JOIN**: Returns all records from the right table, and matched on the left.
4. **FULL OUTER JOIN**: Returns all records when there is a match in either left or right table.

### Example Multi-Table Query:
Look at how aliases make writing JOINs dramatically cleaner!
\`\`\`sql
SELECT 
    e.first_name, 
    e.last_name, 
    d.department_name, 
    l.city
FROM employees e
JOIN departments d ON e.department_id = d.id
JOIN locations l ON d.location_id = l.id
WHERE e.salary > 50000;
\`\`\`
`
        }
    ]
};
