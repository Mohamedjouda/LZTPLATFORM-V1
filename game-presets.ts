import { Game } from './types';

// This file contains presets for all game categories found in the LZT Market API specification.

export const allAccountsPreset: Omit<Game, 'id' | 'created_at'> = {
  name: 'All Accounts',
  slug: '',
  category: 'All',
  description: 'Browse listings from all game categories simultaneously.',
  api_base_url: 'https://prod-api.lzt.market',
  list_path: '/',
  check_path_template: '/item/{id}/check-account',
  default_filters: { currency: 'usd' },
  fetch_worker_enabled: true,
  check_worker_enabled: true,
  columns: [
    { id: 'item_id', label: 'Item ID', type: 'core', is_numeric: true },
    { id: 'title', label: 'Title', type: 'core', min_width: '20rem' },
    { id: 'url', label: 'URL', type: 'core' },
    { id: 'price', label: 'Price', type: 'core', is_numeric: true },
    { id: 'item_origin', label: 'Origin', type: 'game_specific' },
    { id: 'first_seen_at', label: 'First Seen', type: 'core' },
    { id: 'last_seen_at', label: 'Last Seen', type: 'core' },
  ],
  filters: [
    { id: 'title', label: 'Search', type: 'text', is_advanced: false, param_name: 'title' },
    { id: 'price', label: 'Price', type: 'number_range', is_advanced: false, param_name_min: 'pmin', param_name_max: 'pmax' },
  ],
  sorts: [
    { id: 'pdate_to_down', label: 'Newest First', column: 'last_seen_at', ascending: false },
    { id: 'price_to_up', label: 'Price: Low to High', column: 'price', ascending: true },
    { id: 'price_to_down', label: 'Price: High to Low', column: 'price', ascending: false }
  ],
};

export const steamPreset: Omit<Game, 'id' | 'created_at'> = {
  name: 'Steam',
  slug: 'steam',
  category: 'PC Gaming Platform',
  description: 'General Steam accounts with various games, levels, and items.',
  api_base_url: 'https://prod-api.lzt.market',
  list_path: '/steam',
  check_path_template: '/item/{id}/check-account',
  default_filters: { currency: 'usd' },
  fetch_worker_enabled: true,
  check_worker_enabled: true,
  columns: [
    { id: 'item_id', label: 'Item ID', type: 'core', is_numeric: true },
    { id: 'title', label: 'Title', type: 'core', min_width: '20rem' },
    { id: 'url', label: 'URL', type: 'core' },
    { id: 'price', label: 'Price', type: 'core', is_numeric: true },
    { id: 'deal_score', label: 'Deal Score', type: 'core', is_numeric: true },
    { id: 'steam_level', label: 'Level', type: 'game_specific', is_numeric: true },
    { id: 'steam_game_count', label: 'Games', type: 'game_specific', is_numeric: true },
    { id: 'steam_balance', label: 'Balance', type: 'game_specific' },
    { id: 'steam_cs2_rank_id', label: 'CS2 Rank', type: 'game_specific' },
    { id: 'steam_cs2_win_count', label: 'CS2 Wins', type: 'game_specific', is_numeric: true },
    { id: 'steam_dota2_solo_mmr', label: 'Dota2 MMR', type: 'game_specific', is_numeric: true },
  ],
  filters: [
    { id: 'title', label: 'Search', type: 'text', is_advanced: false, param_name: 'title' },
    { id: 'price', label: 'Price', type: 'number_range', is_advanced: false, param_name_min: 'pmin', param_name_max: 'pmax' },
    { id: 'lmin', label: 'Level', type: 'number_range', is_advanced: false, param_name_min: 'lmin', param_name_max: 'lmax' },
    { id: 'gmin', label: 'Games', type: 'number_range', is_advanced: true, param_name_min: 'gmin', param_name_max: 'gmax' },
    { id: 'balance_min', label: 'Balance', type: 'number_range', is_advanced: true, param_name_min: 'balance_min', param_name_max: 'balance_max' },
    { id: 'game_int', label: 'Has Game (ID)', type: 'text', is_advanced: true, param_name: 'game[]', placeholder: "e.g., 730" }
  ],
  sorts: [
    { id: 'pdate_to_down', label: 'Newest First', column: 'last_seen_at', ascending: false },
    { id: 'price_to_up', label: 'Price: Low to High', column: 'price', ascending: true },
    { id: 'price_to_down', label: 'Price: High to Low', column: 'price', ascending: false }
  ],
};

export const fortnitePreset: Omit<Game, 'id' | 'created_at'> = {
  name: 'Fortnite',
  slug: 'fortnite',
  category: 'Shooter / Cosmetics',
  description: 'Accounts with levels and cosmetics (skins, pickaxes, emotes, gliders).',
  api_base_url: 'https://prod-api.lzt.market',
  list_path: '/fortnite',
  check_path_template: '/item/{id}/check-account',
  default_filters: { currency: 'usd' },
  fetch_worker_enabled: true,
  check_worker_enabled: true,
  columns: [
    { id: 'item_id', label: 'Item ID', type: 'core', is_numeric: true },
    { id: 'title', label: 'Title', type: 'core', min_width: '20rem' },
    { id: 'url', label: 'URL', type: 'core' },
    { id: 'price', label: 'Price', type: 'core', is_numeric: true },
    { id: 'deal_score', label: 'Deal Score', type: 'core', is_numeric: true },
    { id: 'fortnite_level', label: 'Level', type: 'game_specific', is_numeric: true },
    { id: 'fortnite_balance', label: 'V-Bucks', type: 'game_specific', is_numeric: true },
    { id: 'fortnite_skin_count', label: 'Skins', type: 'game_specific', is_numeric: true },
    { id: 'fortnite_pickaxe_count', label: 'Pickaxes', type: 'game_specific', is_numeric: true },
    { id: 'fortnite_dance_count', label: 'Emotes', type: 'game_specific', is_numeric: true },
    { id: 'fortnite_glider_count', label: 'Gliders', type: 'game_specific', is_numeric: true },
    { id: 'first_seen_at', label: 'First Seen', type: 'core' },
  ],
  filters: [
    { id: 'title', label: 'Search', type: 'text', is_advanced: false, param_name: 'title' },
    { id: 'price', label: 'Price', type: 'number_range', is_advanced: false, param_name_min: 'pmin', param_name_max: 'pmax' },
    { id: 'lmin', label: 'Level', type: 'number_range', is_advanced: false, param_name_min: 'lmin', param_name_max: 'lmax' },
    { id: 'vbmin', label: 'V-Bucks', type: 'number_range', is_advanced: false, param_name_min: 'vbmin', param_name_max: 'vbmax' },
    { id: 'smin', label: 'Skins Count', type: 'number_range', is_advanced: true, param_name_min: 'smin', param_name_max: 'smax' }
  ],
  sorts: [
    { id: 'pdate_to_down', label: 'Newest First', column: 'last_seen_at', ascending: false },
    { id: 'price_to_up', label: 'Price: Low to High', column: 'price', ascending: true },
    { id: 'price_to_down', label: 'Price: High to Low', column: 'price', ascending: false },
    { id: 'deal_score', label: 'Deal Score', column: 'deal_score', ascending: false }
  ],
};

export const mihoyoPreset: Omit<Game, 'id' | 'created_at'> = {
    name: 'miHoYo',
    slug: 'mihoyo',
    category: 'RPG / Characters',
    description: 'Accounts defined by region, progression, character and legendary sets.',
    api_base_url: 'https://prod-api.lzt.market',
    list_path: '/mihoyo',
    check_path_template: '/item/{id}/check-account',
    default_filters: { currency: 'usd' },
    fetch_worker_enabled: true,
    check_worker_enabled: true,
    columns: [
      { id: 'item_id', label: 'Item ID', type: 'core', is_numeric: true },
      { id: 'url', label: 'URL', type: 'core' },
      { id: 'price', label: 'Price', type: 'core', is_numeric: true },
      { id: 'deal_score', label: 'Deal Score', type: 'core', is_numeric: true },
      { id: 'mihoyo_region', label: 'Region', type: 'game_specific' },
      { id: 'mihoyo_genshin_level', label: 'Genshin Lvl', type: 'game_specific', is_numeric: true },
      { id: 'mihoyo_genshin_legendary_characters_count', label: 'Genshin 5*', type: 'game_specific', is_numeric: true },
      { id: 'mihoyo_honkai_level', label: 'Honkai Lvl', type: 'game_specific', is_numeric: true },
      { id: 'mihoyo_honkai_legendary_characters_count', label: 'Honkai 5*', type: 'game_specific', is_numeric: true },
      { id: 'last_seen_at', label: 'Last Seen', type: 'core' },
    ],
    filters: [
        { id: 'price', label: 'Price', type: 'number_range', is_advanced: false, param_name_min: 'pmin', param_name_max: 'pmax' },
        { id: 'region', label: 'Region', type: 'select', is_advanced: false, param_name: 'region[]', options: ['asia', 'cht', 'eu', 'usa'] },
        { id: 'genshin_level_min', label: 'Genshin Level', type: 'number_range', is_advanced: true, param_name_min: 'genshin_level_min', param_name_max: 'genshin_level_max'},
        { id: 'genshin_legendary_min', label: 'Genshin 5*', type: 'number_range', is_advanced: false, param_name_min: 'genshin_legendary_min', param_name_max: 'genshin_legendary_max'},
        { id: 'honkai_level_min', label: 'Honkai Level', type: 'number_range', is_advanced: true, param_name_min: 'honkai_level_min', param_name_max: 'honkai_level_max'},
        { id: 'honkai_legendary_min', label: 'Honkai 5*', type: 'number_range', is_advanced: true, param_name_min: 'honkai_legendary_min', param_name_max: 'honkai_legendary_max'}
    ],
    sorts: [
        { id: 'pdate_to_down', label: 'Newest First', column: 'last_seen_at', ascending: false },
        { id: 'price_to_up', label: 'Price: Low to High', column: 'price', ascending: true },
        { id: 'deal_score', label: 'Deal Score', column: 'deal_score', ascending: false }
    ],
};

export const riotPreset: Omit<Game, 'id' | 'created_at'> = {
  name: 'Riot Games',
  slug: 'riot',
  category: 'MOBA / Shooter',
  description: 'Valorant and League of Legends accounts.',
  api_base_url: 'https://prod-api.lzt.market',
  list_path: '/riot',
  check_path_template: '/item/{id}/check-account',
  default_filters: { currency: 'usd' },
  fetch_worker_enabled: true,
  check_worker_enabled: true,
  columns: [
    { id: 'item_id', label: 'Item ID', type: 'core', is_numeric: true },
    { id: 'title', label: 'Title', type: 'core', min_width: '20rem' },
    { id: 'url', label: 'URL', type: 'core' },
    { id: 'price', label: 'Price', type: 'core', is_numeric: true },
    { id: 'deal_score', label: 'Deal Score', type: 'core', is_numeric: true },
    { id: 'riot_valorant_level', label: 'Valorant Lvl', type: 'game_specific', is_numeric: true },
    { id: 'riot_valorant_rank', label: 'Valorant Rank', type: 'game_specific' },
    { id: 'riot_valorant_skin_count', label: 'Valorant Skins', type: 'game_specific', is_numeric: true },
    { id: 'riot_lol_level', label: 'LoL Lvl', type: 'game_specific', is_numeric: true },
    { id: 'riot_lol_skin_count', label: 'LoL Skins', type: 'game_specific', is_numeric: true },
    { id: 'riot_lol_rank', label: 'LoL Rank', type: 'game_specific' },
  ],
  filters: [
    { id: 'title', label: 'Search', type: 'text', is_advanced: false, param_name: 'title' },
    { id: 'price', label: 'Price', type: 'number_range', is_advanced: false, param_name_min: 'pmin', param_name_max: 'pmax' },
    { id: 'valorant_level_min', label: 'Valorant Level', type: 'number_range', is_advanced: true, param_name_min: 'valorant_level_min', param_name_max: 'valorant_level_max' },
    { id: 'lol_level_min', label: 'LoL Level', type: 'number_range', is_advanced: true, param_name_min: 'lol_level_min', param_name_max: 'lol_level_max' }
  ],
  sorts: [
    { id: 'pdate_to_down', label: 'Newest First', column: 'last_seen_at', ascending: false },
    { id: 'price_to_up', label: 'Price: Low to High', column: 'price', ascending: true }
  ],
};

const wotPreset = {
  category: 'MMO / Tanks',
  description: 'World of Tanks universe accounts (PC & Blitz) defined by statistics and premium tanks.',
  api_base_url: 'https://prod-api.lzt.market',
  check_path_template: '/item/{id}/check-account',
  default_filters: { currency: 'usd' },
  fetch_worker_enabled: true,
  check_worker_enabled: true,
  columns: [
    { id: 'item_id', label: 'Item ID', type: 'core', is_numeric: true },
    { id: 'title', label: 'Title', type: 'core', min_width: '20rem' },
    { id: 'url', label: 'URL', type: 'core' },
    { id: 'price', label: 'Price', type: 'core', is_numeric: true },
    { id: 'deal_score', label: 'Deal Score', type: 'core', is_numeric: true },
    { id: 'wot_battles', label: 'Battles', type: 'game_specific', is_numeric: true },
    { id: 'wot_wins_percent', label: 'Win Rate', type: 'game_specific', is_numeric: true },
    { id: 'wot_wn8', label: 'WN8', type: 'game_specific', is_numeric: true },
    { id: 'wot_tanks_count', label: 'Tanks', type: 'game_specific', is_numeric: true },
    { id: 'wot_premium_tanks_count', label: 'Premium Tanks', type: 'game_specific', is_numeric: true },
    { id: 'last_seen_at', label: 'Last Seen', type: 'core' },
  ],
  filters: [
    { id: 'title', label: 'Search', type: 'text', is_advanced: false, param_name: 'title' },
    { id: 'price', label: 'Price', type: 'number_range', is_advanced: false, param_name_min: 'pmin', param_name_max: 'pmax' },
    { id: 'battles_min', label: 'Battles', type: 'number_range', is_advanced: false, param_name_min: 'battles_min', param_name_max: 'battles_max' },
    { id: 'wn8_min', label: 'WN8 Rating', type: 'number_range', is_advanced: true, param_name_min: 'wn8_min', param_name_max: 'wn8_max' }
  ],
  sorts: [
    { id: 'pdate_to_down', label: 'Newest First', column: 'last_seen_at', ascending: false },
    { id: 'price_to_up', label: 'Price: Low to High', column: 'price', ascending: true },
    { id: 'deal_score', label: 'Deal Score', column: 'deal_score', ascending: false }
  ],
};

export const gamePresets = {
  'all-accounts': allAccountsPreset,
  steam: steamPreset,
  fortnite: fortnitePreset,
  'world-of-tanks': {
    ...wotPreset,
    name: 'World of Tanks',
    slug: 'world-of-tanks',
    list_path: '/world-of-tanks'
  },
  'wot-blitz': {
    ...wotPreset,
    name: 'WoT Blitz',
    slug: 'wot-blitz',
    list_path: '/wot-blitz'
  },
  mihoyo: mihoyoPreset,
  riot: riotPreset,
  'escape-from-tarkov': {
    name: 'Escape from Tarkov',
    slug: 'escape-from-tarkov',
    category: 'Hardcore Shooter',
    description: 'EFT accounts with different game versions and progression.',
    api_base_url: 'https://prod-api.lzt.market',
    list_path: '/escape-from-tarkov',
    check_path_template: '/item/{id}/check-account',
    default_filters: { currency: 'usd' },
    fetch_worker_enabled: true,
    check_worker_enabled: true,
    columns: [
        { id: 'item_id', label: 'Item ID', type: 'core', is_numeric: true },
        { id: 'title', label: 'Title', type: 'core', min_width: '20rem' },
        { id: 'url', label: 'URL', type: 'core' },
        { id: 'price', label: 'Price', type: 'core', is_numeric: true },
        { id: 'deal_score', label: 'Deal Score', type: 'core', is_numeric: true },
        { id: 'tarkov_game_version', label: 'Version', type: 'game_specific' },
        { id: 'tarkov_level', label: 'Level', type: 'game_specific', is_numeric: true },
        { id: 'tarkov_rubles', label: 'Rubles', type: 'game_specific', is_numeric: true },
        { id: 'tarkov_kd', label: 'K/D', type: 'game_specific', is_numeric: true },
    ],
    filters: [
        { id: 'title', label: 'Search', type: 'text', is_advanced: false, param_name: 'title' },
        { id: 'price', label: 'Price', type: 'number_range', is_advanced: false, param_name_min: 'pmin', param_name_max: 'pmax' },
        { id: 'level_min', label: 'Level', type: 'number_range', is_advanced: true, param_name_min: 'level_min', param_name_max: 'level_max' },
        { id: 'version', label: 'Version', type: 'select', is_advanced: false, param_name: 'version[]', options: ['standard', 'left_behind', 'prepare_for_escape', 'edge_of_darkness', 'unheard_edition'] }
    ],
    sorts: [
        { id: 'pdate_to_down', label: 'Newest First', column: 'last_seen_at', ascending: false },
        { id: 'price_to_up', label: 'Price: Low to High', column: 'price', ascending: true }
    ],
  },
  socialclub: {
    name: 'Social Club',
    slug: 'socialclub',
    category: 'Action-Adventure',
    description: 'Rockstar Games Social Club accounts, primarily for GTA V.',
    api_base_url: 'https://prod-api.lzt.market',
    list_path: '/socialclub',
    check_path_template: '/item/{id}/check-account',
    default_filters: { currency: 'usd' },
    fetch_worker_enabled: true,
    check_worker_enabled: true,
    columns: [
      { id: 'item_id', label: 'Item ID', type: 'core', is_numeric: true },
      { id: 'title', label: 'Title', type: 'core', min_width: '20rem' },
      { id: 'url', label: 'URL', type: 'core' },
      { id: 'price', label: 'Price', type: 'core', is_numeric: true },
      { id: 'deal_score', label: 'Deal Score', type: 'core', is_numeric: true },
      { id: 'socialclub_level', label: 'Level', type: 'game_specific', is_numeric: true },
      { id: 'socialclub_cash', label: 'Cash', type: 'game_specific', is_numeric: true },
      { id: 'socialclub_bank_cash', label: 'Bank', type: 'game_specific', is_numeric: true },
      { id: 'socialclub_has_gtav', label: 'Has GTA V', type: 'game_specific' },
      { id: 'socialclub_has_rdr2', label: 'Has RDR2', type: 'game_specific' },
    ],
    filters: [
      { id: 'title', label: 'Search', type: 'text', is_advanced: false, param_name: 'title' },
      { id: 'price', label: 'Price', type: 'number_range', is_advanced: false, param_name_min: 'pmin', param_name_max: 'pmax' },
      { id: 'level_min', label: 'Level', type: 'number_range', is_advanced: true, param_name_min: 'level_min', param_name_max: 'level_max' },
      { id: 'cash_min', label: 'Cash', type: 'number_range', is_advanced: true, param_name_min: 'cash_min', param_name_max: 'cash_max' }
    ],
    sorts: [
      { id: 'pdate_to_down', label: 'Newest First', column: 'last_seen_at', ascending: false },
      { id: 'price_to_up', label: 'Price: Low to High', column: 'price', ascending: true }
    ],
  },
  minecraft: {
      name: 'Minecraft',
      slug: 'minecraft',
      category: 'Sandbox',
      description: 'Minecraft accounts with capes and Hypixel stats.',
      api_base_url: 'https://prod-api.lzt.market',
      list_path: '/minecraft',
      check_path_template: '/item/{id}/check-account',
      default_filters: { currency: 'usd' },
      fetch_worker_enabled: true,
      check_worker_enabled: true,
      columns: [
          { id: 'item_id', label: 'Item ID', type: 'core', is_numeric: true },
          { id: 'title', label: 'Title', type: 'core', min_width: '20rem' },
          { id: 'url', label: 'URL', type: 'core' },
          { id: 'price', label: 'Price', type: 'core', is_numeric: true },
          { id: 'minecraft_nickname', label: 'Nickname', type: 'game_specific' },
          { id: 'minecraft_can_change_nickname', label: 'Change Nick', type: 'game_specific' },
          { id: 'minecraft_hypixel_rank', label: 'Hypixel Rank', type: 'game_specific' },
          { id: 'minecraft_hypixel_level', label: 'Hypixel Level', type: 'game_specific', is_numeric: true },
          { id: 'minecraft_capes_count', label: 'Capes', type: 'game_specific', is_numeric: true },
      ],
      filters: [
          { id: 'title', label: 'Search', type: 'text', is_advanced: false, param_name: 'title' },
          { id: 'price', label: 'Price', type: 'number_range', is_advanced: false, param_name_min: 'pmin', param_name_max: 'pmax' },
          { id: 'level_hypixel_min', label: 'Hypixel Level', type: 'number_range', is_advanced: true, param_name_min: 'level_hypixel_min', param_name_max: 'level_hypixel_max' }
      ],
      sorts: [
          { id: 'pdate_to_down', label: 'Newest First', column: 'last_seen_at', ascending: false },
          { id: 'price_to_up', label: 'Price: Low to High', column: 'price', ascending: true }
      ],
  },
  roblox: {
      name: 'Roblox',
      slug: 'roblox',
      category: 'Online Game Platform',
      description: 'Roblox accounts with Robux, friends, and followers.',
      api_base_url: 'https://prod-api.lzt.market',
      list_path: '/roblox',
      check_path_template: '/item/{id}/check-account',
      default_filters: { currency: 'usd' },
      fetch_worker_enabled: true,
      check_worker_enabled: true,
      columns: [
          { id: 'item_id', label: 'Item ID', type: 'core', is_numeric: true },
          { id: 'title', label: 'Title', type: 'core', min_width: '20rem' },
          { id: 'url', label: 'URL', type: 'core' },
          { id: 'price', label: 'Price', type: 'core', is_numeric: true },
          { id: 'roblox_robux', label: 'Robux', type: 'game_specific', is_numeric: true },
          { id: 'roblox_friends', label: 'Friends', type: 'game_specific', is_numeric: true },
          { id: 'roblox_followers', label: 'Followers', type: 'game_specific', is_numeric: true },
          { id: 'roblox_subscription', label: 'Subscription', type: 'game_specific' },
      ],
      filters: [
          { id: 'title', label: 'Search', type: 'text', is_advanced: false, param_name: 'title' },
          { id: 'price', label: 'Price', type: 'number_range', is_advanced: false, param_name_min: 'pmin', param_name_max: 'pmax' },
          { id: 'robux_min', label: 'Robux', type: 'number_range', is_advanced: false, param_name_min: 'robux_min', param_name_max: 'robux_max' }
      ],
      sorts: [
          { id: 'pdate_to_down', label: 'Newest First', column: 'last_seen_at', ascending: false },
          { id: 'price_to_up', label: 'Price: Low to High', column: 'price', ascending: true }
      ],
  },
  epicgames: {
      name: 'Epic Games',
      slug: 'epicgames',
      category: 'Digital Storefront',
      description: 'Epic Games accounts with various games and balances.',
      api_base_url: 'https://prod-api.lzt.market',
      list_path: '/epicgames',
      check_path_template: '/item/{id}/check-account',
      default_filters: { currency: 'usd' },
      fetch_worker_enabled: true,
      check_worker_enabled: true,
      columns: [
          { id: 'item_id', label: 'Item ID', type: 'core', is_numeric: true },
          { id: 'title', label: 'Title', type: 'core', min_width: '20rem' },
          { id: 'url', label: 'URL', type: 'core' },
          { id: 'price', label: 'Price', type: 'core', is_numeric: true },
          { id: 'eg_game_count', label: 'Games', type: 'game_specific', is_numeric: true },
          { id: 'eg_balance', label: 'Balance', type: 'game_specific', is_numeric: true },
      ],
      filters: [
          { id: 'title', label: 'Search', type: 'text', is_advanced: false, param_name: 'title' },
          { id: 'price', label: 'Price', type: 'number_range', is_advanced: false, param_name_min: 'pmin', param_name_max: 'pmax' },
          { id: 'gmin', label: 'Games Count', type: 'number_range', is_advanced: true, param_name_min: 'gmin', param_name_max: 'gmax' }
      ],
      sorts: [
          { id: 'pdate_to_down', label: 'Newest First', column: 'last_seen_at', ascending: false },
          { id: 'price_to_up', label: 'Price: Low to High', column: 'price', ascending: true }
      ],
  },
  uplay: {
      name: 'Uplay (Ubisoft)',
      slug: 'uplay',
      category: 'Digital Storefront',
      description: 'Ubisoft accounts, often with Rainbow Six Siege stats.',
      api_base_url: 'https://prod-api.lzt.market',
      list_path: '/uplay',
      check_path_template: '/item/{id}/check-account',
      default_filters: { currency: 'usd' },
      fetch_worker_enabled: true,
      check_worker_enabled: true,
      columns: [
          { id: 'item_id', label: 'Item ID', type: 'core', is_numeric: true },
          { id: 'title', label: 'Title', type: 'core', min_width: '20rem' },
          { id: 'url', label: 'URL', type: 'core' },
          { id: 'price', label: 'Price', type: 'core', is_numeric: true },
          { id: 'uplay_game_count', label: 'Games', type: 'game_specific', is_numeric: true },
          { id: 'uplay_r6_level', label: 'R6 Level', type: 'game_specific', is_numeric: true },
          { id: 'uplay_r6_rank', label: 'R6 Rank', type: 'game_specific' },
      ],
      filters: [
          { id: 'title', label: 'Search', type: 'text', is_advanced: false, param_name: 'title' },
          { id: 'price', label: 'Price', type: 'number_range', is_advanced: false, param_name_min: 'pmin', param_name_max: 'pmax' },
          { id: 'gmin', label: 'Games Count', type: 'number_range', is_advanced: true, param_name_min: 'gmin', param_name_max: 'gmax' }
      ],
      sorts: [
          { id: 'pdate_to_down', label: 'Newest First', column: 'last_seen_at', ascending: false },
          { id: 'price_to_up', label: 'Price: Low to High', column: 'price', ascending: true }
      ],
  },
  battlenet: {
      name: 'Battle.net',
      slug: 'battlenet',
      category: 'Digital Storefront',
      description: 'Blizzard Battle.net accounts.',
      api_base_url: 'https://prod-api.lzt.market',
      list_path: '/battlenet',
      check_path_template: '/item/{id}/check-account',
      default_filters: { currency: 'usd' },
      fetch_worker_enabled: true,
      check_worker_enabled: true,
      columns: [
          { id: 'item_id', label: 'Item ID', type: 'core', is_numeric: true },
          { id: 'title', label: 'Title', type: 'core', min_width: '20rem' },
          { id: 'url', label: 'URL', type: 'core' },
          { id: 'price', label: 'Price', type: 'core', is_numeric: true },
          { id: 'battlenet_balance', label: 'Balance', type: 'game_specific' },
          { id: 'battlenet_country', label: 'Country', type: 'game_specific' },
          { id: 'battlenet_can_change_tag', label: 'Can change tag', type: 'game_specific' },
      ],
      filters: [
          { id: 'title', label: 'Search', type: 'text', is_advanced: false, param_name: 'title' },
          { id: 'price', label: 'Price', type: 'number_range', is_advanced: false, param_name_min: 'pmin', param_name_max: 'pmax' },
          { id: 'balance_min', label: 'Balance', type: 'number_range', is_advanced: true, param_name_min: 'balance_min', param_name_max: 'balance_max' }
      ],
      sorts: [
          { id: 'pdate_to_down', label: 'Newest First', column: 'last_seen_at', ascending: false },
          { id: 'price_to_up', label: 'Price: Low to High', column: 'price', ascending: true }
      ],
  },
  telegram: {
    name: 'Telegram',
    slug: 'telegram',
    category: 'Social',
    description: 'Telegram accounts with premium status and channel info.',
    api_base_url: 'https://prod-api.lzt.market',
    list_path: '/telegram',
    check_path_template: '/item/{id}/check-account',
    default_filters: { currency: 'usd' },
    fetch_worker_enabled: true,
    check_worker_enabled: true,
    columns: [
      { id: 'item_id', label: 'Item ID', type: 'core', is_numeric: true },
      { id: 'title', label: 'Title', type: 'core', min_width: '20rem' },
      { id: 'price', label: 'Price', type: 'core', is_numeric: true },
      { id: 'telegram_premium', label: 'Premium', type: 'game_specific' },
      { id: 'telegram_channels_count', label: 'Channels', type: 'game_specific', is_numeric: true },
      { id: 'telegram_admin_count', label: 'Admin In', type: 'game_specific', is_numeric: true },
    ],
    filters: [
      { id: 'price', label: 'Price', type: 'number_range', is_advanced: false, param_name_min: 'pmin', param_name_max: 'pmax' },
      { id: 'premium', label: 'Has Premium', type: 'select', is_advanced: false, param_name: 'premium', options: ['yes', 'no'] }
    ],
    sorts: [
        { id: 'pdate_to_down', label: 'Newest First', column: 'last_seen_at', ascending: false },
        { id: 'price_to_up', label: 'Price: Low to High', column: 'price', ascending: true }
    ],
  },
  supercell: {
    name: 'Supercell',
    slug: 'supercell',
    category: 'Mobile Gaming',
    description: 'Brawl Stars, Clash Royale, Clash of Clans accounts.',
    api_base_url: 'https://prod-api.lzt.market',
    list_path: '/supercell',
    check_path_template: '/item/{id}/check-account',
    default_filters: { currency: 'usd' },
    fetch_worker_enabled: true,
    check_worker_enabled: true,
    columns: [
      { id: 'item_id', label: 'Item ID', type: 'core', is_numeric: true },
      { id: 'price', label: 'Price', type: 'core', is_numeric: true },
      { id: 'supercell_brawler_count', label: 'Brawlers', type: 'game_specific', is_numeric: true },
      { id: 'supercell_laser_trophies', label: 'Brawl Trophies', type: 'game_specific', is_numeric: true },
      { id: 'supercell_town_hall_level', label: 'CoC TH Level', type: 'game_specific', is_numeric: true },
      { id: 'supercell_king_level', label: 'CR King Level', type: 'game_specific', is_numeric: true },
    ],
    filters: [
       { id: 'price', label: 'Price', type: 'number_range', is_advanced: false, param_name_min: 'pmin', param_name_max: 'pmax' }
    ],
    sorts: [
        { id: 'pdate_to_down', label: 'Newest First', column: 'last_seen_at', ascending: false },
        { id: 'price_to_up', label: 'Price: Low to High', column: 'price', ascending: true }
    ],
  },
  ea: {
    name: 'EA (Origin)',
    slug: 'ea',
    category: 'Digital Storefront',
    description: 'Electronic Arts accounts, often with Apex Legends stats.',
    api_base_url: 'https://prod-api.lzt.market',
    list_path: '/ea',
    check_path_template: '/item/{id}/check-account',
    default_filters: { currency: 'usd' },
    fetch_worker_enabled: true,
    check_worker_enabled: true,
    columns: [
        { id: 'item_id', label: 'Item ID', type: 'core', is_numeric: true },
        { id: 'title', label: 'Title', type: 'core', min_width: '20rem' },
        { id: 'price', label: 'Price', type: 'core', is_numeric: true },
        { id: 'ea_game_count', label: 'Games', type: 'game_specific', is_numeric: true },
        { id: 'ea_al_level', label: 'Apex Level', type: 'game_specific', is_numeric: true },
    ],
    filters: [
        { id: 'price', label: 'Price', type: 'number_range', is_advanced: false, param_name_min: 'pmin', param_name_max: 'pmax' }
    ],
    sorts: [
        { id: 'pdate_to_down', label: 'Newest First', column: 'last_seen_at', ascending: false },
        { id: 'price_to_up', label: 'Price: Low to High', column: 'price', ascending: true }
    ],
  },
  gifts: { name: 'Gifts', slug: 'gifts', category: 'Digital Goods', description: 'Digital gifts like Discord Nitro and Telegram Premium.', api_base_url: 'https://prod-api.lzt.market', list_path: '/gifts', check_path_template: '/item/{id}/check-account', default_filters: { currency: 'usd' }, fetch_worker_enabled: true, check_worker_enabled: true, columns: [ { id: 'item_id', label: 'Item ID', type: 'core', is_numeric: true },{ id: 'title', label: 'Title', type: 'core', min_width: '20rem' }, { id: 'price', label: 'Price', type: 'core', is_numeric: true } ], filters: [], sorts: [] },
  discord: { name: 'Discord', slug: 'discord', category: 'Social', description: 'Discord accounts, often with Nitro or special badges.', api_base_url: 'https://prod-api.lzt.market', list_path: '/discord', check_path_template: '/item/{id}/check-account', default_filters: { currency: 'usd' }, fetch_worker_enabled: true, check_worker_enabled: true, columns: [ { id: 'item_id', label: 'Item ID', type: 'core', is_numeric: true },{ id: 'title', label: 'Title', type: 'core', min_width: '20rem' }, { id: 'price', label: 'Price', type: 'core', is_numeric: true }, { id: 'discord_nitro_type', label: 'Nitro Type', type: 'game_specific' } ], filters: [], sorts: [] },
  tiktok: { name: 'TikTok', slug: 'tiktok', category: 'Social', description: 'TikTok accounts with followers and likes.', api_base_url: 'https://prod-api.lzt.market', list_path: '/tiktok', check_path_template: '/item/{id}/check-account', default_filters: { currency: 'usd' }, fetch_worker_enabled: true, check_worker_enabled: true, columns: [ { id: 'item_id', label: 'Item ID', type: 'core', is_numeric: true },{ id: 'title', label: 'Title', type: 'core', min_width: '20rem' }, { id: 'price', label: 'Price', type: 'core', is_numeric: true }, { id: 'tt_followers', label: 'Followers', type: 'game_specific', is_numeric: true } ], filters: [], sorts: [] },
  instagram: { name: 'Instagram', slug: 'instagram', category: 'Social', description: 'Instagram accounts with followers and posts.', api_base_url: 'https://prod-api.lzt.market', list_path: '/instagram', check_path_template: '/item/{id}/check-account', default_filters: { currency: 'usd' }, fetch_worker_enabled: true, check_worker_enabled: true, columns: [ { id: 'item_id', label: 'Item ID', type: 'core', is_numeric: true },{ id: 'title', label: 'Title', type: 'core', min_width: '20rem' }, { id: 'price', label: 'Price', type: 'core', is_numeric: true }, { id: 'instagram_follower_count', label: 'Followers', type: 'game_specific', is_numeric: true } ], filters: [], sorts: [] },
  chatgpt: { name: 'ChatGPT', slug: 'chatgpt', category: 'AI / Services', description: 'OpenAI ChatGPT accounts, often with Plus subscriptions.', api_base_url: 'https://prod-api.lzt.market', list_path: '/chatgpt', check_path_template: '/item/{id}/check-account', default_filters: { currency: 'usd' }, fetch_worker_enabled: true, check_worker_enabled: true, columns: [ { id: 'item_id', label: 'Item ID', type: 'core', is_numeric: true },{ id: 'title', label: 'Title', type: 'core', min_width: '20rem' }, { id: 'price', label: 'Price', type: 'core', is_numeric: true }, { id: 'chatgpt_subscription', label: 'Subscription', type: 'game_specific' } ], filters: [], sorts: [] },
  vpn: { name: 'VPN', slug: 'vpn', category: 'Services', description: 'VPN service subscriptions.', api_base_url: 'https://prod-api.lzt.market', list_path: '/vpn', check_path_template: '/item/{id}/check-account', default_filters: { currency: 'usd' }, fetch_worker_enabled: true, check_worker_enabled: true, columns: [ { id: 'item_id', label: 'Item ID', type: 'core', is_numeric: true },{ id: 'title', label: 'Title', type: 'core', min_width: '20rem' }, { id: 'price', label: 'Price', type: 'core', is_numeric: true }, { id: 'vpn_service', label: 'Service', type: 'game_specific' } ], filters: [], sorts: [] },
  warface: { name: 'Warface', slug: 'warface', category: 'Shooter', description: 'Warface accounts with ranks and Kredits.', api_base_url: 'https://prod-api.lzt.market', list_path: '/warface', check_path_template: '/item/{id}/check-account', default_filters: { currency: 'usd' }, fetch_worker_enabled: true, check_worker_enabled: true, columns: [ { id: 'item_id', label: 'Item ID', type: 'core', is_numeric: true },{ id: 'title', label: 'Title', type: 'core', min_width: '20rem' }, { id: 'price', label: 'Price', type: 'core', is_numeric: true }, { id: 'wf_rank', label: 'Rank', type: 'game_specific', is_numeric: true } ], filters: [], sorts: [] }
};