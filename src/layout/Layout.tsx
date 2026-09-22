import { Link, Navigate, Outlet, useLocation } from 'react-router-dom'
import { useMutation } from '@tanstack/react-query'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Container from '@mui/material/Container'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import { signOut, useSession } from '../auth/session'
import { ErrorNotice } from '../shared/Feedback'
export default function Layout() {
  const { user } = useSession()
  const location = useLocation()
  const logout = useMutation({ mutationFn: signOut })
  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname }} />
  return (
    <>
      <Box component="header" sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Container maxWidth="lg">
          <Stack direction="row" spacing={2} sx={{ alignItems: 'center', minHeight: 80, py: 2 }}>
            <Typography
              component={Link}
              to="/companies"
              sx={{
                color: 'text.primary',
                textDecoration: 'none',
                fontWeight: 750,
                fontSize: { xs: 15, sm: 19 },
                flex: 1,
              }}
            >
              Company Management
            </Typography>
            <Box sx={{ minWidth: 0, maxWidth: { xs: 110, sm: 280 }, textAlign: 'right' }}>
              <Typography noWrap variant="body2" title={user.display_name}>
                {user.display_name}
              </Typography>
              <Typography noWrap variant="caption" color="text.secondary" title={user.login}>
                {user.login}
              </Typography>
            </Box>
            <Button variant="outlined" loading={logout.isPending} onClick={() => logout.mutate()}>
              Sign out
            </Button>
          </Stack>
        </Container>
      </Box>
      <Container
        component="main"
        id="main"
        maxWidth="lg"
        sx={{ py: { xs: 3, md: 5 }, minWidth: 0 }}
      >
        <ErrorNotice error={logout.error} />
        <Outlet />
      </Container>
    </>
  )
}
