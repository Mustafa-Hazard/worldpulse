import { useState, useEffect } from 'react';
import { formatPopulation, formatArea } from '../lib/api.js';
import CurrencyConverter from './CurrencyConverter.jsx';

export default function CountryCard({ country, weather, onSelectCountry, onOpenCompare }) {
    const [currentTime, setCurrentTime] = useState('');
    const [copied, setCopied] = useState(false);

    useEffect(() => {
        const updateTime = () => {
            const tz = weather?.timezone;
            try {
                const now = new Date();
                const options = {
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit',
                    hour12: false,
                    ...(tz ? { timeZone: tz } : {}),
                };
                setCurrentTime(new Intl.DateTimeFormat('en-US', options).format(now));
            } catch {
                setCurrentTime('');
            }
        };

        updateTime();
        const interval = setInterval(updateTime, 1000);
        return () => clearInterval(interval);
    }, [weather?.timezone]);

    const handleShare = () => {
        const url = `${window.location.origin}${window.location.pathname}?country=${encodeURIComponent(country.name.common)}`;
        navigator.clipboard.writeText(url).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }).catch(() => {});
    };

    const languages = Object.values(country.languages ?? {}).join(', ') || 'N/A';
    const capital = country.capital?.[0] ?? 'N/A';
    const isDay = weather?.current?.is_day;
    const borders = country.resolvedBorders || [];
    const lat = country.latlng?.[0]?.toFixed(1) ?? '0.0';
    const lng = country.latlng?.[1]?.toFixed(1) ?? '0.0';

    return (
        <div className="hud-card country-hud">
            {/* Header / Flag & Identity Banner */}
            <div className="country-hero-banner">
                <div className="flag-emblem-wrap">
                    <img
                        className="flag-emblem"
                        src={country.flags?.svg}
                        alt={`Flag of ${country.name.common}`}
                        loading="lazy"
                    />
                </div>
                <div className="country-details-col">
                    <div className="country-title-row">
                        <h2 className="country-common-name">{country.name.common}</h2>
                        {isDay !== undefined && (
                            <span className={`day-night-badge ${isDay ? 'is-day' : 'is-night'}`}>
                                {isDay ? '☀️ Day' : '🌙 Night'}
                            </span>
                        )}

                        <div className="country-action-btns">
                            <button
                                className="icon-action-btn"
                                onClick={onOpenCompare}
                                title="Compare with another nation ⚔️"
                            >
                                ⚔️ Compare
                            </button>
                            <button
                                className="icon-action-btn"
                                onClick={handleShare}
                                title="Copy shareable link to clipboard"
                            >
                                {copied ? '✓ Copied' : '🔗 Share'}
                            </button>
                        </div>
                    </div>

                    <p className="country-official-name" title={country.name.official}>
                        {country.name.official}
                    </p>

                    {/* Holographic Capital Clock */}
                    {currentTime && (
                        <div className="clock-strip" title="Live capital time">
                            <span className="clock-icon">🕒</span>
                            <span className="clock-digital-time">{currentTime}</span>
                            <span className="clock-tz-name">
                                {capital} · {weather?.timezone?.split('/')[1]?.replace(/_/g, ' ') || 'Local'}
                            </span>
                        </div>
                    )}
                </div>
            </div>

            {/* Telemetry Pods Grid */}
            <div className="telemetry-pods-grid">
                <div className="telemetry-pod">
                    <div className="pod-header">
                        <span className="pod-icon">🏛️</span>
                        <span className="pod-label">Capital</span>
                    </div>
                    <span className="pod-value">{capital}</span>
                </div>

                <div className="telemetry-pod">
                    <div className="pod-header">
                        <span className="pod-icon">👥</span>
                        <span className="pod-label">Population</span>
                    </div>
                    <span className="pod-value">{formatPopulation(country.population)}</span>
                </div>

                <div className="telemetry-pod">
                    <div className="pod-header">
                        <span className="pod-icon">🗺️</span>
                        <span className="pod-label">Territory</span>
                    </div>
                    <span className="pod-value">{formatArea(country.area)}</span>
                </div>

                <div className="telemetry-pod">
                    <div className="pod-header">
                        <span className="pod-icon">💬</span>
                        <span className="pod-label">Languages</span>
                    </div>
                    <span className="pod-value" title={languages}>{languages}</span>
                </div>

                <div className="telemetry-pod">
                    <div className="pod-header">
                        <span className="pod-icon">📍</span>
                        <span className="pod-label">Coordinates</span>
                    </div>
                    <span className="pod-value">{lat}°, {lng}°</span>
                </div>

                {/* Live Currency Converter Pod */}
                <CurrencyConverter currencies={country.currencies} />
            </div>

            {/* Bordering Nations Constellation */}
            <div className="borders-dock">
                <div className="borders-dock-header">
                    <span className="borders-title">
                        Bordering Nations ({borders.length})
                    </span>
                </div>

                {borders.length > 0 ? (
                    <div className="borders-chips-list">
                        {borders.map((b) => (
                            <button
                                key={b.cca3}
                                className="border-pill-btn"
                                onClick={() => onSelectCountry(b.name)}
                                title={`Navigate to ${b.name}`}
                            >
                                {b.flag && <img src={b.flag} alt="" className="border-mini-flag" />}
                                <span>{b.name}</span>
                                <span style={{ opacity: 0.4 }}>→</span>
                            </button>
                        ))}
                    </div>
                ) : (
                    <p className="no-borders-msg">🌊 Island nation or territory — no land borders.</p>
                )}
            </div>
        </div>
    );
}
