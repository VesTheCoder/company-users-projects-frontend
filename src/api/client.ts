import { ApiError, type Problem } from './errors'
import type { Snapshot } from './types'

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE'
  body?: unknown
  etag?: string | null
  signal?: AbortSignal
  login?: boolean
}
export class ApiClient {
  private csrfToken: string | null = null
  private onUnauthorized: () => void = () => {}
  private generation = 0
  private baseUrl: string
  constructor(baseUrl: string) { this.baseUrl = baseUrl }
  setUnauthorizedHandler(handler: () => void) { this.onUnauthorized = handler }
  setCsrfToken(token: string) { this.csrfToken = token }
  clearSession() { this.csrfToken = null; this.generation++ }
  async request<T>(path: string, options: RequestOptions = {}): Promise<Snapshot<T>> {
    const { method = 'GET', body, signal, etag, login } = options
    const generation = this.generation
    const headers = new Headers({ Accept: 'application/json' })
    if (body !== undefined) headers.set('Content-Type', 'application/json')
    if (login) headers.set('X-CSRF-Protection', '1')
    else if (method !== 'GET') {
      if (!this.csrfToken) throw new ApiError(401)
      headers.set('X-CSRF-Token', this.csrfToken)
    }
    if (etag) headers.set('If-Match', etag)
    let response: Response
    try {
      response = await fetch(this.baseUrl + '/api/v1' + path, {
        method, headers, credentials: 'include', signal,
        body: body === undefined ? undefined : JSON.stringify(body),
      })
    } catch (error) {
      if (signal?.aborted) throw error
      throw new Error('Unable to reach the server. Check your connection and try again.', { cause: error })
    }
    if (generation !== this.generation) throw new DOMException('Session changed', 'AbortError')
    if (!response.ok) {
      const problem: Problem = await response.json().catch(() => ({}))
      if (response.status === 401 && !login) {
        this.clearSession()
        this.onUnauthorized()
      }
      throw new ApiError(response.status, problem, response.headers.get('Retry-After'))
    }
    return { data: response.status === 204 ? undefined as T : await response.json() as T, etag: response.headers.get('ETag') }
  }
}
export const api = new ApiClient(import.meta.env.VITE_API_BASE_URL)
