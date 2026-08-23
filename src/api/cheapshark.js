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
/**
 * Fetch all stores
 * Returns array of { storeID, storeName, isActive, images: { banner, logo, icon } }
 * Prioritizes Steam (1) and Epic Games Store (25) at the top
 */
export async function fetchStores() {
  const stores = await request('/stores');
  const activeStores = stores.filter(s => s.isActive === 1);

  // Priority stores for PC gamers: Steam (1), Epic Games (25), GOG (7), Ubisoft (13)
  const priorityIDs = ['1', '25', '7', '13'];
  activeStores.sort((a, b) => {
    const idxA = priorityIDs.indexOf(a.storeID);
    const idxB = priorityIDs.indexOf(b.storeID);
    if (idxA !== -1 && idxB !== -1) return idxA - idxB;
    if (idxA !== -1) return -1;
    if (idxB !== -1) return 1;
    return a.storeName.localeCompare(b.storeName);
  });

  return activeStores;
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
    const cleanTitle = deal.title
      .toLowerCase()
      .replace(/\b(deluxe|ultimate|gold|edition|goty|bundle|standard)\b/g, '')
      .replace(/[^a-z0-9]/g, '')
      .trim();

    if (!seenTitles.has(cleanTitle)) {
      seenTitles.set(cleanTitle, deal);
    } else {
      const existing = seenTitles.get(cleanTitle);
      if (parseFloat(deal.savings) > parseFloat(existing.savings)) {
        seenTitles.set(cleanTitle, deal);
      }
    }
  });

  return Array.from(seenTitles.values());
}

/**
 * Fetch top iconic popular deals of all time for Hero Carousel
 * Prioritizes Steam (1) and Epic Games Store (25) with top Metacritic (>= 75)
 */
export async function fetchHeroDeals() {
  try {
    // Primary query: Steam & Epic Games deals sorted by Metacritic score
    let deals = await fetchDeals({
      pageSize: 50,
      sortBy: 'Metacritic',
      onSale: true,
      metacritic: 75,
      storeID: '1,25', // Steam & Epic Games
    });

    let uniqueDeals = deduplicateDeals(deals).filter(d => d.steamAppID);

    // Fallback query if Steam/Epic specific search yields fewer than 5 items
    if (uniqueDeals.length < 5) {
      const globalDeals = await fetchDeals({
        pageSize: 50,
        sortBy: 'Metacritic',
        onSale: true,
        metacritic: 75,
      });
      const globalUnique = deduplicateDeals(globalDeals).filter(d => d.steamAppID);
      
      const set = new Map();
      [...uniqueDeals, ...globalUnique].forEach(d => set.set(d.dealID, d));
      uniqueDeals = Array.from(set.values());
    }

    // Sort by Metacritic rating descending so highest rated popular games appear first
    uniqueDeals.sort((a, b) => (parseInt(b.metacriticScore) || 0) - (parseInt(a.metacriticScore) || 0));

    return uniqueDeals.slice(0, 5);
  } catch (err) {
    console.error('Failed to fetch hero deals:', err);
    return [];
  }
}
