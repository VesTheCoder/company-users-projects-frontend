import { useId } from 'react'
import { useMutation } from '@tanstack/react-query'
import Button from '@mui/material/Button'
import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import DialogActions from '@mui/material/DialogActions'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import { assignments, employees } from '../api/resources'
import { Collection } from '../shared/Collection'
import { useCollection } from '../shared/useCollection'
import { ErrorNotice } from '../shared/Feedback'
export default function AssignDialog({
  companyId,
  projectId,
  assignedIds,
  onClose,
  onSuccess,
}: {
  companyId: string
  projectId: string
  assignedIds: Set<string>
  onClose: () => void
  onSuccess: () => void
}) {
  const id = useId()
  const list = useCollection(['company', companyId, 'assignable-employees'], (cursor, signal) =>
    employees(companyId).list(cursor, { status: 'active' }, signal),
  )
  const mutation = useMutation({ mutationFn: assignments(companyId, projectId).assign, onSuccess })
  return (
    <Dialog open onClose={mutation.isPending ? undefined : onClose} aria-labelledby={id}>
      <DialogTitle id={id}>Assign employee</DialogTitle>
      <DialogContent dividers>
        <Typography color="text.secondary" sx={{ mb: 2 }}>
          Choose an active employee from this company.
        </Typography>
        <ErrorNotice error={mutation.error} />
        <Collection {...list.props}>
          <Stack spacing={1}>
            {list.items.map((employee) => (
              <Stack
                key={employee.id}
                direction="row"
                spacing={2}
                sx={{ borderBottom: 1, borderColor: 'divider', py: 1.5, alignItems: 'center' }}
              >
                <div style={{ minWidth: 0, flex: 1 }}>
                  <Typography noWrap title={employee.full_name}>
                    {employee.full_name}
                  </Typography>
                  <Typography variant="caption" noWrap component="p">
                    {employee.job_title || employee.work_email}
                  </Typography>
                </div>
                <Button
                  variant="outlined"
                  disabled={mutation.isPending || assignedIds.has(employee.id)}
                  onClick={() => mutation.mutate(employee.id)}
                >
                  {assignedIds.has(employee.id) ? 'Assigned' : 'Assign'}
                </Button>
              </Stack>
            ))}
          </Stack>
        </Collection>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={mutation.isPending}>
          Cancel
        </Button>
      </DialogActions>
    </Dialog>
  )
}
