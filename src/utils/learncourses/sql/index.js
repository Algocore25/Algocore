import { sqlLesson8 } from './sqlLesson8';
import { sqlLesson9 } from './sqlLesson9';
import { sqlLesson6 } from './sqlLesson6';
import { sqlLesson7 } from './sqlLesson7';
import { sqlLesson1 } from './sqlLesson1';
import { sqlLesson2 } from './sqlLesson2';
import { sqlLesson3 } from './sqlLesson3';
import { sqlLesson4 } from './sqlLesson4';
import { sqlLesson5 } from './sqlLesson5';

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
  prerequisites: ['Basic computer literacy and database concepts', 'Understanding of tables, rows, and columns', 'SQL environment setup (MySQL, PostgreSQL, or SQLite)'],
  learningObjectives: ['Master SQL SELECT queries and filtering', 'Learn JOINs and complex data retrieval', 'Create and manipulate tables effectively', 'Understand database design and normalization', 'Optimize queries for performance', 'Work with transactions and constraints'],
  keyTopics: ['SELECT Queries', 'WHERE & Filtering', 'JOINs', 'Aggregation & GROUP BY', 'Subqueries', 'Database Design', 'Normalization', 'Indexes & Performance'],
  lessons: [sqlLesson1, sqlLesson2, sqlLesson3, sqlLesson4, sqlLesson5, sqlLesson6, sqlLesson7, sqlLesson8, sqlLesson9]
};