import { Link, Navigate, Outlet, useLocation, useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Chip from '@mui/material/Chip'
import Tabs from '@mui/material/Tabs'
import Tab from '@mui/material/Tab'
import { companies } from '../api/resources'
import { PageHeading } from '../shared/Collection'
import { ErrorNotice, Loading } from '../shared/Feedback'
export default function CompanyLayout() {
  const { companyId = '' } = useParams()
  const location = useLocation()
  const query = useQuery({
    queryKey: ['company', companyId, 'detail'],
    queryFn: ({ signal }) => companies.get(companyId, signal),
  })
  const base = '/companies/' + companyId
  const section = location.pathname.slice(base.length).split('/')[1] || 'overview'
  if (query.isPending) return <Loading />
  if (query.isError) return <ErrorNotice error={query.error} retry={() => void query.refetch()} />
  const company = query.data.data
  if (section === 'access' && company.current_role !== 'owner')
    return <Navigate to={base} replace />
  return (
    <>
      <Button component={Link} to="/companies" sx={{ mb: 2 }}>
        ← All companies
      </Button>
      <PageHeading
        title={company.name}
        description="Manage company information, people and projects."
        action={<Chip label={company.current_role} variant="outlined" />}
      />
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3, minWidth: 0 }}>
        <Tabs
          value={section}
          variant="scrollable"
          scrollButtons="auto"
          aria-label="Company sections"
        >
          <Tab label="Overview" value="overview" component={Link} to={base} />
          <Tab label="Employees" value="employees" component={Link} to={base + '/employees'} />
          <Tab label="Projects" value="projects" component={Link} to={base + '/projects'} />
          {company.current_role === 'owner' ? (
            <Tab label="Access" value="access" component={Link} to={base + '/access'} />
          ) : null}
        </Tabs>
      </Box>
      <Outlet context={company} key={company.id + ':' + company.current_role} />
    </>
  )
}
