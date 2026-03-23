# React to Next.js Migration Plan

## 🎯 Objective
Convert the existing React AlgoCore NQT application to a modern Next.js application while preserving all functionality and improving the codebase.

## 📋 Current State Analysis
- **Existing**: React app with complex SQL functionality
- **Target**: Next.js app with modern architecture
- **Location**: `src/pages/` directory
- **Dependencies**: Firebase, Monaco Editor, React Icons, Toastify

## 🚀 Migration Strategy

### Phase 1: Setup & Planning
1. **Create Next.js Structure**
   - Set up proper Next.js project with TypeScript support
   - Configure Tailwind CSS
   - Set up ESLint and Prettier
   - Create proper folder structure

2. **Component Analysis**
   - Identify all React components in `src/pages/`
   - Document component dependencies and props
   - Plan component migration to Next.js pages

3. **API Integration**
   - Preserve Firebase integration
   - Maintain existing API endpoints
   - Plan server-side vs client-side functionality

4. **Feature Mapping**
   - SQL execution functionality
   - Code editor with Monaco
   - Theme system (light/dark)
   - Toast notifications
   - Local storage for code/settings

### Phase 2: Core Migration
1. **Pages Migration**
   - Convert `SqlPage.jsx` to `pages/index.js`
   - Convert `Exam/SqlPage.jsx` to `pages/exam.js`
   - Convert `CodePageSingle.jsx` to `pages/single.js`
   - Convert `CodePageMultifile.jsx` to `pages/multifile.js`

2. **Component Architecture**
   - Create reusable components in `components/`
   - Implement proper Next.js data fetching
   - Add proper TypeScript types

3. **Styling Migration**
   - Convert existing CSS to Tailwind CSS
   - Implement responsive design
   - Maintain theme system

### Phase 3: Enhancement
1. **Performance Optimization**
   - Implement code splitting
   - Add proper loading states
   - Optimize bundle size

2. **Developer Experience**
   - Hot module replacement
   - Better error handling
   - Improved debugging tools

3. **Testing Setup**
   - Add Jest configuration
   - Create component tests
   - Set up CI/CD pipeline

## 📁 Implementation Steps

### Step 1: Project Setup
- [ ] Initialize Next.js project
- [ ] Configure Tailwind CSS
- [ ] Set up ESLint
- [ ] Create folder structure

### Step 2: Core Pages
- [ ] Migrate SqlPage to pages/index.js
- [ ] Migrate Exam/SqlPage to pages/exam.js
- [ ] Create pages/single.js from CodePageSingle
- [ ] Create pages/multifile.js from CodePageMultifile

### Step 3: Components
- [ ] Create components/CodeEditor.js
- [ ] Create components/ThemeToggle.js
- [ ] Create components/OutputDisplay.js
- [ ] Create components/QuestionSelector.js

### Step 4: API & Data
- [ ] Set up Firebase integration
- [ ] Create API routes if needed
- [ ] Implement proper data fetching

### Step 5: Styling
- [ ] Migrate CSS to Tailwind
- [ ] Implement responsive design
- [ ] Maintain theme system

### Step 6: Testing & Deployment
- [ ] Add Jest configuration
- [ ] Create test files
- [ ] Set up build process
- [ ] Configure deployment

## ⚠️ Migration Notes

### Critical Components to Preserve
1. **SQL Execution Engine**: Core functionality for running SQL queries
2. **Monaco Editor Integration**: Code editing with syntax highlighting
3. **Firebase Integration**: User authentication and data persistence
4. **Theme System**: Light/dark mode toggle
5. **Toast Notifications**: User feedback system
6. **Local Storage**: Code persistence and settings

### File Mapping Plan
```
React Structure → Next.js Structure
src/pages/SqlPage.jsx → pages/index.js
src/pages/Exam/SqlPage.jsx → pages/exam.js  
src/pages/CodePageSingle.jsx → pages/single.js
src/pages/CodePageMultifile.jsx → pages/multifile.js
src/components/ → components/
src/styles/ → styles/globals.css (Tailwind)
```

### Dependencies to Maintain
- Firebase (^10.8.0)
- React (^18.2.0)
- Monaco Editor (^4.6.0)
- React Icons (^1.3.0, ^5.0.1)
- React Toastify (^10.0.0)
- Tailwind CSS (latest)

## 🎯 Success Criteria
- [ ] All pages converted to Next.js format
- [ ] All functionality preserved and working
- [ ] Modern styling with Tailwind CSS
- [ ] TypeScript support added
- [ ] Performance improved
- [ ] Developer experience enhanced
- [ ] Testing infrastructure in place

## 📅 Timeline Estimate
- **Phase 1**: 2-3 hours (Setup)
- **Phase 2**: 8-12 hours (Core Migration)
- **Phase 3**: 4-6 hours (Components)
- **Phase 4**: 3-4 hours (API & Styling)
- **Phase 5**: 2-3 hours (Testing & Deployment)
- **Total**: 19-28 hours

This plan ensures a systematic migration with minimal risk and maximum preservation of existing functionality.
