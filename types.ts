export interface GameColumn {
  id: string; // e.g., 'price', 'level', 'wins'
  label: string; // e.g., 'Price', 'Level', 'Wins'
  type: 'core' | 'game_specific';
  is_numeric?: boolean;
  min_width?: string;
}

export interface GameFilter {
    id: string;
    label: string;
    type: 'text' | 'number_range' | 'select';
    options?: string[]; // For select type
    is_advanced: boolean;
    param_name_min?: string; // e.g., pmin
    param_name_max?: string; // e.g., pmax
    param_name?: string; // e.g., title
    placeholder?: string;
}

export interface GameSort {
  id: string; // e.g., 'newest'
  label: string; // e.g., 'Newest First'
  column: string; // e.g., 'first_seen_at'
  ascending: boolean;
}

export interface Game {
  id?: number;
  created_at?: string;
  name: string;
  slug: string;
  category: string;
  description: string;
  api_base_url: string; // Now part of game config if it can vary
  list_path: string;
  check_path_template: string;
  default_filters: Record<string, string>;
  columns: GameColumn[];
  filters: GameFilter[];
  sorts: GameSort[];
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
  raw_response: any;
}

export interface FetchLog {
  id?: string;
  created_at?: string;
  game_id: number;
  page: number;
  items_fetched: number;
  status: 'success' | 'error';
  error_message: string | null;
  duration_ms: number;
}

export interface CheckLog {
  id?: string;
  created_at?: string;
  game_id: number;
  items_checked: number;
  items_archived: number;
  status: 'success' | 'error' | 'in_progress';
  error_message: string | null;
  duration_ms: number;
}

export interface GlobalSettings {
  lztApiToken: string;
  supabaseUrl: string;
  supabaseAnonKey: string;
}

export type FilterState = Record<string, string>;