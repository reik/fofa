import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { Conversation, Message, User } from '../../types';
import { Avatar } from '../ui/Avatar';
import { Button } from '../ui/Button';
import { messageService, userService } from '../../services';
import { useAuthStore } from '../../contexts/authStore';
import { useIsMobile } from '../../hooks/useIsMobile';
import toast from 'react-hot-toast';

export const MessagesPanel: React.FC = () => {
  const { user } = useAuthStore();
  const isMobile = useIsMobile();
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

  // On mobile: show list if no conversation selected, show chat if one is selected
  const showList = !isMobile || !activePartnerId;
  const showChat = !isMobile || !!activePartnerId;

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

  const panelHeight = isMobile ? 'calc(100vh - 128px)' : 'calc(100vh - 130px)';

  return (
    <div
      className={[
        'grid bg-surface overflow-hidden',
        isMobile ? 'rounded-none border-none shadow-none' : 'rounded-lg border-[1.5px] border-border shadow-sm',
      ].join(' ')}
      style={{
        gridTemplateColumns: isMobile ? '1fr' : '300px 1fr',
        height: panelHeight,
      }}
    >
      {/* ── Conversation list ── */}
      {showList && (
        <div
          className={[
            'flex flex-col',
            isMobile ? 'border-b-[1.5px] border-border' : 'border-r-[1.5px] border-border',
          ].join(' ')}
        >
          <div className="p-4 border-b border-border">
            <h2 className="font-display text-[1.1rem] mb-[10px]">Messages</h2>
            <div className="relative">
              <input
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search members…"
                className="w-full px-3 py-2 rounded-md border-[1.5px] border-border text-[0.88rem] bg-bg font-body outline-none"
              />
              {searchResults.length > 0 && (
                <div className="absolute top-[calc(100%+4px)] left-0 right-0 bg-surface border-[1.5px] border-border rounded-md shadow-md z-10">
                  {searchResults.map(u => (
                    <button
                      key={u.id}
                      onClick={() => startConversation(u)}
                      className="w-full px-[14px] py-[10px] flex items-center gap-[10px] bg-transparent border-none cursor-pointer text-left font-body"
                    >
                      <Avatar src={u.thumbnail} name={u.name} size={32} />
                      <div>
                        <div className="font-semibold text-[0.88rem]">{u.name}</div>
                        <div className="text-[0.75rem] text-muted">{u.city}, {u.state}</div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            {conversations.length === 0 ? (
              <p className="p-5 text-muted text-[0.88rem] text-center">
                No conversations yet. Search for a member above.
              </p>
            ) : (
              conversations.map(conv => (
                <button
                  key={conv.partner_id}
                  onClick={() => setActivePartnerId(conv.partner_id)}
                  className={[
                    'w-full px-4 py-[14px] flex gap-3 items-center border-none cursor-pointer border-b border-border text-left font-body',
                    activePartnerId === conv.partner_id
                      ? 'bg-brand-light border-l-[3px] border-l-brand'
                      : 'bg-transparent border-l-[3px] border-l-transparent',
                  ].join(' ')}
                >
                  <div className="relative">
                    <Avatar src={conv.partner_thumbnail} name={conv.partner_name} size={42} />
                    {conv.unread_count > 0 && (
                      <span className="absolute -top-[2px] -right-[2px] bg-brand text-white rounded-full w-4 h-4 text-[0.65rem] flex items-center justify-center font-bold">
                        {conv.unread_count}
                      </span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-[0.9rem]">{conv.partner_name}</div>
                    <div className="text-[0.78rem] text-muted overflow-hidden text-ellipsis whitespace-nowrap">
                      {conv.content || 'Start a conversation'}
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      )}

      {/* ── Chat area ── */}
      {showChat && (
        activePartnerId ? (
          <div className="flex flex-col min-w-0">
            {/* Chat header */}
            <div className="px-5 py-[14px] border-b-[1.5px] border-border flex items-center gap-3">
              {/* Back button on mobile */}
              {isMobile && (
                <button
                  onClick={() => setActivePartnerId(null)}
                  className="bg-transparent border-none cursor-pointer text-[1.2rem] pr-2 pl-0 py-1 text-brand font-bold"
                >
                  ←
                </button>
              )}
              <Avatar src={activeConv?.partner_thumbnail || null} name={activeConv?.partner_name || ''} size={40} />
              <div>
                <div className="font-bold">{activeConv?.partner_name}</div>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-5 flex flex-col gap-3">
              {hasMore && (
                <div className="text-center">
                  <button
                    onClick={loadOlderMessages}
                    disabled={loadingMore}
                    className={[
                      'px-4 py-[6px] text-[0.82rem] rounded-md border-[1.5px] border-border bg-bg text-muted font-body',
                      loadingMore ? 'cursor-not-allowed' : 'cursor-pointer',
                    ].join(' ')}
                  >
                    {loadingMore ? 'Loading…' : 'Load older messages'}
                  </button>
                </div>
              )}
              <div ref={topRef} />
              {messages.map(msg => {
                const isMine = msg.sender_id === user?.id;
                return (
                  <div key={msg.id} className={`flex gap-2 ${isMine ? 'justify-end' : 'justify-start'}`}>
                    {!isMine && <Avatar src={msg.sender_thumbnail} name={msg.sender_name} size={30} style={{ marginTop: 4 }} />}
                    <div className="max-w-[78%]">
                      <div className={[
                        'px-[14px] py-[10px] text-[0.93rem] leading-[1.5]',
                        isMine
                          ? 'bg-brand text-white border-none rounded-[18px_18px_4px_18px]'
                          : 'bg-bg border-[1.5px] border-border rounded-[18px_18px_18px_4px]',
                      ].join(' ')}>
                        {msg.content}
                      </div>
                      <div className={`text-[0.72rem] text-muted mt-1 ${isMine ? 'text-right' : 'text-left'}`}>
                        {formatDistanceToNow(new Date(msg.created_at), { addSuffix: true })}
                      </div>
                    </div>
                  </div>
                );
              })}
              <div ref={bottomRef} />
            </div>

            {/* Input */}
            <form onSubmit={handleSend} className="px-5 py-[14px] border-t-[1.5px] border-border flex gap-[10px]">
              <input
                value={newMsg}
                onChange={e => setNewMsg(e.target.value)}
                placeholder="Type a message…"
                className="flex-1 px-4 py-[10px] rounded-xl border-[1.5px] border-border text-[0.93rem] font-body bg-bg outline-none"
              />
              <Button type="submit" loading={sending} disabled={!newMsg.trim()}>Send</Button>
            </form>
          </div>
        ) : (
          <div className="flex items-center justify-center flex-col gap-3 text-muted">
            <span className="text-[3rem]">💬</span>
            <p className="font-semibold">Select a conversation or search for a member</p>
          </div>
        )
      )}
    </div>
  );
};
