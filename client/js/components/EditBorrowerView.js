import { store } from '../services/store.js';

export class EditBorrowerView extends HTMLElement {
    constructor() {
        super();
        this.loanId = null;
    }

    static get observedAttributes() {
        return ['borrower-id'];
    }

    attributeChangedCallback(name, oldValue, newValue) {
        if (name === 'borrower-id') {
            this.loanId = newValue;
            this.render();
        }
    }

    connectedCallback() {
        this.render();
    }

    render() {
        if (!this.loanId) return;
        const { loans } = store.getState();
        const loan = loans.find(l => l.id === this.loanId);
        if (!loan) {
            this.innerHTML = `<div class="dashboard-wrapper"><h1>Prestatario no encontrado</h1></div>`;
            return;
        }

        const safeBorrowerName = DOMPurify.sanitize(loan.borrowerName || '', { ALLOWED_TAGS: [], ALLOWED_ATTR: [] });
        const safeEmail = DOMPurify.sanitize(loan.email || '', { ALLOWED_TAGS: [], ALLOWED_ATTR: [] });
        const safePhone = DOMPurify.sanitize(loan.phone || '', { ALLOWED_TAGS: [], ALLOWED_ATTR: [] });

        this.innerHTML = `
            <div class="dashboard-wrapper">
                <header class="view-header">
                    <div class="view-header-content">
                        <div class="edit-borrower-header-row">
                            <button class="btn-icon" id="back-to-detail">
                                <span class="material-icons">arrow_back</span>
                            </button>
                            <h1>Editar Perfil de Prestatario</h1>
                        </div>
                        <p>Modifica la información personal de ${safeBorrowerName}.</p>
                    </div>
                </header>

                <div class="form-container glass">
                    <form id="edit-borrower-form">
                        <div class="form-section">
                            <h3>Información Personal</h3>
                            <lender-input 
                                id="edit-name" 
                                label="Nombre del Prestatario" 
                                value="${safeBorrowerName}" 
                                validator='{"required":true,"minlength":3}'
                                error-messages='{"required":"El nombre es requerido","minlength":"El nombre debe tener al menos 3 caracteres."}'>
                            </lender-input>
                            <div class="form-grid">
                                <lender-input 
                                    id="edit-email" 
                                    type="email" 
                                    label="Correo Electrónico" 
                                    value="${safeEmail}" 
                                    placeholder="correo@ejemplo.com"
                                    validator='{"type":"email"}'
                                    error-messages='{"type":"Ingresa un correo válido."}'>
                                </lender-input>
                                <lender-input 
                                    id="edit-phone" 
                                    type="tel" 
                                    label="Número de Teléfono" 
                                    value="${safePhone}" 
                                    placeholder="+57..."
                                    validator='{"type":"tel"}'
                                    error-messages='{"type":"Ingresa un teléfono válido."}'>
                                </lender-input>
                            </div>
                        </div>

                        <div class="form-actions">
                            <button type="button" class="btn btn-secondary" id="cancel-edit">Cancelar</button>
                            <button type="submit" class="btn btn-primary">Guardar Cambios</button>
                        </div>
                    </form>
                </div>
            </div>
        `;

        this.setupEventListeners();
    }

    setupEventListeners() {
        const backBtn = this.querySelector('#back-to-detail');
        const cancelBtn = this.querySelector('#cancel-edit');
        const form = this.querySelector('#edit-borrower-form');

        const goBack = () => {
            window.dispatchEvent(new CustomEvent('view-change', {
                detail: { view: 'borrower-detail', data: this.loanId }
            }));
        };

        backBtn.addEventListener('click', goBack);
        cancelBtn.addEventListener('click', goBack);

        form.addEventListener('submit', (e) => {
            e.preventDefault();

            const nameInput = this.querySelector('#edit-name');
            const emailInput = this.querySelector('#edit-email');
            const phoneInput = this.querySelector('#edit-phone');

            const isNameValid = nameInput.validate();
            const isEmailValid = emailInput.validate();
            const isPhoneValid = phoneInput.validate();

            if (!isNameValid || !isEmailValid || !isPhoneValid) {
                import('./NotificationPanel.js').then(({ NotificationPanel }) => {
                    NotificationPanel.show('Por favor corrige los campos marcados en rojo.');
                });
                return;
            }

            const updatedData = {
                id: this.loanId,
                borrowerName: nameInput.value,
                email: emailInput.value,
                phone: phoneInput.value
            };

            store.dispatch({ type: 'UPDATE_LOAN', payload: updatedData });

            import('./NotificationPanel.js').then(({ NotificationPanel }) => {
                NotificationPanel.show('Perfil actualizado con éxito');
            });

            goBack();
        });
    }
}

customElements.define('edit-borrower-view', EditBorrowerView);
