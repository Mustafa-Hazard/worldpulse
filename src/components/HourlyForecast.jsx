import { describeWeatherCode, convertTemp } from '../lib/api.js';

export default function HourlyForecast({ hourly, unit }) {
    if (!hourly || !hourly.time || hourly.time.length === 0) return null;

    const nowIso = new Date().toISOString().slice(0, 13);
    let startIndex = hourly.time.findIndex((t) => t.startsWith(nowIso));
    if (startIndex === -1) startIndex = 0;

    const next24 = [];
    const maxItems = Math.min(24, hourly.time.length - startIndex);

    for (let i = 0; i < maxItems; i++) {
        const idx = startIndex + i;
        const timeStr = hourly.time[idx];
        const dateObj = new Date(timeStr);
        const hourLabel = i === 0 ? 'Now' : dateObj.toLocaleTimeString([], { hour: 'numeric', hour12: true });

        const code = hourly.weather_code[idx];
        const weatherInfo = describeWeatherCode(code);
        const temp = convertTemp(hourly.temperature_2m[idx], unit);
        const rainProb = hourly.precipitation_probability ? hourly.precipitation_probability[idx] : null;

        next24.push({
            time: hourLabel,
            temp,
            emoji: weatherInfo.emoji,
            label: weatherInfo.label,
            rainProb,
        });
    }

    return (
        <div className="hud-card hourly-hud">
            <div className="hourly-hud-header">
                <span className="hud-panel-title">24-Hour Atmospheric Trajectory</span>
                <span className="hourly-hint">Scroll Horizontally →</span>
            </div>
            <div className="hourly-scroll-strip">
                {next24.map((h, i) => (
                    <div key={i} className="hourly-slot-card">
                        <span className="hourly-slot-time">{h.time}</span>
                        <span className="hourly-slot-emoji" title={h.label}>{h.emoji}</span>
                        <span className="hourly-slot-temp">{h.temp}°</span>
                        {h.rainProb != null && h.rainProb > 0 ? (
                            <span className="hourly-slot-rain" title="Precipitation Probability">
                                💧{h.rainProb}%
                            </span>
                        ) : (
                            <span className="hourly-slot-rain-spacer" />
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
}
