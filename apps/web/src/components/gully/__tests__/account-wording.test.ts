import { readFileSync } from 'fs'
import { join } from 'path'

// Wording sweep 2026-11-09: user-visible copy that called the multisig "your account" / "Safe" now says multisig
// (create, activation, settings, recovery, multichain, trusted list toasts, Earn). Contract and tool names stay as
// they are (Safe 1.4.1, Safe version, Safe Utils, Safe{Wallet} credits, licences).
const src = join(__dirname, '..', '..', '..')
const read = (p: string) => readFileSync(join(src, p), 'utf8')

const GONE: [string, string][] = [
  ['components/new-safe/create/index.tsx', 'Give a name to your account'],
  ['components/new-safe/create/steps/SetNameStep/index.tsx', 'you want your account to be active on'],
  ['components/new-safe/create/steps/StatusStep/StatusMessage.tsx', 'We are activating your account'],
  ['components/new-safe/create/steps/StatusStep/StatusMessage.tsx', 'create an account from scratch'],
  ['components/dashboard/FirstSteps/index.tsx', 'all benefits of Safe'],
  ['components/dashboard/FirstSteps/index.tsx', 'your account will be up and running'],
  ['components/settings/owner/OwnerList/index.tsx', 'full control over the account'],
  ['components/settings/SecuritySettings/index.tsx', 'control over your account'],
  ['features/counterfactual/components/PayNowPayLater/index.tsx', 'activate your account'],
  ['features/counterfactual/components/CounterfactualForm/index.tsx', 'will activate your account'],
  ['features/recovery/components/RecoveryCards/RecoveryProposalCard.tsx', 'Recover this Account'],
  ['features/multichain/components/CreateSafeOnNewChain/index.tsx', 'Successfully added your account'],
  ['features/myAccounts/hooks/useSafeSelectionModal.ts', "'Trusted Safes updated'"],
  ['features/myAccounts/hooks/useSingleChainPinActions.ts', "'Safe removed'"],
  ['features/safe-shield/hooks/useUntrustedSafeAnalysis.ts', "'Untrusted Safe'"],
  ['features/earn/components/EarnInfo/index.tsx', 'Safe Wallet UI'],
  ['components/dashboard/ExplorePossibleWidget/index.tsx', 'Manage multiple Safes'],
]

describe('the multisig is called a multisig', () => {
  it.each(GONE)('%s no longer says "%s"', (file, old) => {
    expect(read(file)).not.toContain(old)
  })

  it('the create step and the activation messages say multisig', () => {
    expect(read('components/new-safe/create/index.tsx')).toContain('Give a name to your multisig')
    expect(read('components/new-safe/create/steps/StatusStep/StatusMessage.tsx')).toContain(
      'We are activating your multisig',
    )
    expect(read('features/earn/components/EarnInfo/index.tsx')).toContain('right in Gully Multisig.')
    // contract names stay: the Safe version picker is untouched
    expect(read('components/new-safe/create/steps/AdvancedOptionsStep/index.tsx')).toContain('label="Safe version"')
  })
})

// round 2 (2026-11-09): the recovery status titles
describe('recovery status titles say multisig', () => {
  it('RecoveryInProgressCard', () => {
    const f = read('features/recovery/components/RecoveryCards/RecoveryInProgressCard.tsx')
    expect(f).toContain("'Multisig recovery expired'")
    expect(f).toContain("'Multisig recovery in progress'")
    expect(f).not.toContain('Account recovery')
    for (const p of [
      'components/tx-flow/flows/UpsertRecovery/index.tsx',
      'features/recovery/components/RecoverySettings/index.tsx',
    ])
      expect(read(p)).not.toContain('Account recovery')
  })
})
