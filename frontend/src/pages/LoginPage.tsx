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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-brand-light to-[#fff8ee] p-5">
      <div className="bg-surface rounded-xl border-[1.5px] border-border p-10 w-full max-w-[420px] shadow-lg">
        {/* Brand */}
        <div className="text-center mb-8">
          <div className="text-[3rem] mb-2">🌱</div>
          <h1 className="font-display text-[2rem] text-brand-dark font-medium">
            FoFa
          </h1>
          <p className="text-muted text-[0.93rem] mt-1">
            Foster Families Community
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-[18px]">
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

          <div className="text-right -mt-[10px]">
            <Link to="/forgot-password" className="text-[0.85rem] text-brand no-underline hover:underline">
              Forgot password?
            </Link>
          </div>

          <Button type="submit" loading={loading} className="w-full justify-center">
            Sign In
          </Button>
        </form>

        <p className="text-center mt-6 text-[0.9rem] text-muted">
          Don't have an account?{' '}
          <Link to="/register" className="text-brand font-bold no-underline hover:underline">Sign up</Link>
        </p>
      </div>
    </div>
  );
};
