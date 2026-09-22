import { expect, it, vi } from 'vitest'
import { api } from './client'
import { access, assignments, employees } from './resources'
it('scopes assignments by company and project and uses idempotent PUT', async () => {
  const request = vi.spyOn(api, 'request').mockResolvedValue({ data: undefined, etag: null })
  await assignments('company', 'project').assign('employee')
  expect(request).toHaveBeenCalledWith('/companies/company/projects/project/employees/employee', { method: 'PUT' })
  await assignments('company', 'project').remove('employee')
  expect(request).toHaveBeenLastCalledWith('/companies/company/projects/project/employees/employee', { method: 'DELETE' })
})
it('transfers ownership using both backend fields without a resource ETag', async () => {
  const request = vi.spyOn(api, 'request').mockResolvedValue({ data: [], etag: null })
  await access('c').transfer({ new_owner_user_id: 'u', previous_owner_role: 'viewer' })
  expect(request).toHaveBeenCalledWith('/companies/c/ownership-transfer', { method: 'POST', body: { new_owner_user_id: 'u', previous_owner_role: 'viewer' } })
})
it('uses the ETag returned for the exact employee snapshot', async () => {
  const request = vi.spyOn(api, 'request').mockResolvedValue({ data: undefined, etag: null })
  const snapshot = { data: { id: 'e' }, etag: '"v7"' }
  await employees('c').remove('e', snapshot as Parameters<ReturnType<typeof employees>['remove']>[1])
  expect(request).toHaveBeenCalledWith('/companies/c/employees/e', { method: 'DELETE', etag: '"v7"' })
})
