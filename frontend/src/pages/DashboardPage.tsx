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

  const { data, isLoading } = useQuery({
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
    <div className="max-w-[1100px] mx-auto px-3 py-4 md:px-5 md:py-6 grid grid-cols-1 md:grid-cols-[240px_1fr_240px] gap-4 md:gap-6">
      {/* Left sidebar — hidden on mobile */}
      <aside className="hidden md:block">
        {user && (
          <div className="bg-surface rounded-lg border-[1.5px] border-border overflow-hidden shadow-sm">
            {/* Cover */}
            <div className="h-[60px] bg-gradient-to-br from-brand to-accent" />
            <div className="px-4 pb-5 text-center -mt-[30px]">
              <Avatar src={user.thumbnail} name={user.name} size={60} style={{ margin: '0 auto', border: '3px solid #fff' }} />
              <div className="font-bold mt-2">{user.name}</div>
              <div className="text-[0.8rem] text-muted mt-[2px]">{user.city}, {user.state}</div>
              <Link to="/profile">
                <Button variant="secondary" size="sm" className="mt-3 w-full justify-center">
                  Edit Profile
                </Button>
              </Link>
            </div>

            {/* Family preview */}
            {familyData && familyData.length > 0 && (
              <div className="border-t-[1.5px] border-border px-4 py-[14px]">
                <div className="font-bold text-[0.85rem] text-muted mb-[10px] uppercase tracking-wide">My Family</div>
                <div className="flex flex-wrap gap-2">
                  {familyData.slice(0, 6).map(m => (
                    <div key={m.id} className="text-center">
                      <Avatar src={m.thumbnail} name={m.name} size={36} />
                      <div className="text-[0.7rem] mt-[3px] text-muted">{m.name.split(' ')[0]}</div>
                    </div>
                  ))}
                </div>
                <Link to="/family" className="text-[0.82rem] text-brand block mt-[10px] font-semibold no-underline hover:underline">
                  Manage family →
                </Link>
              </div>
            )}
          </div>
        )}
      </aside>

      {/* Feed */}
      <main className="flex flex-col gap-4 min-w-0">
        <CreateAnnouncementForm onCreated={handleCreated} />

        {isLoading ? (
          <div className="flex justify-center py-10">
            <Spinner size={32} />
          </div>
        ) : data?.data.length === 0 ? (
          <div className="text-center py-[60px] px-5 bg-surface rounded-lg border-[1.5px] border-border">
            <div className="text-[3rem] mb-3">🌿</div>
            <h3 className="font-display">The feed is quiet</h3>
            <p className="text-muted mt-2">Be the first to post an announcement!</p>
          </div>
        ) : (
          <>
            {data?.data.map((ann: Announcement) => (
              <AnnouncementCard key={ann.id} announcement={ann} onUpdate={handleUpdate} />
            ))}

            {/* Pagination */}
            {data && data.pagination.pages > 1 && (
              <div className="flex justify-center gap-[10px]">
                <Button
                  variant="ghost" size="sm"
                  disabled={page === 1}
                  onClick={() => setPage(p => p - 1)}
                >
                  ← Previous
                </Button>
                <span className="px-4 py-2 text-[0.9rem] text-muted">
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

      {/* Right sidebar — hidden on mobile */}
      <aside className="hidden md:block">
        <div className="bg-surface rounded-lg border-[1.5px] border-border p-4 shadow-sm">
          <div className="font-bold text-[0.85rem] text-muted mb-3 uppercase tracking-wide">Community Members</div>
          <div className="flex flex-col gap-[10px]">
            {communityMembers?.slice(0, 8).map((m: any) => (
              <div key={m.id} className="flex items-center gap-[10px]">
                <Avatar src={m.thumbnail} name={m.name} size={34} />
                <div>
                  <div className="font-semibold text-[0.88rem]">{m.name}</div>
                  <div className="text-[0.75rem] text-muted">{m.city}, {m.state}</div>
                </div>
              </div>
            ))}
          </div>
          <Link to="/community" className="block mt-[14px] text-[0.82rem] text-brand font-semibold no-underline hover:underline">
            View all members →
          </Link>
        </div>
      </aside>
    </div>
  );
};
