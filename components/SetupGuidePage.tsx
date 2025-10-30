import React from 'react';
import { ExternalLinkIcon, DatabaseIcon, CogIcon } from './Icons';

const CodeBlock: React.FC<{ code: string }> = ({ code }) => (
    <pre className="bg-gray-100 dark:bg-gray-900 p-3 my-2 rounded-md font-mono text-sm overflow-x-auto">
        <code>{code}</code>
    </pre>
);

const NginxConfigExample = `server {
    listen 80;
    listen 443 ssl http2;
    server_name your_domain.com; # <-- Replace

    # SSL config from aapanel...
    ssl_certificate /www/server/panel/vhost/cert/your_domain.com/fullchain.pem;
    ssl_certificate_key /www/server/panel/vhost/cert/your_domain.com/privkey.pem;
    # ...other SSL settings

    # Root Directory for BUILT Frontend
    root /www/wwwroot/your_domain.com/dist;
    index index.html;

    # Caching Rules (prevents old versions from showing)
    location ~* \\.(?:css|js)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
    location = /index.html {
        expires -1;
        add_header Cache-Control "no-cache, no-store, must-revalidate";
    }

    # Reverse Proxy for Backend API
    # Forwards /api/* requests to the Node.js server
    location /api/ {
        proxy_pass http://127.0.0.1:3001/; # <-- CRITICAL: Trailing slash is required
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Routing for React App
    location / {
        try_files $uri $uri/ /index.html;
    }
}`;

const DotEnvExample = `DB_HOST=127.0.0.1
DB_USER=YOUR_DB_USERNAME
DB_PASSWORD=YOUR_DB_PASSWORD
DB_NAME=YOUR_DB_NAME

# Optional: Add your Google Gemini API key to enable the "Deal Score" feature.
API_KEY=YOUR_GEMINI_API_KEY_HERE
`;

const Step: React.FC<{ number: number; title: string; icon: React.ReactNode; children: React.ReactNode }> = ({ number, title, icon, children }) => (
    <section className="space-y-4 pt-8 first:pt-0">
        <h2 className="text-2xl font-semibold border-b pb-2 dark:border-gray-600 flex items-center">
            <span className="bg-primary-500 text-white rounded-full h-8 w-8 flex items-center justify-center font-bold mr-3">{number}</span>
            {icon}
            {title}
        </h2>
        <div className="pl-11 space-y-3">
            {children}
        </div>
    </section>
);

const SetupGuidePage: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto bg-white dark:bg-gray-800 p-8 rounded-xl shadow-lg">
      <h1 className="text-3xl font-bold mb-4">Setup Guide</h1>
      <p className="text-lg text-gray-600 dark:text-gray-400 mb-8">
        Follow these steps for a complete manual setup of the application on a server with aapanel. If you're seeing this page due to an error, it's likely one of these configuration steps is missing or incorrect.
      </p>

      <div className="divide-y dark:divide-gray-700/50">
        <Step number={1} title="Initial Server Setup" icon={<DatabaseIcon className="w-6 h-6 mr-3 text-primary-500"/>}>
            <p>First, ensure your server is ready and clone the project source code.</p>
            <ul className="list-disc list-outside pl-6 space-y-2">
                <li>
                    <strong>Install Node.js:</strong> In aapanel, go to the <strong>App Store</strong> and install Node.js version 18 or newer.
                </li>
                 <li>
                    <strong>Clone the Repository:</strong> In aapanel, go to <strong>Files</strong>, navigate to `/www/wwwroot/`, open the terminal, and run:
                    <CodeBlock code={`git clone YOUR_GITHUB_REPO_URL your_domain.com\ncd your_domain.com`} />
                </li>
                <li>
                    <strong>Create Database:</strong> Go to the <strong>Databases</strong> section, click <strong>Add database</strong>, and create a new database. Save the database name, username, and password.
                </li>
            </ul>
        </Step>

        <Step number={2} title="Application Configuration" icon={<CogIcon className="w-6 h-6 mr-3 text-primary-500"/>}>
            <p>Configure the application to connect to your database and prepare it for launch.</p>
            <ul className="list-disc list-outside pl-6 space-y-2">
                <li>
                    <strong>Configure <code>.env</code> file:</strong> In the terminal, inside your project directory, copy the example file: <CodeBlock code={`cp .env.example .env`} />
                    Then, edit the new <code>.env</code> file and fill in your database credentials.
                    <CodeBlock code={DotEnvExample} />
                </li>
                <li>
                    <strong>Install Dependencies & Build:</strong> In the terminal, run the following commands to install packages and build the frontend.
                    <CodeBlock code={`npm install\nnpm run build`} />
                </li>
            </ul>
        </Step>

        <Step number={3} title="Backend & Frontend Service" icon={<CogIcon className="w-6 h-6 mr-3 text-primary-500"/>}>
             <p>Set up the backend server process and configure Nginx to serve the app correctly.</p>
             <ul className="list-disc list-outside pl-6 space-y-2">
                <li>
                    <strong>Set Up Node.js Backend:</strong> In aapanel, go to <strong>Website &gt; Node project &gt; Add Node project</strong>.
                    <ul className="list-['-_'] pl-6 mt-2 space-y-1 bg-gray-50 dark:bg-gray-900/50 p-3 rounded-md">
                        <li><strong>Project Dir:</strong> Select your project folder (e.g., `/www/wwwroot/your_domain.com`).</li>
                        <li><strong>Port:</strong> Set it to `3001`.</li>
                        <li><strong>Run file name:</strong> `services/server.js`</li>
                    </ul>
                    Click <strong>Submit</strong>. The backend server should now be running.
                </li>
                <li>
                    <strong>Configure Nginx Reverse Proxy:</strong> This is the most common point of failure. Go to <strong>Website</strong>, click **Config** for your domain, and replace the entire configuration with the template below.
                    <div className="bg-yellow-100 dark:bg-yellow-900/50 border-l-4 border-yellow-500 text-yellow-800 dark:text-yellow-300 p-4 rounded-r-lg my-4">
                      <p><strong className="font-bold">Important:</strong> The trailing slash (`/`) on the `proxy_pass` directive is essential. It correctly routes `/api/*` requests to your backend.</p>
                    </div>
                    <CodeBlock code={NginxConfigExample} />
                </li>
             </ul>
        </Step>
        
        <Step number={4} title="Finalization & Troubleshooting" icon={<ExternalLinkIcon className="w-6 h-6 mr-3 text-primary-500"/>}>
             <p>Your application should now be live. Finish the setup within the app and consult these tips if you encounter issues.</p>
             <ul className="list-disc list-outside pl-6 space-y-2">
                <li><strong>Set API Token:</strong> Visit your website, navigate to the <strong>Settings</strong> page, and enter your LZT Market API token.</li>
                <li><strong>Add a Game:</strong> Go to <strong>Manage Games</strong> and add a game from a preset to start fetching listings.</li>
             </ul>
             <h3 className="font-semibold text-lg pt-4">Troubleshooting</h3>
             <ul className="list-disc list-outside pl-6 space-y-2">
                <li><strong>Still seeing the old version?</strong> Your browser is caching files. Do a hard refresh (Ctrl+Shift+R or Cmd+Shift+R). The Nginx config is designed to prevent this, but browser caches can be aggressive.</li>
                <li><strong>502 Bad Gateway:</strong> Your Node.js backend is not running. Check its logs in aapanel for errors, which are often caused by incorrect database credentials in your `.env` file.</li>
                <li><strong>404 Not Found on API Calls:</strong> Your Nginx configuration is incorrect. Double-check that you've copied the config from Step 3 correctly and saved it.</li>
             </ul>
        </Step>
      </div>
    </div>
  );
};

export default SetupGuidePage;