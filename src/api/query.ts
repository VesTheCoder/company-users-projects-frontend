import { QueryClient } from '@tanstack/react-query'
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: false, staleTime: 15_000, refetchOnWindowFocus: true },
    mutations: { retry: false },
  },
})
export async function refreshCompany(companyId?: string) {
  const refreshes = [queryClient.resetQueries({ queryKey: ['companies'] })]
  if (companyId) {
    await queryClient.cancelQueries({ queryKey: ['company', companyId] })
    refreshes.push(queryClient.invalidateQueries({ queryKey: ['company', companyId] }))
  }
  await Promise.all(refreshes)
}
