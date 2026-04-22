import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import VaultIcon from '../VaultIcon';

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
    if (password !== confirmPassword) { setError('Passwords do not match'); return; }
    if (password.length < 6) { setError('Password must be at least 6 characters'); return; }
    setLoading(true);
    const { error } = await signUp(email, password);
    if (error) setError(error.message);
    else setSuccess(true);
    setLoading(false);
  };

  const handleGoogleSignIn = async () => {
    setError('');
    const { error } = await signInWithGoogle();
    if (error) setError(error.message);
  };

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '12px 14px',
    background: 'var(--color-vault-steel)',
    border: '1px solid var(--color-vault-border)',
    borderRadius: '8px',
    color: 'var(--color-vault-text)',
    fontFamily: 'var(--font-body)',
    fontSize: '16px',
    outline: 'none',
    boxSizing: 'border-box',
  };

  if (success) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--color-vault-black)', padding: '16px' }}>
        <div style={{ maxWidth: '400px', width: '100%', background: 'var(--color-vault-navy)', border: '1px solid var(--color-vault-border)', borderRadius: '16px', padding: '40px', textAlign: 'center' }}>
          <div style={{ width: 56, height: 56, background: 'var(--color-vault-success)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
            <svg width="24" height="24" fill="none" stroke="white" strokeWidth="3" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/></svg>
          </div>
          <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: '20px', color: 'var(--color-vault-text)', marginBottom: '8px' }}>Check your email</h2>
          <p style={{ color: 'var(--color-vault-muted)', fontSize: '14px', marginBottom: '24px' }}>
            We've sent a confirmation link to <strong style={{ color: 'var(--color-vault-text)' }}>{email}</strong>
          </p>
          <button onClick={onToggleMode} style={{ background: 'none', border: 'none', color: 'var(--color-vault-accent)', fontWeight: 600, cursor: 'pointer', fontSize: '14px' }}>
            Back to Sign In
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--color-vault-black)', padding: '16px' }}>
      <div style={{ maxWidth: '400px', width: '100%' }}>
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', marginBottom: '12px', color: 'var(--color-vault-accent)' }}>
            <VaultIcon size={40} />
            <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '28px', color: 'var(--color-vault-text)', letterSpacing: '-0.02em', margin: 0 }}>Valt-Tab</h1>
          </div>
          <p style={{ color: 'var(--color-vault-muted)', fontSize: '15px', margin: 0 }}>Your life. Locked in.</p>
        </div>

        <div style={{ background: 'var(--color-vault-navy)', border: '1px solid var(--color-vault-border)', borderRadius: '16px', padding: '32px' }}>
          <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: '20px', color: 'var(--color-vault-text)', marginTop: 0, marginBottom: '24px' }}>Create Account</h2>

          {error && (
            <div style={{ background: 'rgba(240,84,84,0.1)', border: '1px solid rgba(240,84,84,0.3)', borderRadius: '8px', padding: '12px 14px', color: 'var(--color-vault-danger)', fontSize: '14px', marginBottom: '16px' }}>{error}</div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: 'var(--color-vault-muted)', marginBottom: '6px' }}>Email</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} style={inputStyle} required />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: 'var(--color-vault-muted)', marginBottom: '6px' }}>Password</label>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)} style={inputStyle} required minLength={6} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: 'var(--color-vault-muted)', marginBottom: '6px' }}>Confirm Password</label>
              <input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} style={inputStyle} required />
            </div>
            <button type="submit" disabled={loading} className="btn-primary" style={{ width: '100%', marginTop: '4px', opacity: loading ? 0.6 : 1 }}>
              {loading ? 'Creating account...' : 'Create Account'}
            </button>
          </form>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', margin: '24px 0' }}>
            <div style={{ flex: 1, height: '1px', background: 'var(--color-vault-border)' }} />
            <span style={{ color: 'var(--color-vault-muted)', fontSize: '13px' }}>or</span>
            <div style={{ flex: 1, height: '1px', background: 'var(--color-vault-border)' }} />
          </div>

          <button onClick={handleGoogleSignIn} className="btn-ghost" style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
            <svg width="18" height="18" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Continue with Google
          </button>

          <p style={{ marginTop: '24px', textAlign: 'center', fontSize: '14px', color: 'var(--color-vault-muted)' }}>
            Already have an account?{' '}
            <button onClick={onToggleMode} style={{ background: 'none', border: 'none', color: 'var(--color-vault-accent)', fontWeight: 600, cursor: 'pointer', fontSize: '14px', padding: 0 }}>
              Sign In
            </button>
          </p>

          <p style={{ marginTop: '20px', textAlign: 'center', fontSize: '12px', color: 'var(--color-vault-muted)', fontFamily: 'var(--font-mono)' }}>
            🔒 Valt is yours alone. No sharing, no ads, no tracking.
          </p>
        </div>
      </div>
    </div>
  );
};

export default SignUpPage;
