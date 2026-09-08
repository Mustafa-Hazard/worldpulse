import { useState, useEffect } from 'react';
import { cache } from '../lib/cache.js';

export default function CacheDebug() {
    const [stats, setStats] = useState({ size: 0, inflight: 0, hits: 0, misses: 0, hitRate: 0 });
    const [isOpen, setIsOpen] = useState(false);
    const [entries, setEntries] = useState([]);

    useEffect(() => {
        const update = () => {
            setStats(cache.getStats());
            if (isOpen) {
                setEntries(cache.getEntries());
            }
        };

        update();
        const interval = setInterval(update, 600);
        return () => clearInterval(interval);
    }, [isOpen]);

    const handleClear = () => {
        cache.clear();
        setStats(cache.getStats());
        setEntries([]);
    };

    const formatDuration = (ms) => {
        const s = Math.floor(ms / 1000);
        if (s < 60) return `${s}s`;
        const m = Math.floor(s / 60);
        return `${m}m ${s % 60}s`;
    };

    return (
        <>
            <button
                className="cache-telemetry-pill"
                onClick={() => setIsOpen(true)}
                title="Open Cache Inspector & LRU Telemetry"
                aria-label="Open Cache Inspector"
            >
                <span className="radar-dot" />
                <span style={{ color: '#94a3b8', fontWeight: 600 }}>LRU Cache</span>
                <span className="cache-pill-data">{stats.size} items</span>
                {stats.hits > 0 && (
                    <span className="cache-pill-data cache-pill-hit">{stats.hitRate}% hit</span>
                )}
                {stats.inflight > 0 && (
                    <span className="cache-pill-data cache-pill-inflight">{stats.inflight} active</span>
                )}
            </button>

            {isOpen && (
                <div className="telemetry-modal-overlay" onClick={() => setIsOpen(false)}>
                    <div className="telemetry-modal-box" onClick={(e) => e.stopPropagation()}>
                        <div className="telemetry-modal-header">
                            <div>
                                <h3 className="telemetry-modal-title">LRU Telemetry & Cache Inspector</h3>
                                <p className="telemetry-modal-sub">
                                    5-min TTL · LocalStorage Persistence · In-flight Request Deduplication
                                </p>
                            </div>
                            <button
                                className="modal-close-btn"
                                onClick={() => setIsOpen(false)}
                                aria-label="Close modal"
                            >
                                ✕
                            </button>
                        </div>

                        <div className="telemetry-stats-row">
                            <div className="telemetry-stat-tile">
                                <span className="tstat-label">Stored Entries</span>
                                <span className="tstat-value">{stats.size} / {stats.maxSize || 50}</span>
                            </div>
                            <div className="telemetry-stat-tile">
                                <span className="tstat-label">Hit Ratio</span>
                                <span className="tstat-value">{stats.hitRate}%</span>
                            </div>
                            <div className="telemetry-stat-tile">
                                <span className="tstat-label">Cache Hits</span>
                                <span className="tstat-value">{stats.hits}</span>
                            </div>
                            <div className="telemetry-stat-tile">
                                <span className="tstat-label">Cache Misses</span>
                                <span className="tstat-value">{stats.misses}</span>
                            </div>
                        </div>

                        <div className="modal-entries-section">
                            <div className="entries-header">
                                <span className="entries-title">Active Keys in Store ({entries.length})</span>
                                <button className="purge-btn" onClick={handleClear}>
                                    Purge Cache
                                </button>
                            </div>

                            {entries.length === 0 ? (
                                <p className="entries-empty">No active keys in cache. Perform a lookup to populate.</p>
                            ) : (
                                <div className="entries-list">
                                    {entries.map((entry) => (
                                        <div key={entry.key} className="entry-row">
                                            <span className="entry-key" title={entry.key}>{entry.key}</span>
                                            <div className="entry-meta">
                                                <span className="entry-age">{formatDuration(entry.ageMs)} old</span>
                                                <span className="entry-ttl">TTL: {formatDuration(entry.expiresInMs)}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
