import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { Conversation, Message, User } from '../../types';
import { Avatar } from '../ui/Avatar';
import { Button } from '../ui/Button';
import { messageService, userService } from '../../services';
import { useAuthStore } from '../../contexts/authStore';
import toast from 'react-hot-toast';

export const MessagesPanel: React.FC = () => {
  const { user } = useAuthStore();
  const [searchParams] = useSearchParams();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activePartnerId, setActivePartnerId] = useState<string | null>(
    searchParams.get('partner')
  );
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMsg, setNewMsg] = useState('');
  const [sending, setSending] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const topRef = useRef<HTMLDivElement>(null);

  const activeConv = conversations.find(c => c.partner_id === activePartnerId);

  useEffect(() => {
    messageService.getConversations().then(setConversations);
  }, []);

  useEffect(() => {
    if (!activePartnerId) return;
    setPage(1);
    setHasMore(false);
    messageService.getMessages(activePartnerId, 1).then(msgs => {
      setMessages(msgs);
      setHasMore(msgs.length === 30);
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 50);
    });
  }, [activePartnerId]);

  const loadOlderMessages = async () => {
    if (!activePartnerId || loadingMore) return;
    setLoadingMore(true);
    const nextPage = page + 1;
    try {
      const older = await messageService.getMessages(activePartnerId, nextPage);
      setMessages(prev => [...older, ...prev]);
      setPage(nextPage);
      setHasMore(older.length === 30);
      setTimeout(() => topRef.current?.scrollIntoView({ behavior: 'instant' as ScrollBehavior }), 50);
    } finally {
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    if (!searchQuery.trim()) { setSearchResults([]); return; }
    const t = setTimeout(() => {
      userService.search(searchQuery).then(setSearchResults);
    }, 300);
    return () => clearTimeout(t);
  }, [searchQuery]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMsg.trim() || !activePartnerId) return;
    setSending(true);
    try {
      const msg = await messageService.send(activePartnerId, newMsg.trim());
      setMessages(prev => [...prev, msg]);
      setNewMsg('');
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 50);
      messageService.getConversations().then(setConversations);
    } catch {
      toast.error('Failed to send message');
    } finally {
      setSending(false);
    }
  };

  const startConversation = (partner: User) => {
    setActivePartnerId(partner.id);
    setSearchQuery('');
    setSearchResults([]);
    if (!conversations.find(c => c.partner_id === partner.id)) {
      setConversations(prev => [{
        id: partner.id, partner_id: partner.id,
        partner_name: partner.name, partner_thumbnail: partner.thumbnail,
        content: '', created_at: new Date().toISOString(), unread_count: 0,
      }, ...prev]);
    }
  };

  return (
    <div style={{
      display: 'grid', gridTemplateColumns: '300px 1fr',
      height: 'calc(100vh - 130px)', background: 'var(--c-surface)',
      borderRadius: 'var(--radius-lg)', border: '1.5px solid var(--c-border)',
      overflow: 'hidden', boxShadow: 'var(--shadow-sm)',
    }}>
      {/* Sidebar */}
      <div style={{ borderRight: '1.5px solid var(--c-border)', display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: '16px', borderBottom: '1px solid var(--c-border)' }}>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.1rem', marginBottom: 10 }}>Messages</h2>
          <div style={{ position: 'relative' }}>
            <input
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search members…"
              style={{
                width: '100%', padding: '8px 12px', borderRadius: 'var(--radius-md)',
                border: '1.5px solid var(--c-border)', fontSize: '0.88rem',
                background: 'var(--c-bg)', fontFamily: 'var(--font-body)',
              }}
            />
            {searchResults.length > 0 && (
              <div style={{
                position: 'absolute', top: 'calc(100% + 4px)', left: 0, right: 0,
                background: 'var(--c-surface)', border: '1.5px solid var(--c-border)',
                borderRadius: 'var(--radius-md)', boxShadow: 'var(--shadow-md)', zIndex: 10,
              }}>
                {searchResults.map(u => (
                  <button
                    key={u.id}
                    onClick={() => startConversation(u)}
                    style={{
                      width: '100%', padding: '10px 14px', display: 'flex', alignItems: 'center',
                      gap: 10, background: 'none', border: 'none', cursor: 'pointer',
                      textAlign: 'left', fontFamily: 'var(--font-body)',
                    }}
                  >
                    <Avatar src={u.thumbnail} name={u.name} size={32} />
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '0.88rem' }}>{u.name}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--c-text-muted)' }}>{u.city}, {u.state}</div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <div style={{ flex: 1, overflowY: 'auto' }}>
          {conversations.length === 0 ? (
            <p style={{ padding: '20px', color: 'var(--c-text-muted)', fontSize: '0.88rem', textAlign: 'center' }}>
              No conversations yet. Search for a member above.
            </p>
          ) : (
            conversations.map(conv => (
              <button
                key={conv.partner_id}
                onClick={() => setActivePartnerId(conv.partner_id)}
                style={{
                  width: '100%', padding: '14px 16px', display: 'flex', gap: 12,
                  alignItems: 'center', background: activePartnerId === conv.partner_id ? 'var(--c-brand-light)' : 'none',
                  border: 'none', cursor: 'pointer', borderBottom: '1px solid var(--c-border)',
                  textAlign: 'left', fontFamily: 'var(--font-body)',
                  borderLeft: activePartnerId === conv.partner_id ? '3px solid var(--c-brand)' : '3px solid transparent',
                }}
              >
                <div style={{ position: 'relative' }}>
                  <Avatar src={conv.partner_thumbnail} name={conv.partner_name} size={42} />
                  {conv.unread_count > 0 && (
                    <span style={{
                      position: 'absolute', top: -2, right: -2,
                      background: 'var(--c-brand)', color: '#fff',
                      borderRadius: '50%', width: 16, height: 16,
                      fontSize: '0.65rem', display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontWeight: 700,
                    }}>{conv.unread_count}</span>
                  )}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>{conv.partner_name}</div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--c-text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {conv.content || 'Start a conversation'}
                  </div>
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      {/* Chat area */}
      {activePartnerId ? (
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {/* Chat header */}
          <div style={{ padding: '14px 20px', borderBottom: '1.5px solid var(--c-border)', display: 'flex', alignItems: 'center', gap: 12 }}>
            <Avatar src={activeConv?.partner_thumbnail || null} name={activeConv?.partner_name || ''} size={40} />
            <div>
              <div style={{ fontWeight: 700 }}>{activeConv?.partner_name}</div>
            </div>
          </div>

          {/* Messages */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '20px', display: 'flex', flexDirection: 'column', gap: 12 }}>
            {hasMore && (
              <div style={{ textAlign: 'center' }}>
                <button
                  onClick={loadOlderMessages}
                  disabled={loadingMore}
                  style={{
                    padding: '6px 16px', fontSize: '0.82rem', borderRadius: 'var(--radius-md)',
                    border: '1.5px solid var(--c-border)', background: 'var(--c-bg)',
                    color: 'var(--c-text-muted)', cursor: loadingMore ? 'not-allowed' : 'pointer',
                    fontFamily: 'var(--font-body)',
                  }}
                >
                  {loadingMore ? 'Loading…' : 'Load older messages'}
                </button>
              </div>
            )}
            <div ref={topRef} />
            {messages.map(msg => {
              const isMine = msg.sender_id === user?.id;
              return (
                <div key={msg.id} style={{ display: 'flex', justifyContent: isMine ? 'flex-end' : 'flex-start', gap: 8 }}>
                  {!isMine && <Avatar src={msg.sender_thumbnail} name={msg.sender_name} size={30} style={{ marginTop: 4 }} />}
                  <div style={{ maxWidth: '68%' }}>
                    <div style={{
                      padding: '10px 14px', borderRadius: isMine ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                      background: isMine ? 'var(--c-brand)' : 'var(--c-bg)',
                      color: isMine ? '#fff' : 'var(--c-text)',
                      border: isMine ? 'none' : '1.5px solid var(--c-border)',
                      fontSize: '0.93rem', lineHeight: 1.5,
                    }}>
                      {msg.content}
                    </div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--c-text-muted)', marginTop: 4, textAlign: isMine ? 'right' : 'left' }}>
                      {formatDistanceToNow(new Date(msg.created_at), { addSuffix: true })}
                    </div>
                  </div>
                </div>
              );
            })}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <form onSubmit={handleSend} style={{ padding: '14px 20px', borderTop: '1.5px solid var(--c-border)', display: 'flex', gap: 10 }}>
            <input
              value={newMsg}
              onChange={e => setNewMsg(e.target.value)}
              placeholder="Type a message…"
              style={{
                flex: 1, padding: '10px 16px', borderRadius: 'var(--radius-xl)',
                border: '1.5px solid var(--c-border)', fontSize: '0.93rem',
                fontFamily: 'var(--font-body)', background: 'var(--c-bg)',
              }}
            />
            <Button type="submit" loading={sending} disabled={!newMsg.trim()}>Send</Button>
          </form>
        </div>
      ) : (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 12, color: 'var(--c-text-muted)' }}>
          <span style={{ fontSize: '3rem' }}>💬</span>
          <p style={{ fontWeight: 600 }}>Select a conversation or search for a member</p>
        </div>
      )}
    </div>
  );
};
