import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/useAuth';
import { useBusiness, type BusinessProfile } from '../context/business-context';
import { useTheme } from '../hooks/useTheme';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Separator } from '../components/ui/separator';
import { toast } from 'sonner';
import {
  Building2,
  Calculator,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  Moon,
  Sun,
  Briefcase,
  Landmark,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../components/ui/dropdown-menu';

const BUSINESS_TYPES = [
  { value: 'freelancer', icon: Briefcase },
  { value: 'sole_proprietorship', icon: Building2 },
  { value: 'partnership', icon: Building2 },
  { value: 'corporation', icon: Landmark },
  { value: 'other', icon: Building2 },
];

const INDUSTRIES = [
  'technology',
  'consulting',
  'design',
  'marketing',
  'finance',
  'healthcare',
  'education',
  'realEstate',
  'construction',
  'retail',
  'food',
  'transportation',
  'manufacturing',
  'other',
];

const STEPS = [
  { id: 1, key: 'profile', icon: Building2 },
  { id: 2, key: 'business', icon: Briefcase },
  { id: 3, key: 'taxSettings', icon: Calculator },
  { id: 4, key: 'complete', icon: CheckCircle2 },
];

export function Onboarding() {
  const [step, setStep] = useState(1);
  const { user } = useAuth();
  const { profile, updateProfile } = useBusiness();
  const { setTheme, resolvedTheme } = useTheme();
  const navigate = useNavigate();
  const { t } = useTranslation();

  // Step 1: Profile
  const [businessName, setBusinessName] = useState(profile.businessName || '');

  // Step 2: Business
  const [businessType, setBusinessType] = useState<BusinessProfile['businessType']>(profile.businessType || 'freelancer');
  const [industry, setIndustry] = useState(profile.industry || '');

  // Step 3: Tax
  const [hstRegistered, setHstRegistered] = useState(profile.taxSettings?.hstRegistered ?? true);
  const [gstRegistered, setGstRegistered] = useState(profile.taxSettings?.gstRegistered ?? false);
  const [fiscalYearStart, setFiscalYearStart] = useState(profile.fiscalYearStart || 1);

  const progress = (step / STEPS.length) * 100;

  const handleNext = () => {
    if (step === 1 && !businessName.trim()) {
      toast.error(t('auth.onboarding.validation.businessNameRequired'));
      return;
    }
    if (step === 2 && !industry) {
      toast.error(t('auth.onboarding.validation.industryRequired'));
      return;
    }
    if (step < 4) setStep(step + 1);
  };

  const handleBack = () => {
    if (step > 1) setStep(step - 1);
  };

  const handleComplete = () => {
    updateProfile({
      businessName,
      businessType,
      industry,
      taxSettings: {
        gstRegistered,
        hstRegistered,
        pstRegistered: false,
        gstRate: 5,
        hstRate: 13,
        pstRate: 0,
      },
      currency: 'CAD',
      fiscalYearStart,
      onboardingCompleted: true,
    });
    toast.success(t('auth.onboarding.completeToast'));
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="border-b bg-card px-6 py-4">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-primary text-primary-foreground font-bold text-sm">
              B
            </div>
            <span className="font-semibold text-sm">{t('auth.onboarding.brand')}</span>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
                <span className="sr-only">{t('accessibility.toggleTheme')}</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setTheme('light')}>
                <Sun className="mr-2 h-4 w-4" /> Light
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setTheme('dark')}>
                <Moon className="mr-2 h-4 w-4" /> Dark
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      {/* Content */}
      <div className="flex-1 flex flex-col items-center justify-center p-6">
        <div className="w-full max-w-2xl space-y-8">
          {/* Step indicators */}
          <div className="flex items-center justify-center gap-2">
            {STEPS.map((s, i) => (
              <div key={s.id} className="flex items-center">
                <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                  step === s.id
                    ? 'bg-primary text-primary-foreground'
                    : step > s.id
                      ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300'
                      : 'bg-muted text-muted-foreground'
                }`}>
                  {step > s.id ? (
                    <CheckCircle2 className="h-3.5 w-3.5" />
                  ) : (
                    <s.icon className="h-3.5 w-3.5" />
                  )}
                  <span className="hidden sm:inline">{t(`auth.onboarding.steps.${s.key}`)}</span>
                </div>
                {i < STEPS.length - 1 && (
                  <div className={`w-8 h-px mx-2 ${step > s.id ? 'bg-emerald-300 dark:bg-emerald-700' : 'bg-muted'}`} />
                )}
              </div>
            ))}
          </div>

          {/* Progress bar */}
          <div className="w-full bg-muted rounded-full h-1.5">
            <div
              className="bg-primary h-1.5 rounded-full transition-all duration-500 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>

          {/* Step content */}
          <Card>
            <CardContent className="p-8">
              {step === 1 && (
                <div className="space-y-6">
                  <div className="space-y-1">
                    <h2 className="text-xl font-bold">{t('auth.onboarding.profile.welcome', { name: user?.firstName || user?.email?.split('@')[0] })}</h2>
                    <p className="text-muted-foreground text-sm">
                      {t('auth.onboarding.profile.description')}
                    </p>
                  </div>

                  <Separator />

                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="businessName">{t('auth.onboarding.profile.businessName')}</Label>
                      <Input
                        id="businessName"
                        value={businessName}
                        onChange={(e) => setBusinessName(e.target.value)}
                        placeholder={t('auth.onboarding.profile.businessNamePlaceholder')}
                      />
                      <p className="text-xs text-muted-foreground">
                        {t('auth.onboarding.profile.businessNameHelper')}
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label>{t('auth.onboarding.profile.theme')}</Label>
                      <div className="flex gap-2">
                        <Button
                          variant={resolvedTheme === 'light' ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => setTheme('light')}
                        >
                          <Sun className="h-4 w-4 mr-2" /> Light
                        </Button>
                        <Button
                          variant={resolvedTheme === 'dark' ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => setTheme('dark')}
                        >
                          <Moon className="h-4 w-4 mr-2" /> Dark
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {step === 2 && (
                <div className="space-y-6">
                  <div className="space-y-1">
                    <h2 className="text-xl font-bold">{t('auth.onboarding.business.title')}</h2>
                    <p className="text-muted-foreground text-sm">
                      {t('auth.onboarding.business.description')}
                    </p>
                  </div>

                  <Separator />

                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>{t('auth.onboarding.business.businessType')}</Label>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {BUSINESS_TYPES.map((type) => (
                          <button
                            key={type.value}
                            type="button"
                            onClick={() => setBusinessType(type.value as BusinessProfile['businessType'])}
                            className={`flex items-center gap-3 p-3 rounded-lg border text-left text-sm transition-colors ${
                              businessType === type.value
                                ? 'border-primary bg-primary/5 text-primary font-medium'
                                : 'border-border hover:bg-accent'
                            }`}
                          >
                            <type.icon className="h-4 w-4 shrink-0" />
                            {t(`auth.onboarding.businessTypes.${type.value}`)}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="industry">{t('auth.onboarding.business.industry')}</Label>
                      <Select value={industry} onValueChange={setIndustry}>
                        <SelectTrigger id="industry" className="w-full">
                          <SelectValue placeholder={t('auth.onboarding.business.selectIndustry')} />
                        </SelectTrigger>
                        <SelectContent>
                          {INDUSTRIES.map((ind) => (
                            <SelectItem key={ind} value={ind}>{t(`auth.onboarding.industries.${ind}`)}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              )}

              {step === 3 && (
                <div className="space-y-6">
                  <div className="space-y-1">
                    <h2 className="text-xl font-bold">{t('auth.onboarding.tax.title')}</h2>
                    <p className="text-muted-foreground text-sm">
                      {t('auth.onboarding.tax.description')}
                    </p>
                  </div>

                  <Separator />

                  <div className="space-y-4">
                    <div className="space-y-3">
                      <Label>{t('auth.onboarding.tax.registrations')}</Label>
                      <div className="space-y-2">
                        <label className="flex items-center gap-3 p-3 rounded-lg border cursor-pointer hover:bg-accent transition-colors">
                          <input
                            type="checkbox"
                            checked={hstRegistered}
                            onChange={(e) => setHstRegistered(e.target.checked)}
                            className="h-4 w-4 rounded border-input"
                          />
                          <div>
                            <p className="text-sm font-medium">{t('auth.onboarding.tax.hstRegistered')}</p>
                            <p className="text-xs text-muted-foreground">{t('auth.onboarding.tax.hstDescription')}</p>
                          </div>
                          <Badge variant="secondary" className="ml-auto text-xs">13%</Badge>
                        </label>

                        <label className="flex items-center gap-3 p-3 rounded-lg border cursor-pointer hover:bg-accent transition-colors">
                          <input
                            type="checkbox"
                            checked={gstRegistered}
                            onChange={(e) => setGstRegistered(e.target.checked)}
                            className="h-4 w-4 rounded border-input"
                          />
                          <div>
                            <p className="text-sm font-medium">{t('auth.onboarding.tax.gstRegistered')}</p>
                            <p className="text-xs text-muted-foreground">{t('auth.onboarding.tax.gstDescription')}</p>
                          </div>
                          <Badge variant="secondary" className="ml-auto text-xs">5%</Badge>
                        </label>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="fiscalYear">{t('auth.onboarding.tax.fiscalYearStart')}</Label>
                      <Select value={String(fiscalYearStart)} onValueChange={(v) => setFiscalYearStart(parseInt(v))}>
                        <SelectTrigger id="fiscalYear" className="w-full">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {['january', 'february', 'march', 'april', 'may', 'june', 'july', 'august', 'september', 'october', 'november', 'december'].map((m, i) => (
                            <SelectItem key={i + 1} value={String(i + 1)}>{t(`months.${m}`)}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <p className="text-xs text-muted-foreground">
                        {t('auth.onboarding.tax.fiscalYearHelper')}
                      </p>
                    </div>

                    <div className="p-3 rounded-lg bg-muted/50 text-sm text-muted-foreground">
                      <p className="font-medium text-foreground mb-1">{t('auth.onboarding.tax.currency')}</p>
                      <p>{t('auth.onboarding.tax.currencyDescription')}</p>
                    </div>
                  </div>
                </div>
              )}

              {step === 4 && (
                <div className="space-y-6 text-center">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-900 mx-auto">
                    <CheckCircle2 className="h-8 w-8 text-emerald-600 dark:text-emerald-400" />
                  </div>

                  <div className="space-y-1">
                    <h2 className="text-xl font-bold">{t('auth.onboarding.complete.title')}</h2>
                    <p className="text-muted-foreground text-sm max-w-md mx-auto">
                      {t('auth.onboarding.complete.description')}
                    </p>
                  </div>

                  <Separator />

                  <div className="grid grid-cols-2 gap-4 text-left max-w-md mx-auto">
                    <div>
                      <p className="text-xs text-muted-foreground">{t('auth.onboarding.complete.business')}</p>
                      <p className="text-sm font-medium">{businessName}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">{t('auth.onboarding.complete.type')}</p>
                      <p className="text-sm font-medium">{t(`auth.onboarding.businessTypes.${businessType}`)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">{t('auth.onboarding.complete.industry')}</p>
                      <p className="text-sm font-medium">{industry ? t(`auth.onboarding.industries.${industry}`) : ''}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">{t('auth.onboarding.complete.currency')}</p>
                      <p className="text-sm font-medium">CAD</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">{t('auth.onboarding.complete.tax')}</p>
                      <p className="text-sm font-medium">
                        {hstRegistered ? 'HST 13%' : gstRegistered ? 'GST 5%' : t('auth.onboarding.complete.noTax')}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">{t('auth.onboarding.complete.fiscalYear')}</p>
                      <p className="text-sm font-medium">{t(`months.${['', 'january', 'february', 'march', 'april', 'may', 'june', 'july', 'august', 'september', 'october', 'november', 'december'][fiscalYearStart]}`)}</p>
                    </div>
                  </div>

                  <p className="text-xs text-muted-foreground">
                    {t('auth.onboarding.complete.helper')}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Navigation buttons */}
          <div className="flex justify-between">
            {step > 1 && step < 4 ? (
              <Button variant="outline" onClick={handleBack}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                {t('back')}
              </Button>
            ) : (
              <div />
            )}

            {step < 4 ? (
              <Button onClick={handleNext}>
                {t('continue')}
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            ) : (
              <Button onClick={handleComplete} className="bg-emerald-600 hover:bg-emerald-700">
                {t('auth.onboarding.goToDashboard')}
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
