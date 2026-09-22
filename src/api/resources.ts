import { api } from './client'
import type { Access, Assignment, Company, CompanyInput, Employee, EmployeeInput, Page, Project, ProjectInput, Role, Snapshot } from './types'
export function pagePath(path: string, cursor?: string | null, filter?: Record<string, string>) {
  const params = new URLSearchParams({ limit: '25' })
  if (cursor) params.set('cursor', cursor)
  for (const [key, value] of Object.entries(filter ?? {})) if (value) params.set(key, value)
  return path + '?' + params.toString()
}
function resource<T, Input>(path: string) {
  return {
    path,
    list: (cursor?: string | null, filter?: Record<string, string>, signal?: AbortSignal) =>
      api.request<Page<T>>(pagePath(path, cursor, filter), { signal }).then(r => r.data),
    get: (id: string, signal?: AbortSignal) => api.request<T>(path + '/' + id, { signal }),
    create: (body: Input) => api.request<T>(path, { method: 'POST', body }),
    update: (id: string, body: Input, snapshot: Snapshot<T>) =>
      api.request<T>(path + '/' + id, { method: 'PATCH', body, etag: snapshot.etag }),
    remove: (id: string, snapshot: Snapshot<T>) =>
      api.request<void>(path + '/' + id, { method: 'DELETE', etag: snapshot.etag }),
  }
}
export const companies = resource<Company, CompanyInput>('/companies')
export const employees = (companyId: string) => resource<Employee, EmployeeInput>('/companies/' + companyId + '/employees')
export const projects = (companyId: string) => resource<Project, ProjectInput>('/companies/' + companyId + '/projects')
export const access = (companyId: string) => {
  const path = '/companies/' + companyId + '/access'
  return {
    path,
    list: (cursor?: string | null, signal?: AbortSignal) => api.request<Page<Access>>(pagePath(path, cursor), { signal }).then(r => r.data),
    grant: (body: { user_id: string; role: Exclude<Role, 'owner'> }) => api.request<Access>(path, { method: 'POST', body }),
    update: (userId: string, role: Exclude<Role, 'owner'>) => api.request<Access>(path + '/' + userId, { method: 'PATCH', body: { role } }),
    remove: (userId: string) => api.request<void>(path + '/' + userId, { method: 'DELETE' }),
    transfer: (body: { new_owner_user_id: string; previous_owner_role: Exclude<Role, 'owner'> }) =>
      api.request<Access[]>('/companies/' + companyId + '/ownership-transfer', { method: 'POST', body }),
  }
}
export const assignments = (companyId: string, projectId: string) => {
  const path = projects(companyId).path + '/' + projectId + '/employees'
  return {
    path,
    list: (cursor?: string | null, signal?: AbortSignal) => api.request<Page<Assignment>>(pagePath(path, cursor), { signal }).then(r => r.data),
    assign: (employeeId: string) => api.request<Assignment>(path + '/' + employeeId, { method: 'PUT' }),
    remove: (employeeId: string) => api.request<void>(path + '/' + employeeId, { method: 'DELETE' }),
  }
}
