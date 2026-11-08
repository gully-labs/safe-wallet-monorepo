import type { ReactElement, ReactNode } from 'react'
import Link from 'next/link'
import { Button } from '@mui/material'
import css from './styles.module.css'

export type EmptyPageAction = { label: string; href: string; primary?: boolean; external?: boolean }

/**
 * Gully Multisig: the one layout for pages that are not a feature (404, 403, offline, errors). The kit mark (the
 * unmodified gc-icon, floating by transform only), a short title, one honest sentence and the way forward.
 */
const GullyEmptyPage = ({
  code,
  title,
  children,
  actions = [],
}: {
  code?: string
  title: string
  children?: ReactNode
  actions?: EmptyPageAction[]
}): ReactElement => (
  <main className={css.page} data-testid="gully-empty-page">
    <section className={css.card}>
      <img src="/brand/logo/gc-icon.svg" width={56} height={56} alt="" className={css.mark} />
      {code && <span className={css.code}>{code}</span>}
      <h1 className={css.title}>{title}</h1>
      {children && <div className={css.text}>{children}</div>}
      {actions.length > 0 && (
        <div className={css.actions}>
          {actions.map((a) =>
            a.external ? (
              <Button
                key={a.href}
                component="a"
                href={a.href}
                target="_blank"
                rel="noopener noreferrer"
                variant={a.primary ? 'contained' : 'outlined'}
                disableElevation
                className={css.btn}
              >
                {a.label}
              </Button>
            ) : (
              <Button
                key={a.href}
                component={Link}
                href={a.href}
                variant={a.primary ? 'contained' : 'outlined'}
                disableElevation
                className={css.btn}
              >
                {a.label}
              </Button>
            ),
          )}
        </div>
      )}
    </section>
  </main>
)

export default GullyEmptyPage
