/**
 * Simple State Management (Pub/Sub)
 * 
 * IMPORTANT: API is the source of truth. localStorage is read-only cache.
 * All write operations go through the API first.
 */
import { calculateScheduleStatus } from '../utils/calculations.js';
import { apiRequest } from './apiClient.js';
import { getSession } from './authClient.js';

const LOANS_CACHE_KEY = 'lender_loans_cache';
const CACHE_EXPIRY_KEY = 'lender_loans_cache_expiry';
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes cache

class Store {
    constructor() {
        this.state = {
            loans: [],
            session: getSession(),
            settings: {
                theme: 'dark',
                currency: 'COP'
            },
            isLoading: false,
            lastSync: null,
            syncError: null,
            showLogoutModal: false
        };
        this.listeners = [];
        this.pendingActions = [];
    }

    isAuthenticated() {
        return Boolean(this.state.session?.token);
    }

    setSession(session) {
        this.state.session = session;
        this.listeners.forEach(l => l(this.state));
    }

    clearSession() {
        this.state.session = { token: null, refreshToken: null, user: null };
        this.state.loans = [];
        this.state.lastSync = null;
        localStorage.removeItem(LOANS_CACHE_KEY);
        localStorage.removeItem(CACHE_EXPIRY_KEY);
        this.listeners.forEach(l => l(this.state));
    }

    /**
     * Load loans from API (source of truth)
     */
    async loadLoansFromApi() {
        if (!this.isAuthenticated()) return;

        this.state.isLoading = true;
        this.state.syncError = null;
        this.notifyListeners();

        try {
            const data = await apiRequest('/api/loans', { method: 'GET' });
            this.state.loans = data.loans || [];
            this.state.lastSync = Date.now();
            this.state.syncError = null;

            // Update cache
            this.updateCache(this.state.loans);
        } catch (error) {
            console.error('Failed to load loans from API:', error);
            this.state.syncError = error.message;

            // Try to load from cache as fallback
            const cachedLoans = this.loadFromCache();
            if (cachedLoans) {
                this.state.loans = cachedLoans;
                console.warn('Using stale cache due to API error');
            }
        } finally {
            this.state.isLoading = false;
            this.notifyListeners();
        }
    }

    /**
     * Update cache (write-through cache)
     */
    updateCache(loans) {
        try {
            localStorage.setItem(LOANS_CACHE_KEY, JSON.stringify(loans));
            localStorage.setItem(CACHE_EXPIRY_KEY, Date.now().toString());
        } catch (error) {
            console.warn('Failed to update loans cache:', error);
        }
    }

    /**
     * Load from cache if available and not expired
     */
    loadFromCache() {
        try {
            const cached = localStorage.getItem(LOANS_CACHE_KEY);
            const expiry = localStorage.getItem(CACHE_EXPIRY_KEY);

            if (!cached || !expiry) return null;

            const age = Date.now() - parseInt(expiry, 10);
            if (age > CACHE_TTL) {
                return null; // Cache expired
            }

            return JSON.parse(cached);
        } catch {
            return null;
        }
    }

    /**
     * Get current state with calculated statuses
     */
    getState() {
        const loansWithStatus = this.state.loans.map(loan => ({
            ...loan,
            schedule: calculateScheduleStatus(loan)
        }));

        return {
            ...this.state,
            loans: loansWithStatus
        };
    }

    notifyListeners() {
        this.listeners.forEach(l => l(this.state));
    }

    subscribe(listener) {
        this.listeners.push(listener);
        return () => {
            this.listeners = this.listeners.filter(l => l !== listener);
        };
    }

    /**
     * Dispatch action - API is source of truth
     * All operations go through API first
     */
    async dispatch(action) {
        switch (action.type) {
            case 'ADD_LOAN':
                await this.addLoan(action.payload);
                break;
            case 'DELETE_LOAN':
                await this.deleteLoan(action.payload);
                break;
            case 'UPDATE_LOAN':
                await this.updateLoan(action.payload);
                break;
            case 'RECORD_PAYMENT':
                await this.recordPayment(action.payload);
                break;
            case 'UPDATE_LOAN_STATUS':
                await this.updateLoanStatus(action.payload);
                break;
            case 'REFRESH':
                await this.loadLoansFromApi();
                break;
        }
    }

    /**
     * Add loan - API first, then update state
     */
    async addLoan(loanData) {
        this.state.isLoading = true;
        this.notifyListeners();

        try {
            const result = await apiRequest('/api/loans', {
                method: 'POST',
                body: JSON.stringify({ loan: loanData })
            });

            // Update state with server response (includes real ID)
            this.state.loans.push(result.loan);
            this.updateCache(this.state.loans);
        } catch (error) {
            console.error('Failed to add loan:', error);
            this.state.syncError = error.message;
            this.notifyListeners();
            throw error;
        } finally {
            this.state.isLoading = false;
            this.notifyListeners();
        }
    }

    /**
     * Delete loan - API first, then update state
     */
    async deleteLoan(loanId) {
        this.state.isLoading = true;
        this.notifyListeners();

        try {
            await apiRequest(`/api/loans/${encodeURIComponent(loanId)}`, {
                method: 'DELETE'
            });

            // Update state
            this.state.loans = this.state.loans.filter(l => l.id !== loanId);
            this.updateCache(this.state.loans);
        } catch (error) {
            console.error('Failed to delete loan:', error);
            this.state.syncError = error.message;
            this.notifyListeners();
            throw error;
        } finally {
            this.state.isLoading = false;
            this.notifyListeners();
        }
    }

    /**
     * Update loan - API first, then update state
     */
    async updateLoan(payload) {
        const { id, ...updates } = payload;
        this.state.isLoading = true;
        this.notifyListeners();

        try {
            const result = await apiRequest(`/api/loans/${encodeURIComponent(id)}`, {
                method: 'PUT',
                body: JSON.stringify({ updates })
            });

            // Update state with server response
            this.state.loans = this.state.loans.map(l =>
                l.id === id ? { ...l, ...result.loan } : l
            );
            this.updateCache(this.state.loans);
        } catch (error) {
            console.error('Failed to update loan:', error);
            this.state.syncError = error.message;
            this.notifyListeners();
            throw error;
        } finally {
            this.state.isLoading = false;
            this.notifyListeners();
        }
    }

    /**
     * Record payment - API first, then update state
     */
    async recordPayment(payload) {
        const { loanId, payment, nextDeadline } = payload;
        this.state.isLoading = true;
        this.notifyListeners();

        try {
            const result = await apiRequest(`/api/loans/${encodeURIComponent(loanId)}`, {
                method: 'PUT',
                body: JSON.stringify({
                    updates: {
                        $push: { paymentsHistory: payment },
                        ...(nextDeadline && { deadlineDate: nextDeadline })
                    }
                })
            });

            // Update state
            this.state.loans = this.state.loans.map(l => {
                if (l.id === loanId) {
                    const newPayments = [...(l.paymentsHistory || []), payment];
                    return {
                        ...l,
                        paymentsHistory: newPayments,
                        ...(nextDeadline && { deadlineDate: nextDeadline })
                    };
                }
                return l;
            });
            this.updateCache(this.state.loans);
        } catch (error) {
            console.error('Failed to record payment:', error);
            this.state.syncError = error.message;
            this.notifyListeners();
            throw error;
        } finally {
            this.state.isLoading = false;
            this.notifyListeners();
        }
    }

    /**
     * Update loan status - API first, then update state
     */
    async updateLoanStatus(payload) {
        const { id, status } = payload;
        this.state.isLoading = true;
        this.notifyListeners();

        try {
            await apiRequest(`/api/loans/${encodeURIComponent(id)}`, {
                method: 'PUT',
                body: JSON.stringify({ updates: { status } })
            });

            // Update state
            this.state.loans = this.state.loans.map(l =>
                l.id === id ? { ...l, status } : l
            );
            this.updateCache(this.state.loans);
        } catch (error) {
            console.error('Failed to update loan status:', error);
            this.state.syncError = error.message;
            this.notifyListeners();
            throw error;
        } finally {
            this.state.isLoading = false;
            this.notifyListeners();
        }
    }

    /**
     * Migrate local loans to API (one-time migration)
     * This should be called only once when user logs in for the first time
     */
    async migrateLocalLoansToApiIfNeeded() {
        if (!this.isAuthenticated()) return { migrated: 0 };

        const legacyKey = 'lender_loans';
        const legacyData = localStorage.getItem(legacyKey);

        if (!legacyData) return { migrated: 0 };

        try {
            // Check if server has data
            const server = await apiRequest('/api/loans', { method: 'GET' });
            if (Array.isArray(server.loans) && server.loans.length > 0) {
                // Server has data, clear legacy
                localStorage.removeItem(legacyKey);
                return { migrated: 0 };
            }

            // Migrate legacy data
            const loans = JSON.parse(legacyData);
            if (!Array.isArray(loans) || loans.length === 0) {
                localStorage.removeItem(legacyKey);
                return { migrated: 0 };
            }

            const result = await apiRequest('/api/loans/import', {
                method: 'POST',
                body: JSON.stringify({ loans })
            });

            // Clear legacy after successful migration
            localStorage.removeItem(legacyKey);

            // Refresh state
            await this.loadLoansFromApi();

            return { migrated: result.imported || loans.length };
        } catch (error) {
            console.error('Migration failed:', error);
            return { migrated: 0, error: error.message };
        }
    }

    setLogoutModal(show) {
        this.state.showLogoutModal = show;
        this.notifyListeners();
    }
}

export const store = new Store();
