# WorldPulse

> Live weather + country intelligence for any nation on Earth. No API key. No backend. Just open it.

Combines **REST Countries API** and **Open-Meteo** (both free, no auth) to give you a full country profile and 7-day weather forecast in one search.

---

## Run it (fresh machine)

**Requirements:** Node.js >= 18

```bash
git clone <your-repo-url>
cd worldpulse
npm install
npm run dev
```

Open http://localhost:5173 in your browser.

To build for production:

```bash
npm run build
npm run preview
```

No `.env` file needed. Both APIs are public and require zero credentials.

---

## What it does

- Search any country by name (debounced, 400ms)
- Fetches country info + weather **in parallel** — not sequentially
- In-memory LRU cache (50 entries, 5-min TTL) — repeat searches skip the network entirely
- **Request deduplication** — two simultaneous requests for the same key fire exactly one HTTP call
- 8-second timeout on all fetches — a slow API won't hang the UI indefinitely
- If weather fails, country data still renders (graceful degradation)
- 7-day forecast chart
- Live cache stats widget in the bottom-right corner

---

## Stack

React + Vite. No backend. See ANSWERS.md for rationale.

---

## Project structure

```
src/
  lib/
    cache.js       <- LRU cache with TTL + request deduplication
    api.js         <- REST Countries + Open-Meteo, timeout, graceful degradation
  hooks/
    useCountry.js  <- debounced search, race condition guard
  components/
    SearchBar.jsx
    CountryCard.jsx
    WeatherPanel.jsx
    ForecastChart.jsx
    StatusMessage.jsx
    CacheDebug.jsx  <- live cache stats
  App.jsx
  index.css
```