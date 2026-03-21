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
      className="bg-surface rounded-lg border-[1.5px] border-border p-5 shadow-sm"
    >
      <div className="flex gap-3 mb-[14px]">
        <Avatar src={user.thumbnail} name={user.name} size={44} />
        <textarea
          value={content}
          onChange={e => setContent(e.target.value)}
          placeholder={`What's on your mind, ${user.name.split(' ')[0]}?`}
          rows={3}
          className="flex-1 px-4 py-3 rounded-md border-[1.5px] border-border resize-none font-body text-[0.97rem] bg-bg outline-none"
        />
      </div>

      {/* Media preview */}
      {preview && (
        <div className="relative mb-[14px]">
          {file?.type.startsWith('video/') ? (
            <video src={preview} controls className="w-full rounded-md max-h-[300px]" />
          ) : (
            <img src={preview} alt="Preview" className="w-full rounded-md max-h-[300px] object-cover" />
          )}
          <button
            type="button"
            onClick={clearFile}
            className="absolute top-2 right-2 bg-black/55 text-white border-none rounded-full w-[30px] h-[30px] cursor-pointer text-base leading-none flex items-center justify-center"
          >
            ×
          </button>
        </div>
      )}

      {/* Dropzone */}
      {!preview && (
        <div
          {...getRootProps()}
          className={[
            'border-2 border-dashed rounded-md p-[18px] text-center cursor-pointer mb-[14px] transition-all duration-200',
            isDragActive ? 'border-brand bg-brand-light' : 'border-border bg-transparent',
          ].join(' ')}
        >
          <input {...getInputProps()} />
          <span className="text-[1.5rem]">📷</span>
          <p className="text-muted text-[0.85rem] mt-1">
            {isDragActive ? 'Drop it here!' : 'Add a photo or video (optional)'}
          </p>
        </div>
      )}

      <div className="flex justify-end">
        <Button type="submit" loading={submitting} disabled={!content.trim()}>
          📢 Post Announcement
        </Button>
      </div>
    </form>
  );
};
