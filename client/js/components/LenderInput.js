export class LenderInput extends HTMLElement {
    constructor() {
        super();
        this._isTouched = false;
    }

    static sanitize(value) {
        return DOMPurify.sanitize(value, { ALLOWED_TAGS: [], ALLOWED_ATTR: [] });
    }

    static get observedAttributes() {
        return ['label', 'type', 'placeholder', 'value', 'error-msg', 'required',
            'min', 'minlength', 'id', 'validator', 'error-messages'];
    }

    attributeChangedCallback(name, oldValue, newValue) {
        if (oldValue !== newValue && this.querySelector('input')) {
            if (name === 'value') {
                const input = this.querySelector('input');
                if (input) input.value = LenderInput.sanitize(newValue);
            } else if (name === 'error-msg') {
                const errorSpan = this.querySelector('.error-message');
                if (errorSpan) errorSpan.textContent = LenderInput.sanitize(newValue);
            }
        }
    }

    connectedCallback() {
        this.render();

        const input = this.querySelector('input');
        if (!input) return;

        input.addEventListener('blur', () => {
            this._isTouched = true;
            this.validate();
        });

        input.addEventListener('input', () => {
            if (this._isTouched) {
                this.validate();
            }
        });

        const toggleBtn = this.querySelector('.password-toggle');
        if (toggleBtn) {
            toggleBtn.addEventListener('click', () => {
                const isPassword = input.type === 'password';
                input.type = isPassword ? 'text' : 'password';
                toggleBtn.classList.toggle('show', isPassword);
            });
        }
    }

    get value() {
        const input = this.querySelector('input');
        const rawValue = input ? input.value : '';
        return LenderInput.sanitize(rawValue);
    }

    set value(val) {
        const input = this.querySelector('input');
        if (input) input.value = LenderInput.sanitize(String(val));
    }

    get touched() {
        return this._isTouched;
    }

    resetTouched() {
        this._isTouched = false;
        this.clearError();
    }

    validate() {
        const input = this.querySelector('input');
        const group = this.querySelector('.lender-form-group');

        if (!input) return true;

        const customError = this.runCustomValidation();

        if (customError) {
            this.showError(customError);
            return false;
        }

        if (!input.checkValidity()) {
            const message = input.validationMessage || this.getAttribute('error-msg') || 'Campo inválido';
            this.showError(message);
            return false;
        }

        this.clearError();
        return true;
    }

    runCustomValidation() {
        const value = this.value;
        const validatorStr = this.getAttribute('validator');
        const errorMessagesStr = this.getAttribute('error-messages');

        let validator = {};
        let errorMessages = {};

        try {
            if (validatorStr) validator = JSON.parse(validatorStr);
            if (errorMessagesStr) errorMessages = JSON.parse(errorMessagesStr);
        } catch (e) {
            console.warn('Invalid JSON in validator or error-messages attribute');
            return null;
        }

        if (validator.required && !value.trim()) {
            return errorMessages.required || 'Este campo es requerido';
        }

        if (validator.type === 'number' && value) {
            const numValue = value.replace(/,/g, '').trim();
            if (isNaN(parseFloat(numValue))) {
                return errorMessages.type || 'Ingresa un número válido';
            }

            const num = parseFloat(numValue);

            if (validator.min !== undefined && num < validator.min) {
                return errorMessages.min || `El valor debe ser al menos ${validator.min}`;
            }

            if (validator.max !== undefined && num > validator.max) {
                return errorMessages.max || `El valor no puede exceder ${this.formatNumber(validator.max)}`;
            }

            if (validator.integer === true && !Number.isInteger(num)) {
                return errorMessages.integer || 'El valor debe ser un número entero';
            }
        }

        if (validator.type === 'email' && value) {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(value)) {
                return errorMessages.type || 'Ingresa un correo válido';
            }
        }

        if (validator.type === 'tel' && value) {
            const phoneRegex = /^[\d\s\-\+\(\)]{7,}$/;
            if (!phoneRegex.test(value)) {
                return errorMessages.type || 'Ingresa un teléfono válido';
            }
        }

        if (validator.type === 'password' && value) {
            const hasMinLength = validator.minlength && value.length >= validator.minlength;
            const hasUpperCase = /[A-Z]/.test(value);
            const hasLowerCase = /[a-z]/.test(value);
            const hasNumber = /\d/.test(value);
            const hasSpecialChar = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(value);

            if (!hasMinLength) {
                return errorMessages.minlength || `La contraseña debe tener al menos ${validator.minlength} caracteres.`;
            }
            if (!hasUpperCase) {
                return errorMessages.uppercase || 'La contraseña debe contener al menos una mayúscula.';
            }
            if (!hasLowerCase) {
                return errorMessages.lowercase || 'La contraseña debe contener al menos una minúscula.';
            }
            if (!hasNumber) {
                return errorMessages.number || 'La contraseña debe contener al menos un número.';
            }
            if (!hasSpecialChar) {
                return errorMessages.special || 'La contraseña debe contener al menos un carácter especial (@#$%^&*!).';
            }
        }

        if (validator.match && value) {
            const matchInput = document.getElementById(validator.match);
            if (matchInput && value !== matchInput.value) {
                return errorMessages.match || 'Las contraseñas no coinciden.';
            }
        }

        if (validator.minlength && value.length < validator.minlength) {
            return errorMessages.minlength || `Debe tener al menos ${validator.minlength} caracteres`;
        }

        if (validator.maxlength && value.length > validator.maxlength) {
            return errorMessages.maxlength || `Debe tener como máximo ${validator.maxlength} caracteres`;
        }

        if (validator.pattern && value) {
            const regex = new RegExp(validator.pattern);
            if (!regex.test(value)) {
                return errorMessages.pattern || 'El formato no es válido';
            }
        }

        return null;
    }

    formatNumber(num) {
        return new Intl.NumberFormat('es-CO').format(num);
    }

    showError(message) {
        const group = this.querySelector('.lender-form-group');
        const errorSpan = this.querySelector('.error-message');

        if (group) group.classList.add('error');
        if (errorSpan) errorSpan.textContent = message;
    }

    clearError() {
        const group = this.querySelector('.lender-form-group');
        if (group) group.classList.remove('error');
    }

    setError(msg) {
        this.showError(msg);
    }

    render() {
        const id = this.getAttribute('id') || `input-${Math.random().toString(36).substr(2, 9)}`;
        const label = LenderInput.sanitize(this.getAttribute('label') || '');
        const type = this.getAttribute('type') || 'text';
        const placeholder = LenderInput.sanitize(this.getAttribute('placeholder') || '');
        const curValue = LenderInput.sanitize(this.getAttribute('value') || '');
        const errorMsg = LenderInput.sanitize(this.getAttribute('error-msg') || '');
        const required = this.hasAttribute('required');
        const min = this.getAttribute('min') || '';
        const minlength = this.getAttribute('minlength') || '';

        const passwordToggle = type === 'password' ? `
            <button type="button" class="password-toggle" aria-label="Mostrar contraseña">
                <span class="material-icons icon-show">visibility</span>
                <span class="material-icons icon-hide">visibility_off</span>
            </button>
        ` : '';

        const inputWrapper = passwordToggle ? `<div class="input-wrapper">` : '';
        const inputWrapperClose = passwordToggle ? `</div>` : '';

        this.innerHTML = `
            <div class="lender-form-group">
                <label for="${id}-internal" class="lender-label">${label}</label>
                ${inputWrapper}
                <input 
                    id="${id}-internal"
                    class="lender-input-field${passwordToggle ? ' has-toggle' : ''}"
                    type="${type}" 
                    placeholder="${placeholder}" 
                    value="${curValue}"
                    ${required ? 'required' : ''}
                    ${min ? `min="${min}"` : ''}
                    ${minlength ? `minlength="${minlength}"` : ''}
                >
                ${passwordToggle}
                ${inputWrapperClose}
                <span class="error-message">${errorMsg}</span>
            </div>
        `;
    }
}

customElements.define('lender-input', LenderInput);
