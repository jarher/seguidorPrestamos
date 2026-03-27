import { store } from '../services/store.js';
import { formatCurrency } from '../utils/calculations.js';
import { ReportService } from '../services/ReportService.js';

export class LoansListView extends HTMLElement {
    constructor() {
        super();
        this.currentFilter = 'all'; // all, active, mora, completed
    }

    connectedCallback() {
        this.render();
        store.subscribe(() => this.render());
    }

    render() {
        const { loans } = store.getState();

        // Calculations for header
        const totalInterestEarned = loans.reduce((acc, loan) => {
            return acc + (loan.paymentsHistory || []).reduce((pAcc, p) => pAcc + (parseFloat(p.interest) || 0), 0);
        }, 0);

        const activeCapital = loans
            .filter(l => l.status !== 'completed')
            .reduce((acc, loan) => {
                const paidCapital = (loan.paymentsHistory || []).reduce((pAcc, p) => pAcc + (parseFloat(p.capital) || 0), 0);
                return acc + (loan.amount - paidCapital);
            }, 0);

        const filteredLoans = loans.filter(loan => {
            if (this.currentFilter === 'all') return true;
            return loan.status === this.currentFilter;
        });

        this.innerHTML = `
            <div class="dashboard-wrapper">
                <header class="view-header">
                    <div class="view-header-content">
                        <h1>Gestión de Cartera</h1>
                        <p>Seguimiento global de préstamos y rendimientos históricos.</p>
                    </div>
                    <div class="dashboard-actions">
                        <button class="btn btn-secondary" id="export-portfolio-btn">
                            <span class="material-icons">file_download</span> Generar Reporte
                        </button>
                    </div>
                </header>

                <!-- Widgets de Rendimiento -->
                <div class="stats-grid-vivid" style="grid-template-columns: repeat(3, 1fr);">
                    <div class="stat-card glass accent-line" style="--accent-color: #10B981">
                        <div class="stat-header"><h3>Intereses Ganados</h3></div>
                        <p class="stat-value vivid-text" style="color: #10B981">${formatCurrency(totalInterestEarned)}</p>
                        <span class="stat-subtext">Total histórico cobrado</span>
                    </div>
                    <div class="stat-card glass accent-line" style="--accent-color: #06B6D4">
                        <div class="stat-header"><h3>Capital en Juego</h3></div>
                        <p class="stat-value vivid-text" style="color: #06B6D4">${formatCurrency(activeCapital)}</p>
                        <span class="stat-subtext">Activo corriente</span>
                    </div>
                    <div class="stat-card glass accent-line" style="--accent-color: #F59E0B">
                        <div class="stat-header"><h3>Total Préstamos</h3></div>
                        <p class="stat-value vivid-text" style="color: #F59E0B">${loans.length}</p>
                        <span class="stat-subtext">Registros en el sistema</span>
                    </div>
                </div>

                <!-- Filtros de Estado -->
                <div class="filter-tabs glass" style="display:flex; gap:1rem; padding:0.5rem; border-radius:12px; margin-bottom:1.5rem;">
                    <button class="filter-btn ${this.currentFilter === 'all' ? 'active' : ''}" data-filter="all">Todos</button>
                    <button class="filter-btn ${this.currentFilter === 'active' ? 'active' : ''}" data-filter="active">Activos</button>
                    <button class="filter-btn ${this.currentFilter === 'mora' ? 'active' : ''}" data-filter="mora">En Mora</button>
                    <button class="filter-btn ${this.currentFilter === 'completed' ? 'active' : ''}" data-filter="completed">Finalizados</button>
                </div>

                <div class="table-container glass">
                    <table class="lender-table">
                        <thead>
                            <tr>
                                <th>Ref / Prestatario</th>
                                <th>Capital</th>
                                <th>Int. Pagados</th>
                                <th>Esquema</th>
                                <th>Estado</th>
                                <th>Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${filteredLoans.length === 0 ?
                `<tr><td colspan="6" style="text-align:center; padding: 3rem; color: var(--text-muted)">No se encontraron préstamos en esta categoría.</td></tr>` :
                filteredLoans.map(loan => {
                    const loanInterest = (loan.paymentsHistory || []).reduce((acc, p) => acc + (parseFloat(p.interest) || 0), 0);
                    const statusClass = this.getStatusClass(loan);
                    const statusLabel = this.getStatusLabel(loan);
                    const safeBorrowerName = DOMPurify.sanitize(loan.borrowerName || '', { ALLOWED_TAGS: [], ALLOWED_ATTR: [] });
                    const safeReferenceId = DOMPurify.sanitize(loan.referenceId || '', { ALLOWED_TAGS: [], ALLOWED_ATTR: [] });
                    const safeLoanId = DOMPurify.sanitize(loan.id || '', { ALLOWED_TAGS: [], ALLOWED_ATTR: [] });

                    return `
                                        <tr>
                                            <td data-label="Ref / Prestatario">
                                                <div style="display:flex; flex-direction:column">
                                                    <span style="color:var(--primary); font-size:0.75rem; font-weight:700">#${safeReferenceId || 'N/A'}</span>
                                                    <span style="font-weight:600">${safeBorrowerName}</span>
                                                </div>
                                            </td>
                                            <td data-label="Capital">${formatCurrency(loan.amount)}</td>
                                            <td data-label="Int. Pagados" class="accent-green">${formatCurrency(loanInterest)}</td>
                                            <td data-label="Esquema" style="font-size:0.8rem">${loan.scheme === 'fixed' ? 'CUOTA FIJA' : 'CUOTA DECRECIENTE'}</td>
                                            <td data-label="Estado"><span class="badge ${statusClass}">${statusLabel}</span></td>
                                            <td data-label="Acciones">
                                                <button class="btn-icon view-details-btn" data-id="${safeLoanId}">
                                                    <span class="material-icons">visibility</span>
                                                </button>
                                            </td>
                                        </tr>
                                    `;
                }).join('')
            }
                        </tbody>
                    </table>
                </div>
            </div>
        `;

        this.setupEventListeners();
    }

    setupEventListeners() {
        // Filter tabs
        this.querySelectorAll('.filter-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                this.currentFilter = btn.getAttribute('data-filter');
                this.render();
            });
        });

        // Detail buttons
        this.querySelectorAll('.view-details-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const id = btn.getAttribute('data-id');
                window.dispatchEvent(new CustomEvent('view-change', {
                    detail: { view: 'borrower-detail', data: id }
                }));
            });
        });

        // Export button
        const exportBtn = this.querySelector('#export-portfolio-btn');
        if (exportBtn) {
            exportBtn.addEventListener('click', () => {
                const { loans } = store.getState();
                ReportService.generatePortfolioReport(loans);
            });
        }
    }

    getStatusClass(loan) {
        if (loan.status === 'mora') return 'badge-danger';
        if (loan.status === 'completed') return 'badge-success';
        return 'badge-warning';
    }

    getStatusLabel(loan) {
        if (loan.status === 'mora') return 'EN MORA';
        if (loan.status === 'completed') return 'PAGADO';
        return 'ACTIVO';
    }
}

customElements.define('loans-list-view', LoansListView);
