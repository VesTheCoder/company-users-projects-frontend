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
export default function App() {
  const session = useSession()
  return <ThemeProvider theme={theme}><CssBaseline /><QueryClientProvider client={queryClient}><NotifyProvider>
    {session.status === 'loading' ? <Container><Loading label="Restoring your session…" /></Container> : session.status === 'error' ? <Container sx={{ py: 5 }}><ErrorNotice error={session.error} /><Button onClick={() => void restoreSession()}>Retry connection</Button></Container> :
      <BrowserRouter><Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route element={<Layout />}><Route path="/companies" element={<p>Your companies will appear here.</p>} /></Route>
        <Route path="*" element={<Navigate to="/companies" replace />} />
      </Routes></BrowserRouter>}
  </NotifyProvider></QueryClientProvider></ThemeProvider>
}
