import { useState } from 'react'
import Snackbar from '@mui/material/Snackbar'
import Alert from '@mui/material/Alert'
import { NotifyContext } from './notification'
export function NotifyProvider({ children }: { children: React.ReactNode }) {
  const [message, setMessage] = useState('')
  return (
    <NotifyContext value={setMessage}>
      {children}
      <Snackbar open={!!message} autoHideDuration={5000} onClose={() => setMessage('')}>
        <Alert severity="success" onClose={() => setMessage('')}>
          {message}
        </Alert>
      </Snackbar>
    </NotifyContext>
  )
}
