export default function SearchBar({
    value,
    onChange,
    status,
    onSurpriseMe,
    recentSearches = [],
    onSelectRecent,
    favorites = [],
    onToggleFavorite,
    isFavorite = false,
    hasCurrentCountry = false,
}) {
    return (
        <div className="search-dock-wrap">
            <div className="search-dock">
                <span className="search-dock-icon">🔍</span>
                <input
                    className="search-dock-input"
                    type="text"
                    placeholder="Search any country or capital (e.g. Japan, Oslo, Brazil)..."
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    autoFocus
                    spellCheck={false}
                />

                {status === 'loading' && <span className="spinner" aria-label="Loading" />}

                <div className="search-dock-actions">
                    {value && (
                        <button
                            className="dock-btn"
                            onClick={() => onChange('')}
                            title="Clear search"
                            style={{ padding: '0 0.5rem' }}
                        >
                            ✕
                        </button>
                    )}

                    {hasCurrentCountry && (
                        <button
                            className={`dock-btn dock-fav-btn ${isFavorite ? 'is-active' : ''}`}
                            onClick={onToggleFavorite}
                            title={isFavorite ? 'Remove from favorites' : 'Pin to favorites'}
                            aria-label="Toggle favorite"
                        >
                            <span>{isFavorite ? '★' : '☆'}</span>
                            <span style={{ fontSize: '0.78rem' }}>{isFavorite ? 'Saved' : 'Save'}</span>
                        </button>
                    )}

                    <button
                        className="dock-btn dock-dice-btn"
                        onClick={onSurpriseMe}
                        title="Discover a random nation! 🎲"
                        aria-label="Surprise me"
                    >
                        <span>🎲</span>
                        <span>Surprise Me</span>
                    </button>
                </div>
            </div>

            {/* Quick Access Strip: Favorites and Recent Searches */}
            {(favorites.length > 0 || recentSearches.length > 0) && (
                <div className="quick-access-strip">
                    {favorites.length > 0 && (
                        <div className="quick-group">
                            <span className="quick-label">★ Saved:</span>
                            <div className="quick-chips">
                                {favorites.map((fav) => (
                                    <button
                                        key={`fav-${fav}`}
                                        className="quick-chip fav-chip"
                                        onClick={() => onSelectRecent(fav)}
                                    >
                                        ★ {fav}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {recentSearches.length > 0 && (
                        <div className="quick-group">
                            <span className="quick-label">Recent:</span>
                            <div className="quick-chips">
                                {recentSearches.map((rec) => (
                                    <button
                                        key={`rec-${rec}`}
                                        className="quick-chip"
                                        onClick={() => onSelectRecent(rec)}
                                    >
                                        {rec}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
