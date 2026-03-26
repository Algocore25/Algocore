import { daaLesson5 } from './daaLesson5';
import { daaLesson6 } from './daaLesson6';
import { daaLesson3 } from './daaLesson3';
import { daaLesson4 } from './daaLesson4';
import { daaLesson1 } from './daaLesson1';
import { daaLesson2 } from './daaLesson2';

export const daa = {
  id: 'daa',
  name: 'Design & Analysis of Algorithms',
  description: 'Master time complexity, algorithm design techniques, and analysis paradigms.',
  longDescription: 'A comprehensive course on analyzing algorithmic complexities and mastering design paradigms like Divide and Conquer, Greedy Algorithms, and Dynamic Programming.',
  icon: '⏱️',
  color: 'from-orange-500 to-red-600',
  students: 15400,
  rating: 4.8,
  reviews: 630,
  difficulty: 'Advanced',
  hours: 35,
  prerequisites: ['Basic Data Structures (Arrays, Trees, Graphs)', 'Programming basics', 'Understanding of basic mathematics and logarithms'],
  learningObjectives: ['Calculate time space complexities', 'Master Divide & Conquer', 'Understand Dynamic Programming', 'Implement Greedy algorithms', 'Solve N-P Hard problems'],
  keyTopics: ['Asymptotic Notation', 'Divide & Conquer', 'Dynamic Programming', 'Greedy Algorithms', 'Backtracking', 'Graph Algorithms'],
  lessons: [daaLesson1, daaLesson2, daaLesson3, daaLesson4, daaLesson5, daaLesson6]
};
