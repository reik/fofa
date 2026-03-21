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
    <article className="bg-surface rounded-lg border-[1.5px] border-border overflow-hidden shadow-sm fade-in">
      {/* Header */}
      <div className="px-5 py-4 flex items-center gap-3">
        <Avatar src={announcement.author.thumbnail} name={announcement.author.name} size={44} />
        <div className="flex-1">
          <div className="font-bold">{announcement.author.name}</div>
          <div className="text-[0.78rem] text-muted">
            {formatDistanceToNow(new Date(announcement.createdAt), { addSuffix: true })}
          </div>
        </div>
        {isOwner && (
          <button
            onClick={handleDelete}
            className="bg-transparent border-none cursor-pointer text-light text-[1.1rem]"
            aria-label="Delete announcement"
          >
            🗑️
          </button>
        )}
      </div>

      {/* Content */}
      <div className="px-5 pb-4 text-[0.97rem] leading-[1.7] whitespace-pre-wrap">
        {announcement.content}
      </div>

      {/* Media */}
      {announcement.mediaUrl && (
        <div className="bg-black">
          {announcement.mediaType === 'video' ? (
            <video
              src={`${apiBase}${announcement.mediaUrl}`}
              controls
              className="w-full max-h-[420px] object-contain"
            />
          ) : (
            <img
              src={`${apiBase}${announcement.mediaUrl}`}
              alt="Announcement media"
              className="w-full max-h-[420px] object-cover"
            />
          )}
        </div>
      )}

      {/* Reaction summary */}
      {totalReactions > 0 && (
        <div className="px-5 pt-[10px] flex gap-[6px] flex-wrap">
          {Object.entries(reactions)
            .filter(([, count]) => count > 0)
            .map(([type, count]) => {
              const r = REACTIONS.find(x => x.type === type);
              return r ? (
                <span key={type} className="bg-brand-light rounded-full px-[10px] py-[3px] text-[0.82rem] flex items-center gap-1">
                  {r.emoji} {count}
                </span>
              ) : null;
            })}
        </div>
      )}

      {/* Actions */}
      <div className="px-5 py-3 border-t-[1.5px] border-border flex gap-2 relative mt-[10px]">
        {/* Reaction picker */}
        <div className="relative">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowReactions(o => !o)}
            className={userReaction ? 'text-brand' : ''}
          >
            {currentReactionEmoji || '👍'} {userReaction ? REACTIONS.find(r => r.type === userReaction)?.label : 'React'}
          </Button>

          {showReactions && (
            <div className="absolute bottom-[calc(100%+6px)] left-0 bg-surface border-[1.5px] border-border rounded-xl px-3 py-2 flex gap-[6px] shadow-md z-10 fade-in">
              {REACTIONS.map(r => (
                <button
                  key={r.type}
                  onClick={() => handleReaction(r.type)}
                  title={r.label}
                  className={[
                    'border-none cursor-pointer text-[1.4rem] rounded-full p-1 leading-none transition-transform duration-100',
                    userReaction === r.type ? 'bg-brand-light' : 'bg-transparent',
                  ].join(' ')}
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
