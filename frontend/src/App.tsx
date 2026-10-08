import React from 'react';
import { AuthProvider } from './app/providers/AuthProvider';
import { AppRouter } from './app/router/AppRouter';

export default function App() {
  return (
    <AuthProvider>
      <AppRouter />
    </AuthProvider>
  );
}

