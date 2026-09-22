import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Button from '@mui/material/Button'
import Paper from '@mui/material/Paper'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import { companies } from '../api/resources'
import { refreshCompany } from '../api/query'
import EntityDialog from '../shared/EntityDialog'
import { companyFields } from '../shared/forms'
import { useNotify } from '../shared/notification'
import { useCompany } from './context'
export default function CompanyOverview() {
  const company = useCompany()
  const navigate = useNavigate()
  const notify = useNotify()
  const [action, setAction] = useState<'edit' | 'delete' | null>(null)
  return (
    <Paper variant="outlined" sx={{ p: { xs: 2, sm: 4 } }}>
      <Typography variant="h5" component="h2" sx={{ mb: 3 }}>
        Company information
      </Typography>
      <Stack spacing={3}>
        <div>
          <Typography variant="caption" color="text.secondary">
            Description
          </Typography>
          <Typography sx={{ whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }}>
            {company.description || 'No description provided.'}
          </Typography>
        </div>
        <div>
          <Typography variant="caption" color="text.secondary">
            Website
          </Typography>
          <Typography noWrap title={company.website ?? ''}>
            {company.website ? (
              <a href={company.website} target="_blank" rel="noopener noreferrer">
                {company.website}
              </a>
            ) : (
              'Not provided'
            )}
          </Typography>
        </div>
        <div>
          <Typography variant="caption" color="text.secondary">
            Company ID
          </Typography>
          <Typography variant="body2" noWrap title={company.id}>
            {company.id}
          </Typography>
        </div>
        <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', gap: 1 }}>
          {company.current_role !== 'viewer' ? (
            <Button variant="outlined" onClick={() => setAction('edit')}>
              Edit company
            </Button>
          ) : null}
          {company.current_role === 'owner' ? (
            <Button onClick={() => setAction('delete')}>Delete company</Button>
          ) : null}
        </Stack>
      </Stack>
      {action ? (
        <EntityDialog
          id={company.id}
          title={action === 'delete' ? 'Delete company' : 'Edit company'}
          fields={companyFields}
          resource={companies}
          remove={action === 'delete'}
          notice={
            action === 'delete'
              ? 'Permanently delete this company, its employees, projects, assignments and all company access? This cannot be undone.'
              : undefined
          }
          onClose={() => setAction(null)}
          onSuccess={() => {
            const deleted = action === 'delete'
            setAction(null)
            notify(deleted ? 'Company deleted.' : 'Company updated.')
            if (deleted) navigate('/companies')
            void refreshCompany(deleted ? undefined : company.id)
          }}
        />
      ) : null}
    </Paper>
  )
}
