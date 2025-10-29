import { Listing, FetchLog, CheckLog, Game } from '../types';
import { gamePresets } from '../game-presets';

// The base URL for our self-hosted backend API
const API_BASE_URL = '/api'; // Using a relative path for the proxy

// --- Error Handling ---
const handleApiError = async (response: Response, context: string) => {
    const errorData = await response.json().catch(() => ({ error: 'Could not parse error response.' }));
    console.error(`API Error (${context}):`, { status: response.status, statusText: response.statusText, data: errorData });
    const message = errorData.error || `Request failed with status ${response.status}`;
    throw new Error(`API Error in ${context}: ${message}`);
};

// --- Games ---
export const getGames = async (): Promise<Game[]> => {
    try {
        const response = await fetch(`${API_BASE_URL}/games`);
        if (!response.ok) await handleApiError(response, 'getGames');
        return await response.json();
    } catch (error) {
        console.error("Critical error fetching games, falling back to presets.", error);
        // Fallback to presets if backend is down
        return Object.values(gamePresets).map((g, i) => ({ ...(g as Game), id: i + 1, created_at: new Date().toISOString() }));
    }
};

export const upsertGame = async (game: Partial<Game>): Promise<Game> => {
    const response = await fetch(`${API_BASE_URL}/games/upsert`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(game),
    });
    if (!response.ok) await handleApiError(response, 'upsertGame');
    return await response.json();
};

// This function is no longer needed with a self-hosted backend as we can manage the table directly.
export const initializeDefaultGames = async () => {
    console.log("initializeDefaultGames is handled by the backend if the table is empty. No frontend action needed.");
};

// --- Listings ---
export const getListings = async (game: Game, view: 'active' | 'hidden' | 'archived', filters: any, sortId: string, page: number, rowsPerPage: number): Promise<{ data: Listing[], count: number }> => {
    const response = await fetch(`${API_BASE_URL}/listings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ game, view, filters, sortId, page, rowsPerPage }),
    });
    if (!response.ok) await handleApiError(response, 'getListings');
    return await response.json();
};

export const upsertListings = async (listings: Partial<Listing>[]) => {
    if (listings.length === 0) return;
    const response = await fetch(`${API_BASE_URL}/listings/bulk-upsert`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(listings),
    });
    if (!response.ok) await handleApiError(response, 'upsertListings');
    return await response.json();
};

// The other listing functions (updateListings, getActiveListingsForCheck, etc.) would be added here.
// For brevity, we'll assume they follow the same fetch pattern.

// --- Settings ---
export const getSetting = async (key: string): Promise<string | null> => {
    try {
        const response = await fetch(`${API_BASE_URL}/settings/${key}`);
        if (response.status === 404) return null;
        if (!response.ok) await handleApiError(response, `getSetting(${key})`);
        const data = await response.json();
        return data.value;
    } catch (error) {
        console.error(`Failed to get setting '${key}':`, error);
        return null; // Return null on network errors etc.
    }
};

export const updateSetting = async (key: string, value: string): Promise<void> => {
    const response = await fetch(`${API_BASE_URL}/settings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key, value }),
    });
    if (!response.ok) await handleApiError(response, 'updateSetting');
};


// Other functions like addFetchLog, getDashboardCounts, exportToFile would be implemented similarly.
// These are omitted for brevity but would follow the same pattern of calling the new backend.
export const addFetchLog = async (log: FetchLog) => { /* POST /api/logs/fetch */ };
export const addCheckLog = async (log: CheckLog) => { /* POST /api/logs/check */ };
export const updateCheckLog = async (logId: string, updates: Partial<CheckLog>) => { /* PUT /api/logs/check/:id */ };
export const getDashboardCounts = async (gameId: number) => ({ active: 0, hidden: 0, archived: 0 }); // Placeholder
export const getLatestLogs = async (gameId: number): Promise<{ fetchLogs: FetchLog[], checkLogs: CheckLog[] }> => ({ fetchLogs: [], checkLogs: [] }); // Placeholder
export const updateListings = async (gameId: number, ids: number[], updates: Partial<Listing>) => { /* PUT /api/listings/bulk-update */ };
export const getActiveListingsForCheck = async (gameId: number, cursorId: number, limit: number): Promise<Listing[]> => []; // Placeholder
export const exportToFile = async (listings: Listing[], fileName: string): Promise<string> => { alert('Export not implemented in this version.'); return ''; }; // Placeholder
export const getAllListingIds = async (game: Game, view: 'active' | 'hidden' | 'archived', filters: any): Promise<number[]> => []; // Placeholder
export const getAllListingsForExport = async (game: Game, view: 'active' | 'hidden' | 'archived', filters: any, sortId: string): Promise<Listing[]> => []; // Placeholder
export const getListingsByIds = async (gameId: number, ids: number[]): Promise<Listing[]> => []; // Placeholder
export const deleteGame = async (gameId: number): Promise<void> => { /* DELETE /api/games/:id */ }; // Placeholder
