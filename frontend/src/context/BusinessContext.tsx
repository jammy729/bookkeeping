import { useState, useCallback, type ReactNode } from 'react'
import { BusinessContext, type BusinessProfile } from './business-context'

const defaultProfile: BusinessProfile = {
  businessName: '',
  businessType: 'freelancer',
  industry: '',
  taxSettings: {
    gstRegistered: false,
    hstRegistered: true,
    pstRegistered: false,
    gstRate: 5,
    hstRate: 13,
    pstRate: 0,
  },
  currency: 'CAD',
  fiscalYearStart: 1,
  onboardingCompleted: false,
}

const STORAGE_KEY = 'bookkeeping-business-profile'

function loadProfile(): BusinessProfile {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      return { ...defaultProfile, ...JSON.parse(stored) }
    }
  } catch {
    // ignore
  }
  return defaultProfile
}

export function BusinessProvider({ children }: { children: ReactNode }) {
  const [profile, setProfile] = useState<BusinessProfile>(loadProfile)

  const updateProfile = useCallback((updates: Partial<BusinessProfile>) => {
    setProfile((prev) => {
      const next = { ...prev, ...updates }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
      return next
    })
  }, [])

  return (
    <BusinessContext.Provider
      value={{
        profile,
        updateProfile,
        isOnboardingComplete: profile.onboardingCompleted,
      }}
    >
      {children}
    </BusinessContext.Provider>
  )
}
