import React, { useState, useEffect } from 'react';
import { getSetting, updateSetting } from '../services/supabaseService';
import { testApiToken, clearLztTokenCache } from '../services/lztService';
import { useNotifications } from './NotificationSystem';
import { Loader2 } from './Icons';

const SettingsPage: React.FC = () => {
  const [lztToken, setLztToken] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const { addNotification } = useNotifications();

  useEffect(() => {
    const fetchToken = async () => {
      setIsLoading(true);
      try {
        const token = await getSetting('lzt_api_token');
        setLztToken(token || '');
      } catch (error: any) {
        addNotification({ type: 'error', message: `Failed to load settings: ${error.message}`, code: 'SET-500' });
      } finally {
        setIsLoading(false);
      }
    };
    fetchToken();
  }, [addNotification]);

  const handleSaveAndTest = async () => {
    setIsSaving(true);
    try {
      // 1. Save the setting to the database
      await updateSetting('lzt_api_token', lztToken);
      addNotification({ type: 'success', message: 'API Token saved to the database.', code: 'SET-200' });

      // 2. Clear the in-memory cache in the service to ensure the new token is used
      clearLztTokenCache();

      // 3. Test the new token by making a live API call
      addNotification({ type: 'info', message: 'Testing the new API token...', code: 'SET-150' });
      const testResult = await testApiToken(lztToken);

      if (testResult.success) {
        addNotification({ type: 'success', message: 'API Token is valid and working correctly!', code: 'SET-201' });
      } else {
        addNotification({ type: 'error', message: `Token test failed: ${testResult.error}`, code: 'SET-502' });
      }

    } catch (error: any) {
      addNotification({ type: 'error', message: `Failed to save token: ${error.message}`, code: 'SET-501' });
    } finally {
      setIsSaving(false);
    }
  };


  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="w-12 h-12 animate-spin text-primary-500" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white dark:bg-gray-800 p-8 rounded-xl shadow-lg">
        <h1 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">API Settings</h1>
        <p className="mb-6 text-gray-600 dark:text-gray-400">
          Configure the API tokens required for the application to function. Changes are saved securely in your database.
        </p>

        <div className="space-y-6">
          <div>
            <label htmlFor="lztToken" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              LZT Market API Token
            </label>
            <input
              type="password"
              id="lztToken"
              name="lztToken"
              value={lztToken}
              onChange={(e) => setLztToken(e.target.value)}
              placeholder="Enter your LZT Market Bearer Token"
              className="mt-1 block w-full shadow-sm sm:text-sm border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 p-2 focus:ring-primary-500 focus:border-primary-500"
            />
            <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
              Your token is stored securely and is only used for making requests to the LZT Market API. Get yours from{' '}
              <a href="https://lolz.guru/account/api" target="_blank" rel="noopener noreferrer" className="text-primary-500 hover:underline">
                your account settings
              </a>.
            </p>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t dark:border-gray-700 text-right">
          <button
            onClick={handleSaveAndTest}
            disabled={isSaving}
            className="inline-flex justify-center items-center py-2 px-6 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:bg-primary-400 disabled:cursor-not-allowed"
          >
            {isSaving && <Loader2 className="w-5 h-5 animate-spin mr-2" />}
            {isSaving ? 'Saving & Testing...' : 'Save and Test Token'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;