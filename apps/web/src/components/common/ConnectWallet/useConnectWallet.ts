import { useCallback } from 'react'
import type { OnboardAPI, WalletState } from '@web3-onboard/core'
import useOnboard, { connectWallet } from '@/hooks/wallets/useOnboard'
import { useCurrentChain } from '@/hooks/useChains'
import { pickWallet, type GullyPick } from '@/services/gully-connect'

type Picker = () => Promise<GullyPick | null | undefined>

/**
 * Gully Safe: every "Connect" button opens the shared Gully Chain dialog (Gully Wallet, WalletConnect, detected
 * wallets, install links) and then connects the pick through web3-onboard. If the dialog cannot load, or onboard
 * does not know the picked wallet, the stock web3-onboard modal opens instead, so connecting never dead-ends.
 */
export const connectWithGullyDialog = async (
  onboard: OnboardAPI,
  refreshWallets: () => Promise<void> = async () => {},
  pick: Picker = pickWallet,
): Promise<WalletState[] | undefined> => {
  const choice = await pick()
  if (choice === null) return undefined // closed by the user
  if (choice === undefined) return connectWallet(onboard) // dialog unavailable: onboard's own modal

  // the Gully Wallet SDK was loaded by the dialog: let onboard re-read its wallet modules first
  if (choice.kind === 'gully') await refreshWallets()

  const wallets = await connectWallet(onboard, { autoSelect: { label: choice.label, disableModals: true } })
  if (wallets && wallets.length > 0) return wallets
  return connectWallet(onboard)
}

const useConnectWallet = () => {
  const onboard = useOnboard()
  const chain = useCurrentChain()

  return useCallback(() => {
    if (!onboard) {
      return Promise.resolve(undefined)
    }

    const refreshWallets = async () => {
      if (!chain) return
      const { getSupportedWallets } = await import('@/hooks/wallets/wallets')
      onboard.state.actions.setWalletModules(getSupportedWallets(chain))
    }

    return connectWithGullyDialog(onboard, refreshWallets)
  }, [onboard, chain])
}

export default useConnectWallet
