/**
 * Gully Multisig: the Gully Wallet (a Gully ID passkey wallet, a Kernel v3.3 smart account) as a Safe signer.
 *
 * A Kernel account cannot make the off-chain ECDSA signature a Safe v1.4.1 owner normally gives (Safe 1.4.1 has no
 * ERC-1271 bytes32 check), and before its first transaction it has no code on chain, so "has code" cannot tell it from
 * a plain wallet. A Gully Wallet signer therefore always takes the smart-contract path of the Safe app: it approves the
 * Safe transaction hash on chain (`approveHash`, one passkey tap, gas sponsored when the paymaster agrees) and executes
 * through the same wallet. No seed phrase, no browser extension, no change to any contract.
 */
import { GULLY_WALLET_LABEL } from '@/services/gully-connect'

const known = new Set<string>()

export const isGullyWalletLabel = (label?: string | null): boolean => label === GULLY_WALLET_LABEL

export const rememberGullyWallet = (address: string): void => {
  known.add(address.toLowerCase())
}

export const forgetGullyWallets = (): void => {
  known.clear()
}

export const isKnownGullyWallet = (address?: string | null): boolean => !!address && known.has(address.toLowerCase())

/** Keeps the set of connected Gully Wallet addresses in step with the connected wallet. Returns true when it is one. */
export const trackGullyWallet = (wallet: { label: string; address: string } | null): boolean => {
  if (wallet && isGullyWalletLabel(wallet.label)) {
    rememberGullyWallet(wallet.address)
    return true
  }
  return false
}
