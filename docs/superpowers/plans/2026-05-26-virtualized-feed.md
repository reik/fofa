# Virtualized Infinite Announcement Feed — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the `/dashboard` 20-per-page paginated feed with an infinite, window-scrolled, `react-virtualized` list of announcements.

**Architecture:** A new `AnnouncementFeed` component owns a `useInfiniteQuery` and renders posts through `WindowScroller → AutoSizer → InfiniteLoader → List`, each row wrapped in `CellMeasurer` for variable height. `AnnouncementCard` gains an optional `onHeightChange` callback so rows re-measure when comments/reactions/media change. `DashboardPage` becomes a layout shell.

**Tech Stack:** React 18, TypeScript, TanStack Query v5, react-virtualized, Vitest + React Testing Library.

Spec: `docs/superpowers/specs/2026-05-26-dashboard-virtualized-feed-design.md`

---

## File Structure

| File | Responsibility |
|---|---|
| `frontend/package.json` | add `react-virtualized` + `@types/react-virtualized` |
| `frontend/src/components/announcements/AnnouncementCard.tsx` | add optional `onHeightChange`; fire it on comment/reaction/media height changes |
| `frontend/src/components/announcements/AnnouncementCard.test.tsx` | cover `onHeightChange` |
| `frontend/src/components/dashboard/AnnouncementFeed.tsx` | NEW — infinite query + virtualized list |
| `frontend/src/components/dashboard/AnnouncementFeed.test.tsx` | NEW — feed data behavior (react-virtualized mocked) |
| `frontend/src/pages/DashboardPage.tsx` | drop pagination/`useQuery`; render `AnnouncementFeed` |
| `frontend/src/pages/DashboardPage.test.tsx` | drop pagination test; mock `AnnouncementFeed` |

All commands run from `frontend/`.

---

### Task 1: Add the react-virtualized dependency

**Files:** Modify `frontend/package.json` (+ lockfile)

- [ ] **Step 1: Install** (requires approval — sandbox blocks npm registry)

```bash
npm install react-virtualized @types/react-virtualized
```

- [ ] **Step 2: Verify it imports & types resolve**

Run: `npx tsc --noEmit`
Expected: exit 0 (no new errors).

- [ ] **Step 3: Commit**

```bash
git add package.json package-lock.json
git commit -m "build(frontend): add react-virtualized + types"
```

---

### Task 2: Add `onHeightChange` to AnnouncementCard

**Files:**
- Modify: `frontend/src/components/announcements/AnnouncementCard.tsx`
- Test: `frontend/src/components/announcements/AnnouncementCard.test.tsx`

- [ ] **Step 1: Write the failing test**

Add to `AnnouncementCard.test.tsx` (create the file if absent; if it exists, append the test and reuse its existing mocks/imports):

```tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { AnnouncementCard } from './AnnouncementCard';

vi.mock('../../contexts/authStore', () => ({
  useAuthStore: () => ({ user: { id: 'me' } }),
}));
vi.mock('../dashboard/CommentsSection', () => ({
  CommentsSection: () => <div data-testid="comments" />,
}));

const ann = {
  id: 'a1', userId: 'u2', content: 'hi', mediaUrl: null, mediaType: null,
  createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
  author: { name: 'James', thumbnail: null }, commentCount: 0,
  reactions: {}, userReaction: null,
} as const;

it('calls onHeightChange when comments are toggled', () => {
  const onHeightChange = vi.fn();
  render(
    <MemoryRouter>
      <AnnouncementCard announcement={ann} onUpdate={() => {}} onHeightChange={onHeightChange} />
    </MemoryRouter>
  );
  onHeightChange.mockClear(); // ignore mount-time call
  fireEvent.click(screen.getByRole('button', { name: /comment/i }));
  expect(onHeightChange).toHaveBeenCalled();
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/components/announcements/AnnouncementCard.test.tsx`
Expected: FAIL — `onHeightChange` prop doesn't exist / not called.

- [ ] **Step 3: Implement**

In `AnnouncementCard.tsx`:

Change the React import (line 1) to include `useEffect`:
```tsx
import React, { useState, useEffect } from 'react';
```

Extend `Props` (around line 19):
```tsx
interface Props {
  announcement: Announcement;
  onUpdate: () => void;
  onHeightChange?: () => void;
}
```

Update the signature (line 24):
```tsx
export const AnnouncementCard: React.FC<Props> = ({ announcement, onUpdate, onHeightChange }) => {
```

Add an effect right after the `totalReactions` line (after line 32):
```tsx
  // Re-measure the virtualized row whenever our height can change.
  useEffect(() => {
    onHeightChange?.();
  }, [showComments, reactions, onHeightChange]);
```

Add `onLoad`/`onLoadedData` to the media (lines 107-118): add `onLoad={() => onHeightChange?.()}` to the `<img>` and `onLoadedData={() => onHeightChange?.()}` to the `<video>`.

- [ ] **Step 4: Run tests**

Run: `npx vitest run src/components/announcements/AnnouncementCard.test.tsx`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/components/announcements/AnnouncementCard.tsx src/components/announcements/AnnouncementCard.test.tsx
git commit -m "feat(feed): AnnouncementCard onHeightChange for re-measure"
```

---

### Task 3: Create the AnnouncementFeed component

**Files:**
- Create: `frontend/src/components/dashboard/AnnouncementFeed.tsx`
- Test: `frontend/src/components/dashboard/AnnouncementFeed.test.tsx`

- [ ] **Step 1: Write the failing test**

`AnnouncementFeed.test.tsx` — mock `react-virtualized` so rows render in jsdom, and mock the service:

```tsx
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
  beforeEach(() => vi.clearAllMocks());

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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/components/dashboard/AnnouncementFeed.test.tsx`
Expected: FAIL — `AnnouncementFeed` doesn't exist.

- [ ] **Step 3: Implement `AnnouncementFeed.tsx`**

```tsx
import React, { useRef, useCallback } from 'react';
import { useInfiniteQuery } from '@tanstack/react-query';
import {
  WindowScroller, AutoSizer, List, CellMeasurer, CellMeasurerCache, InfiniteLoader,
  type ListRowRenderer,
} from 'react-virtualized';
import 'react-virtualized/styles.css';
import { Announcement } from '../../types';
import { announcementService } from '../../services';
import { AnnouncementCard } from '../announcements/AnnouncementCard';
import { Spinner } from '../ui/Button';

interface Props {
  onUpdate: () => void;
}

export const AnnouncementFeed: React.FC<Props> = ({ onUpdate }) => {
  const { data, isLoading, fetchNextPage, hasNextPage, isFetchingNextPage } = useInfiniteQuery({
    queryKey: ['announcements', 'infinite'],
    queryFn: ({ pageParam }) => announcementService.getAll(pageParam),
    initialPageParam: 1,
    getNextPageParam: (last) =>
      last.pagination.page < last.pagination.pages ? last.pagination.page + 1 : undefined,
  });

  const posts: Announcement[] = data?.pages.flatMap((p) => p.data) ?? [];

  const cache = useRef(new CellMeasurerCache({ fixedWidth: true, defaultHeight: 220 }));
  const listRef = useRef<List | null>(null);

  const rowCount = hasNextPage ? posts.length + 1 : posts.length;
  const isRowLoaded = ({ index }: { index: number }) => index < posts.length;
  const loadMoreRows = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) return fetchNextPage().then(() => undefined);
    return Promise.resolve();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const rowRenderer: ListRowRenderer = ({ index, key, parent, style }) => {
    if (index >= posts.length) {
      return (
        <div key={key} style={style} className="flex justify-center py-6">
          <Spinner size={28} />
        </div>
      );
    }
    const ann = posts[index];
    return (
      <CellMeasurer cache={cache.current} columnIndex={0} key={ann.id} parent={parent} rowIndex={index}>
        {({ registerChild }) => (
          <div ref={registerChild as React.Ref<HTMLDivElement>} style={style} className="pb-4">
            <AnnouncementCard
              announcement={ann}
              onUpdate={onUpdate}
              onHeightChange={() => {
                cache.current.clear(index, 0);
                listRef.current?.recomputeRowHeights(index);
              }}
            />
          </div>
        )}
      </CellMeasurer>
    );
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-10">
        <Spinner size={32} />
      </div>
    );
  }

  if (posts.length === 0) {
    return (
      <div className="text-center py-[60px] px-5 bg-surface rounded-lg border-[1.5px] border-border">
        <div className="text-[3rem] mb-3">🌿</div>
        <h3 className="font-heading">The feed is quiet</h3>
        <p className="text-muted mt-2">Be the first to post an announcement!</p>
      </div>
    );
  }

  return (
    <WindowScroller>
      {({ height, isScrolling, onChildScroll, scrollTop, registerChild }) => (
        <InfiniteLoader isRowLoaded={isRowLoaded} loadMoreRows={loadMoreRows} rowCount={rowCount}>
          {({ onRowsRendered, registerChild: registerList }) => (
            <AutoSizer disableHeight>
              {({ width }) => (
                <div ref={registerChild as React.Ref<HTMLDivElement>}>
                  <List
                    autoHeight
                    height={height}
                    width={width}
                    isScrolling={isScrolling}
                    onScroll={onChildScroll}
                    scrollTop={scrollTop}
                    rowCount={rowCount}
                    rowHeight={cache.current.rowHeight}
                    deferredMeasurementCache={cache.current}
                    rowRenderer={rowRenderer}
                    onRowsRendered={onRowsRendered}
                    overscanRowCount={3}
                    ref={(el) => {
                      listRef.current = el;
                      registerList(el);
                    }}
                  />
                </div>
              )}
            </AutoSizer>
          )}
        </InfiniteLoader>
      )}
    </WindowScroller>
  );
};
```

Note: `Spinner` is exported from `../ui/Button` (same import the page uses). If `tsc` flags the `ref`/`registerChild` casts, keep the `as React.Ref<HTMLDivElement>` casts shown.

- [ ] **Step 4: Run tests**

Run: `npx vitest run src/components/dashboard/AnnouncementFeed.test.tsx`
Expected: PASS (3 tests).

- [ ] **Step 5: Typecheck**

Run: `npx tsc --noEmit`
Expected: exit 0.

- [ ] **Step 6: Commit**

```bash
git add src/components/dashboard/AnnouncementFeed.tsx src/components/dashboard/AnnouncementFeed.test.tsx
git commit -m "feat(feed): virtualized infinite AnnouncementFeed"
```

---

### Task 4: Wire AnnouncementFeed into DashboardPage

**Files:**
- Modify: `frontend/src/pages/DashboardPage.tsx`
- Modify: `frontend/src/pages/DashboardPage.test.tsx`

- [ ] **Step 1: Update the page test first**

In `DashboardPage.test.tsx`:

Replace the `AnnouncementCard` mock block with an `AnnouncementFeed` mock:
```tsx
vi.mock('../components/dashboard/AnnouncementFeed', () => ({
  AnnouncementFeed: () => <div data-testid="feed" />,
}));
```
Remove the `announcementService.getAll` mock usage that drove pagination, delete the **"renders announcement cards when data is loaded"**, **"shows empty feed message"**, and **"renders pagination next button"** tests (those behaviors now live in `AnnouncementFeed.test.tsx`). Replace with:
```tsx
it('renders the feed region', async () => {
  renderPage();
  expect(await screen.findByTestId('feed')).toBeInTheDocument();
});
```
Keep the **"renders the create announcement form"** and **"shows user name in sidebar"** tests. `familyService.getAll` and `userService.search` mocks stay.

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/pages/DashboardPage.test.tsx`
Expected: FAIL — `DashboardPage` still imports/renders the old map + pagination; no `feed` testid.

- [ ] **Step 3: Implement DashboardPage changes**

In `DashboardPage.tsx`:
- Remove `useState`, the `page` state, the `["announcements", page]` `useQuery`, and the `Announcement`/`AnnouncementCard` imports.
- Add `import { AnnouncementFeed } from "../components/dashboard/AnnouncementFeed";`.
- Keep `useQueryClient`, `familyData`, `communityMembers`, `handleCreated`, `handleUpdate`.
- Replace the entire `<main>` feed body (the `isLoading ? ... : data?.data.length === 0 ? ... : (<>...pagination...</>)` block, lines ~103-150) with:

```tsx
      <main className="flex flex-col gap-4 min-w-0">
        <CreateAnnouncementForm onCreated={handleCreated} />
        <AnnouncementFeed onUpdate={handleUpdate} />
      </main>
```

`handleCreated` still does `qc.invalidateQueries({ queryKey: ["announcements"] })`, which matches the feed's `["announcements","infinite"]` key. Remove the now-unused `Spinner` import only if nothing else uses it (the sidebars don't — safe to remove).

- [ ] **Step 4: Run the page test**

Run: `npx vitest run src/pages/DashboardPage.test.tsx`
Expected: PASS.

- [ ] **Step 5: Typecheck**

Run: `npx tsc --noEmit`
Expected: exit 0 (no unused-import errors).

- [ ] **Step 6: Commit**

```bash
git add src/pages/DashboardPage.tsx src/pages/DashboardPage.test.tsx
git commit -m "feat(feed): use virtualized AnnouncementFeed on dashboard"
```

---

### Task 5: Full verification

- [ ] **Step 1: Run the whole frontend suite**

Run: `npx vitest run`
Expected: all tests pass.

- [ ] **Step 2: Production build (catches CSS/ESM issues)**

Run: `npm run build`
Expected: build succeeds.

- [ ] **Step 3: Manual smoke (real servers)**

Start backend (`cd backend && npm run dev`) with `SEED_DUMMY_DATA=true` (or many posts), and `cd frontend && npm run dev`. Open `http://localhost:5170/fofa/dashboard` and verify:
- Feed renders posts; scrolling the page loads more (network shows `?page=2`, `page=3`…).
- Expanding comments on a card pushes the cards below down (no overlap) — the `onHeightChange` re-measure.
- Posting a new announcement refreshes the feed.

- [ ] **Step 4: No commit** (verification only)

---

## Self-Review

- **Spec coverage:** infinite loading (Task 3 `useInfiniteQuery`), window scroll (Task 3 `WindowScroller`), CellMeasurer variable height + `onHeightChange` (Tasks 2-3), InfiniteLoader bottom spinner (Task 3), component extraction (Tasks 3-4), testing caveat via mocked primitives (Tasks 3-4), dependency (Task 1). ✓
- **Placeholders:** none — all steps contain concrete code/commands.
- **Type consistency:** `onHeightChange?: () => void` defined in Task 2 and consumed in Task 3; `AnnouncementFeed` prop `onUpdate` defined in Task 3 and passed in Task 4; query key `["announcements","infinite"]` invalidated by the existing `["announcements"]` call.
