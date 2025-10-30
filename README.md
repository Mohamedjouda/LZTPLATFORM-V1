# Universal Game Listing Platform (U.G.L.P.)

This is a comprehensive tool to browse, filter, and analyze game account listings from the LZT Market API. It features dynamic configurations for each game, advanced filtering, a unified interface, and an automated deployment process.

## Easy Deployment (Recommended)

After the initial setup, deploying updates is a single command.

1.  **SSH into your server** and navigate to your project directory:
    ```bash
    cd /www/wwwroot/your_domain.com
    ```
2.  **Run the deploy command**:
    ```bash
    npm run deploy
    ```
    This command automatically pulls the latest code from GitHub, installs dependencies, builds the new frontend, and restarts your servers.

## Initial Setup on aapanel

Follow these steps for the first-time setup on a fresh server.

### 1. Prerequisite: Install Node.js
Ensure you have Node.js (version 18 or newer) installed on your server. You can do this from the aapanel **App Store**.

### 2. Clone the Repository
- Go to the **Files** section in aapanel.
- Navigate to `/www/wwwroot/`.
- Open the **Terminal** and clone your repository:
  ```bash
  git clone YOUR_GITHUB_REPO_URL your_domain.com
  ```
- Navigate into the new directory:
  ```bash
  cd your_domain.com
  ```

### 3. Create the Database
- Go to the **Databases** section in aapanel.
- Click **Add database**.
- Create a new database (e.g., `uglp_db`).
- **Save the database name, username, and password.** You will need them next.

### 4. Configure Environment Variables
- In the terminal, inside your project directory, copy the example `.env` file:
  ```bash
  cp .env.example .env
  ```
- Go back to the **Files** view, find the new `.env` file, and click **Edit**.
- Fill in your database credentials:
  ```
  DB_HOST=127.0.0.1
  DB_USER=YOUR_DB_USERNAME
  DB_PASSWORD=YOUR_DB_PASSWORD
  DB_NAME=YOUR_DB_NAME
  ```
- (Optional) Add your Google Gemini API key to enable the "Deal Score" feature:
  ```
  API_KEY=YOUR_GEMINI_API_KEY_HERE
  ```

### 5. Install Dependencies & Build
- In the terminal, run the installation command. This will download all the required packages.
  ```bash
  npm install
  ```
- Now, build the frontend application. This creates the `dist` folder.
  ```bash
  npm run build
  ```

### 6. Set Up the Node.js Backend
- Go to the **Website** section in aapanel.
- Click **Node project** > **Add Node project**.
- Configure the project:
    - **Project Dir:** Select your project folder (e.g., `/www/wwwroot/your_domain.com`).
    - **Project Name:** Give it a name (e.g., `uglp-backend`).
    - **Port:** Set it to `3001`.
    - **Run file name:** `services/server.js`
- Click **Submit**. The backend server should now be running.

### 7. Configure Nginx Reverse Proxy
- Go to **Website**, find your domain, and click **Config**.
- **This is the most critical step.** Replace the **entire content** of the configuration file with the following code block.
- **Remember to replace `your_domain.com` with your actual domain name.**

```nginx
server {
    listen 80;
    listen 443 ssl http2;
    server_name your_domain.com; # <-- Replace with your domain

    # --- SSL Configuration (Auto-filled by aapanel, leave as is) ---
    ssl_certificate /www/server/panel/vhost/cert/your_domain.com/fullchain.pem;
    ssl_certificate_key /www/server/panel/vhost/cert/your_domain.com/privkey.pem;
    ssl_protocols TLSv1.1 TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES128-GCM-SHA256:HIGH:!aNULL:!MD5:!RC4:!DHE;
    ssl_prefer_server_ciphers on;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;
    add_header Strict-Transport-Security "max-age=31536000";

    # --- Root Directory for the BUILT FRONTEND ---
    root /www/wwwroot/your_domain.com/dist;
    index index.html;

    # --- Caching Rules ---
    # Aggressively cache static assets with hashed filenames
    location ~* \.(?:css|js)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
    # DO NOT CACHE index.html - This is crucial for seeing new deployments
    location = /index.html {
        expires -1;
        add_header Cache-Control "no-cache, no-store, must-revalidate";
    }

    # --- Reverse Proxy for the BACKEND API ---
    # This sends all API calls to your Node.js server.
    # The trailing slash on proxy_pass is CRITICAL. It strips /api/ from the request.
    location /api/ {
        proxy_pass http://127.0.0.1:3001/; # <-- IMPORTANT: Trailing slash is required.
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # --- Routing for the React Single-Page Application ---
    # This ensures that refreshing the browser on any page works correctly.
    location / {
        try_files $uri $uri/ /index.html;
    }
}
```
- Click **Save**. Your site should now be live.

### 8. Final Application Setup
- Visit your website.
- Go to the **Settings** page and enter your LZT Market API token.
- Go to **Manage Games** and add a game from a preset.
- You are ready to start fetching listings!

---

## Troubleshooting

-   **`npm err Missing script: "deploy"`**: This means the `package.json` file on your server is out of date. Run `git pull` to get the latest version, then run `npm run deploy` again.
-   **Old version of the site is showing**: This is a caching issue. Run `npm run deploy` to force a clean build and server restart. If it persists, do a "hard refresh" in your browser (Ctrl+Shift+R or Cmd+Shift+R).
-   **502 Bad Gateway Error**: Your Node.js server is not running. Check the logs in **Website > Node project > Log** to see the error. It's usually an incorrect database password in your `.env` file.
-   **404 Not Found on API calls**: Your Nginx configuration is incorrect. Double-check that you have copied the entire configuration block from Step 7 correctly and restarted Nginx.
