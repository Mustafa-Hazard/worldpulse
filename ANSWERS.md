# ANSWERS.md

## 1. How to run

Requirements: Node.js >= 18, npm.

```bash
git clone https://github.com/Mustafa-Hazard/worldpulse
cd worldpulse
npm install
npm run dev
```

Open http://localhost:5173 in your browser.

No API keys, no .env, no backend. Both APIs (REST Countries, Open-Meteo) are fully public.

To run the production build: `npm run build && npm run preview`

---

## 2. Stack choice

**React + Vite.** The app is entirely client-side — there is no auth, no secrets, no server-side logic needed. Vite's dev server starts in under a second and the HMR loop is fast enough that I am not fighting tooling while building. React's component model made it natural to isolate the cache debug widget, the weather panel, and the forecast chart into pieces I could reason about independently.

The cache and deduplication logic in src/lib/cache.js is plain JavaScript — no framework dependency — which means it could be dropped into a Node CLI or a different frontend with zero changes.

**A worse choice:** Next.js. There is no SSR story here — the data is live weather for a user-selected country, so pre-rendering buys nothing. The extra complexity (server components, routing conventions, deployment requirements) would be overhead for a problem that does not need it. Plain vanilla JS with no bundler would also have been worse: managing module imports across 7 files without hot reload or tree-shaking is friction that does not make the code better.

---

## 3. One real edge case

**Race conditions on fast sequential searches.**

File: `src/hooks/useCountry.js`, lines 19-20 and 34-35.

```js
const latestQueryRef = useRef('');
// ...
latestQueryRef.current = q; // set before async call
// ...
if (latestQueryRef.current !== q) return; // discard stale result
```

If a user types "ger" then "germ" then "germany" quickly, three async requests are in-flight simultaneously. Without this guard, whichever resolves last wins — not whichever was fired last. So a slow "ger" response landing after a fast "germany" response would overwrite the correct result with stale data.

The ref is updated synchronously before every fetch. When a response comes back, it checks whether the ref still matches the query it was fired with. If not, the result is silently dropped.

Without this: the UI could render the wrong country. That is a subtle, hard-to-reproduce bug that only appears under network latency.

---

## 4. AI usage

I used Claude (Anthropic) during this build.

**Where I used it:**

1. **Initial structure of cache.js** — I asked for an LRU cache implementation in vanilla JS using a Map. It gave me a clean version with get/set/evict. I changed two things: (a) I added the fetchOnce method with in-flight deduplication myself — the AI did not suggest this, and it is the part that actually solves the real problem; (b) the AI used an array-based approach for tracking insertion order which is O(n) for eviction. I switched to using Map's built-in insertion-order preservation, which makes eviction O(1) — just call keys().next().value to get the oldest entry.

2. **WMO weather code mapping** — Open-Meteo returns numeric codes per the WMO standard. I asked Claude to generate the lookup table. I verified it against the Open-Meteo docs and corrected a few entries.

3. **Recharts AreaChart setup** — I asked for an example with dual areas and a custom tooltip. The output worked but used a class component. I converted it to a function component with hooks since that is what the rest of the codebase uses.

**Something I changed and why:**

The original fetchOnce suggestion from AI used the raw URL as the cache key. I changed it to use domain-specific keys like `countries:search:germany` and `weather:35.68:139.69`. The weather key truncates coords to 2 decimal places — two countries whose capitals are within roughly 1km share a cache entry rather than firing redundant requests for essentially the same data.

---

## 5. Honest gap

The LRU cache stores data in memory, so it is wiped on every page reload. For a deployed app with real users, the first visitor after a deployment always hits the network cold.

The fix I would implement with another day: a localStorage-backed persistence layer with the same TTL logic. On startup, hydrate the in-memory cache from localStorage. On cache writes, serialize to localStorage in the background (non-blocking). The tricky part is versioning — if the API response shape changes, stale localStorage entries need to be invalidated. I would solve that with a cache schema version key: if the stored version does not match the app version, wipe the store on boot.

A secondary gap: there is no retry logic. If a request fails due to a transient network error, the user sees an error and has to search again manually. One retry with exponential backoff (150ms, 300ms) would cover most transient failures invisibly.