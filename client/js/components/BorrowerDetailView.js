import { store } from '../services/store.js';
import { formatCurrency } from '../utils/calculations.js';
import { NotificationPanel } from './NotificationPanel.js';
import { ReportService } from '../services/ReportService.js';
import { getBorrowerColorIndex } from '../utils/borrowerColors.js';

export class BorrowerDetailView extends HTMLElement {
    constructor() {
        super();
        this.borrowerId = null;
    }

    static get observedAttributes() {
        return ['borrower-id'];
    }

    attributeChangedCallback(name, oldValue, newValue) {
        if (name === 'borrower-id') {
            this.borrowerId = newValue;
            this.render();
        }
    }

    connectedCallback() {
        this.render();
        store.subscribe(() => this.render());
    }

    render() {
        if (!this.borrowerId) return;

        const { loans } = store.getState();
        const loan = loans.find(l => l.id === this.borrowerId);

        if (!loan) {
            this.innerHTML = `<div class="dashboard-wrapper"><h1>Prestatario no encontrado</h1></div>`;
            return;
        }

        const totalPaidCapital = (loan.paymentsHistory || [])
            .reduce((acc, p) => acc + (parseFloat(p.capital) || 0), 0);
        const totalPaidInterest = (loan.paymentsHistory || [])
            .reduce((acc, p) => acc + (parseFloat(p.interest) || 0), 0);
        const currentBalance = loan.amount - totalPaidCapital;
        const remainingPercentage = Math.max(0, (currentBalance / loan.amount) * 100);

        const colorIdx = getBorrowerColorIndex(loan.color);
        const statusLabel = this.getStatusLabel(loan);
        const statusClass = this.getStatusClass(loan);
        const safeBorrowerName = DOMPurify.sanitize(loan.borrowerName || '', { ALLOWED_TAGS: [], ALLOWED_ATTR: [] });
        const safeEmail = DOMPurify.sanitize(loan.email || '', { ALLOWED_TAGS: [], ALLOWED_ATTR: [] });
        const safePhone = DOMPurify.sanitize(loan.phone || '', { ALLOWED_TAGS: [], ALLOWED_ATTR: [] });
        const safeReferenceId = DOMPurify.sanitize(loan.referenceId || loan.id.slice(-6), { ALLOWED_TAGS: [], ALLOWED_ATTR: [] });

        this.innerHTML = `
            <div class="dashboard-wrapper">
                <!-- Header inspirado en el diseño -->
                <header class="profile-header">
                    <div class="profile-main">
                        <button class="btn-icon back-arrow" id="back-to-borrowers">
                            <span class="material-icons">arrow_back</span>
                        </button>
                        <div class="profile-avatar borrower-profile--${colorIdx}">
                            <div class="avatar-img borrower-profile--${colorIdx}">
                                ${safeBorrowerName.charAt(0)}
                            </div>
                            <div class="status-indicator status-indicator--${loan.status === 'active' ? 'active' : 'mora'}"></div>
                        </div>
                        <div class="profile-info">
                            <div class="profile-title">
                                <h1>${safeBorrowerName}</h1>
                                <span class="badge ${statusClass}">${statusLabel}</span>
                            </div>
                            <p class="reference">ID DE PRÉSTAMO: <span class="ref-id">#${safeReferenceId}</span> • Activo desde ${new Date(loan.startDate).toLocaleDateString('es-ES', { month: 'short', year: 'numeric' })}</p>
                        </div>
                    </div>
                    <div class="profile-actions">
                        <button class="btn btn-secondary"><span class="material-icons">email</span> Mensaje</button>
                        <button class="btn btn-primary btn-vivid"><span class="material-icons">flash_on</span> Acción Rápida</button>
                    </div>
                </header>

                <div class="profile-layout">
                    <div class="profile-main-content">
                        <!-- Stats Grid inspirado -->
                        <div class="stats-grid-vivid">
                            <div class="stat-card glass">
                                <div class="stat-header">
                                    <h3>Total Prestado</h3>
                                    <span class="stat-icon">💰</span>
                                </div>
                                <p class="stat-value">${formatCurrency(loan.amount)}</p>
                                <span class="stat-trend positive">↑ 12% sobre inicial</span>
                            </div>
                            <div class="stat-card glass accent-line" style="--accent-color: ${borrowerColor}">
                                <div class="stat-header">
                                    <h3>Interés Acumulado</h3>
                                </div>
                                <p class="stat-value vivid-text" style="color: ${borrowerColor}">${formatCurrency(totalPaidInterest)}</p>
                                <span class="stat-subtext">Tasa Fija del ${loan.interest}%</span>
                            </div>
                            <div class="stat-card glass">
                                <div class="stat-header">
                                    <h3>Restante</h3>
                                </div>
                                <p class="stat-value">${formatCurrency(currentBalance)}</p>
                                <div class="progress-container-vivid">
                                    <div class="progress-bar-vivid borrower-accent--${colorIdx}" style="width: ${100 - remainingPercentage}%"></div>
                                </div>
                            </div>
                        </div>

                        <!-- Historial de Pagos -->
                        <div class="glass card-history">
                            <div class="card-header-vivid">
                                <h3><span class="material-icons">history</span> Historial de Pagos</h3>
                                <button class="btn-text">VER TODO</button>
                            </div>
                            <div class="table-vivid-wrapper">
                                <table class="table-vivid">
                                    <thead>
                                        <tr>
                                            <th>FECHA</th>
                                            <th>DETALLE</th>
                                            <th>MONTO</th>
                                            <th>ESTADO</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        ${(loan.paymentsHistory || []).length === 0 ?
                '<tr><td colspan="4" style="text-align:center; padding: 2rem;">No hay pagos registrados aún.</td></tr>' :
                loan.paymentsHistory.map(p => `
                                                <tr>
                                                    <td>${new Date(p.date).toLocaleDateString('es-ES', { month: 'short', day: 'numeric', year: 'numeric' })}</td>
                                                    <td>Cuota Capital</td>
                                                    <td class="font-bold">${formatCurrency(parseFloat(p.capital) + parseFloat(p.interest))}</td>
                                                    <td><span class="badge-vivid badge-success-vivid">PAGADO</span></td>
                                                </tr>
                                            `).reverse().join('')
            }
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        <!-- Formulario de Registro Rápido -->
                        <div class="glass card-padding" style="margin-top: 2rem;">
                            <h3>Registrar Pago</h3>
                            <form id="payment-form" class="payment-entry-form">
                                <div class="form-grid-4">
                                    <lender-input 
                                        id="pay-capital" 
                                        label="Capital" 
                                        type="text" 
                                        placeholder="0" 
                                        validator='{"type":"number","min":0}'
                                        error-messages='{"type":"Ingresa un número válido","min":"El valor no puede ser negativo."}'>
                                    </lender-input>
                                    <lender-input 
                                        id="pay-interest" 
                                        label="Interés" 
                                        type="text" 
                                        placeholder="0" 
                                        validator='{"type":"number","min":0}'
                                        error-messages='{"type":"Ingresa un número válido","min":"El valor no puede ser negativo."}'>
                                    </lender-input>
                                    <lender-input 
                                        id="pay-date" 
                                        label="Fecha del Pago" 
                                        type="date" 
                                        value="${new Date().toISOString().split('T')[0]}"
                                        validator='{"required":true}'
                                        error-messages='{"required":"La fecha es requerida."}'>
                                    </lender-input>
                                    <lender-input 
                                        id="pay-next-deadline" 
                                        label="Nueva Fecha Límite" 
                                        type="date" 
                                        value="${loan.deadlineDate || ''}">
                                    </lender-input>
                                </div>
                                <button type="submit" class="btn btn-primary btn-block">Confirmar Transacción</button>
                            </form>
                        </div>
                    </div>

                    <!-- Sidebar inspirado -->
                    <aside class="profile-sidebar">
                        <section class="glass sidebar-section">
                            <div class="section-header">
                                <span class="material-icons">person</span>
                                <h3>Detalles Personales</h3>
                            </div>
                            <div class="detail-item">
                                <div class="item-icon">@</div>
                                <div class="item-text">
                                    <p class="label">Correo Electrónico</p>
                                    <p class="value">${safeEmail || 'No registrado'}</p>
                                </div>
                            </div>
                            <div class="detail-item">
                                <div class="item-icon"><span class="material-icons">phone</span></div>
                                <div class="item-text">
                                    <p class="label">Número de Teléfono</p>
                                    <p class="value">${safePhone || 'No registrado'}</p>
                                </div>
                            </div>
                            <div class="detail-item">
                                <div class="item-icon"><span class="material-icons">account_balance_wallet</span></div>
                                <div class="item-text">
                                    <p class="label">Puntaje de Pago</p>
                                    <p class="value accent-green">EXCELENTE</p>
                                </div>
                            </div>
                        </section>

                        <section class="sidebar-section">
                            <h3>ACCIONES DE COMANDO</h3>
                            <div class="command-grid">
                                <div class="command-btn glass" id="edit-profile-btn">
                                    <span class="material-icons">edit</span>
                                    <span>Editar Perfil</span>
                                </div>
                                <div class="command-btn glass" id="status-toggle-btn">
                                    <span class="material-icons">pause_circle</span>
                                    <span>${loan.status === 'mora' ? 'Activar' : 'Poner en Mora'}</span>
                                </div>
                                <div class="command-btn glass" id="finish-loan-btn">
                                    <span class="material-icons">check_circle</span>
                                    <span>Finalizar Crédito</span>
                                </div>
                                <div class="command-btn glass" id="export-history-btn">
                                    <span class="material-icons">file_download</span>
                                    <span>Exportar Historial</span>
                                </div>
                            </div>
                            <button class="btn-danger-vivid">RESTRICCIONES Y ALERTAS</button>
                        </section>
                    </aside>
                </div>
            </div>
        `;

        this.setupEventListeners();
    }

    setupEventListeners() {
        const backBtn = this.querySelector('#back-to-borrowers');
        if (backBtn) {
            backBtn.addEventListener('click', () => {
                window.dispatchEvent(new CustomEvent('view-change', { detail: 'borrowers' }));
            });
        }

        const statusToggle = this.querySelector('#status-toggle-btn');
        if (statusToggle) {
            statusToggle.addEventListener('click', () => {
                const { loans } = store.getState();
                const loan = loans.find(l => l.id === this.borrowerId);
                const nextStatus = loan.status === 'mora' ? 'active' : 'mora';
                store.dispatch({
                    type: 'UPDATE_LOAN_STATUS',
                    payload: { id: this.borrowerId, status: nextStatus }
                });
            });
        }

        const finishBtn = this.querySelector('#finish-loan-btn');
        if (finishBtn) {
            finishBtn.addEventListener('click', () => {
                if (confirm('¿Seguro que deseas marcar este crédito como COMPLETADO?')) {
                    store.dispatch({
                        type: 'UPDATE_LOAN_STATUS',
                        payload: { id: this.borrowerId, status: 'completed' }
                    });
                }
            });
        }

        const paymentForm = this.querySelector('#payment-form');
        if (paymentForm) {
            paymentForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.clearErrors();

                const { loans } = store.getState();
                const loan = loans.find(l => l.id === this.borrowerId);
                if (!loan) return;

                const capitalInput = this.querySelector('#pay-capital');
                const interestInput = this.querySelector('#pay-interest');
                const dateInput = this.querySelector('#pay-date');
                const nextDeadlineInput = this.querySelector('#pay-next-deadline');

                const isCapitalValid = capitalInput.validate();
                const isInterestValid = interestInput.validate();
                const isDateValid = dateInput.validate();

                if (!isCapitalValid || !isInterestValid || !isDateValid) return;

                const capital = parseFloat(capitalInput.value.replace(/,/g, '')) || 0;
                const interest = parseFloat(interestInput.value.replace(/,/g, '')) || 0;
                const date = dateInput.value;
                const nextDeadline = nextDeadlineInput.value;

                if (capital === 0 && interest === 0 && nextDeadline === loan.deadlineDate) return;

                // Dispatch action based on what changed
                if (capital > 0 || interest > 0) {
                    store.dispatch({
                        type: 'RECORD_PAYMENT',
                        payload: {
                            loanId: this.borrowerId,
                            payment: { capital, interest, date },
                            nextDeadline: nextDeadline
                        }
                    });
                } else if (nextDeadline !== loan.deadlineDate) {
                    store.dispatch({
                        type: 'UPDATE_LOAN',
                        payload: { id: this.borrowerId, deadlineDate: nextDeadline }
                    });
                }

                NotificationPanel.show(`Los cambios en ${safeBorrowerName} han sido registrados satisfactoriamente`);

                paymentForm.reset();
                this.querySelector('#pay-date').value = new Date().toISOString().split('T')[0];
            });
        }

        const editProfileBtn = this.querySelector('#edit-profile-btn');
        if (editProfileBtn) {
            editProfileBtn.addEventListener('click', () => {
                window.dispatchEvent(new CustomEvent('view-change', {
                    detail: { view: 'edit-borrower', data: this.borrowerId }
                }));
            });
        }

        const exportBtn = this.querySelector('#export-history-btn');
        if (exportBtn) {
            exportBtn.addEventListener('click', () => {
                const { loans } = store.getState();
                const loan = loans.find(l => l.id === this.borrowerId);
                if (loan) {
                    ReportService.generateBorrowerComprehensiveReport(loan.borrowerName, loans);
                }
            });
        }
    }

    getStatusClass(loan) {
        if (loan.status === 'mora') return 'badge-mora';
        if (loan.status === 'completed') return 'badge-pagado';
        return 'badge-ontrack';
    }

    getStatusLabel(loan) {
        if (loan.status === 'mora') return 'EN MORA';
        if (loan.status === 'completed') return 'PAGADO';
        return 'ON TRACK';
    }

    showError(fieldId) {
        const group = this.querySelector(`#group-${fieldId}`);
        if (group) group.classList.add('error');
    }

    clearErrors() {
        this.querySelectorAll('.form-group').forEach(g => g.classList.remove('error'));
    }
}

customElements.define('borrower-detail-view', BorrowerDetailView);
