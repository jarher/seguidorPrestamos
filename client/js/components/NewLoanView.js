import { store } from '../services/store.js';
import { calculateLoanSchedule, calculateFlatLoanSchedule } from '../utils/calculations.js';
import { NotificationPanel } from './NotificationPanel.js';

export class NewLoanView extends HTMLElement {
    constructor() {
        super();
        this.innerHTML = `
            <div class="dashboard-wrapper">
                <header class="view-header">
                    <div class="view-header-content">
                        <h1>Registrar Nuevo Préstamo</h1>
                        <p>Ingresa los detalles del prestatario y las condiciones del crédito.</p>
                    </div>
                </header>

                <div class="form-container glass">
                    <form id="new-loan-form">
                        <div class="form-section">
                            <h3>Información del Prestatario</h3>
                            <lender-input 
                                id="borrower-name" 
                                label="Nombre Completo" 
                                placeholder="Ej. Juan Pérez" 
                                validator='{"required":true,"minlength":3}'
                                error-messages='{"required":"El nombre es requerido","minlength":"El nombre debe tener al menos 3 caracteres."}'>
                            </lender-input>
                            
                            <div class="form-grid">
                                <lender-input 
                                    id="borrower-email" 
                                    type="email" 
                                    label="Correo Electrónico" 
                                    placeholder="perez@ejemplo.com"
                                    validator='{"type":"email"}'
                                    error-messages='{"type":"Ingresa un correo válido."}'>
                                </lender-input>
                                <lender-input 
                                    id="borrower-phone" 
                                    type="tel" 
                                    label="Número de Teléfono" 
                                    placeholder="+57 300..."
                                    validator='{"type":"tel"}'
                                    error-messages='{"type":"Ingresa un teléfono válido."}'>
                                </lender-input>
                            </div>
                        </div>

                        <div class="form-section">
                            <h3>Condiciones del Préstamo</h3>
                            <div class="form-grid">
                                <lender-input 
                                    id="loan-amount" 
                                    type="text"
                                    label="Monto a Prestar" 
                                    placeholder="0" 
                                    data-currency=""
                                    validator='{"required":true,"type":"number","min":1}'
                                    error-messages='{"required":"El monto es requerido","type":"Ingresa un número válido","min":"El monto debe ser mayor a 0."}'>
                                </lender-input>
                                <lender-input 
                                    id="interest-rate" 
                                    type="text"
                                    label="Tasa de Interés (%)" 
                                    placeholder="3" 
                                    validator='{"type":"number","min":0}'
                                    error-messages='{"type":"Ingresa un número válido","min":"La tasa no puede ser negativa."}'>
                                </lender-input>
                            </div>

                            <div class="form-grid">
                                <lender-input 
                                    id="start-date" 
                                    type="date" 
                                    label="Fecha del Préstamo" 
                                    validator='{"required":true}'
                                    error-messages='{"required":"La fecha de inicio es requerida."}'>
                                </lender-input>
                                <lender-input 
                                    id="deadline-date" 
                                    type="date" 
                                    label="Fecha Límite de Pago"
                                    error-msg="La fecha límite debe ser posterior a la de inicio.">
                                </lender-input>
                            </div>
                        </div>

                        <div class="form-section">
                            <h3>Esquema de Préstamo</h3>
                            <div class="form-group" id="group-loan-scheme">
                                <label for="loan-scheme">Tipo de Esquema</label>
                                <select id="loan-scheme" class="glass-select">
                                    <option value="decreasing" selected>Cuota Decreciente</option>
                                    <option value="fixed">Cuota Fija</option>
                                    <option value="interest-free">Sin Intereses</option>
                                </select>
                                <span class="error-message">Selecciona un esquema válido.</span>
                            </div>
                        </div>

                        <div class="form-actions">
                            <button type="button" class="btn btn-secondary" id="back-btn">Cancelar</button>
                            <button type="submit" class="btn btn-primary">Registrar Préstamo</button>
                        </div>
                    </form>
                </div>
            </div>
        `;
    }

    connectedCallback() {
        if (!store.isCurrencySelected()) {
            NotificationPanel.show('No has seleccionado divisa. Se usará Peso Colombiano (COP). Puedes cambiarlo en el menú lateral.');
        }

        this.querySelector('#new-loan-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleFormSubmit();
        });

        this.querySelector('#back-btn').addEventListener('click', () => {
            window.dispatchEvent(new CustomEvent('view-change', { detail: 'dashboard' }));
        });
    }

    handleFormSubmit() {
        const nameInput = this.querySelector('#borrower-name');
        const amountInput = this.querySelector('#loan-amount');
        const interestInput = this.querySelector('#interest-rate');
        const startDateInput = this.querySelector('#start-date');
        const deadlineDateInput = this.querySelector('#deadline-date');

        const isNameValid = nameInput.validate();
        const isAmountValid = amountInput.validate();
        const isInterestValid = interestInput.validate();
        const isStartDateValid = startDateInput.validate();
        
        let isDeadlineValid = true;
        if (deadlineDateInput.value && new Date(deadlineDateInput.value) <= new Date(startDateInput.value)) {
            deadlineDateInput.setError('La fecha límite debe ser posterior a la de inicio.');
            isDeadlineValid = false;
        }

        if (!isNameValid || !isAmountValid || !isInterestValid || !isStartDateValid || !isDeadlineValid) {
            NotificationPanel.show('Por favor corrige los campos marcados en rojo.');
            return;
        }

        const name = nameInput.value;
        const email = this.querySelector('#borrower-email').value;
        const phone = this.querySelector('#borrower-phone').value;
        const amount = amountInput.numericValue;
        const scheme = this.querySelector('#loan-scheme').value;
        const interest = scheme === 'interest-free' ? 0 : interestInput.numericValue || 0;
        const startDate = startDateInput.value;
        const deadlineDate = deadlineDateInput.value;

        const start = new Date(startDate);
        const end = new Date(deadlineDate);
        const months = (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth());

        const paymentsCount = months > 0 ? months : 1;

        let schedule;
        if (scheme === 'fixed') {
            schedule = calculateFlatLoanSchedule(amount, interest, paymentsCount, startDate);
        } else {
            schedule = calculateLoanSchedule(amount, interest, paymentsCount, startDate);
        }

        const colorPalette = ['#FF6B00', '#A855F7', '#06B6D4', '#10B981', '#F43F5E', '#F59E0B'];
        const randomColor = colorPalette[Math.floor(Math.random() * colorPalette.length)];
        const referenceId = 'L-' + Math.floor(100000 + Math.random() * 900000);

        const newLoan = {
            id: Date.now().toString(),
            referenceId: referenceId,
            color: randomColor,
            borrowerName: name,
            email: email,
            phone: phone,
            amount: amount,
            interest: interest,
            startDate: startDate,
            deadlineDate: deadlineDate,
            scheme: scheme,
            payments: paymentsCount,
            schedule: schedule,
            paymentsHistory: [],
            status: 'active',
            currency: store.getCurrency(),
            createdAt: new Date().toISOString()
        };

        store.dispatch({ type: 'ADD_LOAN', payload: newLoan });

        NotificationPanel.show('Préstamo registrado exitosamente', () => {
            window.dispatchEvent(new CustomEvent('view-change', { detail: 'dashboard' }));
        });
    }
}

customElements.define('new-loan-view', NewLoanView);
