// U.G.L.P. Backend Server
// This server handles all API requests, database interactions, and proxies external API calls.

import express from 'express';
import cors from 'cors';
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import { readFileSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { v4 as uuidv4 } from 'uuid';

// --- Initialization ---
dotenv.config();
const app = express();
const port = process.env.PORT || 3001;

// ES Module equivalent for __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// --- Database Configuration ---
const dbConfig = {
  host: process.env.DB_HOST || '127.0.0.1',
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  supportBigNumbers: true,
  bigNumberStrings: true,
};

let pool;

async function initializeDatabase() {
  try {
    pool = mysql.createPool(dbConfig);
    const connection = await pool.getConnection();
    console.log("Successfully connected to the database.");

    // --- Schema Initialization ---
    await connection.query(`
      CREATE TABLE IF NOT EXISTS settings (
        setting_key VARCHAR(255) PRIMARY KEY,
        setting_value TEXT
      );
    `);
    await connection.query(`
      CREATE TABLE IF NOT EXISTS games (
        id INT AUTO_INCREMENT PRIMARY KEY,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        name VARCHAR(255) NOT NULL,
        slug VARCHAR(255) UNIQUE NOT NULL,
        category VARCHAR(255),
        description TEXT,
        api_base_url VARCHAR(255),
        list_path VARCHAR(255),
        check_path_template VARCHAR(255),
        default_filters JSON,
        columns JSON,
        filters JSON,
        sorts JSON,
        fetch_worker_enabled BOOLEAN DEFAULT TRUE,
        check_worker_enabled BOOLEAN DEFAULT TRUE,
        fetch_interval_minutes INT DEFAULT 60,
        fetch_page_limit INT DEFAULT 10
      );
    `);
    await connection.query(`
      CREATE TABLE IF NOT EXISTS listings (
        item_id BIGINT PRIMARY KEY,
        game_id INT NOT NULL,
        url VARCHAR(2048),
        title VARCHAR(512),
        price DECIMAL(10, 2),
        currency VARCHAR(10),
        game_specific_data JSON,
        deal_score INT,
        is_hidden BOOLEAN DEFAULT FALSE,
        is_archived BOOLEAN DEFAULT FALSE,
        archived_reason VARCHAR(255),
        first_seen_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        last_seen_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        archived_at TIMESTAMP NULL,
        raw_response JSON,
        FOREIGN KEY (game_id) REFERENCES games(id) ON DELETE CASCADE,
        INDEX(game_id, is_hidden, is_archived)
      );
    `);
    await connection.query(`
      CREATE TABLE IF NOT EXISTS fetch_logs (
        id VARCHAR(36) PRIMARY KEY,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        game_id INT,
        page INT,
        items_fetched INT,
        status VARCHAR(50),
        error_message TEXT,
        duration_ms INT,
        FOREIGN KEY (game_id) REFERENCES games(id) ON DELETE SET NULL
      );
    `);
     await connection.query(`
      CREATE TABLE IF NOT EXISTS check_logs (
        id VARCHAR(36) PRIMARY KEY,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        game_id INT,
        items_checked INT,
        items_archived INT,
        status VARCHAR(50),
        error_message TEXT,
        duration_ms INT,
        FOREIGN KEY (game_id) REFERENCES games(id) ON DELETE SET NULL
      );
    `);
    console.log("Database schema verified successfully.");
    connection.release();
  } catch (error) {
    console.error("FATAL: Could not connect to or initialize the database.", error);
    process.exit(1);
  }
}

// --- Middleware ---
app.use(cors());
app.use(express.json({ limit: '10mb' })); // Increase limit for bulk uploads

// --- API Router ---
const apiRouter = express.Router();

// Helper to build dynamic WHERE clauses safely
const buildWhereClause = (gameId, view, filters) => {
    let where = 'WHERE game_id = ?';
    let params = [gameId];

    if (view === 'active') where += ' AND is_hidden = false AND is_archived = false';
    if (view === 'hidden') where += ' AND is_hidden = true AND is_archived = false';
    if (view === 'archived') where += ' AND is_archived = true';

    if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
            if (value) {
                if (key === 'title') {
                    where += ' AND title LIKE ?';
                    params.push(`%${value}%`);
                }
                // Add more filter logic here as needed
            }
        });
    }
    return { where, params };
};

// --- Endpoints ---

apiRouter.get('/version', (req, res) => {
    try {
        const packageJsonPath = path.join(__dirname, '..', 'package.json');
        const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf8'));
        res.json({ version: packageJson.version });
    } catch (error) {
        res.status(500).json({ message: "Could not read application version." });
    }
});

apiRouter.post('/proxy/lzt', async (req, res) => {
    try {
        const { token, method } = req.body;
        const encodedUrl = req.query.url;

        if (!token || !encodedUrl) return res.status(400).json({ message: "Missing token or URL." });
        
        const decodedUrl = Buffer.from(encodedUrl, 'base64').toString('utf-8');
        const urlObject = new URL(decodedUrl);

        const allowedHostnames = ['api.lzt.market', 'prod-api.lzt.market'];
        if (!allowedHostnames.includes(urlObject.hostname)) {
             return res.status(403).json({ message: "Proxy is limited to the LZT API." });
        }

        const response = await fetch(decodedUrl, { 
            method: method || 'GET',
            headers: { 'Authorization': `Bearer ${token}` } 
        });
        
        const data = await response.json();

        if (!response.ok) {
            const errorDetails = data.errors ? data.errors.join(', ') : `External API returned status ${response.status}`;
            return res.status(response.status).json({ message: 'Error from external API', details: errorDetails });
        }
        res.json(data);
    } catch (error) {
        res.status(500).json({ message: 'An internal proxy error occurred.', details: error.message });
    }
});

apiRouter.get('/settings/:key', async (req, res) => {
    const [rows] = await pool.query('SELECT setting_value FROM settings WHERE setting_key = ?', [req.params.key]);
    res.json({ value: rows[0]?.setting_value || null });
});

apiRouter.post('/settings', async (req, res) => {
    const { key, value } = req.body;
    await pool.query('INSERT INTO settings (setting_key, setting_value) VALUES (?, ?) ON DUPLICATE KEY UPDATE setting_value = ?', [key, value, value]);
    res.status(200).json({ message: 'Setting updated' });
});

apiRouter.get('/games', async (req, res) => {
    const [rows] = await pool.query('SELECT * FROM games ORDER BY name ASC');
    res.json(rows);
});

apiRouter.post('/games', async (req, res) => {
    const { id, ...gameData } = req.body;
    ['default_filters', 'columns', 'filters', 'sorts'].forEach(key => {
        if (gameData[key] && typeof gameData[key] !== 'string') gameData[key] = JSON.stringify(gameData[key]);
    });
    try {
        if (id) {
            await pool.query('UPDATE games SET ? WHERE id = ?', [gameData, id]);
        } else {
            await pool.query('INSERT INTO games SET ?', gameData);
        }
        res.status(201).json({ message: 'Game saved' });
    } catch (err) {
        if (err.code === 'ER_DUP_ENTRY' && err.message.includes("'slug'")) {
            return res.status(409).json({ message: `A game with the slug '${gameData.slug}' already exists. Please choose a unique slug.` });
        }
        res.status(500).json({ message: err.message });
    }
});

apiRouter.delete('/games/:gameId', async (req, res) => {
    const { gameId } = req.params;
    try {
        // The 'listings' table has ON DELETE CASCADE, so related listings will be deleted automatically.
        // The log tables have ON DELETE SET NULL, so their game_id will be nulled.
        const [result] = await pool.query('DELETE FROM games WHERE id = ?', [gameId]);
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Game not found.' });
        }
        res.status(200).json({ message: 'Game deleted successfully.' });
    } catch (err) {
        console.error("Error deleting game:", err);
        res.status(500).json({ message: `Failed to delete game: ${err.message}` });
    }
});

apiRouter.get('/games/:gameId/listings', async (req, res) => {
    const { gameId } = req.params;
    const { view, sort, page, limit, filters } = req.query;
    const parsedFilters = filters ? JSON.parse(filters) : {};
    
    const { where, params } = buildWhereClause(gameId, view, parsedFilters);
    const offset = (parseInt(page) - 1) * parseInt(limit);

    const [[{ count }]] = await pool.query(`SELECT COUNT(*) as count FROM listings ${where}`, params);
    const [data] = await pool.query(`SELECT * FROM listings ${where} ORDER BY last_seen_at DESC LIMIT ? OFFSET ?`, [...params, parseInt(limit), offset]);
    
    res.json({ data, count });
});

apiRouter.patch('/games/:gameId/listings/bulk-update', async (req, res) => {
    const { itemIds, updates } = req.body;
    if (!itemIds || itemIds.length === 0) return res.status(400).json({ message: 'No item IDs provided.' });
    
    const [result] = await pool.query('UPDATE listings SET ? WHERE item_id IN (?)', [updates, itemIds]);
    res.json({ updated: result.affectedRows });
});

apiRouter.post('/listings/bulk-upsert', async (req, res) => {
    const listings = req.body;
    if (!listings || listings.length === 0) return res.status(400).json({ message: 'No listings to upsert.' });
    
    const values = listings.map(l => [l.item_id, l.game_id, l.url, l.title, l.price, l.currency, JSON.stringify(l.game_specific_data), l.deal_score, JSON.stringify(l.raw_response), l.last_seen_at]);
    const sql = `INSERT INTO listings (item_id, game_id, url, title, price, currency, game_specific_data, deal_score, raw_response, last_seen_at) VALUES ? 
                 ON DUPLICATE KEY UPDATE title=VALUES(title), price=VALUES(price), currency=VALUES(currency), game_specific_data=VALUES(game_specific_data), deal_score=VALUES(deal_score), raw_response=VALUES(raw_response), last_seen_at=VALUES(last_seen_at)`;

    const [result] = await pool.query(sql, [values]);
    res.json({ upserted: result.affectedRows });
});

apiRouter.post('/games/:gameId/listings/by-ids', async (req, res) => {
    const { ids } = req.body;
    if (!ids || ids.length === 0) return res.json([]);
    const [rows] = await pool.query('SELECT * FROM listings WHERE item_id IN (?)', [ids]);
    res.json(rows);
});

apiRouter.get('/games/:gameId/listings/ids', async (req, res) => {
    const { gameId } = req.params;
    const { view, filters } = req.query;
    const { where, params } = buildWhereClause(gameId, view, JSON.parse(filters));
    const [rows] = await pool.query(`SELECT item_id FROM listings ${where}`, params);
    res.json(rows.map(r => r.item_id));
});

apiRouter.get('/games/:gameId/listings/export', async (req, res) => {
    const { gameId } = req.params;
    const { view, sort, filters } = req.query;
    const { where, params } = buildWhereClause(gameId, view, JSON.parse(filters));
    const [rows] = await pool.query(`SELECT * FROM listings ${where} ORDER BY last_seen_at DESC`, params);
    res.json(rows);
});

apiRouter.get('/games/:gameId/listings/for-check', async (req, res) => {
    const { gameId } = req.params;
    const { cursor, limit } = req.query;
    const [rows] = await pool.query('SELECT item_id FROM listings WHERE game_id = ? AND is_archived = false AND item_id > ? ORDER BY item_id ASC LIMIT ?', [gameId, parseInt(cursor), parseInt(limit)]);
    res.json(rows);
});

apiRouter.get('/games/:gameId/dashboard/counts', async (req, res) => {
    const { gameId } = req.params;
    const [[{ active }]] = await pool.query('SELECT COUNT(*) as active FROM listings WHERE game_id = ? AND is_hidden = false AND is_archived = false', [gameId]);
    const [[{ hidden }]] = await pool.query('SELECT COUNT(*) as hidden FROM listings WHERE game_id = ? AND is_hidden = true AND is_archived = false', [gameId]);
    const [[{ archived }]] = await pool.query('SELECT COUNT(*) as archived FROM listings WHERE game_id = ? AND is_archived = true', [gameId]);
    res.json({ active, hidden, archived });
});

apiRouter.get('/games/:gameId/dashboard/logs', async (req, res) => {
    const { gameId } = req.params;
    const [fetchLogs] = await pool.query('SELECT * FROM fetch_logs WHERE game_id = ? ORDER BY created_at DESC LIMIT 20', [gameId]);
    const [checkLogs] = await pool.query('SELECT * FROM check_logs WHERE game_id = ? ORDER BY created_at DESC LIMIT 20', [gameId]);
    res.json({ fetchLogs, checkLogs });
});

apiRouter.post('/logs/fetch', async (req, res) => {
    const log = { id: uuidv4(), ...req.body };
    await pool.query('INSERT INTO fetch_logs SET ?', log);
    res.status(201).json(log);
});

apiRouter.post('/logs/check', async (req, res) => {
    const log = { id: uuidv4(), ...req.body };
    await pool.query('INSERT INTO check_logs SET ?', log);
    res.status(201).json(log);
});

apiRouter.patch('/logs/check/:logId', async (req, res) => {
    await pool.query('UPDATE check_logs SET ? WHERE id = ?', [req.body, req.params.logId]);
    res.json({ message: 'Log updated' });
});

// Mount the API router.
// By mounting at /api, we handle correctly configured Nginx (no trailing slash).
// By mounting at / as well, we create a fallback that handles misconfigured
// Nginx (with a trailing slash) where the /api prefix is stripped.
app.use('/api', apiRouter);
app.use(apiRouter);


// --- Server Start ---
initializeDatabase().then(() => {
    app.listen(port, () => {
        console.log(`Backend server running at http://localhost:${port}`);
    });
});