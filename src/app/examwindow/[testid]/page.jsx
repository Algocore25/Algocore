"use client";

import Component from '../../../views/Exam/DynamicExam';
import ProtectedRoute from '../../../ProtectedRoute';
import DesktopOnlyPage from '../../../context/DesktopOnlyPage';
import SessionGuard from '../../../components/SessionGuard';

export default function Page() {
  return (
    <ProtectedRoute requireUser={true}>
      <SessionGuard>
        <DesktopOnlyPage>
          <Component />
        </DesktopOnlyPage>
      </SessionGuard>
    </ProtectedRoute>
  );
}
