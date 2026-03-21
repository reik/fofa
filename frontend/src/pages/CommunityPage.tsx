import React, { useState, useEffect } from 'react';
import { userService } from '../services';
import { User } from '../types';
import { Avatar } from '../components/ui/Avatar';
import { Button } from '../components/ui/Button';
import { useNavigate } from 'react-router-dom';

export const CommunityPage: React.FC = () => {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [members, setMembers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    userService.search(query).then(setMembers).finally(() => setLoading(false));
  }, [query]);

  const startMessage = async (memberId: string) => {
    navigate(`/messages?partner=${memberId}`);
  };

  return (
    <div className="max-w-[900px] mx-auto px-5 py-8">
      <div className="mb-7">
        <h1 className="font-display text-[1.8rem] font-medium text-brand-dark">
          Community
        </h1>
        <p className="text-muted mt-1">Connect with other foster families</p>
      </div>

      <input
        value={query}
        onChange={e => setQuery(e.target.value)}
        placeholder="Search by name, city, or state…"
        className="w-full px-5 py-3 rounded-xl border-[1.5px] border-border text-[0.97rem] font-body mb-6 bg-surface shadow-sm outline-none"
      />

      {loading ? (
        <div className="text-center p-10 text-muted">Searching…</div>
      ) : members.length === 0 ? (
        <div className="text-center p-10 text-muted">
          No members found
        </div>
      ) : (
        <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))' }}>
          {members.map(m => (
            <div key={m.id} className="bg-surface rounded-lg border-[1.5px] border-border p-5 flex items-center gap-[14px] shadow-sm fade-in">
              <Avatar src={m.thumbnail} name={m.name} size={52} />
              <div className="flex-1 min-w-0">
                <div className="font-bold text-[0.97rem]">{m.name}</div>
                <div className="text-muted text-[0.82rem] mt-[2px]">
                  📍 {m.city}, {m.state}
                </div>
                <Button
                  variant="secondary" size="sm"
                  className="mt-[10px]"
                  onClick={() => startMessage(m.id)}
                >
                  💬 Message
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
