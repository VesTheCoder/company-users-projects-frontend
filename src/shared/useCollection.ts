import { useInfiniteQuery, useQueryClient, type QueryKey } from '@tanstack/react-query'
import type { Page } from '../api/types'
export function useCollection<T>(
  key: QueryKey,
  list: (cursor: string | null, signal: AbortSignal) => Promise<Page<T>>,
) {
  const client = useQueryClient()
  const query = useInfiniteQuery({
    queryKey: key,
    initialPageParam: null as string | null,
    queryFn: ({ pageParam, signal }) => list(pageParam, signal),
    getNextPageParam: (page) => page.next_cursor ?? undefined,
    gcTime: 0,
  })
  const items = query.data?.pages.flatMap((page) => page.items) ?? []
  return {
    items,
    props: {
      pending: query.isPending,
      error: query.error,
      count: items.length,
      fetching: query.isFetching,
      hasNext: query.hasNextPage,
      loadMore: () => {
        if (!query.isFetching) void query.fetchNextPage()
      },
      reload: () => {
        void client.resetQueries({ queryKey: key, exact: true })
      },
    },
  }
}
