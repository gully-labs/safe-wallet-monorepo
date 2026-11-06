import { createElement, useCallback, useEffect, useMemo, useRef, useState, type ReactElement } from 'react'
import Script from 'next/script'
import Head from 'next/head'
import { formatEther } from 'ethers'
import WelcomeLogin from '@/components/welcome/WelcomeLogin'
import { GATEWAY_URL_PRODUCTION } from '@/config/constants'
import { CountUp, CumulativeChart, DailyColumns } from './charts'
import { Icon, type IconName } from './icons'
import Mascot from './Mascot'
import Footer from '@/components/common/Footer'
import { GULLY_EXPLORER, useGullySafeStats, type SafeCreation } from './useGullySafeStats'
import css from './styles.module.css'
import { GULLY_PRIVACY_URL, GULLY_TERMS_URL } from '@/config/gully'

/**
 * Gully Multisig landing (/welcome): marketing copy, the connect card, live Safe numbers and the mascot. The app serves
 * Anubis Network (6714, a mainnet) and Gully Chain Testnet (485590): the copy names both, and what is only on the
 * testnet (passkey signer contracts, the 4337 module and paymaster, the live numbers) says so.
 */

const DOCS_SAFE = 'https://docs.gullychain.xyz/safe/'
const BRIDGE = 'https://testnet-bridge.gullychain.xyz/'
const EXT = { target: '_blank', rel: 'noopener noreferrer' } as const

const BENEFITS: { icon: IconName; title: string; text: string }[] = [
  {
    icon: 'users',
    title: 'Multi-signature by design',
    text: 'Add owners and pick a threshold, like 2 of 3. No single lost key or rogue signer can move the funds.',
  },
  {
    icon: 'keyRound',
    title: 'Passkey signers',
    text: 'The Safe WebAuthn signer contracts are live on Gully Chain Testnet, so a device passkey can be an owner of a Safe there.',
  },
  {
    icon: 'fuel',
    title: 'Gas sponsorship ready',
    text: "Safe's ERC-4337 module and the Gully paymaster run on Gully Chain Testnet, so apps can pay their users' gas there.",
  },
  {
    icon: 'shieldCheck',
    title: 'Unmodified Safe 1.4.1 contracts',
    text: 'The unmodified Safe 1.4.1 contracts: at the canonical addresses on Anubis Network, source-verified on verify.gullychain.xyz.',
  },
]

const FAQ = [
  {
    q: 'What is Gully Multisig?',
    a: "Gully Multisig is Gully Labs' build of Safe{Wallet}: a multi-signature smart account where a set of owners shares control and a transaction needs a threshold of their signatures. It is run by Gully Labs, not by Safe.",
  },
  {
    q: 'Which networks does it serve?',
    a: 'Anubis Network (chain id 6714, a mainnet) and Gully Chain Testnet (chain id 485590, for developers). On Anubis Network the native coin gasDAI pays gas only and cannot be sent: a Safe there holds and moves ERC-20 tokens.',
  },
  {
    q: 'Are the contracts the official Safe contracts?',
    a: 'Yes. They are the unmodified Safe 1.4.1 contracts. On Anubis Network they are at the canonical addresses; on Gully Chain Testnet they were deployed through a deterministic deployer, creation code checked against the published artifacts. The addresses are listed in the Gully Chain docs.',
  },
  {
    q: 'What does it cost?',
    a: 'Gully Multisig is free. Creating a Safe and executing transactions cost gas on the chain you use: gasDAI on Anubis Network, test ETH on Gully Chain Testnet.',
  },
  {
    q: 'Can I watch a Safe without owning it?',
    a: 'Yes. Use "Watch any account" with a Safe address to follow its balances and transactions read-only.',
  },
]

const short = (a: string) => `${a.slice(0, 6)}…${a.slice(-4)}`

const timeAgo = (t: number) => {
  const s = Math.max(0, Math.round((Date.now() - t) / 1000))
  if (s < 60) return `${s}s ago`
  if (s < 3600) return `${Math.floor(s / 60)}m ago`
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`
  return `${Math.floor(s / 86400)}d ago`
}

const DAY = 86_400_000
const startOfDay = (t: number) => {
  const d = new Date(t)
  d.setHours(0, 0, 0, 0)
  return d.getTime()
}

type SafeInfo = { threshold: number; owners: number; nonce: number }

/** Threshold, owners and nonce of the latest Safes from our Client Gateway (best effort). */
const useSafeInfos = (safes: SafeCreation[]): Record<string, SafeInfo> => {
  const [infos, setInfos] = useState<Record<string, SafeInfo>>({})
  const key = safes.map((s) => s.address).join(',')
  useEffect(() => {
    if (!key) return
    const ctrl = new AbortController()
    key.split(',').forEach(async (addr) => {
      try {
        const res = await fetch(`${GATEWAY_URL_PRODUCTION}/v1/chains/485590/safes/${addr}`, { signal: ctrl.signal })
        if (!res.ok) return
        const j = (await res.json()) as { threshold: number; owners: unknown[]; nonce: number }
        setInfos((prev) => ({ ...prev, [addr]: { threshold: j.threshold, owners: j.owners.length, nonce: j.nonce } }))
      } catch {
        // the table shows a dash
      }
    })
    return () => ctrl.abort()
  }, [key])
  return infos
}

const LiveSection = ({ onNewSafe }: { onNewSafe: () => void }): ReactElement => {
  const { data, error, loading } = useGullySafeStats()
  const lastCount = useRef<number | null>(null)

  useEffect(() => {
    if (!data) return
    if (lastCount.current !== null && data.safes.length > lastCount.current) onNewSafe()
    lastCount.current = data.safes.length
  }, [data, onNewSafe])

  const cumulative = useMemo(() => (data?.safes ?? []).map((s, i) => ({ t: s.timestamp, v: i + 1 })), [data])

  const daily = useMemo(() => {
    const today = startOfDay(Date.now())
    const days = Array.from({ length: 14 }, (_, i) => ({ day: today - (13 - i) * DAY, v: 0 }))
    for (const e of data?.executions ?? []) {
      const idx = Math.round((startOfDay(e.timestamp) - days[0].day) / DAY)
      if (idx >= 0 && idx < days.length) days[idx].v += 1
    }
    return days
  }, [data])

  const latest = useMemo(() => (data?.safes ?? []).slice(-5).reverse(), [data])
  const infos = useSafeInfos(latest)
  const held = data ? Number(formatEther(data.heldWei)) : 0

  const tiles = [
    {
      label: 'Safes on Gully Chain',
      value: data?.safes.length ?? 0,
      fmt: (n: number) => Math.round(n).toLocaleString('en-US'),
    },
    {
      label: 'Transactions executed',
      value: data?.executions.length ?? 0,
      fmt: (n: number) => Math.round(n).toLocaleString('en-US'),
    },
    {
      label: 'ETH held in Safes',
      value: held,
      fmt: (n: number) => n.toLocaleString('en-US', { maximumFractionDigits: 4 }),
    },
    { label: 'Latest block', value: data?.head ?? 0, fmt: (n: number) => Math.round(n).toLocaleString('en-US') },
  ]

  return (
    <section className={css.section} aria-labelledby="live-title">
      <div className={css.sectionHead}>
        <p className={css.eyebrow}>
          <span className={`${css.liveDot} ${error && !data ? css.liveDotOff : ''}`} aria-hidden />
          {error && !data ? 'Live data unavailable' : 'Live from Gully Chain Testnet'}
        </p>
        <h2 id="live-title" className={css.h2}>
          Safes on Gully Chain, block by block
        </h2>
        <p className={css.sub}>
          Read straight from the chain: every Safe the Safe 1.4.1 factories created, the transactions those Safes
          executed and the ETH they hold. Refreshes every 20 seconds.
        </p>
      </div>

      <div className={css.tiles}>
        {tiles.map((t) => (
          <div key={t.label} className={css.tile}>
            <span className={css.tileLabel}>{t.label}</span>
            <span className={css.tileValue}>
              {loading && !data ? <span className={css.skel} /> : <CountUp value={t.value} format={t.fmt} />}
            </span>
          </div>
        ))}
      </div>

      <div className={css.charts}>
        <div className={css.panel}>
          <h3 className={css.panelTitle}>Safes created, total</h3>
          {loading && !data ? (
            <div className={css.chartSkel} />
          ) : cumulative.length === 0 ? (
            <div className={css.empty}>
              <Icon name="activity" />
              <span>
                {error ? 'Could not reach the Gully Chain RPC. Retrying…' : 'No Safes yet. Yours can be the first.'}
              </span>
            </div>
          ) : (
            <CumulativeChart points={cumulative} label="Safes created on Gully Chain, running total" />
          )}
        </div>
        <div className={css.panel}>
          <h3 className={css.panelTitle}>Safe transactions per day, last 14 days</h3>
          {loading && !data ? (
            <div className={css.chartSkel} />
          ) : (data?.executions.length ?? 0) === 0 ? (
            <div className={css.empty}>
              <Icon name="activity" />
              <span>No Safe transactions executed yet.</span>
            </div>
          ) : (
            <DailyColumns bars={daily} label="Safe transactions executed per day" unit="transactions" />
          )}
        </div>
      </div>

      {latest.length > 0 && (
        <div className={css.panel}>
          <h3 className={css.panelTitle}>Latest Safes</h3>
          <table className={css.table}>
            <thead>
              <tr>
                <th scope="col">Safe</th>
                <th scope="col">Signers</th>
                <th scope="col">Txs (nonce)</th>
                <th scope="col">Created</th>
              </tr>
            </thead>
            <tbody>
              {latest.map((s) => {
                const info = infos[s.address]
                return (
                  <tr key={s.address}>
                    <td data-label="Safe">
                      <a href={`${GULLY_EXPLORER}/address/${s.address}`} {...EXT} className={css.mono}>
                        {short(s.address)}
                      </a>
                    </td>
                    <td data-label="Signers">{info ? `${info.threshold} of ${info.owners}` : '–'}</td>
                    <td data-label="Txs (nonce)">{info ? info.nonce : '–'}</td>
                    <td data-label="Created">
                      <a href={`${GULLY_EXPLORER}/tx/${s.tx}`} {...EXT}>
                        {timeAgo(s.timestamp)}
                      </a>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  )
}

const GullyLanding = (): ReactElement => {
  const [celebrateKey, setCelebrateKey] = useState(0)
  const onNewSafe = useCallback(() => setCelebrateKey((k) => k + 1), [])

  const jsonLd = useMemo(
    () =>
      JSON.stringify([
        {
          '@context': 'https://schema.org',
          '@type': 'SoftwareApplication',
          name: 'Gully Multisig',
          applicationCategory: 'FinanceApplication',
          operatingSystem: 'Web',
          url: 'https://multisig.gullychain.xyz/welcome',
          description:
            'Multi-signature Safe smart accounts on Anubis Network and Gully Chain Testnet, on the unmodified Safe 1.4.1 contracts.',
          offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
          publisher: { '@type': 'Organization', name: 'Gully Labs', url: 'https://gullylabs.xyz' },
        },
        {
          '@context': 'https://schema.org',
          '@type': 'FAQPage',
          mainEntity: FAQ.map((f) => ({
            '@type': 'Question',
            name: f.q,
            acceptedAnswer: { '@type': 'Answer', text: f.a },
          })),
        },
      ]),
    [],
  )

  return (
    <div className={css.page}>
      <Head>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd }} />
      </Head>
      {/* GullyChain product switcher 1.8.3 (gully-ops sites/_shared/gc-switcher, byte-identical copy; kit v4 dark theme) */}
      <Script src="/assets/gc-switcher.js" strategy="afterInteractive" />

      <header className={css.topbar}>
        <div className={css.topbarInner}>
          {createElement('gc-switcher', { current: 'safe', theme: 'dark' })}
          <nav className={css.topnav} aria-label="Gully Multisig links">
            <a href={DOCS_SAFE} {...EXT}>
              <Icon name="bookOpen" size={18} /> Docs
            </a>
            <a href={GULLY_EXPLORER} {...EXT}>
              <Icon name="search" size={18} /> Explorer
            </a>
            <a href={BRIDGE} {...EXT}>
              <Icon name="arrowLeftRight" size={18} /> Bridge
            </a>
          </nav>
          <a href="https://dev.gullychain.xyz/quickstart/" className={css.btnPrimary}>
            <Icon name="rocket" size={16} /> Start building
          </a>
        </div>
      </header>

      <main>
        <section className={css.hero}>
          <div className={css.heroCopy}>
            <p className={css.eyebrow}>Anubis Network · Gully Chain Testnet · Safe 1.4.1</p>
            <h1 className={css.h1}>
              Shared wallets, <span className={css.grad}>many signers</span>
            </h1>
            <p className={css.lead}>
              Owners propose, a threshold signs, the Safe executes. The unmodified Safe 1.4.1 contracts, on Anubis
              Network and Gully Chain Testnet.
            </p>
            <div id="get-started" className={css.loginWrap}>
              <WelcomeLogin />
              <p className={css.loginHint}>
                On Anubis Network gasDAI pays gas only; tokens are ERC-20.{' '}
                <a href={DOCS_SAFE} {...EXT}>
                  Read the docs
                </a>
              </p>
              <p className={css.loginHint} style={{ paddingTop: 0 }} data-testid="gully-legal-consent">
                By continuing you agree to the{' '}
                <a href={GULLY_TERMS_URL} {...EXT}>
                  Gully Chain Terms
                </a>{' '}
                and{' '}
                <a href={GULLY_PRIVACY_URL} {...EXT}>
                  Privacy Policy
                </a>
                .
              </p>
            </div>
          </div>
          <div className={css.heroArt}>
            <Mascot celebrateKey={celebrateKey} />
          </div>
        </section>

        <LiveSection onNewSafe={onNewSafe} />

        <section className={css.section} aria-labelledby="why-title">
          <div className={css.sectionHead}>
            <p className={css.eyebrow}>Why Gully Multisig</p>
            <h2 id="why-title" className={css.h2}>
              Shared custody without the trust fall
            </h2>
          </div>
          <div className={css.cards}>
            {BENEFITS.map((b) => (
              <div key={b.title} className={css.card}>
                <span className={css.cardIcon}>
                  <Icon name={b.icon} size={22} />
                </span>
                <h3 className={css.cardTitle}>{b.title}</h3>
                <p className={css.cardText}>{b.text}</p>
              </div>
            ))}
          </div>
        </section>

        <section className={css.section} aria-labelledby="faq-title">
          <div className={css.sectionHead}>
            <p className={css.eyebrow}>FAQ</p>
            <h2 id="faq-title" className={css.h2}>
              Questions, answered
            </h2>
          </div>
          <div className={css.faq}>
            {FAQ.map((f) => (
              <details key={f.q} className={css.faqItem}>
                <summary>
                  <span>{f.q}</span>
                  <Icon name="chevronDown" size={18} className={css.chev} />
                </summary>
                <p>{f.a}</p>
              </details>
            ))}
          </div>
        </section>
      </main>

      <Footer forceShow versionIcon={false} helpCenter={false} preferences={false} className={css.footer} />
    </div>
  )
}

export default GullyLanding
