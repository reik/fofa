import React, { useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { Announcement, ReactionType } from '../../types';
import { Avatar } from '../ui/Avatar';
import { Button } from '../ui/Button';
import { announcementService } from '../../services';
import { useAuthStore } from '../../contexts/authStore';
import { CommentsSection } from '../dashboard/CommentsSection';

const REACTIONS: { type: ReactionType; emoji: string; label: string }[] = [
  { type: 'like', emoji: '👍', label: 'Like' },
  { type: 'love', emoji: '❤️', label: 'Love' },
  { type: 'hug', emoji: '🤗', label: 'Hug' },
  { type: 'celebrate', emoji: '🎉', label: 'Celebrate' },
  { type: 'support', emoji: '🙏', label: 'Support' },
];

interface Props {
  announcement: Announcement;
  onUpdate: () => void;
}

export const AnnouncementCard: React.FC<Props> = ({ announcement, onUpdate }) => {
  const { user } = useAuthStore();
  const [showComments, setShowComments] = useState(false);
  const [showReactions, setShowReactions] = useState(false);
  const [reactions, setReactions] = useState(announcement.reactions);
  const [userReaction, setUserReaction] = useState(announcement.userReaction);
  const apiBase = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:4000';

  const totalReactions = Object.values(reactions).reduce((a, b) => a + b, 0);

  const handleReaction = async (type: ReactionType) => {
    try {
      const res = await announcementService.toggleReaction(announcement.id, type);
      setReactions(prev => {
        const next = { ...prev };
        if (res.action === 'removed') {
          next[type] = Math.max(0, (next[type] || 1) - 1);
          if (next[type] === 0) delete next[type];
          setUserReaction(null);
        } else if (res.action === 'changed') {
          if (userReaction) {
            next[userReaction] = Math.max(0, (next[userReaction] || 1) - 1);
            if (next[userReaction] === 0) delete next[userReaction];
          }
          next[type] = (next[type] || 0) + 1;
          setUserReaction(type);
        } else {
          next[type] = (next[type] || 0) + 1;
          setUserReaction(type);
        }
        return next;
      });
      setShowReactions(false);
    } catch (err) {
      console.error(err);
    }
  };

  const isOwner = user?.id === announcement.userId;

  const handleDelete = async () => {
    if (!window.confirm('Delete this announcement?')) return;
    await announcementService.remove(announcement.id);
    onUpdate();
  };

  const currentReactionEmoji = userReaction
    ? REACTIONS.find(r => r.type === userReaction)?.emoji
    : null;

  return (
    <article style={{
      background: 'var(--c-surface)', borderRadius: 'var(--radius-lg)',
      border: '1.5px solid var(--c-border)', overflow: 'hidden',
      boxShadow: 'var(--shadow-sm)', animation: 'fadeIn 0.3s ease',
    }}>
      {/* Header */}
      <div style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 12 }}>
        <Avatar src={announcement.author.thumbnail} name={announcement.author.name} size={44} />
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 700 }}>{announcement.author.name}</div>
          <div style={{ fontSize: '0.78rem', color: 'var(--c-text-muted)' }}>
            {formatDistanceToNow(new Date(announcement.createdAt), { addSuffix: true })}
          </div>
        </div>
        {isOwner && (
          <button
            onClick={handleDelete}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--c-text-light)', fontSize: '1.1rem' }}
            aria-label="Delete announcement"
          >
            🗑️
          </button>
        )}
      </div>

      {/* Content */}
      <div style={{ padding: '0 20px 16px', fontSize: '0.97rem', lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>
        {announcement.content}
      </div>

      {/* Media */}
      {announcement.mediaUrl && (
        <div style={{ background: '#000' }}>
          {announcement.mediaType === 'video' ? (
            <video
              src={`${apiBase}${announcement.mediaUrl}`}
              controls
              style={{ width: '100%', maxHeight: 420, objectFit: 'contain' }}
            />
          ) : (
            <img
              src={`${apiBase}${announcement.mediaUrl}`}
              alt="Announcement media"
              style={{ width: '100%', maxHeight: 420, objectFit: 'cover' }}
            />
          )}
        </div>
      )}

      {/* Reaction summary */}
      {totalReactions > 0 && (
        <div style={{ padding: '10px 20px 0', display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {Object.entries(reactions)
            .filter(([, count]) => count > 0)
            .map(([type, count]) => {
              const r = REACTIONS.find(x => x.type === type);
              return r ? (
                <span key={type} style={{
                  background: 'var(--c-brand-light)', borderRadius: 99,
                  padding: '3px 10px', fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: 4,
                }}>
                  {r.emoji} {count}
                </span>
              ) : null;
            })}
        </div>
      )}

      {/* Actions */}
      <div style={{
        padding: '12px 20px', borderTop: '1.5px solid var(--c-border)',
        display: 'flex', gap: 8, position: 'relative', marginTop: 10,
      }}>
        {/* Reaction picker */}
        <div style={{ position: 'relative' }}>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowReactions(o => !o)}
            style={{ color: userReaction ? 'var(--c-brand)' : undefined }}
          >
            {currentReactionEmoji || '👍'} {userReaction ? REACTIONS.find(r => r.type === userReaction)?.label : 'React'}
          </Button>

          {showReactions && (
            <div style={{
              position: 'absolute', bottom: 'calc(100% + 6px)', left: 0,
              background: 'var(--c-surface)', border: '1.5px solid var(--c-border)',
              borderRadius: 'var(--radius-xl)', padding: '8px 12px',
              display: 'flex', gap: 6, boxShadow: 'var(--shadow-md)',
              zIndex: 10, animation: 'fadeIn 0.15s ease',
            }}>
              {REACTIONS.map(r => (
                <button
                  key={r.type}
                  onClick={() => handleReaction(r.type)}
                  title={r.label}
                  style={{
                    background: userReaction === r.type ? 'var(--c-brand-light)' : 'none',
                    border: 'none', cursor: 'pointer', fontSize: '1.4rem',
                    borderRadius: '50%', padding: '4px', lineHeight: 1,
                    transition: 'transform 0.1s',
                  }}
                  onMouseEnter={e => (e.currentTarget.style.transform = 'scale(1.25)')}
                  onMouseLeave={e => (e.currentTarget.style.transform = 'scale(1)')}
                >
                  {r.emoji}
                </button>
              ))}
            </div>
          )}
        </div>

        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowComments(o => !o)}
        >
          💬 {announcement.commentCount > 0 ? `${announcement.commentCount} Comments` : 'Comment'}
        </Button>
      </div>

      {/* Comments */}
      {showComments && (
        <CommentsSection
          announcementId={announcement.id}
          onCommentAdded={onUpdate}
        />
      )}
    </article>
  );
};
