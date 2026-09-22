import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { expect, it, vi } from 'vitest'
import { ApiError } from '../api/errors'
import FormDialog from './FormDialog'
import { companyFields } from './forms'
function show(onSubmit: () => Promise<unknown>, onReload = vi.fn()) {
  render(<QueryClientProvider client={new QueryClient({ defaultOptions: { mutations: { retry: false } } })}>
    <FormDialog title="Edit company" fields={companyFields} initial={{ name: 'Company' }} onSubmit={onSubmit} onReload={onReload} onClose={vi.fn()} onSuccess={vi.fn()} />
  </QueryClientProvider>)
}
it('shows server field errors next to their input without discarding the draft', async () => {
  show(vi.fn().mockRejectedValue(new ApiError(422, { errors: [{ pointer: '/name', message: 'Name already used', code: 'invalid' }] })))
  await userEvent.click(screen.getByRole('button', { name: 'Save' }))
  expect(await screen.findByText('Name already used')).toBeVisible()
  expect(screen.getByRole('textbox', { name: /Company name/ })).toHaveValue('Company')
  expect(screen.getByRole('textbox', { name: /Company name/ })).toHaveAttribute('aria-invalid', 'true')
})
it('requires explicit reload after a concurrent edit', async () => {
  const reload = vi.fn()
  const submit = vi.fn().mockRejectedValue(new ApiError(412))
  show(submit, reload)
  await userEvent.click(screen.getByRole('button', { name: 'Save' }))
  await waitFor(() => expect(screen.getByRole('button', { name: 'Save' })).toBeDisabled())
  expect(screen.getByRole('textbox', { name: /Company name/ })).toHaveValue('Company')
  await userEvent.click(screen.getByRole('button', { name: 'Reload' }))
  expect(reload).toHaveBeenCalledOnce()
  expect(submit).toHaveBeenCalledOnce()
})
