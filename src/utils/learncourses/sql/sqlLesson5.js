export const sqlLesson5 = {
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
};