import React from 'react';
import { BookOpenIcon, CogIcon, DatabaseIcon, AlertTriangle } from './Icons';

const GuideSection: React.FC<{ icon: React.ReactNode; title: string; children: React.ReactNode }> = ({ icon, title, children }) => (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm">
        <div className="flex items-center mb-4">
            <div className="bg-primary-100 dark:bg-primary-900/50 p-2 rounded-full mr-4">
                {icon}
            </div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">{title}</h2>
        </div>
        <div className="prose prose-sm dark:prose-invert max-w-none text-gray-600 dark:text-gray-300">
            {children}
        </div>
    </div>
);

const SetupGuidePage: React.FC = () => {
    return (
        <div className="space-y-8">
            <div className="text-center">
                <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-4xl">Setup Guide</h1>
                <p className="mt-4 text-lg text-gray-500 dark:text-gray-400">Welcome to U.G.L.P. (Unified Game Listing Platform). Follow these steps to get started.</p>
            </div>

            <div className="bg-yellow-50 dark:bg-yellow-900/20 border-l-4 border-yellow-400 dark:border-yellow-500 p-4 rounded-md" role="alert">
                <div className="flex">
                    <div className="flex-shrink-0">
                        <AlertTriangle className="h-5 w-5 text-yellow-400 dark:text-yellow-500" aria-hidden="true" />
                    </div>
                    <div className="ml-3">
                        <p className="text-sm text-yellow-700 dark:text-yellow-200">
                            <strong>Critical Prerequisite:</strong> This is a front-end application that requires a separately configured and running back-end server. This guide assumes your back-end is already deployed and accessible.
                        </p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <GuideSection icon={<CogIcon className="w-6 h-6 text-primary-600 dark:text-primary-400" />} title="1. Configure API Tokens">
                    <p>The application requires API tokens to communicate with external services. These are stored securely in your database via the backend.</p>
                    <ol>
                        <li>Navigate to the <strong>Settings</strong> page using the sidebar menu.</li>
                        <li>
                            <strong>LZT Market API Token:</strong> You need a bearer token from LZT Market. You can obtain this from your account settings on the LZT Market website (<code>lolz.guru/account/api</code>). Paste this token into the input field and click "Save and Test".
                        </li>
                        <li>
                            <strong>Gemini API Key (Optional):</strong> For the 'Deal Score' feature to work, a Google Gemini API key is required. This key must be set as an environment variable named <code>API_KEY</code> in a <code>.env</code> file at the root of your front-end project. The application will automatically use it if available. Without it, the deal score feature will be disabled.
                        </li>
                    </ol>
                </GuideSection>

                <GuideSection icon={<BookOpenIcon className="w-6 h-6 text-primary-600 dark:text-primary-400" />} title="2. Manage Games">
                    <p>Define the game marketplaces you want to monitor.</p>
                    <ul>
                        <li>Go to the <strong>Manage Games</strong> page.</li>
                        <li>Click <strong>"Add from Preset"</strong> to quickly add a pre-configured game like Fortnite, Steam, or Riot Games. This is the recommended method.</li>
                        <li>Alternatively, click <strong>"Add Custom Game"</strong> to manually configure all API paths, data columns, and filters. This is an advanced option for custom integrations.</li>
                        <li>Once a game is added, it will appear in the sidebar. Click on it to view its marketplace dashboard.</li>
                    </ul>
                </GuideSection>

                <GuideSection icon={<DatabaseIcon className="w-6 h-6 text-primary-600 dark:text-primary-400" />} title="3. Understanding Workers">
                    <p>Automated tasks run in the background to keep your data fresh. These are controlled by the "Fetch" and "Check" toggles for each game.</p>
                    <dl>
                        <dt>Fetch Worker</dt>
                        <dd>This worker periodically queries the LZT Market API for new listings for a specific game. It adds new items to your database and updates existing ones.</dd>
                        <dt>Check Worker</dt>
                        <dd>This worker checks the status of your active listings. If an item has been sold, deleted, or is no longer available, it will be automatically moved to the "Archived" section.</dd>
                    </dl>
                    <p>You can also trigger these workers manually from the Dashboard page for any game.</p>
                </GuideSection>
                
                <GuideSection icon={<AlertTriangle className="w-6 h-6 text-primary-600 dark:text-primary-400" />} title="Troubleshooting">
                     <p>If you encounter errors, here are some common solutions:</p>
                    <ul>
                        <li><strong>"Could not connect to backend"</strong>: Ensure your backend server is running and that the frontend is configured to connect to the correct address. Check your browser's developer console for network errors.</li>
                        <li><strong>"LZT Market API token is not configured"</strong>: Go to the Settings page and ensure your LZT token is saved and valid.</li>
                        <li><strong>Fetch/Check errors</strong>: The LZT API might be temporarily unavailable, or your token might have expired. Test your token on the Settings page. Check the logs on the game's Dashboard for specific error messages.</li>
                    </ul>
                </GuideSection>
            </div>
        </div>
    );
};

export default SetupGuidePage;
