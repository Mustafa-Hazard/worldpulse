# WorldPulse

> Live weather, atmospheric telemetry & country intelligence for any nation on Earth. No API key. No backend. Just open it.

Combines high-fidelity country intelligence, **Open-Meteo** (weather & air quality), **OpenStreetMap** (Leaflet geo-radar), and live exchange rates into an interactive, zero-auth global command center.

---

## Quick Start

### Requirements
- **Node.js**: >= 18
- **npm**: >= 9

```bash
git clone https://github.com/Mustafa-Hazard/worldpulse
cd worldpulse
npm install
npm run dev
```

Open **http://localhost:5173** in your browser.

> [!TIP]
> **Windows + WSL Users**: Always run `npm run dev` inside your WSL Ubuntu shell (e.g. `wsl` → `cd ~/worldpulse` → `npm run dev`), not in Windows PowerShell directly against the UNC network path.

To create a production build:
```bash
npm run build
npm run preview
```

No `.env` file needed. All data sources are public and require zero API credentials.

---

## Core Features & Intelligence

### 1. 🌍 Instant Country Intelligence (0ms Latency)
- Multi-tier search (exact, prefix, and fuzzy contains) across 250 nations.
- Offline-ready and immune to external API deprecations.
- High-resolution SVG flags via `flagcdn.com`.
- Demographics, territory, languages, currencies, and capital cities.

### 2. 🗺️ Interactive OpenStreetMap (OSM) Geo-Radar
- Embedded interactive Leaflet mapping with smooth pan/zoom fly-to navigation.
- **Dual Tile Styles**: Switch between stealth **Dark Matter** (CartoDB) and **OpenStreetMap Standard** tiles.
- Animated pulsating radar beacon pinned directly to the capital city.

### 3. 🕒 Live Capital World Clock & Day/Night Status
- Real-time digital clock (HH:MM:SS) synchronized with the country's local timezone.
- Dynamic **☀️ Day** or **🌙 Night** status indicator computed from live solar telemetry.

### 4. 🫁 Real-Time Air Quality Index (AQI)
- Powered by Open-Meteo's Air Quality API (zero auth).
- Live US AQI rating score (**Good**, **Moderate**, **Unhealthy**, etc.).
- Fine particulate matter: **PM2.5** and **PM10** readings (μg/m³).

### 5. 💱 Real-Time Currency Calculator
- Instant exchange rate conversion between USD and the country's official currency.
- Live exchange rate feed powered by open exchange rates with zero API keys.

### 6. ⚔️ "Compare Nations" Duel Mode
- Side-by-side comparative analysis of any two nations:
  - **Temperature Delta**: Live temperature difference (e.g. `Δ 12°C`).
  - **Demographics Ratio**: Population multiplier (e.g. `2.4x larger`).
  - **Territory Comparison**: Land mass comparison in km².
  - **Air Quality Comparison**: Side-by-side AQI ratings.
  - **1-Click Hop**: Direct navigation to explore the compared nation.

### 7. 🌡️ Atmospheric Command Center & Unit Switch
- Giant temperature reading with live feels-like index and condition icons.
- **UV Index Spectrum Bar**: Colored progress track (Low to Extreme) with active position needle.
- **Solar Cycle**: Sunrise 🌅 and Sunset 🌇 times in local capital time.
- **Wind Telemetry**: Compass direction badge (e.g. `🧭 NNW`) with velocity.
- **Global Unit Switcher**: Toggle between Metric (`°C`, `km/h`, `mm`) and Imperial (`°F`, `mph`, `in`).

### 8. 📈 24-Hour Horizon & 7-Day Trajectory
- **24-Hour Hourly Strip**: Horizontally scrollable timeline with condition emojis, temperatures, and rain probability badges (`💧 40%`).
- **7-Day Climate Projection**: Dual glowing area chart with Recharts, custom glass tooltips, and weather condition tags.

### 9. 🔗 URL Deep Linking & 1-Click Share
- Search queries and active countries are synced with the browser URL (`?country=Japan`).
- Clicking **🔗 Share** copies the direct link to your clipboard with a confirmation toast.
- Shared links automatically load the destination nation upon opening.

### 10. ⚡ Persistent LRU Cache & Telemetry Drawer
- In-memory LRU cache (50 entries, 5-minute TTL) backed by `localStorage` persistence across reloads (`WORLDPULSE_CACHE_V1`).
- **In-flight request deduplication**: Concurrent requests for the same key fire exactly one network call.
- **Exponential backoff retry**: Automatically retries transient network errors (150ms, 300ms).
- **Interactive Cache Inspector**: Click the bottom-right `LRU Cache` pill to view stored keys, TTL countdowns, hit rates, or purge cache entries.

### 11. ⌨️ Power-User Keyboard Shortcuts
| Shortcut | Action |
| :--- | :--- |
| **`/`** or **`Ctrl + K`** | Focus search dock |
| **`R`** | Trigger "Surprise Me 🎲" random nation |
| **`C`** | Toggle temperature scale (`°C` ↔ `°F`) |
| **`Esc`** | Dismiss modals or clear search |

---

## Project Structure

```
src/
  data/
    countriesData.json     <- bundled high-fidelity dataset (250 nations, zero-auth)
  lib/
    cache.js               <- LRU cache with TTL, deduplication & localStorage persistence
    api.js                 <- country search, Open-Meteo, AQI, exchange rates, retries
  hooks/
    useCountry.js          <- debounced search, race condition guard
  components/
    SearchBar.jsx          <- command dock, favorites, random dice
    CountryCard.jsx        <- identity HUD, capital clock, borders, share & compare
    CountryMap.jsx         <- OpenStreetMap / Leaflet geo-radar with dark matter tiles
    WeatherPanel.jsx       <- live atmosphere, AQI, UV spectrum, sun cycle, wind compass
    CurrencyConverter.jsx  <- real-time currency exchange calculator
    CompareModal.jsx       <- side-by-side nations comparison duel
    HourlyForecast.jsx     <- 24-hour horizontal trajectory strip
    ForecastChart.jsx      <- 7-day Recharts area chart with unit conversion
    StatusMessage.jsx      <- error notifications
    CacheDebug.jsx         <- live telemetry pill & cache inspector modal
  App.jsx                  <- layout orchestration, URL deep linking, shortcuts
  index.css                <- stealth obsidian & titanium design system
```

---

## Stack Rationale

- **React 19 + Vite**: Fast HMR, ultra-lightweight client-side bundle, zero server overhead.
- **Leaflet + OpenStreetMap**: Zero-auth mapping with CartoDB Dark Matter tiles.
- **Recharts**: Responsive SVG dual-area forecast charts.
- **Plain JS Cache**: Framework-agnostic LRU cache with `localStorage` fallback and request deduplication.
