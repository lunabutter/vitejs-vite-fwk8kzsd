import React, { useState } from 'react';
import { Save, Mail, Bell, Shield, Key } from 'lucide-react';
import { toast } from 'react-hot-toast';

interface NotificationSetting {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
}

export default function SettingsAdmin() {
  const [loading, setLoading] = useState(false);
  const [notificationSettings, setNotificationSettings] = useState<NotificationSetting[]>([
    {
      id: 'new-order',
      name: 'New Order Notifications',
      description: 'Get notified when a new order is placed',
      enabled: true,
    },
    {
      id: 'low-stock',
      name: 'Low Stock Alerts',
      description: 'Get notified when product stock is running low',
      enabled: true,
    },
    {
      id: 'customer-support',
      name: 'Customer Support Requests',
      description: 'Get notified when customers need assistance',
      enabled: false,
    },
  ]);

  const handleNotificationToggle = (id: string) => {
    setNotificationSettings(settings =>
      settings.map(setting =>
        setting.id === id ? { ...setting, enabled: !setting.enabled } : setting
      )
    );
  };

  const handleSaveSettings = async () => {
    setLoading(true);
    try {
      // Save settings to backend
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulated API call
      toast.success('Settings saved successfully');
    } catch (error) {
      toast.error('Failed to save settings');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-8">
      <div className="max-w-4xl mx-auto">
        <div className="sm:flex sm:items-center">
          <div className="sm:flex-auto">
            <h1 className="text-2xl font-semibold text-gray-900">Settings</h1>
            <p className="mt-2 text-sm text-gray-700">
              Manage your application settings and preferences.
            </p>
          </div>
        </div>

        <div className="mt-8 space-y-8">
          {/* Email Settings */}
          <div className="bg-white shadow rounded-lg">
            <div className="p-6">
              <div className="flex items-center">
                <Mail className="h-6 w-6 text-gray-400" />
                <h2 className="ml-3 text-lg font-medium text-gray-900">Email Settings</h2>
              </div>
              <div className="mt-6 space-y-4">
                <div>
                  <label htmlFor="support-email" className="block text-sm font-medium text-gray-700">
                    Support Email
                  </label>
                  <input
                    type="email"
                    id="support-email"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    defaultValue="support@autopartshub.com"
                  />
                </div>
                <div>
                  <label htmlFor="sales-email" className="block text-sm font-medium text-gray-700">
                    Sales Email
                  </label>
                  <input
                    type="email"
                    id="sales-email"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    defaultValue="sales@autopartshub.com"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Notification Settings */}
          <div className="bg-white shadow rounded-lg">
            <div className="p-6">
              <div className="flex items-center">
                <Bell className="h-6 w-6 text-gray-400" />
                <h2 className="ml-3 text-lg font-medium text-gray-900">Notification Preferences</h2>
              </div>
              <div className="mt-6 space-y-4">
                {notificationSettings.map((setting) => (
                  <div key={setting.id} className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{setting.name}</p>
                      <p className="text-sm text-gray-500">{setting.description}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleNotificationToggle(setting.id)}
                      className={`${
                        setting.enabled ? 'bg-blue-600' : 'bg-gray-200'
                      } relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2`}
                    >
                      <span
                        className={`${
                          setting.enabled ? 'translate-x-5' : 'translate-x-0'
                        } pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out`}
                      />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Security Settings */}
          <div className="bg-white shadow rounded-lg">
            <div className="p-6">
              <div className="flex items-center">
                <Shield className="h-6 w-6 text-gray-400" />
                <h2 className="ml-3 text-lg font-medium text-gray-900">Security Settings</h2>
              </div>
              <div className="mt-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Two-Factor Authentication
                  </label>
                  <div className="mt-2 flex items-center">
                    <button
                      type="button"
                      className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                      <Key className="h-4 w-4 mr-2" />
                      Enable 2FA
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Session Management
                  </label>
                  <div className="mt-2">
                    <button
                      type="button"
                      className="text-sm text-red-600 hover:text-red-500"
                    >
                      Sign out of all other sessions
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Save Button */}
          <div className="flex justify-end">
            <button
              type="button"
              onClick={handleSaveSettings}
              disabled={loading}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              <Save className="h-4 w-4 mr-2" />
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}