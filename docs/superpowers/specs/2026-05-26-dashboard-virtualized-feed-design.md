# Design: Virtualized Infinite Announcement Feed on /dashboard

**Date:** 2026-05-26
**Status:** Approved (pending spec review)
**Area:** `frontend/` — `DashboardPage` announcement feed

## Goal

Render the `/dashboard` announcement feed with `react-virtualized`
(`bvaughn/react-virtualized`) so the feed scrolls smoothly over a large,
continuously-loaded list of posts instead of the current 20-per-page
prev/next pagination.

## Decisions (settled during brainstorming)

1. **Loading model: infinite scroll.** Replace server prev/next pagination with
   `useInfiniteQuery`, appending pages into one continuous list. This is what
   makes virtualization worthwhile.
2. **Scroll model: window scroll.** Use `WindowScroller` so the whole page
   scrolls naturally and the 3-column layout + sidebars are preserved (no inner
   scrollbar).
3. **Library: `react-virtualized`** (as requested), despite `react-window` being
   the lighter modern successor.

## Architecture

### Data layer (React Query)
- Replace the `useState(page)` + `["announcements", page]` `useQuery` with
  **`useInfiniteQuery`** keyed `["announcements","infinite"]`.
- `queryFn: ({ pageParam = 1 }) => announcementService.getAll(pageParam)`.
- `getNextPageParam: (last) => last.pagination.page < last.pagination.pages ? last.pagination.page + 1 : undefined`.
- Flatten: `const posts = data?.pages.flatMap(p => p.data) ?? []`.
- Mutations (`onCreated`, `onUpdate`) invalidate `["announcements"]` (covers the
  infinite key) — unchanged behavior.

### Virtualization (react-virtualized)
Composition: `WindowScroller` → `AutoSizer` (width only) → `InfiniteLoader` →
`List`, with each row wrapped in `CellMeasurer`.
- **`CellMeasurerCache`** (`fixedWidth: true`, dynamic height) measures each
  `AnnouncementCard`'s real height.
- **`InfiniteLoader`**: `isRowLoaded = index < posts.length`;
  `loadMoreRows = () => hasNextPage && fetchNextPage()`;
  `rowCount = hasNextPage ? posts.length + 1 : posts.length` (the extra slot
  renders a bottom spinner while `isFetchingNextPage`).
- `rowRenderer` renders `AnnouncementCard` inside `CellMeasurer`, keyed by
  `posts[index].id`.

### Variable / dynamic height (the hard part)
`AnnouncementCard` height varies (content length, optional media) and changes at
runtime when comments expand or a reaction toggles. Handling:
- `CellMeasurer` passes a `measure` function to its child; `AnnouncementCard`
  accepts an optional `onHeightChange` (or receives `measure`) and calls it after
  any layout-changing toggle (comments open/close, reaction count change, media
  load).
- The feed clears the affected row from the cache and recomputes:
  `cache.clear(index, 0); listRef.recomputeRowHeights(index)`.
- Images call `measure` on `onLoad` so late-loading media doesn't overlap rows.

### Component structure
- Extract the feed into **`frontend/src/components/dashboard/AnnouncementFeed.tsx`**
  — owns the infinite query, the cache, and the virtualized list.
- `DashboardPage` becomes a layout shell that renders `<CreateAnnouncementForm>`
  (not virtualized) above `<AnnouncementFeed>`; sidebars unchanged.
- Preserve existing empty state ("The feed is quiet") and initial loading spinner.

## Files

| File | Change |
|---|---|
| `frontend/package.json` | add `react-virtualized` + `@types/react-virtualized` |
| `frontend/src/components/dashboard/AnnouncementFeed.tsx` | new — infinite query + virtualized list |
| `frontend/src/pages/DashboardPage.tsx` | drop pagination/`useQuery`; render `AnnouncementFeed` |
| `frontend/src/components/announcements/AnnouncementCard.tsx` | accept optional `onHeightChange`; call after comment/reaction/media changes |
| `frontend/src/pages/DashboardPage.test.tsx` | adjust for virtualization (see Testing) |
| `frontend/src/components/dashboard/AnnouncementFeed.test.tsx` | new — feed behavior |

## Testing

`react-virtualized` renders zero rows in jsdom (elements have 0 height), so
straight RTL "find all cards" assertions break.
- Test the **data behavior** of `AnnouncementFeed` (pages flatten, next page
  fetched when `loadMoreRows` fires, empty state) by mocking the service and the
  virtualization primitives, or by stubbing `WindowScroller`/`AutoSizer` to supply
  fixed dimensions so rows render.
- Keep a `DashboardPage` smoke test (renders form + feed region) with the
  virtualization primitives mocked.
- Mock at the service boundary (existing pattern), not React Query internals.

## Risks / trade-offs

- **`CellMeasurer` + dynamically-expanding rows** is react-virtualized's known
  rough edge; expect height-jump tuning around comment expansion.
- **Bundle size**: `react-virtualized` is large; accepted per the explicit request.
- **Scroll restoration / `scrollToIndex`** on refetch is out of scope.

## Out of scope

- Replacing other paginated lists (community, messages).
- Switching to `react-window`.
- Scroll-position restoration across navigation.
