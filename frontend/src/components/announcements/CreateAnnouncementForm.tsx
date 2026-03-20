import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { useAuthStore } from '../../contexts/authStore';
import { Avatar } from '../ui/Avatar';
import { Button } from '../ui/Button';
import { announcementService } from '../../services';
import toast from 'react-hot-toast';

interface Props {
  onCreated: () => void;
}

export const CreateAnnouncementForm: React.FC<Props> = ({ onCreated }) => {
  const { user } = useAuthStore();
  const [content, setContent] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const onDrop = useCallback((accepted: File[]) => {
    const f = accepted[0];
    if (!f) return;
    setFile(f);
    setPreview(URL.createObjectURL(f));
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/jpeg': ['.jpg', '.jpeg'],
      'image/png': ['.png'],
      'image/gif': ['.gif'],
      'image/webp': ['.webp'],
      'image/heic': ['.heic'],
      'image/heif': ['.heif'],
      'video/mp4': ['.mp4', '.m4v'],
      'video/quicktime': ['.mov'],
      'video/webm': ['.webm'],
      'video/x-msvideo': ['.avi'],
      'video/x-matroska': ['.mkv'],
    },
    maxFiles: 1,
    maxSize: 100 * 1024 * 1024,
  });

  const clearFile = () => {
    setFile(null);
    if (preview) URL.revokeObjectURL(preview);
    setPreview(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;
    setSubmitting(true);
    try {
      const fd = new FormData();
      fd.append('content', content.trim());
      if (file) fd.append('media', file);
      await announcementService.create(fd);
      setContent('');
      clearFile();
      onCreated();
      toast.success('Announcement posted!');
    } catch {
      toast.error('Failed to post. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (!user) return null;

  return (
    <form
      onSubmit={handleSubmit}
      style={{
        background: 'var(--c-surface)', borderRadius: 'var(--radius-lg)',
        border: '1.5px solid var(--c-border)', padding: '20px',
        boxShadow: 'var(--shadow-sm)',
      }}
    >
      <div style={{ display: 'flex', gap: 12, marginBottom: 14 }}>
        <Avatar src={user.thumbnail} name={user.name} size={44} />
        <textarea
          value={content}
          onChange={e => setContent(e.target.value)}
          placeholder={`What's on your mind, ${user.name.split(' ')[0]}?`}
          rows={3}
          style={{
            flex: 1, padding: '12px 16px', borderRadius: 'var(--radius-md)',
            border: '1.5px solid var(--c-border)', resize: 'none',
            fontFamily: 'var(--font-body)', fontSize: '0.97rem',
            background: 'var(--c-bg)', outline: 'none',
          }}
        />
      </div>

      {/* Media preview */}
      {preview && (
        <div style={{ position: 'relative', marginBottom: 14 }}>
          {file?.type.startsWith('video/') ? (
            <video src={preview} controls style={{ width: '100%', borderRadius: 'var(--radius-md)', maxHeight: 300 }} />
          ) : (
            <img src={preview} alt="Preview" style={{ width: '100%', borderRadius: 'var(--radius-md)', maxHeight: 300, objectFit: 'cover' }} />
          )}
          <button
            type="button"
            onClick={clearFile}
            style={{
              position: 'absolute', top: 8, right: 8,
              background: 'rgba(0,0,0,0.55)', color: '#fff', border: 'none',
              borderRadius: '50%', width: 30, height: 30, cursor: 'pointer',
              fontSize: '1rem', lineHeight: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >
            ×
          </button>
        </div>
      )}

      {/* Dropzone */}
      {!preview && (
        <div
          {...getRootProps()}
          style={{
            border: `2px dashed ${isDragActive ? 'var(--c-brand)' : 'var(--c-border)'}`,
            borderRadius: 'var(--radius-md)', padding: '18px',
            textAlign: 'center', cursor: 'pointer', marginBottom: 14,
            background: isDragActive ? 'var(--c-brand-light)' : 'transparent',
            transition: 'all 0.2s',
          }}
        >
          <input {...getInputProps()} />
          <span style={{ fontSize: '1.5rem' }}>📷</span>
          <p style={{ color: 'var(--c-text-muted)', fontSize: '0.85rem', marginTop: 4 }}>
            {isDragActive ? 'Drop it here!' : 'Add a photo or video (optional)'}
          </p>
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <Button type="submit" loading={submitting} disabled={!content.trim()}>
          📢 Post Announcement
        </Button>
      </div>
    </form>
  );
};
