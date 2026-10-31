// Gully Safe: the AllowanceModule overlay for Gully Chain (485590), see spendingLimitDeployments.ts
import {
  getAllowanceModuleDeployment,
  getDeployedSpendingLimitModuleAddress,
  getLatestSpendingLimitAddress,
} from '../services/spendingLimitDeployments'

const GULLY = '485590'
const GULLY_MODULE = '0x0Fd09Bd80206854b1dAd588A2eFCd7573De536b9'
const CANONICAL_011 = '0xAA46724893dedD72658219405185Fb0Fc91e091C'

describe('Gully Chain AllowanceModule overlay', () => {
  it('resolves the latest module on 485590 to the Gully address, with the canonical 0.1.1 ABI', () => {
    const d = getAllowanceModuleDeployment({ network: GULLY })
    expect(d?.version).toBe('0.1.1')
    expect(d?.networkAddresses[GULLY]).toBe(GULLY_MODULE)
    expect(d?.abi.some((f: { name?: string }) => f.name === 'setAllowance')).toBe(true)
    expect(getLatestSpendingLimitAddress(GULLY)).toBe(GULLY_MODULE)
  })

  it('has no 0.1.0 module on 485590', () => {
    expect(getAllowanceModuleDeployment({ network: GULLY, version: '0.1.0' })).toBeUndefined()
  })

  it('finds the module among a Gully Safe’s enabled modules', () => {
    expect(getDeployedSpendingLimitModuleAddress(GULLY, [{ value: GULLY_MODULE }])).toBe(GULLY_MODULE)
    expect(getDeployedSpendingLimitModuleAddress(GULLY, [{ value: CANONICAL_011 }])).toBeUndefined()
  })

  it('leaves other chains exactly as upstream (Gnosis Chain has the canonical 0.1.1)', () => {
    expect(getLatestSpendingLimitAddress('100')).toBe(CANONICAL_011)
    expect(getAllowanceModuleDeployment({ network: '100' })?.networkAddresses[GULLY]).toBeUndefined()
  })
})
