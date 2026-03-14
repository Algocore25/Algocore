export const sqlLesson3 = {
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
};