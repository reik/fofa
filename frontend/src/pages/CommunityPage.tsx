import React, { useState, useEffect } from 'react';
import { userService, messageService } from '../services';
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
    <div style={{ maxWidth: 900, margin: '0 auto', padding: '32px 20px' }}>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '1.8rem', fontWeight: 500, color: 'var(--c-brand-dark)' }}>
          Community
        </h1>
        <p style={{ color: 'var(--c-text-muted)', marginTop: 4 }}>Connect with other foster families</p>
      </div>

      <input
        value={query}
        onChange={e => setQuery(e.target.value)}
        placeholder="Search by name, city, or state…"
        style={{
          width: '100%', padding: '12px 20px', borderRadius: 'var(--radius-xl)',
          border: '1.5px solid var(--c-border)', fontSize: '0.97rem',
          fontFamily: 'var(--font-body)', marginBottom: 24,
          background: 'var(--c-surface)', boxShadow: 'var(--shadow-sm)',
        }}
      />

      {loading ? (
        <div style={{ textAlign: 'center', padding: 40, color: 'var(--c-text-muted)' }}>Searching…</div>
      ) : members.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 40, color: 'var(--c-text-muted)' }}>
          No members found
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 16 }}>
          {members.map(m => (
            <div key={m.id} style={{
              background: 'var(--c-surface)', borderRadius: 'var(--radius-lg)',
              border: '1.5px solid var(--c-border)', padding: '20px',
              display: 'flex', alignItems: 'center', gap: 14,
              boxShadow: 'var(--shadow-sm)', animation: 'fadeIn 0.25s ease',
            }}>
              <Avatar src={m.thumbnail} name={m.name} size={52} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 700, fontSize: '0.97rem' }}>{m.name}</div>
                <div style={{ color: 'var(--c-text-muted)', fontSize: '0.82rem', marginTop: 2 }}>
                  📍 {m.city}, {m.state}
                </div>
                <Button
                  variant="secondary" size="sm"
                  style={{ marginTop: 10 }}
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
