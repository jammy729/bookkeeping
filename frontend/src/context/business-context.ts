import { createContext, useContext } from 'react'

export interface BusinessProfile {
  businessName: string
  businessType: 'sole_proprietorship' | 'partnership' | 'corporation' | 'freelancer' | 'other'
  industry: string
  taxSettings: {
    gstRegistered: boolean
    hstRegistered: boolean
    pstRegistered: boolean
    gstRate: number
    hstRate: number
    pstRate: number
  }
  currency: string
  fiscalYearStart: number
  onboardingCompleted: boolean
}

export interface BusinessContextState {
  profile: BusinessProfile
  updateProfile: (updates: Partial<BusinessProfile>) => void
  isOnboardingComplete: boolean
}

export const BusinessContext = createContext<BusinessContextState | undefined>(undefined)

export function useBusiness() {
  const context = useContext(BusinessContext)
  if (!context) {
    throw new Error('useBusiness must be used within a BusinessProvider')
  }
  return context
}
