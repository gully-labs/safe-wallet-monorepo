/**
 * Gully Safe: "Gully Wallet" as a web3-onboard wallet. The Gully Wallet is the user's Gully ID passkey wallet; its
 * EIP-1193 provider is `window.gully` from https://gullyid.xyz/wallet.js (EIP-6963 rdns xyz.gullyid.wallet, approvals
 * in a gullyid.xyz pop-up). The shared connect dialog (gc-connect) preloads the SDK; if it is not there yet,
 * getInterface loads it. CSP: script-src already allows https://gullyid.xyz (securityHeaders.ts).
 */
import type { EIP1193Provider, WalletInit } from '@web3-onboard/common'
import { GULLY_WALLET_LABEL } from '@/services/gully-connect'

export const GULLY_WALLET_SRC = 'https://gullyid.xyz/wallet.js'
export const GULLY_WALLET_ICON = '/brand/logo/gc-icon.svg'

type GullyProvider = EIP1193Provider & { isGullyWallet?: boolean }

declare global {
  interface Window {
    gully?: GullyProvider
  }
}

let loading: Promise<GullyProvider> | null = null

export const loadGullyWallet = (src = GULLY_WALLET_SRC, timeoutMs = 12000): Promise<GullyProvider> => {
  if (typeof window === 'undefined') return Promise.reject(new Error('no window'))
  if (window.gully && typeof window.gully.request === 'function') return Promise.resolve(window.gully)
  if (loading) return loading
  loading = new Promise<GullyProvider>((resolve, reject) => {
    const s = document.createElement('script')
    const timer = setTimeout(() => fail('Gully Wallet took too long to load'), timeoutMs)
    function fail(message: string) {
      clearTimeout(timer)
      loading = null
      s.remove()
      reject(new Error(message))
    }
    s.src = src
    s.async = true
    s.referrerPolicy = 'strict-origin'
    s.onload = () => {
      clearTimeout(timer)
      if (window.gully && typeof window.gully.request === 'function') resolve(window.gully)
      else fail('Gully Wallet did not start')
    }
    s.onerror = () => fail('Gully Wallet could not load (blocked or offline)')
    document.head.appendChild(s)
  })
  return loading
}

/** Tests only. */
export const resetGullyWalletLoader = () => {
  loading = null
}

const gullyWalletModule = (): WalletInit => () => ({
  label: GULLY_WALLET_LABEL,
  // kit v4 logo/gc-icon.svg, served byte for byte from public/brand/logo
  getIcon: async () => (await fetch(GULLY_WALLET_ICON)).text(),
  getInterface: async () => ({ provider: await loadGullyWallet() }),
})

export default gullyWalletModule
