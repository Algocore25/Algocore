"use client";

import Component from '../../../../../views/DynamicComponent';
import ProtectedRoute from '../../../../../ProtectedRoute';

export default function Page() {
  return (
    <ProtectedRoute requireUser={true}>
      <Component />
    </ProtectedRoute>
  );
}
