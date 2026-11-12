import { renderHook, waitFor } from '@/tests/test-utils'
import * as safesQueries from '@safe-global/store/gateway/AUTO_GENERATED/safes'
import * as useSafeInfo from '@/hooks/useSafeInfo'
import * as useChains from '@/hooks/useChains'
import * as web3ReadOnly from '@/hooks/wallets/web3ReadOnly'
import { useParentSafe } from '@/hooks/useParentSafe'

// Gully: a 1-of-1 Safe owned by an EOA must not ask the gateway whether the EOA is a Safe (404 from our own gateway
// on every page); only a contract owner is looked up.
const OWNER = '0x92cFC047652d6aEf7eb0fa2744B912d9f627fA41'

describe('useParentSafe', () => {
  let query: jest.SpyInstance
  beforeEach(() => {
    jest.restoreAllMocks()
    jest.spyOn(useChains, 'useHasFeature').mockReturnValue(true)
    jest.spyOn(useSafeInfo, 'default').mockReturnValue({
      safe: { chainId: '485590', owners: [{ value: OWNER }] },
    } as any)
    query = jest.spyOn(safesQueries, 'useSafesGetSafeV1Query').mockReturnValue({ data: undefined } as any)
  })

  it('skips the gateway lookup when the single owner is an EOA', async () => {
    const getCode = jest.fn().mockResolvedValue('0x')
    jest.spyOn(web3ReadOnly, 'useWeb3ReadOnly').mockReturnValue({ getCode } as any)
    renderHook(() => useParentSafe())
    await waitFor(() => expect(getCode).toHaveBeenCalledWith(OWNER))
    for (const call of query.mock.calls) expect(call[1]).toEqual(expect.objectContaining({ skip: true }))
  })

  it('looks the owner up when it is a contract', async () => {
    const getCode = jest.fn().mockResolvedValue('0x6080')
    jest.spyOn(web3ReadOnly, 'useWeb3ReadOnly').mockReturnValue({ getCode } as any)
    renderHook(() => useParentSafe())
    await waitFor(() => expect(query.mock.calls.some((c) => c[1]?.skip === false)).toBe(true))
  })
})
