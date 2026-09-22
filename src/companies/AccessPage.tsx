import { useState } from 'react'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Paper from '@mui/material/Paper'
import Stack from '@mui/material/Stack'
import Chip from '@mui/material/Chip'
import Typography from '@mui/material/Typography'
import { access } from '../api/resources'
import type { Access, Role } from '../api/types'
import { refreshCompany } from '../api/query'
import { Collection, PageHeading } from '../shared/Collection'
import { useCollection } from '../shared/useCollection'
import FormDialog from '../shared/FormDialog'
import ConfirmDialog from '../shared/ConfirmDialog'
import { useNotify } from '../shared/notification'
import { useCompany } from './context'
type Action = { type: 'grant' } | { type: 'edit' | 'remove' | 'transfer'; member: Access }
const roleField = { name: 'role', label: 'Role', required: true, options: ['viewer', 'admin'] }
export default function AccessPage() {
  const company = useCompany()
  const resource = access(company.id)
  const list = useCollection(['company', company.id, 'access'], (cursor, signal) =>
    resource.list(cursor, signal),
  )
  const [action, setAction] = useState<Action | null>(null)
  const notify = useNotify()
  const changed = () => {
    setAction(null)
    notify('Company access updated.')
    void refreshCompany(company.id)
  }
  if (company.current_role !== 'owner') return null
  return (
    <>
      <PageHeading
        title="Company access"
        description="Manage account permissions. Employees do not automatically have account access."
        action={
          <Button variant="contained" onClick={() => setAction({ type: 'grant' })}>
            Grant access
          </Button>
        }
      />
      <Collection {...list.props}>
        <Stack spacing={2}>
          {list.items.map((member) => (
            <Paper key={member.user_id} variant="outlined" sx={{ p: 3 }}>
              <Stack
                direction={{ xs: 'column', sm: 'row' }}
                spacing={2}
                sx={{ justifyContent: 'space-between', alignItems: { sm: 'center' } }}
              >
                <Box sx={{ minWidth: 0 }}>
                  <Typography variant="h5" component="h2" noWrap title={member.display_name}>
                    {member.display_name}
                  </Typography>
                  <Typography noWrap color="text.secondary" title={member.login}>
                    {member.login}
                  </Typography>
                  <Typography variant="caption" component="p" noWrap title={member.user_id}>
                    {member.user_id}
                  </Typography>
                </Box>
                <Chip label={member.role} variant="outlined" sx={{ alignSelf: 'flex-start' }} />
              </Stack>
              {member.role !== 'owner' ? (
                <Stack direction="row" spacing={1} sx={{ mt: 2, flexWrap: 'wrap', gap: 1 }}>
                  <Button variant="outlined" onClick={() => setAction({ type: 'edit', member })}>
                    Change role
                  </Button>
                  <Button onClick={() => setAction({ type: 'remove', member })}>
                    Revoke access
                  </Button>
                  <Button onClick={() => setAction({ type: 'transfer', member })}>
                    Transfer ownership
                  </Button>
                </Stack>
              ) : null}
            </Paper>
          ))}
        </Stack>
      </Collection>
      {action?.type === 'grant' ? (
        <FormDialog
          title="Grant company access"
          fields={[
            {
              name: 'user_id',
              label: 'User UUID',
              required: true,
              pattern:
                '[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}',
              hint: 'Enter the UUID of an existing application account.',
            },
            roleField,
          ]}
          onSubmit={(values) =>
            resource.grant({
              user_id: values.user_id.trim(),
              role: values.role as Exclude<Role, 'owner'>,
            })
          }
          onClose={() => setAction(null)}
          onSuccess={changed}
        />
      ) : null}
      {action?.type === 'edit' ? (
        <FormDialog
          title="Change access role"
          fields={[roleField]}
          initial={action.member}
          notice={action.member.display_name + ' (' + action.member.login + ')'}
          onSubmit={(values) =>
            resource.update(action.member.user_id, values.role as Exclude<Role, 'owner'>)
          }
          onClose={() => setAction(null)}
          onSuccess={changed}
        />
      ) : null}
      {action?.type === 'remove' ? (
        <ConfirmDialog
          title="Revoke company access"
          description={
            'Remove access for ' +
            action.member.display_name +
            '? They will no longer be able to view this company.'
          }
          action={() => resource.remove(action.member.user_id)}
          onClose={() => setAction(null)}
          onSuccess={changed}
        />
      ) : null}
      {action?.type === 'transfer' ? (
        <FormDialog
          title="Transfer ownership"
          submitLabel="Transfer ownership"
          notice={
            'Make ' +
            action.member.display_name +
            ' the sole owner? You will lose access administration and company deletion permissions. Choose your role after transfer.'
          }
          fields={[
            {
              name: 'previous_owner_role',
              label: 'Your role after transfer',
              required: true,
              options: ['admin', 'viewer'],
            },
          ]}
          onSubmit={(values) =>
            resource.transfer({
              new_owner_user_id: action.member.user_id,
              previous_owner_role: values.previous_owner_role as Exclude<Role, 'owner'>,
            })
          }
          onClose={() => setAction(null)}
          onSuccess={changed}
        />
      ) : null}
    </>
  )
}
