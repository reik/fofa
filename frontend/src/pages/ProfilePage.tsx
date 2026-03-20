import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useAuthStore } from '../contexts/authStore';
import { userService } from '../services';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Avatar } from '../components/ui/Avatar';
import toast from 'react-hot-toast';

const US_STATES = [
  'AL','AK','AZ','AR','CA','CO','CT','DE','FL','GA','HI','ID','IL','IN','IA',
  'KS','KY','LA','ME','MD','MA','MI','MN','MS','MO','MT','NE','NV','NH','NJ',
  'NM','NY','NC','ND','OH','OK','OR','PA','RI','SC','SD','TN','TX','UT','VT',
  'VA','WA','WV','WI','WY','DC',
];

interface FormData { name: string; city: string; state: string; }

export const ProfilePage: React.FC = () => {
  const { user, updateUser } = useAuthStore();
  const [thumbFile, setThumbFile] = useState<File | null>(null);
  const [thumbPreview, setThumbPreview] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    defaultValues: { name: user?.name || '', city: user?.city || '', state: user?.state || '' },
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setThumbFile(f);
    setThumbPreview(URL.createObjectURL(f));
  };

  const onSubmit = async (data: FormData) => {
    setSaving(true);
    try {
      const fd = new FormData();
      fd.append('name', data.name);
      fd.append('city', data.city);
      fd.append('state', data.state);
      if (thumbFile) fd.append('thumbnail', thumbFile);
      const updated = await userService.updateProfile(fd);
      updateUser(updated);
      toast.success('Profile updated!');
    } catch {
      toast.error('Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const currentThumb = thumbPreview || user?.thumbnail || null;

  return (
    <div style={{ maxWidth: 600, margin: '0 auto', padding: '40px 20px' }}>
      <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '1.8rem', fontWeight: 500, color: 'var(--c-brand-dark)', marginBottom: 32 }}>
        Edit Profile
      </h1>

      <div style={{
        background: 'var(--c-surface)', borderRadius: 'var(--radius-xl)',
        border: '1.5px solid var(--c-border)', padding: '36px',
        boxShadow: 'var(--shadow-sm)',
      }}>
        {/* Avatar */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, marginBottom: 28 }}>
          <Avatar src={currentThumb} name={user?.name || 'User'} size={96} />
          <label style={{ cursor: 'pointer', color: 'var(--c-brand)', fontWeight: 600, fontSize: '0.9rem' }}>
            Change profile photo
            <input type="file" accept="image/*" onChange={handleFileChange} style={{ display: 'none' }} data-testid="thumbnail-input" />
          </label>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          <Input
            label="Full name"
            error={errors.name?.message}
            {...register('name', { required: 'Name is required' })}
          />

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <Input
              label="City"
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
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 }}>
            <div style={{ fontSize: '0.85rem', color: 'var(--c-text-muted)' }}>
              ✉️ {user?.email}
            </div>
            <Button type="submit" loading={saving}>Save Changes</Button>
          </div>
        </form>
      </div>
    </div>
  );
};
