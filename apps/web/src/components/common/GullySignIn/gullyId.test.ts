import {
  __resetGullyIdForTests,
  DEFAULT_GULLY_ID_CLIENT_ID,
  DEFAULT_GULLY_ID_ISSUER,
  getGullyIdConfig,
  loadGullyId,
  markGullyIdFlag,
  sdkUrls,
} from './gullyId'

type WithGully = Window & { GullyID?: unknown }

describe('gullyId', () => {
  beforeEach(() => {
    __resetGullyIdForTests()
    delete (window as WithGully).GullyID
    document.head.innerHTML = ''
  })

  it('is on by default with the Gully Safe client and the gullyid.xyz issuer', () => {
    expect(DEFAULT_GULLY_ID_CLIENT_ID).toBe('gully-safe')
    expect(DEFAULT_GULLY_ID_ISSUER).toBe('https://gullyid.xyz')
    expect(getGullyIdConfig()).toEqual({ clientId: 'gully-safe', issuer: 'https://gullyid.xyz' })
    expect(getGullyIdConfig('on', '  ', ' ')).toEqual({ clientId: 'gully-safe', issuer: 'https://gullyid.xyz' })
    expect(getGullyIdConfig('on', 'other-app', 'http://localhost:4444/')).toEqual({
      clientId: 'other-app',
      issuer: 'http://localhost:4444',
    })
  })

  it('is off only when the flag says off', () => {
    for (const v of ['off', 'OFF', 'false', '0', 'no', ' off ']) expect(getGullyIdConfig(v)).toBeNull()
  })

  it('never defaults to the retired id.gullychain.xyz host', () => {
    expect(JSON.stringify(getGullyIdConfig())).not.toContain('id.gullychain.xyz')
  })

  it('publishes the flag on <html>', () => {
    markGullyIdFlag(getGullyIdConfig())
    expect(document.documentElement.dataset.gullyId).toBe('on')
    expect(document.documentElement.dataset.gullyIdClient).toBe('gully-safe')
    markGullyIdFlag(null)
    expect(document.documentElement.dataset.gullyId).toBe('off')
    expect(document.documentElement.dataset.gullyIdClient).toBeUndefined()
  })

  it('loads nothing when off', async () => {
    await expect(loadGullyId(null)).resolves.toBeNull()
    expect(document.head.querySelector('script')).toBeNull()
  })

  it('tries /sdk/v1.js first, falls back to /sdk.js, and resolves null when both fail', async () => {
    expect(sdkUrls('https://gullyid.xyz')).toEqual(['https://gullyid.xyz/sdk/v1.js', 'https://gullyid.xyz/sdk.js'])
    const cfg = { clientId: 'gully-safe', issuer: DEFAULT_GULLY_ID_ISSUER }
    const first = loadGullyId(cfg)
    expect(loadGullyId(cfg)).toBe(first)
    let s = document.head.querySelector('script') as HTMLScriptElement
    expect(s.src).toBe('https://gullyid.xyz/sdk/v1.js')
    s.dispatchEvent(new Event('error'))
    s = document.head.querySelector('script') as HTMLScriptElement
    expect(s.src).toBe('https://gullyid.xyz/sdk.js')
    s.dispatchEvent(new Event('error'))
    await expect(first).resolves.toBeNull()
  })

  it('inits the client from the fallback script', async () => {
    const client = { renderButton: jest.fn() }
    const init = jest.fn(() => client)
    const cfg = { clientId: 'gully-safe', issuer: DEFAULT_GULLY_ID_ISSUER }
    const p = loadGullyId(cfg)
    ;(document.head.querySelector('script') as HTMLScriptElement).dispatchEvent(new Event('error'))
    ;(window as WithGully).GullyID = { init }
    ;(document.head.querySelector('script') as HTMLScriptElement).dispatchEvent(new Event('load'))
    await expect(p).resolves.toBe(client)
    expect(init).toHaveBeenCalledWith({ clientId: 'gully-safe', issuer: DEFAULT_GULLY_ID_ISSUER })
  })

  it('reuses an already loaded SDK', async () => {
    const client = { renderButton: jest.fn() }
    ;(window as WithGully).GullyID = { init: () => client }
    await expect(loadGullyId({ clientId: 'gully-safe', issuer: DEFAULT_GULLY_ID_ISSUER })).resolves.toBe(client)
    expect(document.head.querySelector('script')).toBeNull()
  })
})
