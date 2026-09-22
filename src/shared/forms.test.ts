import { describe, expect, it } from 'vitest'
import { canAssign, payload, projectStatuses, validateDates } from './forms'
describe('domain form contracts', () => {
  it('preserves terminal states and prevents backward project transitions', () => {
    expect(projectStatuses('active')).toEqual(['active', 'completed', 'cancelled'])
    expect(projectStatuses('completed')).toEqual(['completed'])
    expect(canAssign('cancelled')).toBe(false)
  })
  it('requires an end date only for terminated employees', () => {
    expect(
      validateDates({
        full_name: 'A',
        status: 'terminated',
        start_date: '2026-01-01',
        end_date: '',
      }),
    ).toHaveProperty('end_date')
    expect(
      validateDates({
        full_name: 'A',
        status: 'active',
        start_date: '2026-01-01',
        end_date: '2026-02-01',
      }),
    ).toHaveProperty('end_date')
    expect(
      validateDates({
        full_name: 'A',
        status: 'terminated',
        start_date: '2026-01-01',
        end_date: '2026-02-01',
      }),
    ).toEqual({})
  })
  it('rejects reversed or incomplete project dates', () => {
    expect(validateDates({ start_date: '', end_date: '2026-01-01' })).toHaveProperty('end_date')
    expect(validateDates({ start_date: '2026-02-01', end_date: '2026-01-01' })).toHaveProperty(
      'end_date',
    )
  })
  it('sends cleared optional fields as null', () => {
    expect(payload({ name: ' Company ', description: '' })).toEqual({
      name: 'Company',
      description: null,
    })
  })
})
