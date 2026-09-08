import { useState, useEffect, useRef, useMemo } from 'react';
import { getCountrySuggestions } from '../lib/api.js';

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
    const [isDismissed, setIsDismissed] = useState(false);
    const [isFocused, setIsFocused] = useState(false);
    const [selectedIndex, setSelectedIndex] = useState(-1);
    const wrapperRef = useRef(null);
    const inputRef = useRef(null);

    // Compute suggestions synchronously during render using useMemo (no setState in effect)
    const suggestions = useMemo(() => {
        if (!value || value.trim().length < 1) return [];
        return getCountrySuggestions(value, 7);
    }, [value]);

    const isOpen = isFocused && !isDismissed && suggestions.length > 0;

    // Reset dismissal when user types something new
    const handleInputChange = (e) => {
        setIsDismissed(false);
        setSelectedIndex(-1);
        onChange(e.target.value);
    };

    // Close dropdown on click outside
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
                setIsFocused(false);
                setIsDismissed(true);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleSelect = (countryName) => {
        onChange(countryName);
        setIsDismissed(true);
        setIsFocused(false);
        setSelectedIndex(-1);
        if (inputRef.current) inputRef.current.blur();
    };

    const handleKeyDown = (e) => {
        if (!isOpen || suggestions.length === 0) return;

        if (e.key === 'ArrowDown') {
            e.preventDefault();
            setSelectedIndex((prev) => (prev + 1) % suggestions.length);
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setSelectedIndex((prev) => (prev - 1 + suggestions.length) % suggestions.length);
        } else if (e.key === 'Enter') {
            if (selectedIndex >= 0 && suggestions[selectedIndex]) {
                e.preventDefault();
                handleSelect(suggestions[selectedIndex].name);
            } else {
                setIsDismissed(true);
            }
        } else if (e.key === 'Escape') {
            setIsDismissed(true);
            setSelectedIndex(-1);
        }
    };

    return (
        <div className="search-dock-wrap" ref={wrapperRef}>
            <div className="search-dock-container" style={{ position: 'relative', width: '100%' }}>
                <div className="search-dock">
                    <span className="search-dock-icon">🔍</span>
                    <input
                        ref={inputRef}
                        className="search-dock-input"
                        type="text"
                        placeholder="Search any country or capital (e.g. Japan, Oslo, Brazil)..."
                        value={value}
                        onChange={handleInputChange}
                        onFocus={() => {
                            setIsFocused(true);
                            setIsDismissed(false);
                        }}
                        onKeyDown={handleKeyDown}
                        autoFocus
                        spellCheck={false}
                    />

                    {status === 'loading' && <span className="spinner" aria-label="Loading" />}

                    <div className="search-dock-actions">
                        {value && (
                            <button
                                className="dock-btn"
                                onClick={() => {
                                    onChange('');
                                    setIsDismissed(true);
                                }}
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
                            onClick={() => {
                                setIsDismissed(true);
                                onSurpriseMe();
                            }}
                            title="Discover a random nation! 🎲"
                            aria-label="Surprise me"
                        >
                            <span>🎲</span>
                            <span>Surprise Me</span>
                        </button>
                    </div>
                </div>

                {/* Floating Autocomplete Suggestions Dropdown */}
                {isOpen && (
                    <div className="search-suggestions-dropdown" role="listbox">
                        <div className="suggestions-header">
                            <span>Matching Nations ({suggestions.length})</span>
                            <span className="suggestions-kbd-hint">Use ↑↓ keys to navigate, ↵ to select</span>
                        </div>

                        <div className="suggestions-list">
                            {suggestions.map((item, idx) => (
                                <div
                                    key={item.cca3 || item.name}
                                    className={`suggestion-item ${idx === selectedIndex ? 'is-selected' : ''}`}
                                    onClick={() => handleSelect(item.name)}
                                    onMouseEnter={() => setSelectedIndex(idx)}
                                    role="option"
                                    aria-selected={idx === selectedIndex}
                                >
                                    <div className="suggestion-left">
                                        {item.flag && (
                                            <img src={item.flag} alt="" className="suggestion-flag" />
                                        )}
                                        <div className="suggestion-text">
                                            <span className="suggestion-name">{item.name}</span>
                                            {item.capital && (
                                                <span className="suggestion-sub">
                                                    Capital: {item.capital} · {item.region}
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    <span className="suggestion-hint">Select ↵</span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
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
                                        onClick={() => {
                                            setIsDismissed(true);
                                            onSelectRecent(fav);
                                        }}
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
                                        onClick={() => {
                                            setIsDismissed(true);
                                            onSelectRecent(rec);
                                        }}
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
