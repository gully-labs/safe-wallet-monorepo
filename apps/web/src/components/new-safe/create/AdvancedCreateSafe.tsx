import { ECOSYSTEM_ID_ADDRESS } from '@/config/constants'
import { Container, Typography, Grid } from '@mui/material'
import { useRouter } from 'next/router'

import useWallet from '@/hooks/wallets/useWallet'
import OverviewWidget from '@/components/new-safe/create/OverviewWidget'
import type { TxStepperProps } from '@/components/new-safe/CardStepper/useCardStepper'
import SetNameStep from '@/components/new-safe/create/steps/SetNameStep'
import OwnerPolicyStep from '@/components/new-safe/create/steps/OwnerPolicyStep'
import ReviewStep from '@/components/new-safe/create/steps/ReviewStep'
import { CreateSafeStatus } from '@/components/new-safe/create/steps/StatusStep'
import { CardStepper } from '@/components/new-safe/CardStepper'
import { AppRoutes } from '@/config/routes'
import { CREATE_SAFE_CATEGORY } from '@/services/analytics'
import type { CreateSafeInfoItem } from '@/components/new-safe/create/CreateSafeInfos'
import CreateSafeInfos from '@/components/new-safe/create/CreateSafeInfos'
import { useState } from 'react'
import { type NewSafeFormData } from '.'
import AdvancedOptionsStep from './steps/AdvancedOptionsStep'
import { useCurrentChain } from '@/hooks/useChains'
import { getLatestSafeVersion } from '@safe-global/utils/utils/chains'

const AdvancedCreateSafe = () => {
  const router = useRouter()
  const wallet = useWallet()
  const chain = useCurrentChain()

  const [safeName, setSafeName] = useState('')
  const [dynamicHint, setDynamicHint] = useState<CreateSafeInfoItem>()
  const [activeStep, setActiveStep] = useState(0)

  const CreateSafeSteps: TxStepperProps<NewSafeFormData>['steps'] = [
    {
      title: 'Pick the network and a name for your multisig',
      subtitle: 'Pick the chain your multisig will live on',
      render: (data, onSubmit, onBack, setStep) => (
        <SetNameStep
          isAdvancedFlow
          setSafeName={setSafeName}
          data={data}
          onSubmit={onSubmit}
          onBack={onBack}
          setStep={setStep}
          setOverviewNetworks={() => {}}
          setDynamicHint={() => {}}
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
      title: 'Advanced settings',
      subtitle: 'Choose the contract version and, if you need one, a salt nonce',
      render: (data, onSubmit, onBack, setStep) => (
        <AdvancedOptionsStep data={data} onSubmit={onSubmit} onBack={onBack} setStep={setStep} />
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

  const initialStep = 0
  const initialData: NewSafeFormData = {
    name: '',
    networks: [],
    owners: [],
    threshold: 1,
    saltNonce: 0,
    safeVersion: getLatestSafeVersion(chain),
    paymentReceiver: ECOSYSTEM_ID_ADDRESS,
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
            {activeStep < 2 && <OverviewWidget safeName={safeName} networks={[]} />}
            {wallet?.address && <CreateSafeInfos dynamicHint={dynamicHint} />}
          </Grid>
        </Grid>
      </Grid>
    </Container>
  )
}

export default AdvancedCreateSafe
