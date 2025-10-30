import React from 'react';
import { ExternalLinkIcon, DatabaseIcon } from './Icons';

const CodeBlock: React.FC<{ code: string }> = ({ code }) => (
    <pre className="bg-gray-100 dark:bg-gray-900 p-3 my-2 rounded-md font-mono text-sm overflow-x-auto">
        <code>{code}</code>
    </pre>
);

const NginxConfigExample = `
server {
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
}
`;

const SetupGuidePage: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto bg-white dark:bg-gray-800 p-8 rounded-xl shadow-lg">
      <h1 className="text-3xl font-bold mb-4">Setup Guide</h1>
      <p className="text-lg text-gray-600 dark:text-gray-400 mb-8">
        Follow these steps to get the application running correctly. If you're seeing this page due to an error, it's likely one of these configuration steps is missing or incorrect.
      </p>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold border-b pb-2 dark:border-gray-600 flex items-center"><DatabaseIcon className="w-6 h-6 mr-3 text-primary-500"/>1. Server &amp; Database Setup</h2>
        <p>
          This application requires a running Node.js backend and a MySQL database. If you're seeing a "502 Bad Gateway" error, your backend is likely offline. If you're seeing an "Access Denied" error, your database credentials are incorrect.
        </p>
        <ul className="list-disc pl-6 space-y-2">
          <li>
            <strong>Check Node Project:</strong> In aapanel, go to <strong>Website &gt; Node project</strong> and ensure your application is "Running". Check the logs for any errors.
          </li>
          <li>
            <strong>Check <code>.env</code> file:</strong> Ensure the <code>.env</code> file in your project root (`/www/wwwroot/your_domain.com/.env`) contains the correct database credentials.
          </li>
        </ul>
      </section>

      <section className="space-y-4 mt-8">
        <h2 className="text-2xl font-semibold border-b pb-2 dark:border-gray-600">2. Nginx Configuration</h2>
        <p>
          An incorrect Nginx setup is the most common cause of "404 Not Found" errors. Your Nginx config acts as a reverse proxy, directing API calls to the backend and serving the frontend for all other requests.
        </p>
        <ol className="list-decimal pl-6 space-y-2">
          <li>In aapanel, go to <strong>Website</strong> and click **Config** for your domain.</li>
          <li>Replace the entire configuration with the template below.</li>
          <li><strong>Crucially, replace `your_domain.com` with your actual domain.</strong></li>
        </ol>
        <div className="bg-yellow-100 dark:bg-yellow-900/50 border-l-4 border-yellow-500 text-yellow-800 dark:text-yellow-300 p-4 rounded-r-lg mt-4">
          <p><strong className="font-bold">Important:</strong> The trailing slash (`/`) on the `proxy_pass` directive is essential. It correctly routes `/api/some/path` to your backend as `/some/path`.</p>
        </div>
        <CodeBlock code={NginxConfigExample} />
      </section>

      <section className="space-y-4 mt-8">
        <h2 className="text-2xl font-semibold border-b pb-2 dark:border-gray-600">3. Application Tokens</h2>
        <p>
          To fetch listings from the LZT Market, you need to provide an API token on the application's **Settings** page.
        </p>
      </section>

       <section className="space-y-4 mt-8">
        <h2 className="text-2xl font-semibold border-b pb-2 dark:border-gray-600">Troubleshooting</h2>
        <ul className="list-disc pl-6 space-y-2">
          <li><strong>Still seeing the old version?</strong> Your browser or server is caching files. Follow the `README.md` instructions to deploy using `npm run deploy`, which clears caches. If it persists, do a hard refresh in your browser (Ctrl+Shift+R or Cmd+Shift+R).</li>
          <li><strong>Other Errors:</strong> Check your browser's developer console (F12) and the backend logs in aapanel for more specific error messages.</li>
        </ul>
      </section>
    </div>
  );
};

export default SetupGuidePage;
