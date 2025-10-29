// This file is used to configure optional, client-side-only API keys.
// Database and LZT tokens are now managed on the backend server.

window.process = window.process || {};
window.process.env = window.process.env || {};

// --- Google Gemini API Configuration (Optional) ---
// Replace with your Gemini API Key to enable the "Deal Score" feature. Get one from https://aistudio.google.com/app/apikey
window.process.env.API_KEY = "YOUR_GEMINI_API_KEY_HERE";
