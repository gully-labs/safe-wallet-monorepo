import { Alert, AlertTitle, Button, Box } from '@mui/material'

interface MigrationPromptProps {
  /** Callback when user wants to proceed with selecting safes */
  onProceed: () => void
}

/**
 * Migration prompt displayed to existing users who have safes but none pinned
 * Explains the new pinned-only security feature and guides them to select trusted safes
 */
const MigrationPrompt = ({ onProceed }: MigrationPromptProps) => {
  return (
    <Alert severity="info" data-testid="migration-prompt" sx={{ mb: 2 }}>
      <AlertTitle sx={{ fontWeight: 700 }}>Add the multisigs you trust</AlertTitle>
      Only multisigs you trust appear in this list.
      <Box sx={{ mt: 2 }}>
        <Button variant="contained" size="small" onClick={onProceed} data-testid="select-safes-button">
          Choose multisigs
        </Button>
      </Box>
    </Alert>
  )
}

export default MigrationPrompt
