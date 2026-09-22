import { useId } from 'react'
import { useMutation } from '@tanstack/react-query'
import Button from '@mui/material/Button'
import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import DialogContentText from '@mui/material/DialogContentText'
import DialogActions from '@mui/material/DialogActions'
import { ApiError } from '../api/errors'
import { ErrorNotice } from './Feedback'
export default function ConfirmDialog({
  title,
  description,
  action,
  onClose,
  onSuccess,
  onReload,
}: {
  title: string
  description: string
  action: () => Promise<unknown>
  onClose: () => void
  onSuccess: () => void
  onReload?: () => void
}) {
  const id = useId()
  const mutation = useMutation({ mutationFn: action, onSuccess })
  const stale = mutation.error instanceof ApiError && [412, 428].includes(mutation.error.status)
  return (
    <Dialog open onClose={mutation.isPending ? undefined : onClose} aria-labelledby={id}>
      <DialogTitle id={id}>{title}</DialogTitle>
      <DialogContent>
        <DialogContentText sx={{ overflowWrap: 'anywhere', mb: 2 }}>
          {description}
        </DialogContentText>
        <ErrorNotice error={mutation.error} retry={stale ? onReload : undefined} />
      </DialogContent>
      <DialogActions sx={{ p: 2 }}>
        <Button onClick={onClose} disabled={mutation.isPending}>
          Cancel
        </Button>
        <Button
          variant="contained"
          onClick={() => mutation.mutate()}
          loading={mutation.isPending}
          disabled={stale}
        >
          Confirm
        </Button>
      </DialogActions>
    </Dialog>
  )
}
