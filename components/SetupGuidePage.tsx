import React from 'react';
import { DatabaseIcon, CogIcon, EditIcon } from './Icons';

const SetupGuidePage: React.FC = () => {
  const Section: React.FC<{ icon: React.ReactNode; title: string; children: React.ReactNode }> = ({ icon, title, children }) => (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm">
      <div className="flex items-center mb-4">
        <div className="bg-primary-100 dark:bg-primary-900/50 p-2 rounded-lg mr-4">
          {icon}
        </div>
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">{title}</h2>
      </div>
      <div className="space-y-3 text-gray-600 dark:text-gray-400">
        {children}
      </div>
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="text-center">
        <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white sm:text-4xl">
          U.G.L.P. Setup Guide
        </h1>
        <p className="mt-4 text-lg text-gray-500 dark:text-gray-400">
          Welcome! Follow these steps to get your Universal Game Listing Platform up and running.
        </p>
      </div>

      <Section icon={<DatabaseIcon className="w-6 h-6 text-primary-500" />} title="Step 1: Backend & Database Setup">
        <p>
          This application requires a backend server and a database to store game configurations, listings, and logs.
        </p>
        <ul className="list-disc list-inside space-y-2 pl-4">
          <li>Ensure you have the backend server running and accessible. The frontend is configured to communicate with it via a proxy at <code>/api</code>.</li>
          <li>The backend needs to be connected to a database (e.g., Supabase/PostgreSQL). Make sure the database schema is correctly migrated.</li>
          <li>If you see an error on the main dashboard about "Could not connect to backend", it means the frontend cannot reach your server. Check your server logs and network configuration.</li>
        </ul>
      </Section>

      <Section icon={<CogIcon className="w-6 h-6 text-primary-500" />} title="Step 2: Configure API Keys">
        <p>
          The platform relies on external APIs to fetch data. You must configure the necessary API keys in the settings.
        </p>
        <ol className="list-decimal list-inside space-y-2 pl-4">
          <li>Navigate to the <strong className="text-gray-800 dark:text-gray-200">Settings</strong> page from the sidebar.</li>
          <li>
            Enter your <strong>LZT Market API Token</strong>. You can obtain this from your LZT Market account settings. This token is required for fetching listing data.
          </li>
          <li>
            (Optional) Configure your <strong>Gemini API Key</strong> in the backend environment variables. This is used for the "Deal Score" calculation feature. If not provided, deal scores will not be available.
          </li>
          <li>After entering a token, use the "Save and Test" button to verify its validity. A success message confirms the connection is working.</li>
        </ol>
      </Section>

      <Section icon={<EditIcon className="w-6 h-6 text-primary-500" />} title="Step 3: Manage Games">
        <p>
          Once your APIs are configured, you need to tell the platform which game marketplaces to monitor.
        </p>
        <ol className="list-decimal list-inside space-y-2 pl-4">
          <li>Go to the <strong className="text-gray-800 dark:text-gray-200">Manage Games</strong> page.</li>
          <li>
            Click <strong>"Add from Preset"</strong> to quickly add a supported game. This is the recommended method as it pre-fills all the complex API configurations.
          </li>
          <li>
            Alternatively, you can create a <strong>"Custom Game"</strong> configuration if you know the specific API endpoints and data structure. This is an advanced feature.
          </li>
          <li>For each game, you can enable or disable the <strong>Fetch Worker</strong> and <strong>Check Worker</strong>.
            <ul className="list-disc list-inside pl-6 mt-1">
              <li><strong>Fetch Worker:</strong> Periodically scans the marketplace for new listings.</li>
              <li><strong>Check Worker:</strong> Periodically checks the status of existing listings (e.g., to see if they've been sold or removed).</li>
            </ul>
          </li>
        </ol>
      </Section>

      <div className="bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-400 p-6 rounded-lg">
        <h3 className="text-lg font-semibold text-blue-800 dark:text-blue-300">You're All Set!</h3>
        <p className="mt-2 text-blue-700 dark:text-blue-400">
          After adding games, navigate to their marketplace view from the sidebar. You can use the dashboard to manually trigger fetches and checks, or wait for the automated workers to run. Happy monitoring!
        </p>
      </div>
    </div>
  );
};

export default SetupGuidePage;
