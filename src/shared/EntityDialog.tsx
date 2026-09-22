import { useQuery } from '@tanstack/react-query'
import Dialog from '@mui/material/Dialog'
import DialogContent from '@mui/material/DialogContent'
import Button from '@mui/material/Button'
import type { Snapshot } from '../api/types'
import { ErrorNotice, Loading } from './Feedback'
import FormDialog from './FormDialog'
import ConfirmDialog from './ConfirmDialog'
import { payload, type Field } from './forms'
export default function EntityDialog<T extends { id: string; version: number }, Input>({
  id,
  title,
  fields,
  resource,
  onClose,
  onSuccess,
  remove = false,
  notice,
}: {
  id?: string
  title: string
  fields: Field[] | ((data?: T) => Field[])
  resource: {
    path: string
    get: (id: string, signal?: AbortSignal) => Promise<Snapshot<T>>
    create: (body: Input) => Promise<unknown>
    update: (id: string, body: Input, snapshot: Snapshot<T>) => Promise<unknown>
    remove: (id: string, snapshot: Snapshot<T>) => Promise<unknown>
  }
  onClose: () => void
  onSuccess: () => void
  remove?: boolean
  notice?: string
}) {
  const query = useQuery({
    queryKey: ['editor', resource.path, id],
    queryFn: ({ signal }) => resource.get(id!, signal),
    enabled: !!id,
    staleTime: 0,
    gcTime: 0,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  })
  if (id && (query.isPending || query.isError || query.isFetching))
    return (
      <Dialog open onClose={onClose} aria-label={title}>
        <DialogContent>
          {query.isError ? (
            <ErrorNotice error={query.error} retry={() => void query.refetch()} />
          ) : (
            <Loading />
          )}
          <Button onClick={onClose}>Cancel</Button>
        </DialogContent>
      </Dialog>
    )
  const snapshot = query.data
  const reload = () => void query.refetch()
  if (remove && id && snapshot)
    return (
      <ConfirmDialog
        title={title}
        description={
          notice || 'This action permanently deletes this record. This cannot be undone.'
        }
        action={() => resource.remove(id, snapshot)}
        onClose={onClose}
        onSuccess={onSuccess}
        onReload={reload}
      />
    )
  return (
    <FormDialog
      key={snapshot?.data.version ?? 'new'}
      title={title}
      fields={typeof fields === 'function' ? fields(snapshot?.data) : fields}
      initial={snapshot?.data}
      onClose={onClose}
      onSuccess={onSuccess}
      onReload={reload}
      notice={notice}
      onSubmit={(values) =>
        id && snapshot
          ? resource.update(id, payload<Input>(values), snapshot)
          : resource.create(payload<Input>(values))
      }
    />
  )
}
