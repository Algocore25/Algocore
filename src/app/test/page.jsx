"use client";

import Component from '../../views/Exam/TestsPage';
import ProtectedRoute from '../../ProtectedRoute';
import DesktopOnlyPage from '../../context/DesktopOnlyPage';

export default function Page() {
  return (
    <ProtectedRoute requireUser={true}>
    <DesktopOnlyPage>
      <Component />
    </DesktopOnlyPage>
    </ProtectedRoute>
  );
}
