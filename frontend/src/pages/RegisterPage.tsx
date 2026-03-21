import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { authService } from '../services';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import toast from 'react-hot-toast';

const US_STATES = [
  'AL','AK','AZ','AR','CA','CO','CT','DE','FL','GA','HI','ID','IL','IN','IA',
  'KS','KY','LA','ME','MD','MA','MI','MN','MS','MO','MT','NE','NV','NH','NJ',
  'NM','NY','NC','ND','OH','OK','OR','PA','RI','SC','SD','TN','TX','UT','VT',
  'VA','WA','WV','WI','WY','DC',
];

interface FormData {
  name: string; email: string; password: string; confirmPassword: string;
  city: string; state: string;
}

export const RegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const { register, handleSubmit, watch, formState: { errors } } = useForm<FormData>();
  const password = watch('password');

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    try {
      await authService.register({
        email: data.email, password: data.password,
        name: data.name, city: data.city, state: data.state,
      });
      setDone(true);
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  if (done) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-brand-light to-[#fff8ee] p-5">
        <div className="bg-surface rounded-xl border-[1.5px] border-border p-10 w-full max-w-[420px] shadow-lg text-center">
          <div className="text-[3.5rem] mb-4">📬</div>
          <h2 className="font-display text-[1.5rem] text-brand-dark">
            Check your email!
          </h2>
          <p className="text-muted mt-3 leading-[1.7]">
            We've sent a verification link to your email address. Please click the link to activate your account before signing in.
          </p>
          <Button className="mt-7 w-full justify-center" onClick={() => navigate('/login')}>
            Go to Sign In
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-brand-light to-[#fff8ee] p-5">
      <div className="bg-surface rounded-xl border-[1.5px] border-border p-9 w-full max-w-[460px] shadow-lg">
        <div className="text-center mb-7">
          <div className="text-[2.5rem] mb-[6px]">🌱</div>
          <h1 className="font-display text-[1.7rem] text-brand-dark font-medium">
            Join FoFa
          </h1>
          <p className="text-muted text-[0.9rem] mt-1">
            Connect with foster families in your community
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
          <Input
            label="Full name"
            placeholder="Jane Smith"
            error={errors.name?.message}
            {...register('name', { required: 'Name is required', minLength: { value: 2, message: 'Too short' } })}
          />
          <Input
            label="Email address"
            type="email"
            placeholder="you@example.com"
            error={errors.email?.message}
            {...register('email', { required: 'Email is required' })}
          />

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="City"
              placeholder="Your city"
              error={errors.city?.message}
              {...register('city', { required: 'City is required' })}
            />
            <div className="flex flex-col gap-[5px]">
              <label className="font-semibold text-[0.88rem] text-muted">State</label>
              <select
                {...register('state', { required: 'State is required' })}
                className={[
                  'px-[14px] py-[10px] rounded-sm text-[0.95rem] bg-surface font-body outline-none',
                  errors.state ? 'border-[1.5px] border-red-600' : 'border-[1.5px] border-border',
                ].join(' ')}
              >
                <option value="">State</option>
                {US_STATES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
              {errors.state && <span className="text-[0.8rem] text-red-600">{errors.state.message}</span>}
            </div>
          </div>

          <Input
            label="Password"
            type="password"
            placeholder="At least 8 characters"
            error={errors.password?.message}
            {...register('password', { required: 'Password is required', minLength: { value: 8, message: 'Minimum 8 characters' } })}
          />
          <Input
            label="Confirm password"
            type="password"
            placeholder="Repeat password"
            error={errors.confirmPassword?.message}
            {...register('confirmPassword', {
              required: 'Please confirm your password',
              validate: v => v === password || 'Passwords do not match',
            })}
          />

          <Button type="submit" loading={loading} className="w-full justify-center mt-1">
            Create Account
          </Button>
        </form>

        <p className="text-center mt-[22px] text-[0.9rem] text-muted">
          Already have an account?{' '}
          <Link to="/login" className="text-brand font-bold no-underline hover:underline">Sign in</Link>
        </p>
      </div>
    </div>
  );
};
