import { createElement, useCallback, useEffect, useMemo, useRef, useState, type ReactElement } from 'react'
import Script from 'next/script'
import Head from 'next/head'
import { formatEther } from 'ethers'
import WelcomeLogin from '@/components/welcome/WelcomeLogin'
import Footer from '@/components/common/Footer'
import { GATEWAY_URL_PRODUCTION } from '@/config/constants'
import { CountUp, CumulativeChart, DailyColumns } from './charts'
import { Icon, type IconName } from './icons'
import Mascot from './Mascot'
import { GULLY_EXPLORER, useGullySafeStats, type SafeCreation } from './useGullySafeStats'
import css from './styles.module.css'

/** Gully Safe landing (/welcome): marketing copy, the connect card, live Safe numbers from Gully Chain and the mascot. */

const DOCS_SAFE = 'https://docs.gullychain.xyz/safe/'
const BRIDGE = 'https://testnet-bridge.gullychain.xyz/'
const FAUCET = 'https://faucet.gullychain.xyz/'
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
    text: 'The Safe WebAuthn signer contracts are live on Gully Chain, so a device passkey can be an owner of a Safe.',
  },
  {
    icon: 'fuel',
    title: 'Gas sponsorship ready',
    text: "Safe's ERC-4337 module and the Gully paymaster run on Gully Chain, so apps can pay their users' gas.",
  },
  {
    icon: 'shieldCheck',
    title: 'Audited Safe 1.4.1 code',
    text: 'The same Safe 1.4.1 contracts that secure billions on Ethereum, byte for byte, deployed on Gully Chain.',
  },
]

const STEPS = [
  { title: 'Connect a wallet', text: 'Any browser wallet on Gully Chain Testnet. Get free test ETH from the faucet.' },
  { title: 'Add owners and a threshold', text: 'Name the Safe, add the owner addresses and choose how many must sign.' },
  { title: 'Deploy and use it', text: 'One transaction creates the Safe. Then receive, propose, sign and execute.' },
]

const FAQ = [
  {
    q: 'What is Gully Safe?',
    a: "Gully Safe is Gully Labs' build of Safe{Wallet} for Gully Chain: a multi-signature smart account where a set of owners shares control and a transaction needs a threshold of their signatures.",
  },
  {
    q: 'Which network does it run on?',
    a: 'Gully Chain Testnet (chain id 485590), an L3 that settles to Arbitrum. Mainnet support follows when Gully Chain mainnet launches.',
  },
  {
    q: 'Are the contracts the official Safe contracts?',
    a: 'Yes. They are the unmodified Safe 1.4.1 contracts (creation code checked against the published artifacts), deployed through a deterministic deployer. Their addresses are listed in the Gully Chain docs.',
  },
  {
    q: 'What does it cost?',
    a: 'Gully Safe is free. Creating a Safe and executing transactions cost a small amount of gas in testnet ETH, which the faucet hands out.',
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
    { label: 'Safes on Gully Chain', value: data?.safes.length ?? 0, fmt: (n: number) => Math.round(n).toLocaleString('en-US') },
    { label: 'Transactions executed', value: data?.executions.length ?? 0, fmt: (n: number) => Math.round(n).toLocaleString('en-US') },
    { label: 'ETH held in Safes', value: held, fmt: (n: number) => n.toLocaleString('en-US', { maximumFractionDigits: 4 }) },
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
              <span>{error ? 'Could not reach the Gully Chain RPC. Retrying…' : 'No Safes yet. Yours can be the first.'}</span>
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
          name: 'Gully Safe',
          applicationCategory: 'FinanceApplication',
          operatingSystem: 'Web',
          url: 'https://safe.gullychain.xyz/welcome',
          description: 'Multi-signature Safe smart accounts on Gully Chain, built on the audited Safe 1.4.1 contracts.',
          offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
          publisher: { '@type': 'Organization', name: 'Gully Labs', url: 'https://gullylabs.xyz' },
        },
        {
          '@context': 'https://schema.org',
          '@type': 'FAQPage',
          mainEntity: FAQ.map((f) => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } })),
        },
      ]),
    [],
  )

  return (
    <div className={css.page}>
      <Head>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd }} />
      </Head>
      {/* GullyChain product switcher 1.8.2 (gully-ops sites/_shared/gc-switcher, byte-identical copy; kit v4 dark theme) */}
      <Script src="/assets/gc-switcher.js" strategy="afterInteractive" />

      <header className={css.topbar}>
        <div className={css.topbarInner}>
          {createElement('gc-switcher', { current: 'safe', theme: 'dark' })}
          <nav className={css.topnav} aria-label="Gully Safe links">
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
          <a href="#get-started" className={css.btnPrimary}>
            <Icon name="rocket" size={16} /> Get started
          </a>
        </div>
      </header>

      <main>
        <section className={css.hero}>
          <div className={css.heroCopy}>
            <p className={css.eyebrow}>Gully Chain Testnet · Safe 1.4.1</p>
            <h1 className={css.h1}>
              The multi-sig smart wallet <span className={css.grad}>built on Gully Chain</span>
            </h1>
            <p className={css.lead}>
              Gully Safe keeps a team&apos;s or a protocol&apos;s funds behind several keys. Owners propose, a threshold
              signs, the Safe executes. Passkey signers and sponsored gas are on chain, on the same audited Safe code
              that secures billions on Ethereum.
            </p>
            <div className={css.ctaRow}>
              <a href="#get-started" className={css.btnPrimary}>
                Create a Safe <Icon name="arrowRight" size={16} />
              </a>
              <a href={DOCS_SAFE} {...EXT} className={css.btnGhost}>
                Read the docs <Icon name="externalLink" size={16} />
              </a>
            </div>
            <div id="get-started" className={css.loginWrap}>
              <WelcomeLogin />
            </div>
          </div>
          <div className={css.heroArt}>
            <Mascot celebrateKey={celebrateKey} />
          </div>
        </section>

        <LiveSection onNewSafe={onNewSafe} />

        <section className={css.section} aria-labelledby="why-title">
          <div className={css.sectionHead}>
            <p className={css.eyebrow}>Why Gully Safe</p>
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

        <section className={css.section} aria-labelledby="steps-title">
          <div className={css.sectionHead}>
            <p className={css.eyebrow}>Three steps</p>
            <h2 id="steps-title" className={css.h2}>
              Create your Safe
            </h2>
          </div>
          <ol className={css.steps}>
            {STEPS.map((s, i) => (
              <li key={s.title} className={css.step}>
                <span className={css.stepNum}>{i + 1}</span>
                <div>
                  <h3 className={css.cardTitle}>{s.title}</h3>
                  <p className={css.cardText}>{s.text}</p>
                </div>
              </li>
            ))}
          </ol>
          <div className={css.ctaRow}>
            <a href="#get-started" className={css.btnPrimary}>
              Start now <Icon name="arrowRight" size={16} />
            </a>
            <a href={FAUCET} {...EXT} className={css.btnGhost}>
              Get test ETH <Icon name="droplet" size={16} />
            </a>
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

        <section className={css.section} aria-labelledby="links-title">
          <h2 id="links-title" className={css.srOnly}>
            Gully Chain links
          </h2>
          <div className={css.links}>
            {[
              { icon: 'bookOpen' as const, title: 'Safe on Gully Chain docs', text: 'Contract addresses and guides', href: DOCS_SAFE },
              { icon: 'search' as const, title: 'Explorer', text: 'Blocks, transactions, Safes', href: GULLY_EXPLORER },
              { icon: 'arrowLeftRight' as const, title: 'Bridge', text: 'Move ETH to Gully Chain', href: BRIDGE },
              { icon: 'droplet' as const, title: 'Faucet', text: 'Free testnet ETH', href: FAUCET },
            ].map((l) => (
              <a key={l.title} href={l.href} {...EXT} className={css.linkCard}>
                <Icon name={l.icon} size={20} />
                <span>
                  <strong>{l.title}</strong>
                  <small>{l.text}</small>
                </span>
                <Icon name="externalLink" size={14} className={css.linkExt} />
              </a>
            ))}
          </div>
        </section>
      </main>

      <Footer forceShow versionIcon={false} helpCenter={false} preferences={false} className={css.footer} />
    </div>
  )
}

export default GullyLanding
