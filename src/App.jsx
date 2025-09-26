import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
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
import ProtectedRoute from './ProtectedRoute';
import CompilerPage from './pages/CompilerPage';
import LoadingPage from './pages/LoadingPage';
import AdminMonitor from './pages/Admin/AdminMonitor';
import CpuApp from './pages/Visual/Cpu/CpuApp';
const HomePage = lazy(() => import('./pages/HomePage'));
const NotFoundPage = lazy(() => import('./pages/NotFoundPage'));
const ProfilePage = lazy(() => import('./pages/ProfilePage'));
const CoursesPage = lazy(() => import('./pages/CoursesPage'));
const CoursePage = lazy(() => import('./pages/CoursePage'));
const AboutPage = lazy(() => import('./pages/AboutPage'));
const ContactPage = lazy(() => import('./pages/ContactPage'));
const LoginPage = lazy(() => import('./pages/LoginPage'));

import { VideoProctor } from './LiveProctoring/components/VideoProctor';

function App() {
  return (
    <BrowserRouter basename='/'>
      <ActivityTracker> {/* Wrap everything with ActivityTracker */}
        <Toaster position="top-center" reverseOrder={false} />
        <PageLayout>
          <Suspense fallback={<LoadingPage message="Loading page, please wait..." />}>
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/admin" element={<ProtectedRoute requireAdmin={true}><TestsList /></ProtectedRoute>} />
              <Route path="/adminmonitor" element={<ProtectedRoute requireAdmin={true}><AdminMonitor /></ProtectedRoute>} />
              <Route path="/testedit/:testId" element={<ProtectedRoute requireAdmin={true}><TestManage /></ProtectedRoute>} />

              <Route path="/problem/:course/:subcourse/:questionId" element={<ProtectedRoute > <DynamicComponent /></ProtectedRoute>} />
              <Route path="/profile" element={<ProfilePage />} />
              <Route path="/compiler" element={<CompilerPage />} />
              <Route path="/courses" element={<CoursesPage />} />
              <Route path="/course/:course" element={<CoursePage />} />
              <Route path="/about" element={<AboutPage />} />
              <Route path="/contact" element={<ContactPage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="*" element={<NotFoundPage />} />

              <Route path="/proctoring" element={<VideoProctor />} />

              <Route path="/test" element={<ProtectedRoute requireUser={true}><TestsPage /></ProtectedRoute>} />
              <Route path="/examwindow/:testid" element={<ProtectedRoute requireUser={true}><DynamicExam /></ProtectedRoute>} />
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
