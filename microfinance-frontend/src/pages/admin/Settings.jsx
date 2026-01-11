import React, { useState, useEffect } from 'react';
import { 
  ShieldCheckIcon,
  CurrencyDollarIcon,
  UserGroupIcon,
  ChartBarIcon,
  BellIcon,
  GlobeAltIcon,
  DocumentTextIcon,
  CheckCircleIcon,
  ExclamationCircleIcon
} from '@heroicons/react/24/outline';
import api from '../../services/api';

const Settings = () => {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [hasChanges, setHasChanges] = useState(false);

  const [settings, setSettings] = useState({
    // Security Settings
    security: {
      minPasswordLength: 8,
      requireSpecialChar: true,
      requireUppercase: true,
      requireNumbers: true,
      twoFactorEnabled: false,
      sessionTimeout: 30,
      maxLoginAttempts: 5,
      passwordExpiryDays: 90
    },
    // Financial Settings
    financial: {
      defaultInterestRate: 12.5,
      loanProcessingFee: 2.5,
      latePenaltyRate: 5.0,
      minLoanAmount: 1000,
      maxLoanAmount: 100000,
      defaultLoanTerm: 12,
      earlyRepaymentPenalty: 0
    },
    // User Settings
    user: {
      defaultRole: 'user',
      maxUsers: 1000,
      autoApproveUsers: false,
      requireEmailVerification: true,
      allowSelfRegistration: true,
      defaultCreditScore: 500
    },
    // Analytics Settings
    analytics: {
      dataRetentionMonths: 24,
      reportFrequency: 'weekly',
      enableTracking: true,
      anonymizeData: false,
      exportFormat: 'pdf'
    },
    // Notification Settings
    notifications: {
      emailNotifications: true,
      smsNotifications: false,
      pushNotifications: true,
      loanApprovalNotif: true,
      paymentReminderNotif: true,
      overdueNotif: true,
      reminderDaysBefore: 3
    },
    // System Settings
    system: {
      maintenanceMode: false,
      allowNewLoans: true,
      allowNewRegistrations: true,
      systemLanguage: 'en',
      timezone: 'UTC',
      currency: 'USD',
      dateFormat: 'MM/DD/YYYY'
    }
  });

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const response = await api.get('/api/v1/admin/settings');
      if (response.data) {
        setSettings(prevSettings => ({
          ...prevSettings,
          ...response.data
        }));
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
      // Use default settings if fetch fails
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (category, field, value) => {
    setSettings(prev => ({
      ...prev,
      [category]: {
        ...prev[category],
        [field]: value
      }
    }));
    setHasChanges(true);
    setMessage({ type: '', text: '' });
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage({ type: '', text: '' });
    
    try {
      await api.put('/api/v1/admin/settings', settings);
      setMessage({ type: 'success', text: 'Settings saved successfully!' });
      setHasChanges(false);
      
      // Clear message after 3 seconds
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    } catch (error) {
      console.error('Error saving settings:', error);
      setMessage({ 
        type: 'error', 
        text: error.response?.data?.message || 'Failed to save settings. Please try again.' 
      });
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    fetchSettings();
    setHasChanges(false);
    setMessage({ type: 'info', text: 'Settings reset to last saved values.' });
    setTimeout(() => setMessage({ type: '', text: '' }), 3000);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">System Settings</h2>
          <p className="mt-1 text-gray-500">Configure system settings and preferences</p>
        </div>
        {hasChanges && (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-yellow-100 text-yellow-800">
            Unsaved Changes
          </span>
        )}
      </div>

      {/* Message Alert */}
      {message.text && (
        <div className={`rounded-lg p-4 ${
          message.type === 'success' ? 'bg-green-50 border border-green-200' :
          message.type === 'error' ? 'bg-red-50 border border-red-200' :
          'bg-blue-50 border border-blue-200'
        }`}>
          <div className="flex items-center">
            {message.type === 'success' ? (
              <CheckCircleIcon className="h-5 w-5 text-green-600 mr-2" />
            ) : (
              <ExclamationCircleIcon className="h-5 w-5 text-red-600 mr-2" />
            )}
            <p className={`text-sm font-medium ${
              message.type === 'success' ? 'text-green-800' :
              message.type === 'error' ? 'text-red-800' :
              'text-blue-800'
            }`}>
              {message.text}
            </p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">{/* Security Settings */}

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-6">
            <div className="flex items-center mb-4">
              <div className="flex-shrink-0">
                <div className="p-3 bg-blue-100 rounded-full">
                  <ShieldCheckIcon className="h-6 w-6 text-blue-600" />
                </div>
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-medium text-gray-900">Security Settings</h3>
                <p className="text-sm text-gray-500">Configure security parameters</p>
              </div>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Min Password Length</label>
                <input
                  type="number"
                  value={settings.security.minPasswordLength}
                  onChange={(e) => handleChange('security', 'minPasswordLength', parseInt(e.target.value))}
                  className="mt-1 w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  min="6"
                  max="20"
                />
              </div>
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-gray-700">Require Special Characters</label>
                <input
                  type="checkbox"
                  checked={settings.security.requireSpecialChar}
                  onChange={(e) => handleChange('security', 'requireSpecialChar', e.target.checked)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
              </div>
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-gray-700">Require Uppercase</label>
                <input
                  type="checkbox"
                  checked={settings.security.requireUppercase}
                  onChange={(e) => handleChange('security', 'requireUppercase', e.target.checked)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
              </div>
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-gray-700">Two-Factor Authentication</label>
                <input
                  type="checkbox"
                  checked={settings.security.twoFactorEnabled}
                  onChange={(e) => handleChange('security', 'twoFactorEnabled', e.target.checked)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Session Timeout (minutes)</label>
                <input
                  type="number"
                  value={settings.security.sessionTimeout}
                  onChange={(e) => handleChange('security', 'sessionTimeout', parseInt(e.target.value))}
                  className="mt-1 w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Max Login Attempts</label>
                <input
                  type="number"
                  value={settings.security.maxLoginAttempts}
                  onChange={(e) => handleChange('security', 'maxLoginAttempts', parseInt(e.target.value))}
                  className="mt-1 w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Financial Settings */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-6">
            <div className="flex items-center mb-4">
              <div className="flex-shrink-0">
                <div className="p-3 bg-green-100 rounded-full">
                  <CurrencyDollarIcon className="h-6 w-6 text-green-600" />
                </div>
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-medium text-gray-900">Financial Settings</h3>
                <p className="text-sm text-gray-500">Configure financial parameters</p>
              </div>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Default Interest Rate (%)</label>
                <input
                  type="number"
                  step="0.1"
                  value={settings.financial.defaultInterestRate}
                  onChange={(e) => handleChange('financial', 'defaultInterestRate', parseFloat(e.target.value))}
                  className="mt-1 w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Loan Processing Fee (%)</label>
                <input
                  type="number"
                  step="0.1"
                  value={settings.financial.loanProcessingFee}
                  onChange={(e) => handleChange('financial', 'loanProcessingFee', parseFloat(e.target.value))}
                  className="mt-1 w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Late Penalty Rate (%)</label>
                <input
                  type="number"
                  step="0.1"
                  value={settings.financial.latePenaltyRate}
                  onChange={(e) => handleChange('financial', 'latePenaltyRate', parseFloat(e.target.value))}
                  className="mt-1 w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Min Loan Amount</label>
                <input
                  type="number"
                  value={settings.financial.minLoanAmount}
                  onChange={(e) => handleChange('financial', 'minLoanAmount', parseInt(e.target.value))}
                  className="mt-1 w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Max Loan Amount</label>
                <input
                  type="number"
                  value={settings.financial.maxLoanAmount}
                  onChange={(e) => handleChange('financial', 'maxLoanAmount', parseInt(e.target.value))}
                  className="mt-1 w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Default Loan Term (months)</label>
                <input
                  type="number"
                  value={settings.financial.defaultLoanTerm}
                  onChange={(e) => handleChange('financial', 'defaultLoanTerm', parseInt(e.target.value))}
                  className="mt-1 w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>
        </div>

        {/* User Settings */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-6">
            <div className="flex items-center mb-4">
              <div className="flex-shrink-0">
                <div className="p-3 bg-yellow-100 rounded-full">
                  <UserGroupIcon className="h-6 w-6 text-yellow-600" />
                </div>
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-medium text-gray-900">User Settings</h3>
                <p className="text-sm text-gray-500">Configure user-related settings</p>
              </div>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Default Role</label>
                <select 
                  value={settings.user.defaultRole}
                  onChange={(e) => handleChange('user', 'defaultRole', e.target.value)}
                  className="mt-1 w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="user">User</option>
                  <option value="admin">Admin</option>
                  <option value="agent">Agent</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Max Users</label>
                <input
                  type="number"
                  value={settings.user.maxUsers}
                  onChange={(e) => handleChange('user', 'maxUsers', parseInt(e.target.value))}
                  className="mt-1 w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-gray-700">Auto-Approve Users</label>
                <input
                  type="checkbox"
                  checked={settings.user.autoApproveUsers}
                  onChange={(e) => handleChange('user', 'autoApproveUsers', e.target.checked)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
              </div>
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-gray-700">Require Email Verification</label>
                <input
                  type="checkbox"
                  checked={settings.user.requireEmailVerification}
                  onChange={(e) => handleChange('user', 'requireEmailVerification', e.target.checked)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
              </div>
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-gray-700">Allow Self Registration</label>
                <input
                  type="checkbox"
                  checked={settings.user.allowSelfRegistration}
                  onChange={(e) => handleChange('user', 'allowSelfRegistration', e.target.checked)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Default Credit Score</label>
                <input
                  type="number"
                  value={settings.user.defaultCreditScore}
                  onChange={(e) => handleChange('user', 'defaultCreditScore', parseInt(e.target.value))}
                  className="mt-1 w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Analytics Settings */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-6">
            <div className="flex items-center mb-4">
              <div className="flex-shrink-0">
                <div className="p-3 bg-purple-100 rounded-full">
                  <ChartBarIcon className="h-6 w-6 text-purple-600" />
                </div>
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-medium text-gray-900">Analytics Settings</h3>
                <p className="text-sm text-gray-500">Configure analytics preferences</p>
              </div>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Data Retention (months)</label>
                <input
                  type="number"
                  value={settings.analytics.dataRetentionMonths}
                  onChange={(e) => handleChange('analytics', 'dataRetentionMonths', parseInt(e.target.value))}
                  className="mt-1 w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Report Frequency</label>
                <select 
                  value={settings.analytics.reportFrequency}
                  onChange={(e) => handleChange('analytics', 'reportFrequency', e.target.value)}
                  className="mt-1 w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                  <option value="quarterly">Quarterly</option>
                </select>
              </div>
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-gray-700">Enable Tracking</label>
                <input
                  type="checkbox"
                  checked={settings.analytics.enableTracking}
                  onChange={(e) => handleChange('analytics', 'enableTracking', e.target.checked)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
              </div>
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-gray-700">Anonymize Data</label>
                <input
                  type="checkbox"
                  checked={settings.analytics.anonymizeData}
                  onChange={(e) => handleChange('analytics', 'anonymizeData', e.target.checked)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Export Format</label>
                <select 
                  value={settings.analytics.exportFormat}
                  onChange={(e) => handleChange('analytics', 'exportFormat', e.target.value)}
                  className="mt-1 w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="pdf">PDF</option>
                  <option value="excel">Excel</option>
                  <option value="csv">CSV</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Notification Settings */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-6">
            <div className="flex items-center mb-4">
              <div className="flex-shrink-0">
                <div className="p-3 bg-indigo-100 rounded-full">
                  <BellIcon className="h-6 w-6 text-indigo-600" />
                </div>
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-medium text-gray-900">Notification Settings</h3>
                <p className="text-sm text-gray-500">Configure notification preferences</p>
              </div>
            </div>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-gray-700">Email Notifications</label>
                <input
                  type="checkbox"
                  checked={settings.notifications.emailNotifications}
                  onChange={(e) => handleChange('notifications', 'emailNotifications', e.target.checked)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
              </div>
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-gray-700">SMS Notifications</label>
                <input
                  type="checkbox"
                  checked={settings.notifications.smsNotifications}
                  onChange={(e) => handleChange('notifications', 'smsNotifications', e.target.checked)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
              </div>
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-gray-700">Push Notifications</label>
                <input
                  type="checkbox"
                  checked={settings.notifications.pushNotifications}
                  onChange={(e) => handleChange('notifications', 'pushNotifications', e.target.checked)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
              </div>
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-gray-700">Loan Approval Notifications</label>
                <input
                  type="checkbox"
                  checked={settings.notifications.loanApprovalNotif}
                  onChange={(e) => handleChange('notifications', 'loanApprovalNotif', e.target.checked)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
              </div>
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-gray-700">Payment Reminders</label>
                <input
                  type="checkbox"
                  checked={settings.notifications.paymentReminderNotif}
                  onChange={(e) => handleChange('notifications', 'paymentReminderNotif', e.target.checked)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
              </div>
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-gray-700">Overdue Notifications</label>
                <input
                  type="checkbox"
                  checked={settings.notifications.overdueNotif}
                  onChange={(e) => handleChange('notifications', 'overdueNotif', e.target.checked)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Reminder Days Before Due</label>
                <input
                  type="number"
                  value={settings.notifications.reminderDaysBefore}
                  onChange={(e) => handleChange('notifications', 'reminderDaysBefore', parseInt(e.target.value))}
                  className="mt-1 w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>
        </div>

        {/* System Settings */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-6">
            <div className="flex items-center mb-4">
              <div className="flex-shrink-0">
                <div className="p-3 bg-red-100 rounded-full">
                  <GlobeAltIcon className="h-6 w-6 text-red-600" />
                </div>
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-medium text-gray-900">System Settings</h3>
                <p className="text-sm text-gray-500">Configure system-wide settings</p>
              </div>
            </div>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-gray-700">Maintenance Mode</label>
                <input
                  type="checkbox"
                  checked={settings.system.maintenanceMode}
                  onChange={(e) => handleChange('system', 'maintenanceMode', e.target.checked)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
              </div>
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-gray-700">Allow New Loans</label>
                <input
                  type="checkbox"
                  checked={settings.system.allowNewLoans}
                  onChange={(e) => handleChange('system', 'allowNewLoans', e.target.checked)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
              </div>
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-gray-700">Allow New Registrations</label>
                <input
                  type="checkbox"
                  checked={settings.system.allowNewRegistrations}
                  onChange={(e) => handleChange('system', 'allowNewRegistrations', e.target.checked)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">System Language</label>
                <select 
                  value={settings.system.systemLanguage}
                  onChange={(e) => handleChange('system', 'systemLanguage', e.target.value)}
                  className="mt-1 w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="en">English</option>
                  <option value="es">Spanish</option>
                  <option value="fr">French</option>
                  <option value="sw">Swahili</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Timezone</label>
                <select 
                  value={settings.system.timezone}
                  onChange={(e) => handleChange('system', 'timezone', e.target.value)}
                  className="mt-1 w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="UTC">UTC</option>
                  <option value="America/New_York">Eastern Time</option>
                  <option value="America/Chicago">Central Time</option>
                  <option value="America/Los_Angeles">Pacific Time</option>
                  <option value="Africa/Nairobi">East Africa Time</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Currency</label>
                <select 
                  value={settings.system.currency}
                  onChange={(e) => handleChange('system', 'currency', e.target.value)}
                  className="mt-1 w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="USD">USD - US Dollar</option>
                  <option value="EUR">EUR - Euro</option>
                  <option value="GBP">GBP - British Pound</option>
                  <option value="KES">KES - Kenyan Shilling</option>
                  <option value="NGN">NGN - Nigerian Naira</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Date Format</label>
                <select 
                  value={settings.system.dateFormat}
                  onChange={(e) => handleChange('system', 'dateFormat', e.target.value)}
                  className="mt-1 w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                  <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                  <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center justify-between pt-6 border-t">
        <button 
          onClick={handleReset}
          disabled={!hasChanges || saving}
          className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Reset Changes
        </button>
        <div className="flex gap-3">
          <button 
            onClick={handleSave}
            disabled={!hasChanges || saving}
            className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
          >
            {saving ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Saving...
              </>
            ) : (
              'Save Changes'
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Settings;
