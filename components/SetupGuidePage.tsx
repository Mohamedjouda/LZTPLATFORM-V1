import React, { useState } from 'react';

// Unused imports removed for cleanliness.

const sqlScript = `-- U.G.L.P. MySQL Schema v1.1
-- This script is for setting up the database on a standard MySQL/MariaDB server (like on aapanel).
-- It is idempotent and can be run multiple times safely.

-- Create the main 'games' table to store configurations
CREATE TABLE IF NOT EXISTS \`games\` (
  \`id\` BIGINT NOT NULL AUTO_INCREMENT,
  \`created_at\` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  \`name\` TEXT NOT NULL,
  \`slug\` TEXT NOT NULL,
  \`category\` TEXT,
  \`description\` TEXT,
  \`api_base_url\` TEXT NOT NULL,
  \`list_path\` TEXT,
  \`check_path_template\` TEXT,
  \`default_filters\` JSON,
  \`columns\` JSON,
  \`filters\` JSON,
  \`sorts\` JSON,
  \`fetch_worker_enabled\` BOOLEAN DEFAULT TRUE,
  \`check_worker_enabled\` BOOLEAN DEFAULT TRUE,
  PRIMARY KEY (\`id\`)
);

-- Create the 'listings' table to store fetched data
CREATE TABLE IF NOT EXISTS \`listings\` (
  \`item_id\` BIGINT NOT NULL,
  \`game_id\` BIGINT NOT NULL,
  \`url\` TEXT,
  \`title\` TEXT,
  \`price\` FLOAT,
  \`currency\` TEXT,
  \`game_specific_data\` JSON,
  \`deal_score\` SMALLINT,
  \`is_hidden\` BOOLEAN NOT NULL DEFAULT FALSE,
  \`is_archived\` BOOLEAN NOT NULL DEFAULT FALSE,
  \`archived_reason\` TEXT,
  \`first_seen_at\` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  \`last_seen_at\` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  \`archived_at\` TIMESTAMP NULL,
  \`raw_response\` JSON,
  PRIMARY KEY (\`item_id\`, \`game_id\`),
  CONSTRAINT \`fk_game_id\` FOREIGN KEY (\`game_id\`) REFERENCES \`games\`(\`id\`) ON DELETE CASCADE
);

-- Create the 'settings' table for storing API keys and other configurations
CREATE TABLE IF NOT EXISTS \`settings\` (
  \`key\` VARCHAR(255) NOT NULL,
  \`value\` TEXT,
  \`created_at\` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  \`updated_at\` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (\`key\`)
);

-- Create the 'fetch_logs' table for logging fetch worker activity
CREATE TABLE IF NOT EXISTS \`fetch_logs\` (
  \`id\` CHAR(36) NOT NULL,
  \`created_at\` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  \`game_id\` BIGINT NOT NULL,
  \`page\` INT,
  \`items_fetched\` INT,
  \`status\` VARCHAR(50),
  \`error_message\` TEXT,
  \`duration_ms\` INT,
  PRIMARY KEY (\`id\`),
  FOREIGN KEY (\`game_id\`) REFERENCES \`games\`(\`id\`) ON DELETE CASCADE
);

-- Create the 'check_logs' table for logging check worker activity
CREATE TABLE IF NOT EXISTS \`check_logs\` (
  \`id\` CHAR(36) NOT NULL,
  \`created_at\` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  \`game_id\` BIGINT NOT NULL,
  \`items_checked\` INT,
  \`items_archived\` INT,
  \`status\` VARCHAR(50),
  \`error_message\` TEXT,
  \`duration_ms\` INT,
  PRIMARY KEY (\`id\`),
  FOREIGN KEY (\`game_id\`) REFERENCES \`games\`(\`id\`) ON DELETE CASCADE
);

-- Add some indexes for better query performance
CREATE INDEX IF NOT EXISTS \`idx_listings_game_id_status\` ON \`listings\` (\`game_id\`, \`is_hidden\`, \`is_archived\`);
CREATE INDEX IF NOT EXISTS \`idx_fetch_logs_game_id_created_at\` ON \`fetch_logs\` (\`game_id\`, \`created_at\` DESC);
CREATE INDEX IF NOT EXISTS \`idx_check_logs_game_id_created_at\` ON \`check_logs\` (\`game_id\`, \`created_at\` DESC);
`;

const serverJsConfig = `// server.js
const dbConfig = {
  host: '127.0.0.1',
  user: 'YOUR_DB_USER',      // <-- Replace with your database username
  password: 'YOUR_DB_PASSWORD',// <-- Replace with your database password
  database: 'YOUR_DB_NAME',  // <-- Replace with your database name
  // ... rest of the file
};
`;

const nginxConfig = `location /api/ {
    proxy_pass http://127.0.0.1:3001; # <-- Port must match your Node project port
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection 'upgrade';
    proxy_set_header Host $host;
    proxy_cache_bypass $http_upgrade;
}
`;


const Step: React.FC<{ number: number; title: string; children: React.ReactNode }> = ({ number, title, children }) => (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm">
        <h2 className="text-xl font-bold mb-4 flex items-center">
            <span className="bg-primary-600 text-white rounded-full w-8 h-8 flex items-center justify-center mr-3 font-mono">{number}</span>
            {title}
        </h2>
        <div className="prose prose-sm dark:prose-invert max-w-none text-gray-600 dark:text-gray-300 space-y-3">
            {children}
        </div>
    </div>
);

const CodeBlock: React.FC<{ code: string; lang?: string; }> = ({ code, lang = 'bash' }) => {
    const [copied, setCopied] = useState(false);
    const handleCopy = () => {
        navigator.clipboard.writeText(code);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="relative">
            <button
                onClick={handleCopy}
                className="absolute top-2 right-2 bg-gray-700 text-white text-xs font-semibold py-1 px-2 rounded-md hover:bg-gray-600 transition-colors"
            >
                {copied ? 'Copied!' : 'Copy'}
            </button>
            <pre className="bg-gray-900 text-white p-4 rounded-lg overflow-x-auto text-xs">
                <code className={`language-${lang}`}>{code}</code>
            </pre>
        </div>
    );
};

const SetupGuidePage: React.FC = () => {
    return (
        <div className="space-y-8 max-w-4xl mx-auto">
            <div className="text-center">
                <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white">Self-Hosted Setup Guide</h1>
                <p className="mt-2 text-lg text-gray-500 dark:text-gray-400">Follow these steps to set up the backend and database on your aapanel server.</p>
            </div>

            <Step number={1} title="Set Up MySQL Database">
                <p>First, create a database to store all application data.</p>
                <ol>
                    <li>In aapanel, go to the <strong>Database</strong> section.</li>
                    <li>Click <strong>Add database</strong>.</li>
                    <li>Enter a database name (e.g., `uglp_db`), a username, and a strong password. Save these credentials.</li>
                    <li>Once created, click <strong>Import</strong>. Choose "From text" and paste the entire SQL script below.</li>
                    <li>Click <strong>Submit</strong> to create the tables.</li>
                </ol>
                <CodeBlock code={sqlScript} lang="sql" />
            </Step>

            <Step number={2} title="Configure the Backend Server">
                <p>The backend is a Node.js application. You need to provide it with your database credentials.</p>
                <ol>
                    <li>Open the `server.js` file in the application's root directory.</li>
                    <li>Find the `dbConfig` section at the top.</li>
                    <li>Replace the placeholder values for `user`, `password`, and `database` with the credentials you created in Step 1.</li>
                </ol>
                <CodeBlock code={serverJsConfig} lang="javascript" />
            </Step>

            <Step number={3} title="Deploy the Backend on aapanel">
                <p>Use the "Node project" feature in aapanel to run the backend server.</p>
                <ol>
                    <li>In aapanel, go to the <strong>Website</strong> section.</li>
                    <li>Click <strong>Node project</strong> {' > '} <strong>Add Node project</strong>.</li>
                    <li>Set the <strong>Project path</strong> to your application's root directory (e.g., `/www/wwwroot/platform.quicktask.online`).</li>
                    <li>Set <strong>Start file name</strong> to `server.js`.</li>
                    <li>Set <strong>Project port</strong> to `3001`.</li>
                    <li>Click <strong>Submit</strong>. The panel will automatically install dependencies from `package.json`.</li>
                </ol>
            </Step>
            
            <Step number={4} title="Configure Nginx Reverse Proxy">
                <p>The final step is to tell your web server (Nginx) to forward API requests to your new backend server.</p>
                 <ol>
                    <li>Go to the <strong>Website</strong> section and click the configuration file for your site (`platform.quicktask.online`).</li>
                    <li>Scroll down and find the <code>location / {'{ ... }'}</code> block.</li>
                    <li><strong>Paste the following code block *above* that `location /` block.</strong></li>
                </ol>
                <CodeBlock code={nginxConfig} lang="nginx" />
                <p className="text-sm p-3 bg-yellow-100 dark:bg-yellow-900/50 rounded-lg"><strong>Important:</strong> Your frontend is served by the `dist` folder. Your backend API will be available at `/api`. Nginx will handle routing the requests correctly.</p>
            </Step>

             <Step number={5} title="Final Steps">
                <p>With the backend running, you can now configure your LZT Market token.</p>
                <ol>
                    <li>Navigate to the <strong>Settings</strong> page in the application sidebar.</li>
                    <li>Enter your LZT Market API token and click <strong>Save and Test Token</strong>.</li>
                </ol>
                 <p>Your self-hosted platform is now fully operational!</p>
            </Step>
        </div>
    );
};

export default SetupGuidePage;
