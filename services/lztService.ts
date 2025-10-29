import { FilterState, Game } from '../types';
import { getSetting } from './apiService';

let lztApiToken: string | null = null;
let isFetchingToken = false;
let fetchTokenPromise: Promise<string> | null = null;

/**
 * Clears the in-memory LZT API token cache.
 * This should be called after the token is updated in the database to force a refetch.
 */
export const clearLztTokenCache = () => {
    lztApiToken = null;
    isFetchingToken = false;
    fetchTokenPromise = null;
};

// This function gets the token, caching it in memory to avoid DB calls on every request.
const getLztToken = async (): Promise<string> => {
  if (lztApiToken) {
    return lztApiToken;
  }

  // If a fetch is already in progress, wait for it to complete.
  if (isFetchingToken && fetchTokenPromise) {
    return fetchTokenPromise;
  }

  isFetchingToken = true;
  fetchTokenPromise = (async () => {
    try {
      const tokenFromDb = await getSetting('lzt_api_token');
      if (!tokenFromDb) {
        throw new Error('LZT Market API token is not configured. Please set it on the Settings page.');
      }
      lztApiToken = tokenFromDb;
      return lztApiToken;
    } finally {
      isFetchingToken = false;
      fetchTokenPromise = null;
    }
  })();
  
  return fetchTokenPromise;
};

/**
 * Tests a given LZT API token by making a lightweight, authenticated API call.
 * @param token The API token to test.
 * @returns An object indicating success or failure with an error message.
 */
export const testApiToken = async (token: string): Promise<{ success: boolean; error?: string }> => {
    if (!token) {
        return { success: false, error: 'Token cannot be empty.' };
    }
    try {
        // Use a simple, authenticated endpoint that is lightweight.
        // Fetching the root with a page limit of 1 is a good test.
        const response = await fetch(`https://prod-api.lzt.market/?page=1`, {
            headers: {
                'Authorization': `Bearer ${token}`,
            },
        });

        if (response.ok) { // Status 200-299
            return { success: true };
        }

        if (response.status === 401) {
            return { success: false, error: 'Invalid API Token. The server responded with 401 Unauthorized.' };
        }
        
        let errorDetails = `The server responded with status ${response.status} ${response.statusText}.`;
        try {
            const errorData = await response.json();
            errorDetails += ` Details: ${JSON.stringify(errorData)}`;
        } catch (e) {
            // Ignore if response body is not JSON
        }
        return { success: false, error: errorDetails };

    } catch (error) {
        if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
            return { success: false, error: 'A network error occurred. This could be due to a CORS issue, an ad-blocker, or a network problem.' };
        }
        return { success: false, error: `An unexpected error occurred: ${(error as Error).message}` };
    }
};


export const fetchListings = async (
  page: number = 1,
  game: Game,
  filters: Partial<FilterState>
): Promise<{ items: any[], hasNextPage: boolean, totalItems: number }> => {
  const token = await getLztToken();

  const params = new URLSearchParams({
    page: page.toString(),
    ...game.default_filters,
  });
  
  // Apply dynamic filters based on game config
  Object.entries(filters).forEach(([key, value]) => {
      if (value) {
          const baseKey = key.replace(/_min$|_max$/, '');
          const filterConfig = game.filters.find(f => f.id === baseKey);
          
          if (filterConfig) {
             if (filterConfig.type === 'number_range') {
                 if (key.endsWith('_min') && filterConfig.param_name_min) {
                     params.append(filterConfig.param_name_min, value.toString());
                 }
                 if (key.endsWith('_max') && filterConfig.param_name_max) {
                     params.append(filterConfig.param_name_max, value.toString());
                 }
             } else if (filterConfig.param_name) {
                if (filterConfig.param_name.endsWith('[]')) {
                    // For array parameters, split comma-separated values from a text input
                    value.toString().split(',').forEach(part => {
                        if (part.trim()) {
                            params.append(filterConfig.param_name, part.trim());
                        }
                    });
                } else {
                    params.append(filterConfig.param_name, value.toString());
                }
             }
          }
      }
  });


  try {
    const response = await fetch(`${game.api_base_url}${game.list_path}?${params.toString()}`, {
        headers: {
        'Authorization': `Bearer ${token}`,
        },
    });

    if (!response.ok) {
        let errorDetails = `Status: ${response.status} ${response.statusText}`;
        try { const errorData = await response.json(); errorDetails += ` - ${JSON.stringify(errorData)}`; } catch (e) { /* ignore */ }
        throw new Error(`API request failed. ${errorDetails}`);
    }

    const data = await response.json();

    return {
        items: data.items || [],
        hasNextPage: data.hasNextPage || false,
        totalItems: data.totalItems || 0,
    };
  } catch (error) {
      if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
          throw new Error('Network error: Failed to fetch from API. This might be due to a CORS issue, an ad-blocker, or a network problem.');
      }
      throw error;
  }
};


export const checkItemStatus = async (apiBaseUrl: string, checkPathTemplate: string, itemId: number): Promise<{isActive: boolean, reason: string}> => {
    const token = await getLztToken();
    
    const checkPath = checkPathTemplate.replace('{id}', itemId.toString());

    try {
        const response = await fetch(`${apiBaseUrl}${checkPath}`, {
            headers: { 'Authorization': `Bearer ${token}` },
        });

        if (response.status === 200) {
            const data = await response.json();
            // These checks might need to be generalized in the game config in the future
            if (data.item?.item_state === 'paid') return { isActive: false, reason: 'Item has been sold.' };
            if (data.item?.item_state === 'deleted' || data.item?.item_state === 'closed') return { isActive: false, reason: `Item state is '${data.item.item_state}'.` };
            return { isActive: true, reason: 'Item is active.' };
        } 
        if (response.status === 404) {
            return { isActive: false, reason: 'Item not found (404).' };
        } 
        
        let errorDetails = `Unexpected status: ${response.status}`;
        try { const errorData = await response.json(); errorDetails += ` - ${JSON.stringify(errorData)}`; } catch(e) { /* Ignore */ }
        console.warn(`Unexpected status code ${response.status} for item ${itemId}:`, errorDetails);
        return { isActive: true, reason: errorDetails }; // Assume active on unknown errors
    } catch (error) {
        if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
            console.error(`Network error checking item ${itemId}. Assuming active.`);
            return { isActive: true, reason: 'Network error during check.' };
        }
        console.error(`Unknown error checking item ${itemId}:`, error);
        return { isActive: true, reason: 'Unknown error during check.' };
    }
}
