import { FilterState, Game } from '../types';
import { getSetting, proxyLztRequest } from './apiService';

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
 * Tests a given LZT API token by proxying the request through the backend.
 * @param token The API token to test.
 * @returns An object indicating success or failure with an error message.
 */
export const testApiToken = async (token: string): Promise<{ success: boolean; error?: string }> => {
    if (!token) {
        return { success: false, error: 'Token cannot be empty.' };
    }
    try {
        // Use a known-good endpoint from the LZT API documentation for a reliable check.
        // Using a static item ID is sufficient to validate the token and endpoint.
        const url = `https://prod-api.lzt.market/item/194483127/check-account`;
        // Use the proxy to avoid CORS issues in the browser
        const result = await proxyLztRequest(url, token);
        // The LZT API can return a 200 OK but with an error message in the body
        if (result && result.errors) {
            return { success: false, error: result.errors.join(', ') };
        }
        return { success: true };
    } catch (error: any) {
        // The error message is now more reliably passed from the backend proxy
        const errorMessage = error.message || 'A network error occurred. Check browser console for details.';
        return { success: false, error: errorMessage };
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
    const url = `${game.api_base_url}${game.list_path}?${params.toString()}`;
    const data = await proxyLztRequest(url, token);

    return {
        items: data.items || [],
        hasNextPage: data.hasNextPage || false,
        totalItems: data.totalItems || 0,
    };
  } catch (error: any) {
      throw new Error(`API request failed via proxy: ${error.message}`);
  }
};


export const checkItemStatus = async (apiBaseUrl: string, checkPathTemplate: string, itemId: number): Promise<{isActive: boolean, reason: string}> => {
    const token = await getLztToken();
    
    const checkPath = checkPathTemplate.replace('{id}', itemId.toString());
    const url = `${apiBaseUrl}${checkPath}`;

    try {
        const data = await proxyLztRequest(url, token);
        
        // These checks might need to be generalized in the game config in the future
        if (data.item?.item_state === 'paid') return { isActive: false, reason: 'Item has been sold.' };
        if (data.item?.item_state === 'deleted' || data.item?.item_state === 'closed') return { isActive: false, reason: `Item state is '${data.item.item_state}'.` };
        return { isActive: true, reason: 'Item is active.' };
    } catch (error: any) {
        // The error message from apiFetch will contain the status text or body message
        if (error.message.includes('Not Found') || error.message.includes('404')) {
            return { isActive: false, reason: 'Item not found (404).' };
        }
        console.warn(`Unexpected error checking item ${itemId} via proxy:`, error.message);
        // On unknown errors, assume active to prevent incorrectly archiving items.
        return { isActive: true, reason: `Proxy check failed: ${error.message}` };
    }
}