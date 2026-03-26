"use client";

import Component from '../../views/Admin/EmailPage';
import ProtectedRoute from '../../ProtectedRoute';

export default function Page() {
  return (
    <ProtectedRoute requireAdmin={true}>
      <Component />
    </ProtectedRoute>
  );
}
