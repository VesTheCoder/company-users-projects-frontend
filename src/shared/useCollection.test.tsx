import { renderHook, waitFor, act } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { expect, it, vi } from 'vitest'
import { useCollection } from './useCollection'
it('loads cursor pages and isolates results when the tenant/filter changes', async () => {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  const list = vi.fn().mockResolvedValueOnce({ items: ['first'], next_cursor: 'signed' }).mockResolvedValueOnce({ items: ['second'], next_cursor: null }).mockResolvedValueOnce({ items: ['other'], next_cursor: null })
  const { result, rerender } = renderHook(({ key }) => useCollection([key], list), {
    initialProps: { key: 'company-a-active' },
    wrapper: ({ children }) => <QueryClientProvider client={client}>{children}</QueryClientProvider>,
  })
  await waitFor(() => expect(result.current.items).toEqual(['first']))
  act(() => result.current.props.loadMore())
  await waitFor(() => expect(result.current.items).toEqual(['first', 'second']))
  expect(list.mock.calls[1][0]).toBe('signed')
  rerender({ key: 'company-b-active' })
  expect(result.current.items).toEqual([])
  await waitFor(() => expect(result.current.items).toEqual(['other']))
  expect(list.mock.calls[2][0]).toBeNull()
})
