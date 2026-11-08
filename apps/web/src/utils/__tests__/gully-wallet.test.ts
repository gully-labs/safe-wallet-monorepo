import { type JsonRpcProvider, toBeHex } from 'ethers'
import { EMPTY_DATA } from '@safe-global/protocol-kit/dist/src/utils/constants'
import * as web3ReadOnly from '@/hooks/wallets/web3ReadOnly'
import { isSmartContractWallet } from '@/utils/wallets'
import {
  forgetGullyWallets,
  isGullyWalletLabel,
  isKnownGullyWallet,
  rememberGullyWallet,
  trackGullyWallet,
} from '@/utils/gully-wallet'

describe('Gully Wallet as a Safe signer', () => {
  const getCodeMock = jest.fn()
  const address = toBeHex('0xabc123', 20)

  beforeEach(() => {
    forgetGullyWallets()
    isSmartContractWallet.cache.clear?.()
    jest.clearAllMocks()
    jest.spyOn(web3ReadOnly, 'getWeb3ReadOnly').mockImplementation(() => ({ getCode: getCodeMock }) as unknown as JsonRpcProvider)
  })

  it('knows the Gully Wallet by its label only', () => {
    expect(isGullyWalletLabel('Gully Wallet')).toBe(true)
    expect(isGullyWalletLabel('MetaMask')).toBe(false)
    expect(isGullyWalletLabel(undefined)).toBe(false)
  })

  it('remembers a connected Gully Wallet address, case-insensitively, and ignores other wallets', () => {
    expect(trackGullyWallet({ label: 'MetaMask', address })).toBe(false)
    expect(isKnownGullyWallet(address)).toBe(false)
    expect(trackGullyWallet({ label: 'Gully Wallet', address })).toBe(true)
    expect(isKnownGullyWallet(address.toUpperCase().replace('0X', '0x'))).toBe(true)
    expect(trackGullyWallet(null)).toBe(false)
  })

  it('treats an undeployed Gully Wallet (no code yet) as a smart-contract signer, so it approves hashes on chain', async () => {
    getCodeMock.mockResolvedValue(EMPTY_DATA)
    expect(await isSmartContractWallet('485590', address)).toBe(false)
    isSmartContractWallet.cache.clear?.()
    rememberGullyWallet(address)
    expect(await isSmartContractWallet('485590', address)).toBe(true)
  })

  it('leaves every other plain wallet on the off-chain signing path', async () => {
    getCodeMock.mockResolvedValue(EMPTY_DATA)
    rememberGullyWallet(address)
    expect(await isSmartContractWallet('485590', toBeHex('0xdef456', 20))).toBe(false)
  })
})
