import { useState, useEffect, useCallback, type ReactNode } from 'react'
import { BusinessContext, type BusinessProfile } from './business-context'
import { api } from '../lib/api'
import { isAdminZone } from '../lib/routes'
import { authService } from '../services/auth.service'

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

const BUSINESS_TYPES: BusinessProfile['businessType'][] = [
  'sole_proprietorship',
  'partnership',
  'corporation',
  'freelancer',
  'other',
]

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

/** Merges the server-side business profile (GET /auth/me) over the current one. */
function profileFromServer(user: Record<string, unknown>, current: BusinessProfile): BusinessProfile {
  const businessType = user.businessType as BusinessProfile['businessType']
  const serverTax = user.taxSettings as Partial<BusinessProfile['taxSettings']> | undefined

  return {
    ...current,
    businessName: typeof user.businessName === 'string' ? user.businessName : current.businessName,
    businessType: businessType && BUSINESS_TYPES.includes(businessType) ? businessType : current.businessType,
    industry: typeof user.industry === 'string' ? user.industry : current.industry,
    taxSettings: serverTax ? { ...current.taxSettings, ...serverTax } : current.taxSettings,
    currency: typeof user.currency === 'string' ? user.currency : current.currency,
    fiscalYearStart:
      typeof user.fiscalYearStart === 'number' ? user.fiscalYearStart : current.fiscalYearStart,
    onboardingCompleted:
      typeof user.onboardingCompleted === 'boolean' ? user.onboardingCompleted : current.onboardingCompleted,
  }
}

export function BusinessProvider({ children }: { children: ReactNode }) {
  const [profile, setProfile] = useState<BusinessProfile>(loadProfile)

  // On the admin zone the server is the source of truth for the business
  // profile: the registration flow saves it via PUT /auth/update-profile on
  // the apex before handing off, and local storage alone is not reliable
  // (per-origin, legacy, and could be out of sync with the backend).
  useEffect(() => {
    // Skip on the apex zone (stateless, no token) and when not logged in.
    if (!isAdminZone() || !authService.getToken()) return

    let active = true
    api
      .get('/auth/me')
      .then((res) => {
        if (!active) return
        setProfile((prev) => profileFromServer(res.data ?? {}, prev))
      })
      .catch(() => {
        // Keep the local profile on failure — a network error must not
        // destroy the user's settings mid-session.
      })
    return () => {
      active = false
    }
  }, [])

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
