"use client";

import Component from '../../views/Admin/ReportsPage';
import ProtectedRoute from '../../ProtectedRoute';

export default function Page() {
  return (
    <ProtectedRoute requireAdmin={true}>
      <Component />
    </ProtectedRoute>
  );
}
