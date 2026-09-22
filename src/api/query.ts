import { QueryClient } from '@tanstack/react-query'
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: false, staleTime: 15_000, refetchOnWindowFocus: true },
    mutations: { retry: false },
  },
})
export async function refreshCompany(companyId?: string) {
  await queryClient.cancelQueries({ queryKey: ['companies'] })
  await queryClient.resetQueries({ queryKey: ['companies'] })
  if (companyId) {
    await queryClient.cancelQueries({ queryKey: ['company', companyId] })
    await queryClient.invalidateQueries({ queryKey: ['company', companyId] })
  }
}
