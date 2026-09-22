import { useState } from 'react'
import { Link } from 'react-router-dom'
import Button from '@mui/material/Button'
import Box from '@mui/material/Box'
import Chip from '@mui/material/Chip'
import Paper from '@mui/material/Paper'
import Typography from '@mui/material/Typography'
import { companies } from '../api/resources'
import { refreshCompany } from '../api/query'
import { Collection, Filter, PageHeading } from '../shared/Collection'
import { useCollection } from '../shared/useCollection'
import EntityDialog from '../shared/EntityDialog'
import { companyFields } from '../shared/forms'
import { useNotify } from '../shared/notification'
export default function CompaniesPage() {
  const [role, setRole] = useState('')
  const [creating, setCreating] = useState(false)
  const notify = useNotify()
  const list = useCollection(['companies', role], (cursor, signal) => companies.list(cursor, { role }, signal))
  return <>
    <PageHeading title="Companies" description="Your organizations and the people behind them." action={<Button variant="contained" onClick={() => setCreating(true)}>Create company</Button>} />
    <Filter label="Your role" value={role} options={['owner', 'admin', 'viewer']} onChange={setRole} />
    <Collection {...list.props}>
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, minmax(0, 1fr))', md: 'repeat(3, minmax(0, 1fr))' }, gap: 2 }}>
        {list.items.map(company => <Paper key={company.id} variant="outlined" sx={{ p: 3, minWidth: 0 }}>
          <Chip size="small" variant="outlined" label={company.current_role} sx={{ mb: 2 }} />
          <Typography variant="h5" component="h2" noWrap title={company.name}>{company.name}</Typography>
          <Typography color="text.secondary" sx={{ mt: 1, height: 48, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflowWrap: 'anywhere' }}>{company.description || 'No description provided.'}</Typography>
          <Button component={Link} to={'/companies/' + company.id} sx={{ mt: 2 }} aria-label={'Open ' + company.name}>Open company →</Button>
        </Paper>)}
      </Box>
    </Collection>
    {creating ? <EntityDialog title="Create company" fields={companyFields} resource={companies} onClose={() => setCreating(false)} onSuccess={() => { setCreating(false); notify('Company created.'); void refreshCompany() }} /> : null}
  </>
}
