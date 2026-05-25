import { useCountry } from './hooks/useCountry.js';
import SearchBar from './components/SearchBar.jsx';
import CountryCard from './components/CountryCard.jsx';
import WeatherPanel from './components/WeatherPanel.jsx';
import ForecastChart from './components/ForecastChart.jsx';
import StatusMessage from './components/StatusMessage.jsx';
import CacheDebug from './components/CacheDebug.jsx';
import './index.css';

export default function App() {
  const { query, search, data, status, error } = useCountry();

  return (
    <div className="app">
      <header className="header">
        <div className="header-inner">
          <div className="logo">
            <span className="logo-icon">🌍</span>
            <span className="logo-text">WorldPulse</span>
          </div>
          <p className="tagline">Live weather + country intelligence — no API key needed</p>
        </div>
      </header>

      <main className="main">
        <SearchBar value={query} onChange={search} status={status} />

        {status === 'idle' && !data && (
          <div className="hero-prompt">
            <p>Search any country — try{' '}
              <button className="inline-btn" onClick={() => search('Japan')}>Japan</button>,{' '}
              <button className="inline-btn" onClick={() => search('Brazil')}>Brazil</button>, or{' '}
              <button className="inline-btn" onClick={() => search('Nigeria')}>Nigeria</button>
            </p>
          </div>
        )}

        <StatusMessage status={status} error={error} />

        {status === 'success' && data && (
          <div className="results">
            <div className="results-top">
              <CountryCard country={data.country} />
              <WeatherPanel weather={data.weather} weatherError={data.weatherError} />
            </div>

            {data.weather?.daily && (
              <ForecastChart daily={data.weather.daily} />
            )}

            {data.alternatives?.length > 0 && (
              <div className="alternatives">
                <p className="alt-label">Other matches:</p>
                <div className="alt-list">
                  {data.alternatives.map((c) => (
                    <button
                      key={c.cca3}
                      className="alt-btn"
                      onClick={() => search(c.name.common)}
                    >
                      <img src={c.flags?.svg} alt="" className="alt-flag" />
                      {c.name.common}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      <CacheDebug />
    </div>
  );
}