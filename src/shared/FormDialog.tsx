import { useId, useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import Button from '@mui/material/Button'
import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import DialogActions from '@mui/material/DialogActions'
import MenuItem from '@mui/material/MenuItem'
import Stack from '@mui/material/Stack'
import TextField from '@mui/material/TextField'
import Alert from '@mui/material/Alert'
import { ApiError } from '../api/errors'
import { ErrorNotice } from './Feedback'
import { initialValues, validateDates, type Field, type Values } from './forms'
export interface FormDialogProps {
  title: string
  fields: Field[]
  initial?: object
  onClose: () => void
  onSubmit: (values: Values) => Promise<unknown>
  onSuccess: () => void
  onReload?: () => void
  submitLabel?: string
  notice?: string
}
export default function FormDialog({
  title,
  fields,
  initial,
  onClose,
  onSubmit,
  onSuccess,
  onReload,
  submitLabel = 'Save',
  notice,
}: FormDialogProps) {
  const id = useId()
  const [values, setValues] = useState(() => initialValues(fields, initial))
  const [validation, setValidation] = useState<Record<string, string>>({})
  const mutation = useMutation({ mutationFn: onSubmit, onSuccess })
  const errors = {
    ...(mutation.error instanceof ApiError ? mutation.error.fields : {}),
    ...validation,
  }
  const stale = mutation.error instanceof ApiError && [412, 428].includes(mutation.error.status)
  return (
    <Dialog open onClose={mutation.isPending ? undefined : onClose} aria-labelledby={id}>
      <DialogTitle id={id}>{title}</DialogTitle>
      <form
        onSubmit={(e) => {
          e.preventDefault()
          const next = validateDates(values)
          for (const field of fields)
            if (field.required && !values[field.name].trim())
              next[field.name] = 'This field is required.'
          setValidation(next)
          if (!Object.keys(next).length && !mutation.isPending && !stale) mutation.mutate(values)
        }}
      >
        <DialogContent dividers>
          <Stack spacing={1.5}>
            {notice ? <Alert severity="info">{notice}</Alert> : null}
            <ErrorNotice error={mutation.error} retry={stale ? onReload : undefined} />
            {fields.map((field) => (
              <TextField
                key={field.name}
                id={id + '-' + field.name}
                label={field.label}
                name={field.name}
                value={values[field.name]}
                onChange={(event) => {
                  setValues({ ...values, [field.name]: event.target.value })
                  setValidation({})
                }}
                required={field.required}
                type={field.type ?? 'text'}
                multiline={field.multiline}
                rows={field.multiline ? 3 : undefined}
                select={!!field.options}
                disabled={mutation.isPending}
                error={!!errors[field.name]}
                helperText={errors[field.name] || field.hint || ' '}
                slotProps={{
                  htmlInput: { maxLength: field.maxLength, pattern: field.pattern },
                  inputLabel: field.type === 'date' ? { shrink: true } : undefined,
                }}
              >
                {field.options?.map((option) => (
                  <MenuItem key={option} value={option}>
                    {option}
                  </MenuItem>
                ))}
              </TextField>
            ))}
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={onClose} disabled={mutation.isPending}>
            Cancel
          </Button>
          <Button type="submit" variant="contained" loading={mutation.isPending} disabled={stale}>
            {submitLabel}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  )
}
