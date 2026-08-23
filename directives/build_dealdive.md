# DealDive — Build & Maintain SOP

## Overview
DealDive is a premium game deals aggregator built with Vite + vanilla JS, using the CheapShark API.

## Tech Stack
- **Build tool:** Vite (vanilla template)
- **Styles:** Vanilla CSS with custom properties (design tokens)
- **Fonts:** Sora (display), Inter (body), IBM Plex Mono (prices) via Google Fonts
- **API:** CheapShark (free, no key required)
- **State:** In-memory (filters, pagination) + localStorage (wishlist)

## Key Commands
```bash
npm run dev      # Start dev server (localhost:5173)
npm run build    # Production build → dist/
npm run preview  # Preview production build
```

## CheapShark API
- **Base URL:** `https://www.cheapshark.com/api/1.0`
- **No API key needed**
- **Endpoints used:**
  - `GET /deals` — list deals with filters (store, price, sort, etc.)
  - `GET /stores` — list of active stores
  - `GET /games?title=...` — search games by title
  - `GET /games?id=...` — game details with all deals
- **Redirect links:** `https://www.cheapshark.com/redirect?dealID=...` — always use these when linking to stores (CheapShark policy)
- **Images:** Use Steam CDN for high-res images: `https://cdn.akamai.steamstatic.com/steam/apps/{steamAppID}/header.jpg` and `library_hero.jpg`
- **Rate limits:** Be respectful, cache responses (5-minute TTL in app)

## Design System
All design tokens in `src/styles/variables.css`:
- Colors: cream bg (#F6F6F2), dark text (#111), lime accent (#B8F23D), sale red (#FF5B55)
- Typography: Sora for headlines (tight tracking, bold), Inter for body, IBM Plex Mono for prices
- Radius: 8-12px, no excessive shadows
- Transitions: 300-600ms with custom easing

## Architecture
```
src/
├── main.js              # Entry point, orchestration
├── api/cheapshark.js    # API client with caching
├── components/          # UI components (header, hero, filters, dealCard, dealGrid, search, wishlist)
├── styles/              # CSS (variables, reset, base, components, animations)
└── utils/               # DOM helpers, formatting utilities
```

## Common Tasks

### Adding a new filter
1. Add filter state to `src/components/filters.js` → `activeFilters`
2. Map to CheapShark API param in `src/components/dealGrid.js` → `loadDeals()`
3. Add UI chip/dropdown in `renderFilterBar()`

### Changing color palette
1. Update CSS custom properties in `src/styles/variables.css`
2. All components reference tokens, so changes propagate automatically

### Adding a new API endpoint
1. Add function to `src/api/cheapshark.js`
2. Uses shared `request()` helper with caching built in

## Edge Cases Learned
- Some games lack steamAppID — fallback to CheapShark `thumb` URL
- CheapShark `savings` is a string percentage (e.g., "86.493"), needs parseFloat + Math.round
- Store `images.icon` paths are relative — prepend `https://www.cheapshark.com`
- Free games: salePrice === "0.00", normalPrice may be > 0 (temporary free) or also 0
