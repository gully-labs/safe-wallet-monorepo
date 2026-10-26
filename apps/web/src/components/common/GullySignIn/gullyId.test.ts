import { __resetGullyIdForTests, DEFAULT_GULLY_ID_ISSUER, getGullyIdConfig, loadGullyId } from './gullyId'

type WithGully = Window & { GullyID?: unknown }

describe('gullyId', () => {
  beforeEach(() => {
    __resetGullyIdForTests()
    delete (window as WithGully).GullyID
    document.head.innerHTML = ''
  })

  it('is off unless a client id is set', () => {
    expect(getGullyIdConfig()).toBeNull()
    expect(getGullyIdConfig('  ')).toBeNull()
    expect(getGullyIdConfig('gully-safe')).toEqual({ clientId: 'gully-safe', issuer: DEFAULT_GULLY_ID_ISSUER })
    expect(getGullyIdConfig('gully-safe', 'http://localhost:4444/')?.issuer).toBe('http://localhost:4444')
  })

  it('loads nothing when off', async () => {
    await expect(loadGullyId(null)).resolves.toBeNull()
    expect(document.head.querySelector('script')).toBeNull()
  })

  it('adds the SDK script once and resolves null when it fails to load', async () => {
    const cfg = { clientId: 'gully-safe', issuer: DEFAULT_GULLY_ID_ISSUER }
    const first = loadGullyId(cfg)
    expect(loadGullyId(cfg)).toBe(first)
    const scripts = document.head.querySelectorAll('script')
    expect(scripts).toHaveLength(1)
    expect(scripts[0].src).toBe('https://id.gullychain.xyz/sdk.js')
    scripts[0].dispatchEvent(new Event('error'))
    await expect(first).resolves.toBeNull()
  })

  it('inits the client with the configured client id', async () => {
    const client = { renderButton: jest.fn() }
    const init = jest.fn(() => client)
    ;(window as WithGully).GullyID = { init }
    await expect(loadGullyId({ clientId: 'gully-safe', issuer: DEFAULT_GULLY_ID_ISSUER })).resolves.toBe(client)
    expect(init).toHaveBeenCalledWith({ clientId: 'gully-safe', issuer: DEFAULT_GULLY_ID_ISSUER })
  })
})
