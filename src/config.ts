// Force Railway URL for all environments during testing
const API_URL = 'https://web-production-5e0e.up.railway.app';

console.log('[DEBUG] API_URL:', API_URL);

export { API_URL };

// Helper function to build API URLs
export function apiUrl(endpoint: string): string {
  return `${API_URL}${endpoint.startsWith('/') ? '' : '/'}${endpoint}`;
}
