export const sqlLesson4 = {
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
};