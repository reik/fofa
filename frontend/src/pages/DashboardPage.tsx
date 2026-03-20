import React, { useState, useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Announcement } from '../types';
import { announcementService, userService, familyService } from '../services';
import { AnnouncementCard } from '../components/announcements/AnnouncementCard';
import { CreateAnnouncementForm } from '../components/announcements/CreateAnnouncementForm';
import { Avatar } from '../components/ui/Avatar';
import { Button, Spinner } from '../components/ui/Button';
import { useAuthStore } from '../contexts/authStore';
import { Link } from 'react-router-dom';

export const DashboardPage: React.FC = () => {
  const { user } = useAuthStore();
  const qc = useQueryClient();
  const [page, setPage] = useState(1);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['announcements', page],
    queryFn: () => announcementService.getAll(page),
  });

  const { data: familyData } = useQuery({
    queryKey: ['family'],
    queryFn: familyService.getAll,
  });

  const { data: communityMembers } = useQuery({
    queryKey: ['community-preview'],
    queryFn: () => userService.search(''),
  });

  const handleCreated = useCallback(() => {
    setPage(1);
    qc.invalidateQueries({ queryKey: ['announcements'] });
  }, [qc]);

  const handleUpdate = useCallback(() => {
    qc.invalidateQueries({ queryKey: ['announcements'] });
  }, [qc]);

  return (
    <div style={{
      maxWidth: 1100, margin: '0 auto', padding: '24px 20px',
      display: 'grid', gridTemplateColumns: '240px 1fr 240px', gap: 24,
    }}>
      {/* Left sidebar */}
      <aside>
        {user && (
          <div style={{
            background: 'var(--c-surface)', borderRadius: 'var(--radius-lg)',
            border: '1.5px solid var(--c-border)', overflow: 'hidden',
            boxShadow: 'var(--shadow-sm)',
          }}>
            {/* Cover */}
            <div style={{ height: 60, background: 'linear-gradient(135deg, var(--c-brand) 0%, var(--c-accent) 100%)' }} />
            <div style={{ padding: '0 16px 20px', textAlign: 'center', marginTop: -30 }}>
              <Avatar src={user.thumbnail} name={user.name} size={60} style={{ margin: '0 auto', border: '3px solid #fff' }} />
              <div style={{ fontWeight: 700, marginTop: 8 }}>{user.name}</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--c-text-muted)', marginTop: 2 }}>{user.city}, {user.state}</div>
              <Link to="/profile">
                <Button variant="secondary" size="sm" style={{ marginTop: 12, width: '100%', justifyContent: 'center' }}>
                  Edit Profile
                </Button>
              </Link>
            </div>

            {/* Family preview */}
            {familyData && familyData.length > 0 && (
              <div style={{ borderTop: '1.5px solid var(--c-border)', padding: '14px 16px' }}>
                <div style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--c-text-muted)', marginBottom: 10 }}>MY FAMILY</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {familyData.slice(0, 6).map(m => (
                    <div key={m.id} style={{ textAlign: 'center' }}>
                      <Avatar src={m.thumbnail} name={m.name} size={36} />
                      <div style={{ fontSize: '0.7rem', marginTop: 3, color: 'var(--c-text-muted)' }}>{m.name.split(' ')[0]}</div>
                    </div>
                  ))}
                </div>
                <Link to="/family" style={{ fontSize: '0.82rem', color: 'var(--c-brand)', display: 'block', marginTop: 10, fontWeight: 600 }}>
                  Manage family →
                </Link>
              </div>
            )}
          </div>
        )}
      </aside>

      {/* Feed */}
      <main style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        <CreateAnnouncementForm onCreated={handleCreated} />

        {isLoading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '40px 0' }}>
            <Spinner size={32} />
          </div>
        ) : data?.data.length === 0 ? (
          <div style={{
            textAlign: 'center', padding: '60px 20px',
            background: 'var(--c-surface)', borderRadius: 'var(--radius-lg)',
            border: '1.5px solid var(--c-border)',
          }}>
            <div style={{ fontSize: '3rem', marginBottom: 12 }}>🌿</div>
            <h3 style={{ fontFamily: 'var(--font-display)' }}>The feed is quiet</h3>
            <p style={{ color: 'var(--c-text-muted)', marginTop: 8 }}>Be the first to post an announcement!</p>
          </div>
        ) : (
          <>
            {data?.data.map((ann: Announcement) => (
              <AnnouncementCard key={ann.id} announcement={ann} onUpdate={handleUpdate} />
            ))}

            {/* Pagination */}
            {data && data.pagination.pages > 1 && (
              <div style={{ display: 'flex', justifyContent: 'center', gap: 10 }}>
                <Button
                  variant="ghost" size="sm"
                  disabled={page === 1}
                  onClick={() => setPage(p => p - 1)}
                >
                  ← Previous
                </Button>
                <span style={{ padding: '8px 16px', fontSize: '0.9rem', color: 'var(--c-text-muted)' }}>
                  Page {page} of {data.pagination.pages}
                </span>
                <Button
                  variant="ghost" size="sm"
                  disabled={page === data.pagination.pages}
                  onClick={() => setPage(p => p + 1)}
                >
                  Next →
                </Button>
              </div>
            )}
          </>
        )}
      </main>

      {/* Right sidebar */}
      <aside>
        <div style={{
          background: 'var(--c-surface)', borderRadius: 'var(--radius-lg)',
          border: '1.5px solid var(--c-border)', padding: '16px',
          boxShadow: 'var(--shadow-sm)',
        }}>
          <div style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--c-text-muted)', marginBottom: 12 }}>COMMUNITY MEMBERS</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {communityMembers?.slice(0, 8).map((m: any) => (
              <div key={m.id} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <Avatar src={m.thumbnail} name={m.name} size={34} />
                <div>
                  <div style={{ fontWeight: 600, fontSize: '0.88rem' }}>{m.name}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--c-text-muted)' }}>{m.city}, {m.state}</div>
                </div>
              </div>
            ))}
          </div>
          <Link to="/community" style={{ display: 'block', marginTop: 14, fontSize: '0.82rem', color: 'var(--c-brand)', fontWeight: 600 }}>
            View all members →
          </Link>
        </div>
      </aside>
    </div>
  );
};
