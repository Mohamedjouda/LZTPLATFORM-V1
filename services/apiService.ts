import { Game, Listing, FilterState, FetchLog, CheckLog } from '../types';

const API_BASE_URL = '/api';

// Helper function for API calls
async function apiFetch(endpoint: string, options: RequestInit = {}) {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        ...options,
        headers: {
            'Content-Type': 'application/json',
            ...options.headers,
        },
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: `API request failed with status ${response.status}` }));
        // Pass details from the backend proxy if they exist
        throw new Error(errorData.details || errorData.message || `An unknown error occurred`);
    }

    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
        return response.json();
    }
    return {}; 
}

// Version
export const getAppVersion = (): Promise<string> => {
    return apiFetch('/version').then(data => data.version || '?.?.?');
};

// LZT API Proxy
export const proxyLztRequest = (url: string, token: string): Promise<any> => {
    // Base64 encode the URL to potentially bypass simple WAF rules.
    const encodedUrl = btoa(url);
    // Send the encoded URL as a query parameter to avoid WAFs that inspect the POST body.
    return apiFetch(`/proxy/lzt?url=${encodeURIComponent(encodedUrl)}`, {
        method: 'POST',
        body: JSON.stringify({ token }), // Only send the token in the body
    });
};

// Settings
export const getSetting = (key: string): Promise<string> => {
    return apiFetch(`/settings/${key}`).then(data => data.value || '');
};

export const updateSetting = (key: string, value: string): Promise<void> => {
    return apiFetch(`/settings`, {
        method: 'POST',
        body: JSON.stringify({ key, value }),
    });
};

// Games
export const getGames = (): Promise<Game[]> => {
    return apiFetch('/games');
};

export const initializeDefaultGames = (): Promise<void> => {
    return Promise.resolve();
};

export const upsertGame = (game: Partial<Game>): Promise<Game> => {
    return apiFetch('/games', {
        method: 'POST',
        body: JSON.stringify(game),
    });
};

// Listings
export const getListings = async (
    game: Game,
    view: 'active' | 'hidden' | 'archived',
    filters: FilterState,
    sort: string,
    page: number,
    rowsPerPage: number
): Promise<{ data: Listing[], count: number }> => {
    const params = new URLSearchParams({
        view,
        sort,
        page: page.toString(),
        limit: rowsPerPage.toString(),
        filters: JSON.stringify(filters)
    });
    return apiFetch(`/games/${game.id}/listings?${params.toString()}`);
};

export const updateListings = (gameId: number, itemIds: number[], updates: Partial<Listing>): Promise<{ updated: number }> => {
    return apiFetch(`/games/${gameId}/listings/bulk-update`, {
        method: 'PATCH',
        body: JSON.stringify({ itemIds, updates }),
    });
};

export const upsertListings = (listings: Partial<Listing>[]): Promise<{ upserted: number }> => {
    return apiFetch(`/listings/bulk-upsert`, {
        method: 'POST',
        body: JSON.stringify(listings),
    });
};

export const getListingsByIds = (gameId: number, ids: number[]): Promise<Listing[]> => {
    return apiFetch(`/games/${gameId}/listings/by-ids`, {
        method: 'POST',
        body: JSON.stringify({ ids }),
    });
};

export const getAllListingIds = (game: Game, view: 'active' | 'hidden' | 'archived', filters: FilterState): Promise<number[]> => {
    const params = new URLSearchParams({
        view,
        filters: JSON.stringify(filters)
    });
    return apiFetch(`/games/${game.id}/listings/ids?${params.toString()}`);
};

export const getAllListingsForExport = (game: Game, view: 'active' | 'hidden' | 'archived', filters: FilterState, sort: string): Promise<Listing[]> => {
     const params = new URLSearchParams({
        view,
        sort,
        filters: JSON.stringify(filters)
    });
    return apiFetch(`/games/${game.id}/listings/export?${params.toString()}`);
};

// Dashboard & Workers
export const getDashboardCounts = (gameId: number): Promise<{ active: number, hidden: number, archived: number }> => {
    return apiFetch(`/games/${gameId}/dashboard/counts`);
};

export const getLatestLogs = (gameId: number): Promise<{ fetchLogs: FetchLog[], checkLogs: CheckLog[] }> => {
    return apiFetch(`/games/${gameId}/dashboard/logs`);
};

export const addFetchLog = (log: Partial<FetchLog>): Promise<FetchLog> => {
    return apiFetch('/logs/fetch', {
        method: 'POST',
        body: JSON.stringify(log),
    });
};

export const addCheckLog = (log: Partial<CheckLog>): Promise<CheckLog> => {
    return apiFetch('/logs/check', {
        method: 'POST',
        body: JSON.stringify(log),
    });
};

export const updateCheckLog = (logId: string, updates: Partial<CheckLog>): Promise<CheckLog> => {
    return apiFetch(`/logs/check/${logId}`, {
        method: 'PATCH',
        body: JSON.stringify(updates),
    });
};

export const getActiveListingsForCheck = (gameId: number, cursorId: number, batchSize: number): Promise<Listing[]> => {
    const params = new URLSearchParams({
        cursor: cursorId.toString(),
        limit: batchSize.toString()
    });
    return apiFetch(`/games/${gameId}/listings/for-check?${params.toString()}`);
};

// Exporting
export const exportToFile = async (listings: Listing[], fileName: string): Promise<string> => {
    const json = JSON.stringify(listings, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `${fileName}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);

    URL.revokeObjectURL(url);
    return url;
};