import React, { useState } from 'react';
import { LoginPage } from './LoginPage';
import { SignUpPage } from './SignUpPage';

export const AuthPage: React.FC = () => {
  const [isSignUp, setIsSignUp] = useState(false);

  const toggleMode = () => setIsSignUp(!isSignUp);

  if (isSignUp) {
    return <SignUpPage onToggleMode={toggleMode} />;
  }

  return <LoginPage onToggleMode={toggleMode} />;
};

export default AuthPage;
