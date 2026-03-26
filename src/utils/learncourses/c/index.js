import { cLesson15 } from './cLesson15';
import { cLesson16 } from './cLesson16';
import { cLesson13 } from './cLesson13';
import { cLesson14 } from './cLesson14';
import { cLesson1 } from './cLesson1';
import { cLesson2 } from './cLesson2';
import { cLesson3 } from './cLesson3';
import { cLesson4 } from './cLesson4';
import { cLesson5 } from './cLesson5';
import { cLesson6 } from './cLesson6';
import { cLesson7 } from './cLesson7';
import { cLesson8 } from './cLesson8';
import { cLesson9 } from './cLesson9';
import { cLesson10 } from './cLesson10';
import { cLesson11 } from './cLesson11';
import { cLesson12 } from './cLesson12';

export const c = {
  id: 'c',
  name: 'C Programming',
  description: 'The foundational systems programming language behind modern OS',
  longDescription: 'Foundational course on C programming covering procedural concepts, memory management, and system-level programming for building efficient applications.',
  icon: '⚙️',
  color: 'from-gray-500 to-slate-600',
  students: 28900,
  rating: 4.5,
  reviews: 720,
  difficulty: 'Intermediate',
  hours: 22,
  prerequisites: ['Basic computer literacy', 'Understanding of algorithms and computational thinking', 'C compiler installed (GCC, MinGW, or similar)'],
  learningObjectives: ['Master C fundamentals and syntax', 'Understand memory and pointers', 'Work with arrays, strings, and structures', 'Implement algorithms efficiently', 'Debug and optimize C programs', 'Build system-level software'],
  keyTopics: ['Variables & Data Types', 'Control Flow', 'Functions & Scope', 'Pointers', 'Arrays & Strings', 'Structures & Unions', 'File I/O', 'Dynamic Memory'],
  lessons: [cLesson1, cLesson2, cLesson3, cLesson4, cLesson5, cLesson6, cLesson7, cLesson8, cLesson9, cLesson10, cLesson11, cLesson12, cLesson13, cLesson14, cLesson15, cLesson16]
};