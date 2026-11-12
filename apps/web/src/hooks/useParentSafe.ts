import { useSafesGetSafeV1Query } from '@safe-global/store/gateway/AUTO_GENERATED/safes'
import useAsync from '@safe-global/utils/hooks/useAsync'
import useSafeInfo from './useSafeInfo'
import { useHasFeature } from '@/hooks/useChains'
import { useWeb3ReadOnly } from '@/hooks/wallets/web3ReadOnly'

import { FEATURES } from '@safe-global/utils/utils/chains'

export function useParentSafe() {
  const isEnabled = useHasFeature(FEATURES.NESTED_SAFES)
  const { safe } = useSafeInfo()
  const web3ReadOnly = useWeb3ReadOnly()

  // Nested Safes are deployed by a single owner
  const maybeParent = safe.owners.length === 1 ? safe.owners[0].value : undefined

  // Gully: only a contract owner can be a parent Safe. Asking the gateway about an EOA owner (most 1-of-1 Safes) gave a
  // 404 from our own gateway on every page, so the owner's code is read first.
  const [ownerIsContract] = useAsync<boolean>(
    async () => {
      if (!isEnabled || !maybeParent || !web3ReadOnly) return false
      const code = await web3ReadOnly.getCode(maybeParent)
      return !!code && code !== '0x'
    },
    [isEnabled, maybeParent, web3ReadOnly],
  )

  const { data: parentSafe } = useSafesGetSafeV1Query(
    {
      chainId: safe.chainId || '',
      safeAddress: maybeParent || '',
    },
    {
      skip: !isEnabled || !maybeParent || !ownerIsContract,
    },
  )

  if (parentSafe?.address.value === maybeParent) {
    return parentSafe
  }
}
