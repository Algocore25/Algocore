"use client";

import Component from '../../../views/Exam/StudentResults';
import ProtectedRoute from '../../../ProtectedRoute';

export default function Page() {
  return (
    <ProtectedRoute requireUser={true}>
      <Component />
    </ProtectedRoute>
  );
}
