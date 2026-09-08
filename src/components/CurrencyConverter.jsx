import { useState, useEffect } from 'react';
import { fetchExchangeRates } from '../lib/api.js';

export default function CurrencyConverter({ currencies = {} }) {
    const [rates, setRates] = useState(null);
    const [usdAmount, setUsdAmount] = useState('100');
    const [error, setError] = useState(null);

    // Get primary currency code (e.g. 'JPY', 'EUR', 'BRL')
    const currencyCodes = Object.keys(currencies);
    const primaryCode = currencyCodes[0] || 'USD';
    const currencyObj = currencies[primaryCode] || { name: 'US Dollar', symbol: '$' };

    useEffect(() => {
        let mounted = true;
        fetchExchangeRates()
            .then((data) => {
                if (mounted && data?.rates) {
                    setRates(data.rates);
                }
            })
            .catch((err) => {
                if (mounted) setError(err.message);
            });
        return () => { mounted = false; };
    }, []);

    const rate = rates ? rates[primaryCode] : null;
    const numUsd = parseFloat(usdAmount) || 0;
    const convertedAmount = rate ? (numUsd * rate).toLocaleString(undefined, { maximumFractionDigits: 2 }) : '--';

    return (
        <div className="telemetry-pod currency-calc-pod">
            <div className="pod-header" style={{ justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    <span className="pod-icon">💱</span>
                    <span className="pod-label">FX Converter</span>
                </div>
                {rate && (
                    <span className="fx-rate-tag">
                        1 USD = {rate >= 100 ? rate.toFixed(1) : rate.toFixed(2)} {primaryCode}
                    </span>
                )}
            </div>

            <div className="fx-calc-row">
                <div className="fx-input-wrap">
                    <span className="fx-currency-prefix">$</span>
                    <input
                        type="number"
                        className="fx-input"
                        value={usdAmount}
                        onChange={(e) => setUsdAmount(e.target.value)}
                        placeholder="100"
                        min="1"
                    />
                    <span className="fx-currency-code">USD</span>
                </div>

                <span className="fx-arrow">≈</span>

                <div className="fx-result-wrap">
                    <span className="fx-result-val">
                        {currencyObj.symbol ?? ''} {convertedAmount}
                    </span>
                    <span className="fx-currency-code">{primaryCode}</span>
                </div>
            </div>

            {error && <span className="fx-err-sub">Live rates unavailable</span>}
        </div>
    );
}
