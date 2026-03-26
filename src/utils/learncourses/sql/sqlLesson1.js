export const sqlLesson1 = {
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
};