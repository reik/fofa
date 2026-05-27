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
    queryFn: ({ pageParam }) => announcementService.getAll(pageParam as number),
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
    // index < posts.length is guaranteed by the guard above
    const ann = posts[index] as Announcement;
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
