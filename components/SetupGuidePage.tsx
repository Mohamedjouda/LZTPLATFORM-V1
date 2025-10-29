
import React, { useState } from 'react';

const schemaSqlContent = `
-- U.G.L.P. Schema v1.2 for MySQL/MariaDB
-- This script is idempotent and can be run multiple times safely.

CREATE TABLE IF NOT EXISTS \`games\` (
  \`id\` int NOT NULL AUTO_INCREMENT,
  \`created_at\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  \`name\` varchar(255) NOT NULL,
  \`slug\` varchar(255) NOT NULL,
  \`category\` varchar(255) DEFAULT NULL,
  \`description\` text,
  \`api_base_url\` varchar(255) NOT NULL,
  \`list_path\` varchar(255) DEFAULT NULL,
  \`check_path_template\` varchar(255) DEFAULT NULL,
  \`default_filters\` json DEFAULT NULL,
  \`columns\` json DEFAULT NULL,
  \`filters\` json DEFAULT NULL,
  \`sorts\` json DEFAULT NULL,
  \`fetch_worker_enabled\` tinyint(1) NOT NULL DEFAULT '1',
  \`check_worker_enabled\` tinyint(1) NOT NULL DEFAULT '1',
  \`fetch_interval_minutes\` int DEFAULT '60',
  \`fetch_page_limit\` int DEFAULT '10',
  PRIMARY KEY (\`id\`),
  UNIQUE KEY \`slug\` (\`slug\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS \`listings\` (
  \`item_id\` bigint NOT NULL,
  \`game_id\` int NOT NULL,
  \`url\` varchar(512) DEFAULT NULL,
  \`title\` varchar(512) DEFAULT NULL,
  \`price\` decimal(10,2) DEFAULT NULL,
  \`currency\` varchar(10) DEFAULT NULL,
  \`game_specific_data\` json DEFAULT NULL,
  \`deal_score\` int DEFAULT NULL,
  \`is_hidden\` tinyint(1) NOT NULL DEFAULT '0',
  \`is_archived\` tinyint(1) NOT NULL DEFAULT '0',
  \`archived_reason\` varchar(255) DEFAULT NULL,
  \`first_seen_at\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  \`last_seen_at\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  \`archived_at\` timestamp NULL DEFAULT NULL,
  \`raw_response\` json DEFAULT NULL,
  PRIMARY KEY (\`game_id\`,\`item_id\`),
  KEY \`idx_is_archived\` (\`is_archived\`),
  KEY \`idx_is_hidden\` (\`is_hidden\`),
  CONSTRAINT \`listings_ibfk_1\` FOREIGN KEY (\`game_id\`) REFERENCES \`games\` (\`id\`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS \`settings\` (
  \`key\` varchar(255) NOT NULL,
  \`value\` text,
  PRIMARY KEY (\`key\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS \`fetch_logs\` (
  \`id\` varchar(36) NOT NULL,
  \`created_at\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  \`game_id\` int NOT NULL,
  \`page\` int DEFAULT NULL,
  \`items_fetched\` int DEFAULT NULL,
  \`status\` enum('success','error','in_progress') DEFAULT NULL,
  \`error_message\` text,
  \`duration_ms\` int DEFAULT NULL,
  PRIMARY KEY (\`id\`),
  KEY \`game_id\` (\`game_id\`),
  CONSTRAINT \`fetch_logs_ibfk_1\` FOREIGN KEY (\`game_id\`) REFERENCES \`games\` (\`id\`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS \`check_logs\` (
  \`id\` varchar(36) NOT NULL,
  \`created_at\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  \`game_id\` int NOT NULL,
  \`items_checked\` int DEFAULT NULL,
  \`items_archived\` int DEFAULT NULL,
  \`status\` enum('success','error','in_progress') DEFAULT NULL,
  \`error_message\` text,
  \`duration_ms\` int DEFAULT NULL,
  PRIMARY KEY (\`id\`),
  KEY \`game_id\` (\`game_id\`),
  CONSTRAINT \`check_logs_ibfk_1\` FOREIGN KEY (\`game_id\`) REFERENCES \`games\` (\`id\`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
`.trim();

const setupShContent = `
#!/bin/bash

# U.G.L.P. Automated Setup Script for aaPanel
# This script automates database creation, backend configuration, and Nginx setup.

# --- Helper Functions ---
function print_color {
    COLOR=$1
    TEXT=$2
    // FIX: Escape shell variables in template literal
    echo -e "\\033[\\${COLOR}m\\${TEXT}\\033[0m"
}

function check_command {
    if ! command -v $1 &> /dev/null; then
        print_color "31" "Error: '$1' command not found. Please ensure you are running this on a standard aaPanel server."
        exit 1
    fi
}

# --- Start of Script ---
print_color "32" "================================================="
print_color "32" " U.G.L.P. Automated Setup Script for aaPanel "
print_color "32" "================================================="
echo

# --- Check Prerequisites ---
check_command "bt"
check_command "npm"
check_command "pm2"

# --- User Input ---
print_color "33" "Please provide the following details:"
read -p "Enter your full domain name (e.g., platform.quicktask.online): " DOMAIN
read -p "Enter a name for your new MySQL database: " DB_NAME
read -p "Enter a username for the new database user: " DB_USER
read -s -p "Enter a password for the new database user: " DB_PASS
echo
echo

if [ -z "$DOMAIN" ] || [ -z "$DB_NAME" ] || [ -z "$DB_USER" ] || [ -z "$DB_PASS" ]; then
    print_color "31" "All fields are required. Aborting."
    exit 1
fi

# --- Step 1: Create Database and User ---
print_color "36" "--> Step 1: Creating MySQL database and user..."
DB_CREATE_OUTPUT=$(bt 1 <<EOF
$DB_NAME
$DB_USER
$DB_PASS
y
EOF
)
if [[ "$DB_CREATE_OUTPUT" == *"successfully created"* ]]; then
    print_color "32" "Database '$DB_NAME' and user '$DB_USER' created successfully."
else
    print_color "31" "Failed to create database. Please check your inputs or create it manually."
    echo "$DB_CREATE_OUTPUT"
    exit 1
fi

# --- Step 2: Import Schema ---
print_color "36" "--> Step 2: Importing database schema from schema.sql..."
if [ ! -f "schema.sql" ]; then
    print_color "31" "Error: schema.sql not found in the current directory."
    exit 1
fi
mysql -u"$DB_USER" -p"$DB_PASS" "$DB_NAME" < schema.sql
if [ $? -eq 0 ]; then
    print_color "32" "Database schema imported successfully."
else
    print_color "31" "Failed to import schema.sql. Please check MySQL credentials and file."
    exit 1
fi

# --- Step 3: Configure Backend (server.js) ---
print_color "36" "--> Step 3: Configuring backend server.js..."
if [ ! -f "services/server.js" ]; then
    print_color "31" "Error: services/server.js not found."
    exit 1
fi
# Use sed to replace placeholder values
sed -i "s/user: 'YOUR_DB_USER'/user: '$DB_USER'/" services/server.js
sed -i "s/password: 'YOUR_DB_PASSWORD'/password: '$DB_PASS'/" services/server.js
sed -i "s/database: 'YOUR_DB_NAME'/database: '$DB_NAME'/" services/server.js
print_color "32" "server.js configured with your database credentials."

# --- Step 4: Install Dependencies & Build Frontend ---
print_color "36" "--> Step 4: Installing npm dependencies..."
npm install
if [ $? -ne 0 ]; then
    print_color "31" "npm install failed. Please check for errors."
    exit 1
fi
print_color "32" "Dependencies installed."

print_color "36" "--> Step 5: Building frontend application..."
npm run build
if [ $? -ne 0 ]; then
    print_color "31" "npm run build failed. Please check for errors."
    exit 1
fi
print_color "32" "Frontend built successfully into the 'dist' folder."

# --- Step 6: Setup Node Project with PM2 ---
print_color "36" "--> Step 6: Setting up Node.js project with PM2..."
PROJECT_NAME="uglp-backend"
pm2 start "npm" --name "$PROJECT_NAME" -- run start-server
pm2 save
if [ $? -eq 0 ]; then
    print_color "32" "Backend server started successfully with PM2 under the name '$PROJECT_NAME'."
else
    print_color "31" "Failed to start backend server with PM2."
    exit 1
fi

# --- Step 7: Generate and Apply Nginx Configuration ---
print_color "36" "--> Step 7: Generating Nginx configuration..."
// FIX: Escape shell variables in template literal
NGINX_CONF_PATH="/www/server/panel/vhost/nginx/\\${DOMAIN}.conf"
PROJECT_ROOT="/www/wwwroot/\\${DOMAIN}"

# Check for existing SSL certs
// FIX: Escape shell variables in template literal
SSL_CERT_PATH="/www/server/panel/vhost/cert/\\${DOMAIN}/fullchain.pem"
if [ -f "$SSL_CERT_PATH" ]; then
    print_color "32" "SSL certificate found. Configuring for HTTPS."
    SSL_CONFIG="
    ssl_certificate $SSL_CERT_PATH;
    // FIX: Escape shell variables in template literal
    ssl_certificate_key /www/server/panel/vhost/cert/\\${DOMAIN}/privkey.pem;
    ssl_protocols TLSv1.1 TLSv1.2 TLSv1.3;
    ssl_prefer_server_ciphers on;
    ssl_session_cache shared:SSL:10m;
    add_header Strict-Transport-Security \\"max-age=31536000\\";
    if (\\$scheme != \\"https\\") {
        return 301 https://\\$host\\$request_uri;
    }"
else
    print_color "33" "Warning: No SSL certificate found. Configuring for HTTP only."
    SSL_CONFIG=""
fi

cat > "$NGINX_CONF_PATH" <<EOL
server {
    listen 80;
    listen 443 ssl http2;
    // FIX: Escape shell variables in template literal
    server_name \\${DOMAIN};
    \\${SSL_CONFIG}

    // FIX: Escape shell variables in template literal
    root \\${PROJECT_ROOT}/dist;
    index index.html;

    location /api/ {
        proxy_pass http://127.0.0.1:3001;
        proxy_set_header Host \\$host;
        proxy_set_header X-Real-IP \\$remote_addr;
        proxy_set_header X-Forwarded-For \\$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \\$scheme;
    }

    location / {
        try_files \\$uri \\$uri/ /index.html;
    }

    // FIX: Escape shell variables in template literal
    access_log /www/wwwlogs/\\${DOMAIN}.log;
    error_log /www/wwwlogs/\\${DOMAIN}.error.log;
}
EOL

# --- Final Step: Reload Nginx ---
print_color "36" "--> Step 8: Reloading Nginx..."
/etc/init.d/nginx reload
print_color "32" "Nginx configuration applied."
echo
print_color "32" "==================================================="
print_color "32" " SETUP COMPLETE! "
print_color "32" "==================================================="
print_color "33" "Your application is now running. Please complete the final step:"
// FIX: Escape shell variables in template literal
print_color "33" "1. Open your website: https://\\${DOMAIN}"
print_color "33" "2. Go to the 'Settings' page."
print_color "33" "3. Enter your LZT Market API Token and save."
echo
`.trim();


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
                <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white">Automated Setup Guide</h1>
                <p className="mt-2 text-lg text-gray-500 dark:text-gray-400">Deploy the entire application by running one simple script on your server.</p>
            </div>

            <Step number={1} title="Prepare Your Server">
                <p>Before running the script, please ensure you have done the following in your aapanel dashboard:</p>
                <ul>
                    <li>Created a new <strong>Website</strong> entry for your domain (e.g., `platform.quicktask.online`). This step is crucial for Nginx configuration.</li>
                    <li>(Optional but Recommended) Issued a free <strong>Let's Encrypt SSL certificate</strong> for that website in the SSL section. The script will automatically detect and use it.</li>
                    <li>Uploaded all the project files to your website's root directory (e.g., <code>/www/wwwroot/platform.quicktask.online</code>).</li>
                </ul>
            </Step>

            <Step number={2} title="Create and Run the Setup Scripts">
                <p>You will create two files on your server: `schema.sql` for the database structure and `setup.sh` for the automated installation.</p>
                <ol>
                    <li>Connect to your server via SSH and navigate to your project's root directory.</li>
                    <li>Create a new file named <code>schema.sql</code>. Copy the content below and paste it into the file.</li>
                </ol>
                <h3 className="font-semibold mt-4 mb-2 text-gray-800 dark:text-gray-200">schema.sql</h3>
                <CodeBlock code={schemaSqlContent} lang="sql" />

                <ol start={3} className="mt-4">
                    <li>Next, create a new file named <code>setup.sh</code>. Copy the content below and paste it into this file.</li>
                </ol>
                 <h3 className="font-semibold mt-4 mb-2 text-gray-800 dark:text-gray-200">setup.sh</h3>
                <CodeBlock code={setupShContent} lang="bash" />
            </Step>

            <Step number={3} title="Execute the Automated Installer">
                <p>With both scripts in place, you can now run the installer. It will handle everything from database creation to server configuration.</p>
                <ol>
                    <li>First, make the script executable by running this command:</li>
                </ol>
                <CodeBlock code="chmod +x setup.sh" lang="bash" />
                <p>Now, run the script. It will interactively guide you through the setup.</p>
                <CodeBlock code="./setup.sh" lang="bash" />
                <p className="text-sm p-3 bg-yellow-100 dark:bg-yellow-900/50 rounded-lg">
                    The script will create the MySQL database, configure `server.js`, build the frontend, set up the backend with PM2, and configure Nginx.
                </p>
            </Step>
            
            <Step number={4} title="Finalize and Use">
                <p>After the script finishes, your self-hosted platform is fully operational!</p>
                <ol>
                    <li>Navigate to your website in a browser.</li>
                    <li>Go to the <strong>Settings</strong> page in the application sidebar.</li>
                    <li>Enter your LZT Market API token and click <strong>Save and Test Token</strong>.</li>
                </ol>
                 <p>Your platform is now ready to use.</p>
            </Step>
        </div>
    );
};

export default SetupGuidePage;
