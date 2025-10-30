import React from 'react';
import { DatabaseIcon, CogIcon, BookOpenIcon, AlertTriangle } from './Icons';

const CodeBlock: React.FC<{ children: React.ReactNode; lang?: string }> = ({ children, lang }) => (
    <div className="bg-gray-800 p-4 rounded-lg overflow-x-auto text-sm my-4 relative">
        <pre><code className={`font-mono text-gray-200 language-${lang}`}>
            {children}
        </code></pre>
        <button 
            onClick={() => navigator.clipboard.writeText(children as string)}
            className="absolute top-2 right-2 bg-gray-600 hover:bg-gray-500 text-white text-xs font-semibold py-1 px-2 rounded"
        >
            Copy
        </button>
    </div>
);

const SetupGuidePage: React.FC = () => {
    
const nginxConfig = `server {
    listen 80;
    listen 443 ssl http2;
    server_name your_domain.com; # <-- Replace with your domain

    # --- SSL Configuration (Auto-filled by aapanel) ---
    # Make sure these paths are correct for your server
    ssl_certificate /www/server/panel/vhost/cert/your_domain.com/fullchain.pem;
    ssl_certificate_key /www/server/panel/vhost/cert/your_domain.com/privkey.pem;
    ssl_protocols TLSv1.1 TLSv1.2 TLSv1.3;
    ssl_prefer_server_ciphers on;
    ssl_session_cache shared:SSL:10m;
    add_header Strict-Transport-Security "max-age=31536000";

    # --- Force HTTPS ---
    if ($scheme != "https") {
        return 301 https://$host$request_uri;
    }

    # --- Root Directory for the BUILT FRONTEND ---
    # This MUST point to the 'dist' folder.
    root /www/wwwroot/your_domain.com/dist;
    index index.html;

    # --- Reverse Proxy for the BACKEND API ---
    # This sends all API calls to your Node.js server.
    # The port (3001) MUST match the port you configured in the Node Project settings.
    location /api/ {
        proxy_pass http://127.0.0.1:3001;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # --- Routing for the React Single-Page Application ---
    # This ensures that refreshing the browser on any page (e.g., /settings) works correctly.
    location / {
        try_files $uri $uri/ /index.html;
    }

    # --- Standard Logging and Security ---
    access_log /www/wwwlogs/your_domain.com.log;
    error_log /www/wwwlogs/your_domain.com.error.log;
    location ~ ^/(\\.user.ini|\\.htaccess|\\.git|\\.env|\\.svn|\\.project|LICENSE|README\\.md|server\\.js|vite\\.config\\.ts) {
        return 404;
    }
}`;

const sqlSchema = `--
-- This script is for setting up the database on a standard MySQL/MariaDB server (like on aapanel).
-- It is idempotent and can be run multiple times safely.
--

CREATE TABLE IF NOT EXISTS \`settings\` (
  \`key\` varchar(255) NOT NULL,
  \`value\` text NOT NULL,
  PRIMARY KEY (\`key\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS \`games\` (
  \`id\` int NOT NULL AUTO_INCREMENT,
  \`created_at\` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  \`name\` varchar(255) NOT NULL,
  \`slug\` varchar(255) NOT NULL,
  \`category\` varchar(255) DEFAULT NULL,
  \`description\` text,
  \`api_base_url\` varchar(255) NOT NULL,
  \`list_path\` varchar(255) NOT NULL,
  \`check_path_template\` varchar(255) NOT NULL,
  \`default_filters\` json DEFAULT NULL,
  \`columns\` json DEFAULT NULL,
  \`filters\` json DEFAULT NULL,
  \`sorts\` json DEFAULT NULL,
  \`fetch_worker_enabled\` tinyint(1) DEFAULT '1',
  \`check_worker_enabled\` tinyint(1) DEFAULT '1',
  \`fetch_interval_minutes\` int DEFAULT '60',
  \`fetch_page_limit\` int DEFAULT '10',
  PRIMARY KEY (\`id\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS \`listings\` (
  \`item_id\` int NOT NULL,
  \`game_id\` int NOT NULL,
  \`url\` varchar(255) DEFAULT NULL,
  \`title\` varchar(255) DEFAULT NULL,
  \`price\` decimal(10,2) DEFAULT NULL,
  \`currency\` varchar(10) DEFAULT NULL,
  \`game_specific_data\` json DEFAULT NULL,
  \`deal_score\` int DEFAULT NULL,
  \`is_hidden\` tinyint(1) DEFAULT '0',
  \`is_archived\` tinyint(1) DEFAULT '0',
  \`archived_reason\` varchar(255) DEFAULT NULL,
  \`first_seen_at\` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  \`last_seen_at\` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  \`archived_at\` timestamp NULL DEFAULT NULL,
  \`raw_response\` json DEFAULT NULL,
  PRIMARY KEY (\`game_id\`,\`item_id\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS \`fetch_logs\` (
  \`id\` varchar(36) NOT NULL,
  \`created_at\` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  \`game_id\` int NOT NULL,
  \`page\` int DEFAULT NULL,
  \`items_fetched\` int DEFAULT NULL,
  \`status\` enum('success','error','in_progress') DEFAULT NULL,
  \`error_message\` text,
  \`duration_ms\` int DEFAULT NULL,
  PRIMARY KEY (\`id\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS \`check_logs\` (
  \`id\` varchar(36) NOT NULL,
  \`created_at\` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  \`game_id\` int NOT NULL,
  \`items_checked\` int DEFAULT NULL,
  \`items_archived\` int DEFAULT NULL,
  \`status\` enum('success','error','in_progress') DEFAULT NULL,
  \`error_message\` text,
  \`duration_ms\` int DEFAULT NULL,
  PRIMARY KEY (\`id\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
`;


    return (
        <div className="max-w-4xl mx-auto space-y-12 text-gray-700 dark:text-gray-300">
            <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">Self-Hosted Setup Guide (aapanel)</h1>
                <p className="text-lg">
                    Follow these steps to deploy the backend, database, and frontend on your aapanel server.
                </p>
            </div>

            <section>
                <h2 className="text-2xl font-semibold flex items-center mb-4 text-gray-900 dark:text-white">
                    <DatabaseIcon className="w-6 h-6 mr-3 text-primary-500" />
                    Step 1: Set Up MySQL Database
                </h2>
                <ol className="list-decimal list-inside space-y-2">
                    <li>In aapanel, go to the <strong>Database</strong> section.</li>
                    <li>Click <strong>Add database</strong>.</li>
                    <li>Enter a database name (e.g., `uglp_db`), a username, and a strong password. <strong>Save these credentials</strong>.</li>
                    <li>Once created, click <strong>Import</strong>. Choose "From text" and paste the entire SQL script below.</li>
                    <li>Click <strong>Submit</strong> to create the tables.</li>
                </ol>
                <CodeBlock lang="sql">{sqlSchema}</CodeBlock>
            </section>
            
            <section>
                <h2 className="text-2xl font-semibold flex items-center mb-4 text-gray-900 dark:text-white">
                    <CogIcon className="w-6 h-6 mr-3 text-primary-500" />
                    Step 2: Configure & Deploy Backend
                </h2>
                 <ol className="list-decimal list-inside space-y-2">
                    <li>In aapanel File Manager, navigate to your project root (e.g., `/www/wwwroot/your_domain.com`).</li>
                    <li>Open the <strong>`services/server.js`</strong> file.</li>
                    <li>Edit the `dbConfig` section with the database credentials you saved in Step 1.</li>
                    <li>Go to <strong>Website > Node project > Add Node project</strong>.</li>
                    <li>Fill out the form:
                        <ul className="list-disc list-inside ml-6 mt-2 space-y-1 bg-gray-50 dark:bg-gray-800 p-4 rounded-md">
                           <li><strong>Path:</strong> Your project's root directory.</li>
                           <li><strong>Run opt:</strong> Select `start-server [node services/server.js]`</li>
                           <li><strong>Port:</strong> `3001` (This is important!)</li>
                           <li><strong>Node:</strong> Select a stable version like v18 or v20.</li>
                        </ul>
                    </li>
                    <li>Click <strong>Confirm</strong>. The panel will install dependencies and start the server.</li>
                </ol>
            </section>
            
             <section>
                <h2 className="text-2xl font-semibold flex items-center mb-4 text-gray-900 dark:text-white">
                    <BookOpenIcon className="w-6 h-6 mr-3 text-primary-500" />
                    Step 3: Build Frontend & Configure Nginx
                </h2>
                <ol className="list-decimal list-inside space-y-2">
                    <li>Connect to your server via SSH, navigate to your project root, and run the build command:
                        <CodeBlock lang="bash">npm run build</CodeBlock>
                    </li>
                    <li>In aapanel, go to <strong>Website</strong> and click your domain name.</li>
                    <li>Click <strong>Config</strong> on the left.</li>
                    <li><strong>Delete everything</strong> in the editor and paste the complete Nginx configuration below. Remember to replace `your_domain.com` with your actual domain.</li>
                </ol>
                <CodeBlock lang="nginx">{nginxConfig}</CodeBlock>
                <div className="bg-yellow-50 dark:bg-yellow-900/20 border-l-4 border-yellow-400 p-4 rounded-r-lg mt-4">
                    <div className="flex">
                        <div className="flex-shrink-0">
                            <AlertTriangle className="h-5 w-5 text-yellow-400" />
                        </div>
                        <div className="ml-3">
                            <p className="text-sm text-yellow-700 dark:text-yellow-200">
                                This Nginx configuration is the most common source of 404 errors. It correctly serves your frontend from the `/dist` folder and forwards all API requests from `/api/*` to your backend server.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

             <section>
                <h2 className="text-2xl font-semibold flex items-center mb-4 text-gray-900 dark:text-white">
                    Step 4: Final Configuration
                </h2>
                <p>
                    With the server running, open your website. First, navigate to the <strong>Manage Games</strong> page and add one or more game configurations using the "Add from Preset" button. After that, go to the <strong>Settings</strong> page and enter your <strong>LZT Market API Token</strong>. The application is now ready to fetch data. The optional Gemini API key can be set in the `env.js` file to enable deal scores.
                </p>
            </section>
        </div>
    );
};

export default SetupGuidePage;