import { useIsOutreachSafe } from '@/features/targeted-features'
import { useIsHypernativeGuard } from './useIsHypernativeGuard'
import { useIsHypernativeFeature } from './useIsHypernativeFeature'
import { HYPERNATIVE_ALLOWLIST_OUTREACH_ID } from '../constants'

export type HypernativeEligibility = {
  isHypernativeEligible: boolean
  isHypernativeGuard: boolean
  isAllowlistedSafe: boolean
  loading: boolean
}

/**
 * Determines whether the current Safe is eligible for Hypernative CTAs.
 * Eligibility requires a Hypernative guard installed or targeted outreach membership.
 */
export const useIsHypernativeEligible = (): HypernativeEligibility => {
  const { isHypernativeGuard, loading: guardLoading } = useIsHypernativeGuard()
  // Gully: the allowlist is a targeted-messaging outreach; chains without HYPERNATIVE (every Gully chain) never ask
  // the gateway for it (it answers 404 there).
  const isHypernativeFeature = useIsHypernativeFeature()
  const { isTargeted: isAllowlistedSafe, loading: outreachLoading } = useIsOutreachSafe(
    HYPERNATIVE_ALLOWLIST_OUTREACH_ID,
    { skip: !isHypernativeFeature },
  )

  return {
    isHypernativeEligible: isHypernativeGuard || isAllowlistedSafe,
    isHypernativeGuard,
    isAllowlistedSafe,
    loading: guardLoading || outreachLoading,
  }
}
