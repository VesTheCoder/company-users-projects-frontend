import { afterEach, describe, expect, it, vi } from 'vitest'
import { ApiClient } from './client'
import { ApiError } from './errors'
import { pagePath } from './resources'
afterEach(() => vi.unstubAllGlobals())
describe('API boundary', () => {
  it('uses cookies, CSRF and the snapshot ETag and accepts 204', async () => {
    const fetcher = vi.fn().mockResolvedValue(new Response(null, { status: 204 }))
    vi.stubGlobal('fetch', fetcher)
    const client = new ApiClient('http://localhost:8080')
    client.setCsrfToken('token')
    expect((await client.request('/companies/1', { method: 'DELETE', etag: '"v3"' })).data).toBeUndefined()
    const options = fetcher.mock.calls[0][1]
    expect(options.credentials).toBe('include')
    expect(options.headers.get('X-CSRF-Token')).toBe('token')
    expect(options.headers.get('If-Match')).toBe('"v3"')
    expect(options.headers.has('Origin')).toBe(false)
  })
  it('uses login protection without an existing token', async () => {
    const fetcher = vi.fn().mockResolvedValue(Response.json({ csrf_token: 'new' }))
    vi.stubGlobal('fetch', fetcher)
    await new ApiClient('').request('/auth/login', { method: 'POST', login: true, body: { login: 'a', password: 'b' } })
    expect(fetcher.mock.calls[0][1].headers.get('X-CSRF-Protection')).toBe('1')
  })
  it('expires the session on 401 and prevents subsequent writes', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(Response.json({ code: 'expired' }, { status: 401 })))
    const client = new ApiClient('')
    const expire = vi.fn()
    client.setCsrfToken('old')
    client.setUnauthorizedHandler(expire)
    await expect(client.request('/auth/me')).rejects.toMatchObject({ status: 401 })
    expect(expire).toHaveBeenCalledOnce()
    await expect(client.request('/companies', { method: 'POST' })).rejects.toMatchObject({ status: 401 })
  })
  it('rejects late responses from an earlier session', async () => {
    let resolve!: (value: Response) => void
    vi.stubGlobal('fetch', vi.fn(() => new Promise<Response>(r => { resolve = r })))
    const client = new ApiClient('')
    const pending = client.request('/companies')
    client.clearSession()
    resolve(Response.json({ items: ['private'] }))
    await expect(pending).rejects.toMatchObject({ name: 'AbortError' })
  })
  it('maps field pointers, keeps conflict guidance and hides server internals', () => {
    expect(new ApiError(422, { errors: [{ pointer: '/work_email', code: 'invalid', message: 'Invalid email' }] }).fields.work_email).toBe('Invalid email')
    expect(new ApiError(412, { detail: 'stale' }).message).toContain('Reload')
    expect(new ApiError(500, { detail: 'database password' }).message).not.toContain('password')
  })
  it('encodes signed cursors and omits empty filters', () => {
    const url = new URL(pagePath('/companies', 'a+b/c=', { role: 'viewer', status: '' }), 'http://localhost')
    expect(url.searchParams.get('cursor')).toBe('a+b/c=')
    expect(url.searchParams.get('role')).toBe('viewer')
    expect(url.searchParams.has('status')).toBe(false)
  })
})
