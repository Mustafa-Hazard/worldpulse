import { cache } from './cache.js';
import countriesData from '../data/countriesData.json';

const WEATHER_BASE = 'https://api.open-meteo.com/v1/forecast';
const AQI_BASE = 'https://air-quality-api.open-meteo.com/v1/air-quality';
const FX_BASE = 'https://open.er-api.com/v6/latest/USD';
const TIMEOUT_MS = 8000;

// Build lookup maps for O(1) code lookups
const countryByCca3 = new Map();
const countryByCca2 = new Map();
for (const c of countriesData) {
    if (c.cca3) countryByCca3.set(c.cca3.toUpperCase(), c);
    if (c.cca2) countryByCca2.set(c.cca2.toUpperCase(), c);
}

/**
 * Fetch with timeout and exponential backoff retry for transient network glitches.
 */
async function fetchWithRetry(url, options = {}, retries = 2, delays = [150, 300]) {
    let lastError = null;

    for (let attempt = 0; attempt <= retries; attempt++) {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), options.timeoutMs ?? TIMEOUT_MS);

        try {
            const res = await fetch(url, {
                ...options,
                signal: controller.signal,
            });
            clearTimeout(timer);
            if (!res.ok) {
                throw new Error(`HTTP ${res.status}: ${res.statusText}`);
            }
            return await res.json();
        } catch (err) {
            clearTimeout(timer);
            lastError = err.name === 'AbortError' ? new Error('Request timed out') : err;

            if (attempt < retries) {
                const backoff = delays[attempt] ?? 300;
                await new Promise((r) => setTimeout(r, backoff));
            }
        }
    }

    throw lastError;
}

/**
 * Search countries locally using our zero-auth dataset.
 */
export async function searchCountries(query) {
    const q = query.trim().toLowerCase();
    if (!q) throw new Error('Search query cannot be empty');
    if (q.length < 2) throw new Error('Enter at least 2 characters');

    const cacheKey = `countries:search:${q}`;
    return cache.fetchOnce(cacheKey, async () => {
        const exact = [];
        const prefix = [];
        const contains = [];

        for (const c of countriesData) {
            const common = c.name.common.toLowerCase();
            const official = c.name.official.toLowerCase();
            const capital = (c.capital?.[0] ?? '').toLowerCase();
            const cca3 = c.cca3.toLowerCase();
            const cca2 = (c.cca2 ?? '').toLowerCase();

            if (common === q || cca3 === q || cca2 === q) {
                exact.push(c);
            } else if (common.startsWith(q) || capital.startsWith(q)) {
                prefix.push(c);
            } else if (common.includes(q) || official.includes(q) || capital.includes(q)) {
                contains.push(c);
            }
        }

        const matches = [...exact, ...prefix, ...contains];
        if (matches.length === 0) {
            throw new Error(`No countries found matching "${query}"`);
        }

        return matches.map((c) => ({
            ...c,
            resolvedBorders: (c.borders || []).map((code) => {
                const neighbor = countryByCca3.get(code.toUpperCase());
                return neighbor
                    ? { name: neighbor.name.common, cca3: code, flag: neighbor.flags?.svg }
                    : { name: code, cca3: code, flag: null };
            }),
        }));
    });
}

/**
 * Fetch rich weather data from Open-Meteo.
 */
async function fetchWeather(lat, lng) {
    const cacheKey = `weather:${lat.toFixed(2)}:${lng.toFixed(2)}`;
    return cache.fetchOnce(cacheKey, async () => {
        const params = new URLSearchParams({
            latitude: lat,
            longitude: lng,
            current: 'temperature_2m,relative_humidity_2m,apparent_temperature,is_day,precipitation,weather_code,wind_speed_10m,wind_direction_10m,uv_index',
            hourly: 'temperature_2m,precipitation_probability,weather_code',
            daily: 'temperature_2m_max,temperature_2m_min,sunrise,sunset,uv_index_max,precipitation_sum,weather_code',
            timezone: 'auto',
            forecast_days: 7,
        });

        return fetchWithRetry(`${WEATHER_BASE}?${params}`);
    });
}

/**
 * Fetch Air Quality Index (AQI) from Open-Meteo (Zero Auth).
 */
export async function fetchAirQuality(lat, lng) {
    const cacheKey = `aqi:${lat.toFixed(2)}:${lng.toFixed(2)}`;
    return cache.fetchOnce(cacheKey, async () => {
        const params = new URLSearchParams({
            latitude: lat,
            longitude: lng,
            current: 'us_aqi,pm2_5,pm10',
        });
        return fetchWithRetry(`${AQI_BASE}?${params}`);
    });
}

/**
 * Fetch real-time currency exchange rates (USD base, Zero Auth).
 */
export async function fetchExchangeRates() {
    const cacheKey = 'fx:rates:latest';
    return cache.fetchOnce(cacheKey, async () => {
        return fetchWithRetry(FX_BASE);
    });
}

/**
 * Aggregate Country + Weather + AQI in parallel.
 */
export async function getCountryData(query) {
    const countries = await searchCountries(query);
    const country = countries[0];
    const [lat, lng] = country.latlng ?? [0, 0];
    const hasCoords = country.latlng && country.latlng.length === 2;

    const [weatherResult, aqiResult] = await Promise.allSettled([
        hasCoords ? fetchWeather(lat, lng) : Promise.reject(new Error('No coordinates')),
        hasCoords ? fetchAirQuality(lat, lng) : Promise.reject(new Error('No coordinates')),
    ]);

    return {
        country,
        weather: weatherResult.status === 'fulfilled' ? weatherResult.value : null,
        weatherError: weatherResult.status === 'rejected' ? weatherResult.reason?.message : null,
        aqi: aqiResult.status === 'fulfilled' ? aqiResult.value : null,
        aqiError: aqiResult.status === 'rejected' ? aqiResult.reason?.message : null,
        alternatives: countries.slice(1, 6),
    };
}

/**
 * List all available countries for dropdowns and comparisons.
 */
export function getAllCountriesList() {
    return countriesData
        .filter((c) => c.name?.common)
        .map((c) => ({
            name: c.name.common,
            cca3: c.cca3,
            flag: c.flags?.svg,
            region: c.region,
        }))
        .sort((a, b) => a.name.localeCompare(b.name));
}

export function getRandomCountry() {
    const valid = countriesData.filter((c) => c.population > 200_000 && c.capital?.length > 0);
    const pick = valid[Math.floor(Math.random() * valid.length)];
    return pick?.name.common || 'Japan';
}

/**
 * AQI rating evaluation.
 */
export function getAqiRating(aqi) {
    if (aqi == null) return { level: 'N/A', color: '#71717a' };
    if (aqi <= 50) return { level: 'Good', color: '#10b981' };
    if (aqi <= 100) return { level: 'Moderate', color: '#f59e0b' };
    if (aqi <= 150) return { level: 'Sensitive', color: '#f97316' };
    if (aqi <= 200) return { level: 'Unhealthy', color: '#ef4444' };
    if (aqi <= 300) return { level: 'Very Unhealthy', color: '#a855f7' };
    return { level: 'Hazardous', color: '#7e22ce' };
}

export function describeWeatherCode(code) {
    const map = {
        0: { label: 'Clear sky', emoji: '☀️', theme: 'clear' },
        1: { label: 'Mainly clear', emoji: '🌤️', theme: 'clear' },
        2: { label: 'Partly cloudy', emoji: '⛅', theme: 'cloudy' },
        3: { label: 'Overcast', emoji: '☁️', theme: 'cloudy' },
        45: { label: 'Foggy', emoji: '🌫️', theme: 'fog' },
        48: { label: 'Icy fog', emoji: '🌫️', theme: 'fog' },
        51: { label: 'Light drizzle', emoji: '🌦️', theme: 'rain' },
        53: { label: 'Drizzle', emoji: '🌦️', theme: 'rain' },
        55: { label: 'Heavy drizzle', emoji: '🌧️', theme: 'rain' },
        61: { label: 'Light rain', emoji: '🌧️', theme: 'rain' },
        63: { label: 'Rain', emoji: '🌧️', theme: 'rain' },
        65: { label: 'Heavy rain', emoji: '🌧️', theme: 'rain' },
        71: { label: 'Light snow', emoji: '🌨️', theme: 'snow' },
        73: { label: 'Snow', emoji: '❄️', theme: 'snow' },
        75: { label: 'Heavy snow', emoji: '❄️', theme: 'snow' },
        77: { label: 'Snow grains', emoji: '🌨️', theme: 'snow' },
        80: { label: 'Rain showers', emoji: '🌦️', theme: 'rain' },
        81: { label: 'Showers', emoji: '🌧️', theme: 'rain' },
        82: { label: 'Violent showers', emoji: '⛈️', theme: 'storm' },
        85: { label: 'Snow showers', emoji: '🌨️', theme: 'snow' },
        86: { label: 'Heavy snow showers', emoji: '❄️', theme: 'snow' },
        95: { label: 'Thunderstorm', emoji: '⛈️', theme: 'storm' },
        96: { label: 'Thunderstorm w/ hail', emoji: '⛈️', theme: 'storm' },
        99: { label: 'Thunderstorm w/ heavy hail', emoji: '⛈️', theme: 'storm' },
    };
    return map[code] ?? { label: 'Variable', emoji: '🌡️', theme: 'clear' };
}

export function degreesToCompass(deg) {
    if (deg == null) return 'N/A';
    const points = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
    const idx = Math.round((deg % 360) / 22.5) % 16;
    return points[idx];
}

export function getUVRisk(uv) {
    if (uv == null) return { level: 'N/A', color: '#71717a' };
    if (uv < 3) return { level: 'Low', color: '#10b981' };
    if (uv < 6) return { level: 'Moderate', color: '#f59e0b' };
    if (uv < 8) return { level: 'High', color: '#f97316' };
    if (uv < 11) return { level: 'Very High', color: '#ef4444' };
    return { level: 'Extreme', color: '#a855f7' };
}

export function convertTemp(celsius, unit = 'C') {
    if (celsius == null) return null;
    if (unit === 'F') {
        return Math.round((celsius * 9) / 5 + 32);
    }
    return Math.round(celsius);
}

export function convertWind(kmh, unit = 'C') {
    if (kmh == null) return null;
    if (unit === 'F') {
        return `${Math.round(kmh * 0.621371)} mph`;
    }
    return `${Math.round(kmh)} km/h`;
}

export function formatPopulation(n) {
    if (!n) return 'N/A';
    if (n >= 1_000_000_000) return `${(n / 1_000_000_000).toFixed(2)}B`;
    if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
    if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
    return n.toString();
}

export function formatArea(km2) {
    if (!km2) return 'N/A';
    return `${km2.toLocaleString()} km²`;
}
