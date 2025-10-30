export interface GameColumn {
    id: string;
    label: string;
    type: 'core' | 'game_specific';
    is_numeric?: boolean;
    min_width?: string;
}

export interface GameFilter {
    id: string;
    label:string;
    type: 'text' | 'number_range' | 'select';
    is_advanced: boolean;
    param_name?: string;
    param_name_min?: string;
    param_name_max?: string;
    placeholder?: string;
    options?: string[];
}

export interface GameSort {
    id: string;
    label: string;
    column: string;
    ascending: boolean;
}

export interface Game {
    id?: number;
    created_at: string;
    name: string;
    slug: string;
    category: string;
    description: string;
    api_base_url: string;
    list_path: string;
    check_path_template: string;
    default_filters: Record<string, string>;
    columns: GameColumn[];
    filters: GameFilter[];
    sorts: GameSort[];
    fetch_worker_enabled: boolean;
    check_worker_enabled: boolean;
    fetch_interval_minutes?: number;
    fetch_page_limit?: number;
}

export interface Listing {
    item_id: number;
    game_id: number;
    url: string;
    title: string;
    price: number;
    currency: string;
    game_specific_data: Record<string, any>;
    deal_score: number | null;
    is_hidden: boolean;
    is_archived: boolean;
    archived_reason: string | null;
    first_seen_at: string;
    last_seen_at: string;
    archived_at: string | null;
    raw_response: Record<string, any>;
}

export type FilterState = Record<string, string | number>;

export interface FetchLog {
    id?: string;
    created_at: string;
    game_id: number;
    page: number;
    items_fetched: number;
    status: 'success' | 'error' | 'in_progress';
    error_message: string | null;
    duration_ms: number;
}

export interface CheckLog {
    id?: string;
    created_at: string;
    game_id: number;
    items_checked: number;
    items_archived: number;
    status: 'success' | 'error' | 'in_progress';
    error_message: string | null;
    duration_ms: number;
}

export interface Notification {
    id: string;
    type: 'success' | 'error' | 'info';
    message: string;
    code?: string;
    timestamp: string;
    read: boolean;
}

// Global declaration for process.env, which is injected by Vite during build.
// This allows using process.env.API_KEY in the client-side code.
// FIX: The previous `declare var process` was incomplete and conflicted with the Node.js `process` type.
// This is replaced with a global augmentation of `NodeJS.ProcessEnv` which is safer and correctly
// adds the API_KEY type without breaking other `process` properties like `cwd()`.
declare global {
  namespace NodeJS {
    interface ProcessEnv {
      API_KEY?: string;
    }
  }
}
