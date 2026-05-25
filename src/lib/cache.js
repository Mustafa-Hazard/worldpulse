/**
 * LRU Cache with TTL and in-flight request deduplication.
 *
 * Two problems solved here:
 * 1. Repeated lookups for the same country skip the network entirely (LRU eviction).
 * 2. If two components request the same key simultaneously before the first resolves,
 *    only ONE HTTP request is made — the second caller awaits the same Promise.
 */

const DEFAULT_TTL_MS = 5 * 60 * 1000; // 5 minutes
const DEFAULT_MAX_SIZE = 50;

class LRUCache {
    constructor({ maxSize = DEFAULT_MAX_SIZE, ttl = DEFAULT_TTL_MS } = {}) {
        this.maxSize = maxSize;
        this.ttl = ttl;
        this.store = new Map();
        this.inflight = new Map();
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

    get(key) {
        const entry = this.store.get(key);
        if (!entry) return null;
        if (this._isExpired(entry)) {
            this.store.delete(key);
            return null;
        }
        this.store.delete(key);
        this.store.set(key, entry);
        return entry.value;
    }

    set(key, value) {
        this._evictIfFull();
        this.store.set(key, { value, timestamp: Date.now() });
    }

    async fetchOnce(key, fetchFn) {
        const cached = this.get(key);
        if (cached !== null) return cached;

        if (this.inflight.has(key)) {
            return this.inflight.get(key);
        }

        const promise = fetchFn().then((result) => {
            this.set(key, result);
            this.inflight.delete(key);
            return result;
        }).catch((err) => {
            this.inflight.delete(key);
            throw err;
        });

        this.inflight.set(key, promise);
        return promise;
    }

    get size() { return this.store.size; }
    get inflightCount() { return this.inflight.size; }
}

export const cache = new LRUCache();