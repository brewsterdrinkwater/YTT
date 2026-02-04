import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';

/**
 * Walt-tab Sign Up Page
 * Brutalist style: Clean white card, black accents, minimal decoration
 */

interface SignUpPageProps {
  onToggleMode: () => void;
}

export const SignUpPage: React.FC<SignUpPageProps> = ({ onToggleMode }) => {
  const { signUp, signInWithGoogle } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setLoading(true);
    const { error } = await signUp(email, password);

    if (error) {
      setError(error.message);
    } else {
      setSuccess(true);
    }
    setLoading(false);
  };

  const handleGoogleSignIn = async () => {
    setError('');
    const { error } = await signInWithGoogle();
    if (error) {
      setError(error.message);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white px-4">
        <div className="max-w-md w-full bg-white border-2 border-black rounded-sm p-8 text-center">
          <div className="w-16 h-16 bg-success rounded-sm flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={3}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-h3 font-semibold text-black mb-2">Check your email</h2>
          <p className="text-slate mb-4">
            We've sent a confirmation link to <strong className="text-black">{email}</strong>
          </p>
          <p className="text-small text-slate">
            Click the link in your email to activate your account.
          </p>
          <button
            onClick={onToggleMode}
            className="mt-6 text-black hover:text-tab-red font-semibold transition-colors"
          >
            Back to Sign In
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-white px-4">
      <div className="max-w-md w-full">
        {/* Logo Section */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="w-12 h-12 bg-black rounded-sm flex items-center justify-center">
              <span className="text-white text-2xl font-bold">W</span>
            </div>
            <h1 className="text-h1 font-bold text-black tracking-tight">Walt-Tab</h1>
          </div>
          <p className="text-slate">Own Your Story. Navigate Your Life.</p>
        </div>

        {/* Sign Up Card */}
        <div className="bg-white border-2 border-black rounded-sm p-8">
          <h2 className="text-h3 font-semibold text-black mb-6">Create Account</h2>

          {error && (
            <div className="bg-danger/10 text-danger border border-danger/20 p-3 rounded-sm mb-4 text-small">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-small font-semibold text-black mb-2">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 border-2 border-steel rounded-sm focus:outline-none focus:border-black transition-colors"
                required
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-small font-semibold text-black mb-2">
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 border-2 border-steel rounded-sm focus:outline-none focus:border-black transition-colors"
                required
                minLength={6}
              />
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-small font-semibold text-black mb-2">
                Confirm Password
              </label>
              <input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-4 py-3 border-2 border-steel rounded-sm focus:outline-none focus:border-black transition-colors"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 bg-black text-white font-semibold rounded-sm hover:bg-charcoal disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? 'Creating account...' : 'Create Account'}
            </button>
          </form>

          <div className="my-6 flex items-center">
            <div className="flex-1 border-t-2 border-steel"></div>
            <span className="px-4 text-small text-slate">or</span>
            <div className="flex-1 border-t-2 border-steel"></div>
          </div>

          <button
            onClick={handleGoogleSignIn}
            className="w-full py-3 px-4 border-2 border-black rounded-sm flex items-center justify-center gap-3 hover:bg-concrete font-medium transition-colors"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            Continue with Google
          </button>

          <p className="mt-6 text-center text-small text-slate">
            Already have an account?{' '}
            <button
              onClick={onToggleMode}
              className="text-black hover:text-tab-red font-semibold transition-colors"
            >
              Sign In
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default SignUpPage;
