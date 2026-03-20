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
      <div style={pageStyle}>
        <div style={{ ...cardStyle, textAlign: 'center' }}>
          <div style={{ fontSize: '3.5rem', marginBottom: 16 }}>📬</div>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.5rem', color: 'var(--c-brand-dark)' }}>
            Check your email!
          </h2>
          <p style={{ color: 'var(--c-text-muted)', marginTop: 12, lineHeight: 1.7 }}>
            We've sent a verification link to your email address. Please click the link to activate your account before signing in.
          </p>
          <Button style={{ marginTop: 28, width: '100%', justifyContent: 'center' }} onClick={() => navigate('/login')}>
            Go to Sign In
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div style={pageStyle}>
      <div style={cardStyle}>
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div style={{ fontSize: '2.5rem', marginBottom: 6 }}>🌱</div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '1.7rem', color: 'var(--c-brand-dark)', fontWeight: 500 }}>
            Join FoFa
          </h1>
          <p style={{ color: 'var(--c-text-muted)', fontSize: '0.9rem', marginTop: 4 }}>
            Connect with foster families in your community
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
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

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <Input
              label="City"
              placeholder="Your city"
              error={errors.city?.message}
              {...register('city', { required: 'City is required' })}
            />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
              <label style={{ fontWeight: 600, fontSize: '0.88rem', color: 'var(--c-text-muted)' }}>State</label>
              <select
                {...register('state', { required: 'State is required' })}
                style={{
                  padding: '10px 14px', border: `1.5px solid ${errors.state ? 'var(--c-danger)' : 'var(--c-border)'}`,
                  borderRadius: 'var(--radius-sm)', fontSize: '0.95rem',
                  background: 'var(--c-surface)', fontFamily: 'var(--font-body)',
                }}
              >
                <option value="">State</option>
                {US_STATES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
              {errors.state && <span style={{ fontSize: '0.8rem', color: 'var(--c-danger)' }}>{errors.state.message}</span>}
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

          <Button type="submit" loading={loading} style={{ width: '100%', justifyContent: 'center', marginTop: 4 }}>
            Create Account
          </Button>
        </form>

        <p style={{ textAlign: 'center', marginTop: 22, fontSize: '0.9rem', color: 'var(--c-text-muted)' }}>
          Already have an account?{' '}
          <Link to="/login" style={{ color: 'var(--c-brand)', fontWeight: 700 }}>Sign in</Link>
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
  padding: '36px', width: '100%', maxWidth: 460,
  boxShadow: 'var(--shadow-lg)', border: '1.5px solid var(--c-border)',
};
