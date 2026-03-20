import React, { useState } from 'react';
import { FamilyMember } from '../../types';
import { Avatar } from '../ui/Avatar';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Modal } from '../ui/Modal';
import { familyService } from '../../services';
import toast from 'react-hot-toast';

interface CardProps {
  member: FamilyMember;
  onUpdate: () => void;
}

export const FamilyMemberCard: React.FC<CardProps> = ({ member, onUpdate }) => {
  const [editing, setEditing] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    if (!window.confirm(`Remove ${member.name} from your family?`)) return;
    setDeleting(true);
    try {
      await familyService.remove(member.id);
      toast.success(`${member.name} removed`);
      onUpdate();
    } catch {
      toast.error('Failed to remove member');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <>
      <div style={{
        background: 'var(--c-surface)', borderRadius: 'var(--radius-lg)',
        border: '1.5px solid var(--c-border)', padding: '20px',
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        gap: 12, boxShadow: 'var(--shadow-sm)', animation: 'fadeIn 0.3s ease',
        textAlign: 'center',
      }}>
        <Avatar src={member.thumbnail} name={member.name} size={72} />
        <div>
          <div style={{ fontWeight: 700, fontSize: '1.05rem' }}>{member.name}</div>
          <div style={{ color: 'var(--c-text-muted)', fontSize: '0.85rem', marginTop: 2 }}>
            Age {member.age}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <Button variant="secondary" size="sm" onClick={() => setEditing(true)}>Edit</Button>
          <Button variant="danger" size="sm" loading={deleting} onClick={handleDelete}>Remove</Button>
        </div>
      </div>

      <Modal open={editing} onClose={() => setEditing(false)} title={`Edit ${member.name}`}>
        <FamilyMemberForm
          existing={member}
          onSaved={() => { setEditing(false); onUpdate(); }}
          onCancel={() => setEditing(false)}
        />
      </Modal>
    </>
  );
};

interface FormProps {
  existing?: FamilyMember;
  onSaved: () => void;
  onCancel: () => void;
}

export const FamilyMemberForm: React.FC<FormProps> = ({ existing, onSaved, onCancel }) => {
  const [name, setName] = useState(existing?.name || '');
  const [age, setAge] = useState(existing?.age?.toString() || '');
  const [thumbFile, setThumbFile] = useState<File | null>(null);
  const [thumbPreview, setThumbPreview] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const apiBase = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:4000';

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setThumbFile(f);
    setThumbPreview(URL.createObjectURL(f));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !age) return;
    setSaving(true);
    try {
      const fd = new FormData();
      fd.append('name', name.trim());
      fd.append('age', age);
      if (thumbFile) fd.append('thumbnail', thumbFile);

      if (existing) {
        await familyService.update(existing.id, fd);
        toast.success('Member updated!');
      } else {
        await familyService.add(fd);
        toast.success('Family member added!');
      }
      onSaved();
    } catch {
      toast.error('Failed to save. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const currentThumb = thumbPreview
    || (existing?.thumbnail ? `${apiBase}${existing.thumbnail}` : null);

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Thumbnail */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
        {currentThumb ? (
          <img src={currentThumb} alt="thumbnail" style={{ width: 80, height: 80, borderRadius: '50%', objectFit: 'cover' }} />
        ) : (
          <div style={{
            width: 80, height: 80, borderRadius: '50%', background: 'var(--c-brand-light)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem',
          }}>👤</div>
        )}
        <label style={{
          cursor: 'pointer', color: 'var(--c-brand)', fontWeight: 600, fontSize: '0.88rem',
        }}>
          {currentThumb ? 'Change photo' : 'Add photo'}
          <input type="file" accept="image/*" onChange={handleFileChange} style={{ display: 'none' }} />
        </label>
      </div>

      <Input
        label="Name"
        value={name}
        onChange={e => setName(e.target.value)}
        placeholder="Family member's name"
        required
      />
      <Input
        label="Age"
        type="number"
        value={age}
        onChange={e => setAge(e.target.value)}
        placeholder="Age"
        min="0"
        max="120"
        required
      />

      <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
        <Button type="button" variant="ghost" onClick={onCancel}>Cancel</Button>
        <Button type="submit" loading={saving} disabled={!name.trim() || !age}>
          {existing ? 'Save Changes' : 'Add Member'}
        </Button>
      </div>
    </form>
  );
};
