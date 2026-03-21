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
    <div className="max-w-[600px] mx-auto px-5 py-10">
      <h1 className="font-display text-[1.8rem] font-medium text-brand-dark mb-8">
        Edit Profile
      </h1>

      <div className="bg-surface rounded-xl border-[1.5px] border-border p-9 shadow-sm">
        {/* Avatar */}
        <div className="flex flex-col items-center gap-3 mb-7">
          <Avatar src={currentThumb} name={user?.name || 'User'} size={96} />
          <label className="cursor-pointer text-brand font-semibold text-[0.9rem]">
            Change profile photo
            <input type="file" accept="image/*" onChange={handleFileChange} className="hidden" data-testid="thumbnail-input" />
          </label>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-[18px]">
          <Input
            label="Full name"
            error={errors.name?.message}
            {...register('name', { required: 'Name is required' })}
          />

          <div className="grid grid-cols-2 gap-[14px]">
            <Input
              label="City"
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
            </div>
          </div>

          <div className="flex justify-between items-center mt-2">
            <div className="text-[0.85rem] text-muted">
              ✉️ {user?.email}
            </div>
            <Button type="submit" loading={saving}>Save Changes</Button>
          </div>
        </form>
      </div>
    </div>
  );
};
