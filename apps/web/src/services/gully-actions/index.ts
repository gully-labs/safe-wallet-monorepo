/**
 * Gully Multisig: Gully tools as one-click Safe actions. Each builder turns a few form values into the call(s) of a
 * Safe transaction. Nothing is sent from here: the calls go into the normal Safe flow (preview, sign, queue), where the
 * signers see them decoded (services/gully-decode) next to the raw data. Contract addresses are the Gully Core records
 * in config/gully-core-addresses.json; a chain without a record, or without the contract an action needs, returns an
 * error sentence instead of a call.
 */
import { Interface, formatUnits, getAddress, isAddress, parseUnits } from 'ethers'
import addresses from '@/config/gully-core-addresses.json'

export type GullyCall = { to: string; value: string; data: string }
export type Built = { ok: true; calls: GullyCall[]; summary: string } | { ok: false; error: string }

type ChainRecord = {
  name: string
  governanceSafe: string
  feeController: string | null
  registry: string | null
  launchpadKit: string | null
  payToken: { address: string; symbol: string; decimals: number } | null
}

const MAX_BUILDER_FEE_PIPS = 4000 // Core's hard cap, 0.40%

export const gullyChainRecord = (chainId: string): ChainRecord | undefined =>
  (addresses as unknown as Record<string, ChainRecord>)[chainId]

const erc20 = new Interface(['function transfer(address to, uint256 amount)'])
const feeController = new Interface(['function setBuilderFee(uint16 newFee)', 'function cancelPendingBuilderFee()'])
const registry = new Interface(['function setListing(address hook, uint8 status, string reason)'])
const kit = new Interface(['function setLaunchFee(uint256 newFeeWei)', 'function cancelPendingLaunchFee()'])
const pausable = new Interface(['function pause()', 'function unpause()'])

const fail = (error: string): Built => ({ ok: false, error })
const call = (to: string, data: string): GullyCall => ({ to, value: '0', data })

/** "0.30" or "0,3%" to pips (1,000,000 = 100%), or null when it is not a number between 0 and 0.40. */
export const percentToPips = (text: string): number | null => {
  const t = text.trim().replace('%', '').replace(',', '.')
  if (!/^\d{1,2}(\.\d{1,4})?$/.test(t)) return null
  const pips = Math.round(Number(t) * 10000)
  return pips >= 0 && pips <= MAX_BUILDER_FEE_PIPS ? pips : null
}

const needController = (chainId: string): { to: string } | { error: string } => {
  const r = gullyChainRecord(chainId)
  if (!r) return { error: 'Gully Core has no record for this chain.' }
  if (!r.feeController) {
    return {
      error: `${r.name} runs an older Gully Core fee controller without a builder fee. Nothing to propose here.`,
    }
  }
  return { to: r.feeController }
}

export const buildSetBuilderFee = (chainId: string, percent: string): Built => {
  const c = needController(chainId)
  if ('error' in c) return fail(c.error)
  const pips = percentToPips(percent)
  if (pips === null) return fail('Enter a fee between 0% and 0.40%, for example 0.30.')
  return {
    ok: true,
    calls: [call(c.to, feeController.encodeFunctionData('setBuilderFee', [pips]))],
    summary: `Set the Gully Core builder fee to ${(pips / 10000).toFixed(2)}%`,
  }
}

export const buildCancelBuilderFee = (chainId: string): Built => {
  const c = needController(chainId)
  if ('error' in c) return fail(c.error)
  return {
    ok: true,
    calls: [call(c.to, feeController.encodeFunctionData('cancelPendingBuilderFee'))],
    summary: 'Cancel the scheduled Gully Core builder fee increase',
  }
}

const LISTING = { active: 0, deprecated: 1, malicious: 2 } as const
export type ListingStatus = keyof typeof LISTING

export const buildSetListing = (chainId: string, hook: string, status: ListingStatus, reason: string): Built => {
  const r = gullyChainRecord(chainId)
  if (!r?.registry) return fail('Gully Core has no registry record for this chain.')
  if (!isAddress(hook)) return fail('Enter the hook address.')
  if (!(status in LISTING)) return fail('Pick a listing status.')
  if (status !== 'active' && reason.trim().length < 3) return fail('Give a short reason for the listing change.')
  return {
    ok: true,
    calls: [
      call(r.registry, registry.encodeFunctionData('setListing', [getAddress(hook), LISTING[status], reason.trim()])),
    ],
    summary: `Mark hook ${getAddress(hook)} as ${status} in the Gully Core registry`,
  }
}

export const buildSetLaunchFee = (chainId: string, amount: string, decimals = 18): Built => {
  const r = gullyChainRecord(chainId)
  if (!r?.launchpadKit) return fail('Gully Core has no launch kit record for this chain.')
  let wei: bigint
  try {
    if (!/^\d+(\.\d+)?$/.test(amount.trim())) throw new Error('bad')
    wei = parseUnits(amount.trim(), decimals)
  } catch {
    return fail('Enter the launch fee as a number, for example 0.001.')
  }
  return {
    ok: true,
    calls: [call(r.launchpadKit, kit.encodeFunctionData('setLaunchFee', [wei]))],
    summary: `Set the Gully Core launch fee to ${amount.trim()}`,
  }
}

export const buildPause = (target: string, paused: boolean): Built => {
  if (!isAddress(target)) return fail('Enter the address of the contract.')
  return {
    ok: true,
    calls: [call(getAddress(target), pausable.encodeFunctionData(paused ? 'pause' : 'unpause'))],
    summary: `${paused ? 'Pause' : 'Unpause'} ${getAddress(target)}`,
  }
}

export type PayoutRow = { recipient: string; amount: string }

/** "0xabc… 12.5" or "0xabc…,12.5" lines to rows. Blank lines are skipped. */
export const parsePayoutLines = (text: string): PayoutRow[] =>
  text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean)
    .map((l) => {
      const [recipient = '', amount = ''] = l.split(/[\s,;\t]+/)
      return { recipient, amount }
    })

export const MAX_PAYOUT_ROWS = 100

/** One ERC-20 transfer per row, sent from the Safe in one MultiSend transaction. */
export const buildPayout = (token: string, decimals: number, symbol: string, rows: PayoutRow[]): Built => {
  if (!isAddress(token)) return fail('Enter the token address.')
  if (rows.length === 0) return fail('Add at least one payout: an address and an amount per line.')
  if (rows.length > MAX_PAYOUT_ROWS) return fail(`At most ${MAX_PAYOUT_ROWS} payouts in one transaction.`)
  const calls: GullyCall[] = []
  let total = 0n
  for (let i = 0; i < rows.length; i++) {
    const { recipient, amount } = rows[i]
    if (!isAddress(recipient)) return fail(`Line ${i + 1}: "${recipient}" is not an address.`)
    let units: bigint
    try {
      if (!/^\d+(\.\d+)?$/.test(amount)) throw new Error('bad')
      units = parseUnits(amount, decimals)
    } catch {
      return fail(`Line ${i + 1}: "${amount}" is not an amount.`)
    }
    if (units === 0n) return fail(`Line ${i + 1}: the amount is zero.`)
    total += units
    calls.push(call(getAddress(token), erc20.encodeFunctionData('transfer', [getAddress(recipient), units])))
  }
  return {
    ok: true,
    calls,
    summary: `Pay ${formatUnits(total, decimals)} ${symbol} to ${rows.length} recipient${rows.length === 1 ? '' : 's'}`,
  }
}
