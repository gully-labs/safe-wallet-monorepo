import { GULLY_ID_CONFIG, loadGullyId, type GullySession } from '@/components/common/GullySignIn/gullyId'

/** The Gully ID smart-account address to offer as a Safe owner on a chain: the one for that chain, else any Kernel one. */
export const pickGullyIdAddress = (session: GullySession | null, chainId?: string | number): string | null => {
  if (!session) return null
  const want = chainId === undefined ? NaN : Number(chainId)
  const wallets = [...(session.user.wallets ?? []), ...(session.user.wallet ? [session.user.wallet] : [])]
  const kernels = wallets.filter((w) => w.kind === 'kernel-v3.3' && /^0x[0-9a-fA-F]{40}$/.test(w.address))
  const exact = kernels.find((w) => w.chainId === want)
  return (exact ?? kernels.find((w) => w.chainId === null) ?? null)?.address ?? null
}

/** The signed-in Gully ID session, or null (not signed in, SDK blocked, sign-in switched off). Never throws. */
export const readGullyIdSession = async (): Promise<GullySession | null> => {
  try {
    const client = await loadGullyId(GULLY_ID_CONFIG)
    return client ? client.session() : null
  } catch {
    return null
  }
}
