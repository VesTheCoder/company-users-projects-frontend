import { useState } from 'react'
import { Link } from 'react-router-dom'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Paper from '@mui/material/Paper'
import Stack from '@mui/material/Stack'
import Chip from '@mui/material/Chip'
import Typography from '@mui/material/Typography'
import { projects } from '../api/resources'
import { refreshCompany } from '../api/query'
import { useCompany } from '../companies/context'
import { Collection, Filter, PageHeading } from '../shared/Collection'
import { useCollection } from '../shared/useCollection'
import EntityDialog from '../shared/EntityDialog'
import { projectFields } from '../shared/forms'
import { useNotify } from '../shared/notification'
export default function ProjectsPage() {
  const company = useCompany()
  const resource = projects(company.id)
  const [status, setStatus] = useState('')
  const [action, setAction] = useState<{ id?: string; remove?: boolean } | null>(null)
  const notify = useNotify()
  const list = useCollection(['company', company.id, 'projects', status], (cursor, signal) =>
    resource.list(cursor, { status }, signal),
  )
  const editable = company.current_role !== 'viewer'
  return (
    <>
      <PageHeading
        title="Projects"
        description="Plan work and manage the team assigned to each project."
        action={
          editable ? (
            <Button variant="contained" onClick={() => setAction({})}>
              Create project
            </Button>
          ) : undefined
        }
      />
      <Filter
        label="Project status"
        value={status}
        options={['planned', 'active', 'completed', 'cancelled']}
        onChange={setStatus}
      />
      <Collection {...list.props}>
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', md: 'repeat(2, minmax(0, 1fr))' },
            gap: 2,
          }}
        >
          {list.items.map((project) => (
            <Paper key={project.id} variant="outlined" sx={{ p: 3, minWidth: 0 }}>
              <Chip label={project.status} size="small" variant="outlined" sx={{ mb: 2 }} />
              <Typography variant="h5" component="h2" noWrap title={project.name}>
                {project.name}
              </Typography>
              <Typography
                color="text.secondary"
                sx={{
                  mt: 1,
                  height: 48,
                  overflow: 'hidden',
                  display: '-webkit-box',
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical',
                  overflowWrap: 'anywhere',
                }}
              >
                {project.description || 'No description provided.'}
              </Typography>
              <Typography variant="body2" sx={{ mt: 2 }}>
                Start: {project.start_date || '—'} · End: {project.end_date || '—'}
              </Typography>
              <Stack direction="row" spacing={1} sx={{ mt: 2, flexWrap: 'wrap', gap: 1 }}>
                <Button component={Link} to={project.id} variant="outlined">
                  View project
                </Button>
                {editable ? (
                  <>
                    <Button
                      onClick={() => setAction({ id: project.id })}
                      aria-label={'Edit ' + project.name}
                    >
                      Edit
                    </Button>
                    <Button
                      onClick={() => setAction({ id: project.id, remove: true })}
                      aria-label={'Delete ' + project.name}
                    >
                      Delete
                    </Button>
                  </>
                ) : null}
              </Stack>
            </Paper>
          ))}
        </Box>
      </Collection>
      {action ? (
        <EntityDialog
          id={action.id}
          remove={action.remove}
          title={action.remove ? 'Delete project' : action.id ? 'Edit project' : 'Create project'}
          fields={(data) => projectFields(data?.status)}
          resource={resource}
          notice={
            action.remove ? 'Permanently delete this project and its assignments?' : undefined
          }
          onClose={() => setAction(null)}
          onSuccess={() => {
            setAction(null)
            notify(action.remove ? 'Project deleted.' : 'Project saved.')
            list.props.reload()
            void refreshCompany(company.id)
          }}
        />
      ) : null}
    </>
  )
}
