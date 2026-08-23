/* ============================================================
   CheapShark API Client
   ============================================================ */

const BASE_URL = 'https://www.cheapshark.com/api/1.0';

// Simple request cache (in-memory, session-lifetime)
const cache = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

async function request(endpoint, params = {}) {
  const url = new URL(`${BASE_URL}${endpoint}`);
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== '') {
      url.searchParams.set(k, v);
    }
  });

  const cacheKey = url.toString();
  const cached = cache.get(cacheKey);
  if (cached && Date.now() - cached.ts < CACHE_TTL) {
    return cached.data;
  }

  const res = await fetch(url.toString());
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  const data = await res.json();

  cache.set(cacheKey, { data, ts: Date.now() });
  return data;
}

/**
 * Fetch deals list
 * @param {Object} params
 * @param {number} [params.pageNumber] - Page number (0-indexed)
 * @param {number} [params.pageSize] - Results per page (default 24, max 60)
 * @param {string} [params.storeID] - Comma-separated store IDs
 * @param {string} [params.sortBy] - Deal Rating, Title, Savings, Price, Metacritic, Reviews, Release, Store
 * @param {number} [params.lowerPrice] - Min price
 * @param {number} [params.upperPrice] - Max price
 * @param {number} [params.metacritic] - Min metacritic score
 * @param {number} [params.steamRating] - Min steam rating
 * @param {boolean} [params.onSale] - Only games on sale
 */
export async function fetchDeals(params = {}) {
  const apiParams = {
    pageNumber: params.pageNumber || 0,
    pageSize: params.pageSize || 24,
    sortBy: params.sortBy || 'Deal Rating',
    onSale: params.onSale !== undefined ? (params.onSale ? 1 : 0) : 1,
  };

  if (params.storeID) apiParams.storeID = params.storeID;
  if (params.lowerPrice !== undefined) apiParams.lowerPrice = params.lowerPrice;
  if (params.upperPrice !== undefined) apiParams.upperPrice = params.upperPrice;
  if (params.metacritic) apiParams.metacritic = params.metacritic;
  if (params.steamRating) apiParams.steamRating = params.steamRating;
  if (params.title) apiParams.title = params.title;

  return request('/deals', apiParams);
}

/**
 * Fetch single deal details
 */
export async function fetchDealDetails(dealID) {
  return request('/deals', { id: dealID });
}

/**
 * Fetch all stores
 * Returns array of { storeID, storeName, isActive, images: { banner, logo, icon } }
 */
export async function fetchStores() {
  const stores = await request('/stores');
  // Only return active stores
  return stores.filter(s => s.isActive === 1);
}

/**
 * Search games by title
 * Returns array of { gameID, steamAppID, cheapest, cheapestDealID, external (title), internalName, thumb }
 */
export async function searchGames(title, limit = 10) {
  if (!title || title.trim().length < 2) return [];
  return request('/games', { title: title.trim(), limit });
}

/**
 * Fetch game details by ID
 * Returns { info, cheapestPriceEver, deals: [...] }
 */
export async function fetchGameDetails(gameID) {
  return request('/games', { id: gameID });
}

/**
 * Get the redirect URL for a deal (opens in CheapShark, then redirects to store)
 */
export function getDealLink(dealID) {
  return `https://www.cheapshark.com/redirect?dealID=${dealID}`;
}

/**
 * Get store logo URL from CheapShark CDN
 */
export function getStoreLogo(storeImages) {
  if (!storeImages) return '';
  return `https://www.cheapshark.com${storeImages.icon}`;
}

/**
 * Get a higher-resolution thumbnail for a game
 * Falls back to CheapShark thumb if steamAppID not available
 */
export function getGameImage(deal) {
  if (deal.steamAppID) {
    return `https://cdn.akamai.steamstatic.com/steam/apps/${deal.steamAppID}/header.jpg`;
  }
  return deal.thumb || '';
}

/**
 * Get a large hero-quality image for a game
 */
export function getHeroImage(deal) {
  if (deal.steamAppID) {
    return `https://cdn.akamai.steamstatic.com/steam/apps/${deal.steamAppID}/library_hero.jpg`;
  }
  return deal.thumb || '';
}
