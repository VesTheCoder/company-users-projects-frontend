import { QueryObserver } from '@tanstack/react-query'
import { afterEach, expect, it, vi } from 'vitest'
import { queryClient, refreshCompany } from './query'

afterEach(() => queryClient.clear())

it('refreshes company data without waiting for the companies list or touching another tenant', async () => {
  let resolveList!: (value: string[]) => void
  const companies = new QueryObserver(queryClient, {
    queryKey: ['companies'],
    queryFn: () =>
      new Promise<string[]>((resolve) => {
        resolveList = resolve
      }),
    initialData: ['old company'],
    staleTime: Infinity,
  })
  const detail = new QueryObserver(queryClient, {
    queryKey: ['company', 'c', 'detail'],
    queryFn: vi.fn().mockResolvedValue('new detail'),
    initialData: 'old detail',
    staleTime: Infinity,
  })
  queryClient.setQueryData(['company', 'other', 'detail'], 'other tenant')
  const unsubscribeList = companies.subscribe(() => {})
  const unsubscribeDetail = detail.subscribe(() => {})
  const refreshing = refreshCompany('c')
  try {
    await vi.waitFor(() => expect(detail.getCurrentResult().data).toBe('new detail'))
    expect(companies.getCurrentResult().isFetching).toBe(true)
    expect(queryClient.getQueryState(['company', 'other', 'detail'])?.isInvalidated).toBe(false)
  } finally {
    resolveList(['new company'])
    await refreshing
    unsubscribeList()
    unsubscribeDetail()
  }
})

it('cancels an unfinished pre-mutation request so its late response cannot replace fresh data', async () => {
  let resolveOld!: (value: string[]) => void
  let oldSignal!: AbortSignal
  const fetchEmployees = vi
    .fn()
    .mockImplementationOnce(({ signal }: { signal: AbortSignal }) => {
      oldSignal = signal
      return new Promise<string[]>((resolve) => {
        resolveOld = resolve
      })
    })
    .mockResolvedValue(['updated employee'])
  const employees = new QueryObserver(queryClient, {
    queryKey: ['company', 'c', 'employees', 'active'],
    queryFn: fetchEmployees,
  })
  const unsubscribe = employees.subscribe(() => {})
  try {
    await refreshCompany('c')
    expect(oldSignal.aborted).toBe(true)
    expect(employees.getCurrentResult().data).toEqual(['updated employee'])
    resolveOld(['outdated employee'])
    await Promise.resolve()
    expect(employees.getCurrentResult().data).toEqual(['updated employee'])
    expect(fetchEmployees).toHaveBeenCalledTimes(2)
  } finally {
    unsubscribe()
  }
})
