import { useState } from 'react'
import Button from '@mui/material/Button'
import Box from '@mui/material/Box'
import Paper from '@mui/material/Paper'
import Stack from '@mui/material/Stack'
import Chip from '@mui/material/Chip'
import Typography from '@mui/material/Typography'
import { employees } from '../api/resources'
import { refreshCompany } from '../api/query'
import { useCompany } from '../companies/context'
import { Collection, Filter, PageHeading } from '../shared/Collection'
import { useCollection } from '../shared/useCollection'
import EntityDialog from '../shared/EntityDialog'
import { employeeFields } from '../shared/forms'
import { useNotify } from '../shared/notification'
export default function EmployeesPage() {
  const company = useCompany()
  const resource = employees(company.id)
  const [status, setStatus] = useState('')
  const [action, setAction] = useState<{ id?: string; remove?: boolean } | null>(null)
  const notify = useNotify()
  const list = useCollection(['company', company.id, 'employees', status], (cursor, signal) => resource.list(cursor, { status }, signal))
  const editable = company.current_role !== 'viewer'
  return <>
    <PageHeading title="Employees" description="Employee records are separate from application accounts." action={editable ? <Button variant="contained" onClick={() => setAction({})}>Add employee</Button> : undefined} />
    <Filter label="Employment status" value={status} options={['active', 'leave', 'terminated']} onChange={setStatus} />
    <Collection {...list.props}>
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(2, minmax(0, 1fr))' }, gap: 2 }}>
        {list.items.map(employee => <Paper key={employee.id} variant="outlined" sx={{ p: 3, minWidth: 0 }}>
          <Stack direction="row" spacing={2} sx={{ justifyContent: 'space-between', mb: 2 }}>
            <Typography variant="h5" component="h2" noWrap title={employee.full_name}>{employee.full_name}</Typography><Chip size="small" label={employee.status} variant="outlined" />
          </Stack>
          <Typography color="text.secondary" noWrap title={employee.job_title ?? ''}>{employee.job_title || 'No job title'}</Typography>
          <Typography variant="body2" noWrap title={employee.work_email ?? ''}>{employee.work_email || 'No work email'}</Typography>
          <Typography variant="body2">{employee.work_phone || 'No work phone'}</Typography>
          <Typography variant="body2" sx={{ mt: 2 }}>Start: {employee.start_date} · End: {employee.end_date || '—'}</Typography>
          <Typography variant="caption" color="text.secondary" component="p" noWrap title={employee.id}>ID: {employee.id}</Typography>
          {editable ? <Stack direction="row" spacing={1} sx={{ mt: 2 }}>
            <Button variant="outlined" onClick={() => setAction({ id: employee.id })} aria-label={'Edit ' + employee.full_name}>Edit</Button>
            <Button onClick={() => setAction({ id: employee.id, remove: true })} aria-label={'Delete ' + employee.full_name}>Delete</Button>
          </Stack> : null}
        </Paper>)}
      </Box>
    </Collection>
    {action ? <EntityDialog id={action.id} remove={action.remove} title={action.remove ? 'Delete employee' : action.id ? 'Edit employee' : 'Add employee'} fields={employeeFields} resource={resource}
      notice={action.remove ? 'Permanently delete this employee and their project assignments?' : 'Terminating employment removes active project assignments. An end date is required for termination.'}
      onClose={() => setAction(null)} onSuccess={() => { setAction(null); notify('Employee saved.'); list.props.reload(); void refreshCompany(company.id) }} /> : null}
  </>
}
