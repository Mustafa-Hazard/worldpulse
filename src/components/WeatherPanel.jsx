import { describeWeatherCode, degreesToCompass, getUVRisk, getAqiRating, convertTemp, convertWind } from '../lib/api.js';

export default function WeatherPanel({ weather, weatherError, unit, aqi }) {
    if (weatherError) {
        return (
            <div className="hud-card weather-hud weather-unavailable">
                <span className="hud-panel-title">Atmospheric Station</span>
                <p className="weather-error-msg">⚠️ Weather Station Offline: {weatherError}</p>
                <p className="weather-error-sub">Country intelligence active & verified.</p>
            </div>
        );
    }

    if (!weather) return null;

    const cur = weather.current;
    const daily = weather.daily;
    const { label, emoji } = describeWeatherCode(cur.weather_code);
    const compass = degreesToCompass(cur.wind_direction_10m);
    const uvRisk = getUVRisk(cur.uv_index);

    // AQI rating
    const aqiScore = aqi?.current?.us_aqi;
    const aqiRating = getAqiRating(aqiScore);
    const pm25 = aqi?.current?.pm2_5;

    // Format sunrise and sunset
    const formatSunTime = (iso) => {
        if (!iso) return 'N/A';
        try {
            const d = new Date(iso);
            return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
        } catch {
            return iso.split('T')[1] || iso;
        }
    };

    const sunrise = daily?.sunrise?.[0] ? formatSunTime(daily.sunrise[0]) : '--:--';
    const sunset = daily?.sunset?.[0] ? formatSunTime(daily.sunset[0]) : '--:--';
    const uvMax = daily?.uv_index_max?.[0];

    const tempDisplay = convertTemp(cur.temperature_2m, unit);
    const feelsDisplay = convertTemp(cur.apparent_temperature, unit);
    const windDisplay = convertWind(cur.wind_speed_10m, unit);

    // Needle position for UV spectrum (0 to 11 scale)
    const uvValue = cur.uv_index ?? 0;
    const uvPercent = Math.min(100, Math.max(0, (uvValue / 11) * 100));

    return (
        <div className="hud-card weather-hud">
            <div>
                <span className="hud-panel-title">Live Atmospheric Feed</span>

                {/* Hero Temperature Display */}
                <div className="weather-hero-row" style={{ marginTop: '0.65rem' }}>
                    <span className="weather-hero-emoji">{emoji}</span>
                    <div className="weather-hero-info">
                        <span className="weather-temp-huge">{tempDisplay}°{unit}</span>
                        <span className="weather-condition-label">{label}</span>
                        <span className="weather-feels-tag">Feels like {feelsDisplay}°{unit}</span>
                    </div>
                </div>
            </div>

            {/* Weather & AQI Telemetry Gauges Grid */}
            <div className="weather-gauges-grid">
                {/* Air Quality Index (AQI) */}
                <div className="gauge-card">
                    <div className="gauge-header">
                        <span className="gauge-label">Air Quality (AQI)</span>
                        {aqiScore != null && (
                            <span className="hl-tag" style={{ color: aqiRating.color, borderColor: aqiRating.color }}>
                                {aqiRating.level}
                            </span>
                        )}
                    </div>
                    <span className="gauge-value-main">
                        {aqiScore != null ? aqiScore : '--'}
                    </span>
                    <span className="gauge-sub-info">
                        {pm25 != null ? `PM2.5: ${pm25.toFixed(1)} μg/m³` : 'Global AQI Index'}
                    </span>
                </div>

                {/* UV Index Spectrum */}
                <div className="gauge-card">
                    <div className="gauge-header">
                        <span className="gauge-label">UV Index</span>
                        <span className="hl-tag" style={{ color: uvRisk.color, borderColor: uvRisk.color }}>
                            {uvRisk.level}
                        </span>
                    </div>
                    <span className="gauge-value-main">{uvValue.toFixed(1)}</span>
                    <div className="uv-spectrum-track" title={`UV Index: ${uvValue.toFixed(1)}`}>
                        <div className="uv-needle" style={{ left: `${uvPercent}%` }} />
                    </div>
                    {uvMax != null && (
                        <span className="gauge-sub-info">Max {uvMax.toFixed(1)} today</span>
                    )}
                </div>

                {/* Sun Cycle */}
                <div className="gauge-card">
                    <div className="gauge-header">
                        <span className="gauge-label">Solar Cycle</span>
                    </div>
                    <div className="sun-cycle-wrap">
                        <div className="sun-cycle-item" title="Sunrise">
                            <span>🌅</span>
                            <span>{sunrise}</span>
                        </div>
                        <div className="sun-cycle-item" title="Sunset">
                            <span>🌇</span>
                            <span>{sunset}</span>
                        </div>
                    </div>
                    <span className="gauge-sub-info">{weather.timezone?.split('/')[1] || 'Local'}</span>
                </div>

                {/* Wind Telemetry */}
                <div className="gauge-card">
                    <div className="gauge-header">
                        <span className="gauge-label">Wind Velocity</span>
                        <span className="compass-direction-badge">
                            🧭 {compass}
                        </span>
                    </div>
                    <span className="gauge-value-main">{windDisplay}</span>
                    <span className="gauge-sub-info">Bearing: {cur.wind_direction_10m ?? 0}°</span>
                </div>
            </div>
        </div>
    );
}
