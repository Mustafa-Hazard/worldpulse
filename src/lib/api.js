import { cache } from './cache.js';

const COUNTRIES_BASE = 'https://restcountries.com/v3.1';
const WEATHER_BASE = 'https://api.open-meteo.com/v1/forecast';
const TIMEOUT_MS = 8000;

async function fetchWithTimeout(url, timeoutMs = TIMEOUT_MS) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
        const res = await fetch(url, { signal: controller.signal });
        if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);
        return res.json();
    } catch (err) {
        if (err.name === 'AbortError') throw new Error('Request timed out after 8s');
        throw err;
    } finally {
        clearTimeout(timer);
    }
}

export async function searchCountries(query) {
    const q = query.trim().toLowerCase();
    if (!q) throw new Error('Search query cannot be empty');
    if (q.length < 2) throw new Error('Enter at least 2 characters');

    const cacheKey = `countries:search:${q}`;
    return cache.fetchOnce(cacheKey, async () => {
        const data = await fetchWithTimeout(
            `${COUNTRIES_BASE}/name/${encodeURIComponent(q)}?fields=name,capital,population,area,region,subregion,flags,latlng,currencies,languages,timezones,borders,cca3`
        );
        if (!Array.isArray(data)) throw new Error('No countries found');
        return data;
    });
}

async function fetchWeather(lat, lng) {
    const cacheKey = `weather:${lat.toFixed(2)}:${lng.toFixed(2)}`;
    return cache.fetchOnce(cacheKey, async () => {
        const params = new URLSearchParams({
            latitude: lat,
            longitude: lng,
            current: 'temperature_2m,relative_humidity_2m,wind_speed_10m,weather_code,apparent_temperature',
            daily: 'temperature_2m_max,temperature_2m_min,precipitation_sum,weather_code',
            timezone: 'auto',
            forecast_days: 7,
        });
        return fetchWithTimeout(`${WEATHER_BASE}?${params}`);
    });
}

export async function getCountryData(query) {
    const countries = await searchCountries(query);
    const country = countries[0];
    const [lat, lng] = country.latlng ?? [0, 0];
    const hasCoords = country.latlng && country.latlng.length === 2;

    const [weather] = await Promise.allSettled([
        hasCoords ? fetchWeather(lat, lng) : Promise.reject(new Error('No coordinates')),
    ]);

    return {
        country,
        weather: weather.status === 'fulfilled' ? weather.value : null,
        weatherError: weather.status === 'rejected' ? weather.reason.message : null,
        alternatives: countries.slice(1, 5),
    };
}

export function describeWeatherCode(code) {
    const map = {
        0: { label: 'Clear sky', emoji: '☀️' },
        1: { label: 'Mainly clear', emoji: '🌤️' },
        2: { label: 'Partly cloudy', emoji: '⛅' },
        3: { label: 'Overcast', emoji: '☁️' },
        45: { label: 'Foggy', emoji: '🌫️' },
        48: { label: 'Icy fog', emoji: '🌫️' },
        51: { label: 'Light drizzle', emoji: '🌦️' },
        53: { label: 'Drizzle', emoji: '🌦️' },
        55: { label: 'Heavy drizzle', emoji: '🌧️' },
        61: { label: 'Light rain', emoji: '🌧️' },
        63: { label: 'Rain', emoji: '🌧️' },
        65: { label: 'Heavy rain', emoji: '🌧️' },
        71: { label: 'Light snow', emoji: '🌨️' },
        73: { label: 'Snow', emoji: '❄️' },
        75: { label: 'Heavy snow', emoji: '❄️' },
        77: { label: 'Snow grains', emoji: '🌨️' },
        80: { label: 'Rain showers', emoji: '🌦️' },
        81: { label: 'Showers', emoji: '🌧️' },
        82: { label: 'Violent showers', emoji: '⛈️' },
        85: { label: 'Snow showers', emoji: '🌨️' },
        86: { label: 'Heavy snow showers', emoji: '❄️' },
        95: { label: 'Thunderstorm', emoji: '⛈️' },
        96: { label: 'Thunderstorm w/ hail', emoji: '⛈️' },
        99: { label: 'Thunderstorm w/ heavy hail', emoji: '⛈️' },
    };
    return map[code] ?? { label: 'Unknown', emoji: '🌡️' };
}

export function formatPopulation(n) {
    if (n >= 1_000_000_000) return `${(n / 1_000_000_000).toFixed(2)}B`;
    if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
    if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
    return n?.toString() ?? 'N/A';
}

export function formatArea(km2) {
    if (!km2) return 'N/A';
    return `${km2.toLocaleString()} km²`;
}