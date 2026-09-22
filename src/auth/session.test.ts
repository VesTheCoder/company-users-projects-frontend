import { expect, it, vi } from 'vitest'
import { api } from '../api/client'
import { queryClient } from '../api/query'
import { restoreSession, signIn, signOut } from './session'
it('restores CSRF in memory, signs in and clears cached tenant data on logout', async () => {
  const request = vi.spyOn(api, 'request')
  const token = vi.spyOn(api, 'setCsrfToken')
  request
    .mockResolvedValueOnce({ data: { id: 'u', display_name: 'Owner' }, etag: null })
    .mockResolvedValueOnce({ data: { csrf_token: 'restored' }, etag: null })
  await restoreSession()
  expect(token).toHaveBeenCalledWith('restored')
  request.mockResolvedValueOnce({
    data: { user: { id: 'u' }, expires_at: 'tomorrow', csrf_token: 'login' },
    etag: null,
  })
  await signIn('owner@example.com', 'password')
  expect(request).toHaveBeenLastCalledWith(
    '/auth/login',
    expect.objectContaining({ login: true, method: 'POST' }),
  )
  queryClient.setQueryData(['companies'], ['private'])
  request.mockResolvedValueOnce({ data: undefined, etag: null })
  await signOut()
  expect(queryClient.getQueryData(['companies'])).toBeUndefined()
})
