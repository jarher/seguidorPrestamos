import { store } from '../services/store.js';
import { logout, getSession } from '../services/authClient.js';
import { sanitize } from '../utils/sanitize.js';

export class LenderNav extends HTMLElement {
    constructor() {
        super();
        this.render();
    }

    connectedCallback() {
        this.unsubscribe = store.subscribe(() => this.render());
        this.render();
    }

    render() {
        const session = store.getState().session || getSession();
        const isAuthed = Boolean(session?.token);
        const rawUserName = session?.user?.fullName || 'Usuario';
        const userName = sanitize(rawUserName);
        const initials = userName.split(' ').filter(Boolean).slice(0, 2).map(p => p[0].toUpperCase()).join('') || 'U';
        const currentCurrency = store.getCurrency();
        const currentDisplayCurrency = store.getDisplayCurrency();

        this.innerHTML = `
            <nav class="sidebar glass">
                <div class="logo">
                    <img src="favicon.png" alt="Lender's HQ logo">
                    <span class="logo-text">Lender's HQ</span>
                </div>
                <ul class="nav-links" style="${isAuthed ? '' : 'display:none'}">
                    <li class="active" data-view="dashboard">
                        <span class="icon">📊</span>
                        <span class="text">Dashboard</span>
                    </li>
                    <li data-view="borrowers">
                        <span class="icon">👥</span>
                        <span class="text">Prestatarios</span>
                    </li>
                    <li data-view="loans">
                        <span class="icon">💸</span>
                        <span class="text">Préstamos</span>
                    </li>
                    <li data-view="new-loan">
                        <span class="icon">➕</span>
                        <span class="text">Nuevo Préstamo</span>
                    </li>
                    <li data-no-nav>
                        <span class="nav-label">Seleccionar divisa</span>
                        <select id="currency-select" class="glass-select glass-select-sm" title="Tipo de divisa">
                            <option value="COP" ${currentCurrency === 'COP' ? 'selected' : ''}>$ COP</option>
                            <option value="USD" ${currentCurrency === 'USD' ? 'selected' : ''}>$ USD</option>
                            <option value="EUR" ${currentCurrency === 'EUR' ? 'selected' : ''}>€ EUR</option>
                        </select>
                    </li>
                    <li data-no-nav class="display-currency-block">
                        <span class="nav-label">Equivalente de ${currentCurrency}</span>
                        <select id="display-currency-select" class="glass-select glass-select-sm" title="Divisa de visualización">
                            <option value="COP" ${currentDisplayCurrency === 'COP' ? 'selected' : ''}>COP - Peso</option>
                            <option value="USD" ${currentDisplayCurrency === 'USD' ? 'selected' : ''}>USD - Dólar</option>
                            <option value="EUR" ${currentDisplayCurrency === 'EUR' ? 'selected' : ''}>EUR - Euro</option>
                        </select>
                    </li>
                </ul>
                <div class="user-profile">
                    <div class="user-info-section">
                        <div class="avatar">${initials}</div>
                        <div class="user-info">
                            <p class="name">${isAuthed ? userName : 'Invitado'}</p>
                            <p class="role">${isAuthed ? 'Sesión activa' : 'Inicia sesión'}</p>
                        </div>
                    </div>
                    <div class="user-profile__actions">
                        <button id="theme-toggle" class="btn-theme-toggle" title="Cambiar tema">
                            <span class="material-icons">dark_mode</span>
                        </button>
                        ${isAuthed ? `<button id="logout-btn" class="btn-theme-toggle" title="Cerrar sesión"><span class="material-icons">logout</span></button>` : ''}
                    </div>
                </div>
            </nav>
        `;

        this.querySelectorAll('.nav-links li:not([data-no-nav])').forEach(li => {
            li.addEventListener('click', () => {
                this.querySelectorAll('.nav-links li').forEach(el => el.classList.remove('active'));
                li.classList.add('active');
                const view = li.getAttribute('data-view');
                window.dispatchEvent(new CustomEvent('view-change', { detail: view }));
            });
        });

        const themeToggle = this.querySelector('#theme-toggle');
        const updateThemeIcon = () => {
            const isLight = document.body.classList.contains('light-theme');
            themeToggle.querySelector('.material-icons').textContent = isLight ? 'light_mode' : 'dark_mode';
        };

        // Initialize icon
        updateThemeIcon();

        themeToggle.addEventListener('click', () => {
            document.body.classList.toggle('light-theme');
            updateThemeIcon();

            // Persist theme
            const theme = document.body.classList.contains('light-theme') ? 'light' : 'dark';
            localStorage.setItem('lender_theme', theme);
        });

        // Currency selector
        const currencySelect = this.querySelector('#currency-select');
        if (currencySelect) {
            currencySelect.addEventListener('change', () => {
                store.setCurrency(currencySelect.value);
            });
        }

        // Display currency selector
        const displayCurrencySelect = this.querySelector('#display-currency-select');
        if (displayCurrencySelect) {
            displayCurrencySelect.addEventListener('change', async () => {
                const value = displayCurrencySelect.value;
                store.setDisplayCurrency(value);
                await store.fetchRatesIfNeeded();
            });
        }

        // Load persisted theme
        if (localStorage.getItem('lender_theme') === 'light') {
            document.body.classList.add('light-theme');
            updateThemeIcon();
        }

        const logoutBtn = this.querySelector('#logout-btn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => {
                store.setLogoutModal(true);
                window.dispatchEvent(new CustomEvent('open-modal', { detail: 'logout' }));
            });
        }

        // Listen for external view changes to sync active state
        this._viewChangeListener = (e) => {
            const view = typeof e.detail === 'string' ? e.detail : e.detail.view;
            this._setActiveLink(view);
        };
        window.addEventListener('view-change', this._viewChangeListener);
    }

    _setActiveLink(view) {
        this.querySelectorAll('.nav-links li').forEach(li => {
            li.classList.toggle('active', li.getAttribute('data-view') === view);
        });
    }

    disconnectedCallback() {
        if (this.unsubscribe) this.unsubscribe();
        if (this._viewChangeListener) {
            window.removeEventListener('view-change', this._viewChangeListener);
        }
    }
}

customElements.define('lender-nav', LenderNav);
