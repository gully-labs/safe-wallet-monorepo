/**
 * Gully Multisig: plain-language decoding of a Safe transaction's calldata for the contracts Gully runs (Gully Core
 * fee controller, launch kit, registry; Gully Pay escrow, treasury vault, swap-and-pay) and for ERC-20 calls.
 *
 * Read-only and local: it only turns `to` + `data` into a sentence ("Set the Gully Core builder fee to 0.30%",
 * "Pay 500 USDC.e to 0x12…ab"). It never decides whether a transaction is allowed and never replaces the raw
 * calldata, which stays on screen. Unknown selectors return null. Function lists come from the Gully Core fee
 * controller V5 / kit V2 / registry (gully-core, gully-core-app abis.ts) and the Gully Pay contracts (gull-pay).
 */
import { Interface, formatUnits, MaxUint256, type Result } from 'ethers'

export type TokenMeta = { symbol: string; decimals: number }

export type DecodeContext = {
  /** Token symbol and decimals for an address, when known. */
  token?: (address: string) => TokenMeta | undefined
  /** A saved name for an address (address book, ENS, .gully), when known. */
  name?: (address: string) => string | undefined
  /** The chain's native coin, for amounts sent with the call. */
  native?: TokenMeta
}

export type Described = {
  /** One sentence, e.g. "Set the Gully Core builder fee to 0.30%". */
  title: string
  /** Extra lines (what the call does, what it needs). */
  lines: string[]
  /** `careful` means the action is hard or impossible to undo, or gives wide permission. */
  level: 'normal' | 'careful'
  group: 'erc20' | 'gully-core' | 'gully-pay' | 'access'
  /** Token addresses the sentence mentioned without a symbol: the hook may look them up and decode again. */
  needsToken: string[]
}

const POOL_KEY =
  'tuple(address currency0, address currency1, address hooks, address poolManager, uint24 fee, bytes32 parameters)'

const SIGS: string[] = [
  // ERC-20
  'function transfer(address to, uint256 amount)',
  'function approve(address spender, uint256 amount)',
  'function transferFrom(address from, address to, uint256 amount)',
  // Gully Core fee controller V5 (and V2 collect)
  'function setBuilderFee(uint16 newFee)',
  'function cancelPendingBuilderFee()',
  'function addZeroFeeHook(address hook)',
  'function scheduleZeroFeeHookRemoval(address hook)',
  'function cancelZeroFeeHookRemoval(address hook)',
  `function setPoolProtocolFee(address poolManager, ${POOL_KEY} key, uint24 newProtocolFee)`,
  `function schedulePoolFeeRaise(address poolManager, ${POOL_KEY} key, uint24 newProtocolFee)`,
  `function executePoolFeeRaise(address poolManager, ${POOL_KEY} key)`,
  `function cancelPoolFeeRaise(address poolManager, ${POOL_KEY} key)`,
  `function syncPoolToPolicy(address poolManager, ${POOL_KEY} key)`,
  'function sweep(address poolManager, address currency)',
  'function collect(address poolManager, address currency, uint256 amount, address recipient)',
  'function rescueERC20(address token, address to)',
  // Gully Core launch kit V2 and registry
  'function setLaunchFee(uint256 newFeeWei)',
  'function cancelPendingLaunchFee()',
  'function setListing(address hook, uint8 status, string reason)',
  // Gully Pay escrow
  'function release(uint256 id)',
  'function confirm(uint256 id)',
  'function resolveByDefault(uint256 id)',
  'function refund(uint256 id, uint256 amount)',
  'function resolve(uint256 id, uint256 buyerAmount)',
  'function claim(address token)',
  'function claimTo(address token, address to)',
  'function setArbiter(address arbiter, bool enabled)',
  'function setThreshold(uint256 t)',
  'function setTokenAllowed(address token, bool allowed)',
  // Gully Pay treasury vault and swap-and-pay
  'function setFee(uint16 feeBps, address recipient)',
  'function setBuffer(uint16 bufferBps)',
  'function pauseDeposits(bool paused)',
  'function setSettlementToken(address token, bool allowed)',
  'function setInputToken(address token, bool allowed)',
  'function setSpokePool(address pool)',
  'function rescue(address token, address to, uint256 amount)',
  'function rescueToken(address token, address to, uint256 amount)',
  // shared admin
  'function pause()',
  'function unpause()',
  'function transferOwnership(address newOwner)',
  'function acceptOwnership()',
  'function renounceOwnership()',
  'function grantRole(bytes32 role, address account)',
  'function revokeRole(bytes32 role, address account)',
]

const iface = new Interface(SIGS)

const LISTING = ['Active', 'Deprecated', 'Malicious']

const short = (a: string): string => `${a.slice(0, 6)}…${a.slice(-4)}`

/** 0.30% from pips (1,000,000 = 100%): at least two decimals, at most four, no trailing noise. */
export const pipsToPercent = (pips: bigint | number): string => {
  const n = Number(pips) / 10000
  let s = n.toFixed(4)
  while (s.endsWith('0') && /\.\d{3,}$/.test(s)) s = s.slice(0, -1)
  return `${s}%`
}

/** Core packs a pool fee as two 12-bit pips values: low 12 bits zero-for-one, next 12 bits one-for-zero. */
export const unpackPoolFee = (packed: bigint | number): { zeroForOne: number; oneForZero: number } => {
  const p = BigInt(packed)
  return { zeroForOne: Number(p & 0xfffn), oneForZero: Number((p >> 12n) & 0xfffn) }
}

export const formatAmount = (value: bigint, decimals: number): string => {
  const s = formatUnits(value, decimals)
  const [int, frac = ''] = s.split('.')
  const grouped = int.replace(/\B(?=(\d{3})+(?!\d))/g, ',')
  const f = frac.replace(/0+$/, '').slice(0, 6)
  return f ? `${grouped}.${f}` : grouped
}

type Ctx = { c: DecodeContext; to: string; need: string[] }

const who = (x: Ctx, address: string): string => x.c.name?.(address) || short(address)

const tokenText = (x: Ctx, address: string): string => {
  const m = x.c.token?.(address)
  if (m) return m.symbol
  x.need.push(address)
  return `token ${short(address)}`
}

const amountText = (x: Ctx, token: string, value: bigint): string => {
  const m = x.c.token?.(token)
  if (m) return `${formatAmount(value, m.decimals)} ${m.symbol}`
  x.need.push(token)
  return `${value.toString()} units of token ${short(token)}`
}

const poolText = (x: Ctx, key: Result): string => `${tokenText(x, key.currency0)}/${tokenText(x, key.currency1)}`

const poolFeeText = (packed: bigint): string => {
  const { zeroForOne, oneForZero } = unpackPoolFee(packed)
  return zeroForOne === oneForZero
    ? pipsToPercent(zeroForOne)
    : `${pipsToPercent(zeroForOne)} one way and ${pipsToPercent(oneForZero)} the other`
}

type Rule = (a: Result, x: Ctx) => Omit<Described, 'needsToken' | 'group'> & { group?: Described['group'] }

const core = (title: string, lines: string[] = [], level: Described['level'] = 'normal') => ({
  title,
  lines,
  level,
  group: 'gully-core' as const,
})
const pay = (title: string, lines: string[] = [], level: Described['level'] = 'normal') => ({
  title,
  lines,
  level,
  group: 'gully-pay' as const,
})

const RULES: Record<string, Rule> = {
  transfer: (a, x) => ({
    title: `Pay ${amountText(x, x.to, a.amount)} to ${who(x, a.to)}`,
    lines: [`Recipient: ${a.to}`],
    level: 'normal',
    group: 'erc20',
  }),
  approve: (a, x) => {
    const unlimited = a.amount === MaxUint256
    return {
      title: unlimited
        ? `Let ${who(x, a.spender)} spend unlimited ${tokenText(x, x.to)}`
        : a.amount === 0n
          ? `Remove the spending allowance of ${who(x, a.spender)} on ${tokenText(x, x.to)}`
          : `Let ${who(x, a.spender)} spend up to ${amountText(x, x.to, a.amount)}`,
      lines: [`Spender: ${a.spender}`],
      level: unlimited ? 'careful' : 'normal',
      group: 'erc20',
    }
  },
  transferFrom: (a, x) => ({
    title: `Move ${amountText(x, x.to, a.amount)} from ${who(x, a.from)} to ${who(x, a.to)}`,
    lines: [`From: ${a.from}`, `To: ${a.to}`],
    level: 'normal',
    group: 'erc20',
  }),
  setBuilderFee: (a) =>
    core(`Set the Gully Core builder fee to ${pipsToPercent(a.newFee)}`, [
      'Applies to new pools. A lower fee applies at once. A higher fee only takes effect 7 days after it is scheduled.',
      'The Core cap is 0.40%.',
    ]),
  cancelPendingBuilderFee: () => core('Cancel the scheduled Gully Core builder fee increase'),
  addZeroFeeHook: (a, x) =>
    core(`Add ${who(x, a.hook)} to the Gully Core zero-fee hook list`, ['Pools on this hook pay no protocol fee.']),
  scheduleZeroFeeHookRemoval: (a, x) =>
    core(`Schedule removal of ${who(x, a.hook)} from the Gully Core zero-fee hook list`, [
      'It leaves the list after the notice period.',
    ]),
  cancelZeroFeeHookRemoval: (a, x) => core(`Keep ${who(x, a.hook)} on the Gully Core zero-fee hook list`),
  setPoolProtocolFee: (a, x) =>
    core(`Set the protocol fee of pool ${poolText(x, a.key)} to ${poolFeeText(a.newProtocolFee)}`, [
      'Applies at once. The controller refuses it if the fee would go up in either direction.',
    ]),
  schedulePoolFeeRaise: (a, x) =>
    core(`Schedule a protocol fee increase of pool ${poolText(x, a.key)} to ${poolFeeText(a.newProtocolFee)}`, [
      'It can be executed 7 days after it is scheduled.',
    ]),
  executePoolFeeRaise: (a, x) => core(`Execute the scheduled fee increase of pool ${poolText(x, a.key)}`),
  cancelPoolFeeRaise: (a, x) => core(`Cancel the scheduled fee increase of pool ${poolText(x, a.key)}`),
  syncPoolToPolicy: (a, x) => core(`Move pool ${poolText(x, a.key)} to the current Gully Core fee`),
  sweep: (a, x) =>
    core(`Send the collected Gully Core fees in ${tokenText(x, a.currency)} to the treasury`, [
      `Pool manager: ${a.poolManager}`,
    ]),
  collect: (a, x) =>
    core(`Collect ${amountText(x, a.currency, a.amount)} of Gully Core fees to ${who(x, a.recipient)}`),
  rescueERC20: (a, x) =>
    core(`Rescue ${tokenText(x, a.token)} stuck in the Gully Core fee controller to ${who(x, a.to)}`),
  setLaunchFee: (a, x) => {
    const n = x.c.native
    const fee = n ? `${formatAmount(a.newFeeWei, n.decimals)} ${n.symbol}` : `${a.newFeeWei.toString()} wei`
    return core(`Set the Gully Core launch fee to ${fee}`, ['A rise waits for the notice period.'])
  },
  cancelPendingLaunchFee: () => core('Cancel the scheduled Gully Core launch fee change'),
  setListing: (a, x) =>
    core(
      `Mark hook ${who(x, a.hook)} as ${LISTING[Number(a.status)] ?? `status ${a.status}`} in the Gully Core registry`,
      a.reason ? [`Reason: ${a.reason}`] : [],
      Number(a.status) === 2 ? 'careful' : 'normal',
    ),
  release: (a) => pay(`Release Gully Pay escrow #${a.id} to the seller`),
  confirm: (a) => pay(`Confirm Gully Pay escrow #${a.id}`),
  resolveByDefault: (a) => pay(`Settle the disputed Gully Pay escrow #${a.id} by the default outcome`),
  refund: (a) => pay(`Refund ${a.amount.toString()} units of Gully Pay escrow #${a.id} to the buyer`),
  resolve: (a) =>
    pay(
      `Resolve disputed Gully Pay escrow #${a.id}: ${a.buyerAmount.toString()} units to the buyer, the rest to the seller`,
    ),
  claim: (a, x) => pay(`Claim the ${tokenText(x, a.token)} balance owed to this Safe from Gully Pay`),
  claimTo: (a, x) =>
    pay(`Claim the ${tokenText(x, a.token)} balance owed to this Safe from Gully Pay and send it to ${who(x, a.to)}`),
  setArbiter: (a, x) => pay(`${a.enabled ? 'Allow' : 'Remove'} ${who(x, a.arbiter)} as a Gully Pay arbiter`),
  setThreshold: (a) => pay(`Set the Gully Pay escrow arbitration threshold to ${a.t.toString()}`),
  setTokenAllowed: (a, x) =>
    pay(`${a.allowed ? 'Allow' : 'Stop allowing'} ${tokenText(x, a.token)} in Gully Pay escrow`),
  setFee: (a, x) =>
    pay(
      `Set the Gully Pay treasury vault fee to ${(Number(a.feeBps) / 100).toFixed(2)}% paid to ${who(x, a.recipient)}`,
    ),
  setBuffer: (a) => pay(`Set the Gully Pay treasury vault cash buffer to ${(Number(a.bufferBps) / 100).toFixed(2)}%`),
  pauseDeposits: (a) => pay(`${a.paused ? 'Pause' : 'Resume'} deposits into the Gully Pay treasury vault`),
  setSettlementToken: (a, x) =>
    pay(`${a.allowed ? 'Allow' : 'Stop allowing'} ${tokenText(x, a.token)} as a Gully Pay settlement token`),
  setInputToken: (a, x) =>
    pay(`${a.allowed ? 'Allow' : 'Stop allowing'} ${tokenText(x, a.token)} as a Gully Pay input token`),
  setSpokePool: (a, x) => pay(`Set the Gully Pay cross-chain spoke pool to ${who(x, a.pool)}`, [], 'careful'),
  rescue: (a, x) => pay(`Rescue ${amountText(x, a.token, a.amount)} from the contract to ${who(x, a.to)}`),
  rescueToken: (a, x) => pay(`Rescue ${amountText(x, a.token, a.amount)} from the contract to ${who(x, a.to)}`),
  pause: () => ({
    title: 'Pause the contract',
    lines: ['Stops its normal operations until it is unpaused.'],
    level: 'normal',
    group: 'access',
  }),
  unpause: () => ({ title: 'Unpause the contract', lines: [], level: 'normal', group: 'access' }),
  transferOwnership: (a, x) => ({
    title: `Hand ownership of the contract to ${who(x, a.newOwner)}`,
    lines: ['With a two-step owner the new owner must still accept it.'],
    level: 'careful',
    group: 'access',
  }),
  acceptOwnership: () => ({ title: 'Accept ownership of the contract', lines: [], level: 'careful', group: 'access' }),
  renounceOwnership: () => ({
    title: 'Give up ownership of the contract for good',
    lines: ['Nobody can use the owner powers afterwards.'],
    level: 'careful',
    group: 'access',
  }),
  grantRole: (a, x) => ({
    title: `Grant role ${short(a.role)} to ${who(x, a.account)}`,
    lines: [`Role: ${a.role}`],
    level: 'careful',
    group: 'access',
  }),
  revokeRole: (a, x) => ({
    title: `Revoke role ${short(a.role)} from ${who(x, a.account)}`,
    lines: [`Role: ${a.role}`],
    level: 'normal',
    group: 'access',
  }),
}

/** Turns a call into a sentence, or null when the selector is not one we know or the arguments do not parse. */
export const describeCall = (
  call: { to: string; data?: string | null; value?: string | bigint | null },
  ctx: DecodeContext = {},
): Described | null => {
  const data = call.data ?? '0x'
  if (data.length < 10) return null
  let parsed
  try {
    parsed = iface.parseTransaction({ data })
  } catch {
    return null
  }
  const rule = parsed && RULES[parsed.name]
  if (!parsed || !rule) return null
  const need: string[] = []
  try {
    const d = rule(parsed.args, { c: ctx, to: call.to, need })
    return {
      title: d.title,
      lines: d.lines,
      level: d.level,
      group: d.group ?? 'access',
      needsToken: Array.from(new Set(need)),
    }
  } catch {
    return null
  }
}

const QUEUE_LABELS: Record<string, string> = {
  setBuilderFee: 'Set Gully Core builder fee',
  cancelPendingBuilderFee: 'Cancel builder fee increase',
  setPoolProtocolFee: 'Set pool fee',
  schedulePoolFeeRaise: 'Schedule pool fee increase',
  executePoolFeeRaise: 'Execute pool fee increase',
  cancelPoolFeeRaise: 'Cancel pool fee increase',
  syncPoolToPolicy: 'Move pool to current fee',
  addZeroFeeHook: 'Add zero-fee hook',
  scheduleZeroFeeHookRemoval: 'Schedule zero-fee hook removal',
  cancelZeroFeeHookRemoval: 'Keep zero-fee hook',
  sweep: 'Send collected fees to treasury',
  setLaunchFee: 'Set Gully Core launch fee',
  setListing: 'Set hook listing',
  release: 'Release Gully Pay escrow',
  refund: 'Refund Gully Pay escrow',
  resolve: 'Resolve Gully Pay dispute',
  claim: 'Claim from Gully Pay',
  claimTo: 'Claim from Gully Pay',
  pauseDeposits: 'Pause or resume vault deposits',
}

/** A short queue label for a method name (the queue row only carries the name), or null to keep the gateway's. */
export const queueLabel = (methodName?: string | null): string | null =>
  methodName ? (QUEUE_LABELS[methodName] ?? null) : null
