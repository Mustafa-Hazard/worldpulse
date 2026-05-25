import {
    ResponsiveContainer, AreaChart, Area,
    XAxis, YAxis, CartesianGrid, Tooltip, Legend,
} from 'recharts';
import { describeWeatherCode } from '../lib/api.js';

export default function ForecastChart({ daily }) {
    const data = daily.time.map((date, i) => ({
        date: new Date(date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }),
        max: Math.round(daily.temperature_2m_max[i]),
        min: Math.round(daily.temperature_2m_min[i]),
        rain: +(daily.precipitation_sum[i] ?? 0).toFixed(1),
        weather: describeWeatherCode(daily.weather_code[i]).emoji,
    }));

    const CustomTooltip = ({ active, payload, label }) => {
        if (!active || !payload?.length) return null;
        return (
            <div className="chart-tooltip">
                <p className="chart-tooltip-label">{label}</p>
                {payload.map((p) => (
                    <p key={p.name} style={{ color: p.color }}>
                        {p.name}: {p.value}{p.name === 'rain' ? 'mm' : '°C'}
                    </p>
                ))}
            </div>
        );
    };

    return (
        <div className="card forecast-card">
            <h3 className="panel-title">7-Day Forecast</h3>
            <div className="forecast-emojis">
                {data.map((d, i) => (
                    <div key={i} className="forecast-day-emoji">
                        <span className="fe-emoji">{d.weather}</span>
                        <span className="fe-date">{d.date.split(',')[0]}</span>
                    </div>
                ))}
            </div>
            <ResponsiveContainer width="100%" height={220}>
                <AreaChart data={data} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
                    <defs>
                        <linearGradient id="maxGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#f97316" stopOpacity={0.3} />
                            <stop offset="95%" stopColor="#f97316" stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="minGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#38bdf8" stopOpacity={0.3} />
                            <stop offset="95%" stopColor="#38bdf8" stopOpacity={0} />
                        </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" />
                    <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#94a3b8' }} tickFormatter={(v) => v.split(',')[0]} />
                    <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} unit="°" />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend />
                    <Area type="monotone" dataKey="max" name="max" stroke="#f97316" fill="url(#maxGrad)" strokeWidth={2} dot={false} />
                    <Area type="monotone" dataKey="min" name="min" stroke="#38bdf8" fill="url(#minGrad)" strokeWidth={2} dot={false} />
                </AreaChart>
            </ResponsiveContainer>
        </div>
    );
}