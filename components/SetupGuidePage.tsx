import React from 'react';
import { DatabaseIcon, CogIcon, BookOpenIcon, AlertTriangle } from './Icons';

const CodeBlock: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <pre className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg overflow-x-auto text-sm my-4">
        <code className="font-mono text-gray-800 dark:text-gray-200">
            {children}
        </code>
    </pre>
);

const SetupGuidePage: React.FC = () => {
    return (
        <div className="max-w-4xl mx-auto space-y-12 text-gray-700 dark:text-gray-300">
            <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">U.G.L.P. Setup Guide</h1>
                <p className="text-lg">
                    Welcome to the Universal Game Listing Platform. This guide will walk you through the necessary steps to get the application running correctly.
                </p>
            </div>

            <section>
                <h2 className="text-2xl font-semibold flex items-center mb-4 text-gray-900 dark:text-white">
                    <DatabaseIcon className="w-6 h-6 mr-3 text-primary-500" />
                    Step 1: Database Setup
                </h2>
                <p>
                    The application requires a MySQL database to store game configurations, listings, and logs. You must first create a database and then run the following SQL queries to create the necessary tables.
                </p>

                <CodeBlock>
{`--
-- Main table for storing settings like API keys.
--
CREATE TABLE \`settings\` (
  \`key\` varchar(255) NOT NULL,
  \`value\` text NOT NULL,
  PRIMARY KEY (\`key\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Table to store the game configurations you add.
--
CREATE TABLE \`games\` (
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

--
-- Main table for storing all fetched listings.
--
CREATE TABLE \`listings\` (
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

--
-- Logs for the fetch worker.
--
CREATE TABLE \`fetch_logs\` (
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

--
-- Logs for the check worker.
--
CREATE TABLE \`check_logs\` (
  \`id\` varchar(36) NOT NULL,
  \`created_at\` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  \`game_id\` int NOT NULL,
  \`items_checked\` int DEFAULT NULL,
  \`items_archived\` int DEFAULT NULL,
  \`status\` enum('success','error','in_progress') DEFAULT NULL,
  \`error_message\` text,
  \`duration_ms\` int DEFAULT NULL,
  PRIMARY KEY (\`id\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;`}
                </CodeBlock>
                 <div className="bg-yellow-50 dark:bg-yellow-900/20 border-l-4 border-yellow-400 p-4 rounded-r-lg">
                    <div className="flex">
                        <div className="flex-shrink-0">
                            <AlertTriangle className="h-5 w-5 text-yellow-400" />
                        </div>
                        <div className="ml-3">
                            <p className="text-sm text-yellow-700 dark:text-yellow-200">
                                After creating the tables, you must update your database credentials in the <code className="font-mono bg-yellow-100 dark:bg-yellow-800/50 px-1 rounded">server.js</code> file.
                            </p>
                        </div>
                    </div>
                </div>
            </section>
            
            <section>
                <h2 className="text-2xl font-semibold flex items-center mb-4 text-gray-900 dark:text-white">
                    <CogIcon className="w-6 h-6 mr-3 text-primary-500" />
                    Step 2: Configure API Tokens
                </h2>
                <div className="space-y-4">
                    <div>
                        <h3 className="text-lg font-semibold">LZT Market API Token (Required)</h3>
                        <p>
                            This token is required to fetch listing data from the LZT Market. You can obtain your token from your account settings page on their website.
                            Once you have the token, go to the <strong className="text-primary-600 dark:text-primary-400">Settings</strong> page in this application and paste it into the appropriate field.
                        </p>
                        <a href="https://lolz.guru/account/api" target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline text-sm">
                            Get your LZT Market Token &rarr;
                        </a>
                    </div>
                     <div>
                        <h3 className="text-lg font-semibold">Google Gemini API Key (Optional)</h3>
                        <p>
                            This key is used for the "Deal Score" feature, which analyzes listing data to provide a score from 1 to 100. This feature is optional. If you don't provide a key, deal scores will not be calculated.
                            To enable it, open the <code className="font-mono bg-gray-100 dark:bg-gray-800 px-1 rounded">env.js</code> file in the project's root directory and replace <code className="font-mono bg-gray-100 dark:bg-gray-800 px-1 rounded">"YOUR_GEMINI_API_KEY_HERE"</code> with your actual key.
                        </p>
                         <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline text-sm">
                            Get your Gemini API Key &rarr;
                        </a>
                    </div>
                </div>
            </section>
            
            <section>
                 <h2 className="text-2xl font-semibold flex items-center mb-4 text-gray-900 dark:text-white">
                    <BookOpenIcon className="w-6 h-6 mr-3 text-primary-500" />
                    Step 3: Add a Game
                </h2>
                <p>
                    Once your backend and API tokens are configured, navigate to the <strong className="text-primary-600 dark:text-primary-400">Manage Games</strong> page. You can add a game from a preset (e.g., Steam, Fortnite) or create a custom configuration from scratch. After adding a game, you can view its marketplace from the sidebar.
                </p>
            </section>
        </div>
    );
};

export default SetupGuidePage;
