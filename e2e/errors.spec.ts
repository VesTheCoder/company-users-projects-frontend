import { expect, test, type Page } from '@playwright/test'
const company = {
  id: 'c',
  name: 'Test company',
  description: null,
  website: null,
  current_role: 'owner',
  version: 1,
}
async function mockSession(page: Page) {
  await page.route('**/api/v1/**', async (route) => {
    const path = new URL(route.request().url()).pathname
    if (path.endsWith('/auth/me'))
      return route.fulfill({
        json: { id: 'u', login: 'user@example.com', display_name: 'Test User' },
      })
    if (path.endsWith('/auth/csrf')) return route.fulfill({ json: { csrf_token: 'test' } })
    if (path.endsWith('/companies'))
      return route.fulfill({ json: { items: [company], next_cursor: null } })
    return route.fulfill({ json: company, headers: { ETag: '"v1"' } })
  })
}
for (const status of [403, 404, 409, 428, 429, 500, 503]) {
  test('renders a safe error for HTTP ' + status, async ({ page }) => {
    await mockSession(page)
    await page.route('**/api/v1/companies?*', (route) =>
      route.fulfill({
        status,
        json: {
          code: 'test_error',
          detail: status >= 500 ? 'PRIVATE DATABASE DETAIL' : 'Operation unavailable',
        },
      }),
    )
    await page.goto('/companies')
    await expect(page.getByRole('alert')).toBeVisible()
    await expect(page.getByText('PRIVATE DATABASE DETAIL')).toHaveCount(0)
    await expect(page.getByRole('button', { name: 'Reload' })).toBeVisible()
  })
}
test('a business 401 discards the session and shows login', async ({ page }) => {
  await mockSession(page)
  await page.route('**/api/v1/companies?*', (route) =>
    route.fulfill({ status: 401, json: { code: 'unauthenticated' } }),
  )
  await page.goto('/companies')
  await expect(page.getByRole('heading', { name: 'Welcome back' })).toBeVisible()
  await expect(page.getByText('Test User')).toHaveCount(0)
})
test('cursor load more and filter reset work in the browser', async ({ page }) => {
  await mockSession(page)
  const cursors: (string | null)[] = []
  await page.route('**/api/v1/companies?*', (route) => {
    const params = new URL(route.request().url()).searchParams
    cursors.push(params.get('cursor'))
    if (params.get('role') === 'viewer')
      return route.fulfill({
        json: {
          items: [{ ...company, id: 'v', name: 'Viewer company', current_role: 'viewer' }],
          next_cursor: null,
        },
      })
    return route.fulfill({
      json: {
        items: [params.has('cursor') ? { ...company, id: 'next', name: 'Next company' } : company],
        next_cursor: params.has('cursor') ? null : 'signed+cursor',
      },
    })
  })
  await page.goto('/companies')
  await page.getByRole('button', { name: 'Load more' }).click()
  await expect(page.getByRole('heading', { name: 'Next company' })).toBeVisible()
  expect(cursors[0]).toBeNull()
  expect(cursors.at(-1)).toBe('signed+cursor')
  await page.getByRole('combobox', { name: 'Your role' }).click()
  await page.getByRole('option', { name: 'viewer', exact: true }).click()
  await expect(page.getByRole('heading', { name: 'Viewer company' })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Next company' })).toHaveCount(0)
  expect(cursors.at(-1)).toBeNull()
})
test('edit keeps draft on 412 and reloads the current version explicitly', async ({ page }) => {
  await mockSession(page)
  let reads = 0
  await page.route('**/api/v1/companies/c', (route) => {
    if (route.request().method() === 'PATCH')
      return route.fulfill({ status: 412, json: { code: 'version_mismatch' } })
    reads++
    return route.fulfill({
      json: { ...company, version: reads },
      headers: { ETag: '"v' + reads + '"' },
    })
  })
  await page.goto('/companies/c')
  await page.getByRole('button', { name: 'Edit company' }).click()
  await page.getByLabel('Company name').fill('My draft')
  await page.getByRole('button', { name: 'Save', exact: true }).click()
  await expect(page.getByRole('alert')).toContainText('changed since you opened')
  await expect(page.getByLabel('Company name')).toHaveValue('My draft')
  await expect(page.getByRole('button', { name: 'Save', exact: true })).toBeDisabled()
  await page.getByRole('button', { name: 'Reload' }).click()
  await expect(page.getByLabel('Company name')).toHaveValue('Test company')
})
test('renders 422 field errors inline', async ({ page }) => {
  await mockSession(page)
  await page.route('**/api/v1/companies', (route) =>
    route.fulfill({
      status: 422,
      json: {
        code: 'validation_error',
        errors: [{ pointer: '/name', code: 'invalid', message: 'Invalid company name' }],
      },
    }),
  )
  await page.goto('/companies')
  await page.getByRole('button', { name: 'Create company' }).click()
  await page.getByLabel('Company name').fill('Name')
  await page.getByRole('button', { name: 'Save', exact: true }).click()
  await expect(page.getByText('Invalid company name')).toBeVisible()
  await expect(page.getByLabel('Company name')).toHaveAttribute('aria-invalid', 'true')
})

test('saving an employee refreshes each loaded page once and keeps rows visible', async ({
  page,
}) => {
  await mockSession(page)
  const employee = {
    id: 'e1',
    company_id: 'c',
    full_name: 'First employee',
    work_email: null,
    work_phone: null,
    job_title: null,
    status: 'active',
    start_date: '2026-01-01',
    end_date: null,
    version: 1,
  }
  let updated = false
  let releaseRefresh!: () => void
  const refreshGate = new Promise<void>((resolve) => {
    releaseRefresh = resolve
  })
  const refreshedCursors: (string | null)[] = []
  await page.route('**/api/v1/companies/c/employees/e1', (route) => {
    if (route.request().method() === 'PATCH') updated = true
    return route.fulfill({
      json: { ...employee, job_title: updated ? 'Engineer' : null },
      headers: { ETag: updated ? '"v2"' : '"v1"' },
    })
  })
  await page.route('**/api/v1/companies/c/employees?*', async (route) => {
    const cursor = new URL(route.request().url()).searchParams.get('cursor')
    if (updated) {
      refreshedCursors.push(cursor)
      await refreshGate
    }
    await route.fulfill({
      json: {
        items: cursor
          ? [{ ...employee, id: 'e2', full_name: 'Second employee' }]
          : [{ ...employee, job_title: updated ? 'Engineer' : null }],
        next_cursor: cursor ? null : updated ? 'fresh-cursor' : 'old-cursor',
      },
    })
  })
  try {
    await page.goto('/companies/c/employees')
    await page.getByRole('button', { name: 'Load more' }).click()
    await expect(page.getByRole('heading', { name: 'Second employee' })).toBeVisible()
    await page.getByRole('button', { name: 'Edit First employee', exact: true }).click()
    await page.getByLabel('Job title').fill('Engineer')
    await page.getByRole('button', { name: 'Save', exact: true }).click()
    await expect(page.getByRole('dialog')).toHaveCount(0)
    await expect.poll(() => refreshedCursors.length).toBe(1)
    await expect(page.getByRole('heading', { name: 'First employee' })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Second employee' })).toBeVisible()
    releaseRefresh()
    await expect(page.getByText('Engineer', { exact: true })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Refresh', exact: true })).toBeEnabled()
    expect(refreshedCursors).toEqual([null, 'fresh-cursor'])
    await expect(page.getByText('2 loaded', { exact: true })).toBeVisible()
  } finally {
    releaseRefresh()
  }
})
