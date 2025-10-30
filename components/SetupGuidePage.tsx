import React from 'react';
import { ExternalLinkIcon } from './Icons';

const GuideSection: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
    <div className="mb-8">
        <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white border-b pb-2 dark:border-gray-700">{title}</h2>
        <div className="prose prose-lg dark:prose-invert max-w-none text-gray-600 dark:text-gray-300">
            {children}
        </div>
    </div>
);

const CodeBlock: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <pre className="bg-gray-100 dark:bg-gray-900 p-4 rounded-lg overflow-x-auto">
        <code className="text-sm font-mono">{children}</code>
    </pre>
);

const SetupGuidePage: React.FC = () => {
    return (
        <div className="max-w-4xl mx-auto">
            <div className="bg-white dark:bg-gray-800 p-8 rounded-xl shadow-lg">
                <h1 className="text-3xl font-extrabold mb-2 text-gray-900 dark:text-white">U.G.L.P. Setup Guide</h1>
                <p className="mb-8 text-lg text-gray-500 dark:text-gray-400">Welcome! This guide will walk you through setting up the Universal Game Listing Platform.</p>

                <GuideSection title="Overview">
                    <p>
                        This application is designed to fetch, display, and analyze game account listings from the LZT Market. It consists of two main parts:
                    </p>
                    <ul>
                        <li>A <strong>React Frontend</strong> (what you are looking at now) for interacting with the data.</li>
                        <li>A <strong>Backend Server</strong> that communicates with the LZT API, manages a database, and serves data to the frontend.</li>
                    </ul>
                    <p>
                        Proper setup of both components is crucial for the application to function correctly.
                    </p>
                </GuideSection>

                <GuideSection title="Backend Setup">
                    <p>
                        The backend requires a connection to a database and environment variables to be set.
                    </p>
                    <h3 className="text-xl font-semibold mt-6 mb-2">1. Database Configuration</h3>
                    <p>
                        The application uses a database to store listings, games, logs, and settings. Ensure your backend server is correctly configured to connect to your database (e.g., PostgreSQL). The server should handle table creation automatically on its first run.
                    </p>
                     <h3 className="text-xl font-semibold mt-6 mb-2">2. Environment Variables</h3>
                    <p>
                        Your backend server needs a <code>.env</code> file with the necessary credentials. Create a file named <code>.env</code> in the root of your backend project with the following content:
                    </p>
                    <CodeBlock>
                        {`# Database connection string
DATABASE_URL="postgresql://USER:PASSWORD@HOST:PORT/DATABASE"

# A secret key for signing sessions, etc.
# Generate a long, random string for this.
SECRET_KEY="your-super-secret-key"

# Port for the backend server to run on
PORT=3001`}
                    </CodeBlock>
                    <p>
                        Replace the placeholder values with your actual database credentials and a secure secret key.
                    </p>
                     <h3 className="text-xl font-semibold mt-6 mb-2">3. Starting the Backend</h3>
                    <p>
                        Once configured, start your backend server. If it's a Node.js project, you would typically run:
                    </p>
                    <CodeBlock>
                        npm install
                        <br />
                        npm start
                    </CodeBlock>
                     <p>
                        Check the server logs to ensure it starts without errors and connects to the database successfully.
                    </p>
                </GuideSection>

                <GuideSection title="Frontend & API Configuration">
                     <h3 className="text-xl font-semibold mt-6 mb-2">1. Connecting to the Backend</h3>
                     <p>
                        The frontend is configured to send API requests to <code>/api</code>. This requires a proxy setup in your web server (like Nginx or Caddy) or in the Vite development server to forward these requests to your running backend (e.g., on port 3001).
                     </p>
                     <p>
                        If you are running this locally with Vite, you can add a proxy to your <code>vite.config.ts</code>:
                     </p>
                     <CodeBlock>{`
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      }
    }
  }
                     `}</CodeBlock>

                    <h3 className="text-xl font-semibold mt-6 mb-2">2. Setting the LZT Market API Token</h3>
                    <p>
                        The application needs an API token to fetch data from LZT Market.
                    </p>
                    <ol>
                        <li>Navigate to the <strong>Settings</strong> page in this application.</li>
                        <li>
                            Obtain your Bearer Token from your LZT Market account settings.
                            <a href="https://lolz.guru/account/api" target="_blank" rel="noopener noreferrer" className="ml-2 text-primary-500 hover:underline inline-flex items-center">
                                Go to LZT API page <ExternalLinkIcon className="w-4 h-4 ml-1" />
                            </a>
                        </li>
                        <li>Paste the token into the input field and click "Save and Test Token".</li>
                        <li>You should see success notifications if the token is saved and validated correctly.</li>
                    </ol>
                </GuideSection>

                <GuideSection title="Troubleshooting">
                    <h3 className="text-xl font-semibold mt-6 mb-2">"Could not connect to backend" Error</h3>
                    <p>
                        This error (Code: APP-503) means the frontend cannot reach the backend server.
                    </p>
                    <ul>
                        <li>Ensure your backend server is running and accessible.</li>
                        <li>Check your web server's proxy configuration to make sure requests to <code>/api</code> are correctly forwarded to the backend.</li>
                        <li>Check your browser's developer console (Network tab) for failed API requests to see more details.</li>
                    </ul>

                    <h3 className="text-xl font-semibold mt-6 mb-2">"Token test failed" Error</h3>
                     <p>
                        This error (Code: SET-502) on the Settings page means the LZT API rejected your token.
                    </p>
                    <ul>
                        <li>Double-check that you have copied the correct and complete token from the LZT Market website.</li>
                        <li>Ensure the token has not expired or been revoked.</li>
                    </ul>
                </GuideSection>
            </div>
        </div>
    );
};

export default SetupGuidePage;
