/* ============================================================
   RAWG Video Games Database API Integration
   Enriches CheapShark deals with high-res artwork, screenshots,
   genres, platforms, release date, and ratings.
   ============================================================ */

import { getHeroImage, getGameImage } from './cheapshark.js';

const RAWG_BASE_URL = 'https://api.rawg.io/api';
// Default public client key or custom key from env
const RAWG_API_KEY = import.meta.env.VITE_RAWG_API_KEY || 'c542e67aec3a4340908f9de9e86038af';

// In-memory cache for RAWG queries (persists during user session)
const rawgCache = new Map();
const CACHE_TTL = 30 * 60 * 1000; // 30 minutes

/**
 * Clean and normalize game titles for optimal RAWG matching
 * e.g., "The Witcher 3: Wild Hunt - Game of the Year Edition" -> "The Witcher 3: Wild Hunt"
 */
export function cleanTitleForMatching(title) {
  if (!title) return '';
  return title
    .replace(/\b(deluxe|ultimate|gold|edition|goty|game of the year|bundle|collector'?s|standard|remastered|definitive)\b/gi, '')
    .replace(/[:\-–—]\s*(game of the year|deluxe|complete|gold|ultimate).*$/i, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Fetch game metadata from RAWG by title
 * @param {string} title
 * @returns {Promise<Object|null>}
 */
export async function fetchRawgGame(title) {
  if (!title || !RAWG_API_KEY) return null;

  const cleanTitle = cleanTitleForMatching(title) || title;
  const cacheKey = cleanTitle.toLowerCase();

  // Check cache
  const cached = rawgCache.get(cacheKey);
  if (cached && Date.now() - cached.ts < CACHE_TTL) {
    return cached.data;
  }

  try {
    const url = new URL(`${RAWG_BASE_URL}/games`);
    url.searchParams.set('key', RAWG_API_KEY);
    url.searchParams.set('search', cleanTitle);
    url.searchParams.set('page_size', '1');
    url.searchParams.set('search_precise', 'true');

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4500); // 4.5s timeout

    const res = await fetch(url.toString(), { signal: controller.signal });
    clearTimeout(timeoutId);

    if (!res.ok) {
      // Return null silently on rate-limit or error (fallback safely)
      return null;
    }

    const data = await res.json();
    if (!data || !data.results || data.results.length === 0) {
      rawgCache.set(cacheKey, { data: null, ts: Date.now() });
      return null;
    }

    const game = data.results[0];
    const enriched = {
      rawgId: game.id,
      name: game.name,
      slug: game.slug,
      backgroundImage: game.background_image || null,
      rating: game.rating || null,
      ratingTop: game.rating_top || 5,
      ratingsCount: game.ratings_count || 0,
      released: game.released || null,
      genres: (game.genres || []).map(g => g.name),
      platforms: (game.platforms || []).map(p => p.platform?.name).filter(Boolean),
      shortScreenshots: (game.short_screenshots || []).map(s => s.image).filter(Boolean),
    };

    rawgCache.set(cacheKey, { data: enriched, ts: Date.now() });
    return enriched;
  } catch (err) {
    // Network error or timeout: log quietly and fallback
    console.warn(`[RAWG] Fallback for "${title}":`, err.message || err);
    return null;
  }
}

/**
 * Enrich a single CheapShark deal with RAWG metadata
 * Merges high-res artwork, genres, and ratings.
 * @param {Object} deal
 * @returns {Promise<Object>}
 */
export async function enrichDealWithRAWG(deal) {
  if (!deal) return deal;

  try {
    const rawgData = await fetchRawgGame(deal.title);

    if (rawgData) {
      return {
        ...deal,
        rawg: rawgData,
        heroImage: rawgData.backgroundImage || getHeroImage(deal),
        gameImage: rawgData.backgroundImage || getGameImage(deal),
        genres: rawgData.genres || [],
        platforms: rawgData.platforms || [],
        rawgRating: rawgData.rating,
        releaseDate: rawgData.released || deal.releaseDate,
      };
    }
  } catch (err) {
    console.warn(`[RAWG] Failed to enrich "${deal?.title}":`, err);
  }

  // Graceful Fallback: Ensure heroImage and gameImage are populated from CheapShark/Steam
  return {
    ...deal,
    heroImage: getHeroImage(deal),
    gameImage: getGameImage(deal),
    genres: [],
  };
}

/**
 * Enrich a list of CheapShark deals concurrently with controlled concurrency
 * @param {Array<Object>} deals
 * @param {number} concurrency
 * @returns {Promise<Array<Object>>}
 */
export async function enrichDealsWithRAWG(deals, concurrency = 4) {
  if (!Array.isArray(deals) || deals.length === 0) return [];

  const results = [];
  for (let i = 0; i < deals.length; i += concurrency) {
    const chunk = deals.slice(i, i + concurrency);
    const enrichedChunk = await Promise.all(chunk.map(deal => enrichDealWithRAWG(deal)));
    results.push(...enrichedChunk);
  }

  return results;
}
