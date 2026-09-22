import { createTheme } from '@mui/material/styles'
const colors = { ink: '#202020', secondary: '#606060', border: '#dedede', paper: '#ffffff', muted: '#f5f5f5' }
export const theme = createTheme({
  palette: {
    mode: 'light', primary: { main: colors.ink }, secondary: { main: colors.secondary },
    background: { default: colors.paper, paper: colors.paper },
    text: { primary: colors.ink, secondary: colors.secondary }, divider: colors.border,
    error: { main: '#454545' }, warning: { main: '#555555' }, info: { main: '#505050' }, success: { main: '#404040' },
  },
  typography: {
    fontFamily: 'Inter, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    h4: { fontWeight: 650, fontSize: '1.8rem', letterSpacing: '-0.04em' },
    h5: { fontWeight: 650, fontSize: '1.3rem', letterSpacing: '-0.025em' },
    button: { textTransform: 'none', fontWeight: 600 },
  },
  shape: { borderRadius: 6 },
  components: {
    MuiButton: { defaultProps: { disableElevation: true } },
    MuiPaper: { defaultProps: { elevation: 0 } },
    MuiTextField: { defaultProps: { fullWidth: true, size: 'small' } },
    MuiTableCell: { styleOverrides: { head: { backgroundColor: colors.muted, fontWeight: 600 } } },
    MuiDialog: { defaultProps: { fullWidth: true, maxWidth: 'sm' } },
    MuiAlert: { styleOverrides: { root: { backgroundColor: colors.muted, color: colors.ink, border: '1px solid ' + colors.border } } },
  },
})
