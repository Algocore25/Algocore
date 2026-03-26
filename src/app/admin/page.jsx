"use client";

import Component from '../../views/Admin/TestsList';
import ProtectedRoute from '../../ProtectedRoute';

export default function Page() {
  return (
    <ProtectedRoute requireAdmin={true}>
      <Component />
    </ProtectedRoute>
  );
}
