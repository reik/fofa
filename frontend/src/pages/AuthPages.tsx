import React, { useEffect, useState } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import { authService } from '../services';
import { useForm } from 'react-hook-form';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import toast from 'react-hot-toast';

// ── Verify Email ──────────────────────────────────────────────────
export const VerifyEmailPage: React.FC = () => {
  const [params] = useSearchParams();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');

  useEffect(() => {
    const token = params.get('token');
    if (!token) { setStatus('error'); return; }
    authService.verifyEmail(token)
      .then(() => setStatus('success'))
      .catch(() => setStatus('error'));
  }, [params]);

  return (
    <div style={pageStyle}>
      <div style={cardStyle}>
        {status === 'loading' && (
          <>
            <div style={{ fontSize: '2.5rem', marginBottom: 12 }}>⏳</div>
            <h2 style={titleStyle}>Verifying your email…</h2>
          </>
        )}
        {status === 'success' && (
          <>
            <div style={{ fontSize: '2.5rem', marginBottom: 12 }}>✅</div>
            <h2 style={titleStyle}>Email verified!</h2>
            <p style={subStyle}>Your account is now active. You can sign in.</p>
            <Link to="/login"><Button style={{ marginTop: 20, width: '100%', justifyContent: 'center' }}>Go to Sign In</Button></Link>
          </>
        )}
        {status === 'error' && (
          <>
            <div style={{ fontSize: '2.5rem', marginBottom: 12 }}>❌</div>
            <h2 style={titleStyle}>Verification failed</h2>
            <p style={subStyle}>The link may have expired or already been used.</p>
            <Link to="/login"><Button variant="secondary" style={{ marginTop: 20, width: '100%', justifyContent: 'center' }}>Back to Sign In</Button></Link>
          </>
        )}
      </div>
    </div>
  );
};

// ── Forgot Password ───────────────────────────────────────────────
export const ForgotPasswordPage: React.FC = () => {
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const { register, handleSubmit } = useForm<{ email: string }>();

  const onSubmit = async ({ email }: { email: string }) => {
    setLoading(true);
    try {
      await authService.forgotPassword(email);
      setSent(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={pageStyle}>
      <div style={cardStyle}>
        <div style={{ fontSize: '2rem', marginBottom: 12 }}>🔑</div>
        <h2 style={titleStyle}>Reset your password</h2>

        {sent ? (
          <>
            <p style={subStyle}>If that email exists in our system, we've sent a reset link. Check your inbox.</p>
            <Link to="/login"><Button style={{ marginTop: 20, width: '100%', justifyContent: 'center' }}>Back to Sign In</Button></Link>
          </>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} style={{ display: 'flex', flexDirection: 'column', gap: 16, marginTop: 20 }}>
            <Input
              label="Email address"
              type="email"
              placeholder="you@example.com"
              {...register('email', { required: true })}
            />
            <Button type="submit" loading={loading} style={{ width: '100%', justifyContent: 'center' }}>
              Send Reset Link
            </Button>
            <Link to="/login" style={{ textAlign: 'center', fontSize: '0.9rem', color: 'var(--c-text-muted)' }}>
              Back to Sign In
            </Link>
          </form>
        )}
      </div>
    </div>
  );
};

// ── Reset Password ────────────────────────────────────────────────
export const ResetPasswordPage: React.FC = () => {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const { register, handleSubmit, watch, formState: { errors } } = useForm<{ password: string; confirmPassword: string }>();
  const password = watch('password');

  const onSubmit = async ({ password: pw }: { password: string; confirmPassword: string }) => {
    const token = params.get('token');
    if (!token) { toast.error('Invalid link'); return; }
    setLoading(true);
    try {
      await authService.resetPassword(token, pw);
      toast.success('Password reset! Please sign in.');
      navigate('/login');
    } catch {
      toast.error('Reset failed. The link may have expired.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={pageStyle}>
      <div style={cardStyle}>
        <div style={{ fontSize: '2rem', marginBottom: 12 }}>🔒</div>
        <h2 style={titleStyle}>Set new password</h2>
        <form onSubmit={handleSubmit(onSubmit)} style={{ display: 'flex', flexDirection: 'column', gap: 16, marginTop: 20 }}>
          <Input
            label="New password"
            type="password"
            placeholder="At least 8 characters"
            error={errors.password?.message}
            {...register('password', { required: true, minLength: { value: 8, message: 'Min 8 characters' } })}
          />
          <Input
            label="Confirm new password"
            type="password"
            placeholder="Repeat password"
            error={errors.confirmPassword?.message}
            {...register('confirmPassword', {
              required: true,
              validate: v => v === password || 'Passwords do not match',
            })}
          />
          <Button type="submit" loading={loading} style={{ width: '100%', justifyContent: 'center' }}>
            Reset Password
          </Button>
        </form>
      </div>
    </div>
  );
};

const pageStyle: React.CSSProperties = {
  minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
  background: 'linear-gradient(135deg, var(--c-brand-light) 0%, #fff8ee 100%)', padding: 20,
};
const cardStyle: React.CSSProperties = {
  background: 'var(--c-surface)', borderRadius: 'var(--radius-xl)', padding: '40px 36px',
  width: '100%', maxWidth: 420, boxShadow: 'var(--shadow-lg)', border: '1.5px solid var(--c-border)',
  textAlign: 'center',
};
const titleStyle: React.CSSProperties = { fontFamily: 'var(--font-display)', fontSize: '1.5rem', fontWeight: 500, color: 'var(--c-brand-dark)' };
const subStyle: React.CSSProperties = { color: 'var(--c-text-muted)', marginTop: 10, lineHeight: 1.7, fontSize: '0.93rem' };
