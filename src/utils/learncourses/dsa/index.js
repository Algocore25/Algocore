import { dsaLesson15 } from './dsaLesson15';
import { dsaLesson16 } from './dsaLesson16';
import { dsaLesson13 } from './dsaLesson13';
import { dsaLesson14 } from './dsaLesson14';
import { dsaLesson1 } from './dsaLesson1';
import { dsaLesson2 } from './dsaLesson2';
import { dsaLesson3 } from './dsaLesson3';
import { dsaLesson4 } from './dsaLesson4';
import { dsaLesson5 } from './dsaLesson5';
import { dsaLesson6 } from './dsaLesson6';
import { dsaLesson7 } from './dsaLesson7';
import { dsaLesson8 } from './dsaLesson8';
import { dsaLesson9 } from './dsaLesson9';
import { dsaLesson10 } from './dsaLesson10';
import { dsaLesson11 } from './dsaLesson11';
import { dsaLesson12 } from './dsaLesson12';

export const dsa = {
  id: 'dsa',
  name: 'Data Structures & Algorithms',
  description: 'Master Data Structures & Algorithms for coding interviews',
  longDescription: 'A comprehensive course on fundamental data structures and algorithms. Learn how to analyze algorithm efficiency, implement essential data structures, and solve complex problems using optimal approaches.',
  icon: '🧩',
  color: 'from-violet-500 to-purple-600',
  students: 52000,
  rating: 4.8,
  reviews: 1680,
  difficulty: 'Intermediate',
  hours: 30,
  prerequisites: ['Basic programming knowledge (loops, functions, arrays)', 'Understanding of variables and data types', 'Comfort with basic algorithms'],
  learningObjectives: ['Understand time and space complexity analysis using Big O notation', 'Master essential data structures (arrays, linked lists, stacks, queues, trees, graphs)', 'Learn and implement classic algorithms (sorting, searching, dynamic programming)', 'Develop problem-solving strategies for coding interviews', 'Optimize solutions for performance and scalability'],
  keyTopics: ['Complexity Analysis', 'Arrays & Hashing', 'Linked Lists', 'Stacks & Queues', 'Trees & Graphs', 'Sorting & Searching', 'Dynamic Programming', 'Recursion & Backtracking'],
  lessons: [dsaLesson1, dsaLesson2, dsaLesson3, dsaLesson4, dsaLesson5, dsaLesson6, dsaLesson7, dsaLesson8, dsaLesson9, dsaLesson10, dsaLesson11, dsaLesson12, dsaLesson13, dsaLesson14, dsaLesson15, dsaLesson16]
};