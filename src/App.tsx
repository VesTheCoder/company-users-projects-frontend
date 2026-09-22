import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { QueryClientProvider } from '@tanstack/react-query'
import { ThemeProvider } from '@mui/material/styles'
import CssBaseline from '@mui/material/CssBaseline'
import Button from '@mui/material/Button'
import Container from '@mui/material/Container'
import { queryClient } from './api/query'
import { restoreSession, useSession } from './auth/session'
import LoginPage from './auth/LoginPage'
import Layout from './layout/Layout'
import { theme } from './layout/theme'
import { ErrorNotice, Loading } from './shared/Feedback'
import { NotifyProvider } from './shared/Notify'
import { lazy, Suspense } from 'react'
const CompaniesPage = lazy(() => import('./companies/CompaniesPage'))
const CompanyLayout = lazy(() => import('./companies/CompanyLayout'))
const CompanyOverview = lazy(() => import('./companies/CompanyOverview'))
const EmployeesPage = lazy(() => import('./employees/EmployeesPage'))
const ProjectsPage = lazy(() => import('./projects/ProjectsPage'))
const ProjectPage = lazy(() => import('./projects/ProjectPage'))
const AccessPage = lazy(() => import('./companies/AccessPage'))
export default function App() {
  const session = useSession()
  return <ThemeProvider theme={theme}><CssBaseline /><QueryClientProvider client={queryClient}><NotifyProvider>
    {session.status === 'loading' ? <Container><Loading label="Restoring your session…" /></Container> : session.status === 'error' ? <Container sx={{ py: 5 }}><ErrorNotice error={session.error} /><Button onClick={() => void restoreSession()}>Retry connection</Button></Container> :
      <BrowserRouter><Suspense fallback={<Container><Loading /></Container>}><Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route element={<Layout />}>
          <Route path="/companies" element={<CompaniesPage />} />
          <Route path="/companies/:companyId" element={<CompanyLayout />}>
            <Route index element={<CompanyOverview />} />
            <Route path="employees" element={<EmployeesPage />} />
            <Route path="projects" element={<ProjectsPage />} />
            <Route path="projects/:projectId" element={<ProjectPage />} />
            <Route path="access" element={<AccessPage />} />
          </Route>
        </Route>
        <Route path="*" element={<Navigate to="/companies" replace />} />
      </Routes></Suspense></BrowserRouter>}
  </NotifyProvider></QueryClientProvider></ThemeProvider>
}
