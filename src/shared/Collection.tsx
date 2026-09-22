import type { ReactNode } from 'react'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import MenuItem from '@mui/material/MenuItem'
import TextField from '@mui/material/TextField'
import { Empty, ErrorNotice, Loading } from './Feedback'
export function PageHeading({ title, description, action }: { title: string; description: string; action?: ReactNode }) {
  return <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ justifyContent: 'space-between', alignItems: { sm: 'center' }, mb: 3 }}>
    <Box sx={{ minWidth: 0 }}><Typography component="h1" variant="h4" sx={{ overflowWrap: 'anywhere' }}>{title}</Typography><Typography color="text.secondary" sx={{ mt: 1 }}>{description}</Typography></Box>{action}
  </Stack>
}
export function Filter({ label, value, options, onChange }: { label: string; value: string; options: readonly string[]; onChange: (value: string) => void }) {
  return <TextField select label={label} value={value} onChange={e => onChange(e.target.value)} sx={{ width: { xs: '100%', sm: 220 }, mb: 3 }}>
    <MenuItem value="">All</MenuItem>{options.map(option => <MenuItem value={option} key={option}>{option}</MenuItem>)}
  </TextField>
}
export function Collection({ pending, error, count, fetching, hasNext, loadMore, reload, children }: {
  pending: boolean; error: unknown; count: number; fetching: boolean; hasNext: boolean; loadMore: () => void; reload: () => void; children: ReactNode
}) {
  return <Box sx={{ minHeight: 240 }} aria-busy={fetching}>
    <ErrorNotice error={error} retry={reload} />
    {pending ? <Loading /> : <>
      {!count && !error ? <Empty>No records here yet. Try another filter or create a new record.</Empty> : children}
      <Stack direction="row" spacing={2} sx={{ mt: 3, alignItems: 'center' }}>
        {hasNext ? <Button variant="outlined" onClick={loadMore} loading={fetching}>Load more</Button> : null}
        <Button onClick={reload} disabled={fetching}>Refresh</Button>
        <Typography variant="caption" color="text.secondary">{count} loaded</Typography>
      </Stack>
    </>}
  </Box>
}
