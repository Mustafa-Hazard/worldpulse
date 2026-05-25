import { useState, useEffect, useRef, useCallback } from 'react';
import { getCountryData } from '../lib/api.js';

const DEBOUNCE_MS = 400;

export function useCountry() {
    const [query, setQuery] = useState('');
    const [data, setData] = useState(null);
    const [status, setStatus] = useState('idle');
    const [error, setError] = useState(null);
    const debounceRef = useRef(null);
    const latestQueryRef = useRef('');

    const search = useCallback((rawQuery) => {
        const q = rawQuery.trim();
        setQuery(rawQuery);
        clearTimeout(debounceRef.current);

        if (!q || q.length < 2) {
            setStatus('idle');
            setData(null);
            setError(null);
            return;
        }

        setStatus('loading');

        debounceRef.current = setTimeout(async () => {
            latestQueryRef.current = q;
            try {
                const result = await getCountryData(q);
                if (latestQueryRef.current !== q) return;
                setData(result);
                setStatus('success');
                setError(null);
            } catch (err) {
                if (latestQueryRef.current !== q) return;
                setError(err.message);
                setStatus('error');
                setData(null);
            }
        }, DEBOUNCE_MS);
    }, []);

    useEffect(() => () => clearTimeout(debounceRef.current), []);

    return { query, search, data, status, error };
}