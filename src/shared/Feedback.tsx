import Alert from '@mui/material/Alert'
import Button from '@mui/material/Button'
import LinearProgress from '@mui/material/LinearProgress'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import { ApiError, errorMessage } from '../api/errors'
export function ErrorNotice({ error, retry }: { error: unknown; retry?: () => void }) {
  if (!error) return null
  return (
    <Alert
      severity="error"
      action={
        retry ? (
          <Button color="inherit" onClick={retry}>
            Reload
          </Button>
        ) : undefined
      }
    >
      {errorMessage(error)}
      {error instanceof ApiError && error.status === 429 && error.retryAfter
        ? ' Retry after ' + error.retryAfter + ' seconds.'
        : ''}
    </Alert>
  )
}
export function Loading({ label = 'Loading data…' }: { label?: string }) {
  return (
    <Box role="status" sx={{ minHeight: 180, py: 4 }}>
      <Typography sx={{ mb: 2 }}>{label}</Typography>
      <LinearProgress />
    </Box>
  )
}
export function Empty({ children }: { children: React.ReactNode }) {
  return (
    <Box
      sx={{
        border: 1,
        borderColor: 'divider',
        p: 5,
        textAlign: 'center',
        minHeight: 180,
        display: 'grid',
        placeItems: 'center',
      }}
    >
      <Typography color="text.secondary">{children}</Typography>
    </Box>
  )
}
