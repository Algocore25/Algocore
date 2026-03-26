const fs = require('fs');
const path = require('path');

const routes = [
  // Public
  { path: 'login', target: 'views/LoginPage' },
  { path: 'profile', target: 'views/ProfilePage' },
  { path: 'compiler', target: 'views/CompilerPage' },
  { path: 'courses', target: 'views/CoursesPage' },
  { path: 'about', target: 'views/AboutPage' },
  { path: 'contact', target: 'views/ContactPage' },
  { path: 'search', target: 'views/SearchUsersPage' },
  { path: 'learn', target: 'views/LearnPage' },
  { path: 'course/[course]', target: 'views/CoursePage' },
  { path: 'learn/[courseId]', target: 'views/CourseDetailsPage' },
  { path: 'u/[username]', target: 'views/PublicProfilePage' },

  // Admin
  { path: 'admin', target: 'views/Admin/TestsList', admin: true },
  { path: 'adminmonitor', target: 'views/Admin/AdminMonitor', admin: true },
  { path: 'all-questions', target: 'views/AllQuestionsPage', admin: true },
  { path: 'admin-reports', target: 'views/Admin/ReportsPage', admin: true },
  { path: 'admin-email', target: 'views/Admin/EmailPage', admin: true },
  { path: 'testedit/[testId]', target: 'views/Admin/TestManage', admin: true },
  { path: 'courseedit/[courseId]', target: 'views/Admin/CourseEdit', admin: true },
  { path: 'bulk-course-upload', target: 'views/Admin/BulkCourseUpload', admin: true },
  { path: 'exammonitor/[testid]', target: 'views/Admin/ExamMonitor', admin: true },
  { path: 'adminresults/[testid]', target: 'views/Admin/AdminResults', admin: true },
  
  // User
  { path: 'problem/[course]/[subcourse]/[questionId]', target: 'views/DynamicComponent', user: true },
  { path: 'test', target: 'views/Exam/TestsPage', user: true, desktop: true },
  { path: 'examwindow/[testid]', target: 'views/Exam/DynamicExam', user: true, desktop: true },
  { path: 'studentresults/[testid]', target: 'views/Exam/StudentResults', user: true },
  
  // Others
  { path: 'not-found', target: 'views/NotFoundPage' },
  { path: 'firebase-upload', target: 'views/FirebaseUploadPage' },
  { path: 'delete-progress', target: 'views/DeleteProgressPage' },
  { path: 'proctoring', target: 'LiveProctoring/components/VideoProctor' }
];

routes.forEach(route => {
  const dirPath = path.join(__dirname, 'src', 'app', route.path);
  fs.mkdirSync(dirPath, { recursive: true });
  
  const depth = route.path.split('/').length;
  const backToSrc = Array(depth + 1).fill('..').join('/');
  
  const importTarget = `${backToSrc}/${route.target}`;
  const protectedRouteImportPath = `${backToSrc}/ProtectedRoute`;
  const desktopImportPath = route.desktop ? `${backToSrc}/context/DesktopOnlyPage` : null;

  let content = `"use client";\n\nimport Component from '${importTarget}';\n`;
  
  if (route.admin || route.user) {
      content += `import ProtectedRoute from '${protectedRouteImportPath}';\n`;
  }
  if (route.desktop) {
      content += `import DesktopOnlyPage from '${desktopImportPath}';\n`;
  }
  
  content += `\nexport default function Page() {\n`;
  
  let jsx = `      <Component />\n`;
  
  if (route.desktop) {
      jsx = `    <DesktopOnlyPage>\n${jsx}    </DesktopOnlyPage>\n`;
  }
  
  if (route.admin) {
      jsx = `    <ProtectedRoute requireAdmin={true}>\n${jsx}    </ProtectedRoute>\n`;
  } else if (route.user) {
      jsx = `    <ProtectedRoute requireUser={true}>\n${jsx}    </ProtectedRoute>\n`;
  }
  
  content += `  return (\n${jsx}  );\n}\n`;
  
  fs.writeFileSync(path.join(dirPath, 'page.jsx'), content);
});
