const CACHE_KEY = 'lender_exchange_rates';
const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours
const API_URL = 'https://open.er-api.com/v6/latest';

function getCachedRates(base) {
    try {
        const raw = localStorage.getItem(CACHE_KEY);
        if (!raw) return null;
        const cache = JSON.parse(raw);
        if (cache.base !== base) return null;
        if (Date.now() > cache.expiry) return null;
        return cache.rates;
    } catch {
        return null;
    }
}

function cacheRates(base, rates) {
    try {
        localStorage.setItem(CACHE_KEY, JSON.stringify({
            base,
            rates,
            expiry: Date.now() + CACHE_TTL,
        }));
    } catch { /* storage full, ignore */ }
}

export const ExchangeRateService = {
    /**
     * Get rates for a base currency.
     * Returns cached rates if available, otherwise fetches from API.
     */
    async getRates(base) {
        const cached = getCachedRates(base);
        if (cached) return cached;

        try {
            const res = await fetch(`${API_URL}/${base}`);
            const data = await res.json();
            if (data.result === 'success' && data.rates) {
                cacheRates(base, data.rates);
                return data.rates;
            }
        } catch (e) {
            console.warn('ExchangeRateService: fetch failed', e.message);
        }

        return null;
    },

    /**
     * Convert amount from one currency to another.
     * Uses cache if available, otherwise returns original amount.
     * Triggers background fetch if no cache.
     */
    convert(amount, from, to) {
        if (from === to) return amount;
        const rates = getCachedRates(from);
        if (!rates || !rates[to]) return amount;
        return amount * rates[to];
    },

    /**
     * Check if rates are cached and fresh for a base currency.
     */
    hasRates(base) {
        return getCachedRates(base) !== null;
    },

    /**
     * Clear cached rates (for testing or manual refresh).
     */
    clearCache() {
        localStorage.removeItem(CACHE_KEY);
    },
};
