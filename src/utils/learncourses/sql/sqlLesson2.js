export const sqlLesson2 = {
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
};