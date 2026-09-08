import { useState, useEffect, useCallback } from 'react';
import { useCountry } from './hooks/useCountry.js';
import { getRandomCountry, describeWeatherCode } from './lib/api.js';
import SearchBar from './components/SearchBar.jsx';
import CountryCard from './components/CountryCard.jsx';
import WeatherPanel from './components/WeatherPanel.jsx';
import CountryMap from './components/CountryMap.jsx';
import HourlyForecast from './components/HourlyForecast.jsx';
import ForecastChart from './components/ForecastChart.jsx';
import CompareModal from './components/CompareModal.jsx';
import StatusMessage from './components/StatusMessage.jsx';
import CacheDebug from './components/CacheDebug.jsx';
import './index.css';

const TRENDING_DESTINATIONS = [
    { name: 'Japan', capital: 'Tokyo', flag: 'https://flagcdn.com/jp.svg', region: 'East Asia' },
    { name: 'Brazil', capital: 'Brasília', flag: 'https://flagcdn.com/br.svg', region: 'South America' },
    { name: 'Iceland', capital: 'Reykjavik', flag: 'https://flagcdn.com/is.svg', region: 'Nordic' },
    { name: 'Norway', capital: 'Oslo', flag: 'https://flagcdn.com/no.svg', region: 'Scandinavia' },
    { name: 'Egypt', capital: 'Cairo', flag: 'https://flagcdn.com/eg.svg', region: 'North Africa' },
    { name: 'Australia', capital: 'Canberra', flag: 'https://flagcdn.com/au.svg', region: 'Oceania' },
];

export default function App() {
    const { query, search, data, status, error } = useCountry();
    const [isCompareOpen, setIsCompareOpen] = useState(false);

    // Unit preference: 'C' or 'F'
    const [unit, setUnit] = useState(() => {
        try {
            return localStorage.getItem('worldpulse_unit') || 'C';
        } catch (err) {
            void err;
            return 'C';
        }
    });

    const setUnitPreference = useCallback((nextUnit) => {
        setUnit(nextUnit);
        try {
            localStorage.setItem('worldpulse_unit', nextUnit);
        } catch (err) {
            void err;
        }
    }, []);

    // Favorites: array of country common names
    const [favorites, setFavorites] = useState(() => {
        try {
            const saved = localStorage.getItem('worldpulse_favs');
            return saved ? JSON.parse(saved) : [];
        } catch (err) {
            void err;
            return [];
        }
    });

    // Recent searches: array of country common names
    const [recentSearches, setRecentSearches] = useState(() => {
        try {
            const saved = localStorage.getItem('worldpulse_recents');
            return saved ? JSON.parse(saved) : [];
        } catch (err) {
            void err;
            return [];
        }
    });

    // Deep linking: check ?country= in URL on initial mount
    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const countryParam = params.get('country') || params.get('q');
        if (countryParam && countryParam.trim().length >= 2) {
            search(countryParam.trim());
        }
    }, [search]);

    // Synchronize URL search params with active country & recents
    useEffect(() => {
        if (status === 'success' && data?.country?.name?.common) {
            const name = data.country.name.common;
            
            // Sync URL
            const url = new URL(window.location.href);
            url.searchParams.set('country', name);
            window.history.replaceState(null, '', url.toString());

            // Add to recent searches asynchronously
            const timer = setTimeout(() => {
                setRecentSearches((prev) => {
                    const filtered = prev.filter((item) => item.toLowerCase() !== name.toLowerCase());
                    const updated = [name, ...filtered].slice(0, 6);
                    try {
                        localStorage.setItem('worldpulse_recents', JSON.stringify(updated));
                    } catch (err) {
                        void err;
                    }
                    return updated;
                });
            }, 0);
            return () => clearTimeout(timer);
        }
    }, [status, data]);

    const currentCountryName = data?.country?.name?.common;
    const isFavorite = currentCountryName
        ? favorites.some((f) => f.toLowerCase() === currentCountryName.toLowerCase())
        : false;

    const toggleFavorite = useCallback(() => {
        if (!currentCountryName) return;
        setFavorites((prev) => {
            const exists = prev.some((f) => f.toLowerCase() === currentCountryName.toLowerCase());
            const updated = exists
                ? prev.filter((f) => f.toLowerCase() !== currentCountryName.toLowerCase())
                : [currentCountryName, ...prev].slice(0, 8);
            try {
                localStorage.setItem('worldpulse_favs', JSON.stringify(updated));
            } catch (err) {
                void err;
            }
            return updated;
        });
    }, [currentCountryName]);

    const handleSurpriseMe = useCallback(() => {
        const random = getRandomCountry();
        search(random);
    }, [search]);

    // Keyboard Shortcuts: '/' or Ctrl+K for search, 'R' for random, 'C' for unit, 'Esc' for clear
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT' || e.target.tagName === 'TEXTAREA') {
                if (e.key === 'Escape') {
                    e.target.blur();
                }
                return;
            }

            if (e.key === '/' || (e.ctrlKey && e.key === 'k') || (e.metaKey && e.key === 'k')) {
                e.preventDefault();
                const input = document.querySelector('.search-dock-input');
                if (input) input.focus();
            } else if (e.key === 'r' || e.key === 'R') {
                handleSurpriseMe();
            } else if (e.key === 'c' || e.key === 'C') {
                setUnitPreference(unit === 'C' ? 'F' : 'C');
            } else if (e.key === 'Escape') {
                setIsCompareOpen(false);
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [handleSurpriseMe, setUnitPreference, unit]);

    // Dynamic weather atmosphere class
    const weatherCode = data?.weather?.current?.weather_code;
    const isDay = data?.weather?.current?.is_day;
    const theme = weatherCode != null ? describeWeatherCode(weatherCode).theme : null;
    const themeClass = theme
        ? isDay === 0
            ? 'theme-night'
            : `theme-${theme}`
        : '';

    return (
        <div className={`app-root ${themeClass}`}>
            <div className="app">
                {/* Navbar */}
                <header className="header">
                    <nav className="nav-glass">
                        <div
                            className="nav-brand"
                            onClick={() => {
                                search('');
                                const url = new URL(window.location.href);
                                url.searchParams.delete('country');
                                url.searchParams.delete('q');
                                window.history.replaceState(null, '', url.toString());
                            }}
                        >
                            <div className="brand-globe">🌍</div>
                            <div className="brand-text-wrap">
                                <span className="brand-title">WorldPulse</span>
                                <span className="brand-live-tag">
                                    <span className="radar-dot" /> Live Global Feed
                                </span>
                            </div>
                        </div>

                        <div className="nav-actions">
                            <div className="unit-switch-pill" title="Press 'C' to toggle temperature scale">
                                <button
                                    className={`unit-switch-btn ${unit === 'C' ? 'active' : ''}`}
                                    onClick={() => setUnitPreference('C')}
                                >
                                    °C
                                </button>
                                <button
                                    className={`unit-switch-btn ${unit === 'F' ? 'active' : ''}`}
                                    onClick={() => setUnitPreference('F')}
                                >
                                    °F
                                </button>
                            </div>
                        </div>
                    </nav>
                </header>

                <main className="main">
                    {/* Search Dock */}
                    <SearchBar
                        value={query}
                        onChange={search}
                        status={status}
                        onSurpriseMe={handleSurpriseMe}
                        recentSearches={recentSearches}
                        onSelectRecent={search}
                        favorites={favorites}
                        onToggleFavorite={toggleFavorite}
                        isFavorite={isFavorite}
                        hasCurrentCountry={Boolean(currentCountryName)}
                    />

                    {/* Empty State: Trending Destinations Grid */}
                    {status === 'idle' && !data && (
                        <div className="hero-dock">
                            <div className="hero-text-wrap">
                                <span className="hero-eyebrow">Zero-Latency Country Intelligence</span>
                                <h1 className="hero-main-title">Explore Any Nation on Earth</h1>
                                <p className="hero-sub-title">
                                    Instant intelligence, OpenStreetMap geo-radar, live capital world clock & 7-day atmospheric forecast.
                                </p>
                            </div>

                            <div className="trending-grid">
                                {TRENDING_DESTINATIONS.map((dest) => (
                                    <button
                                        key={dest.name}
                                        className="trending-card"
                                        onClick={() => search(dest.name)}
                                    >
                                        <img src={dest.flag} alt="" className="trending-flag" />
                                        <span className="trending-name">{dest.name}</span>
                                        <span className="trending-tag">{dest.capital}</span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    <StatusMessage status={status} error={error} />

                    {/* Results Presentation */}
                    {status === 'success' && data && (
                        <div className="results-grid">
                            <div className="results-dual-column">
                                <CountryCard
                                    country={data.country}
                                    weather={data.weather}
                                    onSelectCountry={search}
                                    onOpenCompare={() => setIsCompareOpen(true)}
                                />
                                <WeatherPanel
                                    weather={data.weather}
                                    weatherError={data.weatherError}
                                    unit={unit}
                                    aqi={data.aqi}
                                    aqiError={data.aqiError}
                                />
                            </div>

                            {/* Interactive OpenStreetMap (OSM) / Dark Matter Radar */}
                            <CountryMap country={data.country} />

                            {/* 24-Hour Trajectory Strip */}
                            {data.weather?.hourly && (
                                <HourlyForecast hourly={data.weather.hourly} unit={unit} />
                            )}

                            {/* 7-Day Area Chart */}
                            {data.weather?.daily && (
                                <ForecastChart daily={data.weather.daily} unit={unit} />
                            )}

                            {/* Alternative Matches */}
                            {data.alternatives?.length > 0 && (
                                <div className="alt-matches-dock">
                                    <span className="hud-panel-title">
                                        Other Nations Matching "{query}"
                                    </span>
                                    <div className="alt-matches-list">
                                        {data.alternatives.map((c) => (
                                            <button
                                                key={c.cca3}
                                                className="alt-match-btn"
                                                onClick={() => search(c.name.common)}
                                            >
                                                {c.flags?.svg && (
                                                    <img src={c.flags.svg} alt="" className="alt-match-flag" />
                                                )}
                                                <span>{c.name.common}</span>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </main>

                <CacheDebug />

                {/* Compare Nations Duel Modal */}
                {isCompareOpen && data?.country && (
                    <CompareModal
                        country1={data.country}
                        weather1={data.weather}
                        aqi1={data.aqi}
                        unit={unit}
                        onClose={() => setIsCompareOpen(false)}
                        onSelectCountry={search}
                    />
                )}
            </div>
        </div>
    );
}
