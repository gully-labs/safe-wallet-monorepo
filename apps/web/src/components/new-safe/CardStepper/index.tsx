import { useState } from 'react'
import { Box } from '@mui/system'
import { lightPalette } from '@safe-global/theme'
import css from './styles.module.css'
import { Card, LinearProgress, CardHeader, Avatar, Typography, CardContent } from '@mui/material'
import type { TxStepperProps } from './useCardStepper'
import { useCardStepper } from './useCardStepper'

export function CardStepper<StepperData>(props: TxStepperProps<StepperData>) {
  const [progressColor, setProgressColor] = useState(lightPalette.secondary.main)
  const { activeStep, onSubmit, onBack, stepData, setStep, setStepData } = useCardStepper<StepperData>(props)
  const { steps } = props
  const currentStep = steps[activeStep]
  const progress = ((activeStep + 1) / steps.length) * 100

  return (
    <Card className={css.card}>
      <Box className={css.progress} color={progressColor}>
        <LinearProgress color="inherit" variant="determinate" value={Math.min(progress, 100)} />
      </Box>
      {/* Gully Safe: the whole path at a glance */}
      {steps.length > 1 && (
        <ol className={css.path} aria-label="Steps">
          {steps.map((s, i) =>
            s.title ? (
              <li
                key={i}
                className={i === activeStep ? css.pathOn : i < activeStep ? css.pathDone : undefined}
                aria-current={i === activeStep ? 'step' : undefined}
              >
                <span className={css.pathN}>{i + 1}</span>
                <span className={css.pathT}>{s.title}</span>
              </li>
            ) : null,
          )}
        </ol>
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
