import { createClient, SupabaseClient, PostgrestError } from '@supabase/supabase-js';
import { Listing, FetchLog, CheckLog, FilterState, GameSort, Game } from '../types';
import { gamePresets } from '../game-presets';

let supabase: SupabaseClient | null = null;

const handleSupabaseError = (error: PostgrestError, context: string) => {
    console.error(`Supabase error (${context}):`, { message: error.message, details: error.details, hint: error.hint, code: error.code });
    const message = error.message || 'An unknown Supabase error occurred';

    if (message.toLowerCase().includes('failed to fetch')) {
        throw new Error(`Network Error (${context}): Failed to connect to Supabase. Please verify your Supabase URL and that your browser can access it (CORS).`);
    }
    
    throw new Error(`Supabase error in ${context}: ${message}`);
};

const handleFetchError = (error: any, context: string): never => {
    if (error.message && (error.message.startsWith('Supabase error') || error.message.startsWith('Network Error'))) {
        throw error;
    }

    const errorMessage = String(error?.message || 'Unknown error').toLowerCase();
    
    if (errorMessage.includes('failed to fetch') || errorMessage.includes('network request failed')) {
        throw new Error(`Network Error (${context}): Failed to connect to Supabase. Please verify your Supabase URL and your network connection.`);
    }
    
    throw new Error(`An unexpected error occurred in ${context}: ${error.message || 'Unknown error'}`);
};


export const initSupabase = () => {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error("Supabase URL or Anon Key is not configured. Please set SUPABASE_URL and SUPABASE_ANON_KEY in your environment variables.");
  }
  
  supabase = createClient(supabaseUrl, supabaseAnonKey);
  return supabase;
};

export const initializeDefaultGames = async () => {
    if (!supabase) throw new Error("Supabase not initialized for seeding.");
    try {
        // First, check if the table exists at all by doing a head request.
        const { error: headError } = await supabase.from('games').select('id', { count: 'exact', head: true });
        
        if (headError) {
             // '42P01': undefined_table. This is the error we expect if the schema isn't set up.
            if (headError.code === '42P01') {
                throw new Error("The 'games' table does not exist. Please run the SQL script in the Setup Guide.");
            }
            // For other unexpected errors during the check.
            handleSupabaseError(headError, 'initializeDefaultGames(check)');
        }

        const { count, error: countError } = await supabase.from('games').select('id', { count: 'exact', head: true });

        if (countError) {
            handleSupabaseError(countError, 'initializeDefaultGames(count)');
        }
        
        if (count !== null && count > 0) {
            console.log("Games table already populated. Skipping default setup.");
            return;
        }

        console.log("Games table is empty. Initializing with default presets...");
        const presetsToInsert = Object.values(gamePresets);
        const { error: insertError } = await supabase.from('games').insert(presetsToInsert);
        
        if (insertError) {
             handleSupabaseError(insertError, 'initializeDefaultGames(insert)');
        }

        console.log(`${presetsToInsert.length} games have been successfully inserted.`);

    } catch (error) {
        handleFetchError(error, 'initializeDefaultGames');
    }
};

// GAME CONFIG
export const getGames = async (): Promise<Game[]> => {
    if (!supabase) throw new Error("Supabase not initialized");
    try {
        const { data, error } = await supabase.from('games').select('*').order('name', { ascending: true });
        if (error) handleSupabaseError(error, 'getGames');
        return data || [];
    } catch (error) {
        handleFetchError(error, 'getGames');
    }
};

export const upsertGame = async (game: Partial<Game>): Promise<Game> => {
    if (!supabase) throw new Error("Supabase not initialized");
    try {
        const { data, error } = await supabase.from('games').upsert(game).select().single();
        if (error) handleSupabaseError(error, 'upsertGame');
        return data;
    } catch (error) {
        handleFetchError(error, 'upsertGame');
    }
}

export const deleteGame = async (gameId: number): Promise<void> => {
    if (!supabase) throw new Error("Supabase not initialized");
    try {
        const tables = ['listings', 'fetch_logs', 'check_logs'];
        for (const table of tables) {
            const { error: deleteError } = await supabase.from(table).delete().eq('game_id', gameId);
            if (deleteError) handleSupabaseError(deleteError, `deleteGame(${table})`);
        }
        
        const { error: gameDeleteError } = await supabase.from('games').delete().eq('id', gameId);
        if (gameDeleteError) handleSupabaseError(gameDeleteError, 'deleteGame(games)');
    } catch (error) {
        handleFetchError(error, 'deleteGame');
    }
}


// LISTINGS
export const upsertListings = async (listings: Partial<Listing>[]) => {
  if (!supabase) throw new Error("Supabase not initialized");
  if (listings.length === 0) return;
  try {
    const { data, error } = await supabase.from('listings').upsert(listings, { onConflict: 'item_id, game_id' });
    if (error) handleSupabaseError(error, 'upsertListings');
    return data;
  } catch (error) {
    handleFetchError(error, 'upsertListings');
  }
};

export const getListings = async (game: Game, view: 'active' | 'hidden' | 'archived', filters: FilterState, sortId: string, page: number, rowsPerPage: number): Promise<{ data: Listing[], count: number }> => {
  if (!supabase) return { data: [], count: 0 };
  
  let query = supabase.from('listings').select('*', { count: 'exact' }).eq('game_id', game.id!);

  if (view === 'active') query = query.eq('is_hidden', false).eq('is_archived', false);
  if (view === 'hidden') query = query.eq('is_hidden', true).eq('is_archived', false);
  if (view === 'archived') query = query.eq('is_archived', true);

  Object.entries(filters).forEach(([key, value]) => {
      if (!value) return;
      const filterConfig = game.filters.find(f => f.id === key || `${f.id}_min` === key || `${f.id}_max` === key);
      if (!filterConfig) return;

      const dbColumn = game.columns.find(c => c.id === filterConfig.id);
      const isCoreField = dbColumn?.type === 'core';
      const fieldName = isCoreField ? filterConfig.id : `game_specific_data->>${filterConfig.id}`;
      
      if (filterConfig.type === 'number_range') {
          if (key.endsWith('_min')) query = query.gte(fieldName, value);
          if (key.endsWith('_max')) query = query.lte(fieldName, value);
      } else {
          query = query.ilike(fieldName, `%${value}%`);
      }
  });

  const sortOption = game.sorts.find(s => s.id === sortId) || game.sorts[0];
  if(sortOption) {
      query = query.order(sortOption.column, { ascending: sortOption.ascending, nullsFirst: false });
  }

  const from = (page - 1) * rowsPerPage;
  const to = from + rowsPerPage - 1;
  query = query.range(from, to);

  try {
      const { data, error, count } = await query;
      if (error) handleSupabaseError(error, 'getListings');
      return { data: data || [], count: count || 0 };
  } catch (error) {
      handleFetchError(error, 'getListings');
      return { data: [], count: 0 }; 
  }
};

export const getListingsByIds = async (gameId: number, ids: number[]): Promise<Listing[]> => {
    if (!supabase) throw new Error("Supabase not initialized");
    if (ids.length === 0) return [];
    try {
        const { data, error } = await supabase.from('listings').select('*').eq('game_id', gameId).in('item_id', ids);
        if (error) handleSupabaseError(error, 'getListingsByIds');
        return data || [];
    } catch(error) {
        handleFetchError(error, 'getListingsByIds');
        return [];
    }
};

export const updateListings = async (gameId: number, ids: number[], updates: Partial<Listing>) => {
    if (!supabase) throw new Error("Supabase not initialized");
    try {
        const { data, error } = await supabase.from('listings').update(updates).eq('game_id', gameId).in('item_id', ids);
        if (error) handleSupabaseError(error, 'updateListings');
        return data;
    } catch(error) {
        handleFetchError(error, 'updateListings');
    }
}

export const getActiveListingsForCheck = async (gameId: number, cursorId: number, limit: number): Promise<Listing[]> => {
    if (!supabase) throw new Error("Supabase not initialized");
    try {
        const { data, error } = await supabase.from('listings').select('*').eq('game_id', gameId).eq('is_archived', false).gt('item_id', cursorId).order('item_id', { ascending: true }).limit(limit);
        if (error) handleSupabaseError(error, 'getActiveListingsForCheck');
        return data || [];
    } catch (error) {
        handleFetchError(error, 'getActiveListingsForCheck');
        return [];
    }
}

export const getDashboardCounts = async (gameId: number) => {
    if (!supabase) throw new Error("Supabase not initialized");
    try {
        const { count: active, error: activeError } = await supabase.from('listings').select('*', { count: 'exact', head: true }).eq('game_id', gameId).eq('is_hidden', false).eq('is_archived', false);
        if (activeError) handleSupabaseError(activeError, 'getDashboardCounts (active)');
        
        const { count: hidden, error: hiddenError } = await supabase.from('listings').select('*', { count: 'exact', head: true }).eq('game_id', gameId).eq('is_hidden', true).eq('is_archived', false);
        if (hiddenError) handleSupabaseError(hiddenError, 'getDashboardCounts (hidden)');

        const { count: archived, error: archivedError } = await supabase.from('listings').select('*', { count: 'exact', head: true }).eq('game_id', gameId).eq('is_archived', true);
        if (archivedError) handleSupabaseError(archivedError, 'getDashboardCounts (archived)');

        return { active: active || 0, hidden: hidden || 0, archived: archived || 0 };
    } catch (error) {
        handleFetchError(error, 'getDashboardCounts');
        return { active: 0, hidden: 0, archived: 0 };
    }
}

// LOGS
export const addFetchLog = async (log: FetchLog) => {
  if (!supabase) throw new Error("Supabase not initialized");
  if (log.items_fetched === 0) return; // Don't log empty fetches
  try {
    const { data, error } = await supabase.from('fetch_logs').insert(log);
    if (error) handleSupabaseError(error, 'addFetchLog');
    return data;
  } catch (error) { handleFetchError(error, 'addFetchLog'); }
};

export const addCheckLog = async (log: CheckLog) => {
    if (!supabase) throw new Error("Supabase not initialized");
    try {
        const { data, error } = await supabase.from('check_logs').insert(log).select().single();
        if (error) handleSupabaseError(error, 'addCheckLog');
        return data;
    } catch (error) { handleFetchError(error, 'addCheckLog'); }
};

export const updateCheckLog = async (logId: string, updates: Partial<CheckLog>) => {
  if (!supabase) throw new Error("Supabase not initialized");
  try {
    const { data, error } = await supabase.from('check_logs').update(updates).eq('id', logId);
    if (error) handleSupabaseError(error, 'updateCheckLog');
    return data;
  } catch(error) { handleFetchError(error, 'updateCheckLog'); }
}

export const getLatestLogs = async (gameId: number): Promise<{ fetchLogs: FetchLog[], checkLogs: CheckLog[] }> => {
    if (!supabase) return { fetchLogs: [], checkLogs: [] };
    try {
        const [fetchLogsRes, checkLogsRes] = await Promise.all([
            supabase.from('fetch_logs').select('*').eq('game_id', gameId).order('created_at', { ascending: false }).limit(50),
            supabase.from('check_logs').select('*').eq('game_id', gameId).order('created_at', { ascending: false }).limit(50)
        ]);
        if (fetchLogsRes.error) handleSupabaseError(fetchLogsRes.error, 'getLatestLogs(fetch)');
        if (checkLogsRes.error) handleSupabaseError(checkLogsRes.error, 'getLatestLogs(check)');
        return { fetchLogs: fetchLogsRes.data || [], checkLogs: checkLogsRes.data || [] };
    } catch(error) {
        handleFetchError(error, 'getLatestLogs');
        return { fetchLogs: [], checkLogs: [] };
    }
}

// EXPORT
export const exportToFile = async (listings: Listing[], fileName: string): Promise<string> => {
    if (!supabase) throw new Error("Supabase not initialized");
    if (listings.length === 0) throw new Error("No listings to export.");

    const headers = Object.keys(listings[0]).join(',');
    const rows = listings.map(listing =>
        Object.values(listing).map(value => {
            let strValue = JSON.stringify(value);
            if (strValue.includes(',')) strValue = `"${strValue.replace(/"/g, '""')}"`;
            return strValue;
        }).join(',')
    );
    const csvContent = [headers, ...rows].join('\n');
    const file = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const filePath = `public/${fileName}.csv`;

    try {
        const { error } = await supabase.storage.from('exports').upload(filePath, file, { upsert: true });
        if (error) handleSupabaseError(error as any, 'exportToFile(upload)');
        const { data } = supabase.storage.from('exports').getPublicUrl(filePath);
        return data.publicUrl;
    } catch(error) {
        handleFetchError(error, 'exportToFile');
        return '';
    }
};
