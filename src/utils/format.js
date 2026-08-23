/* ============================================================
   Formatting Utilities
   ============================================================ */

const USD_TO_INR = 83;

/**
 * Format a price in INR (₹) — 0 shows as "FREE"
 */
export function formatPrice(price) {
  const num = parseFloat(price);
  if (isNaN(num) || num === 0) return 'FREE';
  const inr = Math.round(num * USD_TO_INR);
  return `₹${inr.toLocaleString('en-IN')}`;
}

/**
 * Calculate savings percentage
 */
export function calcSavings(normalPrice, salePrice) {
  const normal = parseFloat(normalPrice);
  const sale = parseFloat(salePrice);
  if (isNaN(normal) || normal === 0) return 0;
  return Math.round(((normal - sale) / normal) * 100);
}

/**
 * Format a discount string
 */
export function formatDiscount(savings) {
  const pct = Math.round(parseFloat(savings));
  if (isNaN(pct) || pct <= 0) return '';
  return `-${pct}%`;
}

/**
 * Debounce function
 */
export function debounce(fn, ms = 300) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), ms);
  };
}

/**
 * Relative time string (for countdowns / deal freshness)
 */
export function timeAgo(timestamp) {
  const seconds = Math.floor((Date.now() / 1000) - timestamp);
  if (seconds < 60) return 'just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
  return `${Math.floor(seconds / 604800)}w ago`;
}

/**
 * Countdown to a future timestamp
 */
export function formatCountdown(endTimestamp) {
  const diff = endTimestamp - Math.floor(Date.now() / 1000);
  if (diff <= 0) return 'Expired';

  const days = Math.floor(diff / 86400);
  const hours = Math.floor((diff % 86400) / 3600);
  const mins = Math.floor((diff % 3600) / 60);

  if (days > 0) return `${days}d ${hours}h left`;
  if (hours > 0) return `${hours}h ${mins}m left`;
  return `${mins}m left`;
}

/**
 * Metacritic score tier
 */
export function metacriticTier(score) {
  const n = parseInt(score);
  if (isNaN(n) || n === 0) return null;
  if (n >= 75) return 'high';
  if (n >= 50) return 'mid';
  return 'low';
}

/**
 * Truncate text
 */
export function truncate(str, maxLen = 60) {
  if (!str || str.length <= maxLen) return str || '';
  return str.slice(0, maxLen).trim() + '…';
}
