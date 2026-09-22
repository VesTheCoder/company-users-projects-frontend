import { expect, it, vi } from 'vitest'
import { act, renderHook } from '@testing-library/react'
import { api } from '../api/client'
import { queryClient } from '../api/query'
import { restoreSession, signIn, signOut, useSession } from './session'
it('restores CSRF in memory, signs in and clears cached tenant data on logout', async () => {
  const { result, rerender } = renderHook(useSession)
  const request = vi.spyOn(api, 'request')
  const token = vi.spyOn(api, 'setCsrfToken')
  request
    .mockResolvedValueOnce({ data: { id: 'u', display_name: 'Owner' }, etag: null })
    .mockResolvedValueOnce({ data: { csrf_token: 'restored' }, etag: null })
  await act(() => restoreSession())
  expect(token).toHaveBeenCalledWith('restored')
  expect(result.current.user?.display_name).toBe('Owner')
  rerender()
  request.mockResolvedValueOnce({
    data: { user: { id: 'u' }, expires_at: 'tomorrow', csrf_token: 'login' },
    etag: null,
  })
  await act(() => signIn('owner@example.com', 'password'))
  expect(result.current.status).toBe('authenticated')
  expect(request).toHaveBeenLastCalledWith(
    '/auth/login',
    expect.objectContaining({ login: true, method: 'POST' }),
  )
  queryClient.setQueryData(['companies'], ['private'])
  request.mockResolvedValueOnce({ data: undefined, etag: null })
  await act(() => signOut())
  expect(queryClient.getQueryData(['companies'])).toBeUndefined()
  expect(result.current.user).toBeNull()
  expect(result.current.status).toBe('anonymous')
})
