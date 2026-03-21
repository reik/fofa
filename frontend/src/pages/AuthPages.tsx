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
    <div className={pageClass}>
      <div className={cardClass}>
        {status === 'loading' && (
          <>
            <div className="text-[2.5rem] mb-3">⏳</div>
            <h2 className={titleClass}>Verifying your email…</h2>
          </>
        )}
        {status === 'success' && (
          <>
            <div className="text-[2.5rem] mb-3">✅</div>
            <h2 className={titleClass}>Email verified!</h2>
            <p className={subClass}>Your account is now active. You can sign in.</p>
            <Link to="/login">
              <Button className="mt-5 w-full justify-center">Go to Sign In</Button>
            </Link>
          </>
        )}
        {status === 'error' && (
          <>
            <div className="text-[2.5rem] mb-3">❌</div>
            <h2 className={titleClass}>Verification failed</h2>
            <p className={subClass}>The link may have expired or already been used.</p>
            <Link to="/login">
              <Button variant="secondary" className="mt-5 w-full justify-center">Back to Sign In</Button>
            </Link>
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
    <div className={pageClass}>
      <div className={cardClass}>
        <div className="text-[2rem] mb-3">🔑</div>
        <h2 className={titleClass}>Reset your password</h2>

        {sent ? (
          <>
            <p className={subClass}>If that email exists in our system, we've sent a reset link. Check your inbox.</p>
            <Link to="/login">
              <Button className="mt-5 w-full justify-center">Back to Sign In</Button>
            </Link>
          </>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4 mt-5">
            <Input
              label="Email address"
              type="email"
              placeholder="you@example.com"
              {...register('email', { required: true })}
            />
            <Button type="submit" loading={loading} className="w-full justify-center">
              Send Reset Link
            </Button>
            <Link to="/login" className="text-center text-[0.9rem] text-muted no-underline hover:underline">
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
    <div className={pageClass}>
      <div className={cardClass}>
        <div className="text-[2rem] mb-3">🔒</div>
        <h2 className={titleClass}>Set new password</h2>
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4 mt-5">
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
          <Button type="submit" loading={loading} className="w-full justify-center">
            Reset Password
          </Button>
        </form>
      </div>
    </div>
  );
};

const pageClass = 'min-h-screen flex items-center justify-center bg-gradient-to-br from-brand-light to-[#fff8ee] p-5';
const cardClass = 'bg-surface rounded-xl border-[1.5px] border-border p-10 w-full max-w-[420px] shadow-lg text-center';
const titleClass = 'font-display text-[1.5rem] font-medium text-brand-dark';
const subClass = 'text-muted mt-[10px] leading-[1.7] text-[0.93rem]';
