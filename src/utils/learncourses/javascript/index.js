import { javascriptLesson8 } from './javascriptLesson8';
import { javascriptLesson9 } from './javascriptLesson9';
import { javascriptLesson6 } from './javascriptLesson6';
import { javascriptLesson7 } from './javascriptLesson7';
import { javascriptLesson1 } from './javascriptLesson1';
import { javascriptLesson2 } from './javascriptLesson2';
import { javascriptLesson3 } from './javascriptLesson3';
import { javascriptLesson4 } from './javascriptLesson4';
import { javascriptLesson5 } from './javascriptLesson5';

export const javascript = {
  id: 'javascript',
  name: 'JavaScript for Web Development',
  description: 'Build interactive web apps with the language of the internet',
  longDescription: 'Learn JavaScript from fundamentals through advanced concepts including ES6+, async programming, and DOM manipulation for full-stack web development.',
  icon: '🌐',
  color: 'from-yellow-400 to-orange-400',
  students: 78940,
  rating: 4.9,
  reviews: 2100,
  difficulty: 'Beginner',
  hours: 28,
  prerequisites: ['Basic HTML and CSS knowledge', 'Understanding of variables and functions', 'A modern web browser and text editor'],
  learningObjectives: ['Master JavaScript syntax and semantics', 'Understand the DOM and event handling', 'Learn async programming (promises, async/await)', 'Work with modern ES6+ features', 'Manage application state effectively', 'Integrate with APIs and handle HTTP requests'],
  keyTopics: ['Variables & Data Types', 'Functions & Scope', 'DOM Manipulation', 'Event Handling', 'Promises & Async/Await', 'ES6+ Features', 'Higher-Order Functions', 'Error Handling'],
  lessons: [javascriptLesson1, javascriptLesson2, javascriptLesson3, javascriptLesson4, javascriptLesson5, javascriptLesson6, javascriptLesson7, javascriptLesson8, javascriptLesson9]
};