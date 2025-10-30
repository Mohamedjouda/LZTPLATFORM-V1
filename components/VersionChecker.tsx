import React, { useState, useEffect } from 'react';
import { getAppVersion } from '../services/apiService';
import { useNotifications } from './NotificationSystem';
import { RefreshCwIcon } from './Icons';

const VersionChecker: React.FC = () => {
  const [isOutdated, setIsOutdated] = useState(false);
  const { addNotification } = useNotifications();
  const clientVersion = process.env.APP_VERSION;

  useEffect(() => {
    const checkVersion = async () => {
      try {
        const serverVersion = await getAppVersion();

        if (clientVersion && serverVersion && serverVersion !== '?.?.?' && clientVersion !== serverVersion) {
          // The currently running code's version is different from the latest
          // version on the server, so an update is available.
          setIsOutdated(true);
          addNotification({
            type: 'error',
            message: `Update available! You are on v${clientVersion}, latest is v${serverVersion}. Please refresh.`,
            code: 'UPDATE-REQ'
          });
        }
      } catch (error) {
        console.error("Version check failed:", error);
      }
    };

    // Check for a new version after a few seconds to not block initial render.
    const timeoutId = setTimeout(checkVersion, 4000);
    return () => clearTimeout(timeoutId);
  }, [addNotification, clientVersion]);

  if (!isOutdated) {
    return null;
  }

  const handleRefresh = () => {
    // This forces the browser to reload the page from the server, bypassing most caches.
    window.location.reload();
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-[9999] flex items-center justify-center backdrop-blur-sm" aria-modal="true" role="dialog">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl p-8 max-w-md text-center m-4">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Update Available</h2>
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          A new version of the application has been deployed. Please refresh your browser to get the latest features and fixes.
        </p>
        <button
          onClick={handleRefresh}
          className="w-full bg-primary-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-primary-700 flex items-center justify-center text-lg transition-transform transform hover:scale-105"
        >
          <RefreshCwIcon className="w-5 h-5 mr-3" />
          Refresh Now
        </button>
      </div>
    </div>
  );
};

export default VersionChecker;