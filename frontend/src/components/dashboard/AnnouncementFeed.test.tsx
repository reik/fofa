import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

vi.mock('../../services', () => ({ announcementService: { getAll: vi.fn() } }));
vi.mock('../announcements/AnnouncementCard', () => ({
  AnnouncementCard: ({ announcement }: any) => <div data-testid="card">{announcement.content}</div>,
}));

// Render-everything stub for react-virtualized so jsdom shows rows.
vi.mock('react-virtualized', () => {
  const React = require('react');
  return {
    WindowScroller: ({ children }: any) => children({ height: 800, isScrolling: false, onChildScroll: () => {}, scrollTop: 0, registerChild: () => {} }),
    AutoSizer: ({ children }: any) => children({ width: 600, height: 800 }),
    InfiniteLoader: ({ children }: any) => children({ onRowsRendered: () => {}, registerChild: () => {} }),
    List: ({ rowCount, rowRenderer }: any) =>
      React.createElement('div', null, Array.from({ length: rowCount }).map((_: unknown, i: number) =>
        rowRenderer({ index: i, key: String(i), parent: {}, style: {} }))),
    CellMeasurer: ({ children }: any) => children({ measure: () => {}, registerChild: () => {} }),
    CellMeasurerCache: class { rowHeight = () => 100; clear() {} },
  };
});

import { announcementService } from '../../services';
import { AnnouncementFeed } from './AnnouncementFeed';

const post = (id: string, content: string) => ({
  id, userId: 'u', content, mediaUrl: null, mediaType: null,
  createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
  author: { name: 'A', thumbnail: null }, commentCount: 0, reactions: {}, userReaction: null,
});

function renderFeed() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={qc}><MemoryRouter>
      <AnnouncementFeed onUpdate={() => {}} />
    </MemoryRouter></QueryClientProvider>
  );
}

describe('AnnouncementFeed', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it('shows the empty state when there are no posts', async () => {
    vi.mocked(announcementService.getAll).mockResolvedValue({ data: [], pagination: { page: 1, limit: 20, pages: 1, total: 0 } });
    renderFeed();
    expect(await screen.findByText(/the feed is quiet/i)).toBeInTheDocument();
  });

  it('renders posts from the first page', async () => {
    vi.mocked(announcementService.getAll).mockResolvedValue({ data: [post('1', 'hello')], pagination: { page: 1, limit: 20, pages: 2, total: 21 } });
    renderFeed();
    expect(await screen.findByText('hello')).toBeInTheDocument();
  });

  it('requests page 1 on mount', async () => {
    vi.mocked(announcementService.getAll).mockResolvedValue({ data: [], pagination: { page: 1, limit: 20, pages: 1, total: 0 } });
    renderFeed();
    await waitFor(() => expect(announcementService.getAll).toHaveBeenCalledWith(1));
  });
});
