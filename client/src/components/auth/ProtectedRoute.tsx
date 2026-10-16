import React, { useState } from 'react';
import { isAuthenticated } from '../../services/auth.service';
import { LoginPage } from './LoginPage';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const [authenticated, setAuthenticated] = useState(isAuthenticated);

  if (!authenticated) {
    return (
      <LoginPage
        onLoginSuccess={() => setAuthenticated(true)}
      />
    );
  }

  return <>{children}</>;
};

