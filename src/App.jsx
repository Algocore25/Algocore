import React, { Suspense, lazy, useEffect } from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';

import PageLayout from './components/PageLayout';
import ActivityTracker from './components/ActivityTracker'; // Add this import
import DynamicComponent from './pages/DynamicComponent';
import StudentResult from './pages/Exam/StudentResults';
import AdminResult from './pages/Admin/AdminResults';
import DynamicExam from './pages/Exam/DynamicExam';
import TestsPage from './pages/Exam/TestsPage';
import TestsList from './pages/Admin/TestsList';
import TestManage from './pages/Admin/TestManage';
import ExamMonitor from './pages/Admin/ExamMonitor';
import CourseEdit from './pages/Admin/CourseEdit';
import ProtectedRoute from './ProtectedRoute';
import CompilerPage from './pages/CompilerPage';
import LoadingPage from './pages/LoadingPage';
import AdminMonitor from './pages/Admin/AdminMonitor';
import WhatsNewModal from './components/WhatsNewModal';
const HomePage = lazy(() => import('./pages/HomePage'));
const NotFoundPage = lazy(() => import('./pages/NotFoundPage'));
const ProfilePage = lazy(() => import('./pages/ProfilePage'));
const CoursesPage = lazy(() => import('./pages/CoursesPage'));
const CoursePage = lazy(() => import('./pages/CoursePage'));
const AboutPage = lazy(() => import('./pages/AboutPage'));
const ContactPage = lazy(() => import('./pages/ContactPage'));
const LoginPage = lazy(() => import('./pages/LoginPage'));
const PublicProfilePage = lazy(() => import('./pages/PublicProfilePage'));
const SearchUsersPage = lazy(() => import('./pages/SearchUsersPage'));
const LearnPage = lazy(() => import('./pages/LearnPage'));
const CourseDetailsPage = lazy(() => import('./pages/CourseDetailsPage'));


import { VideoProctor } from './LiveProctoring/components/VideoProctor';


import DesktopOnlyPage from './context/DesktopOnlyPage';


// Route-aware guard to disable copy/paste except on admin-required routes
const CopyPasteGuard = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    // determine whether current route is one that should allow admin-only features
    const requiresAdmin = /^\/(admin(|monitor|results)|testedit|exammonitor|adminresults)(\/|$)/i.test(pathname);
    if (requiresAdmin || isLocalhost) {
      return;
    }

    const prevent = (event) => event.preventDefault();
    document.addEventListener('contextmenu', prevent);
    document.addEventListener('copy', prevent);
    document.addEventListener('cut', prevent);
    document.addEventListener('paste', prevent);
    document.addEventListener('selectstart', prevent);
    document.addEventListener('dragstart', prevent);

    return () => {
      document.removeEventListener('contextmenu', prevent);
      document.removeEventListener('copy', prevent);
      document.removeEventListener('cut', prevent);
      document.removeEventListener('paste', prevent);
      document.removeEventListener('selectstart', prevent);
      document.removeEventListener('dragstart', prevent);
    };
  }, [pathname]);

  return null;
};

function App() {
  return (
    <BrowserRouter basename='/'>
      <ActivityTracker> {/* Wrap everything with ActivityTracker */}
        <WhatsNewModal />
        <Toaster position="top-center" reverseOrder={false} />
        <PageLayout>
          <CopyPasteGuard />
          <Suspense fallback={<LoadingPage message="Loading page, please wait..." />}>
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/admin" element={<ProtectedRoute requireAdmin={true}><TestsList /></ProtectedRoute>} />
              <Route path="/adminmonitor" element={<ProtectedRoute requireAdmin={true}><AdminMonitor /></ProtectedRoute>} />
              <Route path="/testedit/:testId" element={<ProtectedRoute requireAdmin={true}><TestManage /></ProtectedRoute>} />
              <Route path="/courseedit/:courseId" element={<ProtectedRoute requireAdmin={true}><CourseEdit /></ProtectedRoute>} />

              <Route path="/problem/:course/:subcourse/:questionId" element={<ProtectedRoute > <DynamicComponent /></ProtectedRoute>} />
              <Route path="/profile" element={<ProfilePage />} />
              <Route path="/compiler" element={<CompilerPage />} />
              <Route path="/courses" element={<CoursesPage />} />
              <Route path="/course/:course" element={<CoursePage />} />
              <Route path="/learn" element={<LearnPage />} />
              <Route path="/learn/:courseId" element={<CourseDetailsPage />} />
              <Route path="/about" element={<AboutPage />} />
              <Route path="/contact" element={<ContactPage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/u/:username" element={<PublicProfilePage />} />
              <Route path="/search" element={<SearchUsersPage />} />
              <Route path="*" element={<NotFoundPage />} />

              <Route path="/proctoring" element={<VideoProctor />} />

              <Route path="/test" element={<DesktopOnlyPage>  <ProtectedRoute requireUser={true}><TestsPage /></ProtectedRoute>     </DesktopOnlyPage>} />
              <Route path="/examwindow/:testid" element={<DesktopOnlyPage> <ProtectedRoute requireUser={true}><DynamicExam /></ProtectedRoute> </DesktopOnlyPage>} />
              <Route path="/exammonitor/:testid" element={<ProtectedRoute requireAdmin={true}><ExamMonitor /></ProtectedRoute>} />
              <Route path="/adminresults/:testid" element={<ProtectedRoute requireAdmin={true}><AdminResult /></ProtectedRoute>} />
              <Route path="/studentresults/:testid" element={<ProtectedRoute requireUser={true}><StudentResult /></ProtectedRoute>} />



            </Routes>
          </Suspense>
        </PageLayout>
      </ActivityTracker>
    </BrowserRouter>
  );
}

export default App;
