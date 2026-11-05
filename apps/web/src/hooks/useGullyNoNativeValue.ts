/**
 * Gully Multisig: chains whose native coin pays gas only.
 *
 * On Anubis Network (6714) the native coin gasDAI is a gas-only ledger: `eth_getBalance` reports it, but no
 * transaction can carry it as a value (the node answers "insufficient funds for transfer"). A Safe there holds and
 * moves ERC-20 tokens only. The Gully Config Service marks such a chain with the feature key below (gully-ops
 * l3/safe/chains/<chainId>.app.env); the app then leaves the native coin out of every "send" choice and says why.
 */
import { useCurrentChain } from '@/hooks/useChains'

export const GULLY_NO_NATIVE_VALUE = 'GULLY_NO_NATIVE_VALUE'

type ChainLike = { features?: readonly string[]; nativeCurrency?: { symbol?: string }; chainName?: string }

export const chainHasNoNativeValue = (chain: ChainLike | undefined): boolean =>
  !!chain?.features?.some((feature) => feature === GULLY_NO_NATIVE_VALUE)

/** One line, shown wherever sending the native coin is taken away. */
export const noNativeValueNote = (chain: ChainLike | undefined): string => {
  const symbol = chain?.nativeCurrency?.symbol || 'The native coin'
  const where = chain?.chainName ? ` on ${chain.chainName}` : ''
  return `${symbol} pays gas only${where} and cannot be sent. Tokens (ERC-20) can.`
}

export const useGullyNoNativeValue = (): { noNativeValue: boolean; note: string } => {
  const chain = useCurrentChain() as ChainLike | undefined
  return { noNativeValue: chainHasNoNativeValue(chain), note: noNativeValueNote(chain) }
}
