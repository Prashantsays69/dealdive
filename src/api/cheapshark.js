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
 * Get high-resolution banner image for a game card
 * Uses canonical Steam header.jpg (460x215) which matches the 460/215 aspect ratio perfectly
 */
export function getGameImage(deal) {
  if (deal.steamAppID) {
    return `https://cdn.cloudflare.steamstatic.com/steam/apps/${deal.steamAppID}/header.jpg`;
  }
  if (deal.thumb) {
    return deal.thumb;
  }
  return '';
}

/**
 * Get high-res hero image for a game banner
 */
export function getHeroImage(deal) {
  if (deal.steamAppID) {
    return `https://cdn.cloudflare.steamstatic.com/steam/apps/${deal.steamAppID}/library_hero.jpg`;
  }
  return getGameImage(deal);
}

/**
 * Deduplicate deals by game title so the same game doesn't repeat 5 times in a row
 */
export function deduplicateDeals(deals) {
  if (!Array.isArray(deals)) return [];
  const seenTitles = new Map();

  deals.forEach(deal => {
    // Normalize title to group editions (e.g. "Suicide Squad: Kill the Justice League", "Suicide Squad Deluxe")
    const cleanTitle = deal.title
      .toLowerCase()
      .replace(/\b(deluxe|ultimate|gold|edition|goty|bundle|standard)\b/g, '')
      .replace(/[^a-z0-9]/g, '')
      .trim();

    if (!seenTitles.has(cleanTitle)) {
      seenTitles.set(cleanTitle, deal);
    } else {
      // If current deal has higher savings, replace the stored deal
      const existing = seenTitles.get(cleanTitle);
      if (parseFloat(deal.savings) > parseFloat(existing.savings)) {
        seenTitles.set(cleanTitle, deal);
      }
    }
  });

  return Array.from(seenTitles.values());
}

/**
 * Fetch top popular deals for Hero Carousel
 * Filters for high-metacritic / well-known titles with high-res artwork
 */
export async function fetchHeroDeals() {
  try {
    // Attempt 1: Fetch deals with Metacritic >= 70
    let deals = await fetchDeals({
      pageSize: 40,
      sortBy: 'Deal Rating',
      onSale: true,
      metacritic: 70,
    });

    // Deduplicate deals
    let uniqueDeals = deduplicateDeals(deals);

    // Filter to only deals that have a Steam App ID (guarantees high quality artwork)
    let heroDeals = uniqueDeals.filter(d => d.steamAppID && parseInt(d.metacriticScore) >= 70);

    // Fallback if not enough games match Metacritic >= 70
    if (heroDeals.length < 5) {
      const fallbackDeals = await fetchDeals({
        pageSize: 40,
        sortBy: 'Deal Rating',
        onSale: true,
        steamRating: 75,
      });
      const uniqueFallback = deduplicateDeals(fallbackDeals).filter(d => d.steamAppID);
      
      const set = new Map();
      [...heroDeals, ...uniqueFallback].forEach(d => set.set(d.dealID, d));
      heroDeals = Array.from(set.values());
    }

    // Sort by Metacritic score descending
    heroDeals.sort((a, b) => (parseInt(b.metacriticScore) || 0) - (parseInt(a.metacriticScore) || 0));

    return heroDeals.slice(0, 5);
  } catch (err) {
    console.error('Failed to fetch hero deals:', err);
    return [];
  }
}
