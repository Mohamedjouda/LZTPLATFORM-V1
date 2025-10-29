import { FilterState, Game } from '../types';

export const fetchListings = async (
  page: number = 1,
  game: Game,
  filters: Partial<FilterState>
): Promise<{ items: any[], hasNextPage: boolean, totalItems: number }> => {
  const token = process.env.LZT_API_TOKEN;
  if (!token) {
    throw new Error('LZT Market API token is not configured. Please set LZT_API_TOKEN in your environment variables.');
  }

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
    const token = process.env.LZT_API_TOKEN;
    if (!token) {
        throw new Error('LZT Market API token is not configured for checking item status.');
    }

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
