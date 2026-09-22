import { useState } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Paper from '@mui/material/Paper'
import Stack from '@mui/material/Stack'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import { useMutation } from '@tanstack/react-query'
import { ApiError } from '../api/errors'
import { ErrorNotice } from '../shared/Feedback'
import { signIn, useSession } from './session'
export default function LoginPage() {
  const session = useSession()
  const location = useLocation()
  const [login, setLogin] = useState('')
  const [password, setPassword] = useState('')
  const mutation = useMutation({ mutationFn: () => signIn(login, password) })
  const from = location.state?.from
  if (session.user) return <Navigate replace to={typeof from === 'string' && from.startsWith('/companies') ? from : '/companies'} />
  const fields = mutation.error instanceof ApiError ? mutation.error.fields : {}
  return <Box sx={{ minHeight: '100dvh', display: 'grid', placeItems: 'center', p: 2 }}>
    <Paper variant="outlined" sx={{ p: { xs: 3, sm: 5 }, width: '100%', maxWidth: 440 }}>
      <Typography variant="overline" color="text.secondary">COMPANY MANAGEMENT</Typography>
      <Typography variant="h4" component="h1" sx={{ mt: 1, mb: 1 }}>Welcome back</Typography>
      <Typography color="text.secondary" sx={{ mb: 4 }}>Sign in to your workspace.</Typography>
      <Stack component="form" spacing={2} onSubmit={event => { event.preventDefault(); if (!mutation.isPending) mutation.mutate() }}>
        <ErrorNotice error={mutation.error} />
        <TextField label="Email" type="email" autoComplete="username" required value={login} onChange={e => setLogin(e.target.value)} disabled={mutation.isPending} error={!!fields.login} helperText={fields.login || ' '} slotProps={{ htmlInput: { maxLength: 254 } }} />
        <TextField label="Password" type="password" autoComplete="current-password" required value={password} onChange={e => setPassword(e.target.value)} disabled={mutation.isPending} error={!!fields.password} helperText={fields.password || ' '} slotProps={{ htmlInput: { maxLength: 1024 } }} />
        <Button type="submit" variant="contained" loading={mutation.isPending} size="large">Sign in</Button>
      </Stack>
    </Paper>
  </Box>
}
