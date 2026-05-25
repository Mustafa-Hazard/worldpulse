import { useState, useEffect } from 'react';
import { cache } from '../lib/cache.js';

export default function CacheDebug() {
    const [stats, setStats] = useState({ size: 0, inflight: 0 });

    useEffect(() => {
        const interval = setInterval(() => {
            setStats({ size: cache.size, inflight: cache.inflightCount });
        }, 500);
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="cache-debug" title="Live LRU cache stats">
            <span className="cache-debug-label">Cache</span>
            <span className="cache-pill">{stats.size} entries</span>
            {stats.inflight > 0 && (
                <span className="cache-pill cache-pill-active">{stats.inflight} in-flight</span>
            )}
        </div>
    );
}