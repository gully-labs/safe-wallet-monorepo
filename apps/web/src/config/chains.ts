import { networks } from '@safe-global/protocol-kit/dist/src/utils/eip-3770/config'

/**
 * A static shortName<->chainId dictionary
 * E.g.:
 *
 * {
 *   eth: '1',
 *   gor: '5',
 *   ...
 * }
 */
type Chains = Record<string, string>

/**
 * Gully Multisig: the served chains' short names (the Gully Config Service's `shortName`s). They are not in the
 * protocol-kit list, so until the chain configs had loaded a `?safe=elysium:0x…` link resolved to the default chain
 * and the app asked Gully Chain Testnet's gateway for a Safe that lives on another chain (404 from our own gateway).
 * Keep in sync with gully-ops l3/safe/chains/<chainId>.json.
 */
export const GULLY_SHORT_NAMES: Chains = {
  'gully-test': '485590',
  anubis: '6714',
  elysium: '99901',
  robinhood: '4663',
}

const chains = networks.reduce<Chains>(
  (result, { shortName, chainId }) => {
    // The Gully names win: a served chain is never read under another chain's id
    if (!(shortName in GULLY_SHORT_NAMES)) result[shortName] = chainId.toString()
    return result
  },
  { ...GULLY_SHORT_NAMES },
)

export default chains
