interface FieldError {
  pointer: string
  code: string
  message: string
}
export interface Problem {
  detail?: string
  code?: string
  errors?: FieldError[]
}
const messages: Record<number, string> = {
  401: 'Your session has expired. Please sign in again.',
  403: 'You do not have permission to perform this action.',
  404: 'This resource no longer exists or is unavailable.',
  409: 'This operation conflicts with the current data.',
  412: 'This resource changed since you opened it. Reload the latest data before trying again.',
  422: 'Please check the highlighted fields.',
  428: 'The resource version is missing. Reload the latest data.',
  429: 'Too many requests. Please wait before trying again.',
  503: 'The service is temporarily unavailable. Please try again shortly.',
}
export class ApiError extends Error {
  status: number
  code?: string
  fields: Record<string, string>
  retryAfter: string | null
  constructor(status: number, problem: Problem = {}, retryAfter: string | null = null) {
    const generic = messages[status] ?? 'Something went wrong. Please try again.'
    super(status >= 500 || status === 412 || status === 428 ? generic : problem.detail || generic)
    this.name = 'ApiError'
    this.status = status
    this.code = problem.code
    this.fields = Object.fromEntries(
      (problem.errors ?? []).map((e) => [e.pointer.split('/')[1] || '_form', e.message]),
    )
    this.retryAfter = retryAfter
  }
}
export function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : 'Something went wrong. Please try again.'
}
