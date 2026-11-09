import { useState } from 'react'
import { Box } from '@mui/system'
import { lightPalette } from '@safe-global/theme'
import css from './styles.module.css'
import { Card, LinearProgress, CardHeader, Avatar, Typography, CardContent } from '@mui/material'
import type { TxStepperProps } from './useCardStepper'
import { useCardStepper } from './useCardStepper'
import { GlStepper } from '@/components/gully/LiveUi/Actions'

export function CardStepper<StepperData>(props: TxStepperProps<StepperData>) {
  const [progressColor, setProgressColor] = useState(lightPalette.secondary.main)
  const { activeStep, onSubmit, onBack, stepData, setStep, setStepData } = useCardStepper<StepperData>(props)
  const { steps } = props
  const currentStep = steps[activeStep]
  const progress = ((activeStep + 1) / steps.length) * 100
  const titled = steps.filter((s) => s.title)

  return (
    <Card className={css.card}>
      <Box className={css.progress} color={progressColor}>
        <LinearProgress color="inherit" variant="determinate" value={Math.min(progress, 100)} />
      </Box>
      {/* Gully Multisig: the whole path at a glance, on the shared Gully Live UI stepper */}
      {titled.length > 1 && (
        <GlStepper
          steps={titled.map((s) => s.title)}
          current={currentStep.title ? titled.indexOf(currentStep) : titled.length}
        />
      )}
      {currentStep.title && (
        <CardHeader
          title={currentStep.title}
          subheader={currentStep.subtitle}
          titleTypographyProps={{ variant: 'h4' }}
          subheaderTypographyProps={{ variant: 'body2' }}
          avatar={
            <Avatar className={css.step}>
              <Typography variant="body2">{activeStep + 1}</Typography>
            </Avatar>
          }
          className={css.header}
        />
      )}
      <CardContent className={css.content}>
        {currentStep.render(stepData, onSubmit, onBack, setStep, setProgressColor, setStepData)}
      </CardContent>
    </Card>
  )
}
