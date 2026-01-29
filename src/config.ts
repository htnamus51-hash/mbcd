// Use env override when provided, otherwise use same-origin API proxy
const API_URL = (typeof import.meta !== 'undefined' && (import.meta as any).env && (import.meta as any).env.VITE_API_URL)
  ? (import.meta as any).env.VITE_API_URL
  : '/api';

// TURN servers configuration for WebRTC cross-device connectivity
// Can be overridden via Vite env: VITE_TURN_SERVERS='[...]'
let TURN_SERVERS: RTCIceServer[] = [];

// Try to get from environment first
if (typeof import.meta !== 'undefined' && (import.meta as any).env && (import.meta as any).env.VITE_TURN_SERVERS) {
  try {
    TURN_SERVERS = JSON.parse((import.meta as any).env.VITE_TURN_SERVERS);
  } catch (e) {
    console.warn('[CONFIG] Failed to parse VITE_TURN_SERVERS');
  }
}

// Public TURN server fallback (for development/testing)
// Using OpenRelay - free public TURN server (works reliably for testing)
if (TURN_SERVERS.length === 0) {
  TURN_SERVERS = [
    {
      urls: ['turn:openrelay.metered.ca:80', 'turn:openrelay.metered.ca:443?transport=tcp'],
      username: 'openrelayproject',
      credential: 'openrelayproject'
    },
    // Fallback to another free TURN server
    {
      urls: ['turn:turnserver.101domain.com:3478', 'turn:turnserver.101domain.com:3478?transport=tcp'],
      username: 'webrtc',
      credential: 'webrtc'
    }
  ];
}

console.log('[DEBUG] API_URL:', API_URL);
console.log('[DEBUG] TURN_SERVERS configured:', TURN_SERVERS.length > 0 ? `Yes (${TURN_SERVERS.length} servers)` : 'No');
console.log('[DEBUG] TURN servers:', TURN_SERVERS);

export { API_URL, TURN_SERVERS };

// Helper function to build API URLs
export function apiUrl(endpoint: string): string {
  const path = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  
  // Prevent double /api prefix if API_URL also ends with /api (e.g. in production)
  if (API_URL.endsWith('/api') && path.startsWith('/api/')) {
    return `${API_URL}${path.substring(4)}`;
  }
  
  return `${API_URL}${path}`;
}
