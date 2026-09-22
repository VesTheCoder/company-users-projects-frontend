import { useSyncExternalStore } from 'react'
import { api } from '../api/client'
import { ApiError } from '../api/errors'
import { queryClient } from '../api/query'
import type { LoginResponse, User } from '../api/types'
type Session = {
  status: 'loading' | 'anonymous' | 'authenticated' | 'error'
  user: User | null
  error?: unknown
}
let session: Session = { status: 'loading', user: null }
const listeners = new Set<() => void>()
function publish(next: Session) {
  session = next
  listeners.forEach((listener) => listener())
}
function clear() {
  api.clearSession()
  void queryClient.cancelQueries()
  queryClient.clear()
  publish({ status: 'anonymous', user: null })
}
api.setUnauthorizedHandler(clear)
function subscribe(listener: () => void) {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}
function getSnapshot() {
  return session
}
export function useSession() {
  return useSyncExternalStore(subscribe, getSnapshot)
}
let restoring: Promise<void> | null = null
export function restoreSession() {
  if (restoring) return restoring
  publish({ status: 'loading', user: null })
  restoring = (async () => {
    try {
      const [user, csrf] = await Promise.all([
        api.request<User>('/auth/me'),
        api.request<{ csrf_token: string }>('/auth/csrf'),
      ])
      api.setCsrfToken(csrf.data.csrf_token)
      publish({ status: 'authenticated', user: user.data })
    } catch (error) {
      if ((error instanceof ApiError && error.status === 401) || session.status === 'anonymous')
        clear()
      else publish({ status: 'error', user: null, error })
    } finally {
      restoring = null
    }
  })()
  return restoring
}
export async function signIn(login: string, password: string) {
  const { data } = await api.request<LoginResponse>('/auth/login', {
    method: 'POST',
    login: true,
    body: { login, password },
  })
  queryClient.clear()
  api.setCsrfToken(data.csrf_token)
  publish({ status: 'authenticated', user: { ...data.user, expires_at: data.expires_at } })
}
export async function signOut() {
  await api.request<void>('/auth/logout', { method: 'POST' })
  clear()
}
