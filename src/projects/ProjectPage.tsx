import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import Button from '@mui/material/Button'
import Box from '@mui/material/Box'
import Paper from '@mui/material/Paper'
import Stack from '@mui/material/Stack'
import Chip from '@mui/material/Chip'
import Typography from '@mui/material/Typography'
import { assignments, projects } from '../api/resources'
import { refreshCompany } from '../api/query'
import { useCompany } from '../companies/context'
import { Collection, PageHeading } from '../shared/Collection'
import { ErrorNotice, Loading } from '../shared/Feedback'
import { useCollection } from '../shared/useCollection'
import { canAssign } from '../shared/forms'
import ConfirmDialog from '../shared/ConfirmDialog'
import { useNotify } from '../shared/notification'
import AssignDialog from './AssignDialog'
export default function ProjectPage() {
  const company = useCompany()
  const { projectId = '' } = useParams()
  const [assigning, setAssigning] = useState(false)
  const [removing, setRemoving] = useState<{ id: string; name: string } | null>(null)
  const notify = useNotify()
  const project = useQuery({ queryKey: ['company', company.id, 'project', projectId], queryFn: ({ signal }) => projects(company.id).get(projectId, signal) })
  const resource = assignments(company.id, projectId)
  const list = useCollection(['company', company.id, 'assignments', projectId], (cursor, signal) => resource.list(cursor, signal))
  const editable = company.current_role !== 'viewer'
  if (project.isPending) return <Loading />
  if (project.isError) return <ErrorNotice error={project.error} retry={() => void project.refetch()} />
  const data = project.data.data
  const changed = () => { setAssigning(false); setRemoving(null); notify('Project assignments updated.'); list.props.reload(); void refreshCompany(company.id) }
  return <>
    <Button component={Link} to={'/companies/' + company.id + '/projects'} sx={{ mb: 2 }}>← All projects</Button>
    <PageHeading title={data.name} description={'Start: ' + (data.start_date || '—') + ' · End: ' + (data.end_date || '—')} action={<Chip label={data.status} variant="outlined" />} />
    <Typography sx={{ mb: 4, whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }}>{data.description || 'No description provided.'}</Typography>
    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ justifyContent: 'space-between', mb: 3 }}>
      <Typography variant="h5" component="h2">Assigned employees</Typography>
      {editable && canAssign(data.status) ? <Button variant="contained" onClick={() => setAssigning(true)}>Assign employee</Button> : null}
    </Stack>
    {!canAssign(data.status) ? <Typography color="text.secondary" sx={{ mb: 2 }}>This project is closed. Existing assignments are retained; new assignments are unavailable.</Typography> : null}
    <Collection {...list.props}>
      <Stack spacing={1}>{list.items.map(assignment => <Paper key={assignment.employee.id} variant="outlined" sx={{ p: 2 }}>
        <Stack direction="row" spacing={2} sx={{ alignItems: 'center' }}>
          <Box sx={{ minWidth: 0, flex: 1 }}><Typography noWrap title={assignment.employee.full_name}>{assignment.employee.full_name}</Typography><Typography variant="body2" color="text.secondary" noWrap>{assignment.employee.job_title || 'No job title'} · {assignment.employee.status}</Typography><Typography variant="caption">Assigned {new Date(assignment.assigned_at).toLocaleDateString()}</Typography></Box>
          {editable ? <Button onClick={() => setRemoving({ id: assignment.employee.id, name: assignment.employee.full_name })}>Remove</Button> : null}
        </Stack>
      </Paper>)}</Stack>
    </Collection>
    {assigning ? <AssignDialog companyId={company.id} projectId={projectId} assignedIds={new Set(list.items.map(a => a.employee.id))} onClose={() => setAssigning(false)} onSuccess={changed} /> : null}
    {removing ? <ConfirmDialog title="Remove assignment" description={'Remove ' + removing.name + ' from this project? The employee record will be retained.'} action={() => resource.remove(removing.id)} onClose={() => setRemoving(null)} onSuccess={changed} /> : null}
  </>
}
