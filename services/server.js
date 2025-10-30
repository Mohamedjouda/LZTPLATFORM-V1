// server.js
import express from 'express';
import mysql from 'mysql2/promise';
import { v4 as uuidv4 } from 'uuid';
import cors from 'cors';

const app = express();
const apiRouter = express.Router(); // Create a router
const port = 3001;

// --- Database Configuration ---
// IMPORTANT: Replace these with your actual database credentials.
const dbConfig = {
  host: '127.0.0.1',
  user: 'uglp_db',
  password: '48DGKPs6ZrsSJkta',
  database: 'uglp_db',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  // Add support for JSON columns
  supportBigNumbers: true,
  bigNumberStrings: true
};

const pool = mysql.createPool(dbConfig);

// --- Database Initialization ---
const sqlSchema = `
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

const initializeDatabase = async () => {
  try {
    const statements = sqlSchema.split(';').map(s => s.trim()).filter(s => s.length > 0);
    for (const statement of statements) {
      await pool.execute(statement);
    }
    console.log('Database schema verified and initialized successfully.');
  } catch (error) {
    console.error('Failed to initialize database:', error);
    // Exit if the database can't be set up, as the app won't work.
    process.exit(1);
  }
};


// --- Middleware ---
app.use(cors());
app.use(express.json());

// --- Helper Functions ---
const parseJsonFields = (item) => {
    const parsed = { ...item };
    for (const key in parsed) {
        if (typeof parsed[key] === 'string') {
            try {
                // Only parse if it looks like JSON (starts with { or [)
                if (parsed[key].startsWith('{') || parsed[key].startsWith('[')) {
                    parsed[key] = JSON.parse(parsed[key]);
                }
            } catch (e) {
                // Not a JSON string, leave it as is
            }
        }
    }
    return parsed;
};


// --- API Routes ---

// Generic LZT API Proxy
apiRouter.post('/proxy/lzt', async (req, res) => {
    const { encodedUrl, token } = req.body;

    if (!encodedUrl || !token) {
        return res.status(400).json({ message: 'encodedUrl and Token are required for proxy.' });
    }

    try {
        // Decode the URL from Base64 to prevent WAF issues with URLs in JSON.
        const url = Buffer.from(encodedUrl, 'base64').toString('utf-8');

        const targetUrl = new URL(url);
        // Security: ensure we are only proxying to the intended domain
        if (targetUrl.hostname !== 'prod-api.lzt.market') {
            return res.status(403).json({ message: 'Proxy requests are limited to prod-api.lzt.market only.' });
        }

        const lztResponse = await fetch(url, {
            headers: { 'Authorization': `Bearer ${token}` },
        });

        const responseBodyText = await lztResponse.text();

        // Add robust handling for non-ok responses from the external API
        if (!lztResponse.ok) {
            console.error(`LZT API Error (${lztResponse.status}): ${responseBodyText}`);
            // Forward the status and a structured error message to the client
            return res.status(lztResponse.status).json({ message: `External API returned status ${lztResponse.status}`, details: responseBodyText });
        }

        // Forward the successful response (headers, status, body) to the client
        res.status(lztResponse.status);
        const contentType = lztResponse.headers.get('content-type');
        if (contentType) {
            res.setHeader('Content-Type', contentType);
        }
        res.send(responseBodyText);

    } catch (error) {
        console.error(`Error in proxy endpoint:`, error);
        res.status(502).json({ message: `Bad Gateway: Could not connect to the external API. ${error.message}` });
    }
});


// GET /settings/:key
apiRouter.get('/settings/:key', async (req, res) => {
    try {
        const [rows] = await pool.execute('SELECT `value` FROM `settings` WHERE `key` = ?', [req.params.key]);
        if (rows.length > 0) {
            res.json({ value: rows[0].value });
        } else {
            res.json({ value: null });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: error.message });
    }
});

// POST /settings
apiRouter.post('/settings', async (req, res) => {
    const { key, value } = req.body;
    try {
        await pool.execute('INSERT INTO `settings` (`key`, `value`) VALUES (?, ?) ON DUPLICATE KEY UPDATE `value` = ?', [key, value, value]);
        res.status(200).json({ message: 'Setting updated' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: error.message });
    }
});

// GET /games
apiRouter.get('/games', async (req, res) => {
    try {
        const [rows] = await pool.execute('SELECT * FROM `games` ORDER BY `id`');
        const games = rows.map(parseJsonFields);
        res.json(games);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: error.message });
    }
});

// POST /games (Upsert)
apiRouter.post('/games', async (req, res) => {
    const game = req.body;
    try {
        const columnsToUpdate = {};
        Object.keys(game).forEach(key => {
            if (key !== 'id' && game[key] !== undefined) {
                const value = game[key];
                columnsToUpdate[key] = (typeof value === 'object' && value !== null) ? JSON.stringify(value) : value;
            }
        });
        
        if (game.id) { // Update
            const fields = Object.keys(columnsToUpdate).map(key => `\`${key}\` = ?`).join(', ');
            const values = Object.values(columnsToUpdate);
            await pool.execute(`UPDATE \`games\` SET ${fields} WHERE \`id\` = ?`, [...values, game.id]);
        } else { // Insert
            const fields = Object.keys(columnsToUpdate).map(key => `\`${key}\``).join(', ');
            const placeholders = Object.keys(columnsToUpdate).map(() => '?').join(', ');
            const values = Object.values(columnsToUpdate);
            await pool.execute(`INSERT INTO \`games\` (${fields}) VALUES (${placeholders})`, values);
        }
        res.status(200).json({ message: 'Game saved' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: error.message });
    }
});

// GET /games/:gameId/listings
apiRouter.get('/games/:gameId/listings', async (req, res) => {
    const { gameId } = req.params;
    const { view, sort, page = 1, limit = 25, filters } = req.query;

    try {
        let whereClauses = ['`game_id` = ?'];
        let params = [gameId];

        if (view === 'active') whereClauses.push('`is_hidden` = FALSE AND `is_archived` = FALSE');
        else if (view === 'hidden') whereClauses.push('`is_hidden` = TRUE AND `is_archived` = FALSE');
        else if (view === 'archived') whereClauses.push('`is_archived` = TRUE');

        if (filters && typeof filters === 'string') {
            const parsedFilters = JSON.parse(filters);
            if (parsedFilters.title) {
                whereClauses.push('`title` LIKE ?');
                params.push(`%${parsedFilters.title}%`);
            }
        }
        
        const whereSql = `WHERE ${whereClauses.join(' AND ')}`;
        const [[{ count }]] = await pool.execute(`SELECT COUNT(*) as count FROM \`listings\` ${whereSql}`, params);
        
        const offset = (Number(page) - 1) * Number(limit);
        const [sortConfig] = await pool.execute('SELECT `sorts` from `games` WHERE `id` = ?', [gameId]);
        const sorts = sortConfig.length > 0 ? JSON.parse(sortConfig[0].sorts) : [];
        const currentSort = sorts.find(s => s.id === sort) || { column: 'last_seen_at', ascending: false };
        const orderBy = `ORDER BY \`${currentSort.column}\` ${currentSort.ascending ? 'ASC' : 'DESC'}`;
        
        const [rows] = await pool.execute(`SELECT * FROM \`listings\` ${whereSql} ${orderBy} LIMIT ? OFFSET ?`, [...params, Number(limit), offset]);
        
        res.json({ data: rows.map(parseJsonFields), count });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: error.message });
    }
});

// GET /games/:gameId/listings/ids
apiRouter.get('/games/:gameId/listings/ids', async (req, res) => {
    const { gameId } = req.params;
    const { view, filters } = req.query;
    try {
        let whereClauses = ['`game_id` = ?'];
        let params = [gameId];
        if (view === 'active') whereClauses.push('`is_hidden` = FALSE AND `is_archived` = FALSE');
        else if (view === 'hidden') whereClauses.push('`is_hidden` = TRUE AND `is_archived` = FALSE');
        else if (view === 'archived') whereClauses.push('`is_archived` = TRUE');
        if (filters && typeof filters === 'string') { /* basic filtering */ }

        const whereSql = `WHERE ${whereClauses.join(' AND ')}`;
        const [rows] = await pool.execute(`SELECT item_id FROM \`listings\` ${whereSql}`, params);
        res.json(rows.map(r => r.item_id));
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: error.message });
    }
});

// GET /games/:gameId/listings/export
apiRouter.get('/games/:gameId/listings/export', async (req, res) => {
    // Similar to listings getter but without pagination
    const { gameId } = req.params;
    const { view, sort, filters } = req.query;
     try {
        let whereClauses = ['`game_id` = ?'];
        let params = [gameId];
        if (view === 'active') whereClauses.push('`is_hidden` = FALSE AND `is_archived` = FALSE');
        else if (view === 'hidden') whereClauses.push('`is_hidden` = TRUE AND `is_archived` = FALSE');
        else if (view === 'archived') whereClauses.push('`is_archived` = TRUE');
        const whereSql = `WHERE ${whereClauses.join(' AND ')}`;
        const [rows] = await pool.execute(`SELECT * FROM \`listings\` ${whereSql}`, params);
        res.json(rows.map(parseJsonFields));
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: error.message });
    }
});


// POST /games/:gameId/listings/by-ids
apiRouter.post('/games/:gameId/listings/by-ids', async (req, res) => {
    const { gameId } = req.params;
    const { ids } = req.body;
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
        return res.status(400).json({ message: 'IDs must be a non-empty array.' });
    }
    try {
        const placeholders = ids.map(() => '?').join(',');
        const [rows] = await pool.execute(`SELECT * FROM listings WHERE game_id = ? AND item_id IN (${placeholders})`, [gameId, ...ids]);
        res.json(rows.map(parseJsonFields));
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: error.message });
    }
});

// PATCH /games/:gameId/listings/bulk-update
apiRouter.patch('/games/:gameId/listings/bulk-update', async (req, res) => {
    const { gameId } = req.params;
    const { itemIds, updates } = req.body;
    if (!itemIds || itemIds.length === 0) return res.status(400).json({ message: 'No item IDs provided.' });
    try {
        const fields = Object.keys(updates).map(key => `\`${key}\` = ?`).join(', ');
        const values = Object.values(updates);
        const placeholders = itemIds.map(() => '?').join(',');
        const [result] = await pool.execute(`UPDATE \`listings\` SET ${fields} WHERE \`game_id\` = ? AND \`item_id\` IN (${placeholders})`, [...values, gameId, ...itemIds]);
        res.json({ updated: result.affectedRows });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: error.message });
    }
});

// POST /listings/bulk-upsert
apiRouter.post('/listings/bulk-upsert', async (req, res) => {
    const listings = req.body;
    if (!listings || listings.length === 0) return res.status(400).json({ message: 'No listings provided.' });
    
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();
        let upsertedCount = 0;
        for (const listing of listings) {
            const keys = Object.keys(listing).filter(k => listing[k] !== undefined);
            const values = keys.map(k => (typeof listing[k] === 'object' && listing[k] !== null) ? JSON.stringify(listing[k]) : listing[k]);
            const fields = keys.map(k => `\`${k}\``).join(',');
            const placeholders = keys.map(() => '?').join(',');
            
            // On update, do not change user-managed fields.
            const updateKeys = keys.filter(k => !['item_id', 'game_id', 'is_hidden', 'is_archived', 'archived_reason', 'archived_at', 'first_seen_at'].includes(k));

            if (updateKeys.length > 0) {
                const onUpdate = updateKeys.map(k => `\`${k}\` = VALUES(\`${k}\`)`).join(',');
                const [result] = await connection.execute(`INSERT INTO \`listings\` (${fields}) VALUES (${placeholders}) ON DUPLICATE KEY UPDATE ${onUpdate}`, values);
                upsertedCount += result.affectedRows;
            } else {
                 // This case might happen if only primary keys are sent. We can insert-ignore.
                const [result] = await connection.execute(`INSERT IGNORE INTO \`listings\` (${fields}) VALUES (${placeholders})`, values);
                upsertedCount += result.affectedRows;
            }
        }
        await connection.commit();
        res.json({ upserted: upsertedCount });
    } catch (error) {
        await connection.rollback();
        console.error(error);
        res.status(500).json({ message: error.message });
    } finally {
        connection.release();
    }
});

// GET /games/:gameId/dashboard/counts
apiRouter.get('/games/:gameId/dashboard/counts', async (req, res) => {
    const { gameId } = req.params;
    try {
        const [[{ count: active }]] = await pool.execute('SELECT COUNT(*) as count FROM `listings` WHERE `game_id` = ? AND `is_hidden` = FALSE AND `is_archived` = FALSE', [gameId]);
        const [[{ count: hidden }]] = await pool.execute('SELECT COUNT(*) as count FROM `listings` WHERE `game_id` = ? AND `is_hidden` = TRUE AND `is_archived` = FALSE', [gameId]);
        const [[{ count: archived }]] = await pool.execute('SELECT COUNT(*) as count FROM `listings` WHERE `game_id` = ? AND `is_archived` = TRUE', [gameId]);
        res.json({ active, hidden, archived });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: error.message });
    }
});

// GET /games/:gameId/dashboard/logs
apiRouter.get('/games/:gameId/dashboard/logs', async (req, res) => {
    const { gameId } = req.params;
    try {
        const [fetchLogs] = await pool.execute('SELECT * FROM `fetch_logs` WHERE `game_id` = ? ORDER BY `created_at` DESC LIMIT 10', [gameId]);
        const [checkLogs] = await pool.execute('SELECT * FROM `check_logs` WHERE `game_id` = ? ORDER BY `created_at` DESC LIMIT 10', [gameId]);
        res.json({ fetchLogs, checkLogs });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: error.message });
    }
});

// POST /logs/fetch
apiRouter.post('/logs/fetch', async (req, res) => {
    const log = req.body;
    try {
        const id = uuidv4();
        await pool.execute('INSERT INTO `fetch_logs` (id, game_id, page, items_fetched, status, error_message, duration_ms) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [id, log.game_id, log.page, log.items_fetched, log.status, log.error_message, log.duration_ms]);
        res.status(201).json({ ...log, id });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: error.message });
    }
});

// POST /logs/check
apiRouter.post('/logs/check', async (req, res) => {
    const log = req.body;
    try {
        const id = uuidv4();
        await pool.execute('INSERT INTO `check_logs` (id, game_id, items_checked, items_archived, status, error_message, duration_ms) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [id, log.game_id, log.items_checked, log.items_archived, log.status, log.error_message, log.duration_ms]);
        res.status(201).json({ ...log, id });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: error.message });
    }
});

// PATCH /logs/check/:logId
apiRouter.patch('/logs/check/:logId', async (req, res) => {
    const { logId } = req.params;
    const updates = req.body;
    try {
        const fields = Object.keys(updates).map(key => `\`${key}\` = ?`).join(', ');
        const values = Object.values(updates);
        await pool.execute(`UPDATE \`check_logs\` SET ${fields} WHERE \`id\` = ?`, [...values, logId]);
        res.json({ message: 'Log updated' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: error.message });
    }
});

// GET /games/:gameId/listings/for-check
apiRouter.get('/games/:gameId/listings/for-check', async (req, res) => {
    const { gameId } = req.params;
    const { cursor = 0, limit = 50 } = req.query;
    try {
        const [rows] = await pool.execute(
            'SELECT `item_id` FROM `listings` WHERE `game_id` = ? AND `is_archived` = FALSE AND `item_id` > ? ORDER BY `item_id` ASC LIMIT ?',
            [gameId, Number(cursor), Number(limit)]
        );
        res.json(rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: error.message });
    }
});


// --- Server Start ---
const startServer = async () => {
  await initializeDatabase();

  // Mount the API router at both /api and /.
  // This makes the backend resilient to Nginx configurations.
  // - If Nginx proxies /api/ to / (stripping the prefix), the second line handles it.
  // - If Nginx proxies /api/ to /api/ (not stripping), the first line handles it.
  // This robustly handles the most common 404 error source during setup.
  app.use('/api', apiRouter);
  app.use('/', apiRouter);

  app.listen(port, () => {
      console.log(`Server listening at http://localhost:${port}`);
  });
};

startServer();