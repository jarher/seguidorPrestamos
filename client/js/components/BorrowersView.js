import { store } from '../services/store.js';
import { formatCurrency } from '../utils/calculations.js';
import { getBorrowerColorIndex } from '../utils/borrowerColors.js';
import { sanitize } from '../utils/sanitize.js';

export class BorrowersView extends HTMLElement {
    constructor() {
        super();
        this.innerHTML = `
            <div class="dashboard-wrapper">
                <header class="view-header">
                    <div class="view-header-content">
                        <h1>Gestión de Prestatarios</h1>
                        <p>Lista detallada de clientes y estado de sus obligaciones.</p>
                    </div>
                </header>

                <div class="table-container glass" id="table-wrapper">
                    <table class="lender-table" id="data-table">
                        <thead>
                            <tr>
                                <th>Prestatario</th>
                                <th>Prestado</th>
                                <th>Balance Actual</th>
                                <th>Próximo Pago</th>
                                <th>Estado</th>
                                <th>Acciones</th>
                            </tr>
                        </thead>
                        <tbody id="borrowers-list">
                            <!-- Se llenará dinámicamente -->
                        </tbody>
                    </table>
                    <div id="empty-state" class="empty-state-hidden">
                        <div class="empty-state-container">
                            <span class="empty-state-icon">👥</span>
                            <h3 class="empty-state-title">Aún no hay prestatarios</h3>
                            <p class="empty-state-msg">"El éxito financiero comienza con el primer préstamo registrado. ¡Empieza hoy mismo a construir tu cartera!"</p>
                            <button class="btn btn-primary empty-add-btn" id="empty-add-btn">Registrar Primer Cliente</button>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    connectedCallback() {
        this.renderBorrowers();
        store.subscribe(() => this.renderBorrowers());
    }

    renderBorrowers() {
        const { loans } = store.getState();
        const tbody = this.querySelector('#borrowers-list');
        const emptyState = this.querySelector('#empty-state');

        if (loans.length === 0) {
            tbody.innerHTML = '';
            emptyState.classList.remove('empty-state-hidden');
            this.querySelector('#data-table').classList.add('data-table-hidden');

            // Add listener to empty state button
            const addBtn = this.querySelector('#empty-add-btn');
            if (addBtn) {
                addBtn.onclick = () => window.dispatchEvent(new CustomEvent('view-change', { detail: 'new-loan' }));
            }
            return;
        }

        emptyState.classList.add('empty-state-hidden');
        this.querySelector('#data-table').classList.remove('data-table-hidden');
        tbody.innerHTML = loans.map(loan => {
            const totalPaidCapital = (loan.paymentsHistory || [])
                .reduce((acc, p) => acc + (parseFloat(p.capital) || 0), 0);

            const pendingPrincipal = loan.amount - totalPaidCapital;

            const schedule = loan.schedule || [];
            const nextPayment = schedule.find(p => p.status !== 'pagada');
            const statusClass = this.getStatusClass(loan);
            const statusLabel = this.getStatusLabel(loan);
            const safeBorrowerName = sanitize(loan.borrowerName || '');
            const safeLoanId = sanitize(loan.id || '');
            const colorIdx = getBorrowerColorIndex(loan.color);

            return `
                <tr>
                    <td data-label="Prestatario">
                        <div class="borrower-info">
                            <div class="avatar-sm borrower-avatar--${colorIdx}">${safeBorrowerName.charAt(0)}</div>
                            <span>${safeBorrowerName}</span>
                        </div>
                    </td>
                    <td data-label="Prestado">${formatCurrency(store.convertForDisplay(loan.amount, store.getCurrency()), store.getDisplayCurrency())}</td>
                    <td data-label="Balance Actual" class="font-bold">${formatCurrency(store.convertForDisplay(pendingPrincipal, store.getCurrency()), store.getDisplayCurrency())}</td>
                    <td data-label="Próximo Pago">${nextPayment ? nextPayment.date : 'N/A'}</td>
                    <td data-label="Estado"><span class="badge ${statusClass}">${statusLabel}</span></td>
                    <td data-label="Acciones">
                        <button class="btn-icon view-details-btn" data-id="${safeLoanId}">
                            <span class="material-icons">visibility</span>
                        </button>
                    </td>
                </tr>
            `;
        }).join('');

        // Add event listeners to view buttons
        this.querySelectorAll('.view-details-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const id = btn.getAttribute('data-id');
                window.dispatchEvent(new CustomEvent('view-change', {
                    detail: { view: 'borrower-detail', data: id }
                }));
            });
        });
    }

    getStatusClass(loan) {
        if (loan.status === 'mora') return 'badge-danger';
        if (loan.status === 'completed') return 'badge-success';

        const today = new Date().toISOString().split('T')[0];
        const hasLatePayment = (loan.schedule || []).some(p => !p.paid && p.date < today);
        if (hasLatePayment) return 'badge-danger';
        return 'badge-warning';
    }

    getStatusLabel(loan) {
        if (loan.status === 'mora') return 'MORA';
        if (loan.status === 'completed') return 'PAGADO';

        const today = new Date().toISOString().split('T')[0];
        const hasLatePayment = (loan.schedule || []).some(p => !p.paid && p.date < today);
        if (hasLatePayment) return 'MORA';
        return 'ACTIVO';
    }
}

customElements.define('borrowers-view', BorrowersView);
