import React from 'react'
import { Typography } from '@mui/material'
import css from './styles.module.css'
import WelcomeLogin from './WelcomeLogin'
import GullySafeLogo from '@/components/common/GullySafeLogo'
import footerCss from './welcomeFooter.module.css'
import Footer from '../common/Footer'

const NewSafe = () => {
  return (
    <div className={css.loginPage}>
      <div className={css.leftSide}>
        <div className={css.logoContainer}>
          <GullySafeLogo />
        </div>
        <div className={css.loginContainer}>
          <WelcomeLogin />
        </div>
        <Footer forceShow versionIcon={false} helpCenter={false} preferences={false} className={footerCss.footer} />
      </div>

      <div className={css.rightSide}>
        <div className={css.rightContent}>
          {/* Gully Safe: GullyChain brand panel instead of Safe's marketing mockup */}
          <Typography className={css.label}>GULLY CHAIN TESTNET</Typography>
          <Typography className={css.mainTitle}>Multisig smart accounts on Gully Chain</Typography>
        </div>
        <div className={css.mockupImageContainer}>
          <img
            src="/brand/mascots/gullychain-mascot-builder.png"
            width={370}
            height={385}
            alt="GullyChain mascot"
            className={css.mascotImage}
          />
        </div>
      </div>
    </div>
  )
}

export default NewSafe
