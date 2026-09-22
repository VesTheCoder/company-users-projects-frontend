import type { ProjectStatus } from '../api/types'
export type Values = Record<string, string>
export interface Field {
  name: string
  label: string
  required?: boolean
  type?: string
  maxLength?: number
  multiline?: boolean
  options?: readonly string[]
  hint?: string
  pattern?: string
}
export const companyFields: Field[] = [
  { name: 'name', label: 'Company name', required: true, maxLength: 200 },
  { name: 'description', label: 'Description', multiline: true, maxLength: 5000 },
  {
    name: 'website',
    label: 'Website',
    type: 'url',
    maxLength: 2048,
    hint: 'Use a full http:// or https:// address.',
  },
]
export const employeeFields: Field[] = [
  { name: 'full_name', label: 'Full name', required: true, maxLength: 200 },
  { name: 'work_email', label: 'Work email', type: 'email', maxLength: 254 },
  {
    name: 'work_phone',
    label: 'Work phone',
    pattern: '^\\+[1-9][0-9]{1,14}$',
    hint: 'International format, e.g. +351912345678.',
  },
  { name: 'job_title', label: 'Job title', maxLength: 120 },
  { name: 'status', label: 'Status', required: true, options: ['active', 'leave', 'terminated'] },
  { name: 'start_date', label: 'Start date', type: 'date', required: true },
  {
    name: 'end_date',
    label: 'End date',
    type: 'date',
    hint: 'Required only for terminated employees.',
  },
]
export function projectStatuses(current?: ProjectStatus): readonly ProjectStatus[] {
  if (!current) return ['planned', 'active', 'completed', 'cancelled']
  return {
    planned: ['planned', 'active', 'cancelled'],
    active: ['active', 'completed', 'cancelled'],
    completed: ['completed'],
    cancelled: ['cancelled'],
  }[current] as ProjectStatus[]
}
export function projectFields(status?: ProjectStatus): Field[] {
  return [
    { name: 'name', label: 'Project name', required: true, maxLength: 200 },
    { name: 'description', label: 'Description', multiline: true, maxLength: 5000 },
    { name: 'status', label: 'Status', required: true, options: projectStatuses(status) },
    { name: 'start_date', label: 'Start date', type: 'date' },
    { name: 'end_date', label: 'End date', type: 'date' },
  ]
}
export function initialValues(fields: Field[], data?: object): Values {
  const source = (data ?? {}) as Record<string, unknown>
  return Object.fromEntries(
    fields.map((field) => [field.name, String(source[field.name] ?? field.options?.[0] ?? '')]),
  )
}
export function payload<T>(values: Values): T {
  return Object.fromEntries(
    Object.entries(values).map(([key, value]) => [key, value.trim() || null]),
  ) as T
}
export function validateDates(values: Values) {
  const errors: Record<string, string> = {}
  if (values.end_date && (!values.start_date || values.end_date < values.start_date))
    errors.end_date = 'End date requires an earlier or equal start date.'
  if ('full_name' in values) {
    if (values.status === 'terminated' && !values.end_date)
      errors.end_date = 'Terminated employees require an end date.'
    if (values.status !== 'terminated' && values.end_date)
      errors.end_date = 'Only terminated employees can have an end date.'
  }
  return errors
}
export function canAssign(status: ProjectStatus) {
  return status === 'planned' || status === 'active'
}
