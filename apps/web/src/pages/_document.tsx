import Document, { Html, Head, Main, NextScript } from 'next/document'

export default class WebCoreDocument extends Document {
  render() {
    return (
      <Html lang="en">
        <Head>
          {/* Gully analytics: one self-hosted Umami, no cookies. The loader finds the site id from the host. */}
          <script defer src="https://analytics.gullylabs.xyz/a.js" />
        </Head>
        <body>
          <div className="root">
            <Main />
          </div>
          <NextScript />
        </body>
      </Html>
    )
  }
}
