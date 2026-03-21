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
      <div className="bg-surface rounded-lg border-[1.5px] border-border p-5 flex flex-col items-center gap-3 shadow-sm fade-in text-center">
        <Avatar src={member.thumbnail} name={member.name} size={72} />
        <div>
          <div className="font-bold text-[1.05rem]">{member.name}</div>
          <div className="text-muted text-[0.85rem] mt-[2px]">Age {member.age}</div>
        </div>
        <div className="flex gap-2">
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
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      {/* Thumbnail */}
      <div className="flex flex-col items-center gap-[10px]">
        {currentThumb ? (
          <img src={currentThumb} alt="thumbnail" className="w-20 h-20 rounded-full object-cover" />
        ) : (
          <div className="w-20 h-20 rounded-full bg-brand-light flex items-center justify-center text-[2rem]">👤</div>
        )}
        <label className="cursor-pointer text-brand font-semibold text-[0.88rem]">
          {currentThumb ? 'Change photo' : 'Add photo'}
          <input type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
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

      <div className="flex gap-[10px] justify-end">
        <Button type="button" variant="ghost" onClick={onCancel}>Cancel</Button>
        <Button type="submit" loading={saving} disabled={!name.trim() || !age}>
          {existing ? 'Save Changes' : 'Add Member'}
        </Button>
      </div>
    </form>
  );
};
