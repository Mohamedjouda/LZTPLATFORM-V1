import React from 'react';
import { ExternalLinkIcon } from './Icons';

const SetupGuidePage: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto bg-white dark:bg-gray-800 p-8 rounded-xl shadow-lg">
      <h1 className="text-3xl font-bold mb-4">Setup Guide</h1>
      <p className="text-lg text-gray-600 dark:text-gray-400 mb-8">
        Welcome to the Universal Game Listing Platform (U.G.L.P.). Follow these steps to get the application running correctly. If you're seeing this page due to an error, it's likely one of these configuration steps is missing or incorrect.
      </p>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold border-b pb-2 dark:border-gray-600">1. Backend &amp; Database Setup</h2>
        <p>
          This application requires a backend server and a database to function. The backend handles API requests, proxies calls to external services to avoid CORS issues, and communicates with the database.
        </p>
        <ul className="list-disc pl-6 space-y-2">
          <li>
            <strong>Backend Server:</strong> Ensure your Node.js backend server is running. It's responsible for all the logic in the <code>/api</code> endpoints.
          </li>
          <li>
            <strong>Database:</strong> The application is designed to work with a PostgreSQL database, often managed through a service like Supabase. You must provide the correct database connection string as an environment variable to your backend server.
          </li>
        </ul>
      </section>

      <section className="space-y-4 mt-8">
        <h2 className="text-2xl font-semibold border-b pb-2 dark:border-gray-600">2. LZT Market API Token</h2>
        <p>
          To fetch listings from the LZT Market, you need to provide a personal API token.
        </p>
        <ol className="list-decimal pl-6 space-y-2">
          <li>
            Navigate to the{' '}
            <a href="https://lolz.guru/account/api" target="_blank" rel="noopener noreferrer" className="text-primary-500 hover:underline">
              LZT Market API settings page <ExternalLinkIcon className="w-4 h-4 inline-block" />
            </a>.
          </li>
          <li>Generate a new token if you don't have one. Ensure it has permissions to read market data.</li>
          <li>
            Go to the <strong className="font-semibold">Settings</strong> page in this application.
          </li>
          <li>Paste your token into the "LZT Market API Token" field and click "Save and Test Token".</li>
        </ol>
        <div className="bg-yellow-100 dark:bg-yellow-900/50 border-l-4 border-yellow-500 text-yellow-800 dark:text-yellow-300 p-4 rounded-r-lg">
          <p><strong className="font-bold">Important:</strong> The application will not be able to fetch any game listings without a valid token.</p>
        </div>
      </section>
      
      <section className="space-y-4 mt-8">
        <h2 className="text-2xl font-semibold border-b pb-2 dark:border-gray-600">3. Google Gemini API Key (Optional)</h2>
        <p>
          The "Deal Score" feature uses the Google Gemini API to analyze listing data and provide a rating. This is an optional but highly recommended feature.
        </p>
        <ol className="list-decimal pl-6 space-y-2">
            <li>
                Obtain an API key from{' '}
                <a href="https://ai.google.dev/" target="_blank" rel="noopener noreferrer" className="text-primary-500 hover:underline">
                Google AI Studio <ExternalLinkIcon className="w-4 h-4 inline-block" />
                </a>.
            </li>
            <li>
                This key must be set as an environment variable for the client-side application. Create a <code>.env</code> file in the root of your project.
            </li>
            <li>
                Add the following line to your <code>.env</code> file:
                <pre className="bg-gray-100 dark:bg-gray-900 p-2 my-2 rounded-md font-mono text-sm"><code>API_KEY=YOUR_GEMINI_API_KEY_HERE</code></pre>
            </li>
             <li>Rebuild and restart your application for the environment variable to be loaded. The app will read this via <code>process.env.API_KEY</code>.</li>
        </ol>
         <div className="bg-blue-100 dark:bg-blue-900/50 border-l-4 border-blue-500 text-blue-800 dark:text-blue-300 p-4 rounded-r-lg">
          <p><strong className="font-bold">Note:</strong> If the Gemini API key is not provided, the "Deal Score" column will show "N/A" for all listings, but the rest of the application will function normally.</p>
        </div>
      </section>

      <section className="space-y-4 mt-8">
        <h2 className="text-2xl font-semibold border-b pb-2 dark:border-gray-600">Troubleshooting</h2>
        <p>
          If you encounter persistent errors after following these steps:
        </p>
        <ul className="list-disc pl-6 space-y-2">
          <li>Check your browser's developer console (F12) for detailed error messages.</li>
          <li>Verify that your backend server is running and accessible from your browser.</li>
          <li>Ensure the API token you are using is correct and has not expired.</li>
          <li>Confirm that all required environment variables are correctly set for both the frontend and backend.</li>
        </ul>
      </section>
    </div>
  );
};

export default SetupGuidePage;
