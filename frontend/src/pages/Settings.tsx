import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { zodResolver } from '@hookform/resolvers/zod';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { FormField } from '../components/ui/FormField';
import { toast } from 'sonner';
import { useAuth } from '../context/useAuth';
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogFooter, AlertDialogTitle, AlertDialogDescription, AlertDialogAction, AlertDialogCancel } from '../components/ui/alert-dialog';
import { User, Lock, Settings as SettingsIcon, Download, Trash2 } from 'lucide-react';
import { api } from '../lib/api';
import { profileSchema, changePasswordSchema, type ProfileFormData, type ChangePasswordFormData } from '../lib/form-schemas';
import { LanguageSwitcher } from '../components/LanguageSwitcher';
import { authService } from '../services/auth.service';

export function Settings() {
  const { t } = useTranslation();
  const { user, setUser, logout } = useAuth();
  
  // Profile form
  const { control: profileControl, handleSubmit: handleProfileSubmit, formState: { errors: profileErrors } } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      firstName: user?.firstName || '',
      lastName: user?.lastName || '',
      email: user?.email || '',
    },
  });

  // Password form
  const { control: passwordControl, handleSubmit: handlePasswordSubmit, reset: resetPassword, formState: { errors: passwordErrors } } = useForm<ChangePasswordFormData>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: {
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    },
  });

  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [fiscalYearStart, setFiscalYearStart] = useState('1');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');
  const [deletingAccount, setDeletingAccount] = useState(false);

  const onProfileSubmit = async (data: ProfileFormData) => {
    setSavingProfile(true);
    try {
      const response = await api.put<{ user: { id: string; email: string; firstName: string; lastName: string }; token: string }>('/auth/update-profile', data);
      localStorage.setItem('token', response.data.token);
      toast.success(t('settings.profile.saved'));
      if (user) {
        setUser({
          id: user.id,
          email: response.data.user.email,
          firstName: response.data.user.firstName,
          lastName: response.data.user.lastName,
        });
      }
    } catch {
      toast.error(t('settings.profile.failed'));
    } finally {
      setSavingProfile(false);
    }
  };

  const onPasswordSubmit = async (data: ChangePasswordFormData) => {
    setSavingPassword(true);
    try {
      await api.put('/auth/change-password', { currentPassword: data.currentPassword, newPassword: data.newPassword });
      toast.success(t('settings.password.updated'));
      resetPassword();
    } catch {
      toast.error(t('settings.password.failed'));
    } finally {
      setSavingPassword(false);
    }
  };

  const handleExportData = () => {
    toast.success(t('settings.export.exported'));
  };

  const handleDeleteAccountConfirm = async () => {
    if (!deletePassword) return;
    setDeletingAccount(true);
    try {
      await authService.deleteAccount(deletePassword);
      toast.success(t('settings.danger.deleteSuccess'));
      setShowDeleteConfirm(false);
      setDeletePassword('');
      logout();
    } catch {
      toast.error(t('settings.danger.deleteFailed'));
    } finally {
      setDeletingAccount(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{t('settings.title')}</h1>
        <p className="text-muted-foreground">{t('settings.description')}</p>
      </div>

      <Tabs defaultValue="profile">
        <TabsList>
          <TabsTrigger value="profile">
            <User className="h-4 w-4 mr-2" />
            {t('settings.tabs.profile')}
          </TabsTrigger>
          <TabsTrigger value="password">
            <Lock className="h-4 w-4 mr-2" />
            {t('settings.tabs.password')}
          </TabsTrigger>
          <TabsTrigger value="preferences">
            <SettingsIcon className="h-4 w-4 mr-2" />
            {t('settings.tabs.preferences')}
          </TabsTrigger>
        </TabsList>

        {/* Profile Tab */}
        <TabsContent value="profile">
          <Card>
            <CardHeader>
              <CardTitle>{t('settings.profile.title')}</CardTitle>
              <CardDescription>{t('settings.profile.description')}</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleProfileSubmit(onProfileSubmit)} className="space-y-4">
                <div className="grid grid-cols-2 gap-3 max-w-md">
                  <FormField
                    label={t('settings.profile.firstName')}
                    name="firstName"
                    control={profileControl}
                    errors={profileErrors}
                    required
                    placeholder={t('settings.profile.firstNamePlaceholder')}
                  />
                  <FormField
                    label={t('settings.profile.lastName')}
                    name="lastName"
                    control={profileControl}
                    errors={profileErrors}
                    required
                    placeholder={t('settings.profile.lastNamePlaceholder')}
                  />
                </div>
                <FormField
                  label={t('settings.profile.email')}
                  name="email"
                  control={profileControl}
                  errors={profileErrors}
                  type="email"
                  required
                />
                <div>
                  <Label>{t('settings.profile.userId')}</Label>
                  <Input
                    type="text"
                    value={user?.id || 'N/A'}
                    disabled
                    className="max-w-md bg-muted"
                  />
                </div>
                <Button type="submit" disabled={savingProfile}>
                  {savingProfile ? t('saving') : t('settings.profile.saveChanges')}
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Password Tab */}
        <TabsContent value="password">
          <Card>
            <CardHeader>
              <CardTitle>{t('settings.password.title')}</CardTitle>
              <CardDescription>{t('settings.password.description')}</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handlePasswordSubmit(onPasswordSubmit)} className="space-y-4">
                <FormField
                  label={t('settings.password.currentPassword')}
                  name="currentPassword"
                  control={passwordControl}
                  errors={passwordErrors}
                  type="password"
                  required
                  placeholder={t('settings.password.currentPlaceholder')}
                />
                <FormField
                  label={t('settings.password.newPassword')}
                  name="newPassword"
                  control={passwordControl}
                  errors={passwordErrors}
                  type="password"
                  required
                  placeholder={t('settings.password.newPlaceholder')}
                />
                <FormField
                  label={t('settings.password.confirmPassword')}
                  name="confirmPassword"
                  control={passwordControl}
                  errors={passwordErrors}
                  type="password"
                  required
                  placeholder={t('settings.password.confirmPlaceholder')}
                />
                <Button type="submit" disabled={savingPassword}>
                  {savingPassword ? t('updating') : t('settings.password.updatePassword')}
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Preferences Tab */}
        <TabsContent value="preferences">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>{t('settings.preferences.title')}</CardTitle>
                <CardDescription>{t('settings.preferences.description')}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>{t('settings.preferences.currency')}</Label>
                  <Input
                    value={t('settings.preferences.currencyValue')}
                    disabled
                    className="max-w-md bg-muted"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    {t('settings.preferences.currencyHelper')}
                  </p>
                </div>
                <div>
                  <Label>{t('settings.preferences.fiscalYearStart')}</Label>
                  <Select value={fiscalYearStart} onValueChange={setFiscalYearStart}>
                    <SelectTrigger className="w-full max-w-md">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">{t('months.january')}</SelectItem>
                      <SelectItem value="2">{t('months.february')}</SelectItem>
                      <SelectItem value="3">{t('months.march')}</SelectItem>
                      <SelectItem value="4">{t('months.april')}</SelectItem>
                      <SelectItem value="5">{t('months.may')}</SelectItem>
                      <SelectItem value="6">{t('months.june')}</SelectItem>
                      <SelectItem value="7">{t('months.july')}</SelectItem>
                      <SelectItem value="8">{t('months.august')}</SelectItem>
                      <SelectItem value="9">{t('months.september')}</SelectItem>
                      <SelectItem value="10">{t('months.october')}</SelectItem>
                      <SelectItem value="11">{t('months.november')}</SelectItem>
                      <SelectItem value="12">{t('months.december')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>{t('settings.preferences.language')}</Label>
                  <div className="mt-1">
                    <LanguageSwitcher />
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">{t('settings.preferences.languageHelper')}</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Download className="w-5 h-5" />
                  {t('settings.export.title')}
                </CardTitle>
                <CardDescription>{t('settings.export.description')}</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  {t('settings.export.descriptionDetail')}
                </p>
                <Button onClick={handleExportData} variant="outline">
                  <Download className="w-4 h-4 mr-2" />
                  {t('settings.export.exportAll')}
                </Button>
              </CardContent>
            </Card>

            <Card className="border-destructive/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-destructive">
                  <Trash2 className="w-5 h-5" />
                  {t('settings.danger.title')}
                </CardTitle>
                <CardDescription>{t('settings.danger.description')}</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  {t('settings.danger.deleteWarning')}
                </p>
                <Button onClick={() => setShowDeleteConfirm(true)} variant="destructive">
                  <Trash2 className="w-4 h-4 mr-2" />
                  {t('settings.danger.deleteAccount')}
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      <AlertDialog open={showDeleteConfirm} onOpenChange={(open) => {
        if (!open) {
          setShowDeleteConfirm(false);
          setDeletePassword('');
        }
      }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('settings.danger.confirmDelete')}</AlertDialogTitle>
            <AlertDialogDescription>{t('settings.danger.deleteWarning')}</AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-2">
            <Label htmlFor="delete-password">{t('settings.danger.passwordConfirm')}</Label>
            <Input
              id="delete-password"
              type="password"
              placeholder={t('settings.danger.passwordPlaceholder')}
              value={deletePassword}
              onChange={(e) => setDeletePassword(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && deletePassword) {
                  handleDeleteAccountConfirm();
                }
              }}
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDeletePassword('')}>{t('cancel')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteAccountConfirm}
              disabled={!deletePassword || deletingAccount}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deletingAccount ? t('deleting') : t('settings.danger.deleteAccount')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
