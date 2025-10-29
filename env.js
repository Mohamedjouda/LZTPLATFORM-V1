// IMPORTANT: EDIT THIS FILE WITH YOUR API KEYS AFTER DEPLOYING
// This file is used to configure your application's environment variables.
// Replace the placeholder values with your actual keys before using the application on your server.

window.process = window.process || {};
window.process.env = window.process.env || {};

// --- Supabase Configuration ---
// Your Supabase Project URL
window.process.env.SUPABASE_URL = "https://reppasrxzgnnexowirwl.supabase.co";
// Your Supabase Anon Key (public)
window.process.env.SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJlcHBhc3J4emdubmV4b3dpcndsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE2MDA3NjksImV4cCI6MjA3NzE3Njc2OX0.ay3RjGrTlX_3K3AcAj1Rhnfhwv7Ff5SLAc_AKs8GUtM";

// --- LZT Market API Configuration ---
// This is now configured on the in-app Settings page. This value is no longer used.
window.process.env.LZT_API_TOKEN = "DEPRECATED_SEE_SETTINGS_PAGE";

// --- Google Gemini API Configuration (Optional) ---
// Replace with your Gemini API Key to enable the "Deal Score" feature. Get one from https://aistudio.google.com/app/apikey
window.process.env.API_KEY = "YOUR_GEMINI_API_KEY_HERE";