import {
    ResponsiveContainer, AreaChart, Area,
    XAxis, YAxis, CartesianGrid, Tooltip, Legend,
} from 'recharts';
import { describeWeatherCode, convertTemp } from '../lib/api.js';

function CustomTooltip({ active, payload, label, unit }) {
    if (!active || !payload?.length) return null;
    return (
        <div className="chart-tooltip-glass">
            <p className="chart-tooltip-title">{label}</p>
            {payload.map((p) => (
                <p key={p.name} style={{ color: p.color, margin: '2px 0' }}>
                    {p.name === 'max' ? 'High' : p.name === 'min' ? 'Low' : 'Precipitation'}: {p.value}
                    {p.name === 'rain' ? ' mm' : `°${unit}`}
                </p>
            ))}
        </div>
    );
}

export default function ForecastChart({ daily, unit = 'C' }) {
    if (!daily || !daily.time) return null;

    const data = daily.time.map((date, i) => ({
        date: new Date(date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }),
        max: convertTemp(daily.temperature_2m_max[i], unit),
        min: convertTemp(daily.temperature_2m_min[i], unit),
        rain: +(daily.precipitation_sum[i] ?? 0).toFixed(1),
        weather: describeWeatherCode(daily.weather_code[i]).emoji,
    }));

    return (
        <div className="hud-card chart-hud">
            <div className="chart-hud-header">
                <span className="hud-panel-title">7-Day Climate Horizon</span>
                <span className="hourly-hint">Projection in °{unit}</span>
            </div>

            <div className="forecast-emojis-row">
                {data.map((d, i) => (
                    <div key={i} className="forecast-emoji-slot">
                        <span className="fe-icon">{d.weather}</span>
                        <span className="fe-day-label">{d.date.split(',')[0]}</span>
                    </div>
                ))}
            </div>

            <ResponsiveContainer width="100%" height={230}>
                <AreaChart data={data} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                    <defs>
                        <linearGradient id="maxGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#f59e0b" stopOpacity={0.35} />
                            <stop offset="90%" stopColor="#f59e0b" stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="minGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#e4e4e7" stopOpacity={0.3} />
                            <stop offset="90%" stopColor="#e4e4e7" stopOpacity={0} />
                        </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                    <XAxis
                        dataKey="date"
                        tick={{ fontSize: 11, fill: '#71717a' }}
                        tickFormatter={(v) => v.split(',')[0]}
                    />
                    <YAxis
                        tick={{ fontSize: 11, fill: '#71717a' }}
                        unit={`°`}
                        domain={['auto', 'auto']}
                    />
                    <Tooltip content={<CustomTooltip unit={unit} />} />
                    <Legend
                        formatter={(value) => (value === 'max' ? `Max Temp (°${unit})` : `Min Temp (°${unit})`)}
                    />
                    <Area
                        type="monotone"
                        dataKey="max"
                        name="max"
                        stroke="#f59e0b"
                        fill="url(#maxGrad)"
                        strokeWidth={2.5}
                        dot={{ r: 3.5, fill: '#f59e0b' }}
                    />
                    <Area
                        type="monotone"
                        dataKey="min"
                        name="min"
                        stroke="#e4e4e7"
                        fill="url(#minGrad)"
                        strokeWidth={2.5}
                        dot={{ r: 3.5, fill: '#e4e4e7' }}
                    />
                </AreaChart>
            </ResponsiveContainer>
        </div>
    );
}
