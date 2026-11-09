import { Container, Typography, Grid } from '@mui/material'
import { useRouter } from 'next/router'

import useWallet from '@/hooks/wallets/useWallet'
import OverviewWidget from '@/components/new-safe/create/OverviewWidget'
import type { NamedAddress } from '@/components/new-safe/create/types'
import type { TxStepperProps } from '@/components/new-safe/CardStepper/useCardStepper'
import SetNameStep from '@/components/new-safe/create/steps/SetNameStep'
import OwnerPolicyStep from '@/components/new-safe/create/steps/OwnerPolicyStep'
import ReviewStep from '@/components/new-safe/create/steps/ReviewStep'
import { CreateSafeStatus } from '@/components/new-safe/create/steps/StatusStep'
import { CardStepper } from '@/components/new-safe/CardStepper'
import { AppRoutes } from '@/config/routes'
import { CREATE_SAFE_CATEGORY } from '@/services/analytics'
import type { AlertColor } from '@mui/material'
import type { CreateSafeInfoItem } from '@/components/new-safe/create/CreateSafeInfos'
import CreateSafeInfos from '@/components/new-safe/create/CreateSafeInfos'
import { type ReactElement, useMemo, useState } from 'react'
import ExternalLink from '@/components/common/ExternalLink'
import { type SafeVersion } from '@safe-global/types-kit'
import { useCurrentChain } from '@/hooks/useChains'
import type { Chain } from '@safe-global/store/gateway/AUTO_GENERATED/chains'
import { getLatestSafeVersion } from '@safe-global/utils/utils/chains'
import { HelpCenterArticle } from '@safe-global/utils/config/constants'

export type NewSafeFormData = {
  name: string
  networks: Chain[]
  threshold: number
  owners: NamedAddress[]
  saltNonce?: number
  safeVersion: SafeVersion
  safeAddress?: string
  willRelay?: boolean
  paymentReceiver?: string
}

const staticHints: Record<
  number,
  { title: string; variant: AlertColor; steps: { title: string; text: string | ReactElement }[] }
> = {
  1: {
    title: 'Multisig creation',
    variant: 'info',
    steps: [
      {
        title: 'Network fee',
        text: 'Deploying your multisig costs the network fee, paid by your connected wallet. An estimation will be provided in the last step.',
      },
      {
        title: 'Address book privacy',
        text: 'The name of your multisig is stored in the address book on your device and can be changed at a later stage. It will not be shared with us or any third party.',
      },
    ],
  },
  2: {
    title: 'Multisig creation',
    variant: 'info',
    steps: [
      {
        title: 'Flat hierarchy',
        text: 'Every signer has the same rights within the multisig and can propose, sign and execute transactions that have the required confirmations.',
      },
      {
        title: 'Managing Signers',
        text: 'You can change the signers and the required confirmations any time after creation.',
      },
      {
        title: 'Multisig setup',
        text: (
          <>
            Not sure how many signers and confirmations you need?
            <br />
            <ExternalLink href={HelpCenterArticle.SAFE_SETUP} fontWeight="bold">
              Learn more about setting up a multisig.
            </ExternalLink>
          </>
        ),
      },
    ],
  },
  3: {
    title: 'Multisig creation',
    variant: 'info',
    steps: [
      {
        title: 'Wait for the creation',
        text: 'Depending on network usage, it can take some time until the transaction is successfully added to the blockchain and picked up by our services.',
      },
    ],
  },
  4: {
    title: 'Using your multisig',
    variant: 'success',
    steps: [
      {
        title: 'Connect your multisig',
        text: 'Connect your multisig to any dApp through WalletConnect and sign its transactions with your signers.',
      },
    ],
  },
}

const CreateSafe = () => {
  const router = useRouter()
  const wallet = useWallet()
  const chain = useCurrentChain()

  const [safeName, setSafeName] = useState('')
  const [overviewNetworks, setOverviewNetworks] = useState<Chain[]>()

  const [dynamicHint, setDynamicHint] = useState<CreateSafeInfoItem>()
  const [activeStep, setActiveStep] = useState(0)

  const CreateSafeSteps: TxStepperProps<NewSafeFormData>['steps'] = [
    {
      title: 'Set up the basics',
      subtitle: 'Give a name to your multisig and select which networks to deploy it on.',
      render: (data, onSubmit, onBack, setStep) => (
        <SetNameStep
          setOverviewNetworks={setOverviewNetworks}
          setDynamicHint={setDynamicHint}
          setSafeName={setSafeName}
          data={data}
          onSubmit={onSubmit}
          onBack={onBack}
          setStep={setStep}
        />
      ),
    },
    {
      title: 'Signers and confirmations',
      subtitle: 'Add the signers of your multisig and how many of them must confirm a transaction before it can run.',
      render: (data, onSubmit, onBack, setStep) => (
        <OwnerPolicyStep
          setDynamicHint={setDynamicHint}
          data={data}
          onSubmit={onSubmit}
          onBack={onBack}
          setStep={setStep}
        />
      ),
    },
    {
      title: 'Review',
      subtitle: "You're about to create a multisig. Your connected wallet confirms the deployment transaction.",
      render: (data, onSubmit, onBack, setStep) => (
        <ReviewStep data={data} onSubmit={onSubmit} onBack={onBack} setStep={setStep} />
      ),
    },
    {
      title: '',
      subtitle: '',
      render: (data, onSubmit, onBack, setStep, setProgressColor, setStepData) => (
        <CreateSafeStatus
          data={data}
          onSubmit={onSubmit}
          onBack={onBack}
          setStep={setStep}
          setProgressColor={setProgressColor}
          setStepData={setStepData}
        />
      ),
    },
  ]

  const staticHint = useMemo(() => staticHints[activeStep], [activeStep])

  const initialStep = 0
  const initialData: NewSafeFormData = {
    name: '',
    networks: [],
    owners: [],
    threshold: 1,
    safeVersion: getLatestSafeVersion(chain) as SafeVersion,
  }

  const onClose = () => {
    router.push(AppRoutes.welcome.index)
  }

  return (
    <Container>
      <Grid
        container
        columnSpacing={3}
        sx={{
          justifyContent: 'center',
          mt: [2, null, 7],
        }}
      >
        <Grid item xs={12}>
          <Typography
            variant="h2"
            sx={{
              pb: 2,
            }}
          >
            Create a multisig
          </Typography>
        </Grid>
        <Grid
          item
          xs={12}
          md={8}
          sx={{
            order: [1, null, 0],
          }}
        >
          <CardStepper
            initialData={initialData}
            initialStep={initialStep}
            onClose={onClose}
            steps={CreateSafeSteps}
            eventCategory={CREATE_SAFE_CATEGORY}
            setWidgetStep={setActiveStep}
          />
        </Grid>

        <Grid
          item
          xs={12}
          md={4}
          sx={{
            mb: [3, null, 0],
            order: [0, null, 1],
          }}
        >
          <Grid container spacing={3}>
            {activeStep < 2 && <OverviewWidget safeName={safeName} networks={overviewNetworks || []} />}
            {wallet?.address && <CreateSafeInfos staticHint={staticHint} dynamicHint={dynamicHint} />}
          </Grid>
        </Grid>
      </Grid>
    </Container>
  )
}

export default CreateSafe
