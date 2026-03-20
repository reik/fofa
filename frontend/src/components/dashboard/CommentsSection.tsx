import React, { useState, useEffect } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { Comment } from '../../types';
import { Avatar } from '../ui/Avatar';
import { Button } from '../ui/Button';
import { announcementService } from '../../services';
import { useAuthStore } from '../../contexts/authStore';

interface Props {
  announcementId: string;
  onCommentAdded: () => void;
}

export const CommentsSection: React.FC<Props> = ({ announcementId, onCommentAdded }) => {
  const { user } = useAuthStore();
  const [comments, setComments] = useState<Comment[]>([]);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    setLoading(true);
    announcementService.getComments(announcementId)
      .then(setComments)
      .finally(() => setLoading(false));
  }, [announcementId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;
    setSubmitting(true);
    try {
      const comment = await announcementService.addComment(announcementId, text.trim());
      setComments(prev => [...prev, comment]);
      setText('');
      onCommentAdded();
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (commentId: string) => {
    await announcementService.deleteComment(announcementId, commentId);
    setComments(prev => prev.filter(c => c.id !== commentId));
    onCommentAdded();
  };

  return (
    <div style={{ borderTop: '1.5px solid var(--c-border)', padding: '16px 20px', background: '#fafaf8' }}>
      {loading ? (
        <p style={{ color: 'var(--c-text-muted)', fontSize: '0.9rem' }}>Loading comments…</p>
      ) : comments.length === 0 ? (
        <p style={{ color: 'var(--c-text-muted)', fontSize: '0.88rem' }}>No comments yet. Be the first!</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 16 }}>
          {comments.map(c => (
            <div key={c.id} style={{ display: 'flex', gap: 10 }}>
              <Avatar src={c.author_thumbnail} name={c.author_name} size={34} />
              <div style={{ flex: 1 }}>
                <div style={{
                  background: 'var(--c-surface)', borderRadius: 'var(--radius-md)',
                  padding: '10px 14px', border: '1px solid var(--c-border)',
                }}>
                  <div style={{ fontWeight: 700, fontSize: '0.87rem', marginBottom: 3 }}>{c.author_name}</div>
                  <div style={{ fontSize: '0.93rem', lineHeight: 1.5 }}>{c.content}</div>
                </div>
                <div style={{ display: 'flex', gap: 12, marginTop: 4, paddingLeft: 4 }}>
                  <span style={{ fontSize: '0.75rem', color: 'var(--c-text-muted)' }}>
                    {formatDistanceToNow(new Date(c.created_at), { addSuffix: true })}
                  </span>
                  {user?.id === c.user_id && (
                    <button
                      onClick={() => handleDelete(c.id)}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.75rem', color: 'var(--c-danger)' }}
                    >
                      Delete
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Input */}
      {user && (
        <form onSubmit={handleSubmit} style={{ display: 'flex', gap: 10, alignItems: 'flex-end' }}>
          <Avatar src={user.thumbnail} name={user.name} size={34} style={{ marginBottom: 2 }} />
          <div style={{ flex: 1, display: 'flex', gap: 8 }}>
            <textarea
              value={text}
              onChange={e => setText(e.target.value)}
              placeholder="Write a comment…"
              rows={2}
              style={{
                flex: 1, padding: '10px 14px', borderRadius: 'var(--radius-md)',
                border: '1.5px solid var(--c-border)', resize: 'none',
                fontFamily: 'var(--font-body)', fontSize: '0.9rem',
                background: 'var(--c-surface)',
              }}
            />
            <Button type="submit" size="sm" loading={submitting} disabled={!text.trim()}>
              Post
            </Button>
          </div>
        </form>
      )}
    </div>
  );
};
