import { describeWeatherCode } from '../lib/api.js';

export default function WeatherPanel({ weather, weatherError }) {
    if (weatherError) {
        return (
            <div className="card weather-card weather-unavailable">
                <h3 className="panel-title">Weather</h3>
                <p className="weather-error-msg">⚠️ Weather unavailable: {weatherError}</p>
                <p className="weather-error-sub">Country data loaded successfully.</p>
            </div>
        );
    }

    if (!weather) return null;

    const cur = weather.current;
    const { label, emoji } = describeWeatherCode(cur.weather_code);

    return (
        <div className="card weather-card">
            <h3 className="panel-title">Current Weather</h3>
            <div className="weather-main">
                <span className="weather-emoji">{emoji}</span>
                <div>
                    <p className="weather-temp">{Math.round(cur.temperature_2m)}°C</p>
                    <p className="weather-feels">Feels like {Math.round(cur.apparent_temperature)}°C</p>
                    <p className="weather-label">{label}</p>
                </div>
            </div>
            <div className="weather-meta">
                <div className="weather-meta-item">
                    <span>💧</span>
                    <span>{cur.relative_humidity_2m}% humidity</span>
                </div>
                <div className="weather-meta-item">
                    <span>💨</span>
                    <span>{cur.wind_speed_10m} km/h wind</span>
                </div>
                <div className="weather-meta-item">
                    <span>🕐</span>
                    <span>{weather.timezone}</span>
                </div>
            </div>
        </div>
    );
}