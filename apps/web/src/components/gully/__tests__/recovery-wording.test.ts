import { readFileSync } from 'fs'
import { join } from 'path'

// Wording sweep round 2 (2026-11-09): "Account recovery" -> "Multisig recovery" wherever users see it.
const src = join(__dirname, '..', '..', '..')
const read = (p: string) => readFileSync(join(src, p), 'utf8')

const FILES = [
  'features/recovery/components/RecoveryCards/RecoveryInProgressCard.tsx',
  'components/tx-flow/flows/CancelRecovery/index.tsx',
  'components/tx-flow/flows/RecoverAccount/index.tsx',
  'components/tx-flow/flows/RemoveRecovery/index.tsx',
  'components/tx-flow/flows/UpsertRecovery/index.tsx',
  'features/recovery/components/GroupedRecoveryListItems/index.tsx',
  'features/recovery/components/RecoverySettings/index.tsx',
  'features/recovery/components/RecoveryType/index.tsx',
  'features/recovery/hooks/useRecoveryTxNotification.ts',
]

describe('recovery says multisig', () => {
  it.each(FILES)('%s', (f) => {
    const s = read(f)
    expect(s).not.toContain('Account recovery')
    expect(s).toContain('Multisig recovery')
  })
})
