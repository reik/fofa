import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { authService } from '../services';
import { useAuthStore } from '../contexts/authStore';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import toast from 'react-hot-toast';

interface FormData { email: string; password: string; }

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { setAuth } = useAuthStore();
  const [loading, setLoading] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>();

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    try {
      const res = await authService.login(data.email, data.password);
      setAuth(res.user, res.token);
      navigate('/dashboard');
    } catch (err: any) {
      const msg = err.response?.data?.error || 'Login failed';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={pageStyle}>
      <div style={cardStyle}>
        {/* Brand */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ fontSize: '3rem', marginBottom: 8 }}>🌱</div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', color: 'var(--c-brand-dark)', fontWeight: 500 }}>
            FoFa
          </h1>
          <p style={{ color: 'var(--c-text-muted)', fontSize: '0.93rem', marginTop: 4 }}>
            Foster Families Community
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          <Input
            label="Email address"
            type="email"
            placeholder="you@example.com"
            error={errors.email?.message}
            {...register('email', { required: 'Email is required' })}
          />
          <Input
            label="Password"
            type="password"
            placeholder="Your password"
            error={errors.password?.message}
            {...register('password', { required: 'Password is required' })}
          />

          <div style={{ textAlign: 'right', marginTop: -10 }}>
            <Link to="/forgot-password" style={{ fontSize: '0.85rem', color: 'var(--c-brand)' }}>
              Forgot password?
            </Link>
          </div>

          <Button type="submit" loading={loading} style={{ width: '100%', justifyContent: 'center' }}>
            Sign In
          </Button>
        </form>

        <p style={{ textAlign: 'center', marginTop: 24, fontSize: '0.9rem', color: 'var(--c-text-muted)' }}>
          Don't have an account?{' '}
          <Link to="/register" style={{ color: 'var(--c-brand)', fontWeight: 700 }}>Sign up</Link>
        </p>
      </div>
    </div>
  );
};

const pageStyle: React.CSSProperties = {
  minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
  background: 'linear-gradient(135deg, var(--c-brand-light) 0%, #fff8ee 100%)',
  padding: 20,
};

const cardStyle: React.CSSProperties = {
  background: 'var(--c-surface)', borderRadius: 'var(--radius-xl)',
  padding: '40px 36px', width: '100%', maxWidth: 420,
  boxShadow: 'var(--shadow-lg)', border: '1.5px solid var(--c-border)',
};
