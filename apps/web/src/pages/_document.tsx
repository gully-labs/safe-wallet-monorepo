/**
 * This file is needed to embed MUI theme CSS into the pre-built HTML files
 * @see https://github.com/mui/material-ui/tree/master/examples/nextjs-with-typescript
 */
import type { DocumentContext } from 'next/document'
import Document, { Html, Head, Main, NextScript } from 'next/document'
import createEmotionServer from '@emotion/server/create-instance'
import createEmotionCache from '@/utils/createEmotionCache'

export default class WebCoreDocument extends Document {
  render() {
    return (
      <Html lang="en">
        <Head>
          {/* Gully Multisig: GullyChain brand kit v4 type (Inter) is self-hosted in /fonts/fonts.css: no third-party font request */}
          <link rel="preload" href="/fonts/inter-var.woff2" as="font" type="font/woff2" crossOrigin="" />
          <meta name="emotion-insertion-point" content="" />
          {(this.props as any).emotionStyleTags}
        </Head>
        <body>
          {/* Follow Gully Labs on X (owner, 2026-11-06): byte copy of gully-ops sites/_shared/x-banner. Sync on purpose, so
              the bar is in place before the page paints; same-origin, CSP allows it. Not on the transaction flows. */}
          {/* eslint-disable-next-line @next/next/no-sync-scripts */}
          <script
            src="/gully-x-banner.js"
            data-bg="var(--color-background-paper,#111716)"
            data-fg="var(--color-primary-main,#12FF80)"
            data-line="var(--color-border-light,#303033)"
            data-skip="^/(transactions/tx|share)"
          />
          <Main />
          <NextScript />
        </body>
      </Html>
    )
  }
}

const getInitialProps = async (ctx: DocumentContext) => {
  const originalRenderPage = ctx.renderPage

  // You can consider sharing the same Emotion cache between all the SSR requests to speed up performance.
  // However, be aware that it can have global side effects.
  const cache = createEmotionCache()
  const { extractCriticalToChunks } = createEmotionServer(cache)

  ctx.renderPage = () =>
    originalRenderPage({
      enhanceApp: (App: any) =>
        function EnhanceApp(props) {
          return <App emotionCache={cache} {...props} />
        },
    })

  const initialProps = await Document.getInitialProps(ctx)
  // This is important. It prevents Emotion to render invalid HTML.
  // See https://github.com/mui/material-ui/issues/26561#issuecomment-855286153
  const emotionStyles = extractCriticalToChunks(initialProps.html)
  const emotionStyleTags = emotionStyles.styles.map((style) => (
    <style
      data-emotion={`${style.key} ${style.ids.join(' ')}`}
      key={style.key}
      dangerouslySetInnerHTML={{ __html: style.css }}
    />
  ))

  return {
    ...initialProps,
    emotionStyleTags,
  }
}

WebCoreDocument.getInitialProps = getInitialProps
