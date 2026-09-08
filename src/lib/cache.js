/**
 * LRU Cache with TTL, in-flight request deduplication, and localStorage persistence.
 *
 * Solves:
 * 1. Repeated lookups skip the network entirely (LRU eviction + TTL expiration).
 * 2. In-flight deduplication: concurrent requests for the same key await one shared Promise.
 * 3. LocalStorage persistence: survives page reloads with schema versioning.
 * 4. Hit/miss telemetry & inspection helpers for the Cache Inspector UI.
 */

const DEFAULT_TTL_MS = 5 * 60 * 1000; // 5 minutes
const DEFAULT_MAX_SIZE = 50;
const STORAGE_KEY = 'WORLDPULSE_CACHE_V1';

export class LRUCache {
    constructor({ maxSize = DEFAULT_MAX_SIZE, ttl = DEFAULT_TTL_MS } = {}) {
        this.maxSize = maxSize;
        this.ttl = ttl;
        this.store = new Map();
        this.inflight = new Map();
        this.hits = 0;
        this.misses = 0;

        this._hydrateFromStorage();
    }

    _isExpired(entry) {
        return Date.now() - entry.timestamp > this.ttl;
    }

    _evictIfFull() {
        if (this.store.size >= this.maxSize) {
            const oldest = this.store.keys().next().value;
            this.store.delete(oldest);
        }
    }

    _hydrateFromStorage() {
        if (typeof window === 'undefined' || !window.localStorage) return;
        try {
            const raw = localStorage.getItem(STORAGE_KEY);
            if (!raw) return;
            const parsed = JSON.parse(raw);
            if (!Array.isArray(parsed.entries)) return;

            const now = Date.now();
            for (const [key, entry] of parsed.entries) {
                if (entry && entry.timestamp && (now - entry.timestamp < this.ttl)) {
                    this.store.set(key, entry);
                }
            }
        } catch (err) {
            // If storage is corrupted or invalid, clear gracefully
            try {
                localStorage.removeItem(STORAGE_KEY);
            } catch (clearErr) {
                void clearErr;
            }
            void err;
        }
    }

    _saveToStorage() {
        if (typeof window === 'undefined' || !window.localStorage) return;
        try {
            const entries = Array.from(this.store.entries());
            localStorage.setItem(STORAGE_KEY, JSON.stringify({
                version: 1,
                savedAt: Date.now(),
                entries,
            }));
        } catch (err) {
            // Storage quota exceeded or blocked — continue in-memory silently
            void err;
        }
    }

    get(key) {
        const entry = this.store.get(key);
        if (!entry) {
            this.misses++;
            return null;
        }
        if (this._isExpired(entry)) {
            this.store.delete(key);
            this._saveToStorage();
            this.misses++;
            return null;
        }
        // Refresh position for LRU
        this.store.delete(key);
        this.store.set(key, entry);
        this.hits++;
        return entry.value;
    }

    set(key, value) {
        this._evictIfFull();
        this.store.set(key, { value, timestamp: Date.now() });
        this._saveToStorage();
    }

    clear() {
        this.store.clear();
        this.inflight.clear();
        this.hits = 0;
        this.misses = 0;
        if (typeof window !== 'undefined' && window.localStorage) {
            try {
                localStorage.removeItem(STORAGE_KEY);
            } catch (err) {
                void err;
            }
        }
    }

    async fetchOnce(key, fetchFn) {
        const cached = this.get(key);
        if (cached !== null) return cached;

        if (this.inflight.has(key)) {
            return this.inflight.get(key);
        }

        const promise = fetchFn()
            .then((result) => {
                this.set(key, result);
                this.inflight.delete(key);
                return result;
            })
            .catch((err) => {
                this.inflight.delete(key);
                throw err;
            });

        this.inflight.set(key, promise);
        return promise;
    }

    get size() {
        return this.store.size;
    }

    get inflightCount() {
        return this.inflight.size;
    }

    getStats() {
        return {
            size: this.store.size,
            maxSize: this.maxSize,
            inflight: this.inflight.size,
            hits: this.hits,
            misses: this.misses,
            hitRate: this.hits + this.misses > 0 
                ? Math.round((this.hits / (this.hits + this.misses)) * 100) 
                : 0,
        };
    }

    getEntries() {
        const now = Date.now();
        return Array.from(this.store.entries()).map(([key, entry]) => ({
            key,
            ageMs: now - entry.timestamp,
            expiresInMs: Math.max(0, this.ttl - (now - entry.timestamp)),
            timestamp: entry.timestamp,
        }));
    }
}

export const cache = new LRUCache();
