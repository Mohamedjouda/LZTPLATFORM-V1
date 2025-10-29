// U.G.L.P. Self-Hosted Backend
import express from 'express';
import mysql from 'mysql2/promise';
import cors from 'cors';

const app = express();
const port = 3001; // The port our backend will run on

app.use(cors());
app.use(express.json());

// --- DATABASE CONNECTION ---
// IMPORTANT: Replace these with your actual database credentials from aapanel
const dbConfig = {
  host: '127.0.0.1',
  user: 'YOUR_DB_USER',
  password: 'YOUR_DB_PASSWORD',
  database: 'YOUR_DB_NAME',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
};
let pool;
try {
  pool = mysql.createPool(dbConfig);
  console.log("Successfully connected to the database.");
} catch (error) {
  console.error("!!! FATAL DATABASE ERROR: Could not create connection pool.", error);
  console.error("!!! Please ensure the database credentials in server.js are correct and the database is running.");
  process.exit(1);
}


// --- API ENDPOINTS ---

// Helper for consistent error handling
const handleApiError = (res, error, context) => {
  console.error(`API Error in ${context}:`, error);
  res.status(500).json({ error: `Server error in ${context}`, details: error.message });
};

// GET Games
app.get('/api/games', async (req, res) => {
  try {
    const [rows] = await pool.execute('SELECT * FROM games ORDER BY name ASC');
    // MySQL stores JSON as strings, so we need to parse them.
    const games = rows.map(game => ({
        ...game,
        default_filters: JSON.parse(game.default_filters || '{}'),
        columns: JSON.parse(game.columns || '[]'),
        filters: JSON.parse(game.filters || '[]'),
        sorts: JSON.parse(game.sorts || '[]')
    }));
    res.json(games);
  } catch (error) {
    handleApiError(res, error, 'GET /api/games');
  }
});

// UPSERT Game
app.post('/api/games/upsert', async (req, res) => {
    const { id, ...gameData } = req.body;
    // Stringify JSON fields for MySQL
    const gameToSave = {
        ...gameData,
        default_filters: JSON.stringify(gameData.default_filters || {}),
        columns: JSON.stringify(gameData.columns || []),
        filters: JSON.stringify(gameData.filters || []),
        sorts: JSON.stringify(gameData.sorts || []),
    };

    try {
        if (id) {
            // Update
            const fields = Object.keys(gameToSave).map(key => `${key} = ?`).join(', ');
            const values = [...Object.values(gameToSave), id];
            await pool.execute(`UPDATE games SET ${fields} WHERE id = ?`, values);
            res.json({ id, ...gameData });
        } else {
            // Insert
            const [result] = await pool.execute(
                `INSERT INTO games (${Object.keys(gameToSave).join(', ')}) VALUES (${'?'.repeat(Object.keys(gameToSave).length).split('').join(',')})`,
                Object.values(gameToSave)
            );
            res.json({ id: result.insertId, ...gameData });
        }
    } catch(error) {
        handleApiError(res, error, 'POST /api/games/upsert');
    }
});


// GET Listings (with filtering, sorting, pagination)
app.post('/api/listings', async (req, res) => {
    const { game, view, filters, sortId, page, rowsPerPage } = req.body;
    
    let query = 'FROM listings WHERE game_id = ?';
    let params = [game.id];

    if (view === 'active') { query += ' AND is_hidden = 0 AND is_archived = 0'; }
    if (view === 'hidden') { query += ' AND is_hidden = 1 AND is_archived = 0'; }
    if (view === 'archived') { query += ' AND is_archived = 1'; }

    Object.entries(filters).forEach(([key, value]) => {
      if (!value) return;
      const filterConfig = game.filters.find(f => f.id === key || `${f.id}_min` === key || `${f.id}_max` === key);
      if (!filterConfig) return;

      const dbColumn = game.columns.find(c => c.id === filterConfig.id);
      const isCoreField = dbColumn?.type === 'core';
      const fieldName = isCoreField ? filterConfig.id : `JSON_UNQUOTE(JSON_EXTRACT(game_specific_data, '$.${filterConfig.id}'))`;
      
      if (filterConfig.type === 'number_range') {
          if (key.endsWith('_min')) { query += ` AND ${fieldName} >= ?`; params.push(value); }
          if (key.endsWith('_max')) { query += ` AND ${fieldName} <= ?`; params.push(value); }
      } else {
          query += ` AND ${fieldName} LIKE ?`; params.push(`%${value}%`);
      }
    });

    const sortOption = game.sorts.find(s => s.id === sortId) || game.sorts[0];
    const orderBy = sortOption ? `ORDER BY ${sortOption.column} ${sortOption.ascending ? 'ASC' : 'DESC'}` : '';
    
    const from = (page - 1) * rowsPerPage;
    const limit = `LIMIT ?, ?`;
    
    try {
        const countQuery = `SELECT count(*) as total ${query}`;
        const [countResult] = await pool.execute(countQuery, params);
        const totalCount = countResult[0].total;

        const dataQuery = `SELECT * ${query} ${orderBy} ${limit}`;
        const [dataRows] = await pool.execute(dataQuery, [...params, from, rowsPerPage]);

        const listings = dataRows.map(l => ({
            ...l,
            game_specific_data: JSON.parse(l.game_specific_data || '{}'),
            raw_response: JSON.parse(l.raw_response || '{}')
        }));

        res.json({ data: listings, count: totalCount });

    } catch(error) {
        handleApiError(res, error, 'POST /api/listings');
    }
});

// UPSERT Listings (Bulk)
app.post('/api/listings/bulk-upsert', async (req, res) => {
    const listings = req.body;
    if (!listings || listings.length === 0) {
        return res.status(200).json({ message: 'No listings to upsert.' });
    }
    
    try {
        const query = `
            INSERT INTO listings (item_id, game_id, url, title, price, currency, game_specific_data, deal_score, is_hidden, is_archived, last_seen_at, raw_response, first_seen_at) 
            VALUES ? 
            ON DUPLICATE KEY UPDATE 
            title=VALUES(title), price=VALUES(price), last_seen_at=VALUES(last_seen_at), raw_response=VALUES(raw_response), deal_score=VALUES(deal_score)
        `;
        const values = listings.map(l => [
            l.item_id, l.game_id, l.url, l.title, l.price, l.currency,
            JSON.stringify(l.game_specific_data || {}), l.deal_score, l.is_hidden, l.is_archived, l.last_seen_at,
            JSON.stringify(l.raw_response || {}), l.first_seen_at || new Date()
        ]);

        await pool.query(query, [values]);
        res.status(201).json({ message: 'Listings upserted successfully.'});
    } catch(error) {
        handleApiError(res, error, 'POST /api/listings/bulk-upsert');
    }
});

// Other endpoints (logs, settings, etc.) would be added here following the same pattern.
// For brevity, I'll add the essential ones for settings.

app.get('/api/settings/:key', async (req, res) => {
    try {
        const { key } = req.params;
        const [rows] = await pool.execute('SELECT value FROM settings WHERE `key` = ?', [key]);
        if (rows.length > 0) {
            res.json(rows[0]);
        } else {
            res.status(404).json({ value: null });
        }
    } catch(error) {
        handleApiError(res, error, 'GET /api/settings/:key');
    }
});

app.post('/api/settings', async (req, res) => {
    try {
        const { key, value } = req.body;
        const query = `
            INSERT INTO settings (\`key\`, value, updated_at) VALUES (?, ?, NOW())
            ON DUPLICATE KEY UPDATE value = VALUES(value), updated_at = NOW()
        `;
        await pool.execute(query, [key, value]);
        res.status(200).json({ message: 'Setting saved.'});
    } catch(error) {
        handleApiError(res, error, 'POST /api/settings');
    }
});


app.listen(port, () => {
  console.log(`U.G.L.P. backend server listening on port ${port}`);
});
