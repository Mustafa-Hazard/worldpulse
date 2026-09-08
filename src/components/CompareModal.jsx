import { useState, useEffect } from 'react';
import { getAllCountriesList, getCountryData, convertTemp, getAqiRating, formatPopulation, formatArea } from '../lib/api.js';

export default function CompareModal({ country1, weather1, aqi1, unit = 'C', onClose, onSelectCountry }) {
    const allCountries = getAllCountriesList().filter((c) => c.name !== country1.name.common);
    const [selectedName, setSelectedName] = useState(allCountries[0]?.name || 'Brazil');
    const [country2Data, setCountry2Data] = useState(null);
    const [loading, setLoading] = useState(false);
    const [filterQuery, setFilterQuery] = useState('');

    useEffect(() => {
        let mounted = true;
        if (!selectedName) return;

        const timer = setTimeout(() => {
            setLoading(true);
            getCountryData(selectedName)
                .then((res) => {
                    if (mounted) {
                        setCountry2Data(res);
                        setLoading(false);
                    }
                })
                .catch(() => {
                    if (mounted) setLoading(false);
                });
        }, 0);

        return () => {
            mounted = false;
            clearTimeout(timer);
        };
    }, [selectedName]);

    // Compute differentials
    const temp1 = weather1?.current?.temperature_2m;
    const temp2 = country2Data?.weather?.current?.temperature_2m;
    const tempDiff = (temp1 != null && temp2 != null)
        ? Math.abs(convertTemp(temp1, unit) - convertTemp(temp2, unit))
        : null;

    const pop1 = country1.population || 1;
    const pop2 = country2Data?.country?.population || 1;
    const popRatio = (pop1 / pop2).toFixed(1);

    const aqiScore1 = aqi1?.current?.us_aqi;
    const aqiScore2 = country2Data?.aqi?.current?.us_aqi;
    const aqiRating1 = getAqiRating(aqiScore1);
    const aqiRating2 = getAqiRating(aqiScore2);

    const filteredList = allCountries.filter((c) =>
        c.name.toLowerCase().includes(filterQuery.toLowerCase())
    );

    return (
        <div className="telemetry-modal-overlay" onClick={onClose}>
            <div className="telemetry-modal-box compare-modal-box" onClick={(e) => e.stopPropagation()}>
                <div className="telemetry-modal-header">
                    <div>
                        <h3 className="telemetry-modal-title">⚔️ Global Duel: Compare Nations</h3>
                        <p className="telemetry-modal-sub">
                            Side-by-side demographic, climate & atmospheric telemetry
                        </p>
                    </div>
                    <button className="modal-close-btn" onClick={onClose} aria-label="Close">
                        ✕
                    </button>
                </div>

                {/* Nation 2 Selector */}
                <div className="compare-picker-row">
                    <span className="picker-label">Compare {country1.name.common} with:</span>
                    <input
                        type="text"
                        className="picker-search-input"
                        placeholder="Filter country..."
                        value={filterQuery}
                        onChange={(e) => setFilterQuery(e.target.value)}
                    />
                    <select
                        className="compare-select"
                        value={selectedName}
                        onChange={(e) => setSelectedName(e.target.value)}
                    >
                        {filteredList.slice(0, 40).map((c) => (
                            <option key={c.name} value={c.name}>
                                {c.name} ({c.region})
                            </option>
                        ))}
                    </select>
                </div>

                {/* Side-by-side presentation */}
                <div className="duel-grid">
                    {/* Country 1 Column */}
                    <div className="duel-column">
                        <div className="duel-header">
                            <img src={country1.flags?.svg} alt="" className="duel-flag" />
                            <h4 className="duel-country-name">{country1.name.common}</h4>
                            <span className="duel-capital">{country1.capital?.[0] || 'N/A'}</span>
                        </div>

                        <div className="duel-metric-card">
                            <span className="dm-label">Temperature</span>
                            <span className="dm-value">
                                {temp1 != null ? `${convertTemp(temp1, unit)}°${unit}` : 'N/A'}
                            </span>
                        </div>

                        <div className="duel-metric-card">
                            <span className="dm-label">Population</span>
                            <span className="dm-value">{formatPopulation(country1.population)}</span>
                        </div>

                        <div className="duel-metric-card">
                            <span className="dm-label">Territory</span>
                            <span className="dm-value">{formatArea(country1.area)}</span>
                        </div>

                        <div className="duel-metric-card">
                            <span className="dm-label">Air Quality (AQI)</span>
                            <span className="dm-value" style={{ color: aqiRating1.color }}>
                                {aqiScore1 != null ? `${aqiScore1} (${aqiRating1.level})` : 'N/A'}
                            </span>
                        </div>
                    </div>

                    {/* VS Center Pillar */}
                    <div className="duel-vs-pillar">
                        <span className="vs-badge">VS</span>
                        {tempDiff != null && (
                            <span className="diff-pill" title="Temperature Delta">
                                Δ {tempDiff}°{unit}
                            </span>
                        )}
                        <span className="ratio-pill" title="Population Ratio">
                            {pop1 > pop2 ? `${popRatio}x larger` : `${(pop2 / pop1).toFixed(1)}x smaller`}
                        </span>
                    </div>

                    {/* Country 2 Column */}
                    <div className="duel-column">
                        {loading ? (
                            <div className="duel-loading-wrap">
                                <span className="spinner" />
                                <span style={{ fontSize: '0.8rem', color: '#71717a' }}>Analyzing telemetry...</span>
                            </div>
                        ) : country2Data?.country ? (
                            <>
                                <div className="duel-header">
                                    <img src={country2Data.country.flags?.svg} alt="" className="duel-flag" />
                                    <h4 className="duel-country-name">{country2Data.country.name.common}</h4>
                                    <span className="duel-capital">{country2Data.country.capital?.[0] || 'N/A'}</span>
                                </div>

                                <div className="duel-metric-card">
                                    <span className="dm-label">Temperature</span>
                                    <span className="dm-value">
                                        {temp2 != null ? `${convertTemp(temp2, unit)}°${unit}` : 'N/A'}
                                    </span>
                                </div>

                                <div className="duel-metric-card">
                                    <span className="dm-label">Population</span>
                                    <span className="dm-value">{formatPopulation(country2Data.country.population)}</span>
                                </div>

                                <div className="duel-metric-card">
                                    <span className="dm-label">Territory</span>
                                    <span className="dm-value">{formatArea(country2Data.country.area)}</span>
                                </div>

                                <div className="duel-metric-card">
                                    <span className="dm-label">Air Quality (AQI)</span>
                                    <span className="dm-value" style={{ color: aqiRating2.color }}>
                                        {aqiScore2 != null ? `${aqiScore2} (${aqiRating2.level})` : 'N/A'}
                                    </span>
                                </div>

                                <button
                                    className="switch-to-duel-btn"
                                    onClick={() => {
                                        onSelectCountry(country2Data.country.name.common);
                                        onClose();
                                    }}
                                >
                                    Explore {country2Data.country.name.common} →
                                </button>
                            </>
                        ) : (
                            <p style={{ color: '#71717a', textAlign: 'center', marginTop: '2rem' }}>Failed to load data.</p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
