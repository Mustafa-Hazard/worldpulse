import { formatPopulation, formatArea } from '../lib/api.js';

export default function CountryCard({ country }) {
    const currencies = Object.values(country.currencies ?? {})
        .map((c) => `${c.name} (${c.symbol ?? '?'})`)
        .join(', ') || 'N/A';

    const languages = Object.values(country.languages ?? {}).join(', ') || 'N/A';
    const capital = country.capital?.[0] ?? 'N/A';
    const timezones = country.timezones?.slice(0, 3).join(', ') || 'N/A';

    return (
        <div className="card country-card">
            <div className="country-header">
                <img
                    className="country-flag"
                    src={country.flags?.svg}
                    alt={`Flag of ${country.name.common}`}
                />
                <div>
                    <h2 className="country-name">{country.name.common}</h2>
                    <p className="country-official">{country.name.official}</p>
                    <span className="badge">{country.region}{country.subregion ? ` · ${country.subregion}` : ''}</span>
                </div>
            </div>
            <div className="stats-grid">
                <Stat label="Capital" value={capital} />
                <Stat label="Population" value={formatPopulation(country.population)} />
                <Stat label="Area" value={formatArea(country.area)} />
                <Stat label="Languages" value={languages} />
                <Stat label="Currencies" value={currencies} />
                <Stat label="Timezones" value={timezones} />
            </div>
        </div>
    );
}

function Stat({ label, value }) {
    return (
        <div className="stat">
            <span className="stat-label">{label}</span>
            <span className="stat-value">{value}</span>
        </div>
    );
}