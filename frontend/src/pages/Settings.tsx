import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { toast } from 'sonner';
import { useAuth } from '../context/useAuth';
import { User, Lock, Bell, Download, Trash2 } from 'lucide-react';

export function Settings() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'profile' | 'password' | 'preferences'>('profile');
  
  // Profile state
  const [email, setEmail] = useState(user?.email || 'test@example.com');
  const [savingProfile, setSavingProfile] = useState(false);

  // Password state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [savingPassword, setSavingPassword] = useState(false);

  // Preferences state
  const [currency, setCurrency] = useState('USD');
  const [fiscalYearStart, setFiscalYearStart] = useState('1');
  const [darkMode, setDarkMode] = useState(false);

  const handleSaveProfile = async () => {
    setSavingProfile(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 500));
    toast.success('Profile updated successfully');
    setSavingProfile(false);
  };

  const handleSavePassword = async () => {
    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    if (newPassword.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }
    
    setSavingPassword(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 500));
    toast.success('Password updated successfully');
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setSavingPassword(false);
  };

  const handleSavePreferences = () => {
    localStorage.setItem('currency', currency);
    localStorage.setItem('fiscalYearStart', fiscalYearStart);
    localStorage.setItem('darkMode', String(darkMode));
    toast.success('Preferences saved');
  };

  const handleExportData = () => {
    toast.success('Data export started. You will receive an email when ready.');
  };

  const handleDeleteAccount = () => {
    if (confirm('Are you sure? This action cannot be undone.')) {
      toast.error('Account deletion is not implemented in demo mode');
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-600">Manage your account settings and preferences</p>
      </div>

      {/* Tabs */}
      <div className="border-b">
        <nav className="flex gap-4">
          <button
            onClick={() => setActiveTab('profile')}
            className={`px-4 py-2 text-sm font-medium border-b-2 ${
              activeTab === 'profile'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-600 hover:text-gray-800'
            }`}
          >
            <User className="w-4 h-4 inline mr-2" />
            Profile
          </button>
          <button
            onClick={() => setActiveTab('password')}
            className={`px-4 py-2 text-sm font-medium border-b-2 ${
              activeTab === 'password'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-600 hover:text-gray-800'
            }`}
          >
            <Lock className="w-4 h-4 inline mr-2" />
            Password
          </button>
          <button
            onClick={() => setActiveTab('preferences')}
            className={`px-4 py-2 text-sm font-medium border-b-2 ${
              activeTab === 'preferences'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-600 hover:text-gray-800'
            }`}
          >
            <Bell className="w-4 h-4 inline mr-2" />
            Preferences
          </button>
        </nav>
      </div>

      {/* Profile Tab */}
      {activeTab === 'profile' && (
        <Card>
          <CardHeader>
            <CardTitle>Profile Information</CardTitle>
            <CardDescription>Update your account profile information</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Email Address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full max-w-md px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">User ID</label>
              <input
                type="text"
                value={user?.id || 'N/A'}
                disabled
                className="w-full max-w-md px-3 py-2 border border-gray-300 rounded-md bg-gray-100"
              />
            </div>
            <Button onClick={handleSaveProfile} disabled={savingProfile}>
              {savingProfile ? 'Saving...' : 'Save Changes'}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Password Tab */}
      {activeTab === 'password' && (
        <Card>
          <CardHeader>
            <CardTitle>Change Password</CardTitle>
            <CardDescription>Update your password to keep your account secure</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Current Password</label>
              <input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="w-full max-w-md px-3 py-2 border border-gray-300 rounded-md"
                placeholder="Enter current password"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">New Password</label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full max-w-md px-3 py-2 border border-gray-300 rounded-md"
                placeholder="Enter new password"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Confirm New Password</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full max-w-md px-3 py-2 border border-gray-300 rounded-md"
                placeholder="Confirm new password"
              />
            </div>
            <Button onClick={handleSavePassword} disabled={savingPassword}>
              {savingPassword ? 'Updating...' : 'Update Password'}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Preferences Tab */}
      {activeTab === 'preferences' && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Display Preferences</CardTitle>
              <CardDescription>Customize how data is displayed</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Currency</label>
                <select
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                  className="w-full max-w-md px-3 py-2 border border-gray-300 rounded-md"
                >
                  <option value="USD">USD - US Dollar</option>
                  <option value="EUR">EUR - Euro</option>
                  <option value="GBP">GBP - British Pound</option>
                  <option value="CAD">CAD - Canadian Dollar</option>
                  <option value="KRW">KRW - Korean Won</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Fiscal Year Start Month</label>
                <select
                  value={fiscalYearStart}
                  onChange={(e) => setFiscalYearStart(e.target.value)}
                  className="w-full max-w-md px-3 py-2 border border-gray-300 rounded-md"
                >
                  <option value="1">January</option>
                  <option value="2">February</option>
                  <option value="3">March</option>
                  <option value="4">April</option>
                  <option value="5">May</option>
                  <option value="6">June</option>
                  <option value="7">July</option>
                  <option value="8">August</option>
                  <option value="9">September</option>
                  <option value="10">October</option>
                  <option value="11">November</option>
                  <option value="12">December</option>
                </select>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="darkMode"
                  checked={darkMode}
                  onChange={(e) => setDarkMode(e.target.checked)}
                />
                <label htmlFor="darkMode" className="text-sm">Enable Dark Mode (coming soon)</label>
              </div>
              <Button onClick={handleSavePreferences}>Save Preferences</Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Download className="w-5 h-5" />
                Data Export
              </CardTitle>
              <CardDescription>Download your financial data</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 mb-4">
                Export all your financial data including expenses, income, dividends, and categories.
              </p>
              <Button onClick={handleExportData} variant="outline">
                <Download className="w-4 h-4 mr-2" />
                Export All Data
              </Button>
            </CardContent>
          </Card>

          <Card className="border-red-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-red-600">
                <Trash2 className="w-5 h-5" />
                Danger Zone
              </CardTitle>
              <CardDescription>Irreversible account actions</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 mb-4">
                Once you delete your account, there is no going back. Please be certain.
              </p>
              <Button onClick={handleDeleteAccount} variant="destructive" className="bg-red-600 hover:bg-red-700">
                <Trash2 className="w-4 h-4 mr-2" />
                Delete Account
              </Button>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
